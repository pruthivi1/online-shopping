import { createProductCard } from "./components/productCard.js";

const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:")
    ? "http://localhost:5000"
    : "https://online-shopping-cp0g.onrender.com";

const API_URL = `${API_BASE}/api/products`;
const CART_API = `${API_BASE}/api/cart`;
// just to check it was working or not
// console.log('App.js Loaded');
// alert("App.js Loaded");

function getToken() {
    return localStorage.getItem("token");
}

function isLoggedIn() {
    return !!getToken();
}

let cachedProducts = [];
let showAllProductsState = false;

function renderProducts(products) {
    const container = document.getElementById("products-container");
    const viewAllBtn = document.getElementById("viewAllTrendingBtn");

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-inbox display-1 text-muted"></i>
                <p class="mt-3 text-muted">No products found</p>
            </div>
        `;
        if (viewAllBtn) viewAllBtn.style.display = "none";
        return;
    }

    let productsToRender = products;
    if (products.length > 4) {
        if (viewAllBtn) viewAllBtn.style.setProperty("display", "inline-block", "important");
        if (!showAllProductsState) {
            productsToRender = products.slice(0, 4);
            if (viewAllBtn) {
                viewAllBtn.innerHTML = `View All <i class="bi bi-arrow-right"></i>`;
            }
        } else {
            if (viewAllBtn) {
                viewAllBtn.innerHTML = `Show Less <i class="bi bi-arrow-left"></i>`;
            }
        }
    } else {
        if (viewAllBtn) viewAllBtn.style.setProperty("display", "none", "important");
    }

    container.innerHTML = productsToRender.map(product => createProductCard(product)).join("");
}

// Bind toggle action on viewAll button
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("viewAllTrendingBtn")?.addEventListener("click", () => {
        showAllProductsState = !showAllProductsState;
        renderProducts(cachedProducts);
    });
});

async function loadProducts(searchQuery = "") {
    const container = document.getElementById("products-container");
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-2">Loading products...</p></div>';

    try {
        const url = searchQuery 
            ? `${API_URL}/search?q=${encodeURIComponent(searchQuery)}`
            : API_URL;
            
        const response = await fetch(url);
        const result = await response.json();

        cachedProducts = result.data || [];
        renderProducts(cachedProducts);
    } catch (error) {
        container.innerHTML = `
            <div class="col-12 text-center py-5 text-danger">
                <i class="bi bi-exclamation-triangle display-1"></i>
                <p class="mt-3">Failed to load products</p>
            </div>
        `;
    }
}

// Search handler
document.getElementById("searchInput")?.addEventListener("input", (e) => {
    loadProducts(e.target.value);
});

// Bind category pill event listeners
function bindCategoryPillListeners() {
    document.querySelectorAll(".category-pill").forEach(pill => {
        pill.addEventListener("click", async (e) => {
            // Remove active class from all dropdown items
            document.querySelectorAll(".category-pill").forEach(p => {
                p.classList.remove("active");
            });

            // Add active class to clicked item
            const clickedPill = e.currentTarget;
            clickedPill.classList.add("active");

            // Update dropdown button label text
            const dropdownBtn = document.getElementById("categoryDropdownBtn");
            if (dropdownBtn) {
                dropdownBtn.innerHTML = `<i class="bi bi-funnel-fill me-2"></i>${clickedPill.textContent.trim()}`;
            }

            const categoryId = clickedPill.dataset.category;
            const container = document.getElementById("products-container");

            if (!categoryId) {
                loadProducts();
                return;
            }

            try {
                const response = await fetch(`${API_URL}/category/${categoryId}`);
                const result = await response.json();
                container.innerHTML = result.data.map(product => createProductCard(product)).join("");
            } catch (error) {
                console.error("Filter error:", error);
            }
        });
    });
}

// Load categories dynamically from the database
async function loadCategories() {
    const dropdownMenu = document.querySelector("#categoryDropdownBtn + .dropdown-menu");
    if (!dropdownMenu) return;

    try {
        const response = await fetch(`${API_BASE}/api/categories`);
        const result = await response.json();
        if (result.success && result.data) {
            let html = "";

            const categoryIcons = {
                "Electronics": "bi-laptop",
                "Clothing": "bi-tag",
                "Home & Kitchen": "bi-house",
                "Books": "bi-book"
            };

            html += result.data.map(cat => {
                const icon = categoryIcons[cat.name] || "bi-tag";
                return `<li><button class="dropdown-item py-2 px-3 rounded-3 category-pill fw-semibold" data-category="${cat.id}"><i class="bi ${icon} me-2 text-muted"></i>${cat.name}</button></li>`;
            }).join("");

            dropdownMenu.innerHTML = html;
            bindCategoryPillListeners();
        }
    } catch (error) {
        console.error("Failed to load categories:", error);
        bindCategoryPillListeners();
    }
}

// Notifications state management
const DEFAULT_NOTIFICATIONS = [
    { id: 1, title: "Welcome Offer 🎉", message: "Get 10% off your next purchase using code: HELLO10", time: "2 hours ago", read: false },
    { id: 2, title: "Flash Sale Live!", message: "40% off on Wireless Earbuds starting now.", time: "1 day ago", read: false }
];

function getNotifications() {
    let list = localStorage.getItem("notifications");
    if (!list) {
        list = JSON.stringify(DEFAULT_NOTIFICATIONS);
        localStorage.setItem("notifications", list);
    }
    return JSON.parse(list);
}

function saveNotifications(notifications) {
    localStorage.setItem("notifications", JSON.stringify(notifications));
    renderNotifications();
}

function addNotification(title, message) {
    const notifications = getNotifications();
    notifications.unshift({
        id: Date.now(),
        title,
        message,
        time: "Just now",
        read: false
    });
    saveNotifications(notifications);
}
window.addNotification = addNotification; // Expose globally for other pages

function renderNotifications() {
    const list = getNotifications();
    const badge = document.getElementById("notificationBadge");
    const container = document.getElementById("notificationList");
    
    if (!container) return;

    const unreadCount = list.filter(n => !n.read).length;
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = "block";
        } else {
            badge.style.display = "none";
        }
    }

    if (list.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="bi bi-bell-slash fs-2 mb-2 d-block"></i>
                <span class="small">No notifications</span>
            </div>
        `;
        return;
    }

    container.innerHTML = list.map(item => `
        <div class="p-2.5 rounded-3 bg-light border-start border-primary border-3 notification-item ${item.read ? 'opacity-75' : ''}" data-id="${item.id}" style="cursor: pointer; transition: opacity 0.2s;">
            <div class="d-flex justify-content-between align-items-start">
                <span class="fw-bold small text-dark">${item.title}</span>
                <small class="text-muted" style="font-size: 0.7rem;">${item.time}</small>
            </div>
            <p class="small text-muted mb-0 mt-1" style="font-size: 0.8rem; line-height: 1.25;">${item.message}</p>
        </div>
    `).join("");

    // Add click handler to mark as read
    container.querySelectorAll(".notification-item").forEach(el => {
        el.addEventListener("click", (e) => {
            e.stopPropagation(); // Keep dropdown open when clicking notification
            const id = parseInt(el.dataset.id);
            const updated = getNotifications().map(n => {
                if (n.id === id) n.read = true;
                return n;
            });
            saveNotifications(updated);
        });
    });
}

