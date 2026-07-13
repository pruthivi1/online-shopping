const API_URL = "https://online-shopping-cp0g.onrender.com/api/products";
const ORDERS_API_URL = "https://online-shopping-cp0g.onrender.com/api/orders/all";
const USERS_API_URL = "https://online-shopping-cp0g.onrender.com/api/auth/users";

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || user.role !== "admin") {
    window.location.href = "login.html";
}

document.getElementById("adminName").textContent = user.username || "Admin";

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
}

// ==================== TAB SWITCHING ====================
function switchTab(tabName) {
    // Hide all sections
    document.querySelectorAll(".admin-section").forEach(sec => sec.classList.add("d-none"));
    
    // Deactivate all sidebar items
    document.querySelectorAll(".sidebar-menu li").forEach(li => li.classList.remove("active"));
    
    // Show selected section
    const activeSection = document.getElementById(`section-${tabName}`);
    if (activeSection) activeSection.classList.remove("d-none");
    
    // Activate clicked menu item
    const activeMenu = document.getElementById(`menu-${tabName}`);
    if (activeMenu) activeMenu.classList.add("active");

    // Update Topbar Title
    const pageTitle = document.getElementById("pageTitle");
    const formattedTitle = tabName.charAt(0).toUpperCase() + tabName.slice(1) + " Management";
    pageTitle.innerHTML = `<i class="bi bi-${getTabIcon(tabName)} me-2"></i>${formattedTitle}`;

    // Load dynamic data on tab selection
    if (tabName === "products") loadProducts();
    else if (tabName === "orders") loadOrders();
    else if (tabName === "users") loadUsers();
    else if (tabName === "settings") loadSettings();
}
window.switchTab = switchTab;

function getTabIcon(tab) {
    switch (tab) {
        case "products": return "box-seam";
        case "orders": return "cart3";
        case "users": return "people";
        case "settings": return "gear";
        default: return "grid";
    }
}

