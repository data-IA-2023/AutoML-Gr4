const canvas = document.getElementById('graphCanvas');
const parentElement = document.getElementById('graphDiv');
canvas.width = parentElement.clientWidth;
canvas.height = parentElement.clientHeight
const ctx = canvas.getContext('2d');

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

const session_uid = getCookie('session');
const currentPageUrl = window.location.href;
const rootUrl = currentPageUrl.split('/')[2];

var currentNode=0;
var task_finished=1;

function defineSessionData(data) {
  nodes=data.nodes;
  currentNode=data.current_node;
  task_finished=data.task_finished;
  //console.log(data.task_finished)
  drawAllNodes()
}

// console.log(rootUrl);

var nodes=[];

var refreshInterval = 300000;
let refreshTimer;

function fetchData() {
  fetch('/api/get_graph')
    .then((response) => response.json())
    .then((data) => {
      defineSessionData(data);
      clearInterval(refreshTimer);
      refreshTimer = setInterval(fetchData, refreshInterval);
      refreshInterval=refreshInterval*2;
      //console.log(task_finished);
      if (refreshInterval > 300000 || task_finished === 1) {
        refreshInterval = 300000;
      }
      //console.log(refreshInterval);
    })
    .catch((error) => {
      // Handle errors
      console.error('Error fetching data:', error);
    });
}

fetchData()

function uploadGraph(node_execute) {
  if (nodes.length != 0) {
    //console.log(task_finished)
    fetch('/api/upload_graph', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({nodes:nodes,uid:session_uid,current_node:currentNode,execute:node_execute,task_finished:task_finished})
    })
    .then(response => response.json())
    .then(data => console.log(data));
  }
}

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
let isMakingConection = false;
// let relativeX, relativeY;
let startX, startY;
let x_pos, y_pos;
let fixedPosArr = [];
let contextBox = [];
let contextActions = [[]];
let nodeToBeDeleted = -1;

let voidClick;

for (var i = 0; i < nodes.length; i++) {
    fixedPosArr.push(nodes[i].pos);
}

// Draw a rectangle
function drawRectangle(x, y, size_x, size_y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size_x, size_y);
}

