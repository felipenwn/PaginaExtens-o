// client/src/header/authSuap.js

window.currentUserRole = null; 

function redirectToSuapLogin(authHost, clientID, redirectURI, scope) {
    const encodedRedirectURI = encodeURIComponent(redirectURI);
    const encodedScope = encodeURIComponent(scope);

    const loginUrl = `${authHost.replace(/\/$/, '')}/o/authorize/` +
        `?response_type=token` +
        `&client_id=${clientID}` +
        `&redirect_uri=${encodedRedirectURI}` +
        `&scope=${encodedScope}` +
        `&grant_type=implicit`;

    console.log('Redirecionando para:', loginUrl);
    window.location.href = loginUrl;
}

function getTokenFromUrl() {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token');
    if (token) {
        console.log('Token encontrado na URL:', token.substring(0, 20) + '...');
    } else {
        console.log('Nenhum token encontrado na URL');
    }
    return token;
}

async function saveToken(token) {
    if (token) {
        console.log('Salvando token...');
        try {
            const response = await fetch(`${API_BASE_URL}/save-token`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: token
                })
            });
            
            if (response.ok) {
                console.log('Token salvo com sucesso');
                history.replaceState(null, '', window.location.pathname);
            } else {
                const errorText = await response.text();
                console.error('Erro ao salvar token:', response.status, errorText);
            }
        } catch (error) {
            console.error('Erro na requisição de salvar token:', error);
        }
    }
}

function removeToken() {
    console.log('Removendo token...');
    fetch(`${API_BASE_URL}/remove-token`, {
        method: 'POST',
        credentials: 'include'
    })
    .then(res => {
        if (res.ok) {
            console.log('Token removido com sucesso');
            window.location.reload();
        } else {
            console.error('Falha ao remover token:', res.status);
        }
    })
    .catch(err => {
        console.error('Erro ao remover token:', err);
    });
}

function getUserData() {
    console.log('Buscando dados do usuário...');
    return fetch(`${API_BASE_URL}/meus-dados`, {
        credentials: 'include'
    })
    .then(res => {
        console.log('Status da resposta /meus-dados/:', res.status);
        
        if (!res.ok) {
            // Se não for OK, tenta pegar o texto da resposta para ver o erro
            return res.text().then(text => {
                console.error('Resposta de erro:', text);
                throw new Error(`HTTP ${res.status}: ${text}`);
            });
        }
        
        return res.json();
    })
    .then(data => {
        if (!data || data.error) {
            console.log("Usuário não autenticado ou erro na resposta da API.");
            window.currentUserRole = null; 
            return;
        }
        
        console.log('Dados do usuário recebidos:', data);
        window.currentUserRole = data.vinculo?.categoria || null;
        console.log('Role do usuário:', window.currentUserRole);
        
        const userName = document.getElementById('user-name');
        const userImage = document.getElementById('user-image');
        
        if (userName && userImage) {
            userName.textContent = data.nome_usual;
            userName.classList.remove('d-none');
            userImage.src = data.url_foto_75x100;
            userImage.parentElement.classList.remove('d-none');
            
            const actionsBtn = document.getElementById('actions');
            const loginBtn = document.getElementById('login-btn');
            
            if (actionsBtn) actionsBtn.classList.remove('d-none');
            if (loginBtn) loginBtn.classList.add('d-none');
        }
    })
    .catch(err => {
        console.error("Erro ao buscar dados do usuário:", err);
        window.currentUserRole = null;
        
        // Mostra botão de login se não estiver autenticado
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) loginBtn.classList.remove('d-none');
    });
}

function redirectVars() {
    const correctRedirectUri = 'http://127.0.0.1:3000/PaginaExtens-o/client/src/extensao/index.html';
    console.log('Iniciando login com redirect URI:', correctRedirectUri);
    
    redirectToSuapLogin(
        'https://suap.ifsul.edu.br',
        'aq0Ftd6lhzIulKumRH14a2MrmLBC2hAEFB9GaGPM', 
        correctRedirectUri, 
        'identificacao email'
    );
}

// Inicialização
(async () => {
    console.log('=== Iniciando autenticação ===');
    let token = getTokenFromUrl();
    
    if (token) {
        console.log('Token encontrado na URL, salvando...');
        await saveToken(token);
    } else {
        console.log('Nenhum token na URL');
    }

    await getUserData();
    console.log('=== Autenticação concluída ===');
})();