const API_BASE_URL = ''; // mesma origem do servidor

// Elementos do DOM
const formLogin = document.getElementById('formLogin');
const etapaEmail = document.getElementById('etapaEmail');
const etapaSenha = document.getElementById('etapaSenha');
const inputEmail = document.getElementById('email');
const inputSenha = document.getElementById('senha');
const btnVerificarEmail = document.getElementById('btnVerificarEmail');
const btnVoltar = document.getElementById('btnVoltar');
const saudacaoUsuario = document.getElementById('saudacaoUsuario');
const mensagemErro = document.getElementById('mensagemErro');
const btnEsqueci = document.getElementById('btnEsqueci');

// Event Listeners
btnVerificarEmail.addEventListener('click', verificarEmail);
btnVoltar.addEventListener('click', voltarParaEmail);
formLogin.addEventListener('submit', realizarLogin);
btnEsqueci.addEventListener('return', esqueciSenha);

// 🔹 Etapa 1: Verifica se o e-mail existe
async function verificarEmail() {
    const email = inputEmail.value.trim();
    mensagemErro.innerText = '';

    if (!email) {
        mensagemErro.innerText = 'Por favor, informe seu e-mail.';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login/verificarEmail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (data.status === 'existe') {
            saudacaoUsuario.innerText = `Olá, ${data.nome}!`;
            etapaEmail.classList.add('hidden');
            etapaSenha.classList.remove('hidden');
            inputSenha.focus();
        } else {
            mensagemErro.innerText = 'E-mail não encontrado no sistema.';
        }
    } catch (error) {
        console.error('Erro ao verificar e-mail:', error);
        mensagemErro.innerText = 'Falha ao se comunicar com o servidor.';
    }
}

// 🔹 Volta para a etapa de e-mail
function voltarParaEmail() {
    mensagemErro.innerText = '';
    inputSenha.value = '';
    etapaSenha.classList.add('hidden');
    etapaEmail.classList.remove('hidden');
    inputEmail.focus();
}

// 🔹 Etapa 2: Valida a senha e realiza login
async function realizarLogin(event) {
    event.preventDefault();
    const email = inputEmail.value.trim();
    const senha = inputSenha.value;
    mensagemErro.innerText = '';

    if (!senha) {
        mensagemErro.innerText = 'Por favor, informe sua senha.';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login/verificarSenha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // 🔑 envia/recebe cookies
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (data.status === 'ok') {
            window.location.href = '/menu';
        } else if (data.status === 'senha_incorreta') {
            mensagemErro.innerText = 'Senha incorreta. Tente novamente.';
        } else {
            mensagemErro.innerText = 'Erro ao efetuar login.';
        }
    } catch (error) {
        console.error('Erro ao realizar login:', error);
        mensagemErro.innerText = 'Falha ao se comunicar com o servidor.';
    }
}