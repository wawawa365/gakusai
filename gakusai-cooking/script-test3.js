
/*
やっぱり調理完了ボタンを押しても反応がありません、イベントデリゲーションを採用し作り直してみてください

度々申し訳ありません。ご指摘の問題、承知いたしました。
前の修正でも解決しなかったとのこと、大変失礼いたしました。ユーザー様からご提案いただいた通り、より堅牢で効率的なイベントデリゲーションという手法を用いて、クリックイベントの処理を全面的に作り直します。

イベントデリゲーションとは？
個々のボタン（子要素）にイベント処理を一つずつ設定するのではなく、それらの親要素（今回は<main>）にイベント処理を一つだけ設定する手法です。親要素が子のイベントをまとめて受け取り、「どのボタンがクリックされたか？」を判断して処理を振り分けます。これにより、コードがシンプルになり、今回のような動的に要素が生成される場面での不具合を未然に防ぐことができます。

script.js (イベントデリゲーション採用版)
以前のコードから以下の点を変更しました。

個別のイベント設定を撤廃: createTicketCard関数内のaddEventListenerと、document.bodyに設定していたaddEventListenerを削除しました。

単一のイベント処理を追加: <main>タグに対して、クリックイベント処理を一つだけ設定しました。

処理の振り分け: この中で、クリックされたのが「調理完了」ボタンか「取り消し」ボタンかをクラス名で判断し、それぞれの処理を実行するようにしました。

お手数ですが、以下の全文をscript.jsに上書きして、動作をご確認ください。
*/

document.addEventListener('DOMContentLoaded', () => {
    // --- 設定 ---
    const POLLING_INTERVAL = 10000;

    // --- モックデータ ---
    const now = new Date();
    const mockTickets = [
        {
            ticket_id: "mock-001",
            ticket_number: 101,
            status: "COOKING",
            items: [ { product_id: 1, product_name: "焼きそば", quantity: 2 }, { product_id: 3, product_name: "フランクフルト", quantity: 1 } ],
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
        }
    ];

    // --- DOM要素の取得 ---
    const mainElement = document.querySelector('main'); // ★ 変更点: イベント処理の親要素として取得
    const upcomingContainer = document.getElementById('upcoming-orders-container');
    const overdueContainer = document.getElementById('overdue-orders-container');

    // --- API通信関数 (モック) ---
    async function fetchCookingTickets() {
        console.log('[Mock] チケットデータを取得しました。');
        return Promise.resolve(mockTickets);
    }
    async function patchTicketStatus(ticketId, newStatus) {
        return new Promise(resolve => {
            setTimeout(() => {
                console.log(`[Mock] Ticket ${ticketId} のステータスを ${newStatus} に変更しました。`);
                const updatedTicket = mockTickets.find(t => t.ticket_id === ticketId);
                if (updatedTicket) updatedTicket.status = newStatus;
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
        // ★ 変更点: ここで個別にイベント設定をしない
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

    // ★ 変更点: イベントデリゲーションを用いた単一のイベントリスナー
    mainElement.addEventListener('click', async (event) => {
        const button = event.target;
        // クリックされたのが action-button でなければ何もしない
        if (!button.classList.contains('action-button')) {
            return;
        }

        const card = button.closest('.ticket-card');
        if (!card) return;

        const ticketId = card.dataset.ticketId;

        // --- 処理の振り分け ---

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
                    card.remove();
                } else {
                    // 失敗した場合はボタンを元に戻す
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
            const latestTickets = await fetchCookingTicekts();
            renderTickets(latestTickets);
        }, POLLING_INTERVAL);
    }

    initialize();
});