async function addToCart(productId) {
    if (!isLoggedIn()) {
        alert("Please login to add items to cart");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(CART_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getToken()}`
            },
            body: JSON.stringify({ product_id: productId, quantity: 1 })
        });

        const result = await response.json();
        if (result.success) {
            updateCartCount();
            showToast("Added to cart!", "success");
            const product = cachedProducts.find(p => p.id === productId);
            const productName = product ? product.name : "an item";
            addNotification("Added to Cart 🛒", `You added ${productName} to your cart.`);
        } else {
            showToast(result.message, "error");
        }
    } catch (error) {
        showToast("Failed to add to cart", "error");
    }
}
window.addToCart = addToCart;

// Update cart count badge
async function updateCartCount() {
    if (!isLoggedIn()) return;
    
    try {
        const response = await fetch(CART_API, {
            headers: { "Authorization": `Bearer ${getToken()}` }
        });
        const result = await response.json();
        const count = result.data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        
        const badge = document.getElementById("cartCount");
        if (badge) badge.textContent = count;
    } catch (error) {
        console.error("Cart count error:", error);
    }
}

// Toast notification
function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `alert alert-${type === "success" ? "success" : "danger"} position-fixed top-0 end-0 m-3`;
    toast.style.zIndex = "9999";
    toast.innerHTML = `<i class="bi ${type === "success" ? "bi-check-circle" : "bi-exclamation-circle"} me-2"></i>${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Load on page load
document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
    updateCartCount();
    renderNotifications();
    loadCategories();

    document.getElementById("clearAllNotificationsBtn")?.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent closing dropdown
        saveNotifications([]);
    });

    // Check login status on page load
    const userData = JSON.parse(localStorage.getItem("user") || "null");
    const authToken = localStorage.getItem("token");
    
    if (userData && authToken) {
        const loginLink = document.getElementById("loginLink");
        if (loginLink) loginLink.style.display = "none";
        const userMenu = document.getElementById("userMenu");
        if (userMenu) userMenu.style.display = "block";
        const userName = document.getElementById("userName");
        if (userName) userName.textContent = userData.username;
        const ordersLink = document.getElementById("ordersLink");
        if (ordersLink) ordersLink.style.display = "block";
    }
});

function logout() {
    localStorage.clear();
    window.location.reload();
}
window.logout = logout;