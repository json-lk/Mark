// 1. Mock Data for Clothes (Change names, prices, and swap image URLs with your inventory photos)
const products = [
    { id: 1, name: "Minimalist Black Hoodie", price: 250, image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500" },
    { id: 2, name: "Vintage Oversized Denim Jacket", price: 380, image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500" },
    { id: 3, name: "Classic White Linen T-Shirt", price: 120, image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500" },
    { id: 4, name: "Cargo Utility Pants", price: 290, image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500" }
];

// Put your shop's WhatsApp number here (e.g., 233500000000 for Ghana, 15550000000 for US, etc.)
const WHATSAPP_NUMBER = "233500000000"; 

// Grab old cart from user's storage if they refresh, otherwise start empty
let cart = JSON.parse(localStorage.getItem("showroom_cart")) || [];

// DOM Elements
const productGrid = document.getElementById("product-grid");
const cartDrawer = document.getElementById("cart-drawer");
const cartOverlay = document.getElementById("cart-overlay");
const cartToggleBtn = document.getElementById("cart-toggle-btn");
const closeCartBtn = document.getElementById("close-cart-btn");
const cartItemsContainer = document.getElementById("cart-items-container");
const cartTotalPrice = document.getElementById("cart-total-price");
const cartCount = document.getElementById("cart-count");
const orderForm = document.getElementById("order-form");

// 2. Render Products into HTML Catalog
function displayProducts() {
    productGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <div class="product-title">${product.name}</div>
                <div class="product-price">₵${product.price.toFixed(2)}</div>
                <button class="add-btn" onclick="addToCart(${product.id})">Add to Order</button>
            </div>
        </div>
    `).join('');
}

// 3. Shopping Cart Interactions
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCart();
    openCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
}

function updateCart() {
    localStorage.setItem("showroom_cart", JSON.stringify(cart));
    
    // Total count calculation
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    // Display empty text or render out cart items
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<p style="color: #666; text-align: center; margin-top: 20px;">Your cart is empty.</p>`;
        cartTotalPrice.textContent = "₵0.00";
        return;
    }

    let total = 0;
    cartItemsContainer.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        return `
            <div class="cart-item">
                <div>
                    <strong>${item.name}</strong> <br>
                    <small>₵${item.price} x ${item.quantity}</small>
                </div>
                <button class="remove-item-btn" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        `;
    }).join('');

    cartTotalPrice.textContent = `₵${total.toFixed(2)}`;
}

// Open/Close Side Drawer 
function openCart() {
    cartDrawer.classList.add("open");
    cartOverlay.classList.add("show");
}

function closeCart() {
    cartDrawer.classList.remove("open");
    cartOverlay.classList.remove("show");
}

cartToggleBtn.addEventListener("click", openCart);
closeCartBtn.addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

// 4. Form Submission (Formats Cart Data for WhatsApp)
orderForm.addEventListener("submit", function(e) {
    e.preventDefault();

    if (cart.length === 0) {
        alert("Your cart is empty! Choose something beautiful first.");
        return;
    }

    const name = document.getElementById("customer-name").value;
    const phone = document.getElementById("customer-phone").value;
    const address = document.getElementById("customer-address").value;

    // Build the formatted text receipt string using Markdown for WhatsApp bold highlights
    let message = `*NEW ORDER REQUEST*\n\n`;
    message += `*Customer Details:*\n`;
    message += `• Name: ${name}\n`;
    message += `• Phone: ${phone}\n`;
    message += `• Delivery Info: ${address}\n\n`;
    message += `*Items Requested:*\n`;

    let grandTotal = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        grandTotal += itemTotal;
        message += `• ${item.name} (x${item.quantity}) - ₵${itemTotal.toFixed(2)}\n`;
    });

    message += `\n*Total Estimated:* ₵${grandTotal.toFixed(2)}`;

    // Convert string to URL-safe formatting
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    // Reset site cart state
    cart = [];
    updateCart();
    closeCart();
    orderForm.reset();

    // Take user to WhatsApp to hit send
    window.open(whatsappUrl, '_blank');
});

// Run automatically when page starts up
displayProducts();
updateCart();