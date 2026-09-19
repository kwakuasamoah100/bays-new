/* ==========================================================================
   BAYS RESTAURANT - ADMIN PORTAL (admin.js)
   ========================================================================== */

// Firebase Setup
const firebaseConfig = {
  apiKey: "AIzaSyAlOr3iaTy62yvc-q4CaOydI48X3VUVIME",
  authDomain: "bays-shawarma01.firebaseapp.com",
  projectId: "bays-shawarma01",
  storageBucket: "bays-shawarma01.firebasestorage.app",
  messagingSenderId: "760940085395",
  appId: "1:760940085395:web:486e6836b7cb32c74e0d66"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Save menu to Firestore
async function saveMenuToCloud() {
  try {
    await db.collection("menus").doc("branches").set(fullMenuData);
    alert("Menu updated successfully across all devices!");
  } catch (error) {
    console.error("Save error:", error);
    alert("Failed to save menu changes.");
  }
}

let fullMenuData = {};
let currentAdminBranch = 'Haatso';

// 1. LOAD MENU DATA ON PAGE LOAD
document.addEventListener('DOMContentLoaded', () => {
  fetchAdminMenuData();
});

// Fetch menu.json with timestamp to avoid cached responses
async function fetchAdminMenuData() {
  try {
    const cacheBuster = new Date().getTime();
    const response = await fetch(`menu.json?v=${cacheBuster}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    fullMenuData = await response.json();

    const branchSelector = document.getElementById('branchSelector');
    if (branchSelector) {
      currentAdminBranch = branchSelector.value;
    }

    renderAdminBranchMenu();
  } catch (error) {
    console.error('Error fetching admin menu:', error);
    const grid = document.getElementById('adminMenuGrid');
    if (grid) {
      grid.innerHTML = `<p style="color: #e74c3c;">Failed to load <code>menu.json</code>. Please verify the file exists in your project root.</p>`;
    }
  }
}

// 2. RENDER MENU ITEMS FOR SELECTED BRANCH
function renderAdminBranchMenu() {
  const branchSelector = document.getElementById('branchSelector');
  if (branchSelector) {
    currentAdminBranch = branchSelector.value;
  }

  const grid = document.getElementById('adminMenuGrid');
  if (!grid) return;

  // Initialize branch object if missing
  if (!fullMenuData[currentAdminBranch]) {
    fullMenuData[currentAdminBranch] = {
      branchName: currentAdminBranch,
      menu: []
    };
  }

  const items = fullMenuData[currentAdminBranch].menu || [];

  if (items.length === 0) {
    grid.innerHTML = `<p style="color: #666; padding: 15px 0;">No menu items found for ${currentAdminBranch}. Click "+ Add New Dish" to create one.</p>`;
    return;
  }

  grid.innerHTML = items.map((item, index) => `
    <div class="menu-row">
      <input type="text" value="${item.name || ''}" placeholder="Dish Name" onchange="updateItemField(${index}, 'name', this.value)">
      <input type="number" step="0.50" value="${item.price || 0}" placeholder="Price (GH₵)" onchange="updateItemField(${index}, 'price', this.value)">
      <input type="text" value="${item.desc || ''}" placeholder="Description" onchange="updateItemField(${index}, 'desc', this.value)">
      <button class="btn-delete" onclick="deleteDishRow(${index})">✕ Delete</button>
    </div>
  `).join('');
}

// 3. LIVE UPDATE INPUT FIELDS
function updateItemField(index, field, value) {
  if (!fullMenuData[currentAdminBranch] || !fullMenuData[currentAdminBranch].menu[index]) return;

  if (field === 'price') {
    fullMenuData[currentAdminBranch].menu[index][field] = parseFloat(value) || 0;
  } else {
    fullMenuData[currentAdminBranch].menu[index][field] = value;
  }
}

// 4. ADD NEW DISH ROW
function addDishRow() {
  if (!fullMenuData[currentAdminBranch]) {
    fullMenuData[currentAdminBranch] = { branchName: currentAdminBranch, menu: [] };
  }

  fullMenuData[currentAdminBranch].menu.push({
    name: 'New Item',
    price: 50.00,
    desc: 'Item description...'
  });

  renderAdminBranchMenu();
}

// 5. DELETE DISH ROW
function deleteDishRow(index) {
  if (!fullMenuData[currentAdminBranch] || !fullMenuData[currentAdminBranch].menu) return;

  fullMenuData[currentAdminBranch].menu.splice(index, 1);
  renderAdminBranchMenu();
}

// 6. DOWNLOAD UPDATED MENU.JSON
function downloadUpdatedMenuJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullMenuData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "menu.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}