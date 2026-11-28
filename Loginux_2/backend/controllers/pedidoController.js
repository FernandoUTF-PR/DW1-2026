const db = require('../database.js');

exports.criarPedido = async (req, res) => {
    const { id_pessoa, nome_forma_pagamento, itens } = req.body;

    if (!id_pessoa || !itens || itens.length === 0) {
        return res.status(400).json({ erro: 'Dados do pedido inválidos ou sacola vazia.' });
    }

    try {
        await db.query('BEGIN');

        // 1. Busca o id_forma_pagamento pelo nome escolhido
        const resPag = await db.query(
            'SELECT id_forma_pagamento FROM forma_pagamento WHERE nome_forma_pagamento = $1',
            [nome_forma_pagamento || 'Pix']
        );
        const idFormaPagamento = resPag.rows.length > 0 ? resPag.rows[0].id_forma_pagamento : 1;

        // 2. Calcula valor total com base nos preços reais cadastrados no banco
        let valorTotal = 0;
        const itensValidados = [];

        for (const item of itens) {
            const resProd = await db.query(
                'SELECT id_produto, nome_produto, preco_produto, quantidade_estoque FROM produto WHERE id_produto = $1 FOR UPDATE',
                [item.id_produto]
            );

            if (resProd.rows.length === 0) {
                throw new Error(`Produto ID ${item.id_produto} não encontrado.`);
            }

            const prodBanco = resProd.rows[0];
            if (Number(prodBanco.quantidade_estoque) < Number(item.quantidade)) {
                throw new Error(`Estoque insuficiente para ${prodBanco.nome_produto}. Disponível: ${prodBanco.quantidade_estoque}`);
            }

            const precoUnit = Number(prodBanco.preco_produto);
            valorTotal += precoUnit * Number(item.quantidade);

            itensValidados.push({
                id_produto: prodBanco.id_produto,
                quantidade: Number(item.quantidade),
                preco_unitario: precoUnit
            });
        }

        // 3. Insere o pedido na tabela 'pedido'
        const resPedido = await db.query(
            `INSERT INTO pedido (id_pessoa, id_forma_pagamento, status_pedido, valor_total)
             VALUES ($1, $2, 'pago', $3)
             RETURNING id_pedido, data_pedido, valor_total`,
            [id_pessoa, idFormaPagamento, valorTotal]
        );

        const pedidoCriado = resPedido.rows[0];

        // 4. Insere cada item em 'item_pedido' e dá baixa no estoque de 'produto'
        for (const item of itensValidados) {
            await db.query(
                `INSERT INTO item_pedido (id_pedido, id_produto, quantidade, preco_unitario)
                 VALUES ($1, $2, $3, $4)`,
                [pedidoCriado.id_pedido, item.id_produto, item.quantidade, item.preco_unitario]
            );

            await db.query(
                `UPDATE produto
                 SET quantidade_estoque = quantidade_estoque - $1
                 WHERE id_produto = $2`,
                [item.quantidade, item.id_produto]
            );
        }

        await db.query('COMMIT');

        res.status(201).json({
            status: 'ok',
            mensagem: 'Pedido registrado com sucesso!',
            pedido: pedidoCriado
        });

    } catch (erro) {
        await db.query('ROLLBACK');
        console.error('Erro ao registrar pedido:', erro);
        res.status(400).json({ erro: erro.message || 'Erro ao processar pedido.' });
    }
};