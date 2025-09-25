document.addEventListener('DOMContentLoaded', () => {
    // --- 設定 ---
    // ★ 変更点: APIサーバーのURLを設定
    const API_BASE_URL = 'http://localhost:3000';
    const POLLING_INTERVAL = 10000; // 10秒ごとにデータを自動更新

    // ★ 変更点: モックデータを削除

    // --- DOM要素の取得 ---
    const mainElement = document.querySelector('main');
    const upcomingContainer = document.getElementById('upcoming-orders-container');
    const overdueContainer = document.getElementById('overdue-orders-container');

    // --- API通信関数 (本番仕様) ---

    /**
     * COOKING状態のチケットをサーバーから取得する
     * @returns {Promise<Array>} チケットデータの配列
     */
    async function fetchCookingTickets() {
        // ★ 変更点: 実際のAPI呼び出し
        try {
            const response = await fetch(`${API_BASE_URL}/tickets?status=COOKING`);
            if (!response.ok) {
                throw new Error(`APIエラー: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('チケットの取得に失敗しました:', error);
            // 画面の表示を止めないように、エラー時は空配列を返す
            return [];
        }
    }

    /**
     * チケットのステータスを更新する
     * @param {string|number} ticketId 更新するチケットのID
     * @param {string} newStatus 新しいステータス ('READY'など)
     * @returns {Promise<Object|null>} 更新後のチケットデータ、失敗時はnull
     */
    async function patchTicketStatus(ticketId, newStatus) {
        // ★ 変更点: 実際のAPI呼び出し
        try {
            const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: newStatus,
                }),
            });
            if (!response.ok) {
                throw new Error(`APIエラー: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('チケットの更新に失敗しました:', error);
            alert('サーバーとの通信に失敗しました。時間をおいて再度お試しください。');
            return null;
        }
    }

    // --- UI描画関数 ---
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

    function createTicketCard(ticket) {
        const card = document.createElement('div');
        card.className = 'ticket-card';
        // ★ 変更点: ticket_id から id に修正
        card.dataset.ticketId = ticket.id;

        const now = new Date();
        const reservedTime = new Date(ticket.reserve_at);
        const diffMinutes = (reservedTime - now) / (1000 * 60);
        if (diffMinutes < 0) card.classList.add('is-overdue');
        else if (diffMinutes <= 5) card.classList.add('is-urgent');

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
        return card;
    }

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

    // --- イベントハンドラ ---
    let cancellationTimers = {};

    mainElement.addEventListener('click', async (event) => {
        const button = event.target;
        if (!button.classList.contains('action-button')) {
            return;
        }

        const card = button.closest('.ticket-card');
        if (!card) return;

        const ticketId = card.dataset.ticketId;

        console.log('APIに送信する直前のticketId:', ticketId);
        debugger; 

        // (1) 「取り消し」ボタンがクリックされた場合
        if (button.classList.contains('cancel')) {
            if (cancellationTimers[ticketId]) {
                clearTimeout(cancellationTimers[ticketId]);
                delete cancellationTimers[ticketId];

                card.classList.remove('waiting-cancellation');
                button.textContent = '調理完了';
                button.classList.remove('cancel');
            }
        } 
        // (2) 「調理完了」ボタンがクリックされた場合
        else if (button.classList.contains('complete-btn')) {
            if (card.classList.contains('waiting-cancellation')) return;
        
            card.classList.add('waiting-cancellation');
            button.textContent = '取り消し';
            button.classList.add('cancel');
    
            const timerId = setTimeout(async () => {
                card.classList.add('loading');
                button.style.display = 'none';

                const result = await patchTicketStatus(ticketId, 'READY');
                
                card.classList.remove('loading');
    
                if (result) {
                    // API通信が成功したらカードを削除
                    card.remove();
                } else {
                    // 失敗した場合はボタンと表示を元に戻す
                    button.style.display = 'block';
                    card.classList.remove('waiting-cancellation');
                    button.textContent = '調理完了';
                    button.classList.remove('cancel');
                }
                delete cancellationTimers[ticketId];
            }, 5000);
    
            cancellationTimers[ticketId] = timerId;
        }
    });

    // --- 初期化処理 ---
    async function initialize() {
        const tickets = await fetchCookingTickets();
        renderTickets(tickets);
        
        setInterval(async () => {
            // ★ 修正点: 関数名のタイポを修正 (Ticekts -> Tickets)
            const latestTickets = await fetchCookingTickets();
            renderTickets(latestTickets);
        }, POLLING_INTERVAL);
    }

    initialize();
});