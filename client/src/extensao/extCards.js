
let scheduleData = [];
const rolesPermitidos = ["docente", "estagiario"];

function createSpeakersSection(membros) {
    return membros.map((membro, index) => `
        <div class="carousel-item${index === 0 ? ' active' : ''}">
        <div class="speaker">
            <img src="https://localhost:5500/uploads/${membro.image}" class="speaker-image">
            <div class="speaker-info">
                <h4>${membro.nome}</h4>
                ${membro.titulos ? `
                    <div class="speaker-titles">
                        <p>${membro.titulos}</p>
                    </div> 
                ` : ''}
            </div>
        </div>
        </div>
    `).join('');
}

async function fetchProjetos() {
    const response = await fetch("https://localhost:5500/projetos", {
        method: 'GET',
        credentials: 'include'
    });
    scheduleData = await response.json();
    console.log("Fetched:", scheduleData);
}

function removeProjeto(id) {
    if (confirm('Tem certeza que deseja remover este projeto?')) {
        fetch("https://localhost:5500/projetos/" + id, {
            method: 'DELETE',
            credentials: 'include'
        }).then(response => {
            if (response.ok) {
                console.log("DELETED");
                document.dispatchEvent(new Event('DOMContentLoaded'));
            } else {
                alert("Falha ao remover o projeto.");
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const dayButtons = document.querySelectorAll('.day-button');
    const eventsContainer = document.querySelector('.events-list');
    
    function updateEventsList(courses) {
        let events;
        if (courses.length === 0)
            events = scheduleData;
        else {
            events = scheduleData.filter(data => {
                return courses.some(course =>
                    data.cursos.includes(course.innerHTML.trim())
                );
            });
        }
        if (events && events.length > 0) {
           let cardsHTML = '';
    let modalsHTML = '';
    events.forEach((event, index) => {
        cardsHTML += createEventCard(event, index);
        modalsHTML += createEventModal(event, `projeto-${event.id}`);
    });
    eventsContainer.innerHTML = cardsHTML;
    // Adicione um container para os modais se não existir
    let modalContainer = document.getElementById('modal-container');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'modal-container';
        document.body.appendChild(modalContainer);
    }
    modalContainer.innerHTML = modalsHTML;
} else {
    eventsContainer.innerHTML = '<p>Nenhum projeto encontrado.</p>';
}
    }

    function createEventCard(event, index, day) {
        const uniqueId = `projeto-${event.id}`;
        return `
        <div class="card event-card d-flex flex-row custom-card">
            <img class="card-img custom-card-img" src="https://localhost:5500/uploads/${event.capa}";>
            <div class="card-body">
                <h3 class="event-title">${event.titulo}</h3>
                <div class="event-date">
                    <i class="bi bi-calendar-check desc-icon"></i>
                    <span>${event.data}</span>
                </div>
                <div class="event-courses d-flex flex-row">
                    <div class="desc-icon" title="Cursos relacionados"><i class="bi bi-book-half"></i></div>
                    <div><span> ${event.cursos}</span></div>
                </div>
                ${event.membros && event.membros.length > 0 ? `
                    <div id="speaker${index}" class="speakers-container carousel slide" data-ride="carousel">
                        <div class="carousel-inner">
                            ${createSpeakersSection(event.membros)}
                        </div>
                        ${event.membros.length > 1 ? `
                            <button class="carousel-control-prev custom-crsl-btn left" type="button" data-bs-target="#speaker${index}" data-bs-slide="prev">
                                <i class="bi bi-caret-left-fill"></i>
                                <span class="visually-hidden">Previous</span>
                            </button>
                            <button class="carousel-control-next custom-crsl-btn" type="button" data-bs-target="#speaker${index}" data-bs-slide="next">
                                <i class="bi bi-caret-right-fill"></i>
                                <span class="visually-hidden">Next</span>
                            </button> ` : ''}
                    </div>
                ` : ''}
                <button type="button" class="btn btn-primary mt-2" data-bs-toggle="modal" data-bs-target="#modal-${uniqueId}">
                    Saiba mais
                </button>
                
            </div>
            ${rolesPermitidos.includes(window.currentUserRole) ?
                `<button class="btn btn-danger btn-x" onclick="removeProjeto(${event.id})">X</button>` :
                ''
            }
        </div>
    `;
    }
    function createEventModal(event, uniqueId) {
    return `
        <div class="modal fade" id="modal-${uniqueId}" tabindex="-1" aria-labelledby="label-${uniqueId}" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="label-${uniqueId}">${event.titulo}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                    </div>
                    <div class="modal-body">
                        <div class="event-details">
                            <p><strong>Data:</strong> <span>${event.data}</span></p>
                            <p><strong>Cursos:</strong> <span>${event.cursos}</span></p>
                            <p><strong>Descrição:</strong> <span>${event.descricao}</span></p>
                            <p><strong>Membros:</strong> <span>${event.membros.map(membro => membro.nome).join(', ')}</span></p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
    
    Promise.all([
        fetchProjetos(),
        getUserData() 
    ]).then(() => {
        console.log("Dados de projetos e de usuário carregados. Renderizando a lista.");
        
        updateEventsList([]);

        dayButtons.forEach(button => {
            button.addEventListener('click', () => {
                button.classList.toggle('active');
                const activeButtons = [...dayButtons].filter(btn => btn.classList.contains('active'));
                updateEventsList(activeButtons);
            });
        });
    }).catch(error => {
        console.error("Ocorreu um erro ao carregar os dados iniciais:", error);
        eventsContainer.innerHTML = '<p>Ocorreu um erro ao carregar os dados. Tente novamente mais tarde.</p>';
    });
});