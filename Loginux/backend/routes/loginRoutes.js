const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');

router.post('/verificarEmail', loginController.verificarEmail);
router.post('/verificarSenha', loginController.verificarSenha);
router.post('/logout', loginController.logout);
router.get('/verificaLogado', loginController.verificaSeUsuarioEstaLogado);
router.post('/cadastrar', loginController.criarPessoa);

module.exports = router;