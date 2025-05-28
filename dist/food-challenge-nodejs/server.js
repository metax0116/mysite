// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database'); // PostgreSQL Pool をインポート

const app = express();
const port = process.env.PORT || 3000;

// --- ミドルウェア ---
app.use(cors());
app.use(express.json());

// 静的ファイルの配信設定
app.use(express.static(path.join(__dirname, 'public')));

// ルートURL ('/') へのアクセス時に index.html を配信
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// --- 鮮度予測の簡易関数 ---
function predictFreshness(purchaseDate, storageLocation) {
    const today = new Date();
    const purchased = new Date(purchaseDate);
    const diffTime = Math.abs(today.getTime() - purchased.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (storageLocation === 'refrigerator') {
        if (diffDays <= 1) {
            return 'critical';
        } else if (diffDays <= 3) {
            return 'warning';
        } else {
            return 'normal';
        }
    } else if (storageLocation === 'freezer') {
        if (diffDays <= 30) {
            return 'normal';
        } else {
            return 'warning';
        }
    } else if (storageLocation === 'roomTemp') {
        if (diffDays <= 0) {
            return 'critical';
        } else if (diffDays <= 1) {
            return 'warning';
        } else {
            return 'critical';
        }
    }
    return 'normal';
}


// --- API エンドポイント ---

// 食材登録
app.post('/api/ingredients', async (req, res) => { // async を追加
    const { name, purchaseDate, storageLocation } = req.body;

    if (!name || !purchaseDate || !storageLocation) {
        return res.status(400).json({ status: 'error', message: '食材名、購入日/賞味期限、保存場所は必須です。' });
    }

    try {
        const result = await db.query( // db.run の代わりに db.query を使用
            `INSERT INTO ingredients (name, purchase_date, storage_location) VALUES ($1, $2, $3) RETURNING id`, // $1, $2, $3 でプレースホルダ
            [name, purchaseDate, storageLocation]
        );
        res.status(201).json({ status: 'success', message: '食材が正常に登録されました。', id: result.rows[0].id });
    } catch (err) {
        console.error('Database insert error:', err.message);
        res.status(500).json({ status: 'error', message: '食材の登録に失敗しました: ' + err.message });
    }
});

// 食材リスト取得
app.get('/api/ingredients', async (req, res) => { // async を追加
    try {
        const result = await db.query(`SELECT * FROM ingredients ORDER BY added_at DESC`); // db.all の代わりに db.query を使用
        const ingredientsWithFreshness = result.rows.map(ingredient => ({ // result.rows でデータを取得
            ...ingredient,
            status: predictFreshness(ingredient.purchase_date, ingredient.storage_location)
        }));
        res.json({ status: 'success', ingredients: ingredientsWithFreshness });
    } catch (err) {
        console.error('Database select error:', err.message);
        res.status(500).json({ status: 'error', message: '食材リストの取得に失敗しました: ' + err.message });
    }
});

// 食品ロス貢献度スコア取得
app.get('/api/contribution', async (req, res) => { // async を追加
    try {
        const result = await db.query(`SELECT SUM(amount_g) AS total_g FROM food_loss_contribution`); // db.get の代わりに db.query
        const totalLossSaved = result.rows[0].total_g || 0; // result.rows[0] で最初の行を取得

        const co2Equivalent = Math.round(totalLossSaved * 0.002 * 10) / 10;
        const savedAmount = Math.round(totalLossSaved * 1);

        res.json({
            status: 'success',
            total_g: totalLossSaved,
            co2_equivalent_kg: co2Equivalent,
            saved_amount_yen: savedAmount
        });
    } catch (err) {
        console.error('Database get sum error:', err.message);
        res.status(500).json({ status: 'error', message: '貢献度スコアの取得に失敗しました: ' + err.message });
    }
});

// (開発用) 貢献度を加算するエンドポイント
app.post('/api/contribution/add', async (req, res) => { // async を追加
    const { amount_g } = req.body;

    if (typeof amount_g !== 'number' || amount_g <= 0) {
        return res.status(400).json({ status: 'error', message: '有効な貢献量を指定してください。' });
    }

    try {
        const result = await db.query(`INSERT INTO food_loss_contribution (amount_g) VALUES ($1) RETURNING id`, [amount_g]);
        res.status(201).json({ status: 'success', message: '貢献度が追加されました。', id: result.rows[0].id });
    } catch (err) {
        console.error('Database insert contribution error:', err.message);
        res.status(500).json({ status: 'error', message: '貢献度の追加に失敗しました: ' + err.message });
    }
});


// --- サーバー起動部分 ---
// データベース接続はdatabase.jsでPoolを初期化する際に自動的に行われるため、
// ここでは直接listenを開始します。Poolは非同期で接続を確立するため、
// APIリクエスト時にエラーが発生した場合も、pgライブラリが適切にハンドリングします。
// ただし、起動時にデータベースが完全に利用可能であることを確実にしたい場合は、
// Poolのconnectイベントを待つことも可能です（database.jsでログを確認）。
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Access frontend: http://localhost:${port}/`);
    console.log(`Access API: http://localhost:${port}/api/ingredients`);
});