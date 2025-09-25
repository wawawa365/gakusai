document.addEventListener('DOMContentLoaded', () => {
    // --- �ݒ� ---
    // const API_BASE_URL = '/api/v1'; // �� �ύX�_: ���b�N���g���̂ŃR�����g�A�E�g
    const POLLING_INTERVAL = 10000;

    // �� �ύX�_: ���b�N�f�[�^�i�_�~�[�f�[�^�j�̒�`
    // ����e�X�g�p�ɁA���݂̎�������ɗ\�񎞍���ݒ�
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
            // �\�񎞍�: 10���O�i���߁j
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
            // �\�񎞍�: 3����i�ً}�j
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
            // �\�񎞍�: 20����
            reserve_at: new Date(now.getTime() + 20 * 60 * 1000).toISOString(),
            cooking_completed_at: null
        }
    ];


    // --- DOM�v�f�̎擾 ---
    const upcomingContainer = document.getElementById('upcoming-orders-container');
    const overdueContainer = document.getElementById('overdue-orders-container');

    // --- API�ʐM�֐� ---

    /**
     * COOKING��Ԃ̃`�P�b�g���T�[�o�[����擾����
     * @returns {Promise<Array>} �`�P�b�g�f�[�^�̔z��
     */
    async function fetchCookingTickets() {
        // �� �ύX�_: ���ۂ�API�Ăяo�����R�����g�A�E�g
        /*
        try {
            const response = await fetch(`${API_BASE_URL}/tickets?status=COOKING`);
            if (!response.ok) {
                throw new Error(`API�G���[: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('�`�P�b�g�̎擾�Ɏ��s���܂���:', error);
            return [];
        }
        */

        // �� �ύX�_: ����Ƀ��b�N�f�[�^��Ԃ�
        console.log('[Mock] �`�P�b�g�f�[�^���擾���܂����B', mockTickets);
        return Promise.resolve(mockTickets); // �񓯊�������͕�
    }

    /**
     * �`�P�b�g�̃X�e�[�^�X���X�V����
     * @param {string} ticketId �X�V����`�P�b�g��ID
     * @param {string} newStatus �V�����X�e�[�^�X ('READY'�Ȃ�)
     * @returns {Promise<Object|null>} �X�V��̃`�P�b�g�f�[�^�A���s����null
     */
    async function patchTicketStatus(ticketId, newStatus) {
        // �� �ύX�_: ���ۂ�API�Ăяo�����R�����g�A�E�g
        /*
        try {
            const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (!response.ok) {
                throw new Error(`API�G���[: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('�`�P�b�g�̍X�V�Ɏ��s���܂���:', error);
            alert('�`�P�b�g�̍X�V�Ɏ��s���܂����B');
            return null;
        }
        */

        // �� �ύX�_: ��ɐ������V�~�����[�g���A0.5�b�̒x����͕�
        return new Promise(resolve => {
            setTimeout(() => {
                console.log(`[Mock] Ticket ${ticketId} �̃X�e�[�^�X�� ${newStatus} �ɕύX���܂����B`);
                // ���������Ɖ��肵�A�X�V��̃_�~�[�f�[�^��Ԃ�
                const updatedTicket = mockTickets.find(t => t.ticket_id === ticketId);
                if (updatedTicket) {
                    updatedTicket.status = newStatus;
                }
                resolve(updatedTicket || { ticket_id: ticketId, status: newStatus });
            }, 500); // 0.5�b�̃l�b�g���[�N�x�����V�~�����[�g
        });
    }

    // --- UI�`��֐� --- (�ύX�Ȃ�)

    /**
     * �\�񎞍��ƌ��ݎ����̍����v�Z���ĕ������Ԃ�
     * @param {string} reserveAt - �\�񎞍� (ISO 8601�`��)
     * @returns {string} �\���p�̎��ԕ�����
     */
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

    /**
     * �`�P�b�g�f�[�^����HTML�v�f���쐬����
     * @param {Object} ticket - �`�P�b�g�f�[�^
     * @returns {HTMLElement} �`�P�b�g�J�[�h��DOM�v�f
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
            <button class="action-button complete-btn">��������</button>
            <div class="loading-spinner"></div>
        `;

        const completeButton = card.querySelector('.complete-btn');
        completeButton.addEventListener('click', () => handleCompleteCookingClick(ticket.ticket_id, card));
        
        return card;
    }

    /**
     * �`�P�b�g�ꗗ����ʂɕ`�悷��
     * @param {Array<Object>} tickets - �`�P�b�g�f�[�^�̔z��
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


    // --- �C�x���g�n���h�� --- (�ύX�Ȃ�)
    
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
            button.textContent = '��������';
            button.classList.remove('cancel');
        }
    });


    // --- ���������� --- (�ύX�Ȃ��A�����������X�V�̓��b�N�ł͂��܂�Ӗ����Ȃ�)
    
    async function initialize() {
        const tickets = await fetchCookingTickets();
        renderTickets(tickets);

        // setInterval�̓��b�N�̏ꍇ�A�����f�[�^���ĕ`�悵�����邾���ł����A
        // API���������ꂽ�ۂɂ͂��̂܂ܓ��삵�܂��B
        setInterval(async () => {
            console.log('[Mock] ����X�V�����s���܂��B');
            const latestTickets = await fetchCookingTickets();
            renderTickets(latestTickets);
        }, POLLING_INTERVAL);
    }

    initialize();
});