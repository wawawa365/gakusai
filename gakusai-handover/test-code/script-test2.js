/*���������{�^���������Ă���������������܂���B
���w�E���肪�Ƃ��������܂��B��ώ��炢�����܂����B
�u���������v�{�^���������Ă��������Ȃ������́A�{�^���N���b�N�̏����i�C�x���g���X�i�[�j���������Ă������߂ł��B

��̓I�ɂ́A�u�������v�{�^���̂��߂�document.body�ɐݒ肵���C�x���g�������A�u���������v�{�^���̃N���b�N�܂őΏۂɂ��Ă��܂��A�{���̏������~�߂Ă��܂��Ă��܂����B

�C�����e
script.js �t�@�C���̃C�x���g�n���h���������ȉ��̂悤�ɏC�����邱�ƂŁA��肪�������܂��B�u�������v�{�^���̔��胍�W�b�N����茵���ɂ��܂����B

�ȉ��ɏC���ς݂�script.js�̑S�����L�ڂ��܂��B���萔�ł����A������̓��e�ɍ����ւ��Ă��������������B
*/

document.addEventListener('DOMContentLoaded', () => {
    // --- �ݒ� ---
    // const API_BASE_URL = '/api/v1'; // ���b�N���g���̂ŃR�����g�A�E�g
    const POLLING_INTERVAL = 10000;

    // ���b�N�f�[�^�i�_�~�[�f�[�^�j�̒�`
    const now = new Date();
    const mockTickets = [
        {
            ticket_id: "mock-001",
            ticket_number: 101,
            status: "COOKING",
            items: [
                { product_id: 1, product_name: "�Ă�����", quantity: 2 },
                { product_id: 3, product_name: "�t�����N�t���g", quantity: 1 }
            ],
            reserve_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
            cooking_completed_at: null
        },
        {
            ticket_id: "mock-002",
            ticket_number: 102,
            status: "COOKING",
            items: [
                { product_id: 2, product_name: "�����Ă�", quantity: 1 }
            ],
            reserve_at: new Date(now.getTime() + 3 * 60 * 1000).toISOString(),
            cooking_completed_at: null
        },
        {
            ticket_id: "mock-003",
            ticket_number: 103,
            status: "COOKING",
            items: [
                { product_id: 4, product_name: "���g��", quantity: 3 }
            ],
            reserve_at: new Date(now.getTime() + 20 * 60 * 1000).toISOString(),
            cooking_completed_at: null
        }
    ];

    // --- DOM�v�f�̎擾 ---
    const upcomingContainer = document.getElementById('upcoming-orders-container');
    const overdueContainer = document.getElementById('overdue-orders-container');

    // --- API�ʐM�֐� (���b�N) ---
    async function fetchCookingTickets() {
        console.log('[Mock] �`�P�b�g�f�[�^���擾���܂����B', mockTickets);
        return Promise.resolve(mockTickets);
    }

    async function patchTicketStatus(ticketId, newStatus) {
        return new Promise(resolve => {
            setTimeout(() => {
                console.log(`[Mock] Ticket ${ticketId} �̃X�e�[�^�X�� ${newStatus} �ɕύX���܂����B`);
                const updatedTicket = mockTickets.find(t => t.ticket_id === ticketId);
                if (updatedTicket) {
                    updatedTicket.status = newStatus;
                }
                resolve(updatedTicket || { ticket_id: ticketId, status: newStatus });
            }, 500);
        });
    }

    // --- UI�`��֐� ---
    function getTimeInfoText(reserveAt) {
        const now = new Date();
        const reservedTime = new Date(reserveAt);
        const diffMinutes = Math.round((reservedTime - now) / (1000 * 60));

        if (diffMinutes > 0) {
            return `�\�񎞍�: ${reservedTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} �܂ł��� ${diffMinutes} ��`;
        } else {
            return `�o��: ${-diffMinutes} ��`;
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
            <button class="action-button complete-btn">��������</button>
            <div class="loading-spinner"></div>
        `;

        // �� �ύX�_�F�����ł́u���������v�{�^���ɂ̂݃C�x���g��ݒ肵�܂�
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

    // --- �C�x���g�n���h�� ---
    let cancellationTimers = {};

    function handleCompleteCookingClick(ticketId, cardElement) {
        if (cardElement.classList.contains('waiting-cancellation')) return;
        
        cardElement.classList.add('waiting-cancellation');
        const button = cardElement.querySelector('.action-button');
        button.textContent = '������';
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
                button.textContent = '��������';
                button.classList.remove('cancel');
            }
            delete cancellationTimers[ticketId];
        }, 5000);

        cancellationTimers[ticketId] = timerId;
    }
    
    // �� �ύX�_�F �����̔���������C�����܂���
    // ���̃C�x���g���X�i�[�́u�������v�{�^���������ꂽ���������삷��悤�ɂ��܂�
    document.body.addEventListener('click', (event) => {
        const button = event.target;
        
        // �N���b�N���ꂽ�v�f���u�������v�{�^���łȂ���΁A�������Ȃ�
        if (!button.classList.contains('cancel')) {
            return;
        }
        
        const card = button.closest('.ticket-card');
        if (!card) return; // �{�^�����J�[�h���ɂȂ��ꍇ�͉������Ȃ�
        
        const ticketId = card.dataset.ticketId;
        
        if (cancellationTimers[ticketId]) {
            clearTimeout(cancellationTimers[ticketId]);
            delete cancellationTimers[ticketId];

            card.classList.remove('waiting-cancellation');
            button.textContent = '��������';
            button.classList.remove('cancel');
        }
    });

    // --- ���������� ---
    async function initialize() {
        const tickets = await fetchCookingTickets();
        renderTickets(tickets);

        setInterval(async () => {
            console.log('[Mock] ����X�V�����s���܂��B');
            const latestTickets = await fetchCookingTickets();
            renderTickets(latestTickets);
        }, POLLING_INTERVAL);
    }

    initialize();
});