// package.json
{
  "name": "product-icon-app",
  "version": "1.0.0",
  "description": "Simple Shopify app to add icons to product pages",
  "main": "index.js",
  "scripts": {
    "dev": "shopify app dev",
    "build": "shopify app build",
    "deploy": "shopify app deploy"
  },
  "dependencies": {
    "@shopify/polaris": "^12.0.0",
    "@shopify/app-bridge-react": "^4.0.0",
    "express": "^4.18.0",
    "sqlite3": "^5.1.0"
  }
}

// shopify.app.toml
name = "Product Icon App"
client_id = "your_client_id_here"
application_url = "https://your-app-url.com"
embedded = true

[access_scopes]
scopes = "write_products,read_products"

[auth]
redirect_urls = [
  "https://your-app-url.com/auth/callback"
]

[webhooks]
api_version = "2023-10"

// index.js - Main server file
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Initialize SQLite database
const db = new sqlite3.Database('./app.db');

// Create settings table
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop TEXT UNIQUE,
    icon_url TEXT,
    icon_position TEXT DEFAULT 'top-right',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Admin page route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API to get current settings
app.get('/api/settings/:shop', (req, res) => {
  const { shop } = req.params;
  
  db.get('SELECT * FROM settings WHERE shop = ?', [shop], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(row || { icon_url: '', icon_position: 'top-right' });
  });
});

// API to save settings
app.post('/api/settings', (req, res) => {
  const { shop, icon_url, icon_position } = req.body;
  
  db.run(
    `INSERT OR REPLACE INTO settings (shop, icon_url, icon_position) 
     VALUES (?, ?, ?)`,
    [shop, icon_url, icon_position],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// API to get icon for storefront
app.get('/api/icon/:shop', (req, res) => {
  const { shop } = req.params;
  
  db.get('SELECT icon_url, icon_position FROM settings WHERE shop = ?', [shop], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(row || { icon_url: '', icon_position: 'top-right' });
  });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

// public/admin.html - Admin interface
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Icon Settings</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 {
            color: #202223;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #202223;
        }
        input[type="url"], select {
            width: 100%;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            box-sizing: border-box;
        }
        input[type="url"]:focus, select:focus {
            outline: none;
            border-color: #5c6ac4;
            box-shadow: 0 0 0 3px rgba(92, 106, 196, 0.1);
        }
        button {
            background-color: #5c6ac4;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        button:hover {
            background-color: #4c5aa3;
        }
        .preview {
            margin-top: 30px;
            padding: 20px;
            border: 2px dashed #d1d5db;
            border-radius: 6px;
            position: relative;
            min-height: 100px;
            background-color: #f8f9fa;
        }
        .preview-icon {
            position: absolute;
            width: 32px;
            height: 32px;
            background-color: #5c6ac4;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        .preview-icon.top-left { top: 10px; left: 10px; }
        .preview-icon.top-right { top: 10px; right: 10px; }
        .preview-icon.bottom-left { bottom: 10px; left: 10px; }
        .preview-icon.bottom-right { bottom: 10px; right: 10px; }
        .success-message {
            background-color: #d4edda;
            color: #155724;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 20px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Product Icon Settings</h1>
        
        <div id="successMessage" class="success-message">
            Settings saved successfully!
        </div>
        
        <form id="settingsForm">
            <div class="form-group">
                <label for="iconUrl">Icon URL:</label>
                <input type="url" id="iconUrl" placeholder="https://example.com/icon.png" required>
            </div>
            
            <div class="form-group">
                <label for="iconPosition">Icon Position:</label>
                <select id="iconPosition" required>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                </select>
            </div>
            
            <button type="submit">Save Settings</button>
        </form>
        
        <div class="preview">
            <h3>Preview</h3>
            <p>This is how the icon will appear on your product page</p>
            <div id="previewIcon" class="preview-icon top-right">
                <img id="previewImage" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" alt="Icon">
            </div>
        </div>
    </div>

    <script>
        const shop = new URLSearchParams(window.location.search).get('shop') || 'demo-shop';
        
        // Load current settings
        fetch(`/api/settings/${shop}`)
            .then(response => response.json())
            .then(data => {
                document.getElementById('iconUrl').value = data.icon_url || '';
                document.getElementById('iconPosition').value = data.icon_position || 'top-right';
                updatePreview();
            });
        
        // Handle form submission
        document.getElementById('settingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const iconUrl = document.getElementById('iconUrl').value;
            const iconPosition = document.getElementById('iconPosition').value;
            
            fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shop, icon_url: iconUrl, icon_position: iconPosition })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('successMessage').style.display = 'block';
                    setTimeout(() => {
                        document.getElementById('successMessage').style.display = 'none';
                    }, 3000);
                }
            });
        });
        
        // Update preview when inputs change
        document.getElementById('iconUrl').addEventListener('input', updatePreview);
        document.getElementById('iconPosition').addEventListener('change', updatePreview);
        
        function updatePreview() {
            const iconUrl = document.getElementById('iconUrl').value;
            const iconPosition = document.getElementById('iconPosition').value;
            const previewIcon = document.getElementById('previewIcon');
            const previewImage = document.getElementById('previewImage');
            
            // Update position
            previewIcon.className = `preview-icon ${iconPosition}`;
            
            // Update icon
            if (iconUrl) {
                previewImage.src = iconUrl;
                previewImage.style.display = 'block';
            } else {
                previewImage.style.display = 'none';
            }
        }
    </script>
</body>
</html>

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
