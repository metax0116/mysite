// database.js
const { Pool } = require('pg'); // PostgreSQL用のPoolをインポート

// データベース接続URLを環境変数から取得
const DATABASE_URL = process.env.DATABASE_URL;

// DATABASE_URL が設定されているか確認 (重要なデバッグポイント)
if (!DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is not set. Please create a .env file or set the variable.');
    process.exit(1); // アプリケーションを終了
}

const pool = new Pool({
    connectionString: DATABASE_URL,
    // RenderやHerokuなどのPaaSでSSL接続が必要な場合
    // SupabaseはSSL接続が推奨されるため、本番環境では ssl: { rejectUnauthorized: false } を使うことが多いです。
    // process.env.NODE_ENV が 'production' の時にのみSSLを有効にするのが一般的です。
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
    console.log('Connected to PostgreSQL database.');
    // 接続時にテーブルが存在しない場合、作成 (CREATE TABLE IF NOT EXISTS が使える)
    pool.query(`
        CREATE TABLE IF NOT EXISTS ingredients (
            id BIGSERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            purchase_date TEXT NOT NULL,
            storage_location TEXT NOT NULL,
            added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS food_loss_contribution (
            id BIGSERIAL PRIMARY KEY,
            amount_g REAL NOT NULL,
            contributed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    `)
    .then(() => console.log('Tables checked/created successfully.'))
    .catch(err => console.error('Error creating tables:', err.message));
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1); // アプリケーションを終了させる
});

module.exports = pool; // dbインスタンスではなく、Poolをエクスポート