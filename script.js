Array.prototype.last = function () {
  return this[this.length - 1];
};

Math.sinus = function (deg) {
  return Math.sin((deg / 180) * Math.PI);
};

let state = "waiting";
let lastTS;
let hX, hY, sceneOff;
let plats = [], sticks = [], trees = [];
let score = 0;
const cW = 375, cH = 375;
const pH = 100, hDist = 10, padX = 100, pAreaSize = 10;
const bgSpeed = 0.2, h1BaseH = 100, h1Amp = 10, h1Stretch = 1;
const h2BaseH = 70, h2Amp = 20, h2Stretch = 0.5;
const stretchSpd = 4, turnSpd = 4, walkSpd = 4, transSpd = 2, fallSpd = 2;
const hW = 29, hH = 42;

const canvas = document.getElementById("game");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

const introEl = document.getElementById("introduction");
const perfectEl = document.getElementById("perfect");
const restartBtn = document.getElementById("restart");
const scoreEl = document.getElementById("score");

resetGame();

function resetGame() {
  state = "waiting";
  lastTS = undefined;
  sceneOff = 0;
  score = 0;

  introEl.style.opacity = 1;
  perfectEl.style.opacity = 0;
  restartBtn.style.display = "none";
  scoreEl.innerText = score;

  plats = [{ x: 50, w: 50 }];
  for (let i = 0; i < 4; i++) generatePlat();
  sticks = [{ x: plats[0].x + plats[0].w, len: 0, rot: 0 }];
  trees = [];
  for (let i = 0; i < 9; i++) generateTree();

  hX = plats[0].x + plats[0].w - hDist;
  hY = 0;

  draw();
}

function generateTree() {
  const minGap = 30, maxGap = 150;
  const lastTree = trees.last();
  let furthestX = lastTree ? lastTree.x : 0;
  const x = furthestX + minGap + Math.floor(Math.random() * (maxGap - minGap));
  const colors = ["#6D8821", "#8FAC34", "#98B333"];
  const color = colors[Math.floor(Math.random() * 3)];
  trees.push({ x, color });
}



function generatePlat() {
  const minGap = 40, maxGap = 200, minW = 20, maxW = 100;
  const lastPlat = plats.last();
  let furthestX = lastPlat.x + lastPlat.w;
  const x = furthestX + minGap + Math.floor(Math.random() * (maxGap - minGap));
  const w = minW + Math.floor(Math.random() * (maxW - minW));
  plats.push({ x, w });
}

resetGame();

window.addEventListener("keydown", function (e) {
  if (e.key == " ") {
      e.preventDefault();
      resetGame();
  }
});

window.addEventListener("mousedown", function () {
  if (state == "waiting") {
      lastTS = undefined;
      introEl.style.opacity = 0;
      state = "stretching";
      window.requestAnimationFrame(animate);
  }
});

window.addEventListener("mouseup", function () {
  if (state == "stretching") {
      state = "turning";
  }
});

window.addEventListener("resize", function () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
});

window.requestAnimationFrame(animate);

function animate(ts) {
  if (!lastTS) {
      lastTS = ts;
      window.requestAnimationFrame(animate);
      return;
  }

  switch (state) {
      case "waiting":
          return;
      case "stretching":
          sticks.last().len += (ts - lastTS) / stretchSpd;
          break;
      case "turning":
          sticks.last().rot += (ts - lastTS) / turnSpd;
          if (sticks.last().rot > 90) {
              sticks.last().rot = 90;
              const [nextPlat, perfectHit] = checkPlatHit();
              if (nextPlat) {
                  score += perfectHit ? 2 : 1;
                  scoreEl.innerText = score;
                  if (perfectHit) {
                      perfectEl.style.opacity = 1;
                      setTimeout(() => (perfectEl.style.opacity = 0), 1000);
                  }
                  generatePlat();
                  generateTree();
                  generateTree();
              }
              state = "walking";
          }
          break;
      case "walking":
          hX += (ts - lastTS) / walkSpd;
          const [nextPlatWalk] = checkPlatHit();
          if (nextPlatWalk) {
              const maxHX = nextPlatWalk.x + nextPlatWalk.w - hDist;
              if (hX > maxHX) {
                  hX = maxHX;
                  state = "transitioning";
              }
          } else {
              const maxHX = sticks.last().x + sticks.last().len + hW;
              if (hX > maxHX) {
                  hX = maxHX;
                  state = "falling";
              }
          }
          break;
      case "transitioning":
          sceneOff += (ts - lastTS) / transSpd;
          const [nextPlatTrans] = checkPlatHit();
          if (sceneOff > nextPlatTrans.x + nextPlatTrans.w - padX) {
              sticks.push({ x: nextPlatTrans.x + nextPlatTrans.w, len: 0, rot: 0 });
              state = "waiting";
          }
          break;
      case "falling":
          if (sticks.last().rot < 180) sticks.last().rot += (ts - lastTS) / turnSpd;
          hY += (ts - lastTS) / fallSpd;
          const maxHY = pH + 100 + (window.innerHeight - cH) / 2;
          if (hY > maxHY) {
              restartBtn.style.display = "block";
              return;
          }
          break;
      default:
          throw Error("Invalid state");
  }

  draw();
  window.requestAnimationFrame(animate);
  lastTS = ts;
}

function checkPlatHit() {
  if (sticks.last().rot != 90) throw Error(`Stick is ${sticks.last().rot}°`);
  const stickFarX = sticks.last().x + sticks.last().len;
  const hitPlat = plats.find(plat => plat.x < stickFarX && stickFarX < plat.x + plat.w);
  if (hitPlat && hitPlat.x + hitPlat.w / 2 - pAreaSize / 2 < stickFarX && stickFarX < hitPlat.x + hitPlat.w / 2 + pAreaSize / 2) {
      return [hitPlat, true];
  }
  return [hitPlat, false];
}

