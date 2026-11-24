//import { query } from '../database.js';
const { query, transaction } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudPedido_has_produto = (req, res) => {
 // console.log('pedido_has_produtoController - Rota /abrirCrudPedido_has_produto - abrir o crudPedido_has_produto');
  if (!req.cookies.usuarioLogado) return res.redirect('/login');
  return res.redirect('/pedido/abrirCrudPedido');
}

exports.listarPedido_has_produtos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM pedido_has_produto ORDER BY pedido_id_pedido');
   // console.log('Resultado do SELECT:', result.rows);//verifica se está retornando algo
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pedido_has_produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


/////////////////////////////////////////////////////////////////////
// Função para criar um novo item de pedido
///////////////////////////////////////////////////////////////////// 
// Função para criar um novo item de pedido no banco de dados.
exports.criarPedido_has_produto = async (req, res) => {
  const pedidoId = Number(req.body.pedido_id_pedido);
  const produtoId = Number(req.body.produto_id_produto);
  const quantidade = Number(req.body.quantidade);
  if (!Number.isInteger(pedidoId) || pedidoId <= 0 || !Number.isInteger(produtoId) || produtoId <= 0 || !Number.isInteger(quantidade) || quantidade <= 0) {
    return res.status(400).json({ error: 'Pedido, produto e quantidade devem ser válidos.' });
  }
  try {
    const itemCriado = await transaction(async (client) => {
      const produtoResult = await client.query('SELECT quantidade_estoque_produto, preco_unitario_produto FROM produto WHERE id_produto = $1 FOR UPDATE', [produtoId]);
      if (!produtoResult.rows.length) {
        const error = new Error('Produto não encontrado.'); error.code = 'PRODUCT_NOT_FOUND'; throw error;
      }
      const produto = produtoResult.rows[0];
      if (Number(produto.quantidade_estoque_produto) < quantidade) {
        const error = new Error('Estoque insuficiente para este produto.'); error.code = 'INSUFFICIENT_STOCK'; throw error;
      }
      const result = await client.query(
        'INSERT INTO pedido_has_produto (pedido_id_pedido, produto_id_produto, quantidade, preco_unitario) VALUES ($1, $2, $3, $4) RETURNING *',
        [pedidoId, produtoId, quantidade, Number(produto.preco_unitario_produto)]
      );
      await client.query('UPDATE produto SET quantidade_estoque_produto = quantidade_estoque_produto - $1 WHERE id_produto = $2', [quantidade, produtoId]);
      return result.rows[0];
    });
    return res.status(201).json(itemCriado);
  } catch (error) {
    console.error('Erro ao criar item do pedido:', error);
    if (error.code === '23505') return res.status(409).json({ error: 'O item já existe no pedido. Use a atualização.' });
    if (error.code === '23503') return res.status(400).json({ error: 'Pedido ou produto não encontrado.' });
    if (['PRODUCT_NOT_FOUND', 'INSUFFICIENT_STOCK'].includes(error.code)) return res.status(400).json({ error: error.message });
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

/////////////////////////////////////////////////////////////////////
// função para obter itens de um pedido específico
/////////////////////////////////////////////////////////////////////

exports.obterItensDeUmPedido_has_produto = async (req, res) => {
  try {
    console.log("Requisição recebida para obter itens de um pedido especifico: rota pedido_has_produto/:idPedido");
    // 1. Extrai o ID do pedido dos parâmetros da requisição
    const { idPedido } = req.params;

    // 2. A query SQL com o parâmetro seguro ($1)
    const result = await query(
      'SELECT php.pedido_id_pedido , php.produto_id_produto , nome_produto , php.quantidade , php.preco_unitario' +
      ' FROM pedido_has_produto php, produto p ' +
      ' WHERE php.pedido_id_pedido = $1 and  php.produto_id_produto = p.id_produto ORDER BY php.produto_id_produto;',
      [idPedido]
    );

    // 4. Verifica se foram encontrados itens
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Nenhum item encontrado para este pedido.' });
    }

    // 5. Retorna os itens encontrados
    res.status(200).json(result.rows);

  } catch (error) {
    // 6. Em caso de erro, retorna uma mensagem de erro genérica
    console.error('Erro ao obter itens do pedido:', error);
    res.status(500).json({ message: 'Erro ao processar a requisição.', error: error.message });
  }
};

exports.obterPedido_has_produto = async (req, res) => {
  try {
    console.log("Requisição recebida para obter pedido_has_produto (chave composta): rota pedido_has_produto/:id_pedido/:id_produto");
    
    //chave composta id_pedido e id_produto
    const { id_pedido, id_produto } = req.params;
    const idPedido = parseInt(id_pedido);
    const idProduto = parseInt(id_produto);

    //console.log("estou no obter pedido_has_produto =>" + " IdPedido=" + idPedido + " idProduto= " + idProduto);
    // Verifica se ambos os IDs são números válidos
    if (isNaN(idPedido) || isNaN(idProduto)) {
      return res.status(400).json({ error: 'IDs devem ser números válidos' });
    }

    const result = await query(
      'SELECT php.pedido_id_pedido , php.produto_id_produto , nome_produto , php.quantidade , php.preco_unitario' +
      ' FROM pedido_has_produto php, produto p ' +
      ' WHERE php.pedido_id_pedido = $1 AND php.produto_id_produto=$2 AND php.produto_id_produto = p.id_produto;',
      [idPedido, idProduto]
    );

    //console.log(result)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido_has_produto não encontrado' });
    }

    res.json(result.rows); //retorna todos os itens do pedido
  } catch (error) {
    console.error('Erro ao obter pedido_has_produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarPedido_has_produto = async (req, res) => {
  const pedidoId = Number(req.params.id_pedido);
  const produtoId = Number(req.params.id_produto);
  if (!Number.isInteger(pedidoId) || pedidoId <= 0 || !Number.isInteger(produtoId) || produtoId <= 0) {
    return res.status(400).json({ error: 'IDs inválidos.' });
  }
  try {
    const atualizado = await transaction(async (client) => {
      const itemResult = await client.query('SELECT * FROM pedido_has_produto WHERE pedido_id_pedido = $1 AND produto_id_produto = $2 FOR UPDATE', [pedidoId, produtoId]);
      if (!itemResult.rows.length) {
        const error = new Error('Item do pedido não encontrado.'); error.code = 'NOT_FOUND'; throw error;
      }
      const atual = itemResult.rows[0];
      const quantidadeNova = req.body.quantidade === undefined ? Number(atual.quantidade) : Number(req.body.quantidade);
      const precoNovo = req.body.preco_unitario === undefined ? Number(atual.preco_unitario) : Number(req.body.preco_unitario);
      if (!Number.isInteger(quantidadeNova) || quantidadeNova <= 0 || !Number.isFinite(precoNovo) || precoNovo < 0) {
        const error = new Error('Quantidade ou preço inválido.'); error.code = 'INVALID_ITEM'; throw error;
      }
      const diferenca = quantidadeNova - Number(atual.quantidade);
      if (diferenca > 0) {
        const estoque = await client.query('SELECT quantidade_estoque_produto FROM produto WHERE id_produto = $1 FOR UPDATE', [produtoId]);
        if (!estoque.rows.length || Number(estoque.rows[0].quantidade_estoque_produto) < diferenca) {
          const error = new Error('Estoque insuficiente para aumentar a quantidade.'); error.code = 'INSUFFICIENT_STOCK'; throw error;
        }
      }
      const result = await client.query('UPDATE pedido_has_produto SET quantidade = $1, preco_unitario = $2 WHERE pedido_id_pedido = $3 AND produto_id_produto = $4 RETURNING *', [quantidadeNova, precoNovo, pedidoId, produtoId]);
      if (diferenca !== 0) {
        await client.query('UPDATE produto SET quantidade_estoque_produto = quantidade_estoque_produto - $1 WHERE id_produto = $2', [diferenca, produtoId]);
      }
      return result.rows[0];
    });
    return res.json(atualizado);
  } catch (error) {
    if (error.code === 'NOT_FOUND') return res.status(404).json({ error: error.message });
    if (['INVALID_ITEM', 'INSUFFICIENT_STOCK'].includes(error.code)) return res.status(400).json({ error: error.message });
    console.error('Erro ao atualizar item do pedido:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.deletarPedido_has_produto = async (req, res) => {
  const pedidoId = Number(req.params.id_pedido);
  const produtoId = Number(req.params.id_produto);
  if (!Number.isInteger(pedidoId) || pedidoId <= 0 || !Number.isInteger(produtoId) || produtoId <= 0) {
    return res.status(400).json({ error: 'IDs de pedido e produto inválidos.' });
  }
  try {
    await transaction(async (client) => {
      const item = await client.query('SELECT quantidade FROM pedido_has_produto WHERE pedido_id_pedido = $1 AND produto_id_produto = $2 FOR UPDATE', [pedidoId, produtoId]);
      if (!item.rows.length) {
        const error = new Error('Item do pedido não encontrado.'); error.code = 'NOT_FOUND'; throw error;
      }
      await client.query('DELETE FROM pedido_has_produto WHERE pedido_id_pedido = $1 AND produto_id_produto = $2', [pedidoId, produtoId]);
      await client.query('UPDATE produto SET quantidade_estoque_produto = quantidade_estoque_produto + $1 WHERE id_produto = $2', [Number(item.rows[0].quantidade), produtoId]);
    });
    return res.status(204).send();
  } catch (error) {
    if (error.code === 'NOT_FOUND') return res.status(404).json({ error: error.message });
    console.error('Erro ao excluir item do pedido:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// ... código anterior do controller ...

/////////////////////////////////////////////////////////////////////
// Função para criar múltiplos itens de pedido em lote 
///////////////////////////////////////////////////////////////////// 
exports.criarItensPedidoEmLote = async (req, res) => {
  const itens = req.body;
  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ error: 'Envie uma lista não vazia de itens.' });
  }
  try {
    const itensCriados = await transaction(async (client) => {
      const criados = [];
      for (const item of itens) {
        const pedidoId = Number(item.id_pedido);
        const produtoId = Number(item.id_produto);
        const quantidade = Number(item.quantidade);
        if (!Number.isInteger(pedidoId) || pedidoId <= 0 || !Number.isInteger(produtoId) || produtoId <= 0 || !Number.isInteger(quantidade) || quantidade <= 0) {
          const error = new Error('Pedido, produto e quantidade devem ser válidos.');
          error.code = 'INVALID_ITEM';
          throw error;
        }
        const produtoResult = await client.query('SELECT quantidade_estoque_produto, preco_unitario_produto FROM produto WHERE id_produto = $1 FOR UPDATE', [produtoId]);
        if (!produtoResult.rows.length) {
          const error = new Error(`Produto ${produtoId} não encontrado.`);
          error.code = 'PRODUCT_NOT_FOUND';
          throw error;
        }
        const produto = produtoResult.rows[0];
        if (Number(produto.quantidade_estoque_produto) < quantidade) {
          const error = new Error(`Estoque insuficiente para o produto ${produtoId}.`);
          error.code = 'INSUFFICIENT_STOCK';
          throw error;
        }
        const insert = await client.query(
          'INSERT INTO pedido_has_produto (pedido_id_pedido, produto_id_produto, quantidade, preco_unitario) VALUES ($1, $2, $3, $4) RETURNING *',
          [pedidoId, produtoId, quantidade, Number(produto.preco_unitario_produto)]
        );
        await client.query('UPDATE produto SET quantidade_estoque_produto = quantidade_estoque_produto - $1 WHERE id_produto = $2', [quantidade, produtoId]);
        criados.push(insert.rows[0]);
      }
      return criados;
    });
    return res.status(201).json({ message: `${itensCriados.length} itens inseridos com sucesso.`, itens_criados: itensCriados });
  } catch (error) {
    console.error('Erro ao inserir itens em lote:', error);
    if (['INVALID_ITEM', 'PRODUCT_NOT_FOUND', 'INSUFFICIENT_STOCK'].includes(error.code)) return res.status(400).json({ error: error.message });
    if (error.code === '23505') return res.status(409).json({ error: 'Um ou mais itens já existem no pedido.' });
    if (error.code === '23503') return res.status(400).json({ error: 'Pedido ou produto não encontrado.' });
    return res.status(500).json({ error: 'Erro interno ao inserir itens.' });
  }
};