// ==================== LOAD ALL PRODUCTS ====================
async function loadProducts() {
    try {
        const response = await fetch(API_URL, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const result = await response.json();
        const tbody = document.getElementById("productsTableBody");
        
        if (!result.data || result.data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-muted">
                        <i class="bi bi-inbox me-2"></i>No products found
                    </td>
                </tr>
            `;
            updateStats([]);
            return;
        }

        updateStats(result.data);

        tbody.innerHTML = result.data.map(product => {
            const stockClass = product.stock === 0 ? 'stock-low text-danger fw-bold' : 
                              product.stock < 10 ? 'stock-medium text-warning fw-bold' : 'stock-good text-success fw-bold';
            const stockIcon = product.stock === 0 ? 'bi-x-circle' : 
                             product.stock < 10 ? 'bi-exclamation-circle' : 'bi-check-circle';

            return `
                <tr>
                    <td><strong>#${product.id}</strong></td>
                    <td>
                        <div class="fw-bold">${product.name}</div>
                        <small class="text-muted d-block" style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${product.description || ''}
                        </small>
                    </td>
                    <td><span class="badge bg-secondary">${getCategoryName(product.category_id)}</span></td>
                    <td><span class="fw-bold text-dark">₹${product.price}</span></td>
                    <td class="${stockClass}">
                        <i class="bi ${stockIcon} me-1"></i>${product.stock}
                    </td>
                    <td><small class="text-muted">${product.image || 'placeholder.jpg'}</small></td>
                    <td>
                        <button class="btn-action btn-edit" onclick="editProduct(${product.id})">
                            <i class="bi bi-pencil-square"></i> Edit
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteProduct(${product.id})">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    } catch (error) {
        document.getElementById("productsTableBody").innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>Failed to load products
                </td>
            </tr>
        `;
    }
}
window.loadProducts = loadProducts;

// ==================== LOAD ALL ORDERS ====================
async function loadOrders() {
    try {
        const response = await fetch(ORDERS_API_URL, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const result = await response.json();
        const tbody = document.getElementById("ordersTableBody");

        if (!result.data || result.data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5 text-muted">
                        <i class="bi bi-inbox text-muted display-4 d-block mb-3"></i>
                        No orders placed yet
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = result.data.map(order => {
            const date = new Date(order.created_at).toLocaleString();
            const status = (order.status || 'pending').toLowerCase();
            let statusSelectClass = "border-warning text-warning bg-warning-subtle";
            if (status === "completed" || status === "delivered") statusSelectClass = "border-success text-success bg-success-subtle";
            else if (status === "shipped") statusSelectClass = "border-primary text-primary bg-primary-subtle";
            else if (status === "cancelled") statusSelectClass = "border-danger text-danger bg-danger-subtle";

            return `
                <tr>
                    <td><strong>#${order.id}</strong></td>
                    <td>
                        <div class="fw-bold">${order.username || 'Anonymous'}</div>
                        <small class="text-muted">User ID: #${order.user_id}</small>
                    </td>
                    <td>
                        <div class="fw-semibold text-wrap" style="max-width: 250px;">
                            ${order.product_names || 'N/A'}
                        </div>
                        <small class="text-muted">${order.item_count} items</small>
                    </td>
                    <td><span class="fw-bold text-primary">₹${order.total_amount}</span></td>
                    <td><div class="small text-wrap" style="max-width: 200px;">${order.shipping_address || 'N/A'}</div></td>
                    <td>
                        <select class="form-select form-select-sm border-2 fw-bold rounded-pill px-3 ${statusSelectClass}" 
                                style="width: 140px; cursor: pointer;"
                                onchange="updateOrderStatus(${order.id}, this.value)">
                            <option class="bg-white text-dark" value="pending" ${status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option class="bg-white text-dark" value="shipped" ${status === 'shipped' ? 'selected' : ''}>Shipped</option>
                            <option class="bg-white text-dark" value="delivered" ${status === 'delivered' ? 'selected' : ''}>Delivered</option>
                            <option class="bg-white text-dark" value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                    <td><small class="text-muted">${date}</small></td>
                </tr>
            `;
        }).join("");
    } catch (error) {
        document.getElementById("ordersTableBody").innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>Failed to load user orders
                </td>
            </tr>
        `;
    }
}
window.loadOrders = loadOrders;

async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`https://online-shopping-cp0g.onrender.com/api/orders/${orderId}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        const result = await response.json();
        if (result.success) {
            loadOrders();
        } else {
            alert(result.message || "Failed to update order status");
        }
    } catch (error) {
        alert("Error updating order status: " + error.message);
    }
}
window.updateOrderStatus = updateOrderStatus;

// ==================== LOAD ALL USERS ====================
async function loadUsers() {
    try {
        const response = await fetch(USERS_API_URL, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const result = await response.json();
        const tbody = document.getElementById("usersTableBody");

        if (!result.data || result.data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-5 text-muted">
                        No registered users found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = result.data.map(user => {
            const date = new Date(user.created_at).toLocaleDateString();
            const roleBadge = user.role === "admin" ? "bg-danger" : "bg-primary";
            return `
                <tr>
                    <td><strong>#${user.id}</strong></td>
                    <td><div class="fw-bold">${user.username}</div></td>
                    <td><code>${user.email}</code></td>
                    <td><span class="badge ${roleBadge}">${user.role}</span></td>
                    <td><small class="text-muted">${date}</small></td>
                </tr>
            `;
        }).join("");
    } catch (error) {
        document.getElementById("usersTableBody").innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>Failed to load registered users
                </td>
            </tr>
        `;
    }
}
window.loadUsers = loadUsers;

// ==================== LOAD / SAVE SETTINGS ====================
function loadSettings() {
    // Loads configurations from localstorage (mock values if not set)
    document.getElementById("storeName").value = localStorage.getItem("setting_storeName") || "ShopEase E-Commerce";
    document.getElementById("supportEmail").value = localStorage.getItem("setting_supportEmail") || "support@shopease.com";
    document.getElementById("storeCurrency").value = localStorage.getItem("setting_currency") || "INR";
    document.getElementById("maintenanceMode").checked = localStorage.getItem("setting_maintenance") === "true";
}
window.loadSettings = loadSettings;

function saveSettings(e) {
    e.preventDefault();
    const name = document.getElementById("storeName").value.trim();
    const email = document.getElementById("supportEmail").value.trim();
    const currency = document.getElementById("storeCurrency").value;
    const maintenance = document.getElementById("maintenanceMode").checked;

    localStorage.setItem("setting_storeName", name);
    localStorage.setItem("setting_supportEmail", email);
    localStorage.setItem("setting_currency", currency);
    localStorage.setItem("setting_maintenance", maintenance);

    const msgDiv = document.getElementById("settingsMessage");
    msgDiv.innerHTML = `
        <div class="alert alert-success d-flex align-items-center py-2.5 rounded-3 border-0">
            <i class="bi bi-check-circle-fill me-2"></i>Configurations saved successfully!
        </div>
    `;
    setTimeout(() => msgDiv.innerHTML = "", 3000);
}
window.saveSettings = saveSettings;

// ==================== PRODUCT FORM SUBMIT (Add OR Update) ====================
// ==================== IMAGE SOURCE / PREVIEW TOGGLE ====================
function toggleImageInputType() {
    const type = document.getElementById("imageSourceType").value;
    const fileGroup = document.getElementById("imageFileInputGroup");
    const urlGroup = document.getElementById("imageUrlInputGroup");
    
    if (type === "upload") {
        fileGroup.classList.remove("d-none");
        urlGroup.classList.add("d-none");
    } else {
        fileGroup.classList.add("d-none");
        urlGroup.classList.remove("d-none");
    }
    updateImagePreview();
}
window.toggleImageInputType = toggleImageInputType;

function updateImagePreview() {
    const type = document.getElementById("imageSourceType").value;
    const preview = document.getElementById("imagePreview");
    const placeholder = document.getElementById("previewPlaceholder");
    
    if (type === "upload") {
        const fileInput = document.getElementById("imageFile");
        if (fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.classList.remove("d-none");
                placeholder.classList.add("d-none");
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            preview.classList.add("d-none");
            placeholder.classList.remove("d-none");
        }
    } else {
        const url = document.getElementById("imageUrl").value.trim();
        if (url) {
            preview.src = url.startsWith("http") ? url : "assets/" + url;
            preview.classList.remove("d-none");
            placeholder.classList.add("d-none");
        } else {
            preview.classList.add("d-none");
            placeholder.classList.remove("d-none");
        }
    }
}
window.updateImagePreview = updateImagePreview;

// Attach input listeners for preview updates
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("imageFile")?.addEventListener("change", updateImagePreview);
    document.getElementById("imageUrl")?.addEventListener("input", updateImagePreview);
});

