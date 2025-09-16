/* ===== surfXsurfboard — simple client-side cart ===== */

const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];
const currency = v => `$${Number(v).toFixed(0)}`;

// Elements
const cartBtn = $('.cart-button');
const cartDrawer = $('#cart-drawer');
const cartScrim = $('#cart-scrim');
const closeCartBtn = $('#close-cart');
const cartItemsEl = $('#cart-items');
const subtotalEl = $('#subtotal');
const cartCountEl = $('#cart-count');
const checkoutBtn = $('#checkout-btn');
const clearCartBtn = $('#clear-cart');
const goToCartBtn = $('#go-to-cart');

// Load/save cart
const CART_KEY = 'sxs_cart';
const loadCart = () => JSON.parse(localStorage.getItem(CART_KEY) || '[]');
const saveCart = (items) => localStorage.setItem(CART_KEY, JSON.stringify(items));

let cart = loadCart();

// Open/close cart
function openCart() {
  cartDrawer.hidden = false;
  cartBtn.setAttribute('aria-expanded', 'true');
  renderCart();
}
function closeCart() {
  cartDrawer.hidden = true;
  cartBtn.setAttribute('aria-expanded', 'false');
}

cartBtn.addEventListener('click', openCart);
cartScrim.addEventListener('click', closeCart);
closeCartBtn.addEventListener('click', closeCart);
goToCartBtn?.addEventListener('click', openCart);

// Add to cart
$$('.add-to-cart').forEach(btn => {
  btn.addEventListener('click', e => {
    const card = e.target.closest('.product-card');
    const id = card.dataset.id;
    const title = card.querySelector('h3').textContent.trim();
    const price = Number(card.querySelector('.price').dataset.price);
    const size = card.querySelector('.size-select').value;
    const qty = Math.max(1, Number(card.querySelector('.qty-input').value));
    const img = card.querySelector('.product-img').getAttribute('src');

    // Upsert item (id + size acts as unique variant)
    const key = `${id}__${size}`;
    const existing = cart.find(i => i.key === key);
    if (existing) existing.qty += qty;
    else cart.push({ key, id, title, size, price, qty, img });

    saveCart(cart);
    renderCart();
    openCart();
  });
});

// Render cart
function renderCart() {
  // Count + subtotal
  const count = cart.reduce((n, i) => n + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  cartCountEl.textContent = count;
  subtotalEl.textContent = currency(subtotal);

  // Items
  if (cart.length === 0) {
    cartItemsEl.innerHTML = `<p class="muted">Your cart is empty.</p>`;
    return;
  }
  cartItemsEl.innerHTML = cart.map((i, idx) => `
    <div class="cart-item" data-key="${i.key}">
      <img src="${i.img}" alt="${i.title}">
      <div>
        <h4>${i.title}</h4>
        <div class="meta">Size: ${i.size}</div>
        <div class="meta">${currency(i.price)} each</div>
      </div>
      <div class="cart-controls">
        <input type="number" value="${i.qty}" min="1" data-idx="${idx}" class="line-qty">
        <button data-idx="${idx}" class="remove">Remove</button>
      </div>
    </div>
  `).join('');

  // Bind qty & remove
  $$('.line-qty', cartItemsEl).forEach(inp => {
    inp.addEventListener('input', e => {
      const idx = Number(e.target.dataset.idx);
      const val = Math.max(1, Number(e.target.value || 1));
      cart[idx].qty = val;
      saveCart(cart);
      renderCart();
    });
  });
  $$('.remove', cartItemsEl).forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = Number(e.target.dataset.idx);
      cart.splice(idx, 1);
      saveCart(cart);
      renderCart();
    });
  });
}

// Clear cart
clearCartBtn.addEventListener('click', () => {
  cart = [];
  saveCart(cart);
  renderCart();
});

// “Checkout”
checkoutBtn.addEventListener('click', (e) => {
  // In a real app you’d redirect to a hosted checkout or show a payment form.
  const summary = cart.map(i => `${i.qty}× ${i.title} (${i.size}) — ${currency(i.price*i.qty)}`).join('\n');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  alert(`Order summary:\n\n${summary || 'Cart is empty.'}\n\nTotal: ${currency(total)}\n\nThis is a portfolio demo checkout. Replace with Stripe/PayPal when ready.`);
});
 
// Init
renderCart();
