# Padaria Pão Quentinho

Sistema web de gerenciamento e vendas para uma padaria, desenvolvido com HTML, CSS, JavaScript, Node.js, Express e PostgreSQL.

## Funcionalidades
- Login por e-mail e senha com cookie de sessão.
- Vitrine de produtos e carrinho de compras.
- Cadastro, consulta, busca por ID, alteração e exclusão de pessoas, produtos, cargos, pedidos e formas de pagamento.
- Controle de estoque nas inclusões, alterações e exclusões de itens dos pedidos.
- Pedidos online e pagamentos demonstrativos.
- Controle de acesso às páginas administrativas pelo perfil do usuário.

## Configuração e execução
1. Crie um banco PostgreSQL chamado `padaria`.
2. Execute `documentacao/scriptCandyShop.sql` no banco criado. **Atenção:** esse script apaga e recria as tabelas e os dados; use um banco de testes ou faça backup antes.
3. Na raiz do projeto, instale as dependências: `npm install`.
4. Se as credenciais locais forem diferentes das padrões, configure as variáveis `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`.
5. Inicie o servidor na raiz com `node backend/server.js`. Se o terminal já estiver dentro da pasta `backend`, use `node server.js`.
6. Acesse `http://localhost:3001/login`.

## Contas de demonstração
- Gerente: `juliana@email.com` / `1111`
- Cliente/funcionário: `berola@gmail.com` / `12345`

O carrinho e o pedido usam os preços atuais do banco, validam o estoque e registram pedido, itens e baixa de estoque em uma única transação. O pagamento é demonstrativo: registra a forma e o valor, mas não processa cartões, PIX ou boletos reais.

## Banco de dados
Por padrão, a conexão usa `localhost:5432`, usuário `postgres`, senha `postgres` e banco `padaria`. Altere os valores pelas variáveis de ambiente quando necessário.
