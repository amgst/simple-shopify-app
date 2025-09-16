


// index.js - Main server file
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Initialize SQLite database
// Use writable path on serverless (Vercel) which only allows writes to /tmp
const databaseFilePath = process.env.DATABASE_PATH || (process.env.VERCEL ? '/tmp/app.db' : path.join(__dirname, 'app.db'));
const db = new sqlite3.Database(databaseFilePath);

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

// Only start listening in a traditional server environment
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
  });
}

// Export the app for Vercel serverless
module.exports = app;


