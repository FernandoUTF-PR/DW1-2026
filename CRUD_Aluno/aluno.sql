DROP TABLE IF EXISTS public.aluno;

CREATE TABLE public.aluno (
    ra_aluno INTEGER PRIMARY KEY,
    nome_completo VARCHAR(80) NOT NULL,
    data_nasc DATE,
    email VARCHAR(50),
    telefone VARCHAR (15),
    curso VARCHAR(40)
);

INSERT INTO public.aluno (ra_aluno, nome_completo, data_nasc, email, telefone, curso) VALUES
(1, 'Thanos', 1/1/1978, 'thanosmatador@gmail.com', 40028922, 'T.I');
INSERT INTO public.aluno (ra_aluno, nome_completo, data_nasc, email, telefone, curso) VALUES
(2, 'Taffarel', 2/2/2020, 'espartaffarel@gmail.com', 23478911, 'Engenharia');


select * from public.aluno