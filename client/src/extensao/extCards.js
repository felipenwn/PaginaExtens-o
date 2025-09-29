
let scheduleData = [];
const rolesPermitidos = ["docente", "estagiario", "Aluno"];


function formatarData(dataString) {
    if (!dataString) return 'Data não definida';
    const data = new Date(dataString);
    // Adiciona o fuso horário para corrigir a data que às vezes volta um dia
    const dataCorrigida = new Date(data.valueOf() + data.getTimezoneOffset() * 60000);
    return dataCorrigida.toLocaleDateString('pt-BR');
}
function createCourseTags(cursos) {
    let cursosArray = [];
    if (typeof cursos === 'string') {
        cursosArray = cursos.split(',').map(curso => curso.trim());
    } else if (Array.isArray(cursos)) {
        cursosArray = cursos;
    }

    return cursosArray.map(curso => `<span class="tag-curso">${curso}</span>`).join('');
}
function createMemberAvatars(membros) {
    // Limita a exibição para um número máximo de avatares se desejar, ex: .slice(0, 5)
    return membros.map(membro => `
        <img src="${API_BASE_URL}/uploads/${membro.image}" 
             alt="${membro.nome}" 
             class="aluno-avatar" 
             title="${membro.nome}">
    `).join('');
}


function createSpeakersSection(membros) {
    return membros.map((membro, index) => `
        <div class="carousel-item${index === 0 ? ' active' : ''}">
        <div class="speaker">
            <img src="${API_BASE_URL}/uploads/${membro.image}" class="speaker-image">
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
    const response = await fetch(`${API_BASE_URL}/projetos`, {
        method: 'GET',
        credentials: 'include'
    });
    scheduleData = await response.json();
    console.log("Fetched:", scheduleData);
}

function removeProjeto(id) {
    if (confirm('Tem certeza que deseja remover este projeto?')) {
        fetch(`${API_BASE_URL}/projetos/` + id, {
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
            const carouselControls = eventsContainer.querySelectorAll('.carousel-control-prev, .carousel-control-next');

        // Para cada seta encontrada, adiciona um ouvinte de evento
        carouselControls.forEach(control => {
            control.addEventListener('click', (event) => {
                // Esta linha mágica impede que o clique "vaze" para o card pai
                event.stopPropagation();
            });
        });
        } else {
            eventsContainer.innerHTML = '<p>Nenhum projeto encontrado.</p>';
        }
    }

    // Dentro de extCards.js

    // Dentro de extCards.js

    // Dentro de extCards.js

    // Dentro de extCards.js

    function createEventCard(event, index) {
        const uniqueId = `projeto-${event.id}`;
        const isCarousel = event.membros && event.membros.length > 1;

        return `
    <div class="card event-card d-flex flex-row custom-card" data-bs-toggle="modal" data-bs-target="#modal-${uniqueId}">
        <img class="card-img custom-card-img" src="${API_BASE_URL}/uploads/${event.capa}">
        <div class="card-body">

            <div class="card-main-content">
                <h3 class="event-title">${event.titulo}</h3>

                <div class="event-courses">
                   
                    <i class="bi bi-book-half"></i>
                   <span> ${event.cursos}</span>
                  
                    
                    <i class="bi bi-calendar-check desc-icon"></i>
                    <span>${event.data}</span>
                   
                </div>
                
                <div class="event-date">

                </div>

                <div class="event-description">
                    <span>${event.descricao}</span>
                </div>
                

                <div class="event-courses d-flex flex-row">

                </div>
            </div>
            ${event.membros && event.membros.length > 0 ? `
                <div id="speaker${index}" class="speakers-container ${isCarousel ? 'carousel slide' : ''}" ${isCarousel ? 'data-bs-ride="carousel"' : ''}>
                    <div class="carousel-inner">
                        ${createSpeakersSection(event.membros)}
                    </div>
                    ${isCarousel ? `
                    <button class="carousel-control-prev" type="button" data-bs-target="#speaker${index}" data-bs-slide="prev">
                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    </button>
                    <button class="carousel-control-next" type="button" data-bs-target="#speaker${index}" data-bs-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                    </button>
                    ` : ''}
                </div>
            ` : ''}
            
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