DROP TABLE if exists pessoa;

CREATE TABLE pessoa (
    id_pessoa SERIAL PRIMARY KEY,
    nome_pessoa VARCHAR(100) NOT NULL,
    email_pessoa VARCHAR(150) UNIQUE NOT NULL,
    senha_pessoa VARCHAR(255) NOT NULL,
    primeiro_acesso_pessoa BOOLEAN DEFAULT TRUE,
    data_nascimento_pessoa DATE
);