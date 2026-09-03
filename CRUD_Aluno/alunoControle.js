const URL_API = 'http://localhost:3001';

let oQueEstaFazendo = '';
let aluno = null;
bloquearAtributos(true);

// Busca no Banco de Dados via API
async function procurePorChavePrimaria(chave) {
    try {
        const resposta = await fetch(`${URL_API}/aluno/${chave}`);
        const data = await resposta.json();
        if (data.sucesso) {
            return data.aluno;
        }
        return null;
    } catch (erro) {
        console.error('Erro na consulta:', erro);
        return null;
    }
}

// Procura por ID mantendo a dinâmica original de botões
async function procure() {
    const ra_aluno = document.getElementById("inputRAaluno").value;
    if (isNaN(ra_aluno) || !Number.isInteger(Number(ra_aluno)) || ra_aluno === "") {
        mostrarAviso("Precisa ser um número inteiro");
        document.getElementById("inputRAaluno").focus();
        return;
    }

    aluno = await procurePorChavePrimaria(ra_aluno);
    if (aluno) {
        mostrarDadosAluno(aluno);
        visibilidadeDosBotoes('inline', 'none', 'inline', 'inline', 'none');
        mostrarAviso("Achou no banco, pode alterar ou excluir");
    } else {
        limparAtributos();
        visibilidadeDosBotoes('inline', 'inline', 'none', 'none', 'none');
        mostrarAviso("Não achou no banco, pode inserir");
    }
}

function inserir() {
    bloquearAtributos(false);
    visibilidadeDosBotoes('none', 'none', 'none', 'none', 'inline');
    oQueEstaFazendo = 'inserindo';
    mostrarAviso("INSERINDO - Digite os atributos e clique em salvar");
    document.getElementById("inputNomeAluno").focus();
}

function alterar() {
    bloquearAtributos(false);
    visibilidadeDosBotoes('none', 'none', 'none', 'none', 'inline');
    oQueEstaFazendo = 'alterando';
    mostrarAviso("ALTERANDO - Digite os atributos e clique em salvar");
}

function excluir() {
    bloquearAtributos(true); // Na exclusão não precisa liberar os inputs
    visibilidadeDosBotoes('none', 'none', 'none', 'none', 'inline');
    oQueEstaFazendo = 'excluindo';
    mostrarAviso("EXCLUINDO - Clique em salvar para confirmar a exclusão");
}

// Salva as alterações realizando a chamada HTTP correta na API
async function salvar() {
    let ra_aluno = aluno ? aluno.ra_aluno : parseInt(document.getElementById("inputRAaluno").value);
    const nome_completo = document.getElementById("inputNomeAluno").value;
    const data_nasc = document.getElementById("inputDataNasc").value;
    const email = document.getElementById("inputEmail").value;
    const telefone = document.getElementById("inputTelefone").value;
    const curso = document.getElementById("inputCurso").value;
    

    if (!ra_aluno || !nome_completo || !data_nasc || !email || !telefone || !curso) {
        alert("Erro nos dados digitados");
        return;
    }

    const dadosAluno = { ra_aluno, nome_completo, data_nasc, email, telefone, curso};

    try {
        if (oQueEstaFazendo === 'inserindo') {
            await fetch(`${URL_API}/aluno`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAluno)
            });
            mostrarAviso("Inserido no Banco de Dados com sucesso!");
        } else if (oQueEstaFazendo === 'alterando') {
            await fetch(`${URL_API}/aluno/${ra_aluno}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAluno)
            });
            mostrarAviso("Alterado no Banco de Dados com sucesso!");
        } else if (oQueEstaFazendo === 'excluindo') {
            await fetch(`${URL_API}/aluno/${ra_aluno}`, {
                method: 'DELETE'
            });
            mostrarAviso("Excluído do Banco de Dados!");
        }

        visibilidadeDosBotoes('inline', 'none', 'none', 'none', 'none');
        limparAtributos();
        document.getElementById("inputRAaluno").value = "";
        listar();
    } catch (erro) {
        mostrarAviso("Erro ao efetuar operação no servidor.");
    }
}

// Busca a lista atualizada do backend
async function listar() {
    try {
        const resposta = await fetch(`${URL_API}/alunos`);
        const data = await resposta.json();
        if (data.sucesso) {
            document.getElementById("outputSaida").innerHTML = preparaListagem(data.alunos);
        } else {
            document.getElementById("outputSaida").innerHTML = "Erro ao carregar dados.";
        }
    } catch (erro) {
        document.getElementById("outputSaida").innerHTML = "Servidor offline.";
    }
}

function preparaListagem(vetor) {
    let texto = "";
    for (let i = 0; i < vetor.length; i++) {
        const linha = vetor[i];
        const data = new Date (linha.data_nasc);
        const dataFormatada = data.toLocaleDateString('pt-BR');
        texto += `${linha.ra_aluno} - ${linha.nome_completo} - ${dataFormatada} - ${linha.email} - ${linha.telefone} - ${linha.curso}<br>`;
    }
    return texto || "Nenhum aluno cadastrado.";
}

function cancelarOperacao() {
    limparAtributos();
    bloquearAtributos(true);
    visibilidadeDosBotoes('inline', 'none', 'none', 'none', 'none');
    mostrarAviso("Cancelou a operação");
}

function mostrarAviso(mensagem) {
    document.getElementById("divAviso").innerHTML = mensagem;
}

function mostrarDadosAluno(aluno) {
    document.getElementById("inputRAaluno").value = aluno.ra_aluno;
    document.getElementById("inputNomeAluno").value = aluno.nome_completo;
    document.getElementById("inputDataNasc").value = aluno.data_nasc;
    document.getElementById("inputEmail").value = aluno.email;
    document.getElementById("inputTelefone").value = aluno.telefone;
    document.getElementById("inputCurso").value = aluno.curso;
    bloquearAtributos(true);
}

function limparAtributos() {
    aluno = null;
    document.getElementById("inputNomeAluno").value = "";
    document.getElementById("inputDataNasc").value = "";
    document.getElementById("inputEmail").value = "";
    document.getElementById("inputTelefone").value = "";
    document.getElementById("inputCurso").value = "";
    bloquearAtributos(true);
}

function bloquearAtributos(soLeitura) {
    document.getElementById("inputRAaluno").readOnly = !soLeitura;
    document.getElementById("inputNomeAluno").readOnly = soLeitura;
    document.getElementById("inputDataNasc").readOnly = soLeitura;
    document.getElementById("inputEmail").readOnly = soLeitura;
    document.getElementById("inputTelefone").readOnly = soLeitura;
    document.getElementById("inputCurso").readOnly = soLeitura;
}

function visibilidadeDosBotoes(btProcure, btInserir, btAlterar, btExcluir, btSalvar) {
    document.getElementById("btProcure").style.display = btProcure;
    document.getElementById("btInserir").style.display = btInserir;
    document.getElementById("btAlterar").style.display = btAlterar;
    document.getElementById("btExcluir").style.display = btExcluir;
    document.getElementById("btSalvar").style.display = btSalvar;
    document.getElementById("btCancelar").style.display = btSalvar;
    document.getElementById("inputRAaluno").focus();
}
