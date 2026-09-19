/* ==========================================================================
   BAYS RESTAURANT - STOREFRONT & CHECKOUT (script.js)
   Configured for Haatso & Botwe
   ========================================================================== */

let menuData = {};
let currentBranchKey = 'Haatso';
let currentBranchName = 'Haatso';
let cart = [];

// Helper function to format prices consistently in Ghanaian Cedis
function formatCedi(amount) {
  return `GH₵ ${parseFloat(amount || 0).toFixed(2)}`;
}

// 1. INITIALIZE PAGE & FETCH FRESH MENU DATA
document.addEventListener('DOMContentLoaded', () => {
  // Load any previously selected branch from browser storage
  const savedBranch = localStorage.getItem('bays_selected_branch');
  if (savedBranch && (savedBranch === 'Haatso' || savedBranch === 'Botwe')) {
    currentBranchKey = savedBranch;
  } else {
    currentBranchKey = 'Haatso';
  }

  // Load saved cart items if any exist
  const savedCart = localStorage.getItem('bays_customer_cart');
  if (savedCart) {
    try { 
      cart = JSON.parse(savedCart); 
    } catch (e) { 
      cart = []; 
    }
  }

  fetchFreshMenu();
  updateCartUI();
});

// Fetch menu.json with a timestamp parameter to force fresh loads and avoid browser caching
async function fetchFreshMenu() {
  try {
    const cacheBuster = new Date().getTime();
    const response = await fetch(`menu.json?v=${cacheBuster}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    menuData = await response.json();

    // Safeguard fallback if active key is missing from JSON
    if (!menuData[currentBranchKey]) {
      currentBranchKey = Object.keys(menuData)[0] || 'Haatso';
    }

    if (menuData[currentBranchKey]) {
      currentBranchName = menuData[currentBranchKey].branchName || currentBranchKey;
    }

    renderMenuGrid();
  } catch (error) {
    console.error('Error loading menu.json:', error);
    const gridContainer = document.getElementById('menuGrid') || document.getElementById('menu-container');
    if (gridContainer) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #e74c3c;">
          <h3>Unable to load menu data</h3>
          <p>Please ensure <code>menu.json</code> exists in your project directory.</p>
        </div>
      `;
    }
  }
}

// 2. SWITCH BRANCHES (Haatso vs. Botwe)
function switchBranch(branchKey) {
  if (!menuData[branchKey]) return;
  
  currentBranchKey = branchKey;
  currentBranchName = menuData[branchKey].branchName || branchKey;
  localStorage.setItem('bays_selected_branch', branchKey);

  // Update UI active states if branch buttons are used
  const branchButtons = document.querySelectorAll('.branch-btn');
  branchButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.branch === branchKey);
  });

  renderMenuGrid();
}

// Handler function explicitly matching the onclick event in index.html
function selectBranch(branchKey) {
  // 1. Switch active branch data (e.g. 'Haatso' or 'Botwe')
  switchBranch(branchKey);

  // 2. Hide the branch selection overlay/modal
  const branchModal = document.getElementById('branchModal') || document.querySelector('.modal') || document.getElementById('branchSelectionPage');
  if (branchModal) {
    branchModal.style.display = 'none';
  }

  // 3. Ensure the menu display container is visible
  const mainContent = document.getElementById('mainContent') || document.getElementById('menuGrid');
  if (mainContent) {
    mainContent.style.display = 'block';
  }
}

// 3. RENDER DYNAMIC MENU GRID
function renderMenuGrid() {
  const gridContainer = document.getElementById('menuGrid') || document.getElementById('menu-container');
  if (!gridContainer) return;

  const branchObj = menuData[currentBranchKey];
  if (!branchObj || !branchObj.menu || branchObj.menu.length === 0) {
    gridContainer.innerHTML = '<p style="text-align:center; padding: 20px;">No items currently available for this branch.</p>';
    return;
  }

  gridContainer.innerHTML = branchObj.menu.map((item, index) => `
    <div class="menu-card" style="border: 1px solid #eee; padding: 15px; border-radius: 8px; background: #fff; margin-bottom: 15px;">
      <h3 style="margin: 0 0 8px 0;">${item.name}</h3>
      <p style="color: #666; font-size: 0.9rem; margin: 0 0 10px 0;">${item.desc || ''}</p>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: bold; color: #27ae60; font-size: 1.1rem;">${formatCedi(item.price)}</span>
        <button onclick="addToCart('${currentBranchKey}', ${index})" 
                style="background: #e67e22; color: #fff; border: none; padding: 8px 14px; border-radius: 5px; cursor: pointer; font-weight: bold;">
          + Add to Cart
        </button>
      </div>
    </div>
  `).join('');
}

