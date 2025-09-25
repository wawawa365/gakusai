document.addEventListener('DOMContentLoaded', () => {
    // --- 設定 ---
    const POLLING_INTERVAL = 10000;

    // ★ 変更点: ステータスがCOOKING以外のデータも追加
    const now = new Date();
    let mockTickets = [
        {
            ticket_id: "mock-001",
            ticket_number: 101,
            status: "COOKING",
            items: [
                { product_id: 1, product_name: "焼きそば", quantity: 2 },
                { product_id: 3, product_name: "フランクフルト", quantity: 1 }
            ],
            reserve_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        },
        {
            ticket_id: "mock-002",
            ticket_number: 102,
            status: "COOKING",
            items: [ { product_id: 2, product_name: "たこ焼き", quantity: 1 } ],
            reserve_at: new Date(now.getTime() + 3 * 60 * 1000).toISOString(),
        },
        {
            ticket_id: "mock-003",
            ticket_number: 103,
            status: "COOKING",
            items: [ { product_id: 4, product_name: "唐揚げ", quantity: 3 } ],
            reserve_at: new Date(now.getTime() + 20 * 60 * 1000).toISOString(),
        },
        { // このデータは調理画面には表示されない
            ticket_id: "mock-004",
            ticket_number: 99,
            status: "READY",
            items: [ { product_id: 5, product_name: "ポテト", quantity: 1 } ],
            reserve_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        }
    ];

    // --- DOM要素の取得 ---
    const mainElement = document.querySelector('main');
    const upcomingContainer = document.getElementById('upcoming-orders-container');
    const overdueContainer = document.getElementById('overdue-orders-container');

    // --- API通信（モック）関数 ---

    async function fetchCookingTickets() {
        console.log('[Mock] COOKING状態のチケットを取得します。');
        // ★ 変更点: COOKING状態のチケットのみをフィルタリングして返す
        const cookingTickets = mockTickets.filter(ticket => ticket.status === 'COOKING');
        return Promise.resolve(cookingTickets);
    }

    async function patchTicketStatus(ticketId, newStatus) {
        return new Promise(resolve => {
            setTimeout(() => {
                console.log(`[Mock] Ticket ${ticketId} のステータスを ${newStatus} に変更します。`);
                // mockTickets配列の状態も更新して、次回の取得時に反映されるようにする
                const ticketToUpdate = mockTickets.find(t => t.ticket_id === ticketId);
                if (ticketToUpdate) {
                    ticketToUpdate.status = newStatus;
                }
                resolve(ticketToUpdate);
            }, 500);
        });
    }

    // --- UI描画関数 --- (変更なし)
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


    // --- ★ 変更点: イベント処理をイベントデリゲーションに修正 ---
    
    // 各カードに紐づくタイマーIDを管理するオブジェクト
    let cancellationTimers = {};

    mainElement.addEventListener('click', (event) => {
        const button = event.target.closest('.action-button');
        // action-buttonクラスを持つ要素以外がクリックされた場合は何もしない
        if (!button) {
            return;
        }

        const card = button.closest('.ticket-card');
        const ticketId = card.dataset.ticketId;

        // 「取り消し」ボタンとして機能する場合
        if (card.classList.contains('waiting-cancellation')) {
            if (cancellationTimers[ticketId]) {
                clearTimeout(cancellationTimers[ticketId]); // タイマーをキャンセル
                delete cancellationTimers[ticketId];

                // カードとボタンを元の状態に戻す
                card.classList.remove('waiting-cancellation');
                button.textContent = '調理完了';
                button.classList.remove('cancel');
            }
        }
        // 「調理完了」ボタンとして機能する場合
        else {
            card.classList.add('waiting-cancellation');
            button.textContent = '取り消し';
            button.classList.add('cancel');

            // 5秒後にAPIを叩くタイマーをセット
            const timerId = setTimeout(async () => {
                card.classList.add('loading');
                button.style.display = 'none';

                const result = await patchTicketStatus(ticketId, 'READY');
                
                card.classList.remove('loading');

                if (result) {
                    card.remove(); // 成功したらカードを消す
                } else {
                    // 失敗したら元の状態に戻す
                    button.style.display = 'block';
                    card.classList.remove('waiting-cancellation');
                    button.textContent = '調理完了';
                    button.classList.remove('cancel');
                    alert('チケットの更新に失敗しました。');
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
            console.log('[Mock] 定期更新を実行します。');
            const latestTickets = await fetchCookingTickets();
            renderTickets(latestTickets);
        }, POLLING_INTERVAL);
    }

    initialize();
});