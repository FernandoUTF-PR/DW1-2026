
-- ==========================================
-- 1. CADASTRO DE PESSOAS
-- ==========================================

CREATE TABLE IF NOT EXISTS pessoa (
    id_pessoa SERIAL PRIMARY KEY,
    nome_pessoa VARCHAR(100) NOT NULL,
    email_pessoa VARCHAR(150) UNIQUE NOT NULL,
    senha_pessoa VARCHAR(255) NOT NULL,
    primeiro_acesso_pessoa BOOLEAN DEFAULT TRUE,
    data_nascimento_pessoa DATE
);

-- ==========================================
-- 2. PAPÉIS DOS USUÁRIOS
-- ==========================================

CREATE TABLE IF NOT EXISTS papel (
    id_papel SERIAL PRIMARY KEY,
    nome_papel VARCHAR(50) UNIQUE NOT NULL,
    descricao_papel VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS pessoa_papel (
    id_pessoa INTEGER REFERENCES pessoa(id_pessoa)
        ON DELETE CASCADE,
    id_papel INTEGER REFERENCES papel(id_papel),
    PRIMARY KEY (id_pessoa, id_papel)
);

-- Papéis iniciais

INSERT INTO papel (nome_papel, descricao_papel)
VALUES
('cliente', 'Pessoa que realiza compras'),
('funcionario', 'Funcionário da padaria'),
('gerente', 'Gerencia o sistema e os cadastros')
ON CONFLICT (nome_papel) DO NOTHING;

-- ==========================================
-- 3. CATEGORIAS DE PRODUTOS
-- ==========================================

CREATE TABLE IF NOT EXISTS categoria_produto (
    id_categoria SERIAL PRIMARY KEY,
    nome_categoria VARCHAR(100) UNIQUE NOT NULL,
    descricao_categoria VARCHAR(255)
);

-- ==========================================
-- 4. PRODUTOS
-- ==========================================

CREATE TABLE IF NOT EXISTS produto (
    id_produto SERIAL PRIMARY KEY,
    nome_produto VARCHAR(150) NOT NULL,
    descricao_produto TEXT,
    preco_produto NUMERIC(10,2) NOT NULL
        CHECK (preco_produto >= 0),
    quantidade_estoque INTEGER DEFAULT 0
        CHECK (quantidade_estoque >= 0),
    imagem_produto VARCHAR(255),
    ativo_produto BOOLEAN DEFAULT TRUE,
    id_categoria INTEGER REFERENCES categoria_produto(id_categoria)
);

-- ==========================================
-- 5. FORMAS DE PAGAMENTO
-- ==========================================

CREATE TABLE IF NOT EXISTS forma_pagamento (
    id_forma_pagamento SERIAL PRIMARY KEY,
    nome_forma_pagamento VARCHAR(100) UNIQUE NOT NULL,
    ativo_forma_pagamento BOOLEAN DEFAULT TRUE
);

-- ==========================================
-- 6. PEDIDOS
-- ==========================================

CREATE TABLE IF NOT EXISTS pedido (
    id_pedido SERIAL PRIMARY KEY,
    id_pessoa INTEGER REFERENCES pessoa(id_pessoa),
    id_forma_pagamento INTEGER
        REFERENCES forma_pagamento(id_forma_pagamento),
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_pedido VARCHAR(30) DEFAULT 'carrinho'
        CHECK (
            status_pedido IN (
                'carrinho',
                'aguardando_pagamento',
                'pago',
                'em_preparo',
                'pronto',
                'entregue',
                'cancelado'
            )
        ),
    valor_total NUMERIC(10,2) DEFAULT 0
        CHECK (valor_total >= 0)
);

-- ==========================================
-- 7. ITENS DO PEDIDO
-- ==========================================

CREATE TABLE IF NOT EXISTS item_pedido (
    id_item SERIAL PRIMARY KEY,
    id_pedido INTEGER NOT NULL
        REFERENCES pedido(id_pedido) ON DELETE CASCADE,
    id_produto INTEGER NOT NULL
        REFERENCES produto(id_produto),
    quantidade INTEGER NOT NULL
        CHECK (quantidade > 0),
    preco_unitario NUMERIC(10,2) NOT NULL
        CHECK (preco_unitario >= 0)
);

-- ==========================================
-- 8. FORMAS DE PAGAMENTO INICIAIS
-- ==========================================

INSERT INTO forma_pagamento (nome_forma_pagamento)
VALUES
('Dinheiro'),
('Pix'),
('Cartão de débito'),
('Cartão de crédito')
ON CONFLICT (nome_forma_pagamento) DO NOTHING;

-- ==========================================
-- 9. CATEGORIAS DE EXEMPLO
-- ==========================================

INSERT INTO categoria_produto (nome_categoria)
VALUES
('Pães'),
('Salgados'),
('Doces'),
('Bebidas')
ON CONFLICT (nome_categoria) DO NOTHING;

-- ==========================================
-- 10. PRODUTOS DE EXEMPLO
-- ==========================================

INSERT INTO produto (
    nome_produto,
    descricao_produto,
    preco_produto,
    quantidade_estoque,
    id_categoria
)
SELECT
    'Pão francês',
    'Pão francês tradicional',
    0.80,
    100,
    id_categoria
FROM categoria_produto
WHERE nome_categoria = 'Pães'
AND NOT EXISTS (
    SELECT 1 FROM produto
    WHERE nome_produto = 'Pão francês'
);

INSERT INTO produto (
    nome_produto,
    descricao_produto,
    preco_produto,
    quantidade_estoque,
    id_categoria
)
SELECT
    'Coxinha',
    'Coxinha de frango',
    7.50,
    30,
    id_categoria
FROM categoria_produto
WHERE nome_categoria = 'Salgados'
AND NOT EXISTS (
    SELECT 1 FROM produto
    WHERE nome_produto = 'Coxinha'
);

INSERT INTO produto (
    nome_produto,
    descricao_produto,
    preco_produto,
    quantidade_estoque,
    id_categoria
)
SELECT
    'Brigadeiro',
    'Brigadeiro tradicional',
    3.50,
    40,
    id_categoria
FROM categoria_produto
WHERE nome_categoria = 'Doces'
AND NOT EXISTS (
    SELECT 1 FROM produto
    WHERE nome_produto = 'Brigadeiro'
);

-- ==========================================
-- 11. ATRIBUIR CLIENTE A NOVAS PESSOAS
-- ==========================================

CREATE OR REPLACE FUNCTION atribuir_papel_cliente()
RETURNS TRIGGER AS $$
DECLARE
    papel_cliente INTEGER;
BEGIN
    SELECT id_papel INTO papel_cliente
    FROM papel
    WHERE nome_papel = 'cliente';

    INSERT INTO pessoa_papel (id_pessoa, id_papel)
    VALUES (NEW.id_pessoa, papel_cliente)
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_papel_cliente ON pessoa;

CREATE TRIGGER trigger_papel_cliente
AFTER INSERT ON pessoa
FOR EACH ROW
EXECUTE FUNCTION atribuir_papel_cliente();

-- ==========================================
-- 12. ATRIBUIR CLIENTE ÀS PESSOAS EXISTENTES
-- ==========================================

INSERT INTO pessoa_papel (id_pessoa, id_papel)
SELECT
    p.id_pessoa,
    pa.id_papel
FROM pessoa p
CROSS JOIN papel pa
WHERE pa.nome_papel = 'cliente'
ON CONFLICT DO NOTHING;
