from flask import Flask, render_template, request, jsonify, make_response, redirect, url_for
import uuid
import os
import pandas as pd
import hashlib
import sys
sys.path.append('modules')
import pipeline_graph as plg
import shutil



app = Flask(__name__)
sessions={}

def purge_cache():
    shutil.rmtree('cache')


@app.route('/', methods=["GET"])
def root():
    response = make_response(redirect('/graph_editor'))
    uid=str(uuid.uuid4())
    response.set_cookie("session", uid, max_age=86400)
    sessions[uid]={'nodes':[],'task_finished':1}
    return response

@app.route('/graph_editor', methods=["GET"])
def home():
    return render_template('index.html',url=url_for('root'))

@app.route("/api/upload_graph", methods=["POST"])
def post_example():
    """POST in server"""
    data = request.get_json()
    uid=request.cookies.get('session')
    if len(data['nodes'])==len(sessions[uid]['nodes']):
        for i in range(len(data['nodes'])):
            data['nodes'][i]['content']=sessions[uid]['nodes'][i]['content']
            data['task_finished']=sessions[uid]['task_finished']
    sessions[uid]={'nodes':data['nodes'],'current_node':data['current_node'],'task_finished':data['task_finished']}
    # print(sessions[data['uid']]['nodes'])
    #print(data['execute'])
    directory_name=hashlib.sha256(uid.encode('ascii')).hexdigest()
    if data['execute'] != -1:
        graph=plg.parse_graph(data['nodes'],directory_name)
        graph[data['execute']].execute()
        for i in range(len(graph)):
            content_str=str(graph[i].content)
            if content_str != 'None':
                sessions[uid]['nodes'][graph[i].id]['content']=content_str
        #sessions[uid]['nodes'][data['execute']]['content']=result
        sessions[uid]['task_finished']=1
        #print(sessions[uid])
    return jsonify(message="POST request returned")

@app.route("/api/upload_file", methods=["POST"])
def post_file():
    """POST in server"""
    uid=request.cookies.get('session')
    file = request.files.get('file')
    file_ext=file.filename.split(".")[-1]
    file_cont=file.read()
    current_node=sessions[uid]['current_node']
    directory_name=hashlib.sha256(uid.encode('ascii')).hexdigest()
    if not os.path.exists(f'cache/{directory_name}'):
        os.makedirs(f'cache/{directory_name}')
    with open(f'cache/{directory_name}/{current_node}.{file_ext}', 'wb') as f:
        f.write(file_cont)
    # print(str(plg.ImportDF(f'cache/{directory_name}/{current_node}.{file_ext}').execute()))
    # test=pd.read_csv(f'temp/{directory_name}/{current_node}.{file_ext}')
    sessions[uid]['nodes'][current_node]['content']=str(plg.ImportDF(f'cache/{directory_name}/{current_node}.{file_ext}').execute())
    sessions[uid]['nodes'][current_node]['settings']={'file_ext':file_ext}
    return redirect(url_for("home"))

@app.route('/api/get_graph', methods=["GET"])
def get_graph():
    # print(sessions)
    uid=request.cookies.get('session')
    data = sessions[uid]
    #print(data)
    response = jsonify(data)
    response.headers['Content-Type'] = 'application/json'
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

if __name__ == '__main__':
    app.run(debug=True)