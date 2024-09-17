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
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function sumArray(arr) {
    let sum = 0;
    for (var i = 0; i < arr.length; i++) {
      sum += arr[i];
    }
    return sum;
}

function euclideanNorm(arr) {
  const s_arr=[];
  for (var i = 0; i < arr.length; i++) {
    s_arr.push(arr[i]*arr[i]);
  }
  return Math.sqrt(sumArray(s_arr));
}

function termByTermSum(vec1, vec2) {
    const result = [];
    for (var i = 0; i < vec1.length; i++) {
      result.push(vec1[i] + vec2[i]);
    }
    return result;
}

function termByTermDiff(vec1, vec2) {
  const result = [];
  for (var i = 0; i < vec1.length; i++) {
    result.push(vec1[i] - vec2[i]);
  }
  return result;
}

function termByTermMult(vec1, vec2) {
    const result = [];
    for (var i = 0; i < vec1.length; i++) {
      result.push(vec1[i] * vec2[i]);
    }
    return result;
}

function scalarProduct(vec1, vec2) {
  return sumArray(termByTermMult(vec1,vec2));
}

function vectorProduct(number, vec) {
  const result = [];
  for (var i = 0; i < vec.length; i++) {
    result.push(vec[i] * number);
  }
  return result
}

function removeElement(arr, element) {
  const result = [];
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] != element) {
      result.push(arr[i]);
    }
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
let contextBox = [-9999,-9999,-9999,-9999];
let contextActions = [];
let nodeToBeDeleted = -1;

var nodes=[{pos:[10,10],outputs:[1,2],name:"node 1",color:getRandomHexRGB(),size:{x:200,y:100}},
{pos:[250,10],outputs:[],name:"node 2",color:getRandomHexRGB(),size:{x:200,y:100}},
{pos:[250,210],outputs:[3],name:"node 3",color:getRandomHexRGB(),size:{x:200,y:100}},
{pos:[500,210],outputs:[],name:"node 4",color:getRandomHexRGB(),size:{x:200,y:100}}
];
var currentNode=0;
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
  if (id === currentNode) {
    drawRectangle(x-2, y-2, size.x+4, size.y+4+20, 'white')
  } else {
    drawRectangle(x-2, y-2, size.x+4, size.y+4+20, 'black')
  }
  drawRectangle(x, y, size.x, 20, color)
  ctx.fillStyle = "rgb(255, 255, 255)";
  ctx.font = "bold 18px Arial";
  ctx.fillText(name, x+2, y+16)
  drawRectangle(x, y+20, size.x, size.y, 'grey')
  drawRectangle(x+size.x-10, y+10+size.y, 10, 10, 'black')
  drawRectangle(x-2, y+size.y/2+6, 10, 10, 'green')
  drawRectangle(x+size.x-8, y+size.y/2+6, 10, 10, 'green')
}

