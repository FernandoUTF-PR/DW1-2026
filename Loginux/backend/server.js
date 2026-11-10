const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
// 🔧 Fazer npm install express, npm install cookie-parser, npm install path
const app = express();

// 🔧 Middlewares essenciais
app.use(express.json());
app.use(cookieParser()); // 🔑 necessário para ler req.cookies

// 🔧 Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// 🔧 Rotas
const loginRoutes = require('./routes/loginRoutes');
app.use('/login', loginRoutes);

const verificarLogin = (req, res, next) => {
    if (!req.cookies.usuarioLogado) {
        return res.redirect('/login/login.html');
    }
    next();
}

const menuRoutes = require('./routes/menuRoutes');
app.use('/menu', verificarLogin, menuRoutes);

app.listen(3001, () => {
    console.log('Servidor rodando em http://localhost:3001');
});