// Catálogo inicial fictício (pode ser substituído por fetch('/api/produtos') depois)
const PRODUTOS = [
  {
    id: 1,
    nome: "Pão Francês Crocante (500g)",
    categoria: "paes",
    descricao: "Fornada quentinha a cada 30 minutos. Casca crocante e miolo macio.",
    preco: 8.50,
    icone: "🥖"
  },
  {
    id: 2,
    nome: "Pão de Queijo Mineiro (6 un.)",
    categoria: "paes",
    descricao: "Receita tradicional com queijo meia cura artesanal.",
    preco: 12.00,
    icone: "🧀"
  },
  {
    id: 3,
    nome: "Croissant de Manteiga",
    categoria: "paes",
    descricao: "Massa folhada francesa assada na hora.",
    preco: 9.90,
    icone: "🥐"
  },
  {
    id: 4,
    nome: "Coxinha de Frango com Catupiry",
    categoria: "salgados",
    descricao: "Massa leve de batata recheada com frango desfiado temperado.",
    preco: 7.50,
    icone: "🍗"
  },
  {
    id: 5,
    nome: "Misto Quente na Chapa",
    categoria: "salgados",
    descricao: "Pão de forma artesanal, presunto magro, mussarela e manteiga.",
    preco: 11.00,
    icone: "🥪"
  },
  {
    id: 6,
    nome: "Bolo de Cenoura com Chocolate (Fatia)",
    categoria: "doces",
    descricao: "Cobertura cremosa de brigadeiro gourmet.",
    preco: 10.50,
    icone: "🍰"
  },
  {
    id: 7,
    nome: "Sonho de Creme de Baunilha",
    categoria: "doces",
    descricao: "Massa fofinha polvilhada com açúcar e recheio artesanal.",
    preco: 8.00,
    icone: "🍩"
  },
  {
    id: 8,
    nome: "Café Expresso Duplo (120ml)",
    categoria: "bebidas",
    descricao: "Grãos 100% arábica moídos na hora.",
    preco: 6.50,
    icone: "☕"
  },
  {
    id: 9,
    nome: "Suco de Laranja Natural (400ml)",
    categoria: "bebidas",
    descricao: "Espremido na hora, sem adição de açúcar ou conservantes.",
    preco: 9.00,
    icone: "🍊"
  }
];

let carrinho = JSON.parse(localStorage.getItem("carrinho_big_pao")) || [];
let categoriaAtual = "todos";
let termoBusca = "";

// Elementos do DOM
const productsGrid = document.getElementById("products-grid");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");
const cartCountBadge = document.getElementById("cart-count-badge");
const btnCheckout = document.getElementById("btn-checkout");
const searchInput = document.getElementById("search-input");
const categoryTabs = document.querySelectorAll(".tab-btn");
const sectionTitle = document.getElementById("section-title");
const btnAuthHeader = document.getElementById("btn-auth-header");

// Formata valores em Real
function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Renderiza os produtos filtrados
function renderizarProdutos() {
  const filtrados = PRODUTOS.filter((prod) => {
    const bateCategoria = categoriaAtual === "todos" || prod.categoria === categoriaAtual;
    const bateBusca =
      prod.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
      prod.descricao.toLowerCase().includes(termoBusca.toLowerCase());
    return bateCategoria && bateBusca;
  });

  if (filtrados.length === 0) {
    productsGrid.innerHTML = `<p>Nenhum produto encontrado para essa busca.</p>`;
    return;
  }

  productsGrid.innerHTML = filtrados
    .map(
      (prod) => `
      <article class="product-card">
        <div>
          <div class="product-emoji-cover">${prod.icone}</div>
          <div class="product-info">
            <h3>${prod.nome}</h3>
            <p class="product-desc">${prod.descricao}</p>
          </div>
        </div>
        <div class="product-bottom">
          <span class="product-price">${formatarMoeda(prod.preco)}</span>
          <button class="btn-add" onclick="adicionarAoCarrinho(${prod.id})">+ Adicionar</button>
        </div>
      </article>
    `
    )
    .join("");
}

// Manipulação do Carrinho
function adicionarAoCarrinho(idProduto) {
  const produto = PRODUTOS.find((p) => p.id === idProduto);
  if (!produto) return;

  const itemExistente = carrinho.find((item) => item.id === idProduto);
  if (itemExistente) {
    itemExistente.quantidade += 1;
  } else {
    carrinho.push({ ...produto, quantidade: 1 });
  }

  salvarEAtualizarCarrinho();
}

