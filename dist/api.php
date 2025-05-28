<?php

header('Content-Type: application/json'); // JSON形式でレスポンスを返すことを宣言

require_once 'db.php'; // データベース接続ファイルを読み込む

$method = $_SERVER['REQUEST_METHOD']; // リクエストメソッドを取得

// 鮮度を予測する簡易関数（実際にはより複雑なロジックが必要です）
function predictFreshness($purchaseDate, $storageLocation) {
    $today = new DateTime();
    $purchased = new DateTime($purchaseDate);
    $diff = $today->diff($purchased)->days; // 購入日からの経過日数

    if ($storageLocation === 'refrigerator') {
        if ($diff <= 1) { // 1日以内
            return 'critical'; // 今日中に使い切り
        } elseif ($diff <= 3) { // 3日以内
            return 'warning'; // 明日までに使い切り
        } else {
            return 'normal'; // 良好
        }
    } elseif ($storageLocation === 'freezer') {
        // 冷凍庫は長持ちすると仮定
        if ($diff <= 30) { // 30日以内
            return 'normal';
        } else {
            return 'warning'; // 長期保存なら注意
        }
    } elseif ($storageLocation === 'roomTemp') {
        if ($diff <= 0) { // 購入日当日
            return 'critical'; // 今日中に使い切り
        } elseif ($diff <= 1) { // 1日以内
            return 'warning'; // 明日までに使い切り
        } else {
            return 'critical'; // 常温は傷みやすい
        }
    }
    return 'normal';
}

switch ($method) {
    case 'POST': // 食材登録
        $input = json_decode(file_get_contents('php://input'), true); // JSON形式のPOSTデータを取得

        $name = $input['name'] ?? '';
        $purchaseDate = $input['purchaseDate'] ?? '';
        $storageLocation = $input['storageLocation'] ?? '';

        if (empty($name) || empty($purchaseDate) || empty($storageLocation)) {
            echo json_encode(['status' => 'error', 'message' => '食材名、購入日/賞味期限、保存場所は必須です。']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO ingredients (name, purchase_date, storage_location) VALUES (:name, :purchase_date, :storage_location)");
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':purchase_date', $purchaseDate);
            $stmt->bindParam(':storage_location', $storageLocation);
            $stmt->execute();

            echo json_encode(['status' => 'success', 'message' => '食材が正常に登録されました。', 'id' => $pdo->lastInsertId()]);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => '食材の登録に失敗しました: ' . $e->getMessage()]);
        }
        break;

    case 'GET': // 食材リストと貢献度スコアの取得
        $action = $_GET['action'] ?? '';

        if ($action === 'ingredients') {
            try {
                $stmt = $pdo->query("SELECT * FROM ingredients ORDER BY added_at DESC");
                $ingredients = $stmt->fetchAll();

                // 各食材の鮮度を予測して追加
                foreach ($ingredients as &$ingredient) {
                    $ingredient['status'] = predictFreshness($ingredient['purchase_date'], $ingredient['storage_location']);
                }

                echo json_encode(['status' => 'success', 'ingredients' => $ingredients]);
            } catch (PDOException $e) {
                echo json_encode(['status' => 'error', 'message' => '食材リストの取得に失敗しました: ' . $e->getMessage()]);
            }
        } elseif ($action === 'contribution') {
            try {
                // 食品ロス貢献度スコアの合計を取得
                $stmt = $pdo->query("SELECT SUM(amount_g) AS total_g FROM food_loss_contribution");
                $totalLossSaved = $stmt->fetchColumn();
                $totalLossSaved = $totalLossSaved ? $totalLossSaved : 0; // NULLの場合は0

                // 簡易的なCO2換算 (例: 1gあたり0.002kg-CO2eを想定)
                $co2Equivalent = round($totalLossSaved * 0.002, 1);
                // 簡易的な節約金額 (例: 1gあたり1円を想定)
                $savedAmount = round($totalLossSaved * 1, 0);

                echo json_encode([
                    'status' => 'success',
                    'total_g' => $totalLossSaved,
                    'co2_equivalent_kg' => $co2Equivalent,
                    'saved_amount_yen' => $savedAmount
                ]);
            } catch (PDOException $e) {
                echo json_encode(['status' => 'error', 'message' => '貢献度スコアの取得に失敗しました: ' . $e->getMessage()]);
            }
        } elseif ($action === 'add_contribution') { // 食材を使い切った時に貢献度を加算する（開発用）
            $input = json_decode(file_get_contents('php://input'), true);
            $amount = $input['amount_g'] ?? 0;

            if ($amount <= 0) {
                echo json_encode(['status' => 'error', 'message' => '有効な貢献量を指定してください。']);
                exit;
            }

            try {
                $stmt = $pdo->prepare("INSERT INTO food_loss_contribution (amount_g) VALUES (:amount)");
                $stmt->bindParam(':amount', $amount);
                $stmt->execute();
                echo json_encode(['status' => 'success', 'message' => '貢献度が追加されました。']);
            } catch (PDOException $e) {
                echo json_encode(['status' => 'error', 'message' => '貢献度の追加に失敗しました: ' . $e->getMessage()]);
            }

        } else {
            echo json_encode(['status' => 'error', 'message' => '不明なアクションです。']);
        }
        break;

    default:
        echo json_encode(['status' => 'error', 'message' => 'サポートされていないメソッドです。']);
        break;
}

?>