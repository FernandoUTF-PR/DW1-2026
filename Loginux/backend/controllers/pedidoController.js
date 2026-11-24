//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudPedido = (req, res) => {
  // console.log('pedidoController - Rota /abrirCrudPedido - abrir o crudPedido');
  
  const usuario = req.cookies.usuarioLogado; // O cookie deve conter o nome/ID do usuário
  
  // Se o cookie 'usuario' existe (o valor é uma string/nome do usuário)
  if (usuario) {
   res.sendFile(path.join(__dirname, '../../frontend/pedido/pedido.html'));   
  } else {
    // Cookie não existe. Usuário NÃO está logado.
    res.redirect('/login');
  }
  
}

exports.listarPedidos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM pedido ORDER BY id_pedido');
    //  console.log('Resultado do SELECT:', result.rows);//verifica se está retornando algo
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


exports.criarPedido = async (req, res) => {
  let usuarioLogado;
  try { usuarioLogado = JSON.parse(req.cookies.usuarioLogado || 'null'); } catch { usuarioLogado = null; }
  if (!usuarioLogado || !usuarioLogado.ehFuncionario || usuarioLogado.ehFuncionario.id_cargo < 0) {
    return res.status(403).json({ error: 'Apenas funcionários autenticados podem registrar pedidos internos.' });
  }
  try {
    const { id_pedido, data_pedido, cliente_pessoa_cpf_pessoa, funcionario_pessoa_cpf_pessoa } = req.body;

    const result = id_pedido === undefined || id_pedido === null || String(id_pedido).trim() === ''
      ? await query('INSERT INTO pedido (data_pedido, cliente_pessoa_cpf_pessoa, funcionario_pessoa_cpf_pessoa) VALUES ($1, $2, $3) RETURNING *', [data_pedido || null, cliente_pessoa_cpf_pessoa, funcionario_pessoa_cpf_pessoa])
      : await query('INSERT INTO pedido (id_pedido, data_pedido, cliente_pessoa_cpf_pessoa, funcionario_pessoa_cpf_pessoa) VALUES ($1, $2, $3, $4) RETURNING *', [Number(id_pedido), data_pedido || null, cliente_pessoa_cpf_pessoa, funcionario_pessoa_cpf_pessoa]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);



    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// FUNÇÃO 2: CRIAR PEDIDO ONLINE (E-COMMERCE - Utiliza CPF de Funcionário Padrão)
exports.criarPedidoOnline = async (req, res) => {
  const cpfFuncionario = '00000000000';
  let usuarioLogado;
  try { usuarioLogado = JSON.parse(req.cookies.usuarioLogado || 'null'); } catch { usuarioLogado = null; }
  if (!usuarioLogado || usuarioLogado.ehCliente !== true || !usuarioLogado.cpf_pessoa) {
    return res.status(401).json({ error: 'Entre em uma conta de cliente para realizar o pedido.' });
  }
  const { data_pedido, cliente_pessoa_cpf_pessoa, itens } = req.body || {};
  if (String(cliente_pessoa_cpf_pessoa || '') !== String(usuarioLogado.cpf_pessoa)) {
    return res.status(403).json({ error: 'O pedido só pode ser feito para o cliente autenticado.' });
  }
  if (!cliente_pessoa_cpf_pessoa || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ error: 'Cliente e ao menos um item são obrigatórios.' });
  }

  try {
    const pedidoCriado = await require('../database').transaction(async (client) => {
      const pedidoResult = await client.query(
        'INSERT INTO pedido (data_pedido, cliente_pessoa_cpf_pessoa, funcionario_pessoa_cpf_pessoa) VALUES (COALESCE($1::date, CURRENT_DATE), $2, $3) RETURNING *',
        [data_pedido || null, String(cliente_pessoa_cpf_pessoa), cpfFuncionario]
      );
      const pedido = pedidoResult.rows[0];
      let valorTotal = 0;
      const itensCriados = [];

      for (const item of itens) {
        const produtoId = Number(item.id_produto);
        const quantidade = Number(item.quantidade);
        if (!Number.isInteger(produtoId) || produtoId <= 0 || !Number.isInteger(quantidade) || quantidade <= 0) {
          const error = new Error('Produto ou quantidade inválida.');
          error.code = 'INVALID_ITEM';
          throw error;
        }
        const produtoResult = await client.query(
          'SELECT id_produto, nome_produto, quantidade_estoque_produto, preco_unitario_produto FROM produto WHERE id_produto = $1 FOR UPDATE',
          [produtoId]
        );
        if (!produtoResult.rows.length) {
          const error = new Error(`Produto ${produtoId} não encontrado.`);
          error.code = 'PRODUCT_NOT_FOUND';
          throw error;
        }
        const produto = produtoResult.rows[0];
        if (Number(produto.quantidade_estoque_produto) < quantidade) {
          const error = new Error(`Estoque insuficiente para ${produto.nome_produto}. Disponível: ${produto.quantidade_estoque_produto}.`);
          error.code = 'INSUFFICIENT_STOCK';
          throw error;
        }
        const preco = Number(produto.preco_unitario_produto);
        valorTotal += preco * quantidade;
        const itemResult = await client.query(
          'INSERT INTO pedido_has_produto (produto_id_produto, pedido_id_pedido, quantidade, preco_unitario) VALUES ($1, $2, $3, $4) RETURNING *',
          [produtoId, pedido.id_pedido, quantidade, preco]
        );
        await client.query(
          'UPDATE produto SET quantidade_estoque_produto = quantidade_estoque_produto - $1 WHERE id_produto = $2',
          [quantidade, produtoId]
        );
        itensCriados.push(itemResult.rows[0]);
      }
      return { ...pedido, valor_total: Number(valorTotal.toFixed(2)), itens: itensCriados };
    });
    return res.status(201).json(pedidoCriado);
  } catch (error) {
    console.error('Erro ao criar pedido online:', error);
    if (['INVALID_ITEM', 'PRODUCT_NOT_FOUND', 'INSUFFICIENT_STOCK'].includes(error.code)) {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === '23503') return res.status(400).json({ error: 'Cliente ou funcionário padrão não encontrado.' });
    return res.status(500).json({ error: 'Erro interno do servidor ao criar pedido.' });
  }
};

exports.obterPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // console.log("estou no obter pedido id="+ id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM pedido WHERE id_pedido = $1',
      [id]
    );

    //console.log(result)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const { data_pedido, cliente_pessoa_cpf_pessoa, funcionario_pessoa_cpf_pessoa } = req.body;

    // Verifica se o pedido existe
    const existing = await query('SELECT * FROM pedido WHERE id_pedido = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    // Atualiza o pedido
    const sql = `
      UPDATE pedido
      SET data_pedido = $1,
          cliente_pessoa_cpf_pessoa = $2,
          funcionario_pessoa_cpf_pessoa = $3
      WHERE id_pedido = $4
      RETURNING *
    `;
    const values = [data_pedido, cliente_pessoa_cpf_pessoa, funcionario_pessoa_cpf_pessoa, id];

    const updateResult = await query(sql, values);
    return res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};


exports.deletarPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Verifica se a pedido existe
    const existingPersonResult = await query(
      'SELECT * FROM pedido WHERE id_pedido = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrada' });
    }

    // Deleta a pedido (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM pedido WHERE id_pedido = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pedido:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar pedido com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


