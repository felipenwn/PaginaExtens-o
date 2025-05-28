const scheduleData = [
    {
        title: '<b>Arena Games</b> (Counter Strike 2 e League of Legends)',
        date: '31/05/2025',
        time: '08:00 às 11:00',
        courses: 'BCC',
        description: 'Competição de jogos eletrônicos: Counter Strike e League of Legends. Aberto ao público, inscrições através do Painel. Traga seus amigos!',
        link: 'https://painel.passofundo.ifsul.edu.br/',
        speakers: [
            {
                name: 'Marjory Ane Toazza',
                link: 'https://wa.link/03ovmc',
                image: '../../assets/img/Marjory.jpg'
            },
            {
                name: '⁠Murilo Bertella Ossanes',
                link: 'https://wa.link/lswjv7',
                image: '../../assets/img/Murilo.jpg'
            },
            {
                name: '⁠Victor do Amarante dos Santos',
                link: 'https://wa.link/9zoeno',
                image: '../../assets/img/Victor.jpg'
            }
        ]
    },
    {
        title: '<b>Arena Games</b> (Counter Strike 2 e League of Legends)',
        date: '31/05/2025',
        time: '08:00 às 11:00',
        courses: 'EC',
        description: 'Competição de jogos eletrônicos: Counter Strike e League of Legends. Aberto ao público, inscrições através do Painel. Traga seus amigos!',
        link: 'https://painel.passofundo.ifsul.edu.br/',
        speakers: [
            {
                name: 'Marjory Ane Toazza',
                link: 'https://wa.link/03ovmc',
                image: '../../assets/img/Marjory.jpg'
            },
            {
                name: '⁠Murilo Bertella Ossanes',
                link: 'https://wa.link/lswjv7',
                image: '../../assets/img/Murilo.jpg'
            },
            {
                name: '⁠Victor do Amarante dos Santos',
                link: 'https://wa.link/9zoeno',
                image: '../../assets/img/Victor.jpg'
            }
        ]
    }
];

function createSpeakersSection(speakers) {
    return speakers.map((speaker, index) => `
        <div class="carousel-item${index === 0 ? ' active' : ''}">
        <div class="speaker">
            <img src="${speaker.image}" class="speaker-image">
            <div class="speaker-info">
                <h4>${speaker.name}</h4>
                ${speaker.titles ? `
                    <div class="speaker-titles">
                        ${speaker.titles.map(title => `<p>${title}</p>`).join('')}
                    </div> 
                ` : ''}
            </div>
        </div>
        </div>
    `).join('');
}

function updateEventsList(courses) {
    const eventsContainer = document.querySelector('.events-list');
    let events;

    if (courses.length === 0)
        events = scheduleData;
    else {
        events = scheduleData.filter(data => {
            return courses.some(course =>
                data.courses.includes(course.innerHTML.trim())
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
                    data.courses.includes(course.innerHTML.trim())
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
            <img class="card-img flex-grow-1 h-100" src="../../assets/img/2014.jpg";>
            <div class="card-body flex-grow-3 p-3">
                <h3 class="event-title">${event.title}</h3>
                <div class="event-date">
                    <i class="bi bi-calendar-check"></i>
                    <span>${event.date}</span>
                </div>
                <div class="event-courses d-flex flex-row">
                    <div class="desc-icon" title="Cursos rlacionados"><i class="bi bi-book-half"></i></div>
                    <div><span>${event.courses}</span></div>
                </div>
                <div class="event-description d-flex flex-row">
                    <div class="desc-icon"><i class="bi bi-body-text"></i></div>
                    <div><span>${event.description}</span></div>
                </div>
                ${event.speakers ? `
                    <div id="speaker${index}" class="speakers-container carousel slide" data-ride="carousel">
                        <div class="carousel-inner">
                            ${createSpeakersSection(event.speakers)}
                        </div>
                        ${event.speakers.length > 1 ? `
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
});
