const API_BASE_URL = '';
const API_IMAGEM_PREFIX = '/view-image';

const carrosselWrapper = document.getElementById('carrossel-wrapper');
const contadorCarrinho = document.getElementById('contadorCarrinho');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const itemMenuCadastros = document.getElementById("itemMenuCadastros");

function handleUserAction(action) {
  if (action === "sair") {
    logout();
  }
}

async function logout() {
  try {
    const res = await fetch(API_BASE_URL + '/login/logout', {
      credentials: 'include'
    });

    const data = await res.json();

    if (data.status === 'ok') {
      window.location.href = "/login";
      return true;
    } else {
      window.location.href = "/login";
      return false;
    }

  } catch (error) {
    console.error("Erro ao tentar fazer logout:", error);
    window.location.href = "/login";
    return false;
  }
}

async function verificarAutorizacao() {
  try {
    const res = await fetch(API_BASE_URL + '/login/verificaSeUsuarioEstaLogado', {
      credentials: 'include'
    });

    if (!res.ok || res.redirected) { window.location.href = '/login'; return false; }
    const oUsuario = await res.json();

    if (oUsuario.status !== 'ok') {
      //console.log("Usuário não logado, redirecionando...");
       window.location.href = "/login";
      return false;
    }

    const usuarioObjeto = JSON.parse(oUsuario.usuario || '{}');
    const oCargo = usuarioObjeto.ehFuncionario ? usuarioObjeto.ehFuncionario.nome_cargo : 'Cliente';
    
    // 🟢 LÓGICA DE CONTROLE DO MENU CADASTROS
    if (itemMenuCadastros) {
      if (oCargo === 'Gerente') {
        // Se for Gerente, adiciona a classe para tornar o item visível (usando display: block)
        itemMenuCadastros.classList.add("gerente-acesso-total");
      } else {
        // Caso contrário, remove a classe (o CSS mantém o display: none por padrão)
        itemMenuCadastros.classList.remove("gerente-acesso-total");
      }
    }
    
    document.getElementById("oUsuario").options[0].text = `${usuarioObjeto.nome} - ${oCargo}`;
    return true;

  } catch (error) {
    console.error("Erro ao verificar login:", error);
    return false;
  }
}

function atualizarContadorCarrinho() {
  const carrinho = JSON.parse(sessionStorage.getItem('carrinho')) || [];
  contadorCarrinho.textContent = carrinho.length;
}

function obterEmojiProduto(nome) {
  const texto = (nome || '').toLowerCase();
  if (texto.includes('pão') || texto.includes('pao') || texto.includes('broa')) return '🥖';
  if (texto.includes('bolo')) return '🍰';
  if (texto.includes('sonho') || texto.includes('doce') || texto.includes('rosquinha')) return '🍩';
  if (texto.includes('coxinha') || texto.includes('salgado')) return '🥟';
  if (texto.includes('café') || texto.includes('cafe')) return '☕';
  if (texto.includes('croissant')) return '🥐';
  return '🧁';
}

function criarCardProduto(produto) {
  const card = document.createElement('div');
  card.classList.add('produto-card');
  const precoFormatado = parseFloat(produto.preco_unitario_produto).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  card.innerHTML = `
    <div class="card-imagem-emoji" aria-hidden="true">${obterEmojiProduto(produto.nome_produto)}</div>
    <div class="card-titulo">${String(produto.nome_produto ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}</div>
    <div class="card-detalhe">Código: ${produto.id_produto}</div>
    <div class="card-detalhe">Disponíveis: ${produto.quantidade_estoque_produto ?? "Consulte"}</div>
    <div class="card-preco">${precoFormatado} / unidade</div>
    <div class="card-selecao-quantidade">
      <label for="qtd-${produto.id_produto}">Quantidade:</label>
      <input type="number" id="qtd-${produto.id_produto}" class="input-quantidade" value="1" min="1" step="1" data-produto-id="${produto.id_produto}">
    </div>
    <button class="btn-carrinho" data-produto-id="${produto.id_produto}">Adicionar ao Carrinho</button>
  `;
  return card;
}

function adicionarAoCarrinho(produtoId) {
  const inputQtd = document.querySelector(`.input-quantidade[data-produto-id="${produtoId}"]`);
  const quantidadeUnidades = parseInt(inputQtd.value, 10);

  if (isNaN(quantidadeUnidades) || quantidadeUnidades < 1) {
    alert('Por favor, insira uma quantidade válida (mínimo 1 unidade).');
    return;
  }

  fetch(`${API_BASE_URL}/produto/${produtoId}`)
    .then(res => {
      if (!res.ok) throw new Error("Erro ao buscar produto");
      return res.json();
    })
    .then(produtoAPI => {
      const item = {
        id: produtoAPI.id_produto,
        nome: produtoAPI.nome_produto,
        preco: produtoAPI.preco_unitario_produto,
        quantidade: quantidadeUnidades
      };

      let carrinho = JSON.parse(sessionStorage.getItem('carrinho')) || [];
      const existente = carrinho.find(i => i.id === item.id);

      if (existente) {
        existente.quantidade += quantidadeUnidades;
      } else {
        carrinho.push(item);
      }

      sessionStorage.setItem('carrinho', JSON.stringify(carrinho));
      atualizarContadorCarrinho();
    })
    .catch((erro) => {
      console.error(erro);
      alert("Erro ao adicionar ao carrinho.");
    });
}

function renderizarProdutos(dados) {
  carrosselWrapper.innerHTML = '';

  const produtos = Array.isArray(dados) ? dados : (dados.products || []);

  if (produtos.length === 0) {
    carrosselWrapper.innerHTML = `<div class="mensagem-info">Nenhum produto encontrado.</div>`;
    return;
  }

  produtos.forEach(p => {
    const card = criarCardProduto(p);
    carrosselWrapper.appendChild(card);
  });

  document.querySelectorAll('.btn-carrinho').forEach(btn => {
    btn.addEventListener('click', e => adicionarAoCarrinho(e.target.dataset.produtoId));
  });
}

async function buscarProdutos() {
  try {
    const resposta = await fetch(API_BASE_URL + "/produto");

    if (!resposta.ok) {
      throw new Error("Erro na resposta da API");
    }

    const dados = await resposta.json();

    renderizarProdutos(dados);

  } catch (erro) {
    console.error("Erro ao carregar produtos:", erro);
    carrosselWrapper.innerHTML = `<div class="mensagem-info" style="color:red;">Erro ao carregar os produtos.</div>`;
  }
}

// ====== Controles do carrossel ======
prevBtn.addEventListener('click', () => {
  carrosselWrapper.scrollBy({ left: -300, behavior: 'smooth' });
});

nextBtn.addEventListener('click', () => {
  carrosselWrapper.scrollBy({ left: 300, behavior: 'smooth' });
});

// ====== Inicialização ======
window.onload = () => {
  // A ordem é importante: primeiro verifica a autorização para configurar o menu
  verificarAutorizacao(); 
  buscarProdutos();
  atualizarContadorCarrinho();
};