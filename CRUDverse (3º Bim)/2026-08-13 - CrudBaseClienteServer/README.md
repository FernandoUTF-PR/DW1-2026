CREATE TABLE public.carro (
    id_carro INTEGER PRIMARY KEY,
    nome_carro VARCHAR(30) NOT NULL,
    modelo_carro VARCHAR(30) NOT NULL,
    ano INTEGER NOT NULL
);

INSERT INTO public.carro (id_carro, nome_carro, modelo_carro, ano) VALUES
(1, 'Fusca', '1300 L', 1978),
(2, 'Civic', 'EXL 2.0', 2020),
(3, 'Corolla', 'XEi 2.0 Flex', 2021),
(4, 'Gol', '1.0 MPI', 2018),
(5, 'Uno', 'Mille Fire 1.0', 2010),
(6, 'Onix', 'LT 1.0 Turbo', 2022),
(7, 'HB20', 'Comfort 1.0', 2021),
(8, 'Renegade', 'Longitude 1.8 Flex', 2019),
(9, 'Compass', 'Limited 2.0 Turbo', 2023),
(10, 'Kwid', 'Zen 1.0', 2022);