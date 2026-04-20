/**
 * GR!TTA - Configurações Globais de API
 */
const BASE_IP = "http://127.0.0.1";

window.CONFIG = {
    API_USER_URL: `${BASE_IP}:5001/api/users`,
    API_FAVORITOS_URL: `${BASE_IP}:5001/api/favoritos`,
    API_ORDER_URL: `${BASE_IP}:5002/api`,
    API_CATALOG_URL: `${BASE_IP}:5003/products`,
    API_AUTH_URL: `${BASE_IP}:5005/api/auth`
};