// 4. CART MANAGEMENT
function addToCart(branchKey, itemIndex) {
  const item = menuData[branchKey].menu[itemIndex];
  if (!item) return;

  const existingIndex = cart.findIndex(c => c.name === item.name && c.branch === currentBranchName);

  if (existingIndex > -1) {
    cart[existingIndex].quantity += 1;
  } else {
    cart.push({
      name: item.name,
      price: parseFloat(item.price),
      quantity: 1,
      branch: currentBranchName
    });
  }

  saveAndRefreshCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveAndRefreshCart();
}

function updateQuantity(index, change) {
  if (!cart[index]) return;
  cart[index].quantity += change;
  if (cart[index].quantity <= 0) cart.splice(index, 1);
  saveAndRefreshCart();
}

function saveAndRefreshCart() {
  localStorage.setItem('bays_customer_cart', JSON.stringify(cart));
  updateCartUI();
}

// 5. UPDATE CART SIDEBAR / DRAWER UI
function updateCartUI() {
  const cartItemsContainer = document.getElementById('cartItems');
  const cartTotalElement = document.getElementById('cartTotal');
  const cartCountElement = document.getElementById('cartCount');

  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCountElement) cartCountElement.textContent = totalItemCount;

  if (!cartItemsContainer || !cartTotalElement) return;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">Your cart is empty.</p>';
    cartTotalElement.textContent = formatCedi(0);
    return;
  }

  let grandTotal = 0;

  cartItemsContainer.innerHTML = cart.map((item, index) => {
    const itemTotal = item.price * item.quantity;
    grandTotal += itemTotal;

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding: 10px 0;">
        <div>
          <strong style="display: block;">${item.name} (${item.branch})</strong>
          <small style="color: #666;">${formatCedi(item.price)} x ${item.quantity}</small>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: bold;">${formatCedi(itemTotal)}</span>
          <button onclick="updateQuantity(${index}, -1)" style="padding: 2px 6px;">-</button>
          <button onclick="updateQuantity(${index}, 1)" style="padding: 2px 6px;">+</button>
          <button onclick="removeFromCart(${index})" style="background: #e74c3c; color: #fff; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer;">✕</button>
        </div>
      </div>
    `;
  }).join('');

  cartTotalElement.textContent = formatCedi(grandTotal);
}

// 6. PROCESS CHECKOUT & LOG ORDER TO ADMIN PORTAL
function processCheckout(customerPhone) {
  if (!cart || cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  if (!customerPhone || customerPhone.trim().length < 9) {
    alert("Please enter a valid phone number to proceed.");
    return;
  }

  const orderId = 'BAYS-' + Math.floor(100000 + Math.random() * 900000);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const timeString = new Date().toLocaleString();

  // Construct order details object for admin.html
  const newOrder = {
    orderId: orderId,
    branch: currentBranchName,
    phone: customerPhone.trim(),
    items: [...cart],
    total: totalPrice,
    time: timeString,
    paymentStatus: 'Pending Hubtel Payment'
  };

  // Save Order to localStorage for admin portal retrieval
  const existingOrders = JSON.parse(localStorage.getItem('bays_incoming_orders') || '[]');
  existingOrders.unshift(newOrder);
  localStorage.setItem('bays_incoming_orders', JSON.stringify(existingOrders));

  // Reset cart after recording order
  cart = [];
  localStorage.removeItem('bays_customer_cart');
  updateCartUI();

  alert(`Order #${orderId} received for ${currentBranchName}! Total: ${formatCedi(totalPrice)}.\nRedirecting to Hubtel payment...`);
}