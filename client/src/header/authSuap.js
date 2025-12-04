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

   
    window.location.href = loginUrl;
}

function getTokenFromUrl() {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token');
    if (token) {
    
    } else {
 
    }
    return token;
}

async function saveToken(token) {
    if (token) {
       
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
 
    fetch(`${API_BASE_URL}/remove-token`, {
        method: 'POST',
        credentials: 'include'
    })
    .then(res => {
        if (res.ok) {
     
            window.location.reload();
        } else {
            console.error('Falha ao remover token:', res.status);
        }
    })
    .catch(err => {
        console.error('Erro ao remover token:', err);
    });
}

async function getUserData() {
    try {
        const res = await fetch(`${API_BASE_URL}/meus-dados`, {
            credentials: 'include'
        });

    if (!res.ok) {
            const errorText = await res.text();
            console.error('❌ Erro na resposta:', res.status, errorText);
            throw new Error(`HTTP ${res.status}: ${errorText}`);
        }
        
        const data = await res.json();
        
        if (!data || data.error) {
            console.log("Usuário não autenticado ou erro na resposta da API.");
            window.currentUserRole = null;
            return;
        }

        // ✅ DETECTAR PERFIL CORRETAMENTE
        const categoria = data.vinculo?.categoria;
        const tipoVinculo = data.tipo_vinculo;

        // Definir role baseado na categoria retornada pelo SUAP
        window.currentUserRole = categoria || tipoVinculo || "Desconhecido";

        console.log('👤 Perfil do usuário:', window.currentUserRole);
        console.log('📋 Tipo de vínculo:', tipoVinculo);

        // ✅ VERIFICAR PERMISSÕES NO SERVIDOR
        const permissaoRes = await fetch('https://localhost:5500/verificar-permissao', {
            credentials: 'include'
        });
        
        const permissao = await permissaoRes.json();

        // Atualizar interface
        const userName = document.getElementById('user-name');
        const userImage = document.getElementById('user-image');
        const actionsDiv = document.getElementById('actions');
        const loginBtn = document.getElementById('login-btn');

        if (userName && userImage) {
            userName.textContent = data.nome_usual;
            userName.classList.remove('d-none');
            userImage.src = data.url_foto_75x100;
            userImage.parentElement.classList.remove('d-none');
            
            // ✅ MOSTRAR BOTÃO "Adicionar Projeto" APENAS SE PERMITIDO
            if (permissao.permitido) {
                actionsDiv.classList.remove('d-none');
            } else {
                actionsDiv.classList.add('d-none');
                console.warn('⚠️ Usuário não tem permissão para adicionar projetos:', permissao.mensagem);
            }
            
            loginBtn.classList.add('d-none');
        }

        // ✅ BLOQUEAR ACESSO ÀS PÁGINAS DE FORMULÁRIO PARA ALUNOS
        const paginasRestritas = ['/form/form.html', '/form/form-editar.html'];
        const paginaAtual = window.location.pathname;
        
        if (paginasRestritas.some(pagina => paginaAtual.includes(pagina))) {
            if (!permissao.permitido) {
                alert(permissao.mensagem || 'Você não tem permissão para acessar esta página.');
                window.location.href = '../extensao/index.html';
            }
        }

    } catch (err) {
        console.error("Erro ao buscar dados do usuário:", err);
        window.currentUserRole = null;
    }
}

function redirectVars() {
    const correctRedirectUri = ['http://127.0.0.1:3000/PaginaExtens-o/client/src/extensao/index.html'];
    
    redirectToSuapLogin(
        'https://suap.ifsul.edu.br',
        'aq0Ftd6lhzIulKumRH14a2MrmLBC2hAEFB9GaGPM', 
        correctRedirectUri, 
        'identificacao email'
    );
}

// Inicialização
(async () => {
    let token = getTokenFromUrl();
    
    if (token) {
     
        await saveToken(token);
    } else {
   
    }

    await getUserData();

})();