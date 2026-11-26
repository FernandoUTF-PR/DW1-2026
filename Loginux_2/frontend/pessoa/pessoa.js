
// Configuração da API
const API_BASE_URL = 'http://localhost:3001';

let currentPersonId = null;
let operacao = null;
let temporizadorMensagem = null;

// Elementos do HTML
const form = document.getElementById('pessoaForm');
const searchId = document.getElementById('searchId');

const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnSalvar = document.getElementById('btnSalvar');
const btnCancelar = document.getElementById('btnCancelar');

const pessoasTableBody = document.getElementById('pessoasTableBody');
const messageContainer = document.getElementById('messageContainer');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {

    btnBuscar.addEventListener('click', buscarPessoa);
    btnIncluir.addEventListener('click', incluirPessoa);
    btnAlterar.addEventListener('click', alterarPessoa);
    btnExcluir.addEventListener('click', excluirPessoa);
    btnSalvar.addEventListener('click', salvarOperacao);
    btnCancelar.addEventListener('click', cancelarOperacao);

    form.addEventListener('submit', (event) => {
        event.preventDefault();
    });

    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);

    carregarPessoas();
    popularCargosSelect();

});

// Requisições à API
async function requisicao(url, opcoes = {}) {

    const response = await fetch(url, opcoes);

    let data = null;

    if (response.status !== 204) {

        const texto = await response.text();

        if (texto) {
            try {
                data = JSON.parse(texto);
            } catch {
                data = { message: texto };
            }
        }
    }

    return { response, data };
}

function verificarResposta(response, data, mensagem) {

    if (!response.ok) {
        throw new Error(
            data?.error ||
            data?.message ||
            `${mensagem} (HTTP ${response.status})`
        );
    }

    return data;
}

// Mensagens
function mostrarMensagem(texto, tipo = 'info') {

    clearTimeout(temporizadorMensagem);

    messageContainer.replaceChildren();

    const mensagem = document.createElement('div');

    mensagem.className = `message ${tipo}`;
    mensagem.textContent = texto;

    messageContainer.appendChild(mensagem);

    temporizadorMensagem = setTimeout(() => {
        messageContainer.replaceChildren();
    }, 4000);

}

// Bloqueio dos campos
function bloquearCampos(bloquearPrimeiro) {

    searchId.disabled = bloquearPrimeiro;

    const campos = form.querySelectorAll(
        'input:not(#searchId), select'
    );

    campos.forEach(campo => {
        campo.disabled = !bloquearPrimeiro;
    });

}

// Botões
function mostrarBotoes(
    btBuscar,
    btIncluir,
    btAlterar,
    btExcluir,
    btSalvar,
    btCancelar
) {

    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';

}

// Limpar formulário
function limparFormulario() {

    form.reset();

    currentPersonId = null;
    operacao = null;

}

// CPF
function normalizarCPF(cpf) {

    return String(cpf || '').replace(/\D/g, '');

}

// Datas
function converterDataParaInput(data) {

    if (!data) {
        return '';
    }

    return String(data).substring(0, 10);

}

