
const db = require('../database.js');

// LISTAR PRODUTOS
exports.listarProdutos = async (req, res) => {

    try {

        const sql = `
            SELECT
                p.id_produto,
                p.nome_produto,
                p.descricao_produto,
                p.preco_produto,
                p.quantidade_estoque,
                p.imagem_produto,
                c.nome_categoria
            FROM produto p
            LEFT JOIN categoria_produto c
                ON p.id_categoria = c.id_categoria
            WHERE p.ativo_produto = TRUE
            ORDER BY p.nome_produto;
        `;

        const resultado = await db.query(sql);

        res.json(resultado.rows);

    } catch (erro) {

        console.error('Erro ao buscar produtos:', erro);

        res.status(500).json({
            erro: 'Erro ao consultar produtos.'
        });

    }

};


// BUSCAR UM PRODUTO PELO ID
exports.buscarProduto = async (req, res) => {

    try {

        const { id } = req.params;

        const resultado = await db.query(
            `SELECT * FROM produto
             WHERE id_produto = $1
             AND ativo_produto = TRUE`,
            [id]
        );

        if (resultado.rows.length === 0) {

            return res.status(404).json({
                erro: 'Produto não encontrado.'
            });

        }

        res.json(resultado.rows[0]);

    } catch (erro) {

        console.error('Erro ao buscar produto:', erro);

        res.status(500).json({
            erro: 'Erro ao consultar produto.'
        });

    }

};
