// Configuração centralizada
const CONFIG = {
    //BASE_URL: 'http://127.0.0.1:5500',
    //API_BASE_URL: '/api',
    API_BASE_URL: 'http://127.0.0.1:3000',
    CLIENT_BASE_URL: window.location.origin,
    SUAP_AUTH_HOST: 'https://suap.ifsul.edu.br',
    SUAP_CLIENT_ID: 'WEDz8v92vLr4WAFBFx4Z4rkUBSTgfD3omm4J89NC',
    SUAP_SCOPE: 'identificacao email'
};

// Manter compatibilidade com código existente
const API_BASE_URL = CONFIG.API_BASE_URL;

// Função para obter a URL de redirect correta
function getRedirectUri() {
    const currentPath = window.location.pathname;
    const basePath = currentPath.substring(0, currentPath.indexOf('/client/'));
    return `${CONFIG.CLIENT_BASE_URL}${basePath}/client/src/extensao/index.html`;
}

// Exportar configurações
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}