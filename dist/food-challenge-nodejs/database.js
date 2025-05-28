// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_FILE = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, 'food_challenge.sqlite')
    : path.join(__dirname, 'food_challenge_dev.sqlite');

// ここがポイント: dbインスタンスそのものをエクスポートする
const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // テーブルが存在しない場合、作成
        db.run(`CREATE TABLE IF NOT EXISTS ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            purchase_date TEXT NOT NULL,
            storage_location TEXT NOT NULL,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS food_loss_contribution (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount_g REAL NOT NULL,
            contributed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

module.exports = db; // dbインスタンスをエクスポート