// ==================== PRODUCT FORM SUBMIT (Add OR Update) ====================
document.getElementById("productForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const editId = document.getElementById("editProductId").value;
    const msgDiv = document.getElementById("formMessage");
    msgDiv.innerHTML = "";

    let imageFilename = "";
    const imageSource = document.getElementById("imageSourceType").value;
    
    try {
        if (imageSource === "upload") {
            const fileInput = document.getElementById("imageFile");
            if (fileInput.files.length > 0) {
                // Perform file upload first
                const formData = new FormData();
                formData.append("image", fileInput.files[0]);

                const uploadRes = await fetch("https://online-shopping-cp0g.onrender.com/api/products/upload", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: formData
                });

                const uploadResult = await uploadRes.json();
                if (!uploadResult.success) {
                    throw new Error(uploadResult.message || "Image upload failed");
                }
                imageFilename = uploadResult.filename;
            } else if (editId !== "") {
                // If editing and no new file selected, retain original image (we will load this in editProduct)
                imageFilename = document.getElementById("imageUrl").value.trim();
            } else {
                throw new Error("Please select an image file to upload");
            }
        } else {
            imageFilename = document.getElementById("imageUrl").value.trim();
            if (!imageFilename) {
                throw new Error("Please provide an image filename or URL");
            }
        }

        const productData = {
            name: document.getElementById("name").value.trim(),
            description: document.getElementById("description").value.trim(),
            price: parseFloat(document.getElementById("price").value),
            stock: parseInt(document.getElementById("stock").value),
            image: imageFilename,
            category_id: parseInt(document.getElementById("category_id").value)
        };

        const isEdit = editId !== "";
        const url = isEdit ? `${API_URL}/${editId}` : API_URL;
        const method = isEdit ? "PUT" : "POST";

        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });

        const result = await response.json();

        if (result.success) {
            const action = isEdit ? "updated" : "added";
            msgDiv.innerHTML = `
                <div class="alert alert-success d-flex align-items-center py-2.5 mt-2 rounded-3 border-0">
                    <i class="bi bi-check-circle-fill me-2"></i>
                    Product ${action} successfully!
                </div>
            `;
            document.getElementById("productForm").reset();
            cancelEdit();
            loadProducts();
            setTimeout(() => msgDiv.innerHTML = "", 3000);
        } else {
            msgDiv.innerHTML = `
                <div class="alert alert-danger py-2.5 mt-2 rounded-3 border-0">
                    <i class="bi bi-exclamation-circle-fill me-2"></i>
                    ${result.message}
                </div>
            `;
        }
    } catch (error) {
        msgDiv.innerHTML = `
            <div class="alert alert-danger py-2.5 mt-2 rounded-3 border-0">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                Error: ${error.message}
            </div>
        `;
    }
});

