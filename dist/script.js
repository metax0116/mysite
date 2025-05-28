// script.js
// サーバーのベースURL (Renderデプロイ後に変更)
const API_BASE_URL = 'http://localhost:3000/api'; // ローカル開発用。Renderデプロイ後はRenderのURLに書き換える

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

            if (result.status === 'success') {
                alert(`「${name}」を登録しました。\n購入日/期限: ${date}\n保存場所: ${storage}`);
                displayIngredients();
                document.getElementById('ingredientName').value = '';
                document.getElementById('purchaseDate').value = '';
            } else {
                alert(`登録に失敗しました: ${result.message}`);
            }
        } catch (error) {
            console.error('Error adding ingredient:', error);
            alert('食材の登録中にエラーが発生しました。');
        }
    } else {
        alert('食材名、購入日/賞味期限、保存場所を入力してください。');
    }
}

// 食材リストを表示する関数
async function displayIngredients() {
    const criticalList = document.getElementById('criticalIngredients');
    criticalList.innerHTML = '<p style="text-align: center; color: #888;">読み込み中...</p>'; // 読み込み中表示

    try {
        const response = await fetch(`${API_BASE_URL}/ingredients`);
        const result = await response.json();

        if (result.status === 'success' && result.ingredients) {
            criticalList.innerHTML = ''; // クリア
            if (result.ingredients.length === 0) {
                criticalList.innerHTML = '<p style="text-align: center; color: #888;">登録されている食材はありません。登録してみましょう！</p>';
            } else {
                result.ingredients.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.classList.add('ingredient-item');
                    if (item.status === 'critical') {
                        itemDiv.classList.add('critical');
                    } else if (item.status === 'warning') {
                        itemDiv.classList.add('warning');
                    }
                    itemDiv.innerHTML = `
                        <h3>${item.name}</h3>
                        <p>鮮度: ${item.status === 'critical' ? '今日中に使い切り！' : item.status === 'warning' ? '明日までに使い切り！' : '良好'}</p>
                        <p>購入日: ${item.purchase_date}</p>
                        <p>保存: ${item.storage_location}</p>
                    `;
                    criticalList.appendChild(itemDiv);
                });
            }
        } else {
            console.error('Failed to load ingredients:', result.message);
            criticalList.innerHTML = '<p style="text-align: center; color: #888;">食材リストの読み込みに失敗しました。</p>';
        }
    } catch (error) {
        console.error('Error fetching ingredients:', error);
        criticalList.innerHTML = '<p style="text-align: center; color: #888;">食材リストの取得中にエラーが発生しました。</p>';
    }
}

// 食品ロス貢献度スコアを表示する関数
async function displayContributionScore() {
    const scoreValue = document.querySelector('.contribution-score .score-value');
    const scoreDetail = document.querySelectorAll('.contribution-score .score-detail');

    try {
        const response = await fetch(`${API_BASE_URL}/contribution`);
        const result = await response.json();

        if (result.status === 'success') {
            scoreValue.textContent = `${Math.round(result.total_g)}g`;
            scoreDetail[0].textContent = `今月これまでに削減した食品ロス`;
            scoreDetail[1].textContent = `CO2排出量削減: ${result.co2_equivalent_kg}kg相当 | 節約金額: ¥${result.saved_amount_yen}相当`;
        } else {
            console.error('Failed to load contribution score:', result.message);
            scoreValue.textContent = '---g';
            scoreDetail[0].textContent = 'スコアの読み込みに失敗しました';
            scoreDetail[1].textContent = '';
        }
    } catch (error) {
        console.error('Error fetching contribution score:', error);
        scoreValue.textContent = '---g';
        scoreDetail[0].textContent = 'スコアの取得中にエラーが発生しました';
        scoreDetail[1].textContent = '';
    }
}

// レシピのダミーデータ（実際のアプリではAPIから動的に取得）
// 実際には、Node.jsバックエンドでDBからレシピ情報を取得し、
// 危機的食材と連携して動的に生成するロジックを実装します。
const dummyRecipes = [
    {
        img: "images/01.jfif", // 適切なパスに修正
        title: "鶏肉と野菜のピリ辛炒め",
        ingredients_to_consume: ["鶏もも肉", "玉ねぎ", "ピーマン"],
        instructions: [
            "鶏もも肉を一口大に切り、酒と醤油で下味をつける。",
            "玉ねぎ、ピーマンを切り、フライパンで炒める。",
            "鶏肉を加えて火が通るまで炒め、甜麺醤と豆板醤で味付け。"
        ]
    },
    {
        img: "images/02.jfif", // 適切なパスに修正
        title: "カリカリ豆腐ステーキ",
        ingredients_to_consume: ["豆腐", "ネギ", "醤油"],
        instructions: [
            "豆腐を水切りし、片栗粉をまぶしてフライパンで焼く。",
            "醤油、みりん、生姜を合わせたタレを絡める。"
        ]
    }
];

function displayRecipes() {
    const recipeSuggestions = document.getElementById('recipeSuggestions');
    recipeSuggestions.innerHTML = ''; // Clear existing recipes

    if (dummyRecipes.length === 0) {
        recipeSuggestions.innerHTML = '<p style="text-align: center; color: #888;">危機的な食材が見つかると、おすすめレシピが表示されます。</p>';
    } else {
        dummyRecipes.forEach(recipe => {
            const recipeCard = document.createElement('div');
            recipeCard.classList.add('recipe-card');
            const ingredientsHtml = recipe.ingredients_to_consume.map(ing => `<strong>${ing}</strong>`).join(', ');
            const instructionsHtml = recipe.instructions.map(inst => `<li>${inst}</li>`).join('');

            recipeCard.innerHTML = `
                <img src="${recipe.img}" alt="${recipe.title}">
                <div>
                    <h4>${recipe.title}</h4>
                    <p>消費したい食材: ${ingredientsHtml}</p>
                    <ul>${instructionsHtml}</ul>
                </div>
            `;
            recipeSuggestions.appendChild(recipeCard);
        });
    }
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', () => {
    displayIngredients();
    displayContributionScore();
    displayRecipes(); // レシピ表示も追加
});