function drawNode(x, y, name, color, content, size, id, type, node_settings) {
  // drawRectangle(x-2, y-2, size.x+4, size.y+4+20, 'black')
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
  if (id === currentNode) {
    ctx.fillStyle = "white";
    ctx.font = "bold 18px Arial";
    ctx.fillText('▶️', x+size.x-94, y+17)
    ctx.fillText('execute', x+size.x-72, y+16)
  }
  switch (type) {
    case 'source':
      drawRectangle(x+10, y+30, 140, 24, 'black')
      drawRectangle(x+12, y+32, 136, 20, 'grey')
      ctx.fillStyle = "white";
      ctx.font = "bold 18px Arial";
      ctx.fillText('Choose source', x+14, y+48)
      content_array=content.split("\n");
      ctx.font = "bold 18px Courier New";
      var content_width=0;
      for (var i=0; i<content_array.length; i++) {
        content_width=Math.max(ctx.measureText(content_array[i]).width,content_width);
      }
      // console.log(content_width)
      content_width=Math.floor(content_width);
      drawRectangle(x+10, y+60, content_width+8, 20*content_array.length+4, 'black')
      for (var i=0; i<content_array.length; i++) {
        if ((i)%2 === 0) {
          drawRectangle(x+12, y+62+20*i, content_width+4, 20, 'white')
        } else {
          drawRectangle(x+12, y+62+20*i, content_width+4, 20, 'rgb(240, 240, 240)')
        }
      }
      //drawRectangle(x+12, y+62, content_width+4, 20*content_array.length, 'white')
      ctx.fillStyle = "black";
      for (var i=0; i<content_array.length; i++) {
        ctx.fillText(content_array[i], x+14, y+78+i*20)
      }
      // ctx.fillText(nodes[id].content, x+14, y+68)
      break;
    case 'filter':
      drawRectangle(x+10, y+30, 140, 24, 'black')
      drawRectangle(x+12, y+32, 136, 20, 'grey')
      ctx.fillStyle = "white";
      ctx.fillText('Set filter', x+14, y+48)
      var settings_width=Math.floor(ctx.measureText(node_settings).width);
      drawRectangle(x+10,y+56,settings_width+8,24,'black')
      drawRectangle(x+12,y+58,settings_width+4,20,'grey')
      ctx.font = "bold 18px Arial";
      ctx.fillStyle = "white";
      ctx.fillText(node_settings, x+14, y+74)
      content_array=content.split("\n");
      ctx.font = "bold 18px Courier New";
      var content_width=0;
      for (var i=0; i<content_array.length; i++) {
        content_width=Math.max(ctx.measureText(content_array[i]).width,content_width);
      }
      // console.log(content_width)
      content_width=Math.floor(content_width);
      drawRectangle(x+10, y+82, content_width+8, 20*content_array.length+4, 'black')
      for (var i=0; i<content_array.length; i++) {
        if ((i)%2 === 0) {
          drawRectangle(x+12, y+84+20*i, content_width+4, 20, 'white')
        } else {
          drawRectangle(x+12, y+84+20*i, content_width+4, 20, 'rgb(240, 240, 240)')
        }
      }
      ctx.fillStyle = "black";
      for (var i=0; i<content_array.length; i++) {
        ctx.fillText(content_array[i], x+14, y+100+i*20)
      }
      break;
    case 'columns_select':
      drawRectangle(x+10, y+30, 140, 24, 'black')
      drawRectangle(x+12, y+32, 136, 20, 'grey')
      ctx.fillStyle = "white";
      ctx.fillText('Select columns', x+14, y+48)
      var settings_width=Math.floor(ctx.measureText(node_settings).width);
      drawRectangle(x+10,y+56,settings_width+8,24,'black')
      drawRectangle(x+12,y+58,settings_width+4,20,'grey')
      ctx.font = "bold 18px Arial";
      ctx.fillStyle = "white";
      ctx.fillText(node_settings, x+14, y+74)
      content_array=content.split("\n");
      ctx.font = "bold 18px Courier New";
      var content_width=0;
      for (var i=0; i<content_array.length; i++) {
        content_width=Math.max(ctx.measureText(content_array[i]).width,content_width);
      }
      // console.log(content_width)
      content_width=Math.floor(content_width);
      drawRectangle(x+10, y+82, content_width+8, 20*content_array.length+4, 'black')
      for (var i=0; i<content_array.length; i++) {
        if ((i)%2 === 0) {
          drawRectangle(x+12, y+84+20*i, content_width+4, 20, 'white')
        } else {
          drawRectangle(x+12, y+84+20*i, content_width+4, 20, 'rgb(240, 240, 240)')
        }
      }
      ctx.fillStyle = "black";
      for (var i=0; i<content_array.length; i++) {
        ctx.fillText(content_array[i], x+14, y+100+i*20)
      }
      break;
    case 'concatenate':
      drawRectangle(x+10, y+30, 140, 24, 'black')
      drawRectangle(x+12, y+32, 136, 20, 'grey')
      drawRectangle(x+160, y+30, 140, 24, 'black')
      drawRectangle(x+162, y+32, 136, 20, 'grey')
      ctx.fillStyle = "white";
      ctx.fillText('Swap axis', x+14, y+48)
      ctx.fillText('Change join mode', x+164, y+48)
      var settings_text='axis : ' + node_settings.axis + ', join mode : ' + node_settings.join;
      var settings_width=Math.floor(ctx.measureText(settings_text).width);
      drawRectangle(x+10,y+56,settings_width+8,24,'black')
      drawRectangle(x+12,y+58,settings_width+4,20,'grey')
      ctx.font = "bold 18px Arial";
      ctx.fillStyle = "white";
      ctx.fillText(settings_text, x+14, y+74)
      content_array=content.split("\n");
      ctx.font = "bold 18px Courier New";
      var content_width=0;
      for (var i=0; i<content_array.length; i++) {
        content_width=Math.max(ctx.measureText(content_array[i]).width,content_width);
      }
      // console.log(content_width)
      content_width=Math.floor(content_width);
      drawRectangle(x+10, y+82, content_width+8, 20*content_array.length+4, 'black')
      for (var i=0; i<content_array.length; i++) {
        if ((i)%2 === 0) {
          drawRectangle(x+12, y+84+20*i, content_width+4, 20, 'white')
        } else {
          drawRectangle(x+12, y+84+20*i, content_width+4, 20, 'rgb(240, 240, 240)')
        }
      }
      ctx.fillStyle = "black";
      for (var i=0; i<content_array.length; i++) {
        ctx.fillText(content_array[i], x+14, y+100+i*20)
      }
      break;
    case 'test_train_split':
      drawRectangle(x+10, y+30, 140, 24, 'black')
      drawRectangle(x+12, y+32, 136, 20, 'grey')
      ctx.fillStyle = "white";
      ctx.fillText('Set ratio', x+14, y+48)
      var settings_text = "ratio : " + node_settings.ratio + ", order : " + node_settings.order;
      var settings_width=Math.floor(ctx.measureText(settings_text).width);
      drawRectangle(x+10,y+56,settings_width+8,24,'black')
      drawRectangle(x+12,y+58,settings_width+4,20,'grey')
      ctx.font = "bold 18px Arial";
      ctx.fillStyle = "white";
      ctx.fillText(settings_text, x+14, y+74)
      content_array=content.slice(1, -1).split(/'X_train': |'X_test': |'y_train': |'y_test': |\n|,/).splice(1);
      ctx.font = "bold 18px Courier New";
      var content_width=0;
      for (var i=0; i<content_array.length; i++) {
        content_width=Math.max(ctx.measureText(content_array[i]).width,content_width);
      }
      // console.log(content_width)
      content_width=Math.floor(content_width);
      drawRectangle(x+10, y+82, content_width+8, 20*content_array.length+4, 'black')
      for (var i=0; i<content_array.length; i++) {
        if ((i)%2 === 0) {
          drawRectangle(x+12, y+84+20*i, content_width+4, 20, 'white')
        } else {
          drawRectangle(x+12, y+84+20*i, content_width+4, 20, 'rgb(240, 240, 240)')
        }
      }
      ctx.fillStyle = "black";
      for (var i=0; i<content_array.length; i++) {
        ctx.fillText(content_array[i], x+14, y+100+i*20)
      }
      break;
    case 'kneighbors':
      break;
    default:
      console.log('Unknown node');
      break;
  }
}

