let garamondItalic = null;
let mergeOne = null;
let logoMain;
let logoBike;
let logoSearch;
let logoMark;
let mapImg;
let cigImg;

let data;
let pmVal;

let xLng;
let yLat;

// arrays for x & y values of PM2.5 data points
let x = [];
let y =[];
let pm =[];

let numRows;

let londonMinX = (525200);
let londonMaxX = (533200);
let londonMinY = (176000);
let londonMaxY = (180500);

//coordinates to access

var cols = 400;
var rows = 300;
var gridEfficient = new Array(cols);
var gridPollution = new Array(cols);
var gridGreen = new Array(cols);

// Efficient route (standard A*)
var openSetEfficient = [];
var openSetEfficientSet = new Set();
var closedSetEfficient = [];
var pathEfficient = [];
var solvedEfficient = false;

// Green-space prioritized route
var openSetGreen = [];
var openSetGreenSet = new Set();
var closedSetGreen = [];
var pathGreen = [];
var solvedGreen = false;

var start;
var end;
var startGreen;
var endGreen;
var noSolution = false;

var w, h;
var col;
var col1;

const canvasWidth = 1536;
const canvasHeight = 1024;
const interfaceWidth = 320;
const interfaceHeight = 700;
const mapDisplayWidth = 320;
const mapDisplayHeight = 315;
const mapDisplayX = 0;
const mapDisplayY = 184;

let grey = [207, 216, 221];
let green = [191, 231, 209];
let blue = [158, 214, 233];
let darkGrey = [151,168,181];


async function setup() {
  createCanvas(interfaceWidth, interfaceHeight);
  
  // Try loading interface assets, but don't fail if they're missing
  try {
    logoMain = await loadImage('assets/Airways-Main.png');
  } catch(e) {
    console.warn('Airways-Main.png not found');
    logoMain = null;
  }
  
  try {
    logoBike = await loadImage('assets/Bike.png');
  } catch(e) {
    console.warn('Bike.png not found');
    logoBike = null;
  }
  
  try {
    logoSearch = await loadImage('assets/Search.png');
  } catch(e) {
    console.warn('Search.png not found');
    logoSearch = null;
  }
  
  try {
    logoMark = await loadImage('assets/Mark.png');
  } catch(e) {
    console.warn('Mark.png not found');
    logoMark = null;
  }
  
  try {
    mapImg = await loadImage('largeMap.png');
  } catch(e) {
    console.warn('largeMap.png not found - creating blank map');
    mapImg = null;
  }

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
    console.warn('Custom fonts not available, using fallbacks');
    garamondItalic = 'Georgia';
    mergeOne = 'Arial';
  }

  // Load A* data
  data = await loadTable("airQualTest.csv", ",", "header");
  console.log("data loaded", data.getRowCount(), data.getColumnCount());

  numRows = data.getRowCount();
  pmVal = data.getColumn('pmVal');
  xLng = data.getColumn('x');
  yLat = data.getColumn('y');

  // Initialize pollution data arrays
  for (let i = 0; i < numRows; i++) {
    let xVal = int(xLng[i]);
    let yVal = int(yLat[i]);
    let pmValNo = Number(pmVal[i]);
    
    if (xVal > londonMinX && xVal < londonMaxX &&
        yVal > londonMinY && yVal < londonMaxY) {
      x.push(map(xVal, londonMinX, londonMaxX, 0, canvasWidth + canvasWidth/16));
      y.push(map(yVal, londonMinY, londonMaxY, canvasHeight + canvasWidth/16, 0));
      pm.push(pmValNo);
    }
  }

  // Set pixel dimensions for grid calculations
  w = canvasWidth / cols;
  h = canvasHeight / rows;

  // Create a temporary canvas to get pixel data for the map
  // This is needed to identify walls, parks, rivers from the map image
  let tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvasWidth;
  tempCanvas.height = canvasHeight;
  let tempCtx = tempCanvas.getContext('2d');
  
  if (mapImg) {
    tempCtx.drawImage(mapImg.canvas, 0, 0, canvasWidth, canvasHeight);
  } else {
    // Fill with grey if no map image
    tempCtx.fillStyle = 'rgb(207, 216, 221)';
    tempCtx.fillRect(0, 0, canvasWidth, canvasHeight);
  }
  
  let imageData = tempCtx.getImageData(0, 0, canvasWidth, canvasHeight);
  let pixelArray = imageData.data;

  // Initialize grids
  for (var i = 0; i < cols; i++) {
    gridEfficient[i] = new Array(rows);
    gridGreen[i] = new Array(rows);
    gridPollution[i] = new Array(rows);
  }

  // Create spots for all grids using temporary pixel data
  for (var i = 0; i < cols; i++) {
    for (var j = 0; j < rows; j++) {
      gridEfficient[i][j] = new Spot(i, j, pixelArray, canvasWidth);
      gridGreen[i][j] = new Spot(i, j, pixelArray, canvasWidth);
      gridPollution[i][j] = new Spot(i, j, pixelArray, canvasWidth);
    }
  }

  // Add neighbours for all grids
  for (var i = 0; i < cols; i++) {
    for (var j = 0; j < rows; j++) {
      gridEfficient[i][j].addNeighbours(gridEfficient);
      gridGreen[i][j].addNeighbours(gridGreen);
      gridPollution[i][j].addNeighbours(gridPollution);
    }
  }

  // Set start and end points
  start = gridEfficient[167][19];
  end = gridEfficient[22][253];
  
  startGreen = gridGreen[167][19];
  endGreen = gridGreen[22][253];
  
  start.wall = false;
  end.wall = false;
  startGreen.wall = false;
  endGreen.wall = false;

  openSetEfficient.push(start);
  openSetGreen.push(startGreen);
  
  console.log("Setup complete - ready to visualize pathfinding");
}

