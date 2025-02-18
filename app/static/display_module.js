const canvas = document.getElementById('graphCanvas');
const parentElement = document.getElementById('graphDiv');
canvas.width = parentElement.clientWidth;
canvas.height = parentElement.clientHeight;
const ctx = canvas.getContext('2d');

function getRandomHexRGB() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function drawRectangle(x, y, size_x, size_y, color, zoom=1) {
  ctx.fillStyle = color;
  var x=Math.floor(x);
  var y=Math.floor(y);
  ctx.fillRect(x, y, Math.floor(size_x*zoom), Math.floor(size_y*zoom));
}

function drawText(text,color,size,x,y, zoom, translate={x:0,y:0}) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px Arial`;
  ctx.translate(translate.x+x, translate.y+y);
  ctx.scale(zoom, zoom);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawTextBox(text,size,x,y, zoom, fill_color = 'grey', outline_color = 'black', text_color = 'black', overide_width=-1) {
  var x=Math.floor(x);
  var y=Math.floor(y);
  ctx.fillStyle = 'black';
  ctx.font = `bold ${size}px Arial`;
  if (overide_width == -1) {
    var mesure_text = ctx.measureText(text);
    var size_x=Math.floor(mesure_text.width*zoom);
  } else {
    var size_x=overide_width*zoom;
  }
  var size_y=Math.floor(size*zoom);
  drawRectangle(x,y,size_x+4+4*zoom, size_y+4+4*zoom,outline_color);
  drawRectangle(x+2,y+2,size_x+4*zoom, size_y+4*zoom,fill_color);
  drawText(text,text_color,size,x,y, zoom,{x:4*zoom,y:size_y});
}

function drawNode(x, y, zoom, name, color, size, id, selected) {
  var x=Math.floor(x);
  var y=Math.floor(y);
  var int_zoom=Math.floor(20*zoom);
  if (id === selected) {
    drawRectangle(x-2, y-2, size.x*zoom+4, size.y*zoom+4+int_zoom, 'white')
  } else {
    drawRectangle(x-2, y-2, size.x*zoom+4, size.y*zoom+4+int_zoom, 'black')
  }
  // drawRectangle(x_temp, y_temp-2, size.x+4, size.y_temp+4+20, 'black',zoom)
  drawRectangle(x, y, size.x*zoom, int_zoom, color,1)
  drawRectangle(x, y+int_zoom, size.x*zoom, size.y*zoom, 'grey')
  // draw name here
  drawText(name,'white',18,x+3*zoom,y+17*zoom, zoom)
  if (id === selected) {
    drawText('▶️ execute','white',18,x+(size.x-94)*zoom,y+17*zoom, zoom)
  }
}

function drawContext(x,y,options,zoom=1) {
  var width=0;
  ctx.font = "bold 18px Arial";
  for (const option in options) {
    width=Math.max(ctx.measureText(option).width,width);
  }
  width=width+4;
  for (var i = 0; i < options.length; i++) {
    if ((i)%2 === 0){
      drawTextBox(options[i],16,x,y+20*i*zoom,zoom,'grey','black','white',width);
      if (i!=0) {drawRectangle(x+2,y+20*i*zoom,(width+4)*zoom,2,'grey');}
    } else {
      drawTextBox(options[i],16,x,y+20*i*zoom,zoom,'rgb(140,140,140)','black','white',width);
      drawRectangle(x+2,y+20*i*zoom,(width+4)*zoom,2,'rgb(140,140,140)');
    }
  }
  return width+4
}

function combineFunctions(param) {
  var L=[];
  for (var i=0; i<param.func.length;i++) {
    L.push(param.func[i](param.args[i]));
  }
  return L
}

function bakeFunction(func,arg) {
  const f = () => func(arg);
  return f
}

class UiElement {
  static debug=false;
  static Elements = {};
  static globalZoom = 1;
  // static globalPos = {x:0,y:0};
  static cursorPos = {x:0,y:0};
  static Nodes = {};
  static currentNode=0;
  static fixedPosArr={};
  static isMoving = false;

  constructor(pos) {
    this.pos = pos;
    this.id = 0;
    for (const key in UiElement.Elements){
      this.id = Math.max(this.id,key);
    }
    this.id=this.id+1;
    this.rel_pos={};
    this.action = () => null;
    UiElement.Elements[this.id]=this;
    this.children=[];
  }
  static mousemove(event) {
    this.cursorPos.x=event.offsetX;
    this.cursorPos.y=event.offsetY;
  }
  static wheel(event) {
    const deltaY = event.deltaY;
    if (deltaY > 0) {
      this.globalZoom=this.globalZoom*0.95;
    } else if (deltaY < 0) {
      this.globalZoom=this.globalZoom*1/0.95;
    } else {
      console.log('No vertical scrolling');
    }
    for (const key in this.Elements) {
      var element = this.Elements[key];
      if (element.rel_pos!={}) {
        let oldx = this.cursorPos.x;
        let oldy = this.cursorPos.y;
        element.pos.x=element.pos.x-oldx;
        element.pos.y=element.pos.y-oldy;
        if (deltaY > 0) {
          element.pos.x=element.pos.x*0.95+oldx;
          element.pos.y=element.pos.y*0.95+oldy;
        } else if (deltaY < 0) {
          element.pos.x=element.pos.x*1/0.95+oldx;
          element.pos.y=element.pos.y*1/0.95+oldy;
        } else {
          console.log('No vertical scrolling');
        }
      }
    }
  }
  static startMoveAll(event) {
    this.isMoving = true;
    for (const key in this.Elements) {
      var element = this.Elements[key];
      var startX = event.clientX - canvas.offsetLeft;
      var startY = event.clientY - canvas.offsetTop;
      this.fixedPosArr[key]={x:startX-element.pos.x,y:startY-element.pos.y};
    }
  }
  static moveAll(event) {
    if (this.isMoving === true) {
      for (const key in this.Elements) {
        var element = this.Elements[key];
        element.pos.x = event.clientX - canvas.offsetLeft - this.fixedPosArr[key].x;
        element.pos.y = event.clientY - canvas.offsetTop - this.fixedPosArr[key].y;
      }
      this.drawAll();
    }
  }
  static drawAll() {
    canvas.width = parentElement.clientWidth;
    canvas.height = parentElement.clientHeight;
    ctx.fillStyle = "rgb(200, 200, 200)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const key in this.Elements) {
      this.Elements[key].draw();
    }
  }
  static testIntersections() {
    var intersection_list=[];
    for (const key in this.Elements) {
      if (this.Elements[key].intersect(UiElement.cursorPos)) {
        intersection_list.push(this.Elements[key]);
      }
    }
  }
  static destroy(id) {
    for (const i in UiElement.Elements[id].children) {
      delete UiElement.Elements[UiElement.Elements[id].children[i]];
    }
    delete UiElement.Elements[id];
    UiElement.drawAll();
  }
}

class HitBox extends UiElement {
  constructor(pos,size,args=null) {
    super(pos);
    this.size=size;
    this.args=args;
  }
  draw() {
    if (UiElement.debug) {
      drawRectangle(this.pos.x,this.pos.y,this.size.x,this.size.y,'red',UiElement.globalZoom);
    }
  }
  intersect(cursor_pos) {
    if (cursor_pos.x>=this.pos.x && cursor_pos.x <= this.pos.x+this.size.x*UiElement.globalZoom) {
      if (cursor_pos.y>this.pos.y && cursor_pos.y <= this.pos.y+this.size.y*UiElement.globalZoom+1) {
        console.log('hitbox clicked');
        this.action(this.args);
        return true;
      }
    }
  }
}

class TextElement extends UiElement {
  constructor(pos,content,size,color) {
    super(pos);
    this.content=content;
    this.size=size;
    this.color=color;
  }
  draw() {
    drawText(this.content,this.color,this.size,this.pos.x,this.pos.y,UiElement.globalZoom);
  }
  intersect(cursorPos) {
    return false
  }
}

class TextBox extends UiElement {
  constructor(pos,content,size) {
    super(pos);
    this.content=content;
    this.size=size;
  }
  draw() {
    drawTextBox(this.content,this.size,this.pos.x,this.pos.y,UiElement.globalZoom);
  }
  intersect(cursor_pos) {
    ctx.font = `bold ${this.size}px Arial`;
    var mesure_text = ctx.measureText(this.content);
    var size_x=Math.floor(mesure_text.width*UiElement.globalZoom);
    if (cursor_pos.x>=this.pos.x && cursor_pos.x <= this.pos.x+size_x+4*UiElement.globalZoom+4) {
      if (cursor_pos.y>=this.pos.y && cursor_pos.y <= this.pos.y+(this.size+4)*UiElement.globalZoom+4) {
        console.log('text box clicked');
        this.action();
        return true;
      }
    }
  }
}

class ContextMenu extends UiElement {
  constructor(pos,options,functions,args_list=null) {
    super(pos);
    this.options=options;
    this.children=[];
    if (args_list == null) {
      this.args_list=[]
      for (var i=0; i<functions.length;i++) {
        this.args_list.push(null);
      }
    } else {
      this.args_list=args_list;
    }
    for (var i = 0; i < this.options.length; i++) {
      let temp=new HitBox(pos,{x:0,y:20});
      temp.rel_pos={x:0,y:2+i*20};
      temp.parent=this.id;
      this.children.push(temp.id);
      temp.args={func:[UiElement.destroy,functions[i]],args:[this.id,this.args_list[i]]};
      temp.action=bakeFunction(combineFunctions,temp.args);
    }
  }
  draw() {
    var width=drawContext(this.pos.x,this.pos.y,this.options,UiElement.globalZoom);
    for (const id of this.children) {
      //console.log(this)
      var child=UiElement.Elements[id];
      child.pos={x:this.pos.x+child.rel_pos.x*UiElement.globalZoom,y:this.pos.y+child.rel_pos.y*UiElement.globalZoom};
      child.size.x=width;
    }
  }
  intersect(cursor_pos) {
    return false;
  }
}

class GraphNode extends UiElement {
  constructor(pos,size,name,color) {
    super(pos);
    this.children=[];
    this.size=size;
    this.name=name;
    this.color=color;
  }
  destroy() {
    console.log('deletion');
    for (var id in this.children) {
      UiElement.Elements[id].destroy();
    }
    delete this;
  }
  draw() {
    for (const id of this.children) {
      var child=UiElement.Elements[id];
      child.pos={x:this.pos.x+child.rel_pos.x*UiElement.globalZoom,y:this.pos.y+child.rel_pos.y*UiElement.globalZoom};
    }
    drawNode(this.pos.x, this.pos.y, UiElement.globalZoom, this.name, this.color, this.size, this.node_id, UiElement.currentNode);
  }
  addElement(element,rel_pos) {
    element.rel_pos=rel_pos;
    this.children.push(element.id);
  }
  intersect(cursor_pos) {
    return false
  }
}

function mainLoop()
{
  UiElement.drawAll();
}

setInterval(mainLoop, 1000);

canvas.addEventListener('mousemove', (event) => {
  UiElement.mousemove(event);
  UiElement.moveAll(event);
});


canvas.addEventListener('wheel', (event) => {
  UiElement.wheel(event);
  mainLoop();
});

canvas.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});

canvas.addEventListener('mousedown', (event) => {
  if (event.button===2){
    console.log('right click');
  } else if (event.button===0) {
    console.log('left click');
    UiElement.testIntersections();
    UiElement.startMoveAll(event);
  } else if (event.button===1){
    console.log('middle click');
  }
});

canvas.addEventListener('mouseup', () => {
  UiElement.isMoving = false;
});

// Add ui elements here :
new TextBox({x:200,y:40},'test',50);
new TextBox({x:200,y:400},'test',200);

let node1 = new GraphNode({x:100,y:100},{x:270,y:50},'node 1',getRandomHexRGB());
node1.addElement(new TextElement({},'This text is linked to node 1.',18,'white'),{x:2,y:36});
node1.addElement(new TextBox({},'This box is linked to node 1.',18),{x:2,y:56});

let node2 = new GraphNode({x:500,y:500},{x:270,y:50},'node 2',getRandomHexRGB());
node2.addElement(new TextBox({},'This box is linked to node 2.',18),{x:2,y:56});

function func(a) {
  console.log(a);
}

var a = new ContextMenu({x:0,y:700},['a','b','c'],[func,func,func],[1,2,3]);
var b = new ContextMenu({x:500,y:700},['a','b','c'],[func,func,func],[1,2,3]);



UiElement.debug=true;

mainLoop();
