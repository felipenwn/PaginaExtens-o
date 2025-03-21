const scheduleData = {
    '28': [
        {
            title: 'Palestra de abertura',
            time: '08:00 às 12:00',
            location: 'A definir',
            description: 'Cerimônia de abertura do evento.',
            /*speakers: [{
                name: 'Rafael Rieder',
                image: '../../assets/img/speakers/Rieder.jpg',
                titles: ['Doutor e pesquisador em Ciência da Computação,'],
                bio: 'Rafael Rieder é pesquisador e doutor em Ciência da Computação, docente permanente do Programa de Pós-Graduação em Computação Aplicada (PPGCA), e professor da Universidade de Passo Fundo (UPF) desde 2011. Participou da comissão de criação do curso de Engenharia de Computação na UPF, e foi o primeiro coordenador do curso (2014-2015). Também atuou na comissão de criação do PPGCA na UPF (2013), e foi coordenador do programa no quadriênio 2017-2020. Publicou vários artigos em periódicos qualificados e trabalhos em anais de conferências nacionais e internacionais, além de organizar eventos dentro das temáticas de Realidade Virtual e Aumentada e Computação Aplicada à Agricultura. Desde 2016, coordena o Núcleo de Visualização e Modelagem Computacional no Parque Científico e Tecnológico da UPF (UPF Parque), onde está sediado o Laboratório de Realidade Virtual e Computação de Alto Desempenho. Seus principais projetos de P&D&I têm interface de Computação Aplicada à Agricultura e à Saúde, nas áreas de Realidade Virtual, Realidade Aumentada, Realidade Misturada, Aprendizado de Máquina, Processamento de Imagens e Visão Computacional. É bolsista produtividade em desenvolvimento tecnológico e extensão inovadora do CNPq - Nível 2.'
            }]*/
        },
    ],
    '31': [
        {
            title: 'Arena Games (Counter Strike e League of Legends)',
            time: '08:00 às 11:00',
            location: 'Prédio a definir',
            description: 'Competição de jogos eletrônicos: Counter Strike e League of Legends. Aberto ao público, inscrições através do Painel. Traga seus amigos!',
            link: 'https://painel.passofundo.ifsul.edu.br/',
            /* speakers: [
                 {
                     name: 'Pedro Eduardo Camera',
                     image: '../../assets/img/speakers/Unknown.jpg'
                 },
                 {
                     name: 'João Víctor Alves da Cruz',
                     image: '../../assets/img/speakers/Unknown.jpg'
                 }
             ]*/
        },
    ],
};

function createSpeakersSection(speakers) {
    return speakers.map(speaker => `
        <div class="speaker">
            <img src="${speaker.image}" alt="${speaker.name}" class="speaker-image">
            <div class="speaker-info">
                <h4>${speaker.name}</h4>
                ${speaker.titles ? `
                    <div class="speaker-titles">
                        ${speaker.titles.map(title => `<p>${title}</p>`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function createEventCard(event, index) {
    return `
        <div class="event-card">
            <h3 class="event-title">${event.title}</h3>
            <div class="event-time">
                <i class="bi bi-clock"></i>
                <span>${event.time}</span>
            </div>
            <div class="event-location">
                <i class="bi bi-geo-alt"></i>
                <span>${event.location}</span>
            </div>
            ${event.speakers ? `
                <div class="speakers-container">
                    ${createSpeakersSection(event.speakers)}
                </div>
            ` : ''}
            <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#eventModal${index}">
                Mais informações</button>
            
            <!-- Modal -->
            <div class="modal fade" id="eventModal${index}" tabindex="-1" aria-labelledby="eventModalLabel${index}" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="eventModalLabel${index}">${event.title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="event-details">
                                <p><strong>Horário:</strong> ${event.time}</p>
                                <p><strong>Local:</strong> ${event.location}</p>
                                ${event.description ? `<p><strong>Descrição:</strong> ${event.description}</p>` : ''}
                            </div>
                            ${event.speakers ? `
                                <div class="speakers-details">
                                    <h6>Palestrante(s)</h6>
                                    ${event.speakers.map(speaker => `
                                        <div class="speaker-detail">
                                            <img src="${speaker.image}" alt="${speaker.name}" class="speaker-image">
                                            <div class="speaker-info">
                                                <h4>${speaker.name}</h4>
                                                ${speaker.titles ? `
                                                    <div class="speaker-titles">
                                                        ${speaker.titles.map(title => `<p>${title}</p>`).join('')}
                                                    </div>
                                                ` : ''}
                                                ${speaker.bio ? `<p class="speaker-bio">${speaker.bio}</p>` : ''}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function updateEventsList(day) {
    const eventsContainer = document.querySelector('.events-list');
    const events = scheduleData[day];

    if (events) {
        eventsContainer.innerHTML = events.map((event, index) => createEventCard(event, index)).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const dayButtons = document.querySelectorAll('.day-button');

    dayButtons.forEach(button => {
        button.addEventListener('click', () => {
            dayButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            updateEventsList(button.textContent);
        });
    });
    updateEventsList('15');
});