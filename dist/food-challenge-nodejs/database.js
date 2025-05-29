require('dotenv').config(); 
 // 環境変数を読み込むために dotenv を一番最初に設定
// database.js
// PostgreSQLデータベースへの接続を管理するための Pool クラスを 'pg' ライブラリからインポートします。
const { Pool } = require('pg');

// 環境変数からデータベース接続URLを取得します。
// この DATABASE_URL は .env ファイルに定義されている必要があります。
const DATABASE_URL = process.env.DATABASE_URL;

// DATABASE_URL 環境変数が設定されているか確認します。
// 設定されていない場合、エラーメッセージを表示してアプリケーションを終了します。
if (!DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is not set.');
    console.error('Please create a .env file in the project root with DATABASE_URL defined,');
    console.error('or ensure it is set in your deployment environment.');
    process.exit(1); // アプリケーションを終了させる
}

// PostgreSQLの接続プールを初期化します。
// connectionString: データベースへの接続情報を含むURL。
// ssl: SSL接続の設定。
//      本番環境 (process.env.NODE_ENV === 'production') の場合のみSSLを有効にし、
//      自己署名証明書などを拒否しない設定 (rejectUnauthorized: false) にします。
//      Supabaseは通常SSL接続を推奨します。
//      開発環境ではSSLを無効にします（ローカルでのデバッグを容易にするため）。
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }

});

// データベースへの接続が成功したときにトリガーされるイベントリスナー。
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database successfully.');
    // データベース接続時に、必要なテーブルが存在しない場合に自動で作成します。
    // CREATE TABLE IF NOT EXISTS は、テーブルが存在しない場合にのみ作成します。
    pool.query(`
        CREATE TABLE IF NOT EXISTS ingredients (
            id BIGSERIAL PRIMARY KEY,             -- 自動増分する主キー (BIGSERIALはPostgreSQLの特別な型)
            name TEXT NOT NULL,                   -- 食材名 (必須)
            purchase_date TEXT NOT NULL,          -- 購入日/賞味期限 (テキスト形式で保存)
            storage_location TEXT NOT NULL,       -- 保存場所 (必須)
            added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP -- 登録日時 (タイムゾーン付き、デフォルトで現在時刻)
        );
        CREATE TABLE IF NOT EXISTS food_loss_contribution (
            id BIGSERIAL PRIMARY KEY,             -- 自動増分する主キー
            amount_g REAL NOT NULL,               -- 貢献量 (グラム、実数型)
            contributed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP -- 貢献日時 (タイムゾーン付き、デフォルトで現在時刻)
        );
    `)
    .then(() => console.log('Database tables checked/created successfully.'))
    .catch(err => console.error('Error creating database tables:', err.message));
});

// データベースプールで予期せぬエラーが発生したときにトリガーされるイベントリスナー。
pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err.message);
    // 致命的なエラーの場合、アプリケーションを終了させることも検討。
    // process.exit(-1);
});

// データベース接続プールをモジュールの外部にエクスポートします。
// これにより、他のファイル (server.jsなど) で db.query() を呼び出してデータベース操作ができます。
module.exports = pool;