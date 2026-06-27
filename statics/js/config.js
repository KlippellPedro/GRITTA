/**
 * GR!TTA - Configurações Globais de API
 */
const BASE_IP = "http://127.0.0.1";

window.CONFIG = {
    API_USER_URL: `${BASE_IP}:5001/api/users`,
    API_FAVORITOS_URL: `${BASE_IP}:5001/api/favoritos`,
    API_NOTIF_URL: `${BASE_IP}:5001/api/notificacoes`,
    API_ORDER_URL: `${BASE_IP}:5002/api`,
    API_CATALOG_URL: `${BASE_IP}:5003/products`,
    API_STOREFRONT_URL: `${BASE_IP}:5003/storefront`,
    API_AUTH_URL: `${BASE_IP}:5005/api/auth`,

    // Valor mínimo para frete grátis (usado no mini-cart e textos)
    FRETE_GRATIS: 399.90,

    // Login com Google — cole aqui o Client ID OAuth do Google Cloud Console
    // (mesmo valor deve estar como GOOGLE_CLIENT_ID no .env do auth_service)
    GOOGLE_CLIENT_ID: "88691933102-t7r3e389paq1mp8r09m2tgofgqpdkni2.apps.googleusercontent.com"
};