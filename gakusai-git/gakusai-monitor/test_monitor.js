/**
 * 学祭屋台 呼出しモニター用JavaScript
 * * 機能:
 * - 定期的にバックエンドAPIを呼び出し、準備完了(READY)のチケット情報を取得する。
 * - 取得したチケット番号を画面に表示する。
 * - 表示する番号がない場合は、待機メッセージを表示する。
 * - API通信に失敗した場合は、エラーメッセージを表示する。
 */
document.addEventListener('DOMContentLoaded', () => {

/** 
    // --- 設定項目 ---
    // バックエンドAPIのエンドポイントURL
    const API_ENDPOINT = '/api/board'; 
    // データ取得のポーリング間隔 (ミリ秒単位。例: 5000 = 5秒)
    const POLLING_INTERVAL = 5000; 
    
    // --- DOM要素の取得 ---
    // チケット番号を表示するためのコンテナ要素
    const boardContainer = document.getElementById('ticket-board-container');
    // エラーメッセージなどを表示するためのステータス表示要素
    const statusMessage = document.getElementById('status-message');

*/

    // --- 設定項目 ---
    // API_ENDPOINTは使わない
    const POLLING_INTERVAL = 5000;
    
    // --- DOM要素の取得 ---
    const boardContainer = document.getElementById('ticket-board-container');
    const statusMessage = document.getElementById('status-message');

    // モックデータ
    const mockTickets = [
        { "number": "A001", "status": "READY" },
        { "number": "B002", "status": "CALLING" }, // READYではないので表示されない
        { "number": "A003", "status": "READY" },
        { "number": "C004", "status": "READY" }
    ];



    /**
     * チケット番号リストを受け取り、画面に表示する関数
     * @param {Array<Object>} tickets - チケット情報の配列。各オブジェクトは 'number' プロパティを持つことを期待する。
     */
    const renderTickets = (tickets) => {
        // コンテナを一旦空にする
        boardContainer.innerHTML = ''; 
        statusMessage.textContent = ''; // ステータスメッセージをクリア

        // 表示すべきチケットがない場合の処理
        if (!tickets || tickets.length === 0) {
            statusMessage.textContent = 'ただいまお呼び出し中の番号はありません';
            return;
        }
        
        // チケットを画面に追加
        tickets.forEach(ticket => {
            // 要件に基づき、READY状態のチケットのみをフィルタリング
            if (ticket.status === 'READY') {
                const ticketElement = document.createElement('div');
                ticketElement.className = 'ticket-number'; // CSSでスタイルを適用するためのクラス
                ticketElement.textContent = ticket.number; // チケット番号を設定
                boardContainer.appendChild(ticketElement);
            }
        });
    };

    /**
     * バックエンドAPIから最新のチケット情報を取得し、画面を更新する関数
     */
    const fetchAndUpdateBoard = async () => {
        try {
/**
            const response = await fetch(API_ENDPOINT);

            // HTTPステータスが200番台でない場合はエラーとして扱う
            if (!response.ok) {
                throw new Error(`サーバーからの応答が不正です: ${response.status}`);
            }

            const tickets = await response.json();
            renderTickets(tickets);
*/

  // ここが変更点！
            // fetchの代わりにPromiseを使って非同期通信をシミュレート
            const tickets = await new Promise(resolve => {
                setTimeout(() => {
                    resolve(mockTickets);
                }, 100); // 応答の遅延をシミュレート
            });

            renderTickets(tickets);
        } catch (error) {
            console.error('データの取得に失敗しました:', error);
            boardContainer.innerHTML = ''; // エラー時はボードをクリア
            statusMessage.textContent = '更新エラーが発生しました。接続を確認してください。';
        }
    };

    // --- 実行処理 ---
    // ページの読み込み完了時に初回データを取得・表示
    fetchAndUpdateBoard(); 

    // 設定された間隔で定期的にデータを取得・表示
    setInterval(fetchAndUpdateBoard, POLLING_INTERVAL);
});
