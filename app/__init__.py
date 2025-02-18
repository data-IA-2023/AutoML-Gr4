from flask import Flask
from app.views import user_blueprint

def create_app(config={"TESTING": False}):
    app = Flask(__name__)
    app.config.from_mapping(config)
    app.register_blueprint(user_blueprint)
    return app