// ==================== EDIT PRODUCT ====================
async function editProduct(id) {
    try {
        const response = await fetch(API_URL, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const result = await response.json();
        const product = result.data.find(p => p.id === id);
        
        if (!product) {
            alert("Product not found");
            return;
        }

        document.getElementById("editProductId").value = product.id;
        document.getElementById("name").value = product.name;
        document.getElementById("description").value = product.description || '';
        document.getElementById("price").value = product.price;
        document.getElementById("stock").value = product.stock;
        document.getElementById("category_id").value = product.category_id;

        // Set to text/url input mode for editing and populate
        document.getElementById("imageSourceType").value = "url";
        toggleImageInputType();
        document.getElementById("imageUrl").value = product.image || '';
        
        updateImagePreview();

        document.getElementById("formTitle").innerHTML = '<i class="bi bi-pencil-square me-2"></i>Edit Product';
        document.getElementById("submitBtn").innerHTML = '<i class="bi bi-check-lg me-1"></i>Update Product';
        document.getElementById("submitBtn").className = "btn-submit btn-update";
        document.getElementById("cancelBtn").classList.remove("d-none");

        document.querySelector(".form-card").scrollIntoView({ behavior: "smooth" });

    } catch (error) {
        alert("Error loading product: " + error.message);
    }
}
window.editProduct = editProduct;

// ==================== CANCEL EDIT ====================
function cancelEdit() {
    document.getElementById("editProductId").value = "";
    document.getElementById("productForm").reset();
    
    // Clear preview
    const preview = document.getElementById("imagePreview");
    const placeholder = document.getElementById("previewPlaceholder");
    preview.src = "";
    preview.classList.add("d-none");
    placeholder.classList.remove("d-none");

    // Reset image sources
    document.getElementById("imageSourceType").value = "upload";
    toggleImageInputType();
    
    document.getElementById("formTitle").innerHTML = '<i class="bi bi-plus-circle-fill me-2"></i>Add New Product';
    document.getElementById("submitBtn").innerHTML = '<i class="bi bi-plus-lg me-1"></i>Add Product';
    document.getElementById("submitBtn").className = "btn-submit";
    document.getElementById("cancelBtn").classList.add("d-none");
    document.getElementById("formMessage").innerHTML = "";
}
window.cancelEdit = cancelEdit;
window.cancelEdit = cancelEdit;

// ==================== DELETE PRODUCT ====================
async function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const result = await response.json();
        
        if (result.success) {
            loadProducts();
        } else {
            alert("Delete failed: " + result.message);
        }
    } catch (error) {
        alert("Error: " + error.message);
    }
}
window.deleteProduct = deleteProduct;

// ==================== UPDATE STATS ====================
function updateStats(products) {
    document.getElementById("totalProducts").textContent = products.length;
    document.getElementById("inStock").textContent = products.filter(p => p.stock > 10).length;
    document.getElementById("lowStock").textContent = products.filter(p => p.stock > 0 && p.stock <= 10).length;
    document.getElementById("outOfStock").textContent = products.filter(p => p.stock === 0).length;
}

// ==================== GET CATEGORY NAME ====================
function getCategoryName(id) {
    const categories = {
        1: "Electronics",
        2: "Clothing", 
        3: "Home & Living",
        4: "Sports"
    };
    return categories[id] || "Unknown";
}

window.logout = logout;

// Load products on page load
document.addEventListener("DOMContentLoaded", loadProducts);