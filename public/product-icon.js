
// public/product-icon.js - Frontend script for product pages
(function() {
    const shop = window.Shopify?.shop || 'demo-shop.myshopify.com';
    
    // Fetch icon settings
    fetch(`https://your-app-url.com/api/icon/${shop.replace('.myshopify.com', '')}`)
        .then(response => response.json())
        .then(data => {
            if (data.icon_url) {
                addIconToProductPage(data.icon_url, data.icon_position);
            }
        })
        .catch(err => console.log('Product icon app error:', err));
    
    function addIconToProductPage(iconUrl, position = 'top-right') {
        // Find product image container
        const productImage = document.querySelector('.product-image, .product__media img, [data-product-image]') || 
                           document.querySelector('img[src*="products/"]');
        
        if (!productImage) return;
        
        const container = productImage.closest('.product-image, .product__media') || productImage.parentElement;
        
        if (!container) return;
        
        // Make container relative if not already
        const containerStyle = window.getComputedStyle(container);
        if (containerStyle.position === 'static') {
            container.style.position = 'relative';
        }
        
        // Create icon element
        const icon = document.createElement('img');
        icon.src = iconUrl;
        icon.style.cssText = `
            position: absolute;
            width: 40px;
            height: 40px;
            z-index: 10;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: transform 0.2s ease;
            cursor: pointer;
        `;
        
        // Set position
        const positions = {
            'top-left': 'top: 10px; left: 10px;',
            'top-right': 'top: 10px; right: 10px;',
            'bottom-left': 'bottom: 10px; left: 10px;',
            'bottom-right': 'bottom: 10px; right: 10px;'
        };
        
        icon.style.cssText += positions[position] || positions['top-right'];
        
        // Add hover effect
        icon.addEventListener('mouseenter', () => {
            icon.style.transform = 'scale(1.1)';
        });
        
        icon.addEventListener('mouseleave', () => {
            icon.style.transform = 'scale(1)';
        });
        
        // Add to container
        container.appendChild(icon);
    }
})();
