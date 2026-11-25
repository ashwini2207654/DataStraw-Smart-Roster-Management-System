
from flask import Flask, jsonify
from flask_cors import CORS

from routes.api import api

app = Flask(__name__)

# Allow React frontend to communicate with Flask
CORS(app)

# Register API routes
app.register_blueprint(api, url_prefix="/api")


@app.route("/")
def home():
    return jsonify({
        "status": "success",
        "message": "Welcome to DataStraw Smart Roster Management System!",
        "version": "1.0.0"
    })


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