function formatarData(data) {

    if (!data) {
        return '';
    }

    const partes = String(data).substring(0, 10).split('-');

    if (partes.length !== 3) {
        return '';
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;

}

// Verificar funcionário
async function funcaoEhFuncionario(pessoaId) {

    const { response, data } = await requisicao(
        `${API_BASE_URL}/funcionario/${encodeURIComponent(pessoaId)}`
    );

    if (response.status === 404) {
        return { ehFuncionario: false };
    }

    verificarResposta(response, data, 'Erro ao buscar funcionário');

    return {
        ehFuncionario: true,
        ...data
    };

}

// Verificar cliente
async function funcaoEhCliente(pessoaId) {

    const { response, data } = await requisicao(
        `${API_BASE_URL}/cliente/${encodeURIComponent(pessoaId)}`
    );

    if (response.status === 404) {
        return { ehCliente: false };
    }

    verificarResposta(response, data, 'Erro ao buscar cliente');

    return {
        ehCliente: true,
        ...data
    };

}

// Buscar pessoa
async function buscarPessoa() {

    const id = normalizarCPF(searchId.value);

    if (!id) {
        mostrarMensagem('Digite um CPF para buscar.', 'warning');
        return;
    }

    searchId.value = id;

    try {

        const { response, data } = await requisicao(
            `${API_BASE_URL}/pessoa/${encodeURIComponent(id)}`
        );

        if (response.status === 404) {

            limparFormulario();
            searchId.value = id;

            bloquearCampos(false);

            mostrarBotoes(true, true, false, false, false, false);

            mostrarMensagem(
                'Pessoa não encontrada. Você pode incluir uma nova pessoa.',
                'info'
            );

            return;
        }

        verificarResposta(response, data, 'Erro ao buscar pessoa');

        await preencherFormulario(data);

        bloquearCampos(false);

        mostrarBotoes(true, false, true, true, false, false);

        mostrarMensagem('Pessoa encontrada!', 'success');

    } catch (error) {

        console.error('Erro ao buscar pessoa:', error);

        mostrarMensagem(error.message, 'error');

    }

}

// Preencher formulário
async function preencherFormulario(pessoa) {

    currentPersonId = pessoa.cpf_pessoa;

    searchId.value = pessoa.cpf_pessoa;

    document.getElementById('nome_pessoa').value =
        pessoa.nome_pessoa || '';

    document.getElementById('data_nascimento').value =
        converterDataParaInput(pessoa.data_nascimento_pessoa);

    document.getElementById('endereco_pessoa').value =
        pessoa.endereco_pessoa || '';

    document.getElementById('email_pessoa').value =
        pessoa.email_pessoa || '';

    // Por segurança, não preencher nem exibir a senha armazenada.
    document.getElementById('senha_pessoa').value = '';

    // Buscar dados de funcionário e cliente.
    const [funcionario, cliente] = await Promise.all([
        funcaoEhFuncionario(currentPersonId),
        funcaoEhCliente(currentPersonId)
    ]);

    // Funcionário
    document.getElementById('checkboxFuncionario').checked =
        funcionario.ehFuncionario;

    document.getElementById('cargo_id_cargo').value =
        funcionario.cargo_id_cargo || '';

    document.getElementById('salario_funcionario').value =
        funcionario.salario_funcionario ?? '';

    document.getElementById('porcentagem_comissao_funcionario').value =
        funcionario.porcentagem_comissao_funcionario ?? '';

    // Cliente
    document.getElementById('checkboxCliente').checked =
        cliente.ehCliente;

    document.getElementById('renda_cliente').value =
        cliente.renda_cliente ?? '';

    document.getElementById('data_cadastro_cliente').value =
        converterDataParaInput(cliente.data_cadastro_cliente);

}

// Incluir pessoa
function incluirPessoa() {

    const cpf = normalizarCPF(searchId.value);

    if (!cpf) {
        mostrarMensagem('Digite o CPF da pessoa antes de incluir.', 'warning');
        return;
    }

    limparFormulario();

    currentPersonId = cpf;
    searchId.value = cpf;

    operacao = 'incluir';

    bloquearCampos(true);

    mostrarBotoes(false, false, false, false, true, true);

    document.getElementById('nome_pessoa').focus();

    mostrarMensagem('Digite os dados da nova pessoa.', 'info');

}

// Alterar pessoa
function alterarPessoa() {

    if (!currentPersonId) {
        mostrarMensagem('Busque uma pessoa antes de alterar.', 'warning');
        return;
    }

    operacao = 'alterar';

    bloquearCampos(true);

    mostrarBotoes(false, false, false, false, true, true);

    document.getElementById('nome_pessoa').focus();

    mostrarMensagem('Altere os dados da pessoa.', 'info');

}

// Excluir pessoa
function excluirPessoa() {

    if (!currentPersonId) {
        mostrarMensagem('Busque uma pessoa antes de excluir.', 'warning');
        return;
    }

    if (!confirm('Deseja realmente excluir esta pessoa?')) {
        return;
    }

    operacao = 'excluir';

    form.querySelectorAll('input, select').forEach(campo => {
        campo.disabled = true;
    });

    mostrarBotoes(false, false, false, false, true, true);

    mostrarMensagem(
        'Confirme a exclusão clicando em Salvar.',
        'warning'
    );

}

// Dados da pessoa
function obterDadosPessoa() {

    const cpf = normalizarCPF(searchId.value);

    const senha = document.getElementById('senha_pessoa').value;

    const pessoa = {

        cpf_pessoa: cpf,

        nome_pessoa:
            document.getElementById('nome_pessoa').value.trim(),

        data_nascimento_pessoa:
            document.getElementById('data_nascimento').value || null,

        endereco_pessoa:
            document.getElementById('endereco_pessoa').value.trim(),

        email_pessoa:
            document.getElementById('email_pessoa').value.trim()

    };

    if (senha) {
        pessoa.senha_pessoa = senha;
    }

    return pessoa;

}

// Dados de funcionário
function obterDadosFuncionario(cpf) {

    const cargo = document.getElementById('cargo_id_cargo').value;
    const salario = document.getElementById('salario_funcionario').value;
    const comissao = document.getElementById(
        'porcentagem_comissao_funcionario'
    ).value;

    return {

        pessoa_cpf_pessoa: cpf,

        salario_funcionario: salario === '' ? null : Number(salario),

        cargo_id_cargo: cargo === '' ? null : Number(cargo),

        porcentagem_comissao_funcionario:
            comissao === '' ? null : Number(comissao)

    };

}

// Dados de cliente
function obterDadosCliente(cpf) {

    const renda = document.getElementById('renda_cliente').value;

    return {

        pessoa_cpf_pessoa: cpf,

        renda_cliente: renda === '' ? null : Number(renda),

        data_cadastro_cliente:
            document.getElementById('data_cadastro_cliente').value || null

    };

}

// Criar ou atualizar um relacionamento
async function sincronizarRelacionamento(
    tipo,
    marcado,
    dados,
    cpf
) {

    const caminho = `${API_BASE_URL}/${tipo}/${encodeURIComponent(cpf)}`;

    const { response } = await requisicao(caminho);

    const existe = response.ok;

    if (!existe && response.status !== 404) {
        throw new Error(`Erro ao verificar ${tipo}: HTTP ${response.status}`);
    }

    if (marcado) {

        const metodo = existe ? 'PUT' : 'POST';

        const url = existe
            ? caminho
            : `${API_BASE_URL}/${tipo}`;

        const { response: resposta, data } = await requisicao(url, {

            method: metodo,

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(dados)

        });

        verificarResposta(
            resposta,
            data,
            `Erro ao salvar ${tipo}`
        );

    } else if (existe) {

        const { response: resposta, data } = await requisicao(caminho, {
            method: 'DELETE'
        });

        verificarResposta(
            resposta,
            data,
            `Erro ao excluir ${tipo}`
        );

    }

}

// Excluir relacionamento antes de excluir a pessoa
async function excluirRelacionamento(tipo, cpf) {

    const caminho = `${API_BASE_URL}/${tipo}/${encodeURIComponent(cpf)}`;

    const { response } = await requisicao(caminho);

    if (response.status === 404) {
        return;
    }

    if (!response.ok) {
        throw new Error(`Erro ao consultar ${tipo}.`);
    }

    const { response: resposta, data } = await requisicao(caminho, {
        method: 'DELETE'
    });

    verificarResposta(resposta, data, `Erro ao excluir ${tipo}`);

}

// Salvar operação
async function salvarOperacao() {

    if (!operacao) {
        mostrarMensagem('Nenhuma operação selecionada.', 'warning');
        return;
    }

    let sucesso = false;

    try {

        // EXCLUIR
        if (operacao === 'excluir') {

            await excluirRelacionamento('cliente', currentPersonId);

            await excluirRelacionamento('funcionario', currentPersonId);

            const { response, data } = await requisicao(
                `${API_BASE_URL}/pessoa/${encodeURIComponent(currentPersonId)}`,
                {
                    method: 'DELETE'
                }
            );

            verificarResposta(response, data, 'Erro ao excluir pessoa');

            mostrarMensagem('Pessoa excluída com sucesso!', 'success');

        }

        // INCLUIR OU ALTERAR
        else {

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const pessoa = obterDadosPessoa();

            if (!pessoa.cpf_pessoa) {
                throw new Error('O CPF é obrigatório.');
            }

            if (!pessoa.nome_pessoa) {
                throw new Error('O nome é obrigatório.');
            }

            if (!pessoa.email_pessoa) {
                throw new Error('O email é obrigatório.');
            }

            if (operacao === 'incluir' && !pessoa.senha_pessoa) {
                throw new Error('Informe uma senha para cadastrar a pessoa.');
            }

            const funcionarioMarcado =
                document.getElementById('checkboxFuncionario').checked;

            const clienteMarcado =
                document.getElementById('checkboxCliente').checked;

            const funcionario = obterDadosFuncionario(pessoa.cpf_pessoa);
            const cliente = obterDadosCliente(pessoa.cpf_pessoa);

            // INCLUIR
            if (operacao === 'incluir') {

                const { response, data } = await requisicao(
                    `${API_BASE_URL}/pessoa`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(pessoa)
                    }
                );

                verificarResposta(response, data, 'Erro ao incluir pessoa');

            }

            // ALTERAR
            else if (operacao === 'alterar') {

                const { response, data } = await requisicao(
                    `${API_BASE_URL}/pessoa/${encodeURIComponent(currentPersonId)}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(pessoa)
                    }
                );

                verificarResposta(response, data, 'Erro ao alterar pessoa');

            }

            // Sincronizar funcionário
            await sincronizarRelacionamento(
                'funcionario',
                funcionarioMarcado,
                funcionario,
                pessoa.cpf_pessoa
            );

            // Sincronizar cliente
            await sincronizarRelacionamento(
                'cliente',
                clienteMarcado,
                cliente,
                pessoa.cpf_pessoa
            );

            mostrarMensagem(
                operacao === 'incluir'
                    ? 'Pessoa incluída com sucesso!'
                    : 'Pessoa alterada com sucesso!',
                'success'
            );

        }

        sucesso = true;

        limparFormulario();

        await carregarPessoas();

    } catch (error) {

        console.error('Erro ao salvar operação:', error);

        mostrarMensagem(error.message || 'Erro ao processar operação.', 'error');

    } finally {

        if (sucesso) {

            mostrarBotoes(true, false, false, false, false, false);

            bloquearCampos(false);

        } else {

            mostrarBotoes(false, false, false, false, true, true);

            if (operacao !== 'excluir') {
                bloquearCampos(true);
            }

        }

    }

}

// Cancelar operação
function cancelarOperacao() {

    limparFormulario();

    bloquearCampos(false);

    mostrarBotoes(true, false, false, false, false, false);

    mostrarMensagem('Operação cancelada.', 'info');

}

// Carregar pessoas
async function carregarPessoas() {

    try {

        const { response, data } = await requisicao(
            `${API_BASE_URL}/pessoa`
        );

        verificarResposta(response, data, 'Erro ao carregar pessoas');

        if (!Array.isArray(data)) {
            throw new Error('A API não retornou uma lista de pessoas.');
        }

        renderizarTabelaPessoas(data);

    } catch (error) {

        console.error('Erro ao carregar pessoas:', error);

        mostrarMensagem(error.message, 'error');

    }

}

// Renderizar tabela
function renderizarTabelaPessoas(pessoas) {

    pessoasTableBody.replaceChildren();

    pessoas.forEach(pessoa => {

        const row = document.createElement('tr');

        const celulaCPF = document.createElement('td');

        const botaoCPF = document.createElement('button');

        botaoCPF.type = 'button';
        botaoCPF.className = 'btn-id';
        botaoCPF.textContent = pessoa.cpf_pessoa;

        botaoCPF.addEventListener('click', () => {

            searchId.value = pessoa.cpf_pessoa;

            buscarPessoa();

        });

        celulaCPF.appendChild(botaoCPF);

        const celulaNome = document.createElement('td');
        celulaNome.textContent = pessoa.nome_pessoa || '';

        const celulaNascimento = document.createElement('td');
        celulaNascimento.textContent =
            formatarData(pessoa.data_nascimento_pessoa);

        const celulaEndereco = document.createElement('td');
        celulaEndereco.textContent = pessoa.endereco_pessoa || '';

        const celulaEmail = document.createElement('td');
        celulaEmail.textContent = pessoa.email_pessoa || '';

        row.append(
            celulaCPF,
            celulaNome,
            celulaNascimento,
            celulaEndereco,
            celulaEmail
        );

        pessoasTableBody.appendChild(row);

    });

}

// Carregar cargos
async function popularCargosSelect() {

    const selectCargo = document.getElementById('cargo_id_cargo');

    try {

        const { response, data } = await requisicao(
            `${API_BASE_URL}/cargo`
        );

        verificarResposta(response, data, 'Erro ao buscar cargos');

        if (!Array.isArray(data)) {
            throw new Error('A API não retornou uma lista de cargos.');
        }

        selectCargo.replaceChildren();

        const opcaoInicial = document.createElement('option');

        opcaoInicial.value = '';
        opcaoInicial.textContent = 'Cargo';

        selectCargo.appendChild(opcaoInicial);

        data.forEach(cargo => {

            const option = document.createElement('option');

            option.value = cargo.id_cargo;
            option.textContent = cargo.nome_cargo;

            selectCargo.appendChild(option);

        });

    } catch (error) {

        console.error('Erro ao carregar cargos:', error);

        const optionErro = document.createElement('option');

        optionErro.value = '';
        optionErro.textContent = 'Erro ao carregar cargos';

        selectCargo.appendChild(optionErro);

    }

}