function draw() {
  ctx.save();
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  drawBg();
  ctx.translate((window.innerWidth - cW) / 2 - sceneOff, (window.innerHeight - cH) / 2);
  drawPlats();
  drawHero();
  drawSticks();
  ctx.restore();
}

restartBtn.addEventListener("click", function (e) {
  e.preventDefault();
  resetGame();
  restartBtn.style.display = "none";
});

function drawPlats() {
  plats.forEach(({ x, w }) => {
      ctx.fillStyle = "black";
      ctx.fillRect(x, cH - pH, w, pH + (window.innerHeight - cH) / 2);
      if (sticks.last().x < x) {
          ctx.fillStyle = "red";
          ctx.fillRect(x + w / 2 - pAreaSize / 2, cH - pH, pAreaSize, pAreaSize);
      }
  });
}

function drawHero() {
  const heroImg = new Image();
  heroImg.src = 'mario.png';
  ctx.save();
  ctx.translate(hX - hW / 2, hY + cH - pH - hH / 2);
  ctx.drawImage(heroImg, -hW / 2, -hH / 2, hW, hH);
  ctx.restore();
}

function drawSticks() {
  sticks.forEach(stick => {
      ctx.save();
      ctx.translate(stick.x, cH - pH);
      ctx.rotate((Math.PI / 180) * stick.rot);
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "black"; 
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -stick.len);
      ctx.stroke();
      ctx.restore();
  });
}

function drawBg() {
  const grad = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
  grad.addColorStop(0, "#BBD691");
  grad.addColorStop(1, "#FEF1E1");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  drawHill(h1BaseH, h1Amp, h1Stretch, "#95C629");
  drawHill(h2BaseH, h2Amp, h2Stretch, "#659F1C");
  trees.forEach(tree => drawTree(tree.x, tree.color));
}

function drawHill(baseH, amp, stretch, color) {
  ctx.beginPath();
  ctx.moveTo(0, window.innerHeight);
  ctx.lineTo(0, getHillY(0, baseH, amp, stretch));
  for (let i = 0; i < window.innerWidth; i++) {
      ctx.lineTo(i, getHillY(i, baseH, amp, stretch));
  }
  ctx.lineTo(window.innerWidth, window.innerHeight);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawTree(x, color) {
  ctx.save();
  ctx.translate((-sceneOff * bgSpeed + x) * h1Stretch, getTreeY(x, h1BaseH, h1Amp));
  const trunkH = 5, trunkW = 2, crownH = 25, crownW = 10;
  ctx.fillStyle = "#7D833C";
  ctx.fillRect(-trunkW / 2, -trunkH, trunkW, trunkH);
  ctx.beginPath();
  ctx.moveTo(-crownW / 2, -trunkH);
  ctx.lineTo(0, -(trunkH + crownH));
  ctx.lineTo(crownW / 2, -trunkH);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}
function drawBg() {
  const grad = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
  grad.addColorStop(0, "#BBD691");
  grad.addColorStop(1, "#FEF1E1");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  drawSun();

 
  drawMountains();

  drawHill(h1BaseH, h1Amp, h1Stretch, "#95C629");
  drawHill(h2BaseH, h2Amp, h2Stretch, "#659F1C");
  trees.forEach(tree => drawTree(tree.x, tree.color));
}

function drawSun() {
  const sunX = 50; 
  const sunY = 50; 
  const sunRadius = 30; 
  const rayLength = 50; 
  const rayCount = 12; 

 
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2, false);
  ctx.fillStyle = "yellow";
  ctx.fill();
  ctx.closePath();

  
  for (let i = 0; i < rayCount; i++) {
    const angle = (i * Math.PI * 2) / rayCount; 
    const startX = sunX + Math.cos(angle) * sunRadius;
    const startY = sunY + Math.sin(angle) * sunRadius; 
    const endX = sunX + Math.cos(angle) * (sunRadius + rayLength); 
    const endY = sunY + Math.sin(angle) * (sunRadius + rayLength); 

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.lineWidth = 2; 
    ctx.strokeStyle = "yellow"; 
    ctx.stroke();
    ctx.closePath();
  }
}

function drawMountains() {
  ctx.fillStyle = "#8B4513"; 
  ctx.beginPath();
  ctx.moveTo(0, window.innerHeight - 100); 
  ctx.lineTo(100, window.innerHeight - 200); 
  ctx.lineTo(200, window.innerHeight - 100); 
  ctx.lineTo(300, window.innerHeight - 250); 
  ctx.lineTo(400, window.innerHeight - 100); 
  ctx.lineTo(500, window.innerHeight - 200); 
  ctx.lineTo(600, window.innerHeight - 100); 
  ctx.lineTo(700, window.innerHeight - 150); 
  ctx.lineTo(800, window.innerHeight - 100); 
  ctx.lineTo(window.innerWidth, window.innerHeight - 100); 
  ctx.lineTo(window.innerWidth, window.innerHeight); 
  ctx.lineTo(0, window.innerHeight); 
  ctx.fill();
  ctx.closePath();
}
function getHillY(winX, baseH, amp, stretch) {
  const sineBaseY = window.innerHeight - baseH;
  return Math.sinus((sceneOff * bgSpeed + winX) * stretch) * amp + sineBaseY;
}

function getTreeY(x, baseH, amp) {
  const sineBaseY = window.innerHeight - baseH;
  return Math.sinus(x) * amp + sineBaseY;
}