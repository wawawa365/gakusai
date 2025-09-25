document.addEventListener('DOMContentLoaded', () => {
    // --- �ݒ� ---
    const POLLING_INTERVAL = 10000;

    // �� �ύX�_: �X�e�[�^�X��COOKING�ȊO�̃f�[�^���ǉ�
    const now = new Date();
    let mockTickets = [
        {
            ticket_id: "mock-001",
            ticket_number: 101,
            status: "COOKING",
            items: [
                { product_id: 1, product_name: "�Ă�����", quantity: 2 },
                { product_id: 3, product_name: "�t�����N�t���g", quantity: 1 }
            ],
            reserve_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        },
        {
            ticket_id: "mock-002",
            ticket_number: 102,
            status: "COOKING",
            items: [ { product_id: 2, product_name: "�����Ă�", quantity: 1 } ],
            reserve_at: new Date(now.getTime() + 3 * 60 * 1000).toISOString(),
        },
        {
            ticket_id: "mock-003",
            ticket_number: 103,
            status: "COOKING",
            items: [ { product_id: 4, product_name: "���g��", quantity: 3 } ],
            reserve_at: new Date(now.getTime() + 20 * 60 * 1000).toISOString(),
        },
        { // ���̃f�[�^�͒�����ʂɂ͕\������Ȃ�
            ticket_id: "mock-004",
            ticket_number: 99,
            status: "READY",
            items: [ { product_id: 5, product_name: "�|�e�g", quantity: 1 } ],
            reserve_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        }
    ];

    // --- DOM�v�f�̎擾 ---
    const mainElement = document.querySelector('main');
    const upcomingContainer = document.getElementById('upcoming-orders-container');
    const overdueContainer = document.getElementById('overdue-orders-container');

    // --- API�ʐM�i���b�N�j�֐� ---

    async function fetchCookingTickets() {
        console.log('[Mock] COOKING��Ԃ̃`�P�b�g���擾���܂��B');
        // �� �ύX�_: COOKING��Ԃ̃`�P�b�g�݂̂��t�B���^�����O���ĕԂ�
        const cookingTickets = mockTickets.filter(ticket => ticket.status === 'COOKING');
        return Promise.resolve(cookingTickets);
    }

    async function patchTicketStatus(ticketId, newStatus) {
        return new Promise(resolve => {
            setTimeout(() => {
                console.log(`[Mock] Ticket ${ticketId} �̃X�e�[�^�X�� ${newStatus} �ɕύX���܂��B`);
                // mockTickets�z��̏�Ԃ��X�V���āA����̎擾���ɔ��f�����悤�ɂ���
                const ticketToUpdate = mockTickets.find(t => t.ticket_id === ticketId);
                if (ticketToUpdate) {
                    ticketToUpdate.status = newStatus;
                }
                resolve(ticketToUpdate);
            }, 500);
        });
    }

    // --- UI�`��֐� --- (�ύX�Ȃ�)
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


    // --- �� �ύX�_: �C�x���g�������C�x���g�f���Q�[�V�����ɏC�� ---
    
    // �e�J�[�h�ɕR�Â��^�C�}�[ID���Ǘ�����I�u�W�F�N�g
    let cancellationTimers = {};

    mainElement.addEventListener('click', (event) => {
        const button = event.target.closest('.action-button');
        // action-button�N���X�����v�f�ȊO���N���b�N���ꂽ�ꍇ�͉������Ȃ�
        if (!button) {
            return;
        }

        const card = button.closest('.ticket-card');
        const ticketId = card.dataset.ticketId;

        // �u�������v�{�^���Ƃ��ċ@�\����ꍇ
        if (card.classList.contains('waiting-cancellation')) {
            if (cancellationTimers[ticketId]) {
                clearTimeout(cancellationTimers[ticketId]); // �^�C�}�[���L�����Z��
                delete cancellationTimers[ticketId];

                // �J�[�h�ƃ{�^�������̏�Ԃɖ߂�
                card.classList.remove('waiting-cancellation');
                button.textContent = '��������';
                button.classList.remove('cancel');
            }
        }
        // �u���������v�{�^���Ƃ��ċ@�\����ꍇ
        else {
            card.classList.add('waiting-cancellation');
            button.textContent = '������';
            button.classList.add('cancel');

            // 5�b���API��@���^�C�}�[���Z�b�g
            const timerId = setTimeout(async () => {
                card.classList.add('loading');
                button.style.display = 'none';

                const result = await patchTicketStatus(ticketId, 'READY');
                
                card.classList.remove('loading');

                if (result) {
                    card.remove(); // ����������J�[�h������
                } else {
                    // ���s�����猳�̏�Ԃɖ߂�
                    button.style.display = 'block';
                    card.classList.remove('waiting-cancellation');
                    button.textContent = '��������';
                    button.classList.remove('cancel');
                    alert('�`�P�b�g�̍X�V�Ɏ��s���܂����B');
                }
                delete cancellationTimers[ticketId];
            }, 5000);

            cancellationTimers[ticketId] = timerId;
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