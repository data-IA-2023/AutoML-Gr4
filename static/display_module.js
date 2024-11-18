const canvas = document.getElementById('graphCanvas');
const parentElement = document.getElementById('graphDiv');
canvas.width = parentElement.clientWidth;
canvas.height = parentElement.clientHeight;
const ctx = canvas.getContext('2d');


function drawRectangle(x, y, size_x, size_y, color, zoom) {
    ctx.fillStyle = color;
    var x_temp=x;
    var y_temp=y;
    ctx.fillRect(x_temp, y_temp, Math.floor(size_x*zoom), Math.floor(size_y*zoom));
}

function drawText(text,color,size,x,y, zoom) {
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.floor(size*zoom)}px Arial`;
    var x_temp=Math.floor(x);
    var y_temp=Math.floor(y);
    ctx.fillText(text, x_temp, y_temp)
}

function drawTextBox(text,size,x,y, zoom, fill_color = 'grey', outline_color = 'black', text_color = 'black') {
  ctx.fillStyle = 'black';
  ctx.font = `bold ${Math.floor(size*zoom)}px Arial`;
  var mesure_text = ctx.measureText(text);
  var size_x=Math.floor(mesure_text.width);
  var size_y=size*zoom;
  console.log(size_y)
  drawRectangle(x,y-size_y,size_x+8, size_y+4,outline_color, 1)
  drawRectangle(x+2,y+2-size_y,size_x+4, size_y,fill_color, 1)
  drawText(text,text_color,size*zoom,x+4,y-1*zoom, 1)
}

function drawNode(x, y, zoom, name, color, content, size, id, type, node_settings) {
    // drawRectangle(x-2, y-2, size.x+4, size.y+4+20, 'black')
    var x_temp=Math.floor(x*zoom);
    var y_temp=Math.floor(y*zoom);
    if (id === currentNode) {
      drawRectangle(x_temp-2, y_temp-2, size.x*zoom+4, size.y*zoom+4+20*zoom, 'white',1)
    } else {
      drawRectangle(x_temp-2, y_temp-2, size.x*zoom+4, size.y_temp*zoom+4+20*zoom, 'black',1)
    }
    // drawRectangle(x_temp, y_temp-2, size.x+4, size.y_temp+4+20, 'black',zoom)
    drawRectangle(x_temp, y_temp, size.x*zoom, 20*zoom, color,1)
    // draw name here
    drawText(name,'white',18,x_temp+3*zoom,y_temp+17*zoom, zoom)
    if (id === currentNode) {
      drawText('▶️ execute','white',18,x_temp+(size.x-94)*zoom,(y+17)*zoom, zoom)
    }
}

let currentNode=0;

let ui_objects=[];


class UiObject {
  constructor(pos,id) {
    this.pos = pos;
    this.id=id;
  }
}

class Node extends UiObject {
  constructor(pos,id,content_arr,size) {
    super(pos,id);
    this.content_arr=content_arr;
    this.size=size
  }
  draw() {
    // for loop
    drawNode()
  }
}

console.log('test')
let zoom=1;
let cursor_pos={};
cursor_pos.x=0;
cursor_pos.y=0;

let pos={};
pos.x=40;
pos.y=40;

let size={};
size.x=200;
size.y=200;

function mainLoop()
{
  canvas.width = parentElement.clientWidth;
  canvas.height = parentElement.clientHeight;
  ctx.fillStyle = "rgb(200, 200, 200)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawTextBox('test',20,pos.x,pos.y, zoom);
  drawNode(50, 50, zoom, 'a', 'black', 'a', size, 0, 'a', 'a')
}


setInterval(mainLoop, 500);



canvas.addEventListener('mousemove', (event) => {
  cursor_pos.x=event.offsetX;
  cursor_pos.y=event.offsetY;
});


canvas.addEventListener('wheel', (event) => {
  console.log('test')
  let oldx = cursor_pos.x;
  let oldy = cursor_pos.y;
  pos.x=-cursor_pos.x+pos.x;
  pos.y=-cursor_pos.y+pos.y;
  const deltaY = event.deltaY;
  if (deltaY > 0) {
    zoom=zoom*0.95;
    pos.x=pos.x*0.95+oldx;
    pos.y=pos.y*0.95+oldy;
  } else if (deltaY < 0) {
    zoom=zoom*1.05;
    pos.x=pos.x*1.05+oldx;
    pos.y=pos.y*1.05+oldy;
  } else {
    console.log('No vertical scrolling');
  }
  mainLoop()
});


