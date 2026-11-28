const db = require('../database.js');

// LISTAR PRODUTOS ATIVOS (para vitrine e painel admin)
exports.listarProdutos = async (req, res) => {
    try {
        const sql = `
            SELECT
                p.id_produto,
                p.nome_produto,
                p.descricao_produto,
                p.preco_produto,
                p.quantidade_estoque,
                p.unidade_produto,
                p.imagem_produto,
                p.id_categoria,
                c.nome_categoria
            FROM produto p
            LEFT JOIN categoria_produto c
                ON p.id_categoria = c.id_categoria
            WHERE p.ativo_produto = TRUE
            ORDER BY p.id_produto DESC;
        `;

        const resultado = await db.query(sql);
        res.json(resultado.rows);
    } catch (erro) {
        console.error('Erro ao buscar produtos:', erro);
        res.status(500).json({ erro: 'Erro ao consultar produtos.' });
    }
};

// LISTAR CATEGORIAS (para preencher o select no painel admin)
exports.listarCategorias = async (req, res) => {
    try {
        const resultado = await db.query(
            'SELECT id_categoria, nome_categoria FROM categoria_produto ORDER BY nome_categoria;'
        );
        res.json(resultado.rows);
    } catch (erro) {
        console.error('Erro ao buscar categorias:', erro);
        res.status(500).json({ erro: 'Erro ao consultar categorias.' });
    }
};

// BUSCAR UM PRODUTO PELO ID
exports.buscarProduto = async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await db.query(
            `SELECT * FROM produto WHERE id_produto = $1 AND ativo_produto = TRUE`,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: 'Produto não encontrado.' });
        }

        res.json(resultado.rows[0]);
    } catch (erro) {
        console.error('Erro ao buscar produto:', erro);
        res.status(500).json({ erro: 'Erro ao consultar produto.' });
    }
};

// CADASTRAR NOVO PRODUTO (Admin)
exports.criarProduto = async (req, res) => {
    try {
        const {
            nome_produto,
            descricao_produto,
            preco_produto,
            quantidade_estoque,
            unidade_produto,
            id_categoria
        } = req.body;

        if (!nome_produto || preco_produto === undefined) {
            return res.status(400).json({ erro: 'Nome e preço são obrigatórios.' });
        }

        const imagem_produto = req.file ? req.file.filename : null;

        const sql = `
            INSERT INTO produto (
                nome_produto,
                descricao_produto,
                preco_produto,
                quantidade_estoque,
                unidade_produto,
                imagem_produto,
                id_categoria,
                ativo_produto
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
            RETURNING *;
        `;

        const valores = [
            nome_produto,
            descricao_produto || '',
            Number(preco_produto),
            Number(quantidade_estoque || 0),
            unidade_produto || 'un',
            imagem_produto,
            id_categoria ? Number(id_categoria) : null
        ];

        const resultado = await db.query(sql, valores);
        res.status(201).json(resultado.rows[0]);
    } catch (erro) {
        console.error('Erro ao criar produto:', erro);
        res.status(500).json({ erro: 'Erro ao cadastrar produto.' });
    }
};

// ATUALIZAR PRODUTO EXISTENTE (Admin)
exports.atualizarProduto = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nome_produto,
            descricao_produto,
            preco_produto,
            quantidade_estoque,
            unidade_produto,
            id_categoria
        } = req.body;

        const atual = await db.query('SELECT imagem_produto FROM produto WHERE id_produto = $1', [id]);
        if (atual.rows.length === 0) {
            return res.status(404).json({ erro: 'Produto não encontrado.' });
        }

        // Mantém a imagem anterior se o admin não enviou uma nova foto
        const imagem_produto = req.file ? req.file.filename : atual.rows[0].imagem_produto;

        const sql = `
            UPDATE produto
            SET nome_produto = $1,
                descricao_produto = $2,
                preco_produto = $3,
                quantidade_estoque = $4,
                unidade_produto = $5,
                imagem_produto = $6,
                id_categoria = $7
            WHERE id_produto = $8
            RETURNING *;
        `;

        const valores = [
            nome_produto,
            descricao_produto || '',
            Number(preco_produto),
            Number(quantidade_estoque || 0),
            unidade_produto || 'un',
            imagem_produto,
            id_categoria ? Number(id_categoria) : null,
            id
        ];

        const resultado = await db.query(sql, valores);
        res.json(resultado.rows[0]);
    } catch (erro) {
        console.error('Erro ao atualizar produto:', erro);
        res.status(500).json({ erro: 'Erro ao atualizar produto.' });
    }
};

// EXCLUIR PRODUTO (Exclusão lógica para preservar histórico de pedidos)
exports.excluirProduto = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE produto SET ativo_produto = FALSE WHERE id_produto = $1', [id]);
        res.json({ status: 'ok', mensagem: 'Produto removido do cardápio.' });
    } catch (erro) {
        console.error('Erro ao excluir produto:', erro);
        res.status(500).json({ erro: 'Erro ao excluir produto.' });
    }
};