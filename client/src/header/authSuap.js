function redirectToSuapLogin(authHost, clientID, redirectURI, scope) {
    // Ensure parameters are URL-encoded
    const encodedRedirectURI = encodeURIComponent(redirectURI);
    const encodedScope = encodeURIComponent(scope);

    // Construct the login URL securely
    const loginUrl = `${authHost.replace(/\/$/, '')}/o/authorize/` +
        `?response_type=token` +
        `&client_id=${clientID}` +
        `&redirect_uri=${encodedRedirectURI}` +
        `&scope=${encodedScope}` +
        `&grant_type=implicit`;

    // Redirect the browser to the login URL (HTTPS expected)
    window.location.href = loginUrl;
}

function getTokenFromUrl() {
    const hash = window.location.hash; // e.g. #access_token=xyz&token_type=Bearer&expires_in=3600
    const params = new URLSearchParams(hash.substring(1)); // skip the '#'
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

function removeToken(){
    fetch('https://localhost:3000/remove-token', {
    method: 'POST',
    credentials: 'include'
  })
    .then(res => {
      if (res.ok) {
        console.log('Token removed');
        // Optional: reset UI or redirect
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
            console.log("aqui: " + data)
            if(data.nome_usual == undefined)
                return;
            const userName = document.getElementById('user-name');
            const userImage = document.getElementById('user-image');
            userName.textContent = data.nome_usual;
            userName.classList.remove('d-none');
            userImage.src = data.url_foto_75x100;
            userImage.parentElement.classList.remove('d-none');

            document.getElementById('actions').classList.remove('d-none');

            // Hide login button
            document.getElementById('login-btn').classList = 'd-none';
        })

}

function redirectVars() {
    redirectToSuapLogin(
        'https://suap.ifsul.edu.br',  // your authHost, HTTPS enforced
        '4709NRzgE2vNxYBgKgZ5xoQGFhMkiVFLhCyWUTuv',
        'https://127.0.0.1:5500/client/src/extensao/',
        'identificacao email'
    );

}

// On page load or after redirect:
(async () => {
    let token = getTokenFromUrl();
    if (token) {
        await saveToken(token);
        getUserData();
        console.log('Token saved:', token);
    } else {
        try {      
            getUserData();      
        } catch (error) {
            console.error("User not authenticated or error fetching data:", error);
        }
    }
})();
