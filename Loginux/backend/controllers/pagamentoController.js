const db = require('../database');
const { query, transaction } = db;
const path = require('path');

exports.abrirTelaPagamento = (req, res) => {
  if (!req.cookies.usuarioLogado) return res.redirect('/login');
  return res.sendFile(path.join(__dirname, '../../frontend/visaoCliente/pagamento/pagamento.html'));
};

exports.abrirCrudPagamento = (req, res) => {
  if (!req.cookies.usuarioLogado) return res.redirect('/login');
  return res.status(404).json({ error: 'A tela administrativa de pagamentos não está disponível neste projeto.' });
};

exports.listarPagamentos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM pagamento ORDER BY pedido_id_pedido');
    return res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.criarPagamento = async (req, res) => {
  try {
    const { pedido_id_pedido, valor_total_pagamento, data_pagamento } = req.body;
    const total = Number(valor_total_pagamento);
    if (!pedido_id_pedido || !Number.isFinite(total) || total <= 0) {
      return res.status(400).json({ error: 'Pedido e valor total válido são obrigatórios.' });
    }
    const result = await query(
      'INSERT INTO pagamento (pedido_id_pedido, data_pagamento, valor_total_pagamento) VALUES ($1, COALESCE($2, NOW()), $3) RETURNING *',
      [pedido_id_pedido, data_pagamento || null, total]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    const status = ['23503', '23505', '23502'].includes(error.code) ? 409 : 500;
    return res.status(status).json({ error: status === 409 ? 'Pedido inexistente ou pagamento já registrado.' : 'Erro interno do servidor' });
  }
};

exports.criarPagamentoParaPedido = async (req, res) => {
  let usuarioLogado;
  try { usuarioLogado = JSON.parse(req.cookies.usuarioLogado || 'null'); } catch { usuarioLogado = null; }
  if (!usuarioLogado || !usuarioLogado.cpf_pessoa) {
    return res.status(401).json({ sucesso: false, mensagem: 'Entre na sua conta para concluir o pagamento.' });
  }
  const pedidoId = Number(req.params.id);
  const { valorTotal, formasPagamento } = req.body || {};
  const total = Number(valorTotal);

  if (!Number.isInteger(pedidoId) || pedidoId <= 0 || !Number.isFinite(total) || total <= 0) {
    return res.status(400).json({ sucesso: false, mensagem: 'Pedido e valor total devem ser válidos.' });
  }
  if (!Array.isArray(formasPagamento) || formasPagamento.length === 0) {
    return res.status(400).json({ sucesso: false, mensagem: 'Informe ao menos uma forma de pagamento.' });
  }

  const formas = formasPagamento.map((item) => ({
    id: Number(item.tipo),
    valor: Number(item.valor)
  }));
  if (formas.some((item) => !Number.isInteger(item.id) || item.id <= 0 || !Number.isFinite(item.valor) || item.valor <= 0)) {
    return res.status(400).json({ sucesso: false, mensagem: 'Há uma forma ou valor de pagamento inválido.' });
  }
  const somaCentavos = formas.reduce((soma, item) => soma + Math.round(item.valor * 100), 0);
  if (somaCentavos !== Math.round(total * 100)) {
    return res.status(400).json({ sucesso: false, mensagem: 'A soma das formas de pagamento deve ser igual ao total do pedido.' });
  }

  try {
    const pedidoDoUsuario = await query(
      'SELECT id_pedido FROM pedido WHERE id_pedido = $1 AND cliente_pessoa_cpf_pessoa = $2',
      [pedidoId, String(usuarioLogado.cpf_pessoa)]
    );
    if (!pedidoDoUsuario.rows.length) {
      return res.status(403).json({ sucesso: false, mensagem: 'Pedido não pertence ao usuário autenticado.' });
    }
    const resultado = await transaction(async (client) => {
      const pagamento = await client.query(
        'INSERT INTO pagamento (pedido_id_pedido, data_pagamento, valor_total_pagamento) VALUES ($1, NOW(), $2) RETURNING *',
        [pedidoId, total]
      );
      const formasInseridas = [];
      for (const forma of formas) {
        const inserida = await client.query(
          'INSERT INTO pagamento_has_forma_pagamento (pagamento_id_pedido, forma_pagamento_id_forma_pagamento, valor_pago) VALUES ($1, $2, $3) RETURNING *',
          [pedidoId, forma.id, forma.valor]
        );
        formasInseridas.push(inserida.rows[0]);
      }
      return { pagamento: pagamento.rows[0], formas_pagamento: formasInseridas };
    });
    return res.status(201).json({ sucesso: true, status: 'ok', mensagem: 'Pagamento realizado com sucesso!', ...resultado });
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    const status = ['23503', '23505', '23502'].includes(error.code) ? 409 : 500;
    const mensagem = error.code === '23505' ? 'Este pedido já possui um pagamento.'
      : error.code === '23503' ? 'Pedido ou forma de pagamento não encontrado.'
      : status === 409 ? 'Dados obrigatórios ou relacionados inválidos.' : 'Erro interno do servidor.';
    return res.status(status).json({ sucesso: false, mensagem });
  }
};

exports.obterPagamento = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID deve ser um número válido' });
  try {
    const result = await query('SELECT * FROM pagamento WHERE pedido_id_pedido = $1', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Pagamento não encontrado' });
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pagamento:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.atualizarPagamento = async (req, res) => {
  const id = Number(req.params.id);
  const total = req.body.valor_total_pagamento === undefined ? null : Number(req.body.valor_total_pagamento);
  if (!Number.isInteger(id) || id <= 0 || (total !== null && (!Number.isFinite(total) || total <= 0))) {
    return res.status(400).json({ error: 'ID ou valor total inválido' });
  }
  try {
    const result = await query(
      'UPDATE pagamento SET valor_total_pagamento = COALESCE($1, valor_total_pagamento), data_pagamento = COALESCE($2, data_pagamento) WHERE pedido_id_pedido = $3 RETURNING *',
      [total, req.body.data_pagamento || null, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Pagamento não encontrado' });
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.deletarPagamento = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID deve ser um número válido' });
  try {
    await transaction(async (client) => {
      await client.query('DELETE FROM pagamento_has_forma_pagamento WHERE pagamento_id_pedido = $1', [id]);
      const result = await client.query('DELETE FROM pagamento WHERE pedido_id_pedido = $1 RETURNING pedido_id_pedido', [id]);
      if (!result.rows.length) {
        const error = new Error('Pagamento não encontrado');
        error.code = 'NOT_FOUND';
        throw error;
      }
    });
    return res.status(204).send();
  } catch (error) {
    if (error.code === 'NOT_FOUND') return res.status(404).json({ error: error.message });
    console.error('Erro ao deletar pagamento:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
