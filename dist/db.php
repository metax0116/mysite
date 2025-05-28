<?php

// データベースファイル名
define('DB_FILE', 'food_challenge.sqlite');

try {
    // SQLiteデータベースに接続
    $pdo = new PDO('sqlite:' . DB_FILE);
    // エラーモードを例外に設定
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // フェッチモードをASSOCに設定 (連想配列で取得)
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // 食材テーブルが存在しない場合、作成する
    $pdo->exec("CREATE TABLE IF NOT EXISTS ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        purchase_date TEXT NOT NULL,
        storage_location TEXT NOT NULL,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // 食品ロス貢献度テーブルが存在しない場合、作成する
    $pdo->exec("CREATE TABLE IF NOT EXISTS food_loss_contribution (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount_g REAL NOT NULL,
        contributed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

} catch (PDOException $e) {
    // データベース接続エラー時の処理
    error_log("Database connection error: " . $e->getMessage());
    die("Database connection failed. Please check server logs.");
}

// データベース接続を返す
return $pdo;

?>