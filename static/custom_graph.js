const canvas = document.getElementById('graphCanvas');
const parentElement = document.getElementById('graphDiv');
const parentWidth = parentElement.clientWidth;
const parentHeight = parentElement.clientHeight;
canvas.width = parentWidth;
canvas.height = parentHeight;
const ctx = canvas.getContext('2d');

function getRandomHexRGB() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function euclideanNorm(arr) {
    return Math.sqrt(arr.reduce((acc, val) => acc + val * val, 0));
}

function sumArray(arr) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i];
    }
    return sum;
}

function termByTermSum(vec1, vec2) {
    const result = [];
    for (let i = 0; i < vec1.length; i++) {
      result.push(vec1[i] + vec2[i]);
    }
    return result;
}

function termByTermMult(vec1, vec2) {
    const result = [];
    for (let i = 0; i < vec1.length; i++) {
      result.push(vec1[i] * vec2[i]);
    }
    return result;
}

let isDragging = false;
let isResizing = false;
let isDraggingSpace = false;
// let relativeX, relativeY;
let startX, startY;
let x_pos, y_pos;
let fixedPosArr = [];

var nodes=[{pos:[10,10],inputs:[],outputs:[1,2],name:"node 1",color:getRandomHexRGB(),size:{x:200,y:100}},
{pos:[250,10],inputs:[0],outputs:[],name:"node 2",color:getRandomHexRGB(),size:{x:200,y:100}},
{pos:[250,210],inputs:[0],outputs:[3],name:"node 3",color:getRandomHexRGB(),size:{x:200,y:100}},
{pos:[500,210],inputs:[2],outputs:[],name:"node 4",color:getRandomHexRGB(),size:{x:200,y:100}}
];
var CurrentNode=0;
let voidClick;

for (var i = 0; i < nodes.length; i++) {
    fixedPosArr.push(nodes[i].pos);
}

// Draw a rectangle
function drawRectangle(x, y, size_x, size_y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size_x, size_y);
}

function drawNode(x, y, name, color, content, size, id) {
  drawRectangle(x-2, y-2, size.x+4, size.y+4+20, 'black')
  if (id === CurrentNode) {
    drawRectangle(x-2, y-2, size.x+4, size.y+4+20, 'white')
  } else {
    drawRectangle(x-2, y-2, size.x+4, size.y+4+20, 'black')
  }
  drawRectangle(x, y, size.x, 20, color)
  ctx.fillStyle = "rgb(255, 255, 255)";
  ctx.font = "bold 18px Arial";
  ctx.fillText(name, x+2, y+16)
  drawRectangle(x, y+20, size.x, size.y, 'grey')
  drawRectangle(x+size.x-10, y+20+size.y-10, 10, 10, 'black')
}

function drawAllNodes() {
  //ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgb(200, 200, 200)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (var i = 0; i < nodes.length; i++) {
    if (i != CurrentNode) {
        drawNode(nodes[i].pos[0], nodes[i].pos[1],nodes[i].name,nodes[i].color,"",nodes[i].size,i);
    }
    for (var j = 0; j < nodes[i].outputs.length; j++) {
      ctx.strokeStyle = "green"; // Set stroke color to green
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(nodes[i].pos[0]+nodes[i].size.x+2, nodes[i].pos[1]+nodes[i].size.y/2+1+10); // starting point
      ctx.lineTo(nodes[nodes[i].outputs[j]].pos[0], nodes[nodes[i].outputs[j]].pos[1]+nodes[nodes[i].outputs[j]].size.y/2+1+10); // end point
      ctx.stroke();
    }

  }
  drawNode(nodes[CurrentNode].pos[0], nodes[CurrentNode].pos[1],nodes[CurrentNode].name,nodes[CurrentNode].color,"",nodes[CurrentNode].size,CurrentNode);
}

function drawContext(x,y) {
    drawRectangle(x-2, y-2, 154, 204, 'black')
    drawRectangle(x, y, 150, 200, 'grey')
}

// Handle mouse events
canvas.addEventListener('mousedown', (event) => {
    startX = event.clientX - canvas.offsetLeft;
    startY = event.clientY - canvas.offsetTop;
    voidClick=true;
    for (var i = 0; i < nodes.length; i++) {
      x_pos=nodes[i].pos[0];
      y_pos=nodes[i].pos[1];
      fixedPosArr[i]=[startX-x_pos,startY-y_pos];
      if (startX-x_pos >= 0 && startX-x_pos <= nodes[i].size.x && startY-y_pos >= 0 && startY-y_pos <= nodes[i].size.y+20) {
        CurrentNode=i;
        voidClick=false;
        relativeX = startX-x_pos;
        relativeY = startY-y_pos;
        if (relativeY <= 20) {
            isDragging = true;
        }
        if (relativeX >= nodes[CurrentNode].size.x-10 && relativeY >= nodes[CurrentNode].size.y-10) {
            isResizing = true;
        }
      }
      for (var j = 0; j < nodes[i].outputs.length; j++) {
        pos1=[nodes[i].pos[0]+nodes[i].size.x+2, nodes[i].pos[1]+nodes[i].size.y/2+1+10];
        pos2=[nodes[nodes[i].outputs[j]].pos[0], nodes[nodes[i].outputs[j]].pos[1]+nodes[nodes[i].outputs[j]].size.y/2+1+10];
        vec=termByTermSum(pos2,[-pos1[0],-pos1[1]]);
        mouse_vec=termByTermSum([startX,startY],[-pos1[0],-pos1[1]]);
        if (sumArray(termByTermMult(vec,mouse_vec))/euclideanNorm(vec)/euclideanNorm(mouse_vec)>0.9999 && startX<=pos2[0]) {
            voidClick=false;
            drawContext(startX,startY)
        }
      }
    }
    if (voidClick) {
        // drawContext(0,0)
        isDraggingSpace=true;
        drawAllNodes()
    }
});

canvas.addEventListener('mousemove', (event) => {
    if (isDragging) {
        nodes[CurrentNode].pos[0] = event.clientX - canvas.offsetLeft - fixedPosArr[CurrentNode][0];
        nodes[CurrentNode].pos[1] = event.clientY - canvas.offsetTop - fixedPosArr[CurrentNode][1];
        drawAllNodes()
    }
    if (isDraggingSpace) {
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].pos[0] = event.clientX - canvas.offsetLeft - fixedPosArr[i][0];
            nodes[i].pos[1] = event.clientY - canvas.offsetTop - fixedPosArr[i][1];
        }
        drawAllNodes()
    }
    if (isResizing) {
        nodes[CurrentNode].size.x = event.clientX - canvas.offsetLeft-nodes[CurrentNode].pos[0];
        nodes[CurrentNode].size.y = event.clientY - canvas.offsetTop-nodes[CurrentNode].pos[1]-20;
        if (nodes[CurrentNode].size.x < 80) {
            nodes[CurrentNode].size.x=80
        }
        if (nodes[CurrentNode].size.y < 50) {
            nodes[CurrentNode].size.y=50
        }
        drawAllNodes()
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
    isDraggingSpace = false;
});

drawAllNodes()