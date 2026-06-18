// Initialize Supabase Client using settings consistent with your core index shop
const SUPABASE_URL = "https://lufzfqewignnlseijtji.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZnpmcWV3aWdubmxzZWlqdGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NDc2NTgsImV4cCI6MjA5NzAyMzY1OH0.hViakWLlUMk9mzcQPtaIlPTygF2zPEfcwIdU8upwPL8";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Selection references
const addProductForm = document.getElementById("add-product-form");
const adminProductList = document.getElementById("admin-product-list");
const ordersContainer = document.getElementById("orders-container");
const modeToggleBtn = document.getElementById("mode-toggle-btn");

// Maintain presentation theme mode settings across site locations
const currentMode = localStorage.getItem("theme-mode");
if (currentMode === "dark") {
    document.body.classList.add("dark-mode");
    if (modeToggleBtn) modeToggleBtn.textContent = "☀️";
} else {
    if (modeToggleBtn) modeToggleBtn.textContent = "🌙";
}

if (modeToggleBtn) {
    modeToggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const isDark = document.body.classList.contains("dark-mode");
        localStorage.setItem("theme-mode", isDark ? "dark" : "light");
        modeToggleBtn.textContent = isDark ? "☀️" : "🌙";
    });
}

// --- Dashboard Actions & Database Controls ---

// 1. Fetch and render items inside the Admin Catalog Panel
async function loadAdminCatalog() {
    try {
        const { data: products, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        if (!products || products.length === 0) {
            adminProductList.innerHTML = "<p>No active inventory found in stock.</p>";
            return;
        }

        adminProductList.innerHTML = products.map(p => `
            <div class="admin-product-item">
                <div>
                    <strong>${p.name}</strong><br>
                    <small style="color: var(--text-muted)">₵${Number(p.price).toFixed(2)}</small>
                </div>
                <button class="danger-btn" onclick="deleteProduct(${p.id})">Delete</button>
            </div>
        `).join('');
    } catch (err) {
        console.error("Catalog error:", err.message);
        adminProductList.innerHTML = `<p style="color:red;">Error updating list: ${err.message}</p>`;
    }
}

// 2. Add New Product Handler
if (addProductForm) {
    addProductForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const name = document.getElementById("prod-name").value;
        const price = parseFloat(document.getElementById("prod-price").value);
        const image = document.getElementById("prod-image").value;

        try {
            const { error } = await supabaseClient
                .from('products')
                .insert([{ name, price, image }]);

            if (error) throw error;

            alert("Success! Product has been added to the customer catalog view.");
            addProductForm.reset();
            loadAdminCatalog(); // Refresh view panel listing updates
        } catch (err) {
            alert("Failed to save item: " + err.message);
        }
    });
}

// 3. Delete Product Handler (Globally scoped for inline execution)
window.deleteProduct = async function(id) {
    if (!confirm("Are you sure you want to remove this product from the store catalog?")) return;

    try {
        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
        loadAdminCatalog(); // Refresh current list context UI
    } catch (err) {
        alert("Could not remove item: " + err.message);
    }
};

// 4. Fetch and display incoming structured Customer Request Logs
async function fetchIncomingOrders() {
    try {
        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        if (!orders || orders.length === 0) {
            ordersContainer.innerHTML = "<p>No order history logs saved yet.</p>";
            return;
        }

        ordersContainer.innerHTML = orders.map(order => {
            // Unpack list strings safely from stored json arrays
            const itemsList = Array.isArray(order.items) 
                ? order.items.map(i => `• ${i.name} (x${i.quantity}) - ₵${Number(i.total).toFixed(2)}`).join('<br>')
                : "Format error reading purchased array items structure.";

            return `
                <div class="order-tile">
                    <div class="order-header">
                        <span>Buyer: ${order.customer_name}</span>
                        <span>₵${Number(order.total_price).toFixed(2)}</span>
                    </div>
                    <p style="margin-bottom: 5px;"><strong>Phone/WA:</strong> ${order.customer_phone}</p>
                    <p style="margin-bottom: 5px;"><strong>Address:</strong> ${order.delivery_address}</p>
                    <div style="font-size:0.9rem; border-top:1px dashed #ccc; padding-top:8px; margin-top:8px;">
                        <strong>Items Ordered:</strong><br>${itemsList}
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error("Order load tracking error:", err.message);
        ordersContainer.innerHTML = `<p style="color:red;">Error parsing data structure streams: ${err.message}</p>`;
    }
}

// Initial script execution sequencing on startup
loadAdminCatalog();
fetchIncomingOrders();