function drawAllNodes() {
  //ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = parentElement.clientWidth;
  canvas.height = parentElement.clientHeight
  // contextBox = [-9999,-9999,-9999,-9999];
  ctx.fillStyle = "rgb(200, 200, 200)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (var i = 0; i < nodes.length; i++) {
    //console.log(i)
    //console.log(nodes[i].content)
    if (i != currentNode) {
        drawNode(nodes[i].pos[0], nodes[i].pos[1],nodes[i].name,nodes[i].color,nodes[i].content,nodes[i].size,i,nodes[i].type,nodes[i].settings);
    }
    for (var j = 0; j < nodes[i].outputs.length; j++) {
      // draws cennections
      ctx.strokeStyle = "green"; // Set stroke color to green
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(nodes[i].pos[0]+nodes[i].size.x+2, nodes[i].pos[1]+nodes[i].size.y/2+1+10); // starting point
      ctx.lineTo(nodes[nodes[i].outputs[j]].pos[0], nodes[nodes[i].outputs[j]].pos[1]+nodes[nodes[i].outputs[j]].size.y/2+1+10); // end point
      //drawArrow(nodes[i].pos[0]+nodes[i].size.x+2, nodes[i].pos[1]+nodes[i].size.y/2+1+10, nodes[nodes[i].outputs[j]].pos[0], nodes[nodes[i].outputs[j]].pos[1]+nodes[nodes[i].outputs[j]].size.y/2+1+10, 25)
      ctx.stroke();
    }
  }
  if (nodes.length > 0) {
    // draws selected node
    drawNode(nodes[currentNode].pos[0], nodes[currentNode].pos[1],nodes[currentNode].name,nodes[currentNode].color,nodes[currentNode].content,nodes[currentNode].size,currentNode,nodes[currentNode].type,nodes[currentNode].settings);
  }
}

