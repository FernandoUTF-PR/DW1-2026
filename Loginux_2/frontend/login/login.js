
const API_BASE_URL = 'http://localhost:3001'; // Servidor Express na mesma origem

// ELEMENTOS HTML

const formEmail = document.getElementById('formEmail');
const formSenha = document.getElementById('formSenha');
const formCadastro = document.getElementById('formCadastro');

const inputEmail = document.getElementById('email');
const inputSenha = document.getElementById('senha');

const mensagemErro = document.getElementById('mensagemErro');


// EVENTOS

formEmail.addEventListener('submit', verificarEmail);
formSenha.addEventListener('submit', realizarLogin);


// ETAPA 1: VERIFICAR EMAIL

async function verificarEmail(event) {

    event.preventDefault();

    const email = inputEmail.value.trim();

    if (!email.toLowerCase().endsWith('@gmail.com')) {
        alert('Informe um endereço Gmail válido.');
        return;
    }

    try {

        const response = await fetch(`${API_BASE_URL}/login/verificarEmail`, {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({ email })

        });

        if (!response.ok) {
            throw new Error('Erro ao verificar e-mail.');
        }

        const data = await response.json();

        if (data.status === 'existe') {

            document.getElementById('nomeUsuario').innerText =
                `Olá, ${data.nome}`;

            mostrarCard('cardSenha');

        } else if (data.status === 'nao_encontrado') {

            const desejaCadastrar = confirm(
                'E-mail não encontrado. Deseja se cadastrar?'
            );

            if (desejaCadastrar) {

                document.getElementById('emailCadast').value = email;

                mostrarCard('cardCadastro');

            }

        } else {

            alert('Não foi possível verificar o e-mail.');

        }

    } catch (error) {

        console.error('Erro ao verificar email:', error);

        alert('Erro ao se comunicar com o servidor.');

    }

}


// ETAPA 2: REALIZAR LOGIN

async function realizarLogin(event) {

    event.preventDefault();

    const email = inputEmail.value.trim();
    const senha = inputSenha.value;

    mensagemErro.innerText = '';

    try {

        const response = await fetch(`${API_BASE_URL}/login/verificarSenha`, {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            credentials: 'include',

            body: JSON.stringify({ email, senha })

        });

        const data = await response.json();

        if (data.status === 'ok') {

            // Salva os dados completos do usuário logado (id_pessoa, nome, papeis)
            localStorage.setItem('usuario_sessao', JSON.stringify({
                id_pessoa: data.id_pessoa,
                nome: data.nome,
                papeis: data.papeis || ['cliente']
            }));

            const ehAdmin = (data.papeis || []).some(p => p === 'gerente' || p === 'funcionario');

            if (localStorage.getItem('checkout_pendente') === 'true') {
                window.location.href = '/menu.html';
            } else if (ehAdmin) {
                window.location.href = '/admin/admin.html';
            } else {
                window.location.href = '/menu.html';
            }

        } else if (data.status === 'senha_incorreta') {

            mensagemErro.innerText =
                'Senha incorreta. Tente novamente.';

        } else {

            mensagemErro.innerText =
                'Erro ao efetuar login.';

        }

    } catch (error) {

        console.error('Erro ao realizar login:', error);

        mensagemErro.innerText =
            'Falha ao se comunicar com o servidor.';

    }

}


// ETAPA 3: CADASTRAR USUARIO

async function cadastrarUsuario() {

    if (!formCadastro.reportValidity()) {
        return;
    }

    const email = document.getElementById('emailCadast').value.trim();

    const nome = document.getElementById('nameCadast').value.trim();

    const senha = document.getElementById('senhaCadast').value;

    if (!nome || !senha) {

        alert('Preencha todos os campos.');

        return;

    }

    try {

        const response = await fetch(`${API_BASE_URL}/login/cadastrar`, {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({

                nome_pessoa: nome,

                email_pessoa: email,

                senha_pessoa: senha

            })

        });

        const data = await response.json();

        if (response.ok) {
         alert('Cadastro realizado com sucesso! Agora digite sua senha para entrar.');
         inputEmail.value = email;
         document.getElementById('nomeUsuario').innerText = `Olá, ${nome}`;
         document.getElementById('nameCadast').value = '';
         document.getElementById('senhaCadast').value = '';
         mostrarCard('cardSenha');
        
        } else {

            alert(data.error || 'Erro ao realizar cadastro.');

        }

    } catch (error) {

        console.error('Erro ao cadastrar:', error);

        alert('Falha ao se comunicar com o servidor.');

    }

}


// MOSTRAR CARDS

function mostrarCard(idParaMostrar) {

    document.getElementById('cardEmail').classList.add('hidden');

    document.getElementById('cardSenha').classList.add('hidden');

    document.getElementById('cardCadastro').classList.add('hidden');

    document.getElementById(idParaMostrar).classList.remove('hidden');

}


// VOLTAR ENTRE AS ETAPAS

function voltarPara(idParaVoltar) {

    mensagemErro.innerText = '';

    inputSenha.value = '';

    mostrarCard(idParaVoltar);

}


// ESQUECI A SENHA

function esqueciSenha() {

    alert('A recuperação de senha ainda não foi implementada.');

}
