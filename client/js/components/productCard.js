export function createProductCard(product) {
    const isOutOfStock = product.stock === 0;
    const buttonText = isOutOfStock ? '<i class="bi bi-x-circle me-1"></i>Out of Stock' : '<i class="bi bi-cart-plus me-1"></i>Add To Cart';
    const buttonClass = isOutOfStock ? 'btn-secondary disabled' : 'btn-primary';
    
    return `
        <div class="col-sm-6 col-md-4 col-lg-3">
            <article class="card product-card h-100 shadow-sm border-0" 
                     style="border-radius: 16px; overflow: hidden; transition: all 0.3s; cursor: pointer;"
                     onclick="window.location.href='product.html?id=${product.id}'">
                 <div class="product-image-wrap" style="position: relative; aspect-ratio: 1; background: #f8fafc; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <img src="${product.image && product.image.startsWith('http') ? product.image : 'assets/' + (product.image || 'placeholder.jpg')}"
                        class="card-img-top"
                        alt="${product.name}"
                        style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s;"
                        onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80'">
                    ${isOutOfStock ? `
                        <span class="badge bg-danger position-absolute top-3 start-3 px-3 py-2 rounded-pill fw-bold shadow-sm" style="top: 15px; left: 15px;">
                            Out of Stock
                        </span>
                    ` : ''}
                </div>

                <div class="card-body d-flex flex-column p-4">
                    <h3 class="h6 card-title fw-bold text-dark mb-2" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 40px;">
                        ${product.name}
                    </h3>

                    <p class="product-short text-muted small mb-3" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 36px;">
                        ${product.description || 'No description available.'}
                    </p>

                    <div class="d-flex justify-content-between align-items-center mt-auto mb-3">
                        <span class="product-price fw-extrabold text-primary fs-5" style="color: #6366f1 !important;">
                            ₹${product.price}
                        </span>
                        <span class="badge ${product.stock <= 5 ? 'bg-warning text-dark' : 'bg-success-subtle text-success'} rounded-pill px-2 py-1">
                            ${isOutOfStock ? '0 left' : `${product.stock} in stock`}
                        </span>
                    </div>

                    <div class="d-grid" onclick="event.stopPropagation()">
                        <button class="btn ${buttonClass} py-2.5 rounded-pill fw-semibold shadow-sm" 
                                onclick="addToCart(${product.id})"
                                ${isOutOfStock ? 'disabled' : ''}>
                            ${buttonText}
                        </button>
                    </div>
                </div>
            </article>
        </div>
    `;
}