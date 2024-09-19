from flask import Flask, render_template, request, jsonify, make_response, redirect, url_for
import uuid

app = Flask(__name__)
sessions={}

@app.route('/', methods=["GET"])
def root():
    response = make_response(redirect('/home'))
    uid=str(uuid.uuid4())
    response.set_cookie("session", uid, max_age=3600)
    sessions[uid]={'nodes':[]}
    return response

@app.route('/home', methods=["GET"])
def home():
    return render_template('index.html',url=url_for('root'))

@app.route("/api/graph", methods=["POST"])
def post_example():
    """POST in server"""
    data = request.get_json()
    sessions[data['uid']]={'nodes':data['nodes'],'current_node':data['current_node']}
    return jsonify(message="POST request returned")

@app.route('/data/get_graph/<uid>', methods=["GET"])
def get_graph(uid):
    print(sessions)
    data = sessions[uid]
    response = jsonify(data)
    response.headers['Content-Type'] = 'application/json'
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

if __name__ == '__main__':
    app.run(debug=True)