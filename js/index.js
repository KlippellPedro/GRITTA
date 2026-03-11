// Efeito de encolher o menu ao rolar a página
const mainHeader = document.querySelector('.main');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        mainHeader.style.padding = '10px 40px';
    } else {
        mainHeader.style.padding = '20px 40px';
    }
});