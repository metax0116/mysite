        function addIngredient() {
            const name = document.getElementById('ingredientName').value;
            const date = document.getElementById('purchaseDate').value;
            const storage = document.getElementById('storageLocation').value;

            if (name && date) {
                alert(`「${name}」を登録しました。\n購入日/期限: ${date}\n保存場所: ${storage}\n(AIによる鮮度予測はバックエンドで行われます)`);
                // In a real app, this data would be sent to the server.
                // The server would then respond with predicted freshness and update the UI.
            } else {
                alert('食材名と購入日/賞味期限を入力してください。');
            }
        }

        // Dummy data for demonstration
        const ingredients = [
            { name: '鶏もも肉', date: '2025-05-25', storage: '冷蔵庫', status: 'critical' },
            { name: '豆腐', date: '2025-05-24', storage: '冷蔵庫', status: 'warning' },
            { name: 'レタス', date: '2025-05-23', storage: '冷蔵庫', status: 'normal' },
        ];

        function displayIngredients() {
            const criticalList = document.getElementById('criticalIngredients');
            criticalList.innerHTML = ''; // Clear previous entries

            ingredients.forEach(item => {
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
                    <p>購入日: ${item.date}</p>
                    <p>保存: ${item.storage}</p>
                `;
                criticalList.appendChild(itemDiv);
            });
        }
        document.addEventListener('DOMContentLoaded', displayIngredients);