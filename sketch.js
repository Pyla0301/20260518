let video;
let handPose;
let hands = [];

// 遊戲狀態與控制變數
let gameState = 0; // 0: 等待開始, 1: AI 預測中, 2: 猜拳結果
let fistCount = 0;
let prevRightGesture = '';
let aiGesture = '';
let rpsOptions = ['剪刀', '石頭', '布'];
let resultText = '';

function preload() {
  // 載入 ml5.js 的 handPose 模型
  handPose = ml5.handPose();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.hide(); // 隱藏預設的 HTML 影片元素
  
  // 啟動手部偵測，並將結果傳遞給 gotHands 函式
  handPose.detectStart(video, gotHands);
}

function gotHands(results) {
  // 儲存偵測到的手部資訊
  hands = results;
}

function draw() {
  background('#7D7ABC');
  
  // 計算全螢幕的 50% 寬高
  let drawWidth = windowWidth * 0.5;
  let drawHeight = windowHeight * 0.5;
  
  push();
  translate(windowWidth / 2, windowHeight / 2); // 將原點移至畫布中心
  scale(-1, 1); // X 軸縮放 -1，達成左右顛倒（鏡像）
  imageMode(CENTER); // 讓圖片以中心點繪製
  image(video, 0, 0, drawWidth, drawHeight);
  
  // 繪製手部關節與標籤
  drawHands(drawWidth, drawHeight);
  
  pop();

  // 遊戲狀態與猜拳邏輯
  let rightGesture = '';
  let userRPS = '';
  
  for (let i = 0; i < hands.length; i++) {
    let g = detectGesture(hands[i].keypoints);
    if (hands[i].handedness === 'Right') rightGesture = g;
    if (g === '剪刀' || g === '石頭' || g === '布') userRPS = g;
  }

  if (gameState === 0) {
    // 等待兩次握拳
    if (rightGesture === '石頭' && prevRightGesture !== '石頭') {
      fistCount++;
      if (fistCount >= 2) {
        gameState = 1;
        fistCount = 0;
      }
    }
  } else if (gameState === 1) {
    // AI 預測中 (快速閃爍選項)
    if (frameCount % 5 === 0) aiGesture = random(rpsOptions);
    
    // 比出「六」結束預測
    if (rightGesture === '六' && prevRightGesture !== '六') {
      gameState = 2;
      aiGesture = random(rpsOptions); // 鎖定最終出拳
    }
  } else if (gameState === 2) {
    // 結算勝負
    if (userRPS !== '') {
      if (userRPS === aiGesture) resultText = '平手！';
      else if (
        (userRPS === '剪刀' && aiGesture === '布') ||
        (userRPS === '石頭' && aiGesture === '剪刀') ||
        (userRPS === '布' && aiGesture === '石頭')
      ) resultText = '你贏了！';
      else resultText = '你輸了！';
    } else {
      resultText = '等待你出拳...';
    }
    
    // 再次握拳兩次可以重新開始
    if (rightGesture === '石頭' && prevRightGesture !== '石頭') {
      fistCount++;
      if (fistCount >= 2) {
        gameState = 1;
        fistCount = 0;
      }
    }
  }
  prevRightGesture = rightGesture;

  // 繪製遊戲 UI
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  if (gameState === 0) {
    textSize(40);
    text("請用右手連續握拳兩次開始遊戲", windowWidth / 2, windowHeight * 0.1);
    textSize(30);
    text(`目前握拳次數: ${fistCount} / 2`, windowWidth / 2, windowHeight * 0.18);
  } else if (gameState === 1) {
    textSize(40);
    text(`AI 預測出拳中... ${aiGesture}`, windowWidth / 2, windowHeight * 0.1);
    textSize(30);
    text("右手比出「六」(大拇指與小拇指) 結束預測並猜拳", windowWidth / 2, windowHeight * 0.18);
  } else if (gameState === 2) {
    if (resultText === '你贏了！') fill(50, 255, 50);
    else if (resultText === '你輸了！') fill(255, 50, 50);
    else fill(255, 255, 50);
    
    textSize(100);
    text(resultText, windowWidth / 2, windowHeight * 0.15);

    fill(255);
    textSize(40);
    text(`AI 出: ${aiGesture}  |  你出: ${userRPS || '?'}`, windowWidth / 2, windowHeight * 0.28);

    textSize(24);
    text("再次用右手連續握拳兩次可重新開始", windowWidth / 2, windowHeight * 0.9);
  }
}

function drawHands(drawWidth, drawHeight) {
  // 確保攝影機已載入寬高資訊
  if (video.width === 0 || video.height === 0) return;

  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    
    // 繪製手指與手部的 21 個節點
    for (let j = 0; j < hand.keypoints.length; j++) {
      let keypoint = hand.keypoints[j];
      
      // 將模型回傳的原始座標，轉換為符合目前畫布縮放的座標
      let mappedX = (keypoint.x / video.width) * drawWidth - (drawWidth / 2);
      let mappedY = (keypoint.y / video.height) * drawHeight - (drawHeight / 2);
      
      fill(0, 255, 0);
      noStroke();
      circle(mappedX, mappedY, 10);
    }
    
    // 取得手腕 (keypoints[0]) 座標來顯示左右手標籤
    let wrist = hand.keypoints[0];
    let wristX = (wrist.x / video.width) * drawWidth - (drawWidth / 2);
    let wristY = (wrist.y / video.height) * drawHeight - (drawHeight / 2);
    
    // 辨識剪刀、石頭、布
    let gesture = detectGesture(hand.keypoints);
    
    push();
    translate(wristX, wristY);
    scale(-1, 1); // 因為外部畫布做過鏡像，這裡要把文字翻轉回來，才不會變成反字
    fill(255, 255, 0);
    textSize(24);
    textAlign(CENTER, BOTTOM);
    text(hand.handedness + ' - ' + gesture, 0, -20); // 顯示左右手標籤與手勢結果
    pop();
  }
}

function detectGesture(keypoints) {
  let wrist = keypoints[0];
  
  // 新增拇指判斷 (指尖到手腕距離 > 關節到手腕距離)
  let isThumbOpen = dist(wrist.x, wrist.y, keypoints[4].x, keypoints[4].y) > dist(wrist.x, wrist.y, keypoints[2].x, keypoints[2].y);
  
  // 判斷各手指是否伸直 (指尖到手腕距離 > 關節到手腕距離)
  let isIndexOpen = dist(wrist.x, wrist.y, keypoints[8].x, keypoints[8].y) > dist(wrist.x, wrist.y, keypoints[6].x, keypoints[6].y);
  let isMiddleOpen = dist(wrist.x, wrist.y, keypoints[12].x, keypoints[12].y) > dist(wrist.x, wrist.y, keypoints[10].x, keypoints[10].y);
  let isRingOpen = dist(wrist.x, wrist.y, keypoints[16].x, keypoints[16].y) > dist(wrist.x, wrist.y, keypoints[14].x, keypoints[14].y);
  let isPinkyOpen = dist(wrist.x, wrist.y, keypoints[20].x, keypoints[20].y) > dist(wrist.x, wrist.y, keypoints[18].x, keypoints[18].y);

  if (isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen) return '布';
  if (isIndexOpen && isMiddleOpen && !isRingOpen && !isPinkyOpen) return '剪刀';
  if (isThumbOpen && !isIndexOpen && !isMiddleOpen && !isRingOpen && isPinkyOpen) return '六';
  if (!isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) return '石頭'; // 拇指開闔皆可視為石頭
  
  return '未知';
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
