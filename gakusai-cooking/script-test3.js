
/*
����ς蒲�������{�^���������Ă�����������܂���A�C�x���g�f���Q�[�V�������̗p����蒼���Ă݂Ă�������

�x�X�\���󂠂�܂���B���w�E�̖��A���m�������܂����B
�O�̏C���ł��������Ȃ������Ƃ̂��ƁA��ώ��炢�����܂����B���[�U�[�l���炲��Ă����������ʂ�A��茘�S�Ō����I�ȃC�x���g�f���Q�[�V�����Ƃ�����@��p���āA�N���b�N�C�x���g�̏�����S�ʓI�ɍ�蒼���܂��B

�C�x���g�f���Q�[�V�����Ƃ́H
�X�̃{�^���i�q�v�f�j�ɃC�x���g����������ݒ肷��̂ł͂Ȃ��A�����̐e�v�f�i�����<main>�j�ɃC�x���g������������ݒ肷���@�ł��B�e�v�f���q�̃C�x���g���܂Ƃ߂Ď󂯎��A�u�ǂ̃{�^�����N���b�N���ꂽ���H�v�𔻒f���ď�����U�蕪���܂��B����ɂ��A�R�[�h���V���v���ɂȂ�A����̂悤�ȓ��I�ɗv�f������������ʂł̕s��𖢑R�ɖh�����Ƃ��ł��܂��B

script.js (�C�x���g�f���Q�[�V�����̗p��)
�ȑO�̃R�[�h����ȉ��̓_��ύX���܂����B

�ʂ̃C�x���g�ݒ��P�p: createTicketCard�֐�����addEventListener�ƁAdocument.body�ɐݒ肵�Ă���addEventListener���폜���܂����B

�P��̃C�x���g������ǉ�: <main>�^�O�ɑ΂��āA�N���b�N�C�x���g������������ݒ肵�܂����B

�����̐U�蕪��: ���̒��ŁA�N���b�N���ꂽ�̂��u���������v�{�^�����u�������v�{�^�������N���X���Ŕ��f���A���ꂼ��̏��������s����悤�ɂ��܂����B

���萔�ł����A�ȉ��̑S����script.js�ɏ㏑�����āA��������m�F���������B
*/

document.addEventListener('DOMContentLoaded', () => {
    // --- �ݒ� ---
    const POLLING_INTERVAL = 10000;

    // --- ���b�N�f�[�^ ---
    const now = new Date();
    const mockTickets = [
        {
            ticket_id: "mock-001",
            ticket_number: 101,
            status: "COOKING",
            items: [ { product_id: 1, product_name: "�Ă�����", quantity: 2 }, { product_id: 3, product_name: "�t�����N�t���g", quantity: 1 } ],
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
        }
    ];

    // --- DOM�v�f�̎擾 ---
    const mainElement = document.querySelector('main'); // �� �ύX�_: �C�x���g�����̐e�v�f�Ƃ��Ď擾
    const upcomingContainer = document.getElementById('upcoming-orders-container');
    const overdueContainer = document.getElementById('overdue-orders-container');

    // --- API�ʐM�֐� (���b�N) ---
    async function fetchCookingTickets() {
        console.log('[Mock] �`�P�b�g�f�[�^���擾���܂����B');
        return Promise.resolve(mockTickets);
    }
    async function patchTicketStatus(ticketId, newStatus) {
        return new Promise(resolve => {
            setTimeout(() => {
                console.log(`[Mock] Ticket ${ticketId} �̃X�e�[�^�X�� ${newStatus} �ɕύX���܂����B`);
                const updatedTicket = mockTickets.find(t => t.ticket_id === ticketId);
                if (updatedTicket) updatedTicket.status = newStatus;
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
        if (diffMinutes < 0) card.classList.add('is-overdue');
        else if (diffMinutes <= 5) card.classList.add('is-urgent');

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
        // �� �ύX�_: �����ŌʂɃC�x���g�ݒ�����Ȃ�
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

    // �� �ύX�_: �C�x���g�f���Q�[�V������p�����P��̃C�x���g���X�i�[
    mainElement.addEventListener('click', async (event) => {
        const button = event.target;
        // �N���b�N���ꂽ�̂� action-button �łȂ���Ή������Ȃ�
        if (!button.classList.contains('action-button')) {
            return;
        }

        const card = button.closest('.ticket-card');
        if (!card) return;

        const ticketId = card.dataset.ticketId;

        // --- �����̐U�蕪�� ---

        // (1) �u�������v�{�^�����N���b�N���ꂽ�ꍇ
        if (button.classList.contains('cancel')) {
            if (cancellationTimers[ticketId]) {
                clearTimeout(cancellationTimers[ticketId]);
                delete cancellationTimers[ticketId];

                card.classList.remove('waiting-cancellation');
                button.textContent = '��������';
                button.classList.remove('cancel');
            }
        } 
        // (2) �u���������v�{�^�����N���b�N���ꂽ�ꍇ
        else if (button.classList.contains('complete-btn')) {
            if (card.classList.contains('waiting-cancellation')) return;
        
            card.classList.add('waiting-cancellation');
            button.textContent = '������';
            button.classList.add('cancel');
    
            const timerId = setTimeout(async () => {
                card.classList.add('loading');
                button.style.display = 'none';
    
                const result = await patchTicketStatus(ticketId, 'READY');
                
                card.classList.remove('loading');
    
                if (result) {
                    card.remove();
                } else {
                    // ���s�����ꍇ�̓{�^�������ɖ߂�
                    button.style.display = 'block';
                    card.classList.remove('waiting-cancellation');
                    button.textContent = '��������';
                    button.classList.remove('cancel');
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
            const latestTickets = await fetchCookingTicekts();
            renderTickets(latestTickets);
        }, POLLING_INTERVAL);
    }

    initialize();
});