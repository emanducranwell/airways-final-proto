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
var grid = new Array(cols);

var openSet = [];
var closedSet = [];
var start;
var end;
var path = [];
var noSolution = false;

var w, h;
var col;
var col1; //colour
var mapImg;

let grey = [206, 216, 227];
let green = [194, 240, 212];
//the colours that google maps uses

let greenSpaceCheckBox;
let greenSpacePos;

async function setup() {

    // greenSpaceCheckBox = createCheckbox('Green Space');

    // console.log('A*');
    greenSpaceCheckBox = select('.switch input');
    greenSpacePos = select('.switch');
    greenSpacePos.position(2000, 2380);

    mapImg = await loadImage('homeNewCross2.png');
    //slightly edited screenshot to make sure all roads show

    createCanvas(mapImg.width, mapImg.height);
    //must happen after the image is loaded

    // pixelDensity(1);
    image(mapImg, 0, 0);
    //can only place image down AFTER making canvas

    loadPixels();
    //allows you to access pixel info

    //deifnidng with & height of colums so that it adjust to the width & height of the canvas!
    w = width / cols;
    h = height / rows;
    //divides the width of the canvas by the num of cols and rows
    //making the 2d array (grid)

    for (var i = 0; i < cols; i++) {
        grid[i] = new Array(rows);
    }

    for (var i = 0; i < cols; i++) {
        for (var j = 0; j < rows; j++) {
            grid[i][j] = new Spot(i, j);
        }
    }

    for (var i = 0; i < cols; i++) {
        for (var j = 0; j < rows; j++) {
            grid[i][j].addNeighbours(grid);
        }
    }



    //definding the start and end of the grid
    //change this to change the start and end point
    start = grid[146][47];
    //x:1453.43 , y:640.14
    end = grid[30][63];
    //298.65 858.06


    end.show('pink');

    //adding in that the start and end can never be a wall!
    start.wall = false;
    end.wall = false;

    //opening the set
    //start searching at 0,0 and then add numbers to the end of the array i'm assuming this logic works until the end of the array?
    openSet.push(start);



}



function draw() {
    

    var current;

    if (openSet.length > 0) {

        var winner = 0;
        for (var i = 0; i < openSet.length; i++) {
            if (openSet[i].f < openSet[winner].f) {
                winner = i;
            }
        }

        current = openSet[winner];

        if (current === end) {
            console.log("DONE!");
            noLoop();

        }



        removeFromArray(openSet, current);
        //function made at bottom of code
        closedSet.push(current);

        var neighbours = current.neighbours;
        for (var i = 0; i < neighbours.length; i++) {
            var neighbour = neighbours[i];

            if (!closedSet.includes(neighbour) && !neighbour.wall) {
                var moveCost = 1;
                //adds a value onto the movements


                //lowering weighting of park if checkbox checked
                if (neighbour.park) {
                     if (greenSpaceCheckBox.elt.checked) {
                        moveCost = 0.1;
                        console.log('lower cost');
                    }
                    else{
                        console.log('high cost');
                    }
        

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

    } else {
        console.log("no path!");
        noSolution = true;
        noLoop();
        return;
    }

    // background(220);

    for (var i = 0; i < cols; i++) {
        for (var j = 0; j < rows; j++) {
            grid[i][j].show();
        }
    }

    for (var i = 0; i < closedSet.length; i++) {
        closedSet[i].show(color(255, 0, 0));
    }

    for (var i = 0; i < openSet.length; i++) {
        openSet[i].show(color(255, 91, 0));
    }

    path = [];
    var temp = current;
    if (temp) {
        path.push(temp);
        while (temp.previous) {
            path.push(temp.previous);
            temp = temp.previous;
        }
    }

    for (var i = 0; i < path.length; i++) {
        path[i].show(color(0, 0, 255));
    }
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
    text('Green Space Priority', width/2, height-100);
}



//adding a constructor function so we change stuff along the way

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

    //doesnt use a for loop as there is already a loop happening when we make the new spots using a grid

    if (dist(r, g, b, grey[0], grey[1], grey[2]) < 30) {
        // PATH
        console.log('path');
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



    //show function

    this.show = function (col) {
        let c = col;
        if (c) {
            fill(c);
        }
        else if (this.wall) {
            c = color(0);
        } else if (this.park) {
            c = color(0, 255, 0);
        } else {
            c = color(255);
        }

        fill(c);
        strokeWeight(1);
        rect(this.i * w, this.j * h, w, h);
    } //END spot function



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




//Function to remove a closedSet node from openSet array.
function removeFromArray(arr, elt) {
    for (var i = arr.length - 1; i >= 0; i--) {
        if (arr[i] === elt) {
            arr.splice(i, 1);
        }

    }
}

function heuristic(a, b) {
    //this is known as euclidiian distance uses pythag theorem
    var d = dist(a.i, a.j, b.i, b.j);
    // //absolute distance version
    // var d = abs(a.i - b.i) + abs(a.j-b.j);
    return d;
}

//this code is cooked. 