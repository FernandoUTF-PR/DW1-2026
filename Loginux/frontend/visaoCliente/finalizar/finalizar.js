let valorTotal = 0;
const API_BASE_URL = '';

function carregarFinalizar() {
    // MUDANÇA: Agora busca a tag <tbody> pelo ID 'listaFinalizar'
    const tbodyLista = document.getElementById('listaFinalizar');
    const totalFinal = document.getElementById('total-final');
    const carrinho = JSON.parse(sessionStorage.getItem('carrinho')) || [];

    // Limpa apenas o corpo da tabela (mantendo o cabeçalho <thead>)
    tbodyLista.innerHTML = '';
    let total = 0;

    if (carrinho.length === 0) {
        // Se o carrinho estiver vazio, insere a linha de aviso no <tbody>
        tbodyLista.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px;">Carrinho vazio. Volte e adicione itens.</td></tr>`;
        document.getElementById('btn-finalizar').disabled = true;
        document.getElementById('total-final').textContent = 'Total Final: R$ 0,00';
        return;
    }

    document.getElementById('btn-finalizar').disabled = false;

    carrinho.forEach(prod => {
        const codigo = prod.codigo || prod.id || '(sem código)';
        // Preço e quantidade são calculados por unidade.
        const preco = Number(prod.preco);
        const quantidade = Number(prod.quantidade);
        const subtotal = preco * quantidade;
        total += subtotal;

        const linha = document.createElement('tr');
        linha.innerHTML = `
        <td>${codigo}</td>
        <td>${prod.nome}</td>
        <td>R$ ${preco.toFixed(2)} / unidade</td> <td>${quantidade} unidade(s)</td>
        <td>R$ ${subtotal.toFixed(2)}</td>
    `;
        // Adiciona a linha ao corpo da tabela (tbody)
        tbodyLista.appendChild(linha);
    });

    document.getElementById('total-final').textContent = `Valor total: R$ ${total.toFixed(2)}`;
    valorTotal = total;
    
    
    
}

// ... o restante do seu código JavaScript ...

function obterCarrinhoDoStorage(idPedido, dadosStorage) {
    try {
        let carrinhoData;

        // Se for passado o objeto Storage completo, extrai o valor da chave 'carrinho'
        if (typeof dadosStorage === 'object' && dadosStorage.getItem('carrinho')) { // Ajustado para chamar getItem() no objeto Storage
            carrinhoData = JSON.parse(dadosStorage.getItem('carrinho'));
        }
        // Se for passado diretamente a string do carrinho (caso não se aplique aqui diretamente, mas mantido)
        else if (typeof dadosStorage === 'string') {
            carrinhoData = JSON.parse(dadosStorage);
        }
        else {
            console.warn('Dados do carrinho não encontrados ou formato inválido');
            return [];
        }


        // Adiciona o id_pedido em cada item do carrinho
        const carrinhoComPedido = []; // Cria um novo array vazio

        for (const item of carrinhoData) {
            // Cria o novo objeto com a estrutura desejada
            const itemFormatado = {
                id_pedido: idPedido,
                id_produto: item.id,
                nome_produto: item.nome,
                preco: item.preco,
                // Converte a quantidade de gramas para quilogramas (dividindo por 1000)
                quantidade: item.quantidade
            };

            // Adiciona o novo objeto ao array carrinhoComPedido
            carrinhoComPedido.push(itemFormatado);
        }

        return carrinhoComPedido;

    } catch (error) {
        console.error('Erro ao processar dados do carrinho:', error);
        return [];
    }
}

// ======== Envia o pedido ao backend ========
async function enviarDadosParaBD() {
    const carrinho = JSON.parse(sessionStorage.getItem('carrinho') || '[]');
    if (!carrinho.length) {
        alert('O carrinho está vazio.');
        return;
    }

    try {
        const sessao = await fetch('/login/verificaSeUsuarioEstaLogado', { credentials: 'include' });
        if (!sessao.ok) throw new Error('Faça login novamente para concluir o pedido.');
        const sessaoDados = await sessao.json();
        if (sessaoDados.status !== 'ok') throw new Error('Usuário não autenticado.');
        const usuario = JSON.parse(sessaoDados.usuario || '{}');
        if (!usuario.cpf_pessoa || usuario.ehCliente !== true) {
            throw new Error('O pedido online exige uma conta de cliente cadastrada.');
        }

        const pedido = {
            data_pedido: new Date().toISOString().slice(0, 10),
            cliente_pessoa_cpf_pessoa: usuario.cpf_pessoa,
            itens: carrinho.map(item => ({ id_produto: item.id, quantidade: Number(item.quantidade) }))
        };
        const resposta = await fetch('/pedido/online', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(pedido)
        });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.error || 'Falha ao criar pedido.');

        valorTotal = Number(dados.valor_total);
        if (!Number.isFinite(valorTotal) || valorTotal <= 0) throw new Error('O servidor retornou um total inválido.');
        sessionStorage.setItem('dadosPagamento', JSON.stringify({
            id_pedido: dados.id_pedido,
            valor_total: valorTotal
        }));
        window.location.href = '/pagamento/abrirTelaPagamento';
    } catch (erro) {
        console.error('Erro ao finalizar pedido:', erro);
        alert(erro.message || 'Ocorreu um erro ao finalizar o pedido. Tente novamente.');
    }
}

// ======== Evento do botão ========
document.getElementById('btn-finalizar').addEventListener('click', enviarDadosParaBD);

// ======== Ao carregar página ========
carregarFinalizar();