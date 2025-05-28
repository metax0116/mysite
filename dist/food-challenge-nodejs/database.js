// database.js
const { Pool } = require('pg'); // PostgreSQL用のPoolをインポート

// データベース接続URLを環境変数から取得
// ローカル開発用にデフォルト値も設定しておく（後でSupabaseのURIに置き換える）
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:[2024gakusei]@db.nleixvhsrjuqsvbtgmwl.supabase.co:5432/postgres";

const pool = new Pool({
    connectionString: DATABASE_URL,
    // RenderやHerokuなどのPaaSでSSL接続が必要な場合
    // SupabaseはSSL接続が推奨されるため、本番環境ではssl: { rejectUnauthorized: false } を使うことが多い
    // ローカルテストでは不要な場合もありますが、Renderデプロイ時に必須になることがあります。
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
    console.log('Connected to PostgreSQL database.');
    // 接続時にテーブルが存在しない場合、作成（PostgreSQLではCREATE TABLE IF NOT EXISTSが使える）
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