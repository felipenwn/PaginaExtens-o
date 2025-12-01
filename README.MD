1. Aplicação Backend (Node.js):

Porta Interna: A aplicação espera rodar na porta definida pela variável de ambiente PORT. Se não for definida, ela sobe na 3000 por padrão.

Protocolo: A aplicação roda em HTTP puro internamente. O SSL/HTTPS deve ser tratado pelo Proxy Reverso (Nginx/Apache) do servidor.

Persistência de Dados (Importante):

O banco de dados é SQLite (extensao.db). É necessário criar um Volume para persistir esse arquivo, senão os dados somem ao reiniciar o container.

A pasta de uploads (/uploads) também precisa de um Volume para persistir as imagens enviadas.

2. Aplicação Frontend (HTML/JS):

O frontend consome a API via caminhos relativos (ex: /api/...). É necessário configurar o Proxy Reverso para redirecionar chamadas de /api para o container do Node.js.

3. Variáveis de Ambiente (.env): Por favor, configurem as seguintes variáveis no ambiente de produção (para o envio de e-mails funcionar):

Plaintext

EMAIL_HOST=smtp.gmail.com (ou o do IFSul)
EMAIL_PORT=465 (ou 587)
EMAIL_USER=email-que-vai-enviar@dominio.com
EMAIL_PASS=senha-do-app
PORT=3000 (opcional, porta interna do container)
4. Configuração do SUAP (Login):

Após definirem a URL final do site (ex: https://projetos.ifsul.edu.br), eu preciso dessa URL para cadastrar na API do SUAP como "Redirect URI", senão o login não funcionará.