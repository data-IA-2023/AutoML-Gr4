function bakeFunction(func,arg) {
  const f = () => func(arg);
  return f
}

const window_html_static_dict={
  'empty':'',
  'import':`<button onclick='document.getElementById("fileinput").click();'>📄 Click here to import file</button>
  <form action="/api/upload_file" method="post" enctype="multipart/form-data">
  <input style="display:none;" id="fileinput" type="file" name="file" onchange="this.form.submit()" id="upload_file"/>
  </form><input type="text" class="settings"></input>`,
  
  'columns_select':''
}

function window_dynamic_html(tempnode){
  if(tempnode.type == 'import'){return window_html_static_dict[tempnode.type] + `<div class="scrollable-table">${tempnode.content}</div>`;}
  if(tempnode.type == 'columns_select'){
    let result=`<textarea class="settings">${tempnode.settings}</textarea>`;
    result += tempnode.content;
    return window_html_static_dict[tempnode.type] + result;
  }
  else{return '';}
}

function generate_settings(target,tempnode){
  tempnode.settings=target.value;
}


function GetWindowHtml(tempwindow,NodesDict,CreateWindow,deleteElement,uploadGraph,nodeid=undefined) {
  let tempnode = NodesDict[nodeid];
  console.log(tempnode.type);
  const html=`<div class="windowheader" id="${tempwindow.id}header">${nodeid} settings<button id="${tempwindow.id}close" class="closebutton">✕</button></div>
    <label>Change node type : </label><select class="typebutton">🔠 Change type</button><br>
        <option value="empty">empty</option>
        <option value="import">import data</option>
        <option value="columns_select">select columns</option>
    </select>
    <button id="${tempwindow.id}execute">▶️ Execute</button>
    <br>`
  tempwindow.innerHTML = html + window_dynamic_html(tempnode);
  var mySelect = tempwindow.querySelector('.typebutton');
  for(var i, j = 0; i = mySelect.options[j]; j++) {
    if(i.value == tempnode.type) {
        mySelect.selectedIndex = j;
        break;
    }
  }
  tempwindow.addEventListener('change', function(event) {
    //console.log(event.target.value);
    if (event.target.classList.contains('typebutton')){
      tempnode.type=event.target.value;
      console.log(tempnode.type);
      tempnode.html.innerHTML = `<div class="nodeheader" id="${tempnode.id}header">${tempnode.id} | ${event.target.value}</div>
      <button id="${tempnode.id}button">⚙️ Settings</button>`;
      document.getElementById(tempnode.id+'button').addEventListener("mousedown", bakeFunction(CreateWindow,{pos:{x:200,y:100},nodeid:tempnode.id}));
      tempwindow.innerHTML=html+window_dynamic_html(tempnode);
      document.getElementById(tempwindow.id+'close').addEventListener("mouseup", function(e) {
        var e = e || window.event;
        var btnCode = e.button;
        if (btnCode === 0) {
          deleteElement(tempwindow);
        }
      });
      var mySelect = tempwindow.querySelector('.typebutton');
      for(var i, j = 0; i = mySelect.options[j]; j++) {
        if(i.value == tempnode.type) {
            mySelect.selectedIndex = j;
            break;
        }
      }
      uploadGraph();
    }
    if (event.target.classList.contains('settings')){
      generate_settings(event.target,tempnode);
      console.log(tempnode.settings);
      uploadGraph();
    }
  });
  return tempwindow
}


export default GetWindowHtml