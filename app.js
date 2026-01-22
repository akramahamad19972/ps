(function () {
  const root = document.documentElement;

  // ---------- Theme ----------
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    root.setAttribute("data-theme", savedTheme);
  } else {
    const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    root.setAttribute("data-theme", prefersLight ? "light" : "dark");
  }

  window.toggleTheme = function () {
    const current = root.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  // ---------- Currency (LKR) ----------
  function formatLKR(amount) {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0
    }).format(amount);
  }
  window.formatLKR = formatLKR;

  // ---------- Product Catalog ----------
  // Edit prices/details here (in LKR)
  const PRODUCTS = [
    {
      id: "netflix",
      name: "Netflix",
      tagline: "Streaming subscription • HD / UHD options",
      priceLkr: 2500,
      logoText: "N" // simple logo letter (you can replace with image later)
    },
    {
      id: "linkedin",
      name: "LinkedIn Premium",
      tagline: "Professional tools for jobs & business",
      priceLkr: 3900,
      logoText: "in"
    },
    {
      id: "ai",
      name: "AI Tools",
      tagline: "AI subscription for productivity & content",
      priceLkr: 4500,
      logoText: "AI"
    }
  ];

  function getProduct(id) {
    return PRODUCTS.find(p => p.id === id);
  }
  window.getProduct = getProduct;
  window.getAllProducts = () => PRODUCTS.slice();

  // ---------- Cart (localStorage) ----------
  const CART_KEY = "cart_v1";

  function readCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  }

  function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateCartCount();
  }

  function addToCart(productId, qty = 1) {
    const product = getProduct(productId);
    if (!product) return;

    const cart = readCart();
    const existing = cart.find(i => i.productId === productId);
    if (existing) existing.qty += qty;
    else cart.push({ productId, qty });

    writeCart(cart);
  }

  function removeFromCart(productId) {
    const cart = readCart().filter(i => i.productId !== productId);
    writeCart(cart);
  }

  function setQty(productId, qty) {
    const cart = readCart();
    const item = cart.find(i => i.productId === productId);
    if (!item) return;
    item.qty = Math.max(1, Number(qty) || 1);
    writeCart(cart);
  }

  function clearCart() {
    writeCart([]);
  }

  function cartSummary() {
    const cart = readCart();
    let total = 0;
    const lines = cart.map(i => {
      const p = getProduct(i.productId);
      if (!p) return null;
      const lineTotal = p.priceLkr * i.qty;
      total += lineTotal;
      return { ...i, product: p, lineTotal };
    }).filter(Boolean);

    return { items: lines, total };
  }

  window.cart = {
    readCart,
    addToCart,
    removeFromCart,
    setQty,
    clearCart,
    cartSummary
  };

  // ---------- Cart Count Badge ----------
  function updateCartCount() {
    const cart = readCart();
    const count = cart.reduce((s, i) => s + (i.qty || 0), 0);
    document.querySelectorAll("[data-cart-count]").forEach(el => {
      el.textContent = String(count);
    });
  }

  document.addEventListener("DOMContentLoaded", updateCartCount);

  // ---------- WhatsApp Checkout ----------
  // Put your WhatsApp number here in international format WITHOUT +
  // Example Sri Lanka: 947XXXXXXXX
  const WHATSAPP_NUMBER = "947000000000"; // <-- CHANGE THIS

  function buildWhatsAppMessage(customerName, customerEmail) {
    const { items, total } = cartSummary();
    const lines = items.map((x, idx) => {
      return `${idx + 1}) ${x.product.name} x${x.qty} = ${formatLKR(x.lineTotal)}`;
    });

    return [
      "🛒 *New Subscription Order*",
      "",
      `👤 Name: ${customerName || "-"}`,
      `📧 Email: ${customerEmail || "-"}`,
      "",
      "🧾 Items:",
      ...lines,
      "",
      `💰 Total: *${formatLKR(total)}*`,
      "",
      "Please confirm availability and activation time. ✅"
    ].join("\n");
  }

  window.checkoutToWhatsApp = function ({ name, email }) {
    const { items } = cartSummary();
    if (!items.length) {
      alert("Your cart is empty.");
      return;
    }
    const message = buildWhatsAppMessage(name, email);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.location.href = url;
  };
})();
