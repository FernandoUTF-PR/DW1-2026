const API_BASE_URL = 'http://localhost:3001'; // mesma origem do servidor

// Elementos do DOM
const formLogin = document.getElementById('formLogin');
const etapaEmail = document.getElementById('etapaEmail');
const etapaSenha = document.getElementById('etapaSenha');
const inputEmail = document.getElementById('email');
const inputSenha = document.getElementById('senha');
const btnVerificarEmail = document.getElementById('btnVerificarEmail');
const btnVerificarSenha = document.getElementById('btnVerificarSenha');
const btnVoltar = document.getElementById('btnVoltar');
const saudacaoUsuario = document.getElementById('saudacaoUsuario');
const mensagemErro = document.getElementById('mensagemErro');
const btnEsqueci = document.getElementById('btnEsqueci');

// Event Listeners
btnVerificarEmail.addEventListener('click', verificarEmail);
btnVoltar.addEventListener('click', voltarParaEmail);
formLogin.addEventListener('submit', realizarLogin);


// 🔹 Etapa 1: Verifica se o e-mail existe
async function verificarEmail() {
    const email = document.getElementById("email").value.trim();

    try {
        const response = await fetch(`${API_BASE_URL}/login/verificarEmail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (data.status === 'existe') {
            // E-mail existe -> Vai para a Senha
            document.getElementById("nomeUsuario").innerText = `Olá, ${data.nome}`;
            mostrarCard('cardSenha');
        } else {
            // E-mail não existe -> Vai para o Cadastro
            const desejaCadastrar = confirm("E-mail não encontrado. Deseja se cadastrar?");
            if (desejaCadastrar) {
                // Preenche automaticamente o e-mail no form de cadastro
                document.getElementById('emailCadast').value = email; 
                mostrarCard('cardCadastro');
            }
        }
    } catch (error) {
        console.error("Erro ao verificar email:", error);
    }
}

//function cadastrarLogin() {

    //const emailCadast = document.getElementById("emailCadast").value;
     //emailGlobal = emailCadast;

     //const nomeCadast = document.getElementById("nameCadast").value;
     //emailGlobal = emailCadast;

     //const senhaCadast = document.getElementById("senhaCadast").value;
     //emailGlobal = emailCadast;
//}

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

function mostrarCard(idParaMostrar) {
    // Esconde todos
    document.getElementById('cardEmail').classList.add('hidden');
    document.getElementById('cardSenha').classList.add('hidden');
    document.getElementById('cardCadastro').classList.add('hidden');
    
    // Mostra apenas o desejado
    document.getElementById(idParaMostrar).classList.remove('hidden');
}

function voltarPara(idParaVoltar) {
    // Limpar campos de erro e senhas ao voltar
    document.getElementById('mensagemErro').innerText = '';
    document.getElementById('senha').value = '';
    mostrarCard(idParaVoltar);
}