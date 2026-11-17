const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');
const produtoRoutes = require('./routes/produtoRoutes');


// 🔧 Fazer npm install express, npm install cookie-parser, npm install path, npm install cors
const app = express();
// CORS - Permitir acesso pelo servidor principal
/*
app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true
}));

// CORS - Permitir acesso pelo Live Server
app.use(cors({
    origin: 'http://127.0.0.1:5501',
    credentials: true
}));
*/

app.use((req, res, next) => {

    const origemPermitida = [
        'http://localhost:3001',
        'http://127.0.0.1:5501'
    ];

    const origem = req.headers.origin;

    if (origemPermitida.includes(origem)) {
        res.header('Access-Control-Allow-Origin', origem);
        res.header('Access-Control-Allow-Credentials', 'true');
    }

    res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
    );

    res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
    );

    res.header('Vary', 'Origin');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();

});

// 🔧 Middlewares essenciais
app.use(express.json());
app.use(cookieParser()); // 🔑 necessário para ler req.cookies
app.use('/produto', produtoRoutes);
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