DROP TABLE IF exists pessoa, login, sign_up, papeis, usuarios;

CREATE TABLE pessoa (
    id_pessoa SERIAL PRIMARY KEY,
    nome_pessoa VARCHAR(100) NOT NULL,
    email_pessoa VARCHAR(150) UNIQUE NOT NULL,
    senha_pessoa VARCHAR(255) NOT NULL,
    primeiro_acesso_pessoa BOOLEAN DEFAULT TRUE,
    data_nascimento_pessoa DATE
);

CREATE TABLE login (
    id_login SERIAL PRIMARY KEY,
    email_pessoa VARCHAR(150) NOT NULL,
    senha_pessoa VARCHAR(255) NOT NULL
);

CREATE TABLE sign_up (
    id_signup SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    data_nascimento DATE
);

CREATE TABLE usuarios (
    id_user SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_login INTEGER REFERENCES login(id_login)
);

CREATE TABLE papeis (
    id_papeis SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    descricao VARCHAR(255),
    id_user INTEGER REFERENCES usuarios(id_user)
);
