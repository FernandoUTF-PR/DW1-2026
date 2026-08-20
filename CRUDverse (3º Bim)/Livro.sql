DROP TABLE IF EXISTS public.livro;

CREATE TABLE public.livro (
    id_livro INTEGER PRIMARY KEY,
    nome_livro VARCHAR(30) NOT NULL,
    genero_livro VARCHAR(30) NOT NULL,
    ano INTEGER NOT NULL,
    autor VARCHAR (50),
    paginas INTEGER NOT NULL
);

INSERT INTO public.livro (id_livro, nome_livro, genero_livro, ano, autor, paginas) VALUES
(1, 'Horax', 'Dr. Meuss', 1978, 'Dr. Meuss', 123);
INSERT INTO public.livro (id_livro, nome_livro, genero_livro, ano, autor, paginas) VALUES
(2, 'Norax', 'Dr Keuss', 2020, 'Dr. Keuss', 234);
INSERT INTO public.livro (id_livro, nome_livro, genero_livro, ano, autor, paginas) VALUES
(3, 'Jorax', 'Dr Teuss', 2021, 'Dr. Teuss', 235);
INSERT INTO public.livro (id_livro, nome_livro, genero_livro, ano, autor, paginas) VALUES
(4, 'Lorax', 'Dr. Seuss', 2018, 'Dr. Seuss', 456);

select * from public.livro