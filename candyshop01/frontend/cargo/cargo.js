const URL_API = 'http://localhost:3001';

let oQueEstaFazendo = '';
let formaPagamento = null;
bloquearAtributos(true);

async function procurePorChavePrimaria(chave) {
    try {
        const resposta = await fetch(`${URL_API}/cargo/${chave}`);
        const data = await resposta.json();
        return data.sucesso ? data.pagamentos : null;
    } catch (erro) {
        return null;
    }
}

async function procure() {
    const id_cargo = document.getElementById("inputID_cargo").value.trim().toUpperCase();
    if (!id_cargo) {
        mostrarAviso("Deve conter pagamento, seu caloteiro / ladrão.");
        return;
    }

    document.getElementById("inputID_cargo").value = id_cargo;
    formaPagamento = await procurePorChavePrimaria(id_cargo);
    oQueEstaFazendo = '';
    
    if (formaPagamento) {
        mostrardadosPagamento(formaPagamento);
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
    mostrarAviso("INSERINDO - Digite o Nome do pagamento e clique em salvar");
}

function alterar() {
    bloquearAtributos(false);
    visibilidadeDosBotoes('none', 'none', 'none', 'none', 'inline');
    oQueEstaFazendo = 'alterando';
    mostrarAviso("ALTERANDO - Digite o novo Nome e clique em salvar");
}

function excluir() {
    bloquearAtributos(true);
    visibilidadeDosBotoes('none', 'none', 'none', 'none', 'inline');
    oQueEstaFazendo = 'excluindo';
    mostrarAviso("EXCLUINDO - Clique em salvar para confirmar a exclusão");
}

async function salvar() {
    const id_cargo = document.getElementById("inputID_cargo").value;
    const nome_cargo = document.getElementById("inputNome_cargo").value;

    const dadosPagamento = { id_cargo, nome_cargo };

    try {
        if (oQueEstaFazendo === 'inserindo') {
            const resp = await fetch(`${URL_API}/pagamento`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dadosPagamento) });
            const data = await resp.json();
            if (!data.sucesso) return mostrarAviso(data.mensagem);
            mostrarAviso("Inserido no Banco de Dados com sucesso!");
        } else if (oQueEstaFazendo === 'alterando') {
            const resp = await fetch(`${URL_API}/pagamento/${id_cargo}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dadosPagamento) });
            const data = await resp.json();
            if (!data.sucesso) return mostrarAviso(data.mensagem);
            mostrarAviso("Alterado no Banco de Dados com sucesso!");
        } else if (oQueEstaFazendo === 'excluindo') {
            const resposta = await fetch(`${URL_API}/pagamento/${id_cargo}`, { method: 'DELETE' });
            const data = await resposta.json();
            if (!data.sucesso) {
                mostrarAviso(data.mensagem || "Erro ao excluir no servidor.");
                return;
            }
            mostrarAviso("Excluído do Banco de Dados!");
        }

        visibilidadeDosBotoes('inline', 'none', 'none', 'none', 'none');
        limparAtributos();
        document.getElementById("inputID_cargo").value = "";
        listar();
    } catch (erro) {
        mostrarAviso("Erro ao efetuar operação no servidor.");
    }
}

async function listar() {
    try {
        const resposta = await fetch(`${URL_API}/pagamento/listar`);
        const data = await resposta.json();
        
        if (data.sucesso) {
            let texto = "";
            for (let linha of data.pagamentos) {
                texto += `<b>[${linha.id_cargo}]</b> - ${linha.Nome_cargo}<br>`;
            }
            document.getElementById("outputSaida").innerHTML = texto || "Nenhuma forma de pagamento cadastrado.";
        } else {
            document.getElementById("outputSaida").innerHTML = `Erro no banco: ${data.mensagem}`;
        }
    } catch (erro) {
        console.error("Erro ao listar:", erro);
        document.getElementById("outputSaida").innerHTML = "Servidor offline ou erro de conexão (CORS).";
    }
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

function mostrarDadosPagamento(u) {
    document.getElementById("inputID_cargo").value = u.id_cargo;
    document.getElementById("inputNome_cargo").value = u.nome_cargo;
    bloquearAtributos(true);
}

function limparAtributos() {
    formaPagamento = null;
    oQueEstaFazendo = '';
    document.getElementById("inputNome_cargo").value = "";
    bloquearAtributos(true);
}

function bloquearAtributos(soLeitura) {
    document.getElementById("inputID_cargo").readOnly = !soLeitura;
    document.getElementById("inputNome_cargo").readOnly = soLeitura;
}

function visibilidadeDosBotoes(btP, btI, btA, btE, btS) {
    document.getElementById("btProcure").style.display = btP;
    document.getElementById("btInserir").style.display = btI;
    document.getElementById("btAlterar").style.display = btA;
    document.getElementById("btExcluir").style.display = btE;
    document.getElementById("btSalvar").style.display = btS;
    document.getElementById("btCancelar").style.display = btS;
}