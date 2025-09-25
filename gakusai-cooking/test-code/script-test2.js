/*調理完了ボタンを押しても何も反応がありません。
ご指摘ありがとうございます。大変失礼いたしました。
「調理完了」ボタンを押しても反応がない原因は、ボタンクリックの処理（イベントリスナー）が競合していたためです。

具体的には、「取り消し」ボタンのためにdocument.bodyに設定したイベント処理が、「調理完了」ボタンのクリックまで対象にしてしまい、本来の処理を止めてしまっていました。

修正内容
script.js ファイルのイベントハンドラ部分を以下のように修正することで、問題が解決します。「取り消し」ボタンの判定ロジックをより厳密にしました。

以下に修正済みのscript.jsの全文を記載します。お手数ですが、こちらの内容に差し替えてお試しください。
*/

document.addEventListener('DOMContentLoaded', () => {
    // --- 設定 ---
    // const API_BASE_URL = '/api/v1'; // モックを使うのでコメントアウト
    const POLLING_INTERVAL = 10000;

    // モックデータ（ダミーデータ）の定義
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
            reserve_at: new Date(now.getTime() + 20 * 60 * 1000).toISOString(),
            cooking_completed_at: null
        }
    ];

    // --- DOM要素の取得 ---
    const upcomingContainer = document.getElementById('upcoming-orders-container');
    const overdueContainer = document.getElementById('overdue-orders-container');

    // --- API通信関数 (モック) ---
    async function fetchCookingTickets() {
        console.log('[Mock] チケットデータを取得しました。', mockTickets);
        return Promise.resolve(mockTickets);
    }

    async function patchTicketStatus(ticketId, newStatus) {
        return new Promise(resolve => {
            setTimeout(() => {
                console.log(`[Mock] Ticket ${ticketId} のステータスを ${newStatus} に変更しました。`);
                const updatedTicket = mockTickets.find(t => t.ticket_id === ticketId);
                if (updatedTicket) {
                    updatedTicket.status = newStatus;
                }
                resolve(updatedTicket || { ticket_id: ticketId, status: newStatus });
            }, 500);
        });
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

        // ★ 変更点：ここでは「調理完了」ボタンにのみイベントを設定します
        const completeButton = card.querySelector('.complete-btn');
        completeButton.addEventListener('click', () => handleCompleteCookingClick(ticket.ticket_id, card));
        
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
    
    // ★ 変更点： ここの判定条件を修正しました
    // このイベントリスナーは「取り消し」ボタンが押された時だけ動作するようにします
    document.body.addEventListener('click', (event) => {
        const button = event.target;
        
        // クリックされた要素が「取り消し」ボタンでなければ、何もしない
        if (!button.classList.contains('cancel')) {
            return;
        }
        
        const card = button.closest('.ticket-card');
        if (!card) return; // ボタンがカード内にない場合は何もしない
        
        const ticketId = card.dataset.ticketId;
        
        if (cancellationTimers[ticketId]) {
            clearTimeout(cancellationTimers[ticketId]);
            delete cancellationTimers[ticketId];

            card.classList.remove('waiting-cancellation');
            button.textContent = '調理完了';
            button.classList.remove('cancel');
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