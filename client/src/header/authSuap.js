// client/src/header/authSuap.js

// Usando o objeto 'window' para garantir que a variável seja global
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

    window.location.href = loginUrl;
}

function getTokenFromUrl() {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    return params.get('access_token');
}

async function saveToken(token) {
    if (token) {
        await fetch('https://localhost:3000/save-token', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token
            })
        });
        history.replaceState(null, '', window.location.pathname);
    }
}

function removeToken() {
    fetch('https://localhost:3000/remove-token', {
        method: 'POST',
        credentials: 'include'
    })
    .then(res => {
        if (res.ok) {
            console.log('Token removed');
            window.location.reload();
        } else {
            console.error('Failed to remove token');
        }
    })
    .catch(err => {
        console.error('Error removing token:', err);
    });
}

function getUserData() {
    fetch('https://localhost:3000/meus-dados/', {
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (!data || data.error) {
            console.log("Usuário não autenticado ou erro na resposta da API.");
            window.currentUserRole = null; // Garante que a role seja nula se não houver usuário
            return;
        }
        
        // ---- ALTERAÇÃO PRINCIPAL AQUI ----
        // Salva a permissão na variável global 'window'
        window.currentUserRole = data.vinculo.categoria; 
        
        const userName = document.getElementById('user-name');
        const userImage = document.getElementById('user-image');
        
        if (userName && userImage) {
            userName.textContent = data.nome_usual;
            userName.classList.remove('d-none');
            userImage.src = data.url_foto_75x100;
            userImage.parentElement.classList.remove('d-none');
            document.getElementById('actions').classList.remove('d-none');
            document.getElementById('login-btn').classList.add('d-none');
        }
    })
    .catch(err => {
        console.error("Erro ao buscar dados do usuário:", err);
        window.currentUserRole = null; // Limpa a role em caso de erro
    });
}

function redirectVars() {
    redirectToSuapLogin(
        'https://suap.ifsul.edu.br',
        '4709NRzgE2vNxYBgKgZ5xoQGFhMkiVFLhCyWUTuv',
        'https://127.0.0.1:5500/client/src/extensao/',
        'identificacao email'
    );
}

// Lógica de inicialização que roda assim que o script é carregado
(async () => {
    let token = getTokenFromUrl();
    if (token) {
        await saveToken(token);
    }
    // Sempre tenta buscar os dados do usuário, mesmo que não haja token na URL
    // (o token pode já estar no cookie do servidor)
    getUserData();
})();