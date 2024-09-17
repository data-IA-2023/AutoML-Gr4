const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');  

function getRandomHexRGB() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

let isDragging = false;
let isResizing = false;
let startX, startY;

var nodes=[{pos:[10,10],inputs:[],outputs:[1,2],name:"node 1",color:getRandomHexRGB(),size:{x:150,y:80}},
{pos:[250,10],inputs:[0],outputs:[],name:"node 2",color:getRandomHexRGB(),size:{x:200,y:100}},
{pos:[250,210],inputs:[0],outputs:[3],name:"node 3",color:getRandomHexRGB(),size:{x:200,y:100}},
{pos:[500,210],inputs:[2],outputs:[],name:"node 4",color:getRandomHexRGB(),size:{x:200,y:100}}
];
var CurrentNode=0;

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
  ctx.fillText(name, x, y+16)
  drawRectangle(x, y+20, size.x, size.y, 'grey')
}

function drawAllNodes() {
  //ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgb(200, 200, 200)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (var i = 0; i < nodes.length; i++) {
    drawNode(nodes[i].pos[0], nodes[i].pos[1],nodes[i].name,nodes[i].color,"",nodes[i].size,i);
    for (var j = 0; j < nodes[i].outputs.length; j++) {
      ctx.strokeStyle = "green"; // Set stroke color to green
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(nodes[i].pos[0]+nodes[i].size.x+2, nodes[i].pos[1]+nodes[i].size.y/2+1+canvas.offsetTop); // starting point
      ctx.lineTo(nodes[nodes[i].outputs[j]].pos[0], nodes[nodes[i].outputs[j]].pos[1]+nodes[nodes[i].outputs[j]].size.y/2+1+canvas.offsetTop); // end point
      ctx.stroke();
    }

  }
  drawNode(nodes[CurrentNode].pos[0], nodes[CurrentNode].pos[1],nodes[CurrentNode].name,nodes[CurrentNode].color,"",nodes[CurrentNode].size,CurrentNode);
}

// Handle mouse events
canvas.addEventListener('mousedown', (event) => {
    startX = event.clientX - canvas.offsetLeft;
    startY = event.clientY - canvas.offsetTop;
    for (var i = 0; i < nodes.length; i++) {
      x_pos=nodes[i].pos[0];
      y_pos=nodes[i].pos[1];
      if (startX-x_pos >= 0 && startX-x_pos <= nodes[i].size.x && startY-y_pos >= 0 && startY-y_pos <= nodes[i].size.y) {
        CurrentNode=i;
        drawAllNodes()
        if (startY-y_pos <= 20) {
            isDragging = true;
        }
      }
    //   if (startX-x_pos >= nodes[i].size.x-5 && startX-x_pos <= nodes[i].size.x+5 && startY-y_pos >= nodes[i].size.y-5 && startY-y_pos <= nodes[i].size.y+5) {
    //     CurrentNode=i;
    //   }
    }
});

canvas.addEventListener('mousemove', (event) => {
    if (isDragging) {
        nodes[CurrentNode].pos[0] = event.clientX - canvas.offsetLeft;
        nodes[CurrentNode].pos[1] = event.clientY - canvas.offsetTop;
        drawAllNodes()
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});
drawAllNodes()