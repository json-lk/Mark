// Initialize Supabase Client[cite: 2]
const SUPABASE_URL = "https://lufzfqewignnlseijtji.supabase.co"; //[cite: 2]
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZnpmcWV3aWdubmxzZWlqdGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NDc2NTgsImV4cCI6MjA5NzAyMzY1OH0.hViakWLlUMk9mzcQPtaIlPTygF2zPEfcwIdU8upwPL8"; //[cite: 2]
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); //[cite: 2]

// 1. Password Gate Protection
const ADMIN_PASSWORD = "BigDreamOwner2026"; // Change this to your preferred passcode

function checkAdminAccess() {
    const sessionAccess = sessionStorage.getItem("admin_authenticated");
    if (sessionAccess !== "true") {
        const passwordInput = prompt("Enter Owner Admin Password:");
        if (passwordInput === ADMIN_PASSWORD) {
            sessionStorage.setItem("admin_authenticated", "true");
        } else {
            alert("Unauthorized access denied!");
            window.location.href = "index.html";
        }
    }
}
checkAdminAccess(); // Run gate check immediately

// DOM Selection references[cite: 2]
const addProductForm = document.getElementById("add-product-form");
const adminProductList = document.getElementById("admin-product-list");
const ordersContainer = document.getElementById("orders-container");
const modeToggleBtn = document.getElementById("mode-toggle-btn");
const submitBtn = document.getElementById("submit-btn");

// Theme Presentation Settings[cite: 2]
const currentMode = localStorage.getItem("theme-mode"); //[cite: 2]
if (currentMode === "dark") { //[cite: 2]
    document.body.classList.add("dark-mode"); //[cite: 2]
    if (modeToggleBtn) modeToggleBtn.textContent = "☀️"; //[cite: 2]
} else {
    if (modeToggleBtn) modeToggleBtn.textContent = "🌙"; //[cite: 2]
}

if (modeToggleBtn) {
    modeToggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode"); //[cite: 2]
        const isDark = document.body.classList.contains("dark-mode");
        localStorage.setItem("theme-mode", isDark ? "dark" : "light");
        modeToggleBtn.textContent = isDark ? "☀️" : "🌙";
    });
}

// --- Dashboard Actions & Database Controls ---

// Fetch and render items inside the Admin Catalog Panel
async function loadAdminCatalog() {
    try {
        const { data: products, error } = await supabaseClient
            .from('products') //[cite: 2]
            .select('*') //[cite: 2]
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

// 2. Upload Local Image and Add Product Handler
if (addProductForm) {
    addProductForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const name = document.getElementById("prod-name").value;
        const price = parseFloat(document.getElementById("prod-price").value);
        const imageFile = document.getElementById("prod-image-file").files[0];

        if (!imageFile) {
            alert("Please select an image file first.");
            return;
        }

        // Visual feedback state
        submitBtn.disabled = true;
        submitBtn.textContent = "Uploading Image...";

        try {
            // A. Create a unique filename to prevent overwriting files with identical names
            const fileExtension = imageFile.name.split('.').pop();
            const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExtension}`;

            // B. Upload binary image data payload into the 'product-images' bucket
            const { data: storageData, error: storageError } = await supabaseClient
                .storage
                .from('product-images')
                .upload(uniqueFileName, imageFile);

            if (storageError) throw storageError;

            // C. Retrieve public URL address pointing to file instance assets
            const { data: publicUrlData } = supabaseClient
                .storage
                .from('product-images')
                .getPublicUrl(uniqueFileName);

            const finalImageUrl = publicUrlData.publicUrl;

            // D. Push complete payload profile fields row straight down to products table
            submitBtn.textContent = "Saving Product Data...";
            const { error: dbError } = await supabaseClient
                .from('products')
                .insert([{ name, price, image: finalImageUrl }]);

            if (dbError) throw dbError;

            alert("Success! Product and picture uploaded safely to your catalog.");
            addProductForm.reset();
            loadAdminCatalog(); 
        } catch (err) {
            alert("Upload failed processing pipeline: " + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Upload to Shop";
        }
    });
}

// 3. Delete Product Handler
window.deleteProduct = async function(id) {
    if (!confirm("Are you sure you want to remove this product from the store catalog?")) return;

    try {
        const { error } = await supabaseClient
            .from('products') //[cite: 2]
            .delete() //[cite: 2]
            .eq('id', id); //[cite: 2]

        if (error) throw error;
        loadAdminCatalog(); 
    } catch (err) {
        alert("Could not remove item: " + err.message);
    }
};

// 4. Fetch incoming customer logs
async function fetchIncomingOrders() {
    try {
        const { data: orders, error } = await supabaseClient
            .from('orders') //[cite: 2]
            .select('*') //[cite: 2]
            .order('id', { ascending: false });

        if (error) throw error;

        if (!orders || orders.length === 0) {
            ordersContainer.innerHTML = "<p>No order history logs saved yet.</p>";
            return;
        }

        ordersContainer.innerHTML = orders.map(order => {
            const itemsList = Array.isArray(order.items) //[cite: 2]
                ? order.items.map(i => `• ${i.name} (x${i.quantity}) - ₵${Number(i.total).toFixed(2)}`).join('<br>') //[cite: 2]
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

// Startup Execution
loadAdminCatalog();
fetchIncomingOrders();