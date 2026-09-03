DROP TABLE IF EXISTS public.aluno;

CREATE TABLE public.aluno (
    ra_aluno INTEGER PRIMARY KEY,
    nome_completo VARCHAR(80) NOT NULL,
    TO_CHAR(data_nasc, 'DD/MM/YYYY') AS data_nasc,
    email VARCHAR(50),
    telefone VARCHAR (15),
    curso VARCHAR(40)
);

INSERT INTO public.aluno (ra_aluno, nome_completo, data_nasc, email, telefone, curso) VALUES
(1, 'Thanos', '01/01/1978', 'thanosmatador@gmail.com', 40028922, 'T.I');
INSERT INTO public.aluno (ra_aluno, nome_completo, data_nasc, email, telefone, curso) VALUES
(2, 'Taffarel', '02/02/2020', 'espartaffarel@gmail.com', 23478911, 'Engenharia');


select * from public.aluno