let scheduleData = [];

function createSpeakersSection(membros) {
    return membros.map((membro, index) => `
        <div class="carousel-item${index === 0 ? ' active' : ''}">
        <div class="speaker">
            <img src="http://localhost:3000${membro.image}" class="speaker-image">
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
    const response = await fetch("https://localhost:3000/projetos", {
        method: 'GET',
        credentials: 'include'  // important if you use cookies
      });
    scheduleData = await response.json();
    console.log("Fetched:", scheduleData);
}

document.addEventListener('DOMContentLoaded', () => {
    fetchProjetos().then(() => {
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
                eventsContainer.innerHTML = events
                    .map((event, index) => createEventCard(event, index))
                    .join('');
            } else {
                eventsContainer.innerHTML = '<p>No events found.</p>';
            }
        }


        function createEventCard(event, index, day) {
            return `
        <div class="card event-card d-flex flex-row">
            <img class="card-img flex-grow-1 h-100" src="https://localhost:3000${event.capa}";>
            <div class="card-body flex-grow-3 p-3">
                <h3 class="event-title">${event.titulo}</h3>
                <div class="event-date">
                    <i class="bi bi-calendar-check"></i>
                    <span>${event.data}</span>
                </div>
                <div class="event-courses d-flex flex-row">
                    <div class="desc-icon" title="Cursos rlacionados"><i class="bi bi-book-half"></i></div>
                    <div><span>${event.cursos}</span></div>
                </div>
                <div class="event-description d-flex flex-row">
                    <div class="desc-icon"><i class="bi bi-body-text"></i></div>
                    <div><span>${event.descricao}</span></div>
                </div>
                ${event.membros ? `
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
            </div>
        </div>
    `;
        }


        dayButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Toggle active class
                button.classList.toggle('active');

                // Create an array of buttons that are currently active
                const activeButtons = [...dayButtons].filter(btn => btn.classList.contains('active'));

                // Pass them to your update function
                updateEventsList(activeButtons);
            });
        });
        updateEventsList([]);
    })
});
