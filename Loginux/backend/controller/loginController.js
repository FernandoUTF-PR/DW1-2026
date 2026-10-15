const bcrypt = require('bcrypt');
const db = require('../database.js');

// 🔹 Verifica se o e-mail existe e retorna o nome
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

// 🔹 Valida a senha e cria o cookie de sessão
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

        const { nome_pessoa, senha_pessoa } = resultPessoa.rows[0];
        const senhaBanco = senha_pessoa || '';

        // Suporta senha com hash (bcrypt) ou texto puro
        let senhaValida = false;
        if (senhaBanco.startsWith('$2b$') || senhaBanco.startsWith('$2a$')) {
            senhaValida = await bcrypt.compare(senha, senhaBanco);
        } else {
            senhaValida = (senha === senhaBanco);
        }

        if (!senhaValida) {
            return res.json({ status: 'senha_incorreta' });
        }

        // 🔐 Cria o cookie de sessão
        res.cookie('usuarioLogado', nome_pessoa, {
            sameSite: 'Lax',
            secure: false,       // true apenas em HTTPS
            httpOnly: true,      // JavaScript do cliente não acessa
            path: '/',
            maxAge: 24 * 60 * 60 * 1000, // 24 horas
        });

        return res.json({ status: 'ok', nome: nome_pessoa });

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

// 🔹 Verifica se o usuário está logado (útil para proteger rotas)
exports.verificaSeUsuarioEstaLogado = (req, res) => {
    const nome = req.cookies.usuarioLogado;

    if (nome) {
        res.json({ status: 'ok', nome });
    } else {
        res.json({ status: 'nao_logado' });
    }
};

// 🔹 Cadastro de nova pessoa (com hash de senha)
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
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};