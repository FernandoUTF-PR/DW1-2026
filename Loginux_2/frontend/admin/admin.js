const API_BASE_URL = 'http://localhost:3001';

const form = document.getElementById('produto-form');
const formTitle = document.getElementById('form-title');
const btnCancelar = document.getElementById('btn-cancelar');
const tabelaBody = document.getElementById('tabela-produtos');
const totalProdutosEl = document.getElementById('total-produtos');
const selectCategoria = document.getElementById('id_categoria');
const imagemAtualInfo = document.getElementById('imagem-atual-info');

let listaProdutos = [];

// Proteção da página no frontend: exige papel 'gerente' ou 'funcionario'
function verificarAcessoAdmin() {
  const sessao = JSON.parse(localStorage.getItem('usuario_sessao') || 'null');
  const ehAdmin = sessao && (sessao.papeis || []).some(p => p === 'gerente' || p === 'funcionario');

  if (!ehAdmin) {
    alert('Acesso restrito a funcionários e gerentes.');
    window.location.href = '/login/login.html';
    return false;
  }

  document.getElementById('admin-welcome').textContent = `Logado como: ${sessao.nome} (${sessao.papeis.join(', ')})`;
  return true;
}

async function carregarCategorias() {
  const res = await fetch(`${API_BASE_URL}/produto/categorias`);
  const categorias = await res.json();

  selectCategoria.innerHTML = `<option value="">Selecione...</option>` +
    categorias.map(c => `<option value="${c.id_categoria}">${c.nome_categoria}</option>`).join('');
}

async function carregarProdutos() {
  const res = await fetch(`${API_BASE_URL}/produto`);
  listaProdutos = await res.json();

  totalProdutosEl.textContent = `${listaProdutos.length} produto(s)`;

  tabelaBody.innerHTML = listaProdutos.map(p => {
    const imgHtml = p.imagem_produto
      ? `<img src="/imagens/${p.imagem_produto}" class="thumb-img" alt="${p.nome_produto}">`
      : `<div class="thumb-img" style="display:flex;align-items:center;justify-content:center;">🥖</div>`;

    return `
      <tr>
        <td>${imgHtml}</td>
        <td>
          <strong>${p.nome_produto}</strong><br>
          <small style="color:#736b66;">${p.descricao_produto || ''}</small>
        </td>
        <td>${p.nome_categoria || '-'}</td>
        <td>R$ ${Number(p.preco_produto).toFixed(2).replace('.', ',')}</td>
        <td>${p.quantidade_estoque} ${p.unidade_produto || 'un'}</td>
        <td>
          <button class="action-btn btn-edit" onclick="editarProduto(${p.id_produto})">Editar</button>
          <button class="action-btn btn-del" onclick="excluirProduto(${p.id_produto})">Excluir</button>
        </td>
      </tr>
    `;
  }).join('');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('id_produto').value;
  const formData = new FormData();

  formData.append('nome_produto', document.getElementById('nome_produto').value.trim());
  formData.append('id_categoria', document.getElementById('id_categoria').value);
  formData.append('unidade_produto', document.getElementById('unidade_produto').value);
  formData.append('preco_produto', document.getElementById('preco_produto').value);
  formData.append('quantidade_estoque', document.getElementById('quantidade_estoque').value);
  formData.append('descricao_produto', document.getElementById('descricao_produto').value.trim());

  const arquivoImagem = document.getElementById('imagem').files[0];
  if (arquivoImagem) {
    formData.append('imagem', arquivoImagem);
  }

  const url = id ? `${API_BASE_URL}/produto/${id}` : `${API_BASE_URL}/produto`;
  const method = id ? 'PUT' : 'POST';

  try {
    const response = await fetch(url, {
      method,
      credentials: 'include', // Envia o cookie usuarioLogado para validar permissão admin
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.erro || 'Erro ao salvar produto.');
    }

    alert(id ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
    resetarFormulario();
    await carregarProdutos();
  } catch (err) {
    alert(err.message);
  }
});

function editarProduto(id) {
  const prod = listaProdutos.find(p => p.id_produto === id);
  if (!prod) return;

  document.getElementById('id_produto').value = prod.id_produto;
  document.getElementById('nome_produto').value = prod.nome_produto;
  document.getElementById('id_categoria').value = prod.id_categoria || '';
  document.getElementById('unidade_produto').value = prod.unidade_produto || 'un';
  document.getElementById('preco_produto').value = prod.preco_produto;
  document.getElementById('quantidade_estoque').value = prod.quantidade_estoque;
  document.getElementById('descricao_produto').value = prod.descricao_produto || '';

  imagemAtualInfo.textContent = prod.imagem_produto
    ? `Imagem atual: ${prod.imagem_produto} (envie outra apenas se quiser trocar)`
    : 'Nenhuma imagem cadastrada.';

  formTitle.textContent = `Editando: ${prod.nome_produto}`;
  btnCancelar.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function excluirProduto(id) {
  if (!confirm('Deseja remover este produto do cardápio?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/produto/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.erro || 'Erro ao excluir.');
    }

    await carregarProdutos();
  } catch (err) {
    alert(err.message);
  }
}

function resetarFormulario() {
  form.reset();
  document.getElementById('id_produto').value = '';
  imagemAtualInfo.textContent = '';
  formTitle.textContent = 'Cadastrar Novo Produto';
  btnCancelar.classList.add('hidden');
}

btnCancelar.addEventListener('click', resetarFormulario);

document.getElementById('btn-logout').addEventListener('click', async () => {
  await fetch(`${API_BASE_URL}/login/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
  localStorage.removeItem('usuario_sessao');
  window.location.href = '/menu.html';
});

if (verificarAcessoAdmin()) {
  carregarCategorias();
  carregarProdutos();
}