function drawAllNodes() {
  //ctx.clearRect(0, 0, canvas.width, canvas.height);
  contextBox = [-9999,-9999,-9999,-9999];
  ctx.fillStyle = "rgb(200, 200, 200)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (var i = 0; i < nodes.length; i++) {
    if (i != currentNode) {
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
  if (nodes.length > 0) {
    drawNode(nodes[currentNode].pos[0], nodes[currentNode].pos[1],nodes[currentNode].name,nodes[currentNode].color,"",nodes[currentNode].size,currentNode);
  }
}

function drawContext(x,y,options,width) {
    drawRectangle(x-2, y-2, width+4, options.length*20+4, 'black')
    for (var i = 0; i < options.length; i++) {
      if ((i)%2 === 0){
        drawRectangle(x, y+i*20, width, 20, 'grey')
      } else {
        drawRectangle(x, y+i*20, width, 20, "rgb(140, 140, 140)")
      }
      ctx.fillStyle = "rgb(255, 255, 255)";
      ctx.font = "bold 18px Arial";
      ctx.fillText(options[i], x+2, i*20+y+16);
    }
    contextBox = [x,x+width,y,y+options.length*20];
}

function deleteConection(conection) {
  nodes[conection[0]].outputs=removeElement(nodes[conection[0]].outputs,conection[1]);
}

function deleteNode(node_index) {
  nodeToBeDeleted=node_index;
}

function changeColor(node) {
  nodes[node].color=getRandomHexRGB();
}

function newNode(name_and_pos) {
  const name=name_and_pos.name;
  var pos=name_and_pos.pos;
  nodes.push({pos:pos,outputs:[],name:name,color:getRandomHexRGB(),size:{x:200,y:100}});
}

// Handle mouse events
canvas.addEventListener('mousedown', (event) => {
    startX = event.clientX - canvas.offsetLeft;
    startY = event.clientY - canvas.offsetTop;
    voidClick=true;
    if (startX >= contextBox[0] && startX <= contextBox[1] && startY >= contextBox[2] && startY <= contextBox[3]) {
      voidClick=false;
      for (var i = 0; i < contextActions.length; i++) {
        if (Math.floor((startY-contextBox[2])/20) === i) {
          contextActions[i][0](contextActions[i][1])
        }
      }
      drawAllNodes()
    } else {
      contextBox = [-9999,-9999,-9999,-9999];
      for (var i = 0; i < nodes.length; i++) {
        x_pos=nodes[i].pos[0];
        y_pos=nodes[i].pos[1];
        fixedPosArr[i]=[startX-x_pos,startY-y_pos];
        for (var j = 0; j < nodes[i].outputs.length; j++) {
          pos1=[nodes[i].pos[0]+nodes[i].size.x+2, nodes[i].pos[1]+nodes[i].size.y/2+1+10];
          pos2=[nodes[nodes[i].outputs[j]].pos[0], nodes[nodes[i].outputs[j]].pos[1]+nodes[nodes[i].outputs[j]].size.y/2+1+10];
          vec=termByTermDiff(pos2,pos1);
          mouse_vec1=termByTermDiff([startX,startY],pos1);
          // mouse_vec2=termByTermDiff(pos2,[startX,startY]);
          proj_vec=vectorProduct(scalarProduct(mouse_vec1,vec)/euclideanNorm(vec)/euclideanNorm(vec), vec);
          ortho_vec=termByTermDiff(mouse_vec1,proj_vec);
          const tol=5;
          if (euclideanNorm(ortho_vec)<tol && (startY-tol <= Math.max(pos1[1],pos2[1])) && (startY+tol >= Math.min(pos1[1],pos2[1])) && (startX-tol <= Math.max(pos1[0],pos2[0])) && (startX+tol >= Math.min(pos1[0],pos2[0]))) {
              voidClick=false;
              drawAllNodes()
              drawContext(startX,startY,["🗑️ Delete conection"],200);
              let i_copy=JSON.parse(JSON.stringify(i));
              let j_copy=JSON.parse(JSON.stringify(nodes[i].outputs[j]));
              conection=[i_copy,j_copy];
              contextActions = [[deleteConection,conection]];
          }
        }
        if (startX-x_pos >= 0 && startX-x_pos <= nodes[i].size.x && startY-y_pos >= 0 && startY-y_pos <= nodes[i].size.y+20) {
          currentNode=i;
          voidClick=false;
          relativeX = startX-x_pos;
          relativeY = startY-y_pos;
          drawAllNodes()
          if (relativeY <= 20) {
              isDragging = true;
              drawContext(startX,startY,["🎨 Change color","🗑️ Delete node"],160);
              contextActions = [[changeColor,currentNode],[deleteNode,currentNode]];
          } else if (relativeX >= nodes[currentNode].size.x-10 && relativeY >= nodes[currentNode].size.y-10) {
              isResizing = true;
          }
        }
      }
    }
    if (voidClick) {
        isDraggingSpace=true;
        drawAllNodes()
        drawContext(startX,startY,["➕ Add new node"],160);
        contextActions = [[newNode,{name:"new node",pos:[startX,startY]}]];
    }
    if (nodeToBeDeleted>-1) {
      nodes.splice(nodeToBeDeleted,1);
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].outputs=removeElement(nodes[i].outputs,nodeToBeDeleted);
      }
      for (var i = 0; i < nodes.length; i++) {
        for (var j = 0; j < nodes[i].outputs.length; j++) {
          if (nodes[i].outputs[j] > nodeToBeDeleted) {
            nodes[i].outputs[j]=nodes[i].outputs[j]-1;
          }
        }
      }
      nodeToBeDeleted=-1;
      currentNode=0;
      drawAllNodes()
    };
});

canvas.addEventListener('mousemove', (event) => {
    if (isDragging) {
        nodes[currentNode].pos[0] = event.clientX - canvas.offsetLeft - fixedPosArr[currentNode][0];
        nodes[currentNode].pos[1] = event.clientY - canvas.offsetTop - fixedPosArr[currentNode][1];
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
        nodes[currentNode].size.x = event.clientX - canvas.offsetLeft-nodes[currentNode].pos[0];
        nodes[currentNode].size.y = event.clientY - canvas.offsetTop-nodes[currentNode].pos[1]-20;
        if (nodes[currentNode].size.x < 80) {
            nodes[currentNode].size.x=80
        }
        if (nodes[currentNode].size.y < 50) {
            nodes[currentNode].size.y=50
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