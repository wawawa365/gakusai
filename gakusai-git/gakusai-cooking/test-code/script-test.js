document.addEventListener('DOMContentLoaded', () => {
    // --- 設定 ---
    // const API_BASE_URL = '/api/v1'; // ★ 変更点: モックを使うのでコメントアウト
    const POLLING_INTERVAL = 10000;

    // ★ 変更点: モックデータ（ダミーデータ）の定義
    // 動作テスト用に、現在の時刻を基準に予約時刻を設定
    const now = new Date();
    const mockTickets = [
        {
            ticket_id: "mock-001",
            ticket_number: 101,
            status: "COOKING",
            items: [
                { product_id: 1, product_name: "焼きそば", quantity: 2 },
                { product_id: 3, product_name: "フランクフルト", quantity: 1 }
            ],
            // 予約時刻: 10分前（超過）
            reserve_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
            cooking_completed_at: null
        },
        {
            ticket_id: "mock-002",
            ticket_number: 102,
            status: "COOKING",
            items: [
                { product_id: 2, product_name: "たこ焼き", quantity: 1 }
            ],
            // 予約時刻: 3分後（緊急）
            reserve_at: new Date(now.getTime() + 3 * 60 * 1000).toISOString(),
            cooking_completed_at: null
        },
        {
            ticket_id: "mock-003",
            ticket_number: 103,
            status: "COOKING",
            items: [
                { product_id: 4, product_name: "唐揚げ", quantity: 3 }
            ],
            // 予約時刻: 20分後
            reserve_at: new Date(now.getTime() + 20 * 60 * 1000).toISOString(),
            cooking_completed_at: null
        }
    ];


    // --- DOM要素の取得 ---
    const upcomingContainer = document.getElementById('upcoming-orders-container');
    const overdueContainer = document.getElementById('overdue-orders-container');

    // --- API通信関数 ---

    /**
     * COOKING状態のチケットをサーバーから取得する
     * @returns {Promise<Array>} チケットデータの配列
     */
    async function fetchCookingTickets() {
        // ★ 変更点: 実際のAPI呼び出しをコメントアウト
        /*
        try {
            const response = await fetch(`${API_BASE_URL}/tickets?status=COOKING`);
            if (!response.ok) {
                throw new Error(`APIエラー: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('チケットの取得に失敗しました:', error);
            return [];
        }
        */

        // ★ 変更点: 代わりにモックデータを返す
        console.log('[Mock] チケットデータを取得しました。', mockTickets);
        return Promise.resolve(mockTickets); // 非同期処理を模倣
    }

    /**
     * チケットのステータスを更新する
     * @param {string} ticketId 更新するチケットのID
     * @param {string} newStatus 新しいステータス ('READY'など)
     * @returns {Promise<Object|null>} 更新後のチケットデータ、失敗時はnull
     */
    async function patchTicketStatus(ticketId, newStatus) {
        // ★ 変更点: 実際のAPI呼び出しをコメントアウト
        /*
        try {
            const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (!response.ok) {
                throw new Error(`APIエラー: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('チケットの更新に失敗しました:', error);
            alert('チケットの更新に失敗しました。');
            return null;
        }
        */

        // ★ 変更点: 常に成功をシミュレートし、0.5秒の遅延を模倣
        return new Promise(resolve => {
            setTimeout(() => {
                console.log(`[Mock] Ticket ${ticketId} のステータスを ${newStatus} に変更しました。`);
                // 成功したと仮定し、更新後のダミーデータを返す
                const updatedTicket = mockTickets.find(t => t.ticket_id === ticketId);
                if (updatedTicket) {
                    updatedTicket.status = newStatus;
                }
                resolve(updatedTicket || { ticket_id: ticketId, status: newStatus });
            }, 500); // 0.5秒のネットワーク遅延をシミュレート
        });
    }

    // --- UI描画関数 --- (変更なし)

    /**
     * 予約時刻と現在時刻の差を計算して文字列を返す
     * @param {string} reserveAt - 予約時刻 (ISO 8601形式)
     * @returns {string} 表示用の時間文字列
     */
    function getTimeInfoText(reserveAt) {
        const now = new Date();
        const reservedTime = new Date(reserveAt);
        const diffMinutes = Math.round((reservedTime - now) / (1000 * 60));

        if (diffMinutes > 0) {
            return `予約時刻: ${reservedTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} まであと ${diffMinutes} 分`;
        } else {
            return `経過: ${-diffMinutes} 分`;
        }
    }

    /**
     * チケットデータからHTML要素を作成する
     * @param {Object} ticket - チケットデータ
     * @returns {HTMLElement} チケットカードのDOM要素
     */
    function createTicketCard(ticket) {
        const card = document.createElement('div');
        card.className = 'ticket-card';
        card.dataset.ticketId = ticket.ticket_id;

        const now = new Date();
        const reservedTime = new Date(ticket.reserve_at);
        const diffMinutes = (reservedTime - now) / (1000 * 60);
        if (diffMinutes < 0) {
            card.classList.add('is-overdue');
        } else if (diffMinutes <= 5) {
            card.classList.add('is-urgent');
        }

        const itemsList = ticket.items.map(item => `<li>${item.product_name} x ${item.quantity}</li>`).join('');

        card.innerHTML = `
            <div class="ticket-number">${ticket.ticket_number}</div>
            <div class="order-details">
                <ul class="order-items">${itemsList}</ul>
                <div class="time-info">${getTimeInfoText(ticket.reserve_at)}</div>
            </div>
            <button class="action-button complete-btn">調理完了</button>
            <div class="loading-spinner"></div>
        `;

        const completeButton = card.querySelector('.complete-btn');
        completeButton.addEventListener('click', () => handleCompleteCookingClick(ticket.ticket_id, card));
        
        return card;
    }

    /**
     * チケット一覧を画面に描画する
     * @param {Array<Object>} tickets - チケットデータの配列
     */
    function renderTickets(tickets) {
        upcomingContainer.innerHTML = '';
        overdueContainer.innerHTML = '';
        
        const now = new Date();
        
        const upcomingOrders = tickets.filter(t => new Date(t.reserve_at) >= now);
        const overdueOrders = tickets.filter(t => new Date(t.reserve_at) < now);

        upcomingOrders.sort((a, b) => new Date(a.reserve_at) - new Date(b.reserve_at));
        overdueOrders.sort((a, b) => new Date(a.reserve_at) - new Date(b.reserve_at));

        upcomingOrders.forEach(ticket => upcomingContainer.appendChild(createTicketCard(ticket)));
        overdueOrders.forEach(ticket => overdueContainer.appendChild(createTicketCard(ticket)));
    }


    // --- イベントハンドラ --- (変更なし)
    
    let cancellationTimers = {};

    function handleCompleteCookingClick(ticketId, cardElement) {
        if (cardElement.classList.contains('waiting-cancellation')) return;
        
        cardElement.classList.add('waiting-cancellation');
        const button = cardElement.querySelector('.action-button');
        button.textContent = '取り消し';
        button.classList.add('cancel');

        const timerId = setTimeout(async () => {
            cardElement.classList.add('loading');
            button.style.display = 'none';

            const result = await patchTicketStatus(ticketId, 'READY');
            
            cardElement.classList.remove('loading');

            if (result) {
                cardElement.remove();
            } else {
                button.style.display = 'block';
                cardElement.classList.remove('waiting-cancellation');
                button.textContent = '調理完了';
                button.classList.remove('cancel');
            }
            delete cancellationTimers[ticketId];
        }, 5000);

        cancellationTimers[ticketId] = timerId;
    }

    document.body.addEventListener('click', (event) => {
        const button = event.target;
        if (!button.classList.contains('action-button') || !button.classList.contains('cancel')) {
            return;
        }
        
        const card = button.closest('.ticket-card');
        const ticketId = card.dataset.ticketId;
        
        if (cancellationTimers[ticketId]) {
            clearTimeout(cancellationTimers[ticketId]);
            delete cancellationTimers[ticketId];

            card.classList.remove('waiting-cancellation');
            button.textContent = '調理完了';
            button.classList.remove('cancel');
        }
    });


    // --- 初期化処理 --- (変更なし、ただし自動更新はモックではあまり意味がない)
    
    async function initialize() {
        const tickets = await fetchCookingTickets();
        renderTickets(tickets);

        // setIntervalはモックの場合、同じデータを再描画し続けるだけですが、
        // APIが実装された際にはそのまま動作します。
        setInterval(async () => {
            console.log('[Mock] 定期更新を実行します。');
            const latestTickets = await fetchCookingTickets();
            renderTickets(latestTickets);
        }, POLLING_INTERVAL);
    }

    initialize();
});