function alterarQuantidade(idProduto, delta) {
  const index = carrinho.findIndex((item) => item.id === idProduto);
  if (index === -1) return;

  carrinho[index].quantidade += delta;
  if (carrinho[index].quantidade <= 0) {
    carrinho.splice(index, 1);
  }

  salvarEAtualizarCarrinho();
}

function salvarEAtualizarCarrinho() {
  localStorage.setItem("carrinho_big_pao", JSON.stringify(carrinho));
  renderizarCarrinho();
}

function renderizarCarrinho() {
  const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  const valorTotal = carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);

  cartCountBadge.textContent = `${totalItens} ${totalItens === 1 ? "item" : "itens"}`;
  cartTotalEl.textContent = formatarMoeda(valorTotal);
  btnCheckout.disabled = carrinho.length === 0;

  if (carrinho.length === 0) {
    cartItemsContainer.innerHTML = `<p class="empty-cart-msg">Sua sacola está vazia. Escolha itens deliciosos ao lado!</p>`;
    return;
  }

  cartItemsContainer.innerHTML = carrinho
    .map(
      (item) => `
      <div class="cart-item">
        <div class="cart-item-info">
          <strong>${item.nome}</strong>
          <span>${formatarMoeda(item.preco * item.quantidade)}</span>
        </div>
        <div class="qty-controls">
          <button class="qty-btn" onclick="alterarQuantidade(${item.id}, -1)">-</button>
          <span>${item.quantidade}</span>
          <button class="qty-btn" onclick="alterarQuantidade(${item.id}, 1)">+</button>
        </div>
      </div>
    `
    )
    .join("");
}

// Eventos de Filtro e Busca
categoryTabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    categoryTabs.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    categoriaAtual = btn.dataset.category;
    sectionTitle.textContent = btn.textContent;
    renderizarProdutos();
  });
});

searchInput.addEventListener("input", (e) => {
  termoBusca = e.target.value;
  renderizarProdutos();
});

const API_BASE_URL = 'http://localhost:3001';

// Fluxo de Compra -> Redireciona para /login/login.html se não estiver logado
btnCheckout.addEventListener("click", () => {
  if (carrinho.length === 0) return;

  const usuarioNome = localStorage.getItem("usuario_nome");

  if (!usuarioNome) {
    // Marca que existe uma compra aguardando login
    localStorage.setItem("checkout_pendente", "true");
    // Caminho exato da sua pasta frontend/login/login.html
    window.location.href = "/login/login.html";
  } else {
    finalizarCompraFicticia(usuarioNome);
  }
});

function finalizarCompraFicticia(nomeCliente) {
  const total = cartTotalEl.textContent;
  const resumoItens = carrinho
    .map((item) => `• ${item.quantidade}x ${item.nome}`)
    .join("\n");

  alert(
    `✅ Pedido Confirmado na Padaria Big Pão!\n\n` +
    `Cliente: ${nomeCliente}\n` +
    `Itens:\n${resumoItens}\n\n` +
    `Total: ${total}\n` +
    `Obrigado pela preferência!`
  );

  carrinho = [];
  localStorage.removeItem("checkout_pendente");
  salvarEAtualizarCarrinho();
}

// Atualiza botão do cabeçalho e verifica se voltou de um checkout pendente
function verificarStatusLogin() {
  const usuarioNome = localStorage.getItem("usuario_nome");

  if (usuarioNome) {
    btnAuthHeader.textContent = `Olá, ${usuarioNome.split(" ")[0]} (Sair)`;
    btnAuthHeader.href = "#";
    btnAuthHeader.onclick = (e) => {
      e.preventDefault();
      localStorage.removeItem("usuario_nome");
      localStorage.removeItem("checkout_pendente");
      // Opcional: chamar sua rota de logout no backend se existir
      window.location.reload();
    };

    // Se o cliente acabou de fazer login vindo do botão "Comprar Agora"
    if (localStorage.getItem("checkout_pendente") === "true" && carrinho.length > 0) {
      setTimeout(() => {
        finalizarCompraFicticia(usuarioNome);
      }, 300);
    }
  }
}

// Inicialização
verificarStatusLogin();
renderizarProdutos();
renderizarCarrinho();