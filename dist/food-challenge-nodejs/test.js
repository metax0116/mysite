require('dotenv').config();
const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

(async () => {
    try {
        const result = await db.query('SELECT * FROM ingredients');
        console.log(result.rows);
    } catch (err) {
        console.error('❌ クエリエラー:', err.message);
    }
})();
