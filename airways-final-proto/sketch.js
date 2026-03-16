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

var cols = 200;
var rows = 100;
var gridEfficient = new Array(cols);
var gridGreen = new Array(cols);

// Efficient route (standard A*)
var openSetEfficient = [];
var closedSetEfficient = [];
var pathEfficient = [];
var solvedEfficient = false;

// Green-space prioritized route
var openSetGreen = [];
var closedSetGreen = [];
var pathGreen = [];
var solvedGreen = false;

var start;
var end;
var noSolution = false;

var w, h;
var col;
var col1; //colour
var mapImg;

let grey = [206, 216, 227];
let green = [194, 240, 212];
//the colours that google maps uses

// let greenSpaceCheckBox;
// let greenSpacePos;

async function setup() {

    // greenSpaceCheckBox = select('.switch input');
    // greenSpacePos = select('.switch');
    // greenSpacePos.position(2000, 2380);

    mapImg = await loadImage('homeNewCross2.png');
    //slightly edited screenshot to make sure all roads show

    createCanvas(mapImg.width, mapImg.height);
    //must happen after the image is loaded

    image(mapImg, 0, 0);
    //can only place image down AFTER making canvas

    loadPixels();
    //allows you to access pixel info

    //defining width & height of columns so that it adjust to the width & height of the canvas!
    w = width / cols;
    h = height / rows;
    //divides the width of the canvas by the num of cols and rows
    //making the 2d array (grid)

    // Initialize both grids
    for (var i = 0; i < cols; i++) {
        gridEfficient[i] = new Array(rows);
        gridGreen[i] = new Array(rows);
    }

    // Create spots for both grids
    for (var i = 0; i < cols; i++) {
        for (var j = 0; j < rows; j++) {
            gridEfficient[i][j] = new Spot(i, j);
            gridGreen[i][j] = new Spot(i, j);
        }
    }

    // Add neighbours for both grids
    for (var i = 0; i < cols; i++) {
        for (var j = 0; j < rows; j++) {
            gridEfficient[i][j].addNeighbours(gridEfficient);
            gridGreen[i][j].addNeighbours(gridGreen);
        }
    }

    //defining the start and end of the grid
    start = gridEfficient[146][47];
    end = gridEfficient[30][63];
    
    // Also set start/end for green grid
    let startGreen = gridGreen[146][47];
    let endGreen = gridGreen[30][63];
    
    start.wall = false;
    end.wall = false;
    startGreen.wall = false;
    endGreen.wall = false;

    // Initialize both searches
    openSetEfficient.push(start);
    openSetGreen.push(startGreen);
}

function draw() {
    
    // Run efficient route A* (one step)
    if (openSetEfficient.length > 0 && !solvedEfficient) {
        runAStarStep(openSetEfficient, closedSetEfficient, gridEfficient, end, false);
        
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
        runAStarStep(openSetGreen, closedSetGreen, gridGreen, gridGreen[30][63], true);
        
        let current = openSetGreen.length > 0 ? openSetGreen[0] : null;
        for (let i = 0; i < openSetGreen.length; i++) {
            if (openSetGreen[i].f < current.f) {
                current = openSetGreen[i];
            }
        }
        
        if (current === gridGreen[30][63]) {
            solvedGreen = true;
            pathGreen = reconstructPath(gridGreen[30][63]);
        }
    }

    // Stop when both are solved
    if (solvedEfficient && solvedGreen) {
        noLoop();
    }

    // Draw the grid and visualization
    drawVisualization();
}

function runAStarStep(openSet, closedSet, grid, end, isGreen) {
    if (openSet.length === 0) return;

    var winner = 0;
    for (var i = 0; i < openSet.length; i++) {
        if (openSet[i].f < openSet[winner].f) {
            winner = i;
        }
    }

    var current = openSet[winner];

    removeFromArray(openSet, current);
    closedSet.push(current);

    var neighbours = current.neighbours;
    for (var i = 0; i < neighbours.length; i++) {
        var neighbour = neighbours[i];

        if (!closedSet.includes(neighbour) && !neighbour.wall) {
            var moveCost = 1;

            // Green route prioritizes parks
            if (isGreen && neighbour.park) {
                moveCost = 0.1;
            }

            var tempG = current.g + moveCost;
            var newPath = false;

            if (openSet.includes(neighbour)) {
                if (tempG < neighbour.g) {
                    neighbour.g = tempG;
                    newPath = true;
                }
            } else {
                neighbour.g = tempG;
                newPath = true;
                openSet.push(neighbour);
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
    for (var i = 0; i < closedSetEfficient.length; i++) {
        push();
        fill(255,0,0,50); // closed set color efficient route
        strokeWeight(0);
        rect(closedSetEfficient[i].i * w, closedSetEfficient[i].j * h, w, h);
        pop();
    }

    for (var i = 0; i < closedSetGreen.length; i++) {
        push();
        fill(0,0,255,50); // closed set color green route
        strokeWeight(0);
        rect(closedSetGreen[i].i * w, closedSetGreen[i].j * h, w, h);
        pop();
    }

    // Draw open sets (frontier nodes)
    for (var i = 0; i < openSetEfficient.length; i++) {
        openSetEfficient[i].show(color(255, 0, 0));
    }

    for (var i = 0; i < openSetGreen.length; i++) {
        openSetGreen[i].show(color(0, 200, 0));
    }

    // Draw final paths with bold colors
    strokeWeight(3);
    for (var i = 0; i < pathEfficient.length; i++) {
        pathEfficient[i].show(color(0, 0, 255)); // Blue for efficient
    }

    for (var i = 0; i < pathGreen.length; i++) {
        pathGreen[i].show(color(255, 100, 200)); // Pink for green-space
    }

    // Draw labels
    textStyle(NORMAL);
    textAlign(CENTER);
    textSize(15);
    rectMode(CENTER);
    fill('magenta');
    square(1453, 640, 50);
    fill(255);
    text('HOME', 1453, 640);
    fill('magenta');
    rect(298, 858, 200, 50);
    fill(255);
    text('NEW CROSS STATION', 298, 858);
    
    textSize(45);
    fill('magenta');
    textStyle(BOLD);
    text('Dual Route Pathfinding', width/2, height-100);

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

    let x = floor(i * w + w / 2);
    let y = floor(j * h + h / 2);
    //floor removes decimal points
    ///divide by two to find the centre of each pixel

    let pixelIndex = (x + y * width) * 4;

    let r = pixels[pixelIndex];
    let g = pixels[pixelIndex + 1];
    let b = pixels[pixelIndex + 2];

    if (dist(r, g, b, grey[0], grey[1], grey[2]) < 30) {
        // PATH
        this.wall = false;
        this.park = false;
    }
    else if (dist(r, g, b, green[0], green[1], green[2]) < 30) {
        // GREENSPACE
        this.wall = false;
        this.park = true;
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
            c = color(121, 212, 6);
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