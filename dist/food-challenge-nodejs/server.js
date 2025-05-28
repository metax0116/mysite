// server.js
const express = require('express');
const cors = require('cors');
const db = require('./database'); // データベース接続をインポート

const app = express();
const port = process.env.PORT || 3000; // Renderが割り当てるポートまたはローカルの3000番

app.use(cors()); // CORSを有効にする（フロントエンドからのアクセスを許可）
app.use(express.json()); // JSON形式のリクエストボディをパースするミドルウェア

// 鮮度を予測する簡易関数（PHP版と同様、より複雑なロジックは別途実装）
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
app.post('/api/ingredients', (req, res) => {
    const { name, purchaseDate, storageLocation } = req.body;

    if (!name || !purchaseDate || !storageLocation) {
        return res.status(400).json({ status: 'error', message: '食材名、購入日/賞味期限、保存場所は必須です。' });
    }

    db.run(
        `INSERT INTO ingredients (name, purchase_date, storage_location) VALUES (?, ?, ?)`,
        [name, purchaseDate, storageLocation],
        function(err) {
            if (err) {
                return res.status(500).json({ status: 'error', message: '食材の登録に失敗しました: ' + err.message });
            }
            res.status(201).json({ status: 'success', message: '食材が正常に登録されました。', id: this.lastID });
        }
    );
});

// 食材リスト取得
app.get('/api/ingredients', (req, res) => {
    db.all(`SELECT * FROM ingredients ORDER BY added_at DESC`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ status: 'error', message: '食材リストの取得に失敗しました: ' + err.message });
        }
        const ingredientsWithFreshness = rows.map(ingredient => ({
            ...ingredient,
            status: predictFreshness(ingredient.purchase_date, ingredient.storage_location)
        }));
        res.json({ status: 'success', ingredients: ingredientsWithFreshness });
    });
});

// 食品ロス貢献度スコア取得
app.get('/api/contribution', (req, res) => {
    db.get(`SELECT SUM(amount_g) AS total_g FROM food_loss_contribution`, [], (err, row) => {
        if (err) {
            return res.status(500).json({ status: 'error', message: '貢献度スコアの取得に失敗しました: ' + err.message });
        }
        const totalLossSaved = row.total_g || 0;

        // 簡易的なCO2換算 (例: 1gあたり0.002kg-CO2eを想定)
        const co2Equivalent = Math.round(totalLossSaved * 0.002 * 10) / 10; // 小数点以下1桁
        // 簡易的な節約金額 (例: 1gあたり1円を想定)
        const savedAmount = Math.round(totalLossSaved * 1);

        res.json({
            status: 'success',
            total_g: totalLossSaved,
            co2_equivalent_kg: co2Equivalent,
            saved_amount_yen: savedAmount
        });
    });
});

// (開発用) 貢献度を加算するエンドポイント - 実際には食材消費時に呼び出す
app.post('/api/contribution/add', (req, res) => {
    const { amount_g } = req.body;

    if (typeof amount_g !== 'number' || amount_g <= 0) {
        return res.status(400).json({ status: 'error', message: '有効な貢献量を指定してください。' });
    }

    db.run(`INSERT INTO food_loss_contribution (amount_g) VALUES (?)`, [amount_g], function(err) {
        if (err) {
            return res.status(500).json({ status: 'error', message: '貢献度の追加に失敗しました: ' + err.message });
        }
        res.status(201).json({ status: 'success', message: '貢献度が追加されました。', id: this.lastID });
    });
});


// サーバー起動
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});