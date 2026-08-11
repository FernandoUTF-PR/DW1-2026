no postgresql

--Crie um banco de dados chamado dw1-db-2026

--Neste banco de dados, crie uma tabela chamada produto (em public).



CREATE TABLE public.produto (
    id_produto SERIAL PRIMARY KEY,
    nome_produto VARCHAR(60) NOT NULL,
    quantidade_produto INT NOT NULL,
    quantidade_minima_produto INT NOT NULL,
    quantidade_maxima_produto INT NOT NULL
);

INSERT INTO public.produto (nome_produto, quantidade_produto, quantidade_minima_produto, quantidade_maxima_produto) VALUES 
('Armas funcionais', 250, 350, 1050),
('Comida (em kg)', 30, 50, 100),
('Munição de diversas armas', 7000, 10000, 15000),
('Tropas', 18000, 20000, 50000);

CREATE TABLE public.produtoPais (
    id_capital VARCHAR(100) PRIMARY KEY,
    nome_pais VARCHAR(60) NOT NULL,
    quantidade_soldado INT NOT NULL,
    quantidade_minima_soldado INT NOT NULL,
    quantidade_maxima_soldado INT NOT NULL
);

INSERT INTO public.produtoPais (id_capital, nome_pais, quantidade_soldado, quantidade_minima_soldado, quantidade_maxima_soldado) VALUES 
('Jerusalém', 'Israel', 25000, 30500, 105000),
('Washington D.C', 'E.U.A', 30000, 50000, 100000),
('Buenos Aires', 'Argentina', 70001, 100001, 105001),
('Brasília', 'Brasil', 18001, 20001, 50001);