function drawContext(args) {
    x=args.x;
    y=args.y;
    options=args.options;
    width=args.width;
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
    contextBox.push([x,x+width,y,y+options.length*20]);
}

function deleteConection(conection) {
  nodes[conection[0]].outputs=removeElement(nodes[conection[0]].outputs,conection[1]);
  drawAllNodes()
}

function deleteNode(node_index) {
  nodeToBeDeleted=node_index;
}

function renameNode(node_index) {
  var temp_name=prompt("Choose name :",nodes[node_index].name);
  if (temp_name!=null) {
    nodes[node_index].name=temp_name;
  }
  drawAllNodes()
  contextActions=[];
  contextBox=[];
}

function newConection(conection) {
  nodes[conection[0]].outputs.push(conection[1]);
}

function editNewConection(dummy) {
  isMakingConection = true;
  contextActions=[];
  contextBox=[];
  drawAllNodes()
}

function drawNewConection(node_index,mouse_pos) {
  drawAllNodes()
  node=nodes[node_index]
  ctx.strokeStyle = "green"; // Set stroke color to green
  ctx.lineWidth = 2;
  path_start=termByTermSum(node.pos,[node.size.x, node.size.y/2+11]);
  ctx.beginPath();
  ctx.moveTo(path_start[0],path_start[1]); // starting point
  ctx.lineTo(mouse_pos[0],mouse_pos[1]); // end point
  ctx.stroke();
}

function deleteNodeRoutine() {
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
    contextActions=[];
    contextBox=[];
    drawAllNodes()
  };
}

function changeColor(node) {
  nodes[node].color=getRandomHexRGB();
  contextActions=[]
  contextBox=[]
  drawAllNodes()
}

function newNode(dict) {
  const name=dict.name;
  const pos=dict.pos;
  const type=dict.type;
  var settings="";
  if ('settings' in dict) {
    settings=dict.settings;
  }
  nodes.push({pos:pos,outputs:[],name:name,color:getRandomHexRGB(),size:{x:200,y:100},type:type,content:"",settings:settings});
  if (nodes.length === 1) {
    currentNode=0;
  }
  contextActions=[]
  contextBox=[]
  drawAllNodes()
}

// prevent browser context menu
canvas.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});


