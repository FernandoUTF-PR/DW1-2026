function verificaAutenticacao(req, res, next) {
    const usuario = req.cookies ? req.cookies.usuarioLogado : null;

    if (usuario) {
        req.usuario = usuario;
        return next();
    }

    // Se for requisição de API, retorna 401
    if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(401).json({ error: 'Não autenticado' });
    }

    // Se for navegação, redireciona para o login
    res.redirect('/login/login.html');
}

module.exports = verificaAutenticacao;