const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

// 🔧 Middlewares essenciais
app.use(express.json());
app.use(cookieParser()); // 🔑 necessário para ler req.cookies

// 🔧 Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// 🔧 Rotas
const loginRoutes = require('./routes/loginRoutes');
app.use('/login', loginRoutes);

// 🔧 Rota protegida de exemplo
app.get('/menu', (req, res) => {
    if (!req.cookies.usuarioLogado) {
        return res.redirect('/login/login.html');
    }
    res.sendFile(path.join(__dirname, '../frontend/menu/menu.html'));
});

app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});