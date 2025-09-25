// 対象のボタンにイベントリスナーを設定
const button = document.querySelector('#order-123 .complete-btn');

button.addEventListener('click', () => {
  const card = document.getElementById('order-123');

  // ① ローディング表示を開始
  card.classList.add('is-loading');

  // ② ここでAPI通信を実行する (今回はsetTimeoutで代用)
  setTimeout(() => {
    // ③ 通信成功後、カードを消す
    card.remove(); 
    // (もし失敗した場合は .is-loading を外して元に戻す)
    // card.classList.remove('is-loading');
  }, 2000); // 2秒後に処理完了をシミュレート
});