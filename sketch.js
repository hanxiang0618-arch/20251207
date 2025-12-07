let idleSheet, walkSheet, jumpSheet, attackSheet, projectileSheet;
let idleAnim = [], walkAnim = [], jumpAnim = [], attackAnim = [], projectileAnim = [];

// 待機動畫的屬性
const idleSpriteWidth = 851;
const idleSpriteHeight = 212;
const idleFramesCount = 8;

// 走路動畫的屬性
const walkSpriteWidth = 1107;
const walkSpriteHeight = 197;
const walkFramesCount = 8;

// 跳躍動畫的屬性
const jumpSpriteWidth = 1776;
const jumpSpriteHeight = 188;
const jumpFramesCount = 13;

// 攻擊動畫的屬性
const attackSpriteWidth = 1822;
const attackSpriteHeight = 164;
const attackFramesCount = 7;

// 投射物(氣功彈)動畫的屬性
const projectileSpriteWidth = 740;
const projectileSpriteHeight = 19; // 您的描述有誤，根據圖片應為 19
const projectileFramesCount = 5;

// 角色狀態變數
let charX, charY;
let speed = 5;
let isWalking = false;
let facing = 1; // 1 代表朝右, -1 代表朝左
let isAttacking = false;
let attackFrame = 0;

// 物理變數
let velocityY = 0;
let gravity = 0.6;
let jumpForce = -15;
let isJumping = false;
let groundY;

// 投射物管理
let projectiles = [];

// Use preload() to load external files like images before setup() runs.
function preload() {
  // Ensure the path to your image is correct relative to your index.html file.
  idleSheet = loadImage('1/stop_2/stop_2_1.png');
  walkSheet = loadImage('1/walk/walk_all.png');
  jumpSheet = loadImage('1/jump/jump_all.png');
  attackSheet = loadImage('1/push/push_all.png');
  projectileSheet = loadImage('1/tooi/tool_all.png');
}

function setup() {
  // Create a canvas that fills the entire browser window.
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);

  // 初始化角色位置在畫面中央
  groundY = height / 2;
  charX = width / 2;
  charY = groundY;

  // 裁切待機動畫
  let idleFrameWidth = idleSpriteWidth / idleFramesCount;
  for (let i = 0; i < idleFramesCount; i++) {
    let frame = idleSheet.get(i * idleFrameWidth, 0, idleFrameWidth, idleSpriteHeight);
    idleAnim.push(frame);
  }

  // 裁切走路動畫
  let walkFrameWidth = walkSpriteWidth / walkFramesCount;
  for (let i = 0; i < walkFramesCount; i++) {
    let frame = walkSheet.get(i * walkFrameWidth, 0, walkFrameWidth, walkSpriteHeight);
    walkAnim.push(frame);
  }

  // 裁切跳躍動畫
  let jumpFrameWidth = jumpSpriteWidth / jumpFramesCount;
  for (let i = 0; i < jumpFramesCount; i++) {
    let frame = jumpSheet.get(i * jumpFrameWidth, 0, jumpFrameWidth, jumpSpriteHeight);
    jumpAnim.push(frame);
  }

  // 裁切攻擊動畫
  let attackFrameWidth = attackSpriteWidth / attackFramesCount;
  for (let i = 0; i < attackFramesCount; i++) {
    let frame = attackSheet.get(i * attackFrameWidth, 0, attackFrameWidth, attackSpriteHeight);
    attackAnim.push(frame);
  }

  // 裁切投射物動畫
  let projectileFrameWidth = projectileSpriteWidth / projectileFramesCount;
  for (let i = 0; i < projectileFramesCount; i++) {
    let frame = projectileSheet.get(i * projectileFrameWidth, 0, projectileFrameWidth, projectileSpriteHeight);
    projectileAnim.push(frame);
  }
}

function draw() {
  // Set the background color to beige.
  background('#F5F5DC');

  // --- 物理更新 ---
  if (isJumping || isAttacking) { // 攻擊時也套用重力，避免浮空
    velocityY += gravity;
    charY += velocityY;

    if (charY >= groundY) {
      charY = groundY;
      isJumping = false;
      velocityY = 0;
    }
  }

  // --- 邏輯更新 ---
  // 只有在不攻擊、不跳躍時才能走路
  if (!isAttacking && !isJumping) {
    if (keyIsDown(RIGHT_ARROW)) {
    charX += speed;
    isWalking = true;
    facing = 1;
    } else if (keyIsDown(LEFT_ARROW)) {
    charX -= speed;
    isWalking = true;
    facing = -1;
    } else {
    isWalking = false;
    }
  }

  // --- 繪圖 ---
  push(); // 儲存當前的繪圖狀態
  translate(charX, charY); // 將畫布原點移動到角色位置
  scale(facing, 1); // 根據 facing 的值翻轉 X 軸

  // 根據角色狀態選擇要播放的動畫
  if (isAttacking) {
    // 播放一次攻擊動畫
    image(attackAnim[attackFrame], 0, 0);
    // 每隔幾幀更新一次攻擊動畫的畫格
    if (frameCount % 4 === 0) {
      attackFrame++;
    }
    // 動畫結束後
    if (attackFrame >= attackFramesCount) {
      isAttacking = false;
      attackFrame = 0;
      spawnProjectile();
    }
  } else if (isJumping) {
    // 簡單的循環播放跳躍動畫
    let currentFrame = floor((frameCount / 5) % jumpFramesCount);
    image(jumpAnim[currentFrame], 0, 0);
  } else if (isWalking) {
    let currentFrame = floor((frameCount / 4) % walkFramesCount);
    image(walkAnim[currentFrame], 0, 0);
  } else {
    let currentFrame = floor((frameCount / 5) % idleFramesCount);
    image(idleAnim[currentFrame], 0, 0);
  }
  pop(); // 恢復到 push() 之前的繪圖狀態

  // --- 更新與繪製投射物 ---
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let p = projectiles[i];
    p.x += p.speed * p.facing;

    push();
    translate(p.x, p.y);
    scale(p.facing, 1);
    let currentFrame = floor((frameCount / 3) % projectileFramesCount);
    image(projectileAnim[currentFrame], 0, 0);
    pop();

    // 如果投射物飛出畫面，則將其從陣列中移除
    if (p.x > width + 50 || p.x < -50) {
      projectiles.splice(i, 1);
    }
  }
}

// 使用 keyPressed 處理單次按鍵事件
function keyPressed() {
  // 按下向上鍵且角色在地面上時觸發跳躍
  if (keyCode === UP_ARROW && !isJumping && !isAttacking) {
    isJumping = true;
    velocityY = jumpForce;
  }

  // 按下空白鍵且角色在地面上時觸發攻擊
  if (key === ' ' && !isJumping && !isAttacking) {
    isAttacking = true;
    isWalking = false; // 攻擊時停止走路
    attackFrame = 0; // 重置攻擊動畫
  }
}

function spawnProjectile() {
  let p = {
    x: charX + (facing * 60), // 在角色前方產生
    y: charY - 20, // 調整Y軸位置
    facing: facing,
    speed: 12
  };
  projectiles.push(p);
}

// This function is called automatically whenever the browser window is resized.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
