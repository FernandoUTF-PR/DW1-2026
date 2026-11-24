
const API_BASE_URL = '';

document.addEventListener('DOMContentLoaded', function () {
    // Recupera o valor do pagamento do sessionStorage

    // Pega o texto do sessionStorage
    const dadosDoPedido = sessionStorage.getItem('dadosPagamento');

    // Transforma de volta em objeto JavaScript
    const objetoDadosPedido = dadosDoPedido ? JSON.parse(dadosDoPedido) : null;
    if (!objetoDadosPedido || !objetoDadosPedido.id_pedido || !(Number(objetoDadosPedido.valor_total) > 0)) {
        alert('Não há pedido válido para pagamento.');
        window.location.href = '/menu';
        return;
    }

    const valorTotal = objetoDadosPedido ? parseFloat(objetoDadosPedido.valor_total) : 0;
    const idPedido = objetoDadosPedido ? objetoDadosPedido.id_pedido : null;

    //alert('Valor total do pedido: R$ ' + valorTotal.toFixed(2) + ' | ID do pedido: ' + idPedido);

    let valorRestante = valorTotal;
    let formasPagamento = [];

    // Elementos da DOM
    const elementoValorTotal = document.getElementById('valor-total');
    const elementoValorRestante = document.getElementById('valor-restante');
    const selectFormaPagamento = document.getElementById('forma-pagamento');
    const btnAdicionar = document.getElementById('btn-adicionar');
    const containerFormas = document.getElementById('formas-adicionadas');
    const formPagamento = document.getElementById('form-pagamento');
    const btnFinalizar = document.getElementById('btn-finalizar');

    // Atualiza os valores na página
    function atualizarValores() {
        elementoValorTotal.textContent = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
        elementoValorRestante.textContent = `R$ ${valorRestante.toFixed(2).replace('.', ',')}`;

        // Atualiza cor do valor restante
        if (Math.abs(valorRestante) < 0.005) {
            elementoValorRestante.style.color = '#1a5d3c';
        } else {
            elementoValorRestante.style.color = '#d9534f';
        }

        // Habilita/desabilita botão finalizar
        btnFinalizar.disabled = Math.abs(valorRestante) >= 0.005;
    }

    // Inicializa valores
    atualizarValores();

    // Adiciona forma de pagamento
    btnAdicionar.addEventListener('click', function () {
        const tipo = selectFormaPagamento.value;

        if (!tipo) {
            alert('Por favor, selecione uma forma de pagamento.');
            return;
        }

        if (valorRestante <= 0) {
            alert('O valor total já foi distribuído entre as formas de pagamento.');
            return;
        }

        adicionarFormaPagamento(tipo);
        selectFormaPagamento.value = '';
    });

    // Adiciona uma nova forma de pagamento
    function adicionarFormaPagamento(tipo) {
        const id = Date.now(); // ID único
        const valorSugerido = valorRestante;

        formasPagamento.push({
            id: id,
            tipo: tipo,
            valor: 0
        });

        // Cria o elemento HTML
        const formaElement = document.createElement('div');
        formaElement.className = 'forma-pagamento-item';
        formaElement.id = `forma-${id}`;
        formaElement.innerHTML = `
            <div class="cabecalho-forma">
                <span class="tipo-pagamento">${obterNomeFormaPagamento(tipo)}</span>
                <button type="button" class="btn-remover" data-id="${id}">Remover</button>
            </div>
            <div class="campo-valor">
                <label for="valor-${id}">Valor (R$):</label>
                <input type="number" id="valor-${id}" min="0.01" max="${valorRestante}" step="0.01" value="${valorSugerido.toFixed(2)}" placeholder="0,00">
                <div class="erro" id="erro-${id}">Valor inválido</div>
            </div>
            <div class="detalhes-pagamento" id="detalhes-${id}">
                ${gerarDetalhesFormaPagamento(tipo, id)}
            </div>
        `;

        containerFormas.appendChild(formaElement);

        // Adiciona evento para atualizar valor
        const inputValor = document.getElementById(`valor-${id}`);
        inputValor.addEventListener('input', function () {
            atualizarValorForma(id, parseFloat(this.value) || 0);
        });

        // Adiciona evento para remover forma
        const btnRemover = formaElement.querySelector('.btn-remover');
        btnRemover.addEventListener('click', function () {
            removerFormaPagamento(id);
        });

        // Inicializa o valor
        atualizarValorForma(id, valorSugerido);
    }

    // Atualiza o valor de uma forma de pagamento
    function atualizarValorForma(id, novoValor) {
        novoValor = Math.round(Number(novoValor) * 100) / 100;
        const forma = formasPagamento.find(f => f.id === id);
        const inputValor = document.getElementById(`valor-${id}`);
        const erroElement = document.getElementById(`erro-${id}`);

        if (!forma) return;

        // Validação do valor
        if (novoValor < 0.01) {
            erroElement.style.display = 'block';
            inputValor.style.borderColor = '#d9534f';
            return;
        }

        const valorAnterior = forma.valor;
        const diferenca = novoValor - valorAnterior;

        // Verifica se excede o valor restante
        if (diferenca > valorRestante) {
            novoValor = valorAnterior + valorRestante;
            inputValor.value = novoValor.toFixed(2);
        }

        // Atualiza valores
        forma.valor = novoValor;
        valorRestante = Number((valorTotal - formasPagamento.reduce((sum, f) => sum + f.valor, 0)).toFixed(2));
        if (Math.abs(valorRestante) < 0.005) valorRestante = 0;

        // Atualiza interface
        erroElement.style.display = 'none';
        inputValor.style.borderColor = '#ddd';
        atualizarValores();

        // Atualiza max de todos os inputs
        formasPagamento.forEach(f => {
            const input = document.getElementById(`valor-${f.id}`);
            if (input) {
                input.max = (f.valor + valorRestante).toFixed(2);
            }
        });
    }

    // Remove uma forma de pagamento
    function removerFormaPagamento(id) {
        formasPagamento = formasPagamento.filter(f => f.id !== id);
        const formaElement = document.getElementById(`forma-${id}`);
        if (formaElement) {
            formaElement.remove();
        }

        // Recalcula valor restante
        valorRestante = Number((valorTotal - formasPagamento.reduce((sum, f) => sum + f.valor, 0)).toFixed(2));
        if (Math.abs(valorRestante) < 0.005) valorRestante = 0;
        atualizarValores();
    }

    // O projeto registra a forma e o valor; não processa dados bancários reais.
    function gerarDetalhesFormaPagamento(tipo, id) {
        return '<p>Pagamento demonstrativo: nenhum dado bancário será solicitado ou processado.</p>';
    }

    // Obtém o nome amigável da forma de pagamento
    function obterNomeFormaPagamento(tipo) {
        const nomes = {
            '1': 'Dinheiro',
            '2': 'Cartão de Crédito',
            '3': 'Cartão de Débito',
            '4': 'PIX',
            '5': 'Boleto',
            '6': 'Vale Alimentação',
            '7': 'Transferência Bancária',
            '8': 'Cheque',
            '9': 'Crédito Loja',
            '10': 'Gift Card'
        };
        return nomes[tipo] || tipo;
    }

    // Valida o formulário antes do envio
    formPagamento.addEventListener('submit', function (e) {
        e.preventDefault();

        // Verifica se o valor total foi distribuído
        if (valorRestante > 0.005) {
            alert(`Ainda falta distribuir R$ ${valorRestante.toFixed(2).replace('.', ',')} entre as formas de pagamento.`);
            return;
        }

        // O projeto registra pagamentos demonstrativos, sem coletar dados bancários.
        // Preparar dados para envio
        const dadosPagamento = {
            idPedido: idPedido,
            valorTotal: valorTotal,
            formasPagamento: formasPagamento.map(forma => {
                const dadosForma = {
                    tipo: forma.tipo,
                    valor: forma.valor
                };


                return dadosForma;
            })
        };

        // Enviar dados para a rota de pagamento
        enviarPagamento(dadosPagamento);
    });

    // Envia os dados do pagamento para o backend    
        function enviarPagamento(dados) {
        const rotaPagamento = API_BASE_URL+'/pagamento/'+idPedido; // ROTA DE PAGAMENTO NO BACKEND

            // Exemplo de envio usando fetch
            fetch(rotaPagamento, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dados)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro no processamento do pagamento');
                    }
                    return response.json();
                })
                .then(data => {
                    // Processar resposta do servidor
                    if (data.sucesso || data.status === 'ok') {
                        alert('Pagamento realizado com sucesso!');
                        sessionStorage.removeItem('carrinho');
                        sessionStorage.removeItem('dadosPagamento');
                        // Redirecionar para página de confirmação
                        window.location.href = API_BASE_URL+'/menu';
                    } else {
                        alert('Erro no pagamento: ' + data.mensagem);
                    }
                })
                .catch(error => {
                    console.error('Erro:', error);
                    alert('Erro ao processar pagamento. Tente novamente.');
                });

            // Para demonstração, apenas exibir os dados no console
            console.log('Dados do pagamento:', dados);
        }
    });


    /**
     * Popula o select de formas de pagamento com dados da API.
    */

    function popularFormasPagamento(selectId, apiUrl) {
        const selectElement = document.getElementById(selectId);

        if (!selectElement) {
            console.error(`Elemento <select> com id="${selectId}" não encontrado.`);
            return;
        }

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao buscar formas de pagamento: Status ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Remove todas as opções existentes, exceto a primeira ('Selecione...')
                // Isso é feito para garantir que o select seja limpo antes de adicionar os novos itens.
                while (selectElement.options.length > 1) {
                    selectElement.remove(1);
                }

                // Itera sobre os dados e adiciona as novas opções
                data.forEach(forma => {
                    const option = document.createElement('option');
                    option.value = forma.id_forma_pagamento;  // Usando o ID como valor
                    option.textContent = forma.nome_forma_pagamento; // Usando o NOME como texto visível

                    selectElement.appendChild(option);
                });

                console.log("Formas de pagamento carregadas e select populado com sucesso!");
            })
            .catch(error => {
                console.error('Ocorreu um erro na requisição:', error);
            });
    }

    popularFormasPagamento('forma-pagamento', '/forma_pagamento');