
// menuController.js
const path = require('path');

exports.abrirMenu = (req, res) => {
 //   console.log('menuController - Rota / - Menu Acessando menu.html');

    const usuario = req.cookies.usuarioLogado; // aqui o backend lê o cookie
    // Se o cookie 'usuario' existe (o valor é uma string/nome do usuário)
    if (usuario) {
        res.sendFile(path.join(__dirname, '../../frontend/menu.html'));
    } else {
        // Cookie não existe. Usuário NÃO está logado.
        res.redirect('/login');
    }

};


exports.logout = (req, res) => {
    // Implementação da rota logout
    res.send('Rota logout');
};