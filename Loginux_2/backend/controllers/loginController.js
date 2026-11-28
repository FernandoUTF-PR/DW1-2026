const bcrypt = require('bcrypt');
const db = require('../database.js');

// 🔹 ETAPA 1: Verifica se o e-mail existe e retorna o nome
exports.verificarEmail = async (req, res) => {
    const { email } = req.body;
    const sql = 'SELECT nome_pessoa FROM pessoa WHERE email_pessoa = $1';

    try {
        const result = await db.query(sql, [email]);

        if (result.rows.length > 0) {
            return res.json({
                status: 'existe',
                nome: result.rows[0].nome_pessoa
            });
        }

        res.json({ status: 'nao_encontrado' });
    } catch (err) {
        console.error('Erro em verificarEmail:', err);
        res.status(500).json({ status: 'erro', mensagem: err.message });
    }
};

// 🔹 ETAPA 2: Valida a senha, busca papéis (cliente/funcionario/gerente) e cria cookie
exports.verificarSenha = async (req, res) => {
    const { email, senha } = req.body;

    const sqlPessoa = `
        SELECT id_pessoa, nome_pessoa, senha_pessoa 
        FROM pessoa 
        WHERE email_pessoa = $1
    `;

    try {
        const resultPessoa = await db.query(sqlPessoa, [email]);

        if (resultPessoa.rows.length === 0) {
            return res.json({ status: 'senha_incorreta' });
        }

        const { id_pessoa, nome_pessoa, senha_pessoa } = resultPessoa.rows[0];
        const senhaBanco = senha_pessoa || '';

        let senhaValida = false;
        if (senhaBanco.startsWith('$2b$') || senhaBanco.startsWith('$2a$')) {
            senhaValida = await bcrypt.compare(senha, senhaBanco);
        } else {
            senhaValida = (senha === senhaBanco);
        }

        if (!senhaValida) {
            return res.json({ status: 'senha_incorreta' });
        }

        // Busca os papéis do usuário no banco
        const sqlPapeis = `
            SELECT pa.nome_papel
            FROM pessoa_papel pp
            INNER JOIN papel pa ON pp.id_papel = pa.id_papel
            WHERE pp.id_pessoa = $1
        `;
        const resultPapeis = await db.query(sqlPapeis, [id_pessoa]);
        const papeis = resultPapeis.rows.map(r => r.nome_papel);

        const dadosSessao = JSON.stringify({
            id_pessoa,
            nome: nome_pessoa,
            papeis
        });

        res.cookie('usuarioLogado', dadosSessao, {
            sameSite: 'Lax',
            secure: false,
            httpOnly: true,
            path: '/',
            maxAge: 24 * 60 * 60 * 1000,
        });

        return res.json({
            status: 'ok',
            id_pessoa,
            nome: nome_pessoa,
            papeis
        });

    } catch (err) {
        console.error('Erro ao verificar senha:', err);
        return res.status(500).json({ status: 'erro', mensagem: err.message });
    }
};

// 🔹 Logout: remove o cookie
exports.logout = (req, res) => {
    res.clearCookie('usuarioLogado', {
        sameSite: 'Lax',
        secure: false,
        httpOnly: true,
        path: '/',
    });
    res.json({ status: 'deslogado' });
};

// 🔹 Verifica se o usuário está logado
exports.verificaSeUsuarioEstaLogado = (req, res) => {
    const cookieBruto = req.cookies.usuarioLogado;

    if (!cookieBruto) {
        return res.json({ status: 'nao_logado' });
    }

    try {
        const sessao = JSON.parse(cookieBruto);
        res.json({ status: 'ok', ...sessao });
    } catch {
        res.json({ status: 'ok', nome: cookieBruto, papeis: ['cliente'] });
    }
};

// 🔹 ETAPA 3: Cadastro de nova pessoa (a trigger no Postgres já atribui papel 'cliente')
exports.criarPessoa = async (req, res) => {
    try {
        const { nome_pessoa, email_pessoa, senha_pessoa } = req.body;

        if (!nome_pessoa || !email_pessoa || !senha_pessoa) {
            return res.status(400).json({
                error: 'Nome, email e senha são obrigatórios'
            });
        }

        const senhaHash = await bcrypt.hash(senha_pessoa, 10);

        const result = await db.query(
            `INSERT INTO pessoa (nome_pessoa, email_pessoa, senha_pessoa) 
             VALUES ($1, $2, $3) RETURNING id_pessoa, nome_pessoa, email_pessoa`,
            [nome_pessoa, email_pessoa, senhaHash]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar pessoa:', error);
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};