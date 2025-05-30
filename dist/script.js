// ✅ APIのベースURLを環境に応じて自動設定（RenderでもローカルでもOK）
const API_BASE_URL = window.location.origin + '/api';

// 食材を登録する関数
async function addIngredient() {
    const name = document.getElementById('ingredientName').value;
    const date = document.getElementById('purchaseDate').value;
    const storage = document.getElementById('storageLocation').value;

    if (name && date && storage) {
        try {
            const response = await fetch(`${API_BASE_URL}/ingredients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, purchaseDate: date, storageLocation: storage })
            });
            const result = await response.json();

            if (response.ok && result.status === 'success') {
                alert(`「${name}」を登録しました。`);
                displayIngredients();
                document.getElementById('ingredientName').value = '';
                document.getElementById('purchaseDate').value = '';
                document.getElementById('storageLocation').value = 'refrigerator';
            } else {
                alert(`登録に失敗しました: ${result.message || '不明なエラー'}`);
                console.error('API Error:', result.message);
            }
        } catch (error) {
            console.error('Error adding ingredient:', error);
            alert('ネットワークエラー：サーバーが起動しているか確認してください。');
        }
    } else {
        alert('全項目を入力してください。');
    }
}

// 食材リスト表示
async function displayIngredients() {
    const list = document.getElementById('criticalIngredients');
    list.innerHTML = '<p style="text-align: center; color: #888;">読み込み中...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/ingredients`);
        const result = await response.json();

        if (response.ok && result.status === 'success') {
            list.innerHTML = '';
            if (result.ingredients.length === 0) {
                list.innerHTML = '<p>食材はまだ登録されていません。</p>';
            } else {
                result.ingredients.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.classList.add('ingredient-item');
                    itemDiv.classList.add(item.status);
                    itemDiv.innerHTML = `
                        <h3>${item.name}</h3>
                        <p>鮮度: ${item.status}</p>
                        <p>購入日: ${item.purchase_date}</p>
                        <p>保存: ${item.storage_location}</p>
                    `;
                    list.appendChild(itemDiv);
                });
            }
        } else {
            console.error('Failed to load ingredients:', result.message);
            list.innerHTML = '<p>取得に失敗しました。</p>';
        }
    } catch (error) {
        console.error('Fetch error:', error);
        list.innerHTML = '<p>サーバー接続に失敗しました。</p>';
    }
}

// 貢献スコア表示
async function displayContributionScore() {
    const scoreValue = document.querySelector('.contribution-score .score-value');
    const scoreDetail = document.querySelectorAll('.contribution-score .score-detail');

    try {
        const response = await fetch(`${API_BASE_URL}/contribution`);
        const result = await response.json();

        if (response.ok && result.status === 'success') {
            scoreValue.textContent = `${Math.round(result.total_g)}g`;
            scoreDetail[0].textContent = '食品ロス削減量';
            scoreDetail[1].textContent = `CO2削減: ${result.co2_equivalent_kg}kg | 節約: ¥${result.saved_amount_yen}`;
        } else {
            scoreValue.textContent = '---';
            scoreDetail[0].textContent = '取得失敗';
            scoreDetail[1].textContent = '';
            console.error('Contribution error:', result.message);
        }
    } catch (error) {
        console.error('Fetch contribution error:', error);
        scoreValue.textContent = '---';
        scoreDetail[0].textContent = '接続エラー';
        scoreDetail[1].textContent = '';
    }
}

// ダミーレシピの表示（省略可）
function displayRecipes() {
    // 任意のままでOK（元のコードで）
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addIngredientButton')?.addEventListener('click', addIngredient);
    displayIngredients();
    displayContributionScore();
    displayRecipes();
});
