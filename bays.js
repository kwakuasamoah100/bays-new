// Load saved cart or initialize empty array
let cart = JSON.parse(localStorage.getItem('baysCart')) || [];

// DOM Elements
const cartToggle = document.getElementById('cartToggle');
const closeCart = document.getElementById('closeCart');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartItemsContainer = document.getElementById('cartItems');
const cartCountEl = document.getElementById('cartCount');
const cartTotalEl = document.getElementById('cartTotal');
const toast = document.getElementById('toast');

// Toggle Cart Sidebar
function toggleCart() {
  cartSidebar.classList.toggle('active');
  cartOverlay.classList.toggle('active');
}

cartToggle.addEventListener('click', toggleCart);
closeCart.addEventListener('click', toggleCart);
cartOverlay.addEventListener('click', toggleCart);

// Add Item to Cart
function addToCart(name, price) {
  const existingItem = cart.find(item => item.name === name);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ name, price, quantity: 1 });
  }

  saveAndUpdate();
  showToast(`${name} added!`);
}

// Adjust Quantity directly inside the Cart (+ / -)
function changeQuantity(name, delta) {
  const item = cart.find(item => item.name === name);
  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    cart = cart.filter(i => i.name !== name);
  }

  saveAndUpdate();
}

// Save to localStorage & render UI
function saveAndUpdate() {
  localStorage.setItem('baysCart', JSON.stringify(cart));
  updateCartUI();
}

// Render UI
function updateCartUI() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountEl.textContent = totalCount;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p style="color: #888; text-align: center; margin-top: 40px;">Your cart is empty.</p>';
  } else {
    cartItemsContainer.innerHTML = cart.map(item => `
      <div class="cart-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <div>
          <strong>${item.name}</strong>
          <div style="color: #666; font-size: 0.85rem;">$${item.price.toFixed(2)} ea.</div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button onclick="changeQuantity('${item.name}', -1)" style="padding: 2px 8px; cursor: pointer;">-</button>
          <span>${item.quantity}</span>
          <button onclick="changeQuantity('${item.name}', 1)" style="padding: 2px 8px; cursor: pointer;">+</button>
          <strong style="margin-left: 10px;">$${(item.price * item.quantity).toFixed(2)}</strong>
        </div>
      </div>
    `).join('');
  }

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  cartTotalEl.textContent = `$${totalPrice.toFixed(2)}`;
}

// Notification Toast
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

// Checkout Action
function checkout() {
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  alert('Thank you for your order! Bays will prepare it shortly.');
  cart = [];
  saveAndUpdate();
  toggleCart();
}

// Initial Load
updateCartUI();