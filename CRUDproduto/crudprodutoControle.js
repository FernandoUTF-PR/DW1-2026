const URL_API = 'http://localhost:3001';

let oQueEstaFazendo = '';
let produto = null;
bloquearAtributos(true);

// Busca no Banco de Dados via API
async function procurePorChavePrimaria(chave) {
    try {
        const resposta = await fetch(`${URL_API}/produto/${chave}`);
        const data = await resposta.json();
        if (data.sucesso) {
            return data.produto;
        }
        return null;
    } catch (erro) {
        console.error('Erro na consulta:', erro);
        return null;
    }
}

// Procura por ID mantendo a dinâmica original de botões
async function procure() {
    const id_produto = document.getElementById("inputID").value;
    if (isNaN(id_produto) || !Number.isInteger(Number(id_produto)) || id_produto === "") {
        mostrarAviso("Precisa ser um número inteiro");
        document.getElementById("inputID").focus();
        return;
    }

    produto = await procurePorChavePrimaria(id_produto);
    if (produto) {
        mostrarDadosProduto(produto);
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
    document.getElementById("inputNomeProduto").focus();
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
    let id_produto = produto ? produto.id_produto : parseInt(document.getElementById("inputID").value);
    const nome_produto = document.getElementById("inputNomeProduto").value;
    const tamanho = document.getElementById("inputTamanho").value;
    const peso = document.getElementById("inputPeso").value;


    if (!id_produto || !nome_produto || !tamanho || !peso) {
        alert("Erro nos dados digitados");
        return;
    }

    const dadosProduto = { id_produto, nome_produto, tamanho, peso};

    try {
        if (oQueEstaFazendo === 'inserindo') {
            await fetch(`${URL_API}/produto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosProduto)
            });
            mostrarAviso("Inserido no Banco de Dados com sucesso!");
        } else if (oQueEstaFazendo === 'alterando') {
            await fetch(`${URL_API}/produto/${id_produto}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosProduto)
            });
            mostrarAviso("Alterado no Banco de Dados com sucesso!");
        } else if (oQueEstaFazendo === 'excluindo') {
            await fetch(`${URL_API}/produto/${id_produto}`, {
                method: 'DELETE'
            });
            mostrarAviso("Excluído do Banco de Dados!");
        }

        visibilidadeDosBotoes('inline', 'none', 'none', 'none', 'none');
        limparAtributos();
        document.getElementById("inputID").value = "";
        listar();
    } catch (erro) {
        mostrarAviso("Erro ao efetuar operação no servidor.");
    }
}

// Busca a lista atualizada do backend
async function listar() {
    try {
        
        const resposta = await fetch(`${URL_API}/produtos`);
        const data = await resposta.json();
        if (data.sucesso) {
            document.getElementById("outputSaida").innerHTML = preparaListagem(data.produtos);
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
let linha = vetor[i];
        texto += `${linha.id_produto} - ${linha.nome_produto} - ${linha.tamanho} - ${linha.peso}<br>`;
    }
    return texto || "Nenhum produto cadastrado.";
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

function mostrarDadosProduto(produto) {
    document.getElementById("inputID").value = produto.id_produto;
    document.getElementById("inputNomeProduto").value = produto.nome_produto;
    document.getElementById("inputPeso").value = produto.peso;
    document.getElementById("inputTamanho").value = produto.tamanho;
    bloquearAtributos(true);
}

function limparAtributos() {
    produto = null;
    document.getElementById("inputNomeProduto").value = "";
    document.getElementById("inputPeso").value = "";
    document.getElementById("inputTamanho").value = "";
    bloquearAtributos(true);
}

function bloquearAtributos(soLeitura) {
    document.getElementById("inputID").readOnly = !soLeitura;
    document.getElementById("inputNomeProduto").readOnly = soLeitura;
    document.getElementById("inputPeso").readOnly = soLeitura;
    document.getElementById("inputTamanho").readOnly = soLeitura;

}

function visibilidadeDosBotoes(btProcure, btInserir, btAlterar, btExcluir, btSalvar) {
    document.getElementById("btProcure").style.display = btProcure;
    document.getElementById("btInserir").style.display = btInserir;
    document.getElementById("btAlterar").style.display = btAlterar;
    document.getElementById("btExcluir").style.display = btExcluir;
    document.getElementById("btSalvar").style.display = btSalvar;
    document.getElementById("btCancelar").style.display = btSalvar;
    document.getElementById("inputID").focus();
}