function draw() {
  // Run multiple A* steps per frame
  const stepsPerFrame = 200;
  
  for (let step = 0; step < stepsPerFrame; step++) {
    if (openSetEfficient.length > 0 && !solvedEfficient) {
      runAStarStep(openSetEfficient, openSetEfficientSet, closedSetEfficient, gridEfficient, end, false);
      
      let current = openSetEfficient.length > 0 ? openSetEfficient[0] : null;
      for (let i = 0; i < openSetEfficient.length; i++) {
        if (openSetEfficient[i].f < current.f) {
          current = openSetEfficient[i];
        }
      }
      
      if (current === end) {
        solvedEfficient = true;
        pathEfficient = reconstructPath(end);
      }
    }

    if (openSetGreen.length > 0 && !solvedGreen) {
      runAStarStep(openSetGreen, openSetGreenSet, closedSetGreen, gridGreen, endGreen, true);
      
      let current = openSetGreen.length > 0 ? openSetGreen[0] : null;
      for (let i = 0; i < openSetGreen.length; i++) {
        if (openSetGreen[i].f < current.f) {
          current = openSetGreen[i];
        }
      }
      
      if (current === endGreen) {
        solvedGreen = true;
        pathGreen = reconstructPath(endGreen);
      }
    }

    if (solvedEfficient && solvedGreen) {
      break;
    }
  }

  // Draw interface background
  drawInterfaceBackground();
  
  // Draw A* visualization in map area
  drawAStarVisualization();
}

function drawInterfaceBackground() {
  background(240);

  drawRoundRect(0, 10, 320, 650, 26, '#000000');

  // Top bar
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

  // Route panel
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

  // Map area frame
  drawRoundRect(0, 184, 320, 315, 16, '#ffffff');

  // Stats panel
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

  // Method + bike icon
  fill('#888888'); textFont(garamondItalic); textSize(11); textAlign(CENTER, CENTER);
  text('Method', 220, 550);
  if (logoBike) {
    let sz = 40;
    image(logoBike, 215 - sz / 2, 570, 50, sz);
  }

  // Home bar
  fill('#444444'); noStroke();
  rect(110, 630, 100, 4, 2);
}

function drawAStarVisualization() {
  // Draw the A* visualization in the map display area
  push();
  
  // Set up clipping region for map area
  clip(() => {
    drawRoundRect(mapDisplayX, mapDisplayY, mapDisplayWidth, mapDisplayHeight, 16, '#ffffff');
  });

  // Scale and translate to show left half of map in center
  let scaleX = mapDisplayWidth / canvasWidth;
  let scaleY = mapDisplayHeight / canvasHeight;
  
  translate(mapDisplayX - canvasWidth * 0.3, mapDisplayY);
  scale(scaleX, scaleY);

  // Draw grid
  for (var i = 0; i < cols; i++) {
    for (var j = 0; j < rows; j++) {
      gridEfficient[i][j].show();
    }
  }

  // Draw frontier nodes
  if (!solvedEfficient) {
    for (var i = 0; i < openSetEfficient.length; i++) {
      openSetEfficient[i].show(color(0, 0, 255));
    }
  }

  if (!solvedGreen) {
    for (var i = 0; i < openSetGreen.length; i++) {
      openSetGreen[i].show(color(255, 0, 255));
    }
  }

  // Draw final paths
  strokeWeight(3);
  for (var i = 0; i < pathEfficient.length; i++) {
    pathEfficient[i].show(color('orange'));
  }

  for (var i = 0; i < pathGreen.length; i++) {
    pathGreen[i].show(color('yellow'));
  }

  pop();

  // Draw pollution indicator (separate from clipped area)
  fill('#aaaaaa'); textFont(mergeOne); textSize(9); textAlign(CENTER, CENTER);
  text('Computing...', 160, 345);
}

