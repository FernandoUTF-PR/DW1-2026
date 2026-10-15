const express = require('express');
const os = require('os');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Configuração do pool de conexão com PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Middleware para parsear JSON
app.use(express.json());

// Middleware CORS (Verificação de origem da Servidorina)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Rota Única: Enviar e Receber Mensagens (POST)
app.post('/api/mensagens', async (req, res) => {
    try {
        const mensagemRecebida = req.body.mensagem;

        if (!mensagemRecebida) {
            return res.status(400).json({ status: "erro", mensagem: "O comando não foi visto !" });
        }

        const agora = new Date();
        const dataHora = `${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR')}`;
        console.log(`Comando recebido: ${mensagemRecebida} - ${dataHora}`);

        // REGRA 1: Se for "comandante"
        if (mensagemRecebida === "comandante") {
            return res.status(200).json({
                status: "sucesso",
                mensagem: "Qual a ordem?"
            });
        }

        // REGRA 2: Se for "chegou"
        else if (mensagemRecebida === "chegou recursos") {
            return res.status(200).json({
                status: "sucesso",
                mensagem: "Precisamos de mais"
            });
        }

        // REGRA 3: Se for "situacao" - consulta o estoque e retorna o que precisa ser reposto
        else if (mensagemRecebida === "situacao") {
            try {
                // Consulta o banco de dados
                const query = 'SELECT * FROM public.produto';
                const result = await pool.query(query);

                // Aplica a regra de negócio (calcula o que precisa ser reposto)
                let reposicao = {};

                result.rows.forEach(produto => {
                    if (produto.quantidade_produto < produto.quantidade_minima_produto) {
                        const quantidadeParaPedir = produto.quantidade_maxima_produto - produto.quantidade_produto;

                        // Formata o nome para minúsculo
                        let nomeFormatado = produto.nome_produto.toLowerCase();

                        reposicao[nomeFormatado] = quantidadeParaPedir;
                    }
                });

                // Prepara uma mensagem amigável para mostrar no frontend
                let mensagemResposta = "";
                const itens = Object.entries(reposicao);

                if (itens.length === 0) {
                    mensagemResposta = "Está ótimo, as condições estão positivas.";
                } else {
                    mensagemResposta = "Precisamos repor:\n";
                    itens.forEach(([item, quantidade]) => {
                        mensagemResposta += `- ${item}: ${quantidade} unidades\n`;
                    });
                }

                return res.status(200).json({
                    status: "sucesso",
                    mensagem: mensagemResposta,
                    dados_reposicao: reposicao  // Dados estruturados caso queira usar
                });

            } catch (dbError) {
                console.error('Erro na comunicação:', dbError);
                return res.status(500).json({
                    status: "erro",
                    mensagem: 'Erro ao consultar situação e o necessário'
                });
            }
        }



        // REGRA ?: Se for "comida" - consulta o estoque e retorna o que precisa ser reposto
        else if (mensagemRecebida === "comida") {
            try {
                // Consulta o banco de dados
                const query = "Select quantidade_produto FROM public.produto WHERE nome_produto = 'Comida (em kg)' ";
                const result = await pool.query(query);




                return res.status(200).json({
                    status: "sucesso",
                    mensagem: "Quantidade de comida: " + result.rows[0].quantidade_produto
                });

            } catch (dbError) {
                console.error('Erro no banco de dados:', dbError);
                return res.status(500).json({
                    status: "erro",
                    mensagem: 'Erro ao consultar situação do estoque'
                });
            }
        }

        // REGRA ?: Se for "armamento" - consulta o estoque e retorna o que precisa ser reposto
        else if (mensagemRecebida === "armamento") {
            try {
                // Consulta o banco de dados
                const query = "Select quantidade_produto FROM public.produto WHERE nome_produto = 'Munição de diversas armas' ";
                const result = await pool.query(query);




                return res.status(200).json({
                    status: "sucesso",
                    mensagem: "Quantidade de armas: " + result.rows[0].quantidade_produto
                });

            } catch (dbError) {
                console.error('Erro no banco de dados:', dbError);
                return res.status(500).json({
                    status: "erro",
                    mensagem: 'Erro ao consultar situação do estoque de armas'
                });
            }
        }

        // REGRA ?: Se for "tropa" - consulta o estoque e retorna o que precisa ser reposto
        else if (mensagemRecebida === "tropa") {
            try {
                // Consulta o banco de dados
                const query = "SELECT quantidade_produto FROM public.produto WHERE nome_produto = 'Tropas' ";
                const result = await pool.query(query);





                return res.status(200).json({
                    status: "sucesso",
                    mensagem: "Quantidade de tropas: " + result.rows[0].quantidade_produto
                });

            } catch (dbError) {
                console.error('Erro no banco de dados:', dbError);
                return res.status(500).json({
                    status: "erro",
                    mensagem: 'Erro ao consultar as tropas'
                });
            }
        }


        // REGRA 4: Qualquer outra palavra
        else {
            return res.status(200).json({
                status: "sucesso",
                mensagem: "mensagem não catalogada"
            });
        }

    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        res.status(500).json({ status: "erro", mensagem: 'Erro interno' });
    }
});

//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA

