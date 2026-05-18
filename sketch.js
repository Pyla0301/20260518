let video;
let handPose;
let hands = [];

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
  ``
  push();
  translate(windowWidth / 2, windowHeight / 2); // 將原點移至畫布中心
  scale(-1, 1); // X 軸縮放 -1，達成左右顛倒（鏡像）
  imageMode(CENTER); // 讓圖片以中心點繪製
  image(video, 0, 0, drawWidth, drawHeight);
  
  // 繪製手部關節與標籤
  drawHands(drawWidth, drawHeight);
  
  pop();
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
    
    push();
    translate(wristX, wristY);
    scale(-1, 1); // 因為外部畫布做過鏡像，這裡要把文字翻轉回來，才不會變成反字
    fill(255, 255, 0);
    textSize(24);
    textAlign(CENTER, BOTTOM);
    text(hand.handedness, 0, -20); // 顯示 'Left' 或 'Right'
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
