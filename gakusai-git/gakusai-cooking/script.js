document.addEventListener('DOMContentLoaded', () => {
    // --- �ݒ� ---
    const API_BASE_URL = '/api/v1'; // API�̃x�[�XURL�i���ɍ��킹�ĕύX�j
    const POLLING_INTERVAL = 10000; // 10�b���ƂɃf�[�^�������X�V

    // --- DOM�v�f�̎擾 ---
    const upcomingContainer = document.getElementById('upcoming-orders-container');
    const overdueContainer = document.getElementById('overdue-orders-container');

    // --- API�ʐM�֐� ---

    /**
     * COOKING��Ԃ̃`�P�b�g���T�[�o�[����擾����
     * @returns {Promise<Array>} �`�P�b�g�f�[�^�̔z��
     */
    async function fetchCookingTickets() {
        try {
            const response = await fetch(`${API_BASE_URL}/tickets?status=COOKING`);
            if (!response.ok) {
                throw new Error(`API�G���[: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('�`�P�b�g�̎擾�Ɏ��s���܂���:', error);
            // ���ۂɂ͉�ʏ�ɃG���[���b�Z�[�W��\����������e��
            return []; // �G���[���͋�z���Ԃ�
        }
    }

    /**
     * �`�P�b�g�̃X�e�[�^�X���X�V����
     * @param {string} ticketId �X�V����`�P�b�g��ID
     * @param {string} newStatus �V�����X�e�[�^�X ('READY'�Ȃ�)
     * @returns {Promise<Object|null>} �X�V��̃`�P�b�g�f�[�^�A���s����null
     */
    async function patchTicketStatus(ticketId, newStatus) {
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
            alert('�`�P�b�g�̍X�V�Ɏ��s���܂����B'); // [cite: 241]
            return null;
        }
    }

    // --- UI�`��֐� ---

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
            return `�o��: ${-diffMinutes} ��`; // [cite: 218]
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

        // �\�񎞍��ɉ����ăN���X��ǉ� 
        const now = new Date();
        const reservedTime = new Date(ticket.reserve_at);
        const diffMinutes = (reservedTime - now) / (1000 * 60);
        if (diffMinutes < 0) {
            card.classList.add('is-overdue');
        } else if (diffMinutes <= 5) {
            card.classList.add('is-urgent');
        }

        // �������e�̃��X�g���쐬
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
        // �R���e�i���N���A
        upcomingContainer.innerHTML = '';
        overdueContainer.innerHTML = '';
        
        const now = new Date();
        
        // �\�񎞍��������̂��̂Ɖߋ��̂��̂ŐU�蕪���� [cite: 219]
        const upcomingOrders = tickets.filter(t => new Date(t.reserve_at) >= now);
        const overdueOrders = tickets.filter(t => new Date(t.reserve_at) < now);

        // �\�񎞍����߂����Ƀ\�[�g [cite: 222]
        upcomingOrders.sort((a, b) => new Date(a.reserve_at) - new Date(b.reserve_at));
        // �\�񎞍����Â����Ƀ\�[�g [cite: 222]
        overdueOrders.sort((a, b) => new Date(a.reserve_at) - new Date(b.reserve_at));

        upcomingOrders.forEach(ticket => upcomingContainer.appendChild(createTicketCard(ticket)));
        overdueOrders.forEach(ticket => overdueContainer.appendChild(createTicketCard(ticket)));
    }


    // --- �C�x���g�n���h�� ---
    
    // �e�J�[�h�ɕR�Â��^�C�}�[ID���Ǘ�����I�u�W�F�N�g
    let cancellationTimers = {};

    /**
     * �u���������v�{�^���N���b�N���̏���
     * @param {string} ticketId - �`�P�b�gID
     * @param {HTMLElement} cardElement - �Ή�����J�[�h�v�f
     */
    function handleCompleteCookingClick(ticketId, cardElement) {
        // ���łɎ������҂���ԂȂ牽�����Ȃ�
        if (cardElement.classList.contains('waiting-cancellation')) return;
        
        cardElement.classList.add('waiting-cancellation'); // [cite: 225]
        const button = cardElement.querySelector('.action-button');
        button.textContent = '������'; // [cite: 226]
        button.classList.add('cancel'); // [cite: 227]

        // 5�b���API��@���^�C�}�[���Z�b�g 
        const timerId = setTimeout(async () => {
            // �^�C�}�[�����΂�����A���[�f�B���O�\���ɐ؂�ւ� [cite: 236]
            cardElement.classList.add('loading');
            button.style.display = 'none'; // �{�^�����B��

            const result = await patchTicketStatus(ticketId, 'READY');
            
            cardElement.classList.remove('loading'); // ���[�f�B���O���� [cite: 240]

            if (result) {
                // API�ʐM�������A�J�[�h����ʂ���폜 [cite: 235]
                cardElement.remove();
            } else {
                // API�ʐM���s���A�J�[�h�����̏�Ԃɖ߂� [cite: 240]
                button.style.display = 'block'; // �{�^�����ĕ\��
                cardElement.classList.remove('waiting-cancellation');
                button.textContent = '��������';
                button.classList.remove('cancel');
            }
            delete cancellationTimers[ticketId];
        }, 5000);

        cancellationTimers[ticketId] = timerId;
    }

    /**
     * �u�������v�{�^���N���b�N���̏����i�C�x���g�Ϗ��𗘗p�j
     */
    document.body.addEventListener('click', (event) => {
        const button = event.target;
        if (!button.classList.contains('action-button') || !button.classList.contains('cancel')) {
            return;
        }
        
        const card = button.closest('.ticket-card');
        const ticketId = card.dataset.ticketId;
        
        if (cancellationTimers[ticketId]) {
            clearTimeout(cancellationTimers[ticketId]); // �^�C�}�[���L�����Z�� [cite: 230]
            delete cancellationTimers[ticketId];

            // �J�[�h�ƃ{�^�������̏�Ԃɖ߂� [cite: 231]
            card.classList.remove('waiting-cancellation');
            button.textContent = '��������';
            button.classList.remove('cancel');
        }
    });


    // --- ���������� ---
    
    async function initialize() {
        const tickets = await fetchCookingTickets();
        renderTickets(tickets);

        // ����I�Ƀf�[�^���X�V
        setInterval(async () => {
            const latestTickets = await fetchCookingTickets();
            renderTickets(latestTickets);
        }, POLLING_INTERVAL);
    }

    initialize();
});