function runAStarStep(openSet, openSetSet, closedSet, grid, end, isGreen) {
  if (openSet.length === 0) return;

  var winner = 0;
  for (var i = 0; i < openSet.length; i++) {
    if (openSet[i].f < openSet[winner].f) {
      winner = i;
    }
  }

  var current = openSet[winner];
  removeFromArray(openSet, current);
  openSetSet.delete(current);
  closedSet.push(current);

  var neighbours = current.neighbours;
  for (var i = 0; i < neighbours.length; i++) {
    var neighbour = neighbours[i];

    if (!closedSet.includes(neighbour) && !neighbour.wall) {
      var moveCost = 1;

      let pollutionLevel = neighbour.pollutionLevel;

      if (isGreen) {
        if (neighbour.park) {
          moveCost = 0.1;
        } else if (pollutionLevel <= 0.9) {
          moveCost = 0.2;
        } else if (pollutionLevel <= 1.0) {
          moveCost = 0.4;
        } else {
          moveCost = 0.6;
        }
      } else {
        moveCost = 1;
      }

      var tempG = current.g + moveCost;
      var newPath = false;

      if (openSetSet.has(neighbour)) {
        if (tempG < neighbour.g) {
          neighbour.g = tempG;
          newPath = true;
        }
      } else {
        neighbour.g = tempG;
        newPath = true;
        openSet.push(neighbour);
        openSetSet.add(neighbour);
      }

      if (newPath) {
        neighbour.h = heuristic(neighbour, end);
        neighbour.f = neighbour.g + neighbour.h;
        neighbour.previous = current;
      }
    }
  }
}

function reconstructPath(endNode) {
  let path = [];
  let temp = endNode;
  if (temp) {
    path.push(temp);
    while (temp.previous) {
      path.push(temp.previous);
      temp = temp.previous;
    }
  }
  return path;
}

function removeFromArray(arr, elt) {
  for (var i = arr.length - 1; i >= 0; i--) {
    if (arr[i] === elt) {
      arr.splice(i, 1);
    }
  }
}

function heuristic(a, b) {
  var d = dist(a.i, a.j, b.i, b.j);
  return d;
}

function getInterpolatedPollution(gridI, gridJ) {
  let closestDist = Infinity;
  let closestPM = 0.9;
  
  for (let i = 0; i < x.length; i++) {
    let d = dist(gridI * w, gridJ * h, x[i], y[i]);
    if (d < closestDist) {
      closestDist = d;
      closestPM = pm[i];
      if (d === 0) break;
    }
  }
  return closestPM;
}

function Spot(i, j, pixelArray, canvasWidth) {
  this.i = i;
  this.j = j;

  this.f = 0;
  this.g = 0;
  this.h = 0;

  this.neighbours = [];
  this.previous = undefined;
  this.wall = false;
  this.park = false;
  this.river = false;
  this.pollutionLevel = getInterpolatedPollution(i, j);

  // Determine wall, park, or river based on pixel data
  let pixelIndex = (j * canvasWidth + i) * 4;
  let r = pixelArray[pixelIndex];
  let g = pixelArray[pixelIndex + 1];
  let b = pixelArray[pixelIndex + 2];

  if (r === 0 && g === 0 && b === 0) {
    this.wall = true;
  } else if (r === 186 && g === 253 && b === 143) {
    this.park = true;
  } else if (r === 143 && g === 146 && b === 235) {
    this.river = true;
  }

  this.show = function (col) {
    let c = col;
    if (c) {
      fill(c);
    } else if (this.wall) {
      c = color(0);
    } else if (this.park) {
      c = color(186, 253, 143, 100);
    } else if (this.river) {
      c = color(143, 146, 235, 100);
    } else {
      c = color(180);
    }

    fill(c);
    strokeWeight(1);
    rect(this.i * w, this.j * h, w, h);
  }

  this.addNeighbours = function (grid) {
    var i = this.i;
    var j = this.j;

    if (i < cols - 1) {
      this.neighbours.push(grid[i + 1][j]);
    }
    if (i > 0) {
      this.neighbours.push(grid[i - 1][j]);
    }
    if (j < rows - 1) {
      this.neighbours.push(grid[i][j + 1]);
    }
    if (j > 0) {
      this.neighbours.push(grid[i][j - 1]);
    }
  }
}

function drawRoundRect(x, y, w, h, r, col) {
  fill(col);
  noStroke();
  rect(x, y, w, h, r);
}

function drawCircle(x, y, r, col) {
  fill(col);
  noStroke();
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




