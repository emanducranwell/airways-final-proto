let garamondItalic = null;
let mergeOne = null;
let logoMain;
let logoBike;
let logoSearch;
let logoMark;
let mapMain;
let cigImg;

async function setup() {
  createCanvas(320, 700); // increased by 20 to keep everything on canvas
  noLoop();

  logoMain = await loadImage('assets/Airways-Main.png');
  logoBike = await loadImage('assets/Bike.png');
  logoSearch = await loadImage('assets/Search.png');
  logoMark = await loadImage('assets/Mark.png');
  mapMain = await loadImage('assets/map2.png');
  cigImg = await loadImage('assets/Cig.png');

  try {
    const f1 = new FontFace('GaramondItalic', 'url(assets/Garamond-Italic.ttf)');
    const f2 = new FontFace('MergeOne', 'url(assets/MergeOne-Regular.ttf)');

    await Promise.all([f1.load(), f2.load()]).then(([loaded1, loaded2]) => {
      document.fonts.add(loaded1);
      document.fonts.add(loaded2);
      garamondItalic = 'GaramondItalic';
      mergeOne = 'MergeOne';
      console.log('Both fonts loaded');
    });
  } catch (err) {
    console.error('Font load error:', err);
    garamondItalic = 'Georgia';
    mergeOne = 'Arial';
  }

  redraw();
}

