let membroCount = 0;
let isEditMode = false;
let currentProjetoId = null;

function addMembro(membroData = null) {
    const container = document.getElementById("membros-container");

    const membroDiv = document.createElement("div");
    membroDiv.classList.add("border", "p-3", "mb-3", "rounded", 'membro-grupo');
    
    const nomeValue = membroData ? membroData.nome : '';
    const titulosValue = membroData ? membroData.titulos : '';
    const imagePreview = membroData && membroData.image ? 
        `<div class="mt-2">
            <img src="${API_BASE_URL}/uploads/${membroData.image}" 
                 class="img-thumbnail" 
                 style="max-width: 150px; max-height: 150px;">
            <input type="hidden" name="membros[${membroCount}][existingImage]" value="${membroData.image}">
        </div>` : '';

    membroDiv.innerHTML = `
        <div class="mb-3">
          <label class="form-label">Nome do Membro</label>
          <input type="text" class="form-control membro-nome" 
                 name="membros[${membroCount}][nome]" 
                 value="${nomeValue}" 
                 required>
        </div>
        <div class="mb-3">
          <label class="form-label">Títulos</label>
          <input type="text" class="form-control membro-titulos" 
                 name="membros[${membroCount}][titulos]" 
                 value="${titulosValue}"
                 placeholder="Membro, estudante, organizador, parceiro, etc.">
          <small class="form-text text-muted">A função do membro no projeto.</small>
        </div>
        <div class="mb-3">
          <label class="form-label">Foto ${membroData ? '(deixe em branco para manter a atual)' : '(Opcional)'}</label>
          <input type="file" class="form-control membro-image" 
                 name="membros[${membroCount}][image]" 
                 accept="image/*">
          ${imagePreview}
        </div>
        <button type="button" class="btn btn-sm btn-outline-danger" 
                onclick="this.parentElement.remove()">Remover</button>
    `;

    container.appendChild(membroDiv);
    membroCount++;
}

async function loadProjetoData(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/projetos/${id}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Projeto não encontrado');
        }
        
        const projeto = await response.json();
        
        // Preenche os campos do formulário
        document.getElementById('titulo').value = projeto.titulo;
        document.getElementById('data').value = projeto.data;
        document.getElementById('descricao').value = projeto.descricao;
        
        // Marca os checkboxes dos cursos
        const cursos = projeto.cursos.split(',').map(c => c.trim());
        cursos.forEach(curso => {
            const checkbox = document.querySelector(`input[name="cursos"][value="${curso}"]`);
            if (checkbox) checkbox.checked = true;
        });
        
        // Mostra a capa atual
        if (projeto.capa) {
            const capaInput = document.getElementById('capa');
            const capaPreview = document.createElement('div');
            capaPreview.className = 'mt-2';
            capaPreview.innerHTML = `
                <p class="text-muted">Capa atual:</p>
                <img src="${API_BASE_URL}/uploads/${projeto.capa}" 
                     class="img-thumbnail mb-2" 
                     style="max-width: 300px;">
                <p class="text-muted small">Deixe em branco para manter a capa atual</p>
                <input type="hidden" id="existing-capa" value="${projeto.capa}">
            `;
            capaInput.parentElement.appendChild(capaPreview);
            capaInput.removeAttribute('required');
        }
        
        // Adiciona os membros
        if (projeto.membros && projeto.membros.length > 0) {
            projeto.membros.forEach(membro => {
                addMembro(membro);
            });
        }
        
        // Atualiza o título da página e botão
        document.querySelector('h1').textContent = 'Editar Projeto de Extensão';
        document.querySelector('button[type="submit"]').textContent = 'Atualizar Projeto';
        
        return true;
    } catch (error) {
        console.error('Erro ao carregar projeto:', error);
        alert('Erro ao carregar os dados do projeto. Redirecionando...');
        window.location.href = '/client/src/extensao/index.html';
        return false;
    }
}

function submitProjetoForm(event) {
    event.preventDefault();

    const titulo = document.getElementById('titulo').value;
    const data = document.getElementById('data').value;
    const descricao = document.getElementById('descricao').value;

    // CURSOS (checkboxes)
    const cursosSelecionados = [];
    document.querySelectorAll('input[name="cursos"]:checked').forEach((checkbox) => {
        cursosSelecionados.push(checkbox.value);
    });

    // CAPA
    const capaFile = document.getElementById('capa').files[0];
    const existingCapa = document.getElementById('existing-capa')?.value;

    // MEMBROS
    const membrosArray = [];
    const membrosImages = [];

    document.querySelectorAll('.membro-grupo').forEach((membroDiv) => {
        const nome = membroDiv.querySelector('.membro-nome').value;
        const titulos = membroDiv.querySelector('.membro-titulos').value;
        const imageFile = membroDiv.querySelector('.membro-image').files[0];
        const existingImage = membroDiv.querySelector('input[name*="[existingImage]"]')?.value;

        membrosArray.push({ 
            nome, 
            titulos,
            existingImage: existingImage || null
        });
        membrosImages.push(imageFile);
    });

    // FormData
    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('data', data);
    formData.append('descricao', descricao);
    formData.append('cursos', cursosSelecionados.join(','));
    
    if (capaFile) {
        formData.append('capa', capaFile);
    } else if (existingCapa) {
        formData.append('existingCapa', existingCapa);
    }
    
    formData.append('membros', JSON.stringify(membrosArray));
    membrosImages.forEach(img => {
        if (img) {
            formData.append('membroImages', img);
        }
    });

    // Determina URL e método baseado no modo
    const url = isEditMode ? 
        `${API_BASE_URL}/projetos/${currentProjetoId}` : 
        `${API_BASE_URL}/projetos`;
    const method = isEditMode ? 'PUT' : 'POST';

    // Enviar
    fetch(url, {
        method: method,
        credentials: 'include',
        body: formData
    })
        .then(response => {
            if (!response.ok) throw new Error(`Erro ao ${isEditMode ? 'atualizar' : 'enviar'} o projeto`);
            return response.text();
        })
        .then(data => {
            alert(`Projeto ${isEditMode ? 'atualizado' : 'enviado'} com sucesso!`);
            console.log(data);
            window.location.href = '../extensao/index.html';
        })
        .catch(err => {
            console.error(err);
            alert(`Erro ao ${isEditMode ? 'atualizar' : 'enviar'} projeto`);
        });
}

document.addEventListener("DOMContentLoaded", () => {
    // Verifica se está em modo de edição
    const urlParams = new URLSearchParams(window.location.search);
    const projetoId = urlParams.get('id');
    
    if (projetoId) {
        isEditMode = true;
        currentProjetoId = projetoId;
        loadProjetoData(projetoId);
    }

    const form = document.getElementById("project-form");
    form.addEventListener("submit", submitProjetoForm);
});