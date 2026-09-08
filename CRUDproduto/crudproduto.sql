DROP TABLE IF EXISTS public.produto;

CREATE TABLE public.produto (
    id_produto INT PRIMARY KEY,
    nome_produto VARCHAR(50) NOT NULL,
    tamanho CHAR(1),
    peso FLOAT
);

INSERT INTO public.produto (id_produto, nome_produto, tamanho, peso) VALUES
(1, 'Borracha', 'M', '0.2');
INSERT INTO public.produto (id_produto, nome_produto, tamanho, peso) VALUES
(2, 'Bola', 'G', '2.3');


select * from public.produto;