app.post('/api/mensagensPais', async (req, res) => {
    try {
        const mensagemRecebidaPais = req.body.mensagem;

        if (!mensagemRecebidaPais) {
            return res.status(400).json({ status: "erro", mensagem: "O comando não foi visto !" });
        }

        const agora = new Date();
        const dataHora = `${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR')}`;
        console.log(`Comando recebido: ${mensagemRecebidaPais} - ${dataHora}`);

        // REGRA 1: Se for "atacar"
        if (mensagemRecebidaPais === "atacar") {
            return res.status(200).json({
                status: "sucesso",
                mensagem: "Coloque o nome do país"
            });
        }

        // REGRA ?: Se for "todos"
        else if (mensagemRecebidaPais === "todos") {
            return res.status(200).json({
                status: "sucesso",
                mensagem: "Tá doido?"
            });
        }

        else if (mensagemRecebidaPais === "israel") {
            try {
                // Consulta o banco de dados
               // console.log("foi");
                const query = "SELECT id_capital, nome_pais, quantidade_soldado FROM public.produtoPais WHERE nome_pais = 'Israel' ";

                const result = await pool.query(query);


                //console.log("foi2");
               // console.log(result.rows)
                return res.status(200).json({
                    status: "sucesso",
                    mensagem: result.rows
                });

            } catch (dbError) {
                console.error('Erro no banco de dados:', dbError);
                return res.status(500).json({
                    status: "erro",
                    mensagem: 'Erro ao consultar as tropas'
                });
            }
        }

        // REGRA 3: Qualquer outra palavra
        else {
            return res.status(200).json({
                status: "sucesso",
                mensagem: "mensagem não catalogada"
            });
        }

    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        res.status(500).json({ status: "erro", mensagem: 'Erro interno' });
    }
});

       else if (mensagemRecebidaPais === "e.u.a") {
            try {
                // Consulta o banco de dados
               // console.log("foi");
                const query = "SELECT id_capital, nome_pais, quantidade_soldado FROM public.produtoPais WHERE nome_pais = 'E.U.A' ";

                const result = await pool.query(query);


                //console.log("foi2");
               // console.log(result.rows)
                return res.status(200).json({
                    status: "sucesso",
                    mensagem: result.rows
                });

            } catch (dbError) {
                console.error('Erro no banco de dados:', dbError);
                return res.status(500).json({
                    status: "erro",
                    mensagem: 'Erro ao consultar as tropas'
                });
            }
        }

        // REGRA 3: Qualquer outra palavra
        else {
            return res.status(200).json({
                status: "sucesso",
                mensagem: "mensagem não catalogada"
            });
        }

    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        res.status(500).json({ status: "erro", mensagem: 'Erro interno' });
    }
});

else if (mensagemRecebidaPais === "argentina") {
            try {
                // Consulta o banco de dados
               // console.log("foi");
                const query = "SELECT id_capital, nome_pais, quantidade_soldado FROM public.produtoPais WHERE nome_pais = 'Argentina' ";

                const result = await pool.query(query);


                //console.log("foi2");
               // console.log(result.rows)
                return res.status(200).json({
                    status: "sucesso",
                    mensagem: result.rows
                });

            } catch (dbError) {
                console.error('Erro no banco de dados:', dbError);
                return res.status(500).json({
                    status: "erro",
                    mensagem: 'Erro ao consultar as tropas'
                });
            }
        }

        // REGRA 3: Qualquer outra palavra
        else {
            return res.status(200).json({
                status: "sucesso",
                mensagem: "mensagem não catalogada"
            });
        }

    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        res.status(500).json({ status: "erro", mensagem: 'Erro interno' });
    }
});

else if (mensagemRecebidaPais === "brasil") {
            try {
                // Consulta o banco de dados
               // console.log("foi");
                const query = "SELECT id_capital, nome_pais, quantidade_soldado FROM public.produtoPais WHERE nome_pais = 'Brasil' ";

                const result = await pool.query(query);


                //console.log("foi2");
               // console.log(result.rows)
                return res.status(200).json({
                    status: "sucesso",
                    mensagem: result.rows
                });

            } catch (dbError) {
                console.error('Erro no banco de dados:', dbError);
                return res.status(500).json({
                    status: "erro",
                    mensagem: 'Erro ao consultar as tropas'
                });
            }
        }

        // REGRA 3: Qualquer outra palavra
        else {
            return res.status(200).json({
                status: "sucesso",
                mensagem: "mensagem não catalogada"
            });
        }

    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        res.status(500).json({ status: "erro", mensagem: 'Erro interno' });
    }
});


app.listen(port, '0.0.0.0', () => {
    console.log(`Soldados na porta${port}`);
    console.log(`Rota disponível:`);
    console.log(`  POST http://localhost:${port}/api/mensagens - Enviar ordens`);
    console.log(`\nMensagens disponíveis (possíveis)`);
    console.log(`  "comandante"     -> Resposta de saudação`);
    console.log(`  "chegou recursos"   -> Confirmação de chegada`);
    console.log(`  "situacao" -> Consulta de reposição de estoque`);
    console.log(`    "comida"    -> Consulta de reposição de estoque de comida`);
    console.log(`   "armamento"    -> Consulta de reposição de estoque de armas`);
    console.log(` "tropa"    -> Consulta de reposição de estoque de tropas`);
    console.log(`  (outras)   -> Mensagem não entendida`);
});
