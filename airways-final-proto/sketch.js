//adding checkbox
////https://getcssscan.com/css-checkboxes-examples

//WORKS
//home to newcross station
//uses mouseX and mouseY to work out col and row of end and start pos

//A* Pathfinding test
//using map of deptford
//using pixelation
//adding labels

//working

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
var openSetEfficientSet = new Set(); // Add Set for O(1) lookup
var closedSetEfficient = [];
var pathEfficient = [];
var solvedEfficient = false;

// Green-space prioritized route
var openSetGreen = [];
var openSetGreenSet = new Set(); // Add Set for O(1) lookup
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
var col1; //colour
var mapImg;

const canvasWidth = 1536;
const canvasHeight = 1024;

let grey = [207, 216, 221];
let green = [191, 231, 209];
let blue = [158, 214, 233];
let darkGrey = [151,168,181];
//the colours that google maps uses

// let greenSpaceCheckBox;
// let greenSpacePos;


async function setup() {

    // greenSpaceCheckBox = select('.switch input');
    // greenSpacePos = select('.switch');
    // greenSpacePos.position(2000, 2380);

    data = await loadTable("airQualTest.csv", ",", "header");
    console.log("data loaded", data.getRowCount(), data.getColumnCount());

    // mapImg = await loadImage('largeMap.png');
    mapImg = await loadImage('largeMap.png');
    console.log("map loaded", mapImg.width, mapImg.height);

    numRows = data.getRowCount();
    //slightly edited screenshot to make sure all roads show

    pmVal = data.getColumn('pmVal');
    xLng = data.getColumn('x');
    yLat = data.getColumn('y');

    console.log("map", canvasWidth, canvasHeight);

    createCanvas(canvasWidth, canvasHeight);
    //must happen after the image is loaded

    // image(mapImg, 0, 0, 1536, 1024);
    image(mapImg, 0, 0, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight, CONTAIN);
    //can only place image down AFTER making canvas

    loadPixels();
    //allows you to access pixel info

    //defining width & height of columns so that it adjust to the width & height of the canvas!
    w = width / cols;
    h = height / rows;
    //divides the width of the canvas by the num of cols and rows
    //making the 2d array (grid)

    // Initialize both grids

    for (let i = 0; i < numRows; i++) {

        let xVal = int(xLng[i]);
        let yVal = int(yLat[i]);
        let pmValNo = Number(pmVal[i]);
        //turns from string to number
    
    //grid for pollution data points    
      if (xVal > londonMinX && xVal < londonMaxX &&
            yVal > londonMinY && yVal < londonMaxY) {
      
            x.push(map(xVal, londonMinX, londonMaxX, 0, (width)+ width/16));
            y.push(map(yVal, londonMinY, londonMaxY, (height)+ width/16, 0));
            pm.push(pmValNo);
            console.log('x:', x);

        }
    }

    for (var i = 0; i < cols; i++) {
        gridEfficient[i] = new Array(rows);
        gridGreen[i] = new Array(rows);
        gridPollution[i] = new Array(rows);
    }

    // Create spots for all grids
    for (var i = 0; i < cols; i++) {
        for (var j = 0; j < rows; j++) {
            gridEfficient[i][j] = new Spot(i, j);
            gridGreen[i][j] = new Spot(i, j);
            gridPollution[i][j] = new Spot(i, j);
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

    //defining the start and end of the grid
    start = gridEfficient[352][38];
    end = gridEfficient[22][253];
    
    // Also set start/end for green grid (SAME endpoints)
    startGreen = gridGreen[352][38];
    endGreen = gridGreen[22][253]; // Changed from gridGreen[30][63]
    
    start.wall = false;
    end.wall = false;
    startGreen.wall = false;
    endGreen.wall = false;

    // Initialize both searches
    openSetEfficient.push(start);
    openSetGreen.push(startGreen);
}



//START DRAW

function draw() {
    
    // Run multiple A* steps per frame for faster completion
    const stepsPerFrame = 200; // Increase this to go faster
    
    for (let step = 0; step < stepsPerFrame; step++) {
        // Run efficient route A* (one step)
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

        // Run green route A* (one step)
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

        // Stop when both are solved
        if (solvedEfficient && solvedGreen) {
            break; // Exit the step loop early
        }
    }

    // Stop animation when both are solved
    if (solvedEfficient && solvedGreen) {
        noLoop();
    }

    // Draw the grid and visualization
    drawVisualization();

    // Draw pollution data points (yellow squares)
    for(let i = 0; i < x.length; i++){
        noFill();
        stroke('yellow');
        strokeWeight(2);
        rectMode(CENTER);
        rect(x[i], y[i], width/8, width/8);
        rectMode(CORNER);
        textSize(12);
        fill('yellow');
        text('PM:' + pm[i].toFixed(2), x[i], y[i] - 20);
    }
    stroke(0);
}

function runAStarStep(openSet, openSetSet, closedSet, grid, end, isGreen) {
    if (openSet.length === 0) return;

    // Find node with lowest f score (single pass)
    var winner = 0;
    for (var i = 0; i < openSet.length; i++) {
        if (openSet[i].f < openSet[winner].f) {
            winner = i;
        }
    }

    var current = openSet[winner];
    removeFromArray(openSet, current);
    openSetSet.delete(current); // Remove from Set too
    closedSet.push(current);

    var neighbours = current.neighbours;
    for (var i = 0; i < neighbours.length; i++) {
        var neighbour = neighbours[i];

        if (!closedSet.includes(neighbour) && !neighbour.wall) {
            var moveCost = 1;

            // Get the pollution level for this neighbor cell
            let pollutionLevel = neighbour.pollutionLevel;

            if (isGreen) {
                // GREEN ROUTE: Prioritize both parks AND low pollution
                if (neighbour.park) {
                    moveCost = 0.1; // Parks are very cheap
                } else if (pollutionLevel <= 0.9) {
                    moveCost = 0.2; // Low pollution areas are cheap
                } else if (pollutionLevel <= 1.0) {
                    moveCost = 0.4; // Medium pollution is moderate
                } else {
                    moveCost = 0.6; // High pollution is expensive
                }
            } else {
                // EFFICIENT ROUTE: Ignore pollution, just find shortest path
                moveCost = 1; // All cells cost the same
            }

            var tempG = current.g + moveCost;
            var newPath = false;

            // Use Set for O(1) lookup instead of array includes()
            if (openSetSet.has(neighbour)) {
                if (tempG < neighbour.g) {
                    neighbour.g = tempG;
                    newPath = true;
                }
            } else {
                neighbour.g = tempG;
                newPath = true;
                openSet.push(neighbour);
                openSetSet.add(neighbour); // Add to Set
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

function drawVisualization() {
    // Draw base grid
    for (var i = 0; i < cols; i++) {
        for (var j = 0; j < rows; j++) {
            gridEfficient[i][j].show();
        }
    }

    // Draw closed sets (evaluated nodes) - semi-transparent
    // for (var i = 0; i < closedSetEfficient.length; i++) {
    //     push();
    //     fill(255); // closed set color efficient route
    //     strokeWeight(0);
    //     rect(closedSetEfficient[i].i * w, closedSetEfficient[i].j * h, w, h);
    //     pop();
    // }

    // for (var i = 0; i < closedSetGreen.length; i++) {
    //     push();
    //     fill('yellow'); // closed set color green route
    //     strokeWeight(0,0,0,100);
    //     rect(closedSetGreen[i].i * w, closedSetGreen[i].j * h, w, h);
    //     pop();
    // }

    // Draw open sets (frontier nodes)
    for (var i = 0; i < openSetEfficient.length; i++) {
        openSetEfficient[i].show(color(0, 0, 255));
    }

    for (var i = 0; i < openSetGreen.length; i++) {
        openSetGreen[i].show(color(255, 0, 255));
    }

    // Draw final paths with bold colors
    strokeWeight(3);
    for (var i = 0; i < pathEfficient.length; i++) {
        pathEfficient[i].show(color(0,0,255)); // Blue for efficient
    }

    for (var i = 0; i < pathGreen.length; i++) {
        pathGreen[i].show(color(202,219,53)); // Pink for green-space
    }

    // Draw labels
    textStyle(NORMAL);
    textAlign(CENTER);
    textSize(15);
    rectMode(CENTER);
    fill(218,121,39,200);
    square(1357, 130, 70);
    fill(0);
    textStyle(BOLD);
    text('START', 1357, 135);
    fill(218,121,39,200);
    square(106, 881, 70);
    fill(0);
    textStyle(BOLD);
    text('END', 106, 881);

    // console.log(mouseX,mouseY)
    
    textSize(45);
    fill('magenta');
    textStyle(BOLD);
    fill(0,0,0,200);
    rect(width/2, height*0.08, width/2, height/12,999);
    fill(218,121,39); //orange
    text('AIRWAYS', width/2, height*0.1);

    // Draw route statistics
    drawStats();
}

function drawStats() {
    textSize(16);
    textStyle(NORMAL);
    textAlign(LEFT);
    rectMode(CORNER);
    
    let statsX = 20;
    let statsY = 20;
    
    // Efficient route info
    fill(0, 0, 255);
    text('Efficient Route (Blue)', statsX, statsY);
    fill(0);
    text('Distance: ' + pathEfficient.length + ' cells', statsX, statsY + 20);
    let efficientGreen = countGreenSpacePath(pathEfficient);
    text('Green Space: ' + efficientGreen + ' cells', statsX, statsY + 40);
    
    // Green-space route info
    fill(255, 100, 200);
    text('Green Space Route (Pink)', statsX, statsY + 80);
    fill(0);
    text('Distance: ' + pathGreen.length + ' cells', statsX, statsY + 100);
    let greenRouteGreen = countGreenSpacePath(pathGreen);
    text('Green Space: ' + greenRouteGreen + ' cells', statsX, statsY + 120);
}

function countGreenSpacePath(path) {
    let count = 0;
    for (let i = 0; i < path.length; i++) {
        if (path[i].park) count++;
    }
    return count;
}

function removeFromArray(arr, elt) {
    for (var i = arr.length - 1; i >= 0; i--) {
        if (arr[i] === elt) {
            arr.splice(i, 1);
        }
    }
}

function heuristic(a, b) {
    //this is known as euclidean distance uses pythag theorem
    var d = dist(a.i, a.j, b.i, b.j);
    return d;
}

function getInterpolatedPollution(gridI, gridJ) {
    // Use nearest neighbor instead of distance-weighted for speed
    // This is much faster and still gives reasonable results
    let closestDist = Infinity;
    let closestPM = 0.9; // Default value if no data points nearby
    
    for (let i = 0; i < x.length; i++) {
        let d = dist(gridI * w, gridJ * h, x[i], y[i]);
        if (d < closestDist) {
            closestDist = d;
            closestPM = pm[i];
            if (d === 0) break; // Exact match found, no need to continue
        }
    }
    return closestPM;
}

function Spot(i, j) {

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
    this.pollutionLevel = getInterpolatedPollution(i, j); // Calculate pollution for this cell

    let x = floor(i * w + w / 2);
    let y = floor(j * h + h / 2);
    //floor removes decimal points
    ///divide by two to find the centre of each pixel

    let pixelIndex = (x + y * width) * 4;

    let r = pixels[pixelIndex];
    let g = pixels[pixelIndex + 1];
    let b = pixels[pixelIndex + 2];

    if (dist(r, g, b, green[0], green[1], green[2]) < 20) {
        // GREENSPACE
        this.wall = false;
        this.park = true;
        this.river = false;
        this.highway = false;
    }
    else if (dist(r, g, b, grey[0], grey[1], grey[2]) < 40) {
        // PATH
        this.wall = false;
        this.park = false;
        this.river = false;
        this.highway = false;
    }
    else if (dist(r, g, b, blue[0], blue[1], blue[2]) < 20) {
        // RIVER
        this.river = true;
        this.park = false;
        this.wall = false;
        this.highway = false;

    }
    else if (dist(r, g, b, darkGrey[0], darkGrey[1], darkGrey[2]) < 20) {
        // HIGHWAY
        this.river = false;
        this.park = false;
        this.wall = false;
        this.highway = true;
    }
    else {
        this.wall = true;
    }

    this.show = function (col) {
        let c = col;
        if (c) {
            fill(c);
        }
        else if (this.wall) {
            c = color(0);
        } else if (this.park) {
            c = color(186,253,143,100);
        } else if (this.river) {
            c = color(143,146,235,100);               
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

function drawPollVisualization() {
    // Draw base pollution grid
    for (var i = 0; i < cols; i++) {
        for (var j = 0; j < rows; j++) {
            gridPollution[i][j].show();
        }
    }
}
