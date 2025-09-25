document.addEventListener('DOMContentLoaded', () => {

    // -------------------------------------------------------------
    // ������ ���Ȃ��̊��ɍ��킹��API��URL���C�����Ă������� ������
    // -------------------------------------------------------------
    const baseURL = 'http://localhost:3000'; // ��: Spring Boot�̃f�t�H���g�|�[�g
    // -------------------------------------------------------------

    const errorMessageElement = document.getElementById('error-message');
    const allToggles = document.querySelectorAll('.availability-toggle');

    /**
     * ���݂̏��i�̒񋟏󋵂�API����擾���A�X�C�b�`�̏�Ԃɔ��f������
     */
    const syncInitialState = async () => {
        try {
            const response = await fetch(`${baseURL}/items`);
            if (!response.ok) {
                throw new Error(`API����̃f�[�^�擾�Ɏ��s (HTTP: ${response.status})`);
            }
            const items = await response.json();

            // �擾�����f�[�^�����ƂɁA�e�X�C�b�`��ON/OFF��؂�ւ���
            allToggles.forEach(toggle => {
                const itemId = toggle.dataset.itemId;
                const targetItem = items.find(item => item.itemId.toString() === itemId);
                if (targetItem) {
                    toggle.checked = targetItem.available;
                }
            });

        } catch (error) {
            console.error('������Ԃ̓����Ɏ��s:', error);
            showError('���i�̏�Ԃ��T�[�o�[����擾�ł��܂���ł����B');
        }
    };

    /**
     * �X�C�b�`�����삳�ꂽ�Ƃ��ɁAAPI���Ăяo���ď�Ԃ��X�V����
     * @param {Event} event 
     */
    const handleAvailabilityChange = async (event) => {
        const toggle = event.target;
        const itemId = toggle.dataset.itemId;
        const newAvailability = toggle.checked;

        try {
            const response = await fetch(`${baseURL}/items/${itemId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ available: newAvailability }),
            });

            if (!response.ok) {
                throw new Error(`API�ł̍X�V�Ɏ��s (HTTP: ${response.status})`);
            }
            
            console.log(`ID:${itemId} �̏�Ԃ� ${newAvailability} �ɍX�V���܂����B`);
            showError(''); // ����������G���[���b�Z�[�W���N���A

        } catch (error) {
            console.error('�X�V�G���[:', error);
            showError('�T�[�o�[�Ƃ̒ʐM�Ɏ��s���A��Ԃ��X�V�ł��܂���ł����B');
            // �X�V�Ɏ��s�����̂ŁA�X�C�b�`�̏�Ԃ����ɖ߂�
            toggle.checked = !newAvailability;
        }
    };
    
    /**
     * �G���[���b�Z�[�W��\������
     * @param {string} message 
     */
    const showError = (message) => {
        errorMessageElement.textContent = message;
    };

    // --- ���C������ ---
    // 1. �ŏ��ɑS���i�̌��݂̏�Ԃ�API����擾���ĉ�ʂɔ��f
    syncInitialState();

    // 2. �e�X�C�b�`�����삳�ꂽ��handleAvailabilityChange�֐����Ăяo���悤�ݒ�
    allToggles.forEach(toggle => {
        toggle.addEventListener('change', handleAvailabilityChange);
    });

    setInterval(syncInitialState, 10000); 
});