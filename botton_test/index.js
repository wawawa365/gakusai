// �Ώۂ̃{�^���ɃC�x���g���X�i�[��ݒ�
const button = document.querySelector('#order-123 .complete-btn');

button.addEventListener('click', () => {
  const card = document.getElementById('order-123');

  // �@ ���[�f�B���O�\�����J�n
  card.classList.add('is-loading');

  // �A ������API�ʐM�����s���� (�����setTimeout�ő�p)
  setTimeout(() => {
    // �B �ʐM������A�J�[�h������
    card.remove(); 
    // (�������s�����ꍇ�� .is-loading ���O���Č��ɖ߂�)
    // card.classList.remove('is-loading');
  }, 2000); // 2�b��ɏ����������V�~�����[�g
});