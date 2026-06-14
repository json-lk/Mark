// 1. Initialize Supabase Client securely
const SUPABASE_URL = "https://lufzfqewignnlseijtji.supabase.co";
// Paste your true long 'anon public' key here (starts with eyJ...)
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZnpmcWV3aWdubmxzZWlqdGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NDc2NTgsImV4cCI6MjA5NzAyMzY1OH0.hViakWLlUMk9mzcQPtaIlPTygF2zPEfcwIdU8upwPL8";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Products will now load from the database dynamically
let products = [];

// Your shop's WhatsApp number 
const WHATSAPP_NUMBER = "233538655315"; 

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
const modeToggleBtn = document.getElementById("mode-toggle-btn");

const currentMode = localStorage.getItem("theme-mode");

// 2. Fetch Products From Supabase on Page Load
async function fetchProducts() {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*');

        if (error) throw error;

        console.log("Supabase Data Received:", data);
        
        products = data;
        displayProducts();
    } catch (error) {
        console.error("Error loading products from Supabase:", error.message);
        productGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red;">Failed to load catalog. Please try again later.</p>`;
    }
}

// Render Products into HTML Catalog
function displayProducts() {
    if (!products || products.length === 0) {
        productGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">No items found in stock.</p>`;
        return;
    }

    productGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <div class="product-title">${product.name}</div>
                <div class="product-price">₵${Number(product.price).toFixed(2)}</div>
                <button class="add-btn" onclick="addToCart(${product.id})">Add to Order</button>
            </div>
        </div>
    `).join('');
}

// 3. Shopping Cart Interactions
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

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
                    <small>₵${Number(item.price).toFixed(2)} x ${item.quantity}</small>
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

// Attach Drawer Events Safely
if (cartToggleBtn) cartToggleBtn.addEventListener("click", openCart);
if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);
if (cartOverlay) cartOverlay.addEventListener("click", closeCart);

// Dark/Light Mode Switch Logic
if (currentMode === "dark") {
    document.body.classList.add("dark-mode");
    if (modeToggleBtn) modeToggleBtn.textContent = "☀️";
} else {
    if (modeToggleBtn) modeToggleBtn.textContent = "🌙";
}

if (modeToggleBtn) {
    modeToggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        
        if (document.body.classList.contains("dark-mode")) {
            localStorage.setItem("theme-mode", "dark");
            modeToggleBtn.textContent = "☀️";
        } else {
            localStorage.setItem("theme-mode", "light");
            modeToggleBtn.textContent = "🌙";
        }
    });
}

// 4. Form Submission (Saves to Supabase, then triggers WhatsApp)
if (orderForm) {
    orderForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        if (cart.length === 0) {
            alert("Your cart is empty! Choose something beautiful first.");
            return;
        }

        const name = document.getElementById("customer-name").value;
        const phone = document.getElementById("customer-phone").value;
        const address = document.getElementById("customer-address").value;

        // Calculate grand total and structure database item data
        let grandTotal = 0;
        const orderItemsForDb = cart.map(item => {
            const itemTotal = item.price * item.quantity;
            grandTotal += itemTotal;
            return {
                product_id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: itemTotal
            };
        });

        // Disable button during submission to avoid duplicate database clicks
        const submitBtn = orderForm.querySelector(".submit-order-btn");
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Saving Order...";
        }

        try {
            // A. Insert Order Data into Supabase
            const { error } = await supabaseClient
                .from('orders')
                .insert([
                    {
                        customer_name: name,
                        customer_phone: phone,
                        delivery_address: address,
                        items: orderItemsForDb,
                        total_price: grandTotal,
                        shop_whatsapp: WHATSAPP_NUMBER
                    }
                ]);

            if (error) throw error;

            // B. Formulate WhatsApp Message String 
            let message = `*NEW ORDER REQUEST*\n\n`;
            message += `*Customer Details:*\n`;
            message += `• Name: ${name}\n`;
            message += `• Phone: ${phone}\n`;
            message += `• Delivery Info: ${address}\n\n`;
            message += `*Items Requested:*\n`;

            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                message += `• ${item.name} (x${item.quantity}) - ₵${itemTotal.toFixed(2)}\n`;
            });

            message += `\n*Total Estimated:* ₵${grandTotal.toFixed(2)}`;

            // Convert string to URL-safe formatting
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

            // C. Clear State and Open WhatsApp Window
            cart = [];
            updateCart();
            closeCart();
            orderForm.reset();

            window.open(whatsappUrl, '_blank');

        } catch (error) {
            console.error("Order insertion failed:", error.message);
            alert("Something went wrong saving your order. Please try again.");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Submit Order via WhatsApp";
            }
        }
    });
}

// Run everything on startup
fetchProducts();
updateCart();