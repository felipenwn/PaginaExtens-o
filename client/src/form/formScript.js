let membroCount = 0;

function addMembro() {
    const container = document.getElementById("membros-container");

    const membroDiv = document.createElement("div");
    membroDiv.classList.add("border", "p-3", "mb-3", "rounded", 'membro-grupo');
    membroDiv.innerHTML = `
        <div class="mb-3">
          <label class="form-label">Nome do Membro</label>
          <input type="text" class="form-control membro-nome" name="membros[${membroCount}][nome]" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Títulos</label>
          <input type="text" class="form-control membro-titulos" name="membros[${membroCount}][titulos]" placeholder="Membro, estudande, organizador, parceiro, etc.">
          <small id="membroHelp${membroCount}" class="form-text text-muted">A função do membro no projeto.</small>
        </div>
        <div class="mb-3">
          <label class="form-label">Foto (Opcional)</label>
          <input type="file" class="form-control membro-image" name="membros[${membroCount}][image]" accept="image/*">
        </div>
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.parentElement.remove()">Remover</button>
      `;

    container.appendChild(membroDiv);
    membroCount++;
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

    // MEMBROS
    const membrosArray = [];
    const membrosImages = [];

    document.querySelectorAll('.membro-grupo').forEach((membroDiv) => {
        const nome = membroDiv.querySelector('.membro-nome').value;
        const titulos = membroDiv.querySelector('.membro-titulos').value;
        const imageFile = membroDiv.querySelector('.membro-image').files[0];

        membrosArray.push({ nome, titulos });
        membrosImages.push(imageFile);
    });

    // FormData
    console.log(membrosArray);
    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('data', data);
    formData.append('descricao', descricao);
    formData.append('cursos', cursosSelecionados.join(','));
    formData.append('capa', capaFile);
    formData.append('membros', JSON.stringify(membrosArray));
    membrosImages.forEach(img => {
        formData.append('membroImages', img);
    });

    // Enviar
    fetch('https://localhost:3000/projetos', {
        method: 'POST',
        credentials: 'include',
        body: formData
    })
        .then(response => {
            if (!response.ok) throw new Error('Erro ao enviar o projeto');
            return response.text();
        })
        .then(data => {
            alert('Projeto enviado com sucesso!');
            console.log(data);
            window.location.href = "https://localhost:5500/client/src/extensao/index.html"
        })
        .catch(err => {
            console.error(err);
            alert('Erro ao enviar projeto');
        });
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("project-form");
    form.addEventListener("submit", submitProjetoForm);
  });