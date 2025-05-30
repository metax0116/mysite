// database.js
require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL が設定されていません。');
    process.exit(1);
}

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }  // SupabaseではSSLが必須
});

pool.on('connect', () => {
    console.log('✅ PostgreSQL に接続成功');

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
    `).then(() => {
        console.log('✅ テーブルチェック完了（存在しない場合は作成されました）');
    }).catch(err => {
        console.error('❌ テーブル作成エラー:', err);
    });
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL エラー:', err);
});

module.exports = pool;