function draw() {
  background(240);

  drawRoundRect(0, 10, 320, 650, 26, '#000000'); // +20

  // ── Top bar ────────────────────────────────────── (unchanged)
  drawRoundRect(10, 20, 300, 45, 26, '#1a1a1a');
  stroke('#DA7927'); strokeWeight(1.5); noFill();
  line(275, 37, 290, 37);
  line(275, 42, 290, 42);
  line(275, 47, 290, 47);
  noStroke();

  if (logoMain) {
    let logoW = 80;
    let logoH = logoW * (logoMain.height / logoMain.width);
    image(logoMain, (width - logoW) / 2, 17 + (52 - logoH) / 2, logoW, logoH);
  }

  if (logoSearch) {
    let sz = 18;
    image(logoSearch, 22, 20 + (45 - sz) / 2, 25, sz);
  }

  // ── Route panel ────────────────────────────────── (unchanged)
  drawRoundRect(10, 74, 300, 100, 22, '#1a1a1a');

  drawCircle(10, 84, 14, '#1a1a1a');
  fill('#ffffff'); noStroke();
  textFont(mergeOne); textSize(12); textAlign(CENTER, CENTER);
  text('∧', 10, 83);

  noFill(); stroke('#DA7927'); strokeWeight(3);
  ellipse(65, 124, 68, 68);
  noStroke();
  fill('#aaaaaa'); textFont(mergeOne); textSize(9); textAlign(CENTER, CENTER);
  text('PM 2.5', 65, 117);
  fill('#DA7927'); textSize(17);
  text('78%', 65, 131);

  drawRoundRect(118, 90, 180, 32, 16, '#111111');
  fill('#DA7927'); textFont(garamondItalic); textSize(13); textAlign(LEFT, CENTER);
  text('Start', 130, 106);
  fill('#666666'); textFont(mergeOne); textSize(12);
  text('›', 190, 106);
  fill('#CADB35'); textSize(12);
  text('Peckham Rye', 200, 106);

  drawRoundRect(118, 130, 180, 32, 16, '#111111');
  fill('#DA7927'); textFont(garamondItalic); textSize(13); textAlign(LEFT, CENTER);
  text('Where To?', 130, 146);
  fill('#666666'); textFont(mergeOne); textSize(12);
  text('›', 190, 146);
  fill('#CADB35'); textSize(12);
  text('Bermondsey', 200, 146);

  // ── Map area ───────────────────────────────────── (unchanged)
  drawRoundRect(0, 184, 320, 315, 16, '#ffffff');
  fill('#cccccc'); textFont(mergeOne); textSize(13); textAlign(CENTER, CENTER);
  text('[ map / p5 canvas ]', 160, 309);
  image(mapMain, -50, 180, 480, 380);

  fill('#ffffff'); textFont(mergeOne); textSize(11); textAlign(RIGHT, CENTER);
  text('Stay Clear', 306, 200);

  let barX = 296, barY = 212, barW = 12, barH = 140;
  for (let i = 0; i < barH; i++) {
    let t = i / barH;
    let c = lerpGradient(t);
    stroke(c); strokeWeight(1);
    line(barX, barY + i, barX + barW, barY + i);
  }
  noStroke();

  stroke('#aaaaaa'); strokeWeight(2);
  line(barX + barW, barY + barH * 0.38, barX + barW + 8, barY + barH * 0.38);
  line(barX + barW, barY + barH * 0.62, barX + barW + 8, barY + barH * 0.62);
  noStroke();

  fill('#ffffff'); textFont(mergeOne); textSize(10); textAlign(RIGHT, CENTER);
  text('Current', barX - 2, barY + barH * 0.38);
  text('Base', barX - 2, barY + barH * 0.62);
  fill('#ffffff'); textSize(11);
  text('Clean ish', 306, barY + barH + 14);

  // ── Everything below here shifted +20 ────────────

  // X2 badge
  drawRoundRect(10, 356, 85, 85, 14, '#1a1a1a');
  fill('#ffffff'); textFont(mergeOne); textSize(24); textAlign(LEFT, CENTER);
  text('X2', 20, 425);

  // Visualise AQ pill
  drawRoundRect(10, 448, 85, 30, 14, '#1a1a1a');
  fill('#CADB35'); textFont(garamondItalic); textSize(13); textAlign(LEFT, CENTER);
  text('Visualise AQ', 20, 465);

  // Up chevron
  drawCircle(305, 462, 16, '#1a1a1a');
  fill('#ffffff'); textFont(mergeOne); textSize(13); textAlign(CENTER, CENTER);
  text('∧', 304, 461);

  // Action buttons
  drawRoundRect(10, 485, 150, 36, 18, '#1a1a1a');
  fill('#e07b20'); textFont(garamondItalic); textSize(13); textAlign(CENTER, CENTER);
  text('Just + 2hrs than fast route!', 85, 505);

  drawRoundRect(175, 485, 135, 36, 18, '#1a1a1a');
  fill('#CADB35'); textFont(garamondItalic); textSize(13); textAlign(CENTER, CENTER);
  text('Avoids 80% of Pollution', 246, 505);

  // Bottom stats bar
  drawRoundRect(10, 530, 300, 120, 26, '#1a1a1a');

  drawCircle(22, 528, 13, '#2a2a2a');
  fill('#ffffff'); textFont(mergeOne); textSize(11); textAlign(CENTER, CENTER);
  text('∨', 22, 527);

  // Takes
  fill('#888888'); textFont(garamondItalic); textSize(11); textAlign(CENTER, CENTER);
  text('Takes', 40, 550);
  drawCircle(40, 590, 22, '#CADB35');
  fill('#1a2a00'); textFont(mergeOne); textSize(13); textAlign(CENTER, CENTER);
  text('3', 40, 585);
  fill('#1a2a00'); textSize(9);
  text('Hrs', 40, 598);

  // Leave Within
  fill('#888888'); textFont(garamondItalic); textSize(11); textAlign(CENTER, CENTER);
  text('Leave Within', 95, 550);
  drawCircle(95, 590, 22, '#e07b20');
  fill('#ffffff'); textFont(mergeOne); textSize(13); textAlign(CENTER, CENTER);
  text('5', 95, 585);
  fill('#ffffff'); textSize(9);
  text('Min', 95, 598);

  // Mark logo
  if (logoMark) {
    let sz = 36;
    image(logoMark, 165 - sz / 2, 569, 28, sz);
  }

  // Method + bike icon
  fill('#888888'); textFont(garamondItalic); textSize(11); textAlign(CENTER, CENTER);
  text('Method', 220, 550);
  if (logoBike) {
    let sz = 40;
    image(logoBike, 215 - sz / 2, 570, 50, sz);
  }

  // Saved
  fill('#888888'); textFont(garamondItalic); textSize(11); textAlign(CENTER, CENTER);
  text('Saved', 278, 550);
  strokeWeight(5);
  stroke('#CADB35');
  drawCircle(278, 590, 22, '#f0f0f0');

  // Home bar
  fill('#444444'); noStroke();
  rect(110, 630, 100, 4, 2);
}

function drawRoundRect(x, y, w, h, r, col) {
  fill(col); noStroke();
  rect(x, y, w, h, r);
}

function drawCircle(x, y, r, col) {
  fill(col); noStroke();
  ellipse(x, y, r * 2, r * 2);
}

function lerpGradient(t) {
  let stops = [
    [153, 0, 255],
    [255, 0, 170],
    [255, 51, 0],
    [255, 136, 0],
    [170, 204, 0],
    [51, 221, 51]
  ];
  let seg = t * (stops.length - 1);
  let i = floor(seg);
  let f = seg - i;
  i = constrain(i, 0, stops.length - 2);
  let a = stops[i], b = stops[i + 1];
  return color(
    lerp(a[0], b[0], f),
    lerp(a[1], b[1], f),
    lerp(a[2], b[2], f)
  );
}