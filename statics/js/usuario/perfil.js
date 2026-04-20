const API_USER_URL = "http://127.0.0.1:5001/api/users";

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('auth_token');
    const userId = localStorage.getItem('user_id');

    const modal = document.getElementById('modal-perfil');
    const formEditar = document.getElementById('form-editar-perfil');
    const btnAbrirModal = document.getElementById('btn-abrir-modal');
    const btnFecharModal = document.getElementById('btn-fechar-modal');
    const btnCancelar = document.getElementById('btn-cancelar');
    const inputNome = document.getElementById('edit-nome');
    const inputTelefone = document.getElementById('edit-telefone');

    const modalAddr = document.getElementById('modal-endereco');
    const btnNovoAddr = document.getElementById('btn-novo-endereco');
    const formAddr = document.getElementById('form-endereco');

    // Elementos do endereço para busca automática
    const inputCep = document.getElementById('addr-cep');
    const inputRua = document.getElementById('addr-rua');
    const inputBairro = document.getElementById('addr-bairro');
    const inputCidade = document.getElementById('addr-cidade');
    const inputEstado = document.getElementById('addr-estado');

    // Se não houver token ou ID, manda pro login
    if (!token || !userId) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_USER_URL}/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const userData = await response.json();

            // Preenche os campos na tela
            document.getElementById('user-nome').textContent = userData.nome;
            document.getElementById('user-email').textContent = userData.email;
            document.getElementById('user-telefone').textContent = userData.telefone || 'Não informado';
            document.getElementById('user-cpf').textContent = userData.cpf || 'Não informado';

            // Pre-popula os inputs do modal
            inputNome.value = userData.nome;
            inputTelefone.value = userData.telefone || '';

            carregarEnderecos(userId, token);

        } else {
            console.error("Erro ao buscar dados do usuário");
            // Se o token estiver expirado, por exemplo
            localStorage.clear();
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error("Erro de conexão com o User Service:", error);
    }

    // Abrir/Fechar Modal
    btnAbrirModal.addEventListener('click', () => modal.classList.add('active'));

    const fecharModal = () => modal.classList.remove('active');
    btnFecharModal.addEventListener('click', fecharModal);
    btnCancelar.addEventListener('click', fecharModal);

    // Salvar Alterações
    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnSalvar = formEditar.querySelector('.btn-login');
        const originalText = btnSalvar.textContent;

        const payload = {
            nome: inputNome.value,
            telefone: inputTelefone.value
        };

        try {
            btnSalvar.disabled = true;
            btnSalvar.textContent = 'SALVANDO...';

            const response = await fetch(`${API_USER_URL}/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                btnSalvar.textContent = 'SUCESSO!';
                location.reload(); // Recarrega para mostrar os novos dados
            } else {
                alert('Erro ao atualizar dados.');
            }
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            alert('Erro de conexão com o servidor.');
        } finally {
            btnSalvar.disabled = false;
            btnSalvar.textContent = originalText;
        }
    });

    // Gestão de Endereços
    if (btnNovoAddr) btnNovoAddr.onclick = () => modalAddr.classList.add('active');
    document.getElementById('btn-fechar-addr').onclick = () => modalAddr.classList.remove('active');

    // Busca automática de CEP via API ViaCEP
    if (inputCep) {
        inputCep.addEventListener('input', async (e) => {
            // Remove máscara e caracteres não numéricos
            const cep = e.target.value.replace(/\D/g, '');

            if (cep.length === 8) {
                try {
                    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                    const data = await response.json();

                    if (!data.erro) {
                        inputRua.value = data.logradouro;
                        inputBairro.value = data.bairro;
                        inputCidade.value = data.localidade;
                        inputEstado.value = data.uf;

                        // Move o foco para o número automaticamente
                        document.getElementById('addr-numero').focus();
                    } else {
                        alert('CEP não encontrado.');
                    }
                } catch (error) {
                    console.error('Erro ao buscar CEP:', error);
                }
            }
        });
    }

    formAddr.onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            cep: document.getElementById('addr-cep').value,
            rua: document.getElementById('addr-rua').value,
            numero: document.getElementById('addr-numero').value,
            bairro: document.getElementById('addr-bairro').value,
            cidade: document.getElementById('addr-cidade').value,
            estado: document.getElementById('addr-estado').value
        };

        const res = await fetch(`${API_USER_URL}/${userId}/addresses`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            modalAddr.classList.remove('active');
            carregarEnderecos(userId, token);
            formAddr.reset();
        }
    };
});

async function carregarEnderecos(userId, token) {
    const container = document.getElementById('lista-enderecos');
    try {
        const res = await fetch(`${API_USER_URL}/${userId}/addresses`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const addrs = await res.json();

        container.innerHTML = addrs.length === 0 ? '<p class="empty-msg">Nenhum endereço cadastrado.</p>' :
            addrs.map(a => `
                <div class="address-card">
                    <p><strong>${a.rua}, ${a.numero}</strong></p>
                    <p>${a.bairro} - ${a.cidade}/${a.estado}</p>
                    <p>CEP: ${a.cep}</p>
                    <button class="btn-del-addr" onclick="removerEndereco(${a.id})">EXCLUIR</button>
                </div>
            `).join('');
    } catch (e) { console.error(e); }
}

window.removerEndereco = async function (id) {
    const token = localStorage.getItem('auth_token');
    const userId = localStorage.getItem('user_id');

    try {
        const response = await fetch(`${API_USER_URL}/${userId}/addresses/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            // Aguarda a atualização da lista para garantir sincronia
            await carregarEnderecos(userId, token);
        } else {
            const errorData = await response.json();
            console.error("Erro ao excluir endereço:", errorData.message || "Erro desconhecido");
            alert("Não foi possível excluir o endereço. Tente novamente.");
        }
    } catch (error) {
        console.error("Erro de rede ao tentar excluir:", error);
        alert("Erro de conexão com o servidor.");
    }
};