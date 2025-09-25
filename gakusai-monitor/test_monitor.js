/**
 * �w�Չ��� �ďo�����j�^�[�pJavaScript
 * * �@�\:
 * - ����I�Ƀo�b�N�G���hAPI���Ăяo���A��������(READY)�̃`�P�b�g�����擾����B
 * - �擾�����`�P�b�g�ԍ�����ʂɕ\������B
 * - �\������ԍ����Ȃ��ꍇ�́A�ҋ@���b�Z�[�W��\������B
 * - API�ʐM�Ɏ��s�����ꍇ�́A�G���[���b�Z�[�W��\������B
 */
document.addEventListener('DOMContentLoaded', () => {

/** 
    // --- �ݒ荀�� ---
    // �o�b�N�G���hAPI�̃G���h�|�C���gURL
    const API_ENDPOINT = '/api/board'; 
    // �f�[�^�擾�̃|�[�����O�Ԋu (�~���b�P�ʁB��: 5000 = 5�b)
    const POLLING_INTERVAL = 5000; 
    
    // --- DOM�v�f�̎擾 ---
    // �`�P�b�g�ԍ���\�����邽�߂̃R���e�i�v�f
    const boardContainer = document.getElementById('ticket-board-container');
    // �G���[���b�Z�[�W�Ȃǂ�\�����邽�߂̃X�e�[�^�X�\���v�f
    const statusMessage = document.getElementById('status-message');

*/

    // --- �ݒ荀�� ---
    // API_ENDPOINT�͎g��Ȃ�
    const POLLING_INTERVAL = 5000;
    
    // --- DOM�v�f�̎擾 ---
    const boardContainer = document.getElementById('ticket-board-container');
    const statusMessage = document.getElementById('status-message');

    // ���b�N�f�[�^
    const mockTickets = [
        { "number": "A001", "status": "READY" },
        { "number": "B002", "status": "CALLING" }, // READY�ł͂Ȃ��̂ŕ\������Ȃ�
        { "number": "A003", "status": "READY" },
        { "number": "C004", "status": "READY" }
    ];



    /**
     * �`�P�b�g�ԍ����X�g���󂯎��A��ʂɕ\������֐�
     * @param {Array<Object>} tickets - �`�P�b�g���̔z��B�e�I�u�W�F�N�g�� 'number' �v���p�e�B�������Ƃ����҂���B
     */
    const renderTickets = (tickets) => {
        // �R���e�i����U��ɂ���
        boardContainer.innerHTML = ''; 
        statusMessage.textContent = ''; // �X�e�[�^�X���b�Z�[�W���N���A

        // �\�����ׂ��`�P�b�g���Ȃ��ꍇ�̏���
        if (!tickets || tickets.length === 0) {
            statusMessage.textContent = '�������܂��Ăяo�����̔ԍ��͂���܂���';
            return;
        }
        
        // �`�P�b�g����ʂɒǉ�
        tickets.forEach(ticket => {
            // �v���Ɋ�Â��AREADY��Ԃ̃`�P�b�g�݂̂��t�B���^�����O
            if (ticket.status === 'READY') {
                const ticketElement = document.createElement('div');
                ticketElement.className = 'ticket-number'; // CSS�ŃX�^�C����K�p���邽�߂̃N���X
                ticketElement.textContent = ticket.number; // �`�P�b�g�ԍ���ݒ�
                boardContainer.appendChild(ticketElement);
            }
        });
    };

    /**
     * �o�b�N�G���hAPI����ŐV�̃`�P�b�g�����擾���A��ʂ��X�V����֐�
     */
    const fetchAndUpdateBoard = async () => {
        try {
/**
            const response = await fetch(API_ENDPOINT);

            // HTTP�X�e�[�^�X��200�ԑ�łȂ��ꍇ�̓G���[�Ƃ��Ĉ���
            if (!response.ok) {
                throw new Error(`�T�[�o�[����̉������s���ł�: ${response.status}`);
            }

            const tickets = await response.json();
            renderTickets(tickets);
*/

  // �������ύX�_�I
            // fetch�̑����Promise���g���Ĕ񓯊��ʐM���V�~�����[�g
            const tickets = await new Promise(resolve => {
                setTimeout(() => {
                    resolve(mockTickets);
                }, 100); // �����̒x�����V�~�����[�g
            });

            renderTickets(tickets);
        } catch (error) {
            console.error('�f�[�^�̎擾�Ɏ��s���܂���:', error);
            boardContainer.innerHTML = ''; // �G���[���̓{�[�h���N���A
            statusMessage.textContent = '�X�V�G���[���������܂����B�ڑ����m�F���Ă��������B';
        }
    };

    // --- ���s���� ---
    // �y�[�W�̓ǂݍ��݊������ɏ���f�[�^���擾�E�\��
    fetchAndUpdateBoard(); 

    // �ݒ肳�ꂽ�Ԋu�Œ���I�Ƀf�[�^���擾�E�\��
    setInterval(fetchAndUpdateBoard, POLLING_INTERVAL);
});