// Handle mouse events
canvas.addEventListener('mousedown', (event) => {
    event.preventDefault();
    startX = event.clientX - canvas.offsetLeft;
    startY = event.clientY - canvas.offsetTop;
    voidClick=true;
    for (var i = 0; i < contextBox.length; i++) {
      if (startX >= contextBox[i][0] && startX <= contextBox[i][1] && startY >= contextBox[i][2] && startY <= contextBox[i][3]) {
        // Context menu
        voidClick=false;
        //console.log(contextBox)
        //console.log(contextActions[i])
        //console.log(i)
        for (var j = 0; j < contextActions[i].length; j++) {
          if (Math.floor((startY-contextBox[i][2])/20) === j) {
            contextActions[i][j][0](contextActions[i][j][1])
            break;
          }
        }
      } 
    }
    if (voidClick) {
      // contextBox = [];
      for (var i = 0; i < nodes.length; i++) {
        x_pos=nodes[i].pos[0];
        y_pos=nodes[i].pos[1];
        fixedPosArr[i]=[startX-x_pos,startY-y_pos];
        if (event.button === 2) {
          for (var j = 0; j < nodes[i].outputs.length; j++) {
            // Conection selection
            pos1=[nodes[i].pos[0]+nodes[i].size.x+2, nodes[i].pos[1]+nodes[i].size.y/2+11];
            pos2=[nodes[nodes[i].outputs[j]].pos[0], nodes[nodes[i].outputs[j]].pos[1]+nodes[nodes[i].outputs[j]].size.y/2+11];
            vec=termByTermDiff(pos2,pos1);
            mouse_vec1=termByTermDiff([startX,startY],pos1);
            proj_vec=vectorProduct(scalarProduct(mouse_vec1,vec)/euclideanNorm(vec)/euclideanNorm(vec), vec);
            ortho_vec=termByTermDiff(mouse_vec1,proj_vec);
            const tol=5;
            if (euclideanNorm(ortho_vec)<tol && (startY-tol <= Math.max(pos1[1],pos2[1])) && (startY+tol >= Math.min(pos1[1],pos2[1])) && (startX-tol <= Math.max(pos1[0],pos2[0])) && (startX+tol >= Math.min(pos1[0],pos2[0]))) {
                voidClick=false;
                drawAllNodes()
                drawContext({x:startX,y:startY,options:["🗑️ Delete conection"],width:200});
                let i_copy=JSON.parse(JSON.stringify(i));
                let j_copy=JSON.parse(JSON.stringify(nodes[i].outputs[j]));
                conection=[i_copy,j_copy];
                contextActions = [[[deleteConection,conection]]];
                
            }
          }
        }
        if (startX-x_pos >= 0 && startX-x_pos <= nodes[i].size.x && startY-y_pos >= 0 && startY-y_pos <= nodes[i].size.y+20) {
          // Node selection
          voidClick=false;
          relativeX = startX-x_pos;
          relativeY = startY-y_pos;
          if (isMakingConection && relativeX <= 10 && relativeY >= nodes[i].size.y/2+6 && relativeY <= nodes[i].size.y/2+16) {
            newConection([currentNode,i])
          }
          currentNode=i;
          drawAllNodes()
          if (relativeY <= 20) {
              if (event.button === 2) {
                contextBox=[]
                drawContext({x:startX,y:startY,options:["🎨 Change color","✏️ Rename node","🗑️ Delete node"],width:160})
                contextActions = [[[changeColor,currentNode],[renameNode,currentNode],[deleteNode,currentNode]]];
              } else if (relativeX >= nodes[currentNode].size.x-94 && relativeY <= 20) {
                // execute node
                task_finished=0;
                uploadGraph(currentNode)
                clearInterval()
                refreshInterval=500;
                fetchData()
                drawAllNodes()
              } else {
                isDragging = true;
              }
          } else if (relativeX >= nodes[currentNode].size.x-10 && relativeY >= nodes[currentNode].size.y-10) {
            // resizing  
            isResizing = true;
          } else if (relativeX >= nodes[currentNode].size.x-10 && relativeX <= nodes[currentNode].size.x && relativeY >= nodes[currentNode].size.y/2+6 && relativeY <= nodes[currentNode].size.y/2+16) {
            // add conection
            if (event.button === 2) {
              contextBox=[]
              drawContext({x:startX,y:startY,options:["➕ Add conection"],width:160});
              contextActions = [[[editNewConection,""]]];
            }
          } else {
            contextActions=[]
            contextBox=[]
          }
          var node_type=nodes[currentNode].type;
          // interact with nodes
          switch (node_type) {
            case 'source':
              if (relativeX >= 10 && relativeY>=30 && relativeX<=150 && relativeY<=54) {
                console.log("source")
                document.getElementById('upload_file').click()
                uploadGraph(-1)
              }
              break;
            case 'filter':
              if (relativeX >= 10 && relativeY>=30 && relativeX<=150 && relativeY<=54) {
                var temp_settings=prompt("Set filter settings (e.g. Age > 25 & `First Name` == 'Alex') :",nodes[currentNode].settings);
                if (temp_settings!=null) {
                  nodes[currentNode].settings=temp_settings;
                }
                uploadGraph(-1)
                drawAllNodes()
              }
              break;
            case 'columns_select':
              if (relativeX >= 10 && relativeY>=30 && relativeX<=150 && relativeY<=54) {
                var temp_settings=prompt("Select columns (e.g. Age, Country ) :",nodes[currentNode].settings);
                if (temp_settings!=null) {
                  nodes[currentNode].settings=temp_settings;
                }
                uploadGraph(-1)
                drawAllNodes()
              }
              break;
            case 'concatenate':
              if (relativeX >= 10 && relativeY>=30 && relativeX<=150 && relativeY<=54) {
                nodes[currentNode].settings.axis=1-nodes[currentNode].settings.axis;
                console.log(nodes[currentNode].settings.axis)
                uploadGraph(-1)
                drawAllNodes()
              }
              if (relativeX >= 160 && relativeY>=30 && relativeX<=300 && relativeY<=54) {
                switch (nodes[currentNode].settings.join) {
                  case 'outer':
                    nodes[currentNode].settings.join='inner';
                    break;
                  case 'inner':
                    nodes[currentNode].settings.join='left';
                    break;
                  case 'left':
                    nodes[currentNode].settings.join='right';
                    break;
                  case 'right':
                    nodes[currentNode].settings.join='outer';
                    break;
                  default:
                    console.log('Concatenation error')
                    break;
                }
                uploadGraph(-1)
                drawAllNodes()
              }
              break;
            case 'test_train_split':
              if (relativeX >= 10 && relativeY>=30 && relativeX<=150 && relativeY<=54) {
                var temp_settings=prompt("Change ratio (e.g. 0.8) :",nodes[currentNode].settings.ratio);
                if (temp_settings!=null) {
                  var lines = temp_settings.split(" : ");
                  nodes[currentNode].settings.ratio=temp_settings;
                }
                uploadGraph(-1)
                drawAllNodes()
              }
              break;
            default:
              console.log('Unknown node');
              break;
          } 
        }
      }
      isMakingConection=false;
    }
    if (voidClick) {
        drawAllNodes()
        contextActions=[]
        contextBox=[]
        if (event.button === 2) {drawContext({x:startX,y:startY,options:["➕ Add new node"],width:160});}
        else {isDraggingSpace=true;}
        contextActions = [[[drawContext,{x:startX+160,y:startY,options:["source node","filter node","columns select","concatenation","test train split"],width:140}]],
        [
          [newNode,{name:"source node",pos:[startX,startY],type:"source"}],
          [newNode,{name:"filter node",pos:[startX,startY],type:"filter"}],
          [newNode,{name:"columns selection node",pos:[startX,startY],type:"columns_select"}],
          [newNode,{name:"concatenation node",pos:[startX,startY],type:"concatenate",settings:{axis:1,join:'outer'}}],
          [newNode,{name:"test train split node",pos:[startX,startY],type:"test_train_split",settings:{ratio:0.8,order:0,rd_state:0}}]
        ]];
    }
    deleteNodeRoutine()
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
        if (nodes[currentNode].size.x < 200) {
            nodes[currentNode].size.x=200
        }
        if (nodes[currentNode].size.y < 50) {
            nodes[currentNode].size.y=50
        }
        drawAllNodes()
    }
    if (isMakingConection) {
      drawNewConection(currentNode,[event.clientX - canvas.offsetLeft,event.clientY - canvas.offsetTop])
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
    isDraggingSpace = false;
    uploadGraph(-1)
});

drawAllNodes()