const API_BASE_URL = 'http://localhost:3001';

let produtosBanco = [];
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
const selectPagamento = document.getElementById("forma-pagamento");

// Formata valores em Real (converte string NUMERIC do Postgres para Number)
function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Ícone fallback caso imagem_produto esteja vazia no banco
function obterIconeCategoria(categoria) {
  const mapa = {
    "Pães": "🥖",
    "Salgados": "🥟",
    "Doces": "🍰",
    "Bebidas": "☕",
  };
  return mapa[categoria] || "🍽️";
}

// 1. BUSCAR PRODUTOS DO POSTGRESQL (GET /produto)
async function carregarProdutosDoBanco() {
  productsGrid.innerHTML = `<p>Carregando cardápio da padaria...</p>`;

  try {
    const response = await fetch(`${API_BASE_URL}/produto`);
    if (!response.ok) {
      throw new Error("Falha ao buscar produtos no servidor.");
    }

    produtosBanco = await response.json();
    renderizarProdutos();
  } catch (erro) {
    console.error("Erro ao carregar produtos:", erro);
    productsGrid.innerHTML = `<p style="color: #b85316;">Não foi possível carregar os produtos. Verifique se o servidor Node (porta 3001) e o PostgreSQL estão rodando.</p>`;
  }
}

// 2. RENDERIZAR VITRINE COM DADOS REAIS DO BANCO
function renderizarProdutos() {
  const filtrados = produtosBanco.filter((prod) => {
    const bateCategoria =
      categoriaAtual === "todos" || prod.nome_categoria === categoriaAtual;

    const nome = (prod.nome_produto || "").toLowerCase();
    const desc = (prod.descricao_produto || "").toLowerCase();
    const bateBusca =
      nome.includes(termoBusca.toLowerCase()) ||
      desc.includes(termoBusca.toLowerCase());

    return bateCategoria && bateBusca;
  });

  if (filtrados.length === 0) {
    productsGrid.innerHTML = `<p>Nenhum produto encontrado nesta categoria.</p>`;
    return;
  }

  productsGrid.innerHTML = filtrados
    .map((prod) => {
      const semEstoque = Number(prod.quantidade_estoque) <= 0;

      // Se houver imagem_produto cadastrada no banco, exibe <img>, senão exibe emoji da categoria
      const midiaHtml = prod.imagem_produto
        ? `<div class="product-emoji-cover" style="overflow:hidden; padding:0;">
             <img src="/imagens/${prod.imagem_produto}" alt="${prod.nome_produto}" style="width:100%; height:100%; object-fit:cover;">
           </div>`
        : `<div class="product-emoji-cover">${obterIconeCategoria(prod.nome_categoria)}</div>`;

      return `
        <article class="product-card">
          <div>
            ${midiaHtml}
            <div class="product-info">
              <h3>${prod.nome_produto}</h3>
              <p class="product-desc">${prod.descricao_produto || "Produto fresquinho preparado na hora."}</p>
            </div>
          </div>
          <div class="product-bottom">
            <div>
              <span class="product-price">${formatarMoeda(prod.preco_produto)}</span>
              <small style="display:block; font-size:0.75rem; color:#736b66;">
                ${semEstoque ? "Indisponível" : `Estoque: ${prod.quantidade_estoque} ${prod.unidade_produto || "un"}`}
              </small>
            </div>
            <button 
              class="btn-add" 
              onclick="adicionarAoCarrinho(${prod.id_produto})"
              ${semEstoque ? 'disabled style="background:#ccc; cursor:not-allowed;"' : ""}
            >
              ${semEstoque ? "Esgotado" : "+ Adicionar"}
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

// 3. MANIPULAÇÃO DO CARRINHO (RESPEITANDO ESTOQUE DO BANCO)
function adicionarAoCarrinho(idProduto) {
  const produto = produtosBanco.find((p) => p.id_produto === idProduto);
  if (!produto) return;

  const itemExistente = carrinho.find((item) => item.id_produto === idProduto);
  const qtdAtualNoCarrinho = itemExistente ? itemExistente.quantidade : 0;

  if (qtdAtualNoCarrinho + 1 > Number(produto.quantidade_estoque)) {
    alert(`Quantidade máxima em estoque atingida (${produto.quantidade_estoque} un.).`);
    return;
  }

  if (itemExistente) {
    itemExistente.quantidade += 1;
  } else {
    carrinho.push({
      id_produto: produto.id_produto,
      nome_produto: produto.nome_produto,
      preco_produto: Number(produto.preco_produto),
      quantidade_estoque: Number(produto.quantidade_estoque),
      unidade_produto: produto.unidade_produto || "un",
      quantidade: 1,
    });
  }

  salvarEAtualizarCarrinho();
}

function alterarQuantidade(idProduto, delta) {
  const index = carrinho.findIndex((item) => item.id_produto === idProduto);
  if (index === -1) return;

  const novaQtd = carrinho[index].quantidade + delta;

  if (novaQtd > carrinho[index].quantidade_estoque) {
    alert(`Estoque disponível: ${carrinho[index].quantidade_estoque} un.`);
    return;
  }

  if (novaQtd <= 0) {
    carrinho.splice(index, 1);
  } else {
    carrinho[index].quantidade = novaQtd;
  }

  salvarEAtualizarCarrinho();
}

function salvarEAtualizarCarrinho() {
  localStorage.setItem("carrinho_big_pao", JSON.stringify(carrinho));
  renderizarCarrinho();
}

function renderizarCarrinho() {
  const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  const valorTotal = carrinho.reduce(
    (acc, item) => acc + Number(item.preco_produto) * item.quantidade,
    0
  );

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
          <strong>${item.nome_produto}</strong>
          <span>${formatarMoeda(Number(item.preco_produto) * item.quantidade)}</span>
        </div>
        <div class="qty-controls">
          <button class="qty-btn" onclick="alterarQuantidade(${item.id_produto}, -1)">-</button>
          <span>${item.quantidade} ${item.unidade_produto || "un"}</span>
          <button class="qty-btn" onclick="alterarQuantidade(${item.id_produto}, 1)">+</button>
        </div>
      </div>
    `
    )
    .join("");
}

// 4. FILTROS E BUSCA
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

// 5. CHECKOUT REAL NO POSTGRESQL (POST /pedido)
btnCheckout.addEventListener("click", () => {
  if (carrinho.length === 0) return;

  const sessao = JSON.parse(localStorage.getItem("usuario_sessao") || "null");

  if (!sessao || !sessao.id_pessoa) {
    localStorage.setItem("checkout_pendente", "true");
    window.location.href = "/login/login.html";
  } else {
    finalizarPedidoNoBanco(sessao);
  }
});

async function finalizarPedidoNoBanco(sessao) {
  const formaPagamento = selectPagamento ? selectPagamento.value : "Pix";

  btnCheckout.disabled = true;
  btnCheckout.textContent = "Processando pedido...";

  try {
    const response = await fetch(`${API_BASE_URL}/pedido`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id_pessoa: sessao.id_pessoa,
        nome_forma_pagamento: formaPagamento,
        itens: carrinho.map((item) => ({
          id_produto: item.id_produto,
          quantidade: item.quantidade,
        })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.erro || "Falha ao registrar o pedido.");
    }

    alert(
      `✅ Pedido #${data.pedido.id_pedido} Confirmado!\n\n` +
      `Cliente: ${sessao.nome}\n` +
      `Pagamento: ${formaPagamento}\n` +
      `Total: ${formatarMoeda(data.pedido.valor_total)}`
    );

    carrinho = [];
    localStorage.removeItem("checkout_pendente");
    salvarEAtualizarCarrinho();
    await carregarProdutosDoBanco(); // Atualiza o estoque exibido na vitrine
  } catch (erro) {
    alert(`Erro ao concluir compra: ${erro.message}`);
  } finally {
    btnCheckout.textContent = "Comprar Agora";
    btnCheckout.disabled = carrinho.length === 0;
  }
}

function verificarStatusLogin() {
  const sessao = JSON.parse(localStorage.getItem("usuario_sessao") || "null");

  if (sessao && sessao.nome) {
    const ehAdmin = (sessao.papeis || []).some(
      (p) => p === "gerente" || p === "funcionario"
    );

    // Se for funcionário ou gerente, adiciona atalho para o Painel Administrativo ao lado do Sair
    if (ehAdmin) {
      const linkAdmin = document.createElement("a");
      linkAdmin.href = "/admin/admin.html";
      linkAdmin.className = "btn-login-header";
      linkAdmin.style.marginRight = "8px";
      linkAdmin.textContent = "⚙️ Painel Admin";
      btnAuthHeader.parentNode.insertBefore(linkAdmin, btnAuthHeader);
    }

    btnAuthHeader.textContent = `Olá, ${sessao.nome.split(" ")[0]} (Sair)`;
    btnAuthHeader.href = "#";
    btnAuthHeader.onclick = async (e) => {
      e.preventDefault();
      await fetch(`${API_BASE_URL}/login/logout`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
      localStorage.removeItem("usuario_sessao");
      localStorage.removeItem("checkout_pendente");
      window.location.reload();
    };

    if (localStorage.getItem("checkout_pendente") === "true" && carrinho.length > 0) {
      setTimeout(() => {
        finalizarPedidoNoBanco(sessao);
      }, 300);
    }
  }
}

// Inicialização
verificarStatusLogin();
carregarProdutosDoBanco();
renderizarCarrinho();
