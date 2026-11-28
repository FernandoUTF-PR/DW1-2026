const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const produtoController = require('../controllers/produtoController');

// Configuração de armazenamento na pasta Loginux/imagens
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../imagens'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `prod_${Date.now()}${ext}`);
    }
});

const upload = multer({ storage });

// Middleware que garante que apenas 'gerente' ou 'funcionario' alterem produtos
const apenasAdmin = (req, res, next) => {
    const cookieBruto = req.cookies.usuarioLogado;
    if (!cookieBruto) {
        return res.status(401).json({ erro: 'Acesso negado. Faça login.' });
    }
    try {
        const sessao = JSON.parse(cookieBruto);
        const temPermissao = (sessao.papeis || []).some(p => p === 'gerente' || p === 'funcionario');
        if (!temPermissao) {
            return res.status(403).json({ erro: 'Apenas funcionários ou gerentes podem gerenciar produtos.' });
        }
        next();
    } catch {
        return res.status(401).json({ erro: 'Sessão inválida.' });
    }
};

// Rotas públicas (vitrine)
router.get('/', produtoController.listarProdutos);
router.get('/categorias', produtoController.listarCategorias);
router.get('/:id', produtoController.buscarProduto);

// Rotas administrativas (cadastro, edição e exclusão de produtos)
router.post('/', apenasAdmin, upload.single('imagem'), produtoController.criarProduto);
router.put('/:id', apenasAdmin, upload.single('imagem'), produtoController.atualizarProduto);
router.delete('/:id', apenasAdmin, produtoController.excluirProduto);

module.exports = router;