// schedule.js
const scheduleData = {
    /*'26': [
        {
            title: 'Cerimônia de Abertura',
            time: '08:00 às 12:00',
            location: 'Auditório',
            description: 'Cerimônia de abertura do evento, oficialização do acordo de cooperação técnica entre IFSul Campus Passo Fundo, Embrapa Trigo e Universidade de Passo Fundo e palestra CV/XR/AI: combinações computacionais aplicadas à Agricultura, com palestrante Dr. Rafael Rieder',
            speakers: [{
                name: 'Rafael Rieder',
                image: '../../assets/img/speakers/Rieder.jpg',
                titles: ['Doutor e pesquisador em Ciência da Computação,'],
                bio: 'Rafael Rieder é pesquisador e doutor em Ciência da Computação, docente permanente do Programa de Pós-Graduação em Computação Aplicada (PPGCA), e professor da Universidade de Passo Fundo (UPF) desde 2011. Participou da comissão de criação do curso de Engenharia de Computação na UPF, e foi o primeiro coordenador do curso (2014-2015). Também atuou na comissão de criação do PPGCA na UPF (2013), e foi coordenador do programa no quadriênio 2017-2020. Publicou vários artigos em periódicos qualificados e trabalhos em anais de conferências nacionais e internacionais, além de organizar eventos dentro das temáticas de Realidade Virtual e Aumentada e Computação Aplicada à Agricultura. Desde 2016, coordena o Núcleo de Visualização e Modelagem Computacional no Parque Científico e Tecnológico da UPF (UPF Parque), onde está sediado o Laboratório de Realidade Virtual e Computação de Alto Desempenho. Seus principais projetos de P&D&I têm interface de Computação Aplicada à Agricultura e à Saúde, nas áreas de Realidade Virtual, Realidade Aumentada, Realidade Misturada, Aprendizado de Máquina, Processamento de Imagens e Visão Computacional. É bolsista produtividade em desenvolvimento tecnológico e extensão inovadora do CNPq - Nível 2.'
            }]
        },
        {
            title: '1ª Sessão Técnica',
            time: '13:30 às 17:30',
            location: 'Mini Auditório',
            description: 'Apresentação de artigos científicos. Premiação: - para os 3 (três) melhores artigos: 2 (duas) licenças na Alura com validade de 2 (dois) meses para cada artigo.'
        },
        {
            title: 'IoT Além do Arduino',
            time: '19:00 às 22:00',
            location: 'Auditório',
            description: 'O objetivo do mini-curso é mostrar a Internet das Coisas além do trivial. Além do Arduino e dos sensores e atuadores mais comuns. A idéia é mostrar integração com outras placas, como NodeMCU e micro:bit. Além de mostrar exemplos práticos usando publisher-subscriber e Raspberry Pi.',
            speakers: [{
                name: 'Ricardo da Silva Ogliari',
                image: '../../assets/img/speakers/Ricardo.jpg',
                titles: ['Bacharel em Ciência da Computação', 'Especialista em Web'],
                bio: 'Bacharel em Ciência da Computação. Especialista em Web: Estratégias de Inovação e Tecnologia. MBA em Desenvolvimento de Aplicativos e Jogos Móveis. Autor de livros sobres mobile e IoT. Palestrante em eventos nacionais e internacionais. Tech Lead no Banco digital Digio. Experiência no desenvolvimento e/ou liderança em projetos nacionais e internacionais.'
            }]
        }
    ],
    '27': [
        {
            title: 'Boas práticas em BGP avançado',
            time: '08:00 às 11:00',
            location: 'Prédio 5 - Sala 508',
            description: 'Governança da Internet; Conhecimento do funcionamento do protocolo BGP; Configuração de Filtros; Explicações do funcionamento de rotas.',
            speakers: [
                {
                    name: 'Pedro Eduardo Camera',
                    image: '../../assets/img/speakers/Unknown.jpg'
                },
                {
                    name: 'João Víctor Alves da Cruz',
                    image: '../../assets/img/speakers/Unknown.jpg'
                }
            ]
        },
        {
            title: '2ª Sessão Técnica',
            time: '13:30 às 17:30',
            location: 'Mini Auditório',
            description: 'Apresentação de artigos científicos. Premiação: - para os 3 (três) melhores artigos: 2 (duas) licenças na Alura com validade de 2 (dois) meses para cada artigo.',
        }
    ],
    '28': [
        {
            title: 'States, Statefull e Stateless! Novo padrão na construção de aplicativos Mobile.',
            time: '08:00 às 11:00',
            location: 'Auditório',
            description: 'O objetivo desta oficina é mostrar como a programa através de gerência de estados, com conceitos como Statefull e Stateless vem ganhando mercado, com plataformas como Flutter, React Native, Android JetPack Compose e Swift UI.',
            speakers: [{
                name: 'Ricardo da Silva Ogliari',
                image: '../../assets/img/speakers/Ricardo.jpg',
                titles: ['Bacharel em Ciência da Computação', 'Especialista em Web'],
                bio: 'Bacharel em Ciência da Computação. Especialista em Web: Estratégias de Inovação e Tecnologia. MBA em Desenvolvimento de Aplicativos e Jogos Móveis. Autor de livros sobres mobile e IoT. Palestrante em eventos nacionais e internacionais. Tech Lead no Banco digital Digio. Experiência no desenvolvimento e/ou liderança em projetos nacionais e internacionais.'
            }]
        },
        {
            title: '1º IFSul Arena Game - Calabouço de jogos - Prisma Espaço Geek',
            time: '08:00 às 11:00',
            location: 'Sala 154',
            description: 'Premiação: - uma licença na Alura com validade de 2 (dois) meses para sorteio.',
            speakers: [{
                name: 'Prisma Espaço Geek',
                image: '../../assets/img/speakers/Prisma.jpg'
            }]
        }
    ]*/
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
                Ver mais
            </button>
            
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