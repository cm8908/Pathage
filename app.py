import base64
import io
from flask import Flask, render_template, request, jsonify, session, redirect
import pymongo, os, uuid, logging, json
import pandas as pd
import matplotlib.pyplot as plt

from inference.inference import Inferencer

app = Flask(__name__)
app.logger.setLevel(logging.DEBUG)
app.config['UPLOAD_FOLDER'] = 'uploads'
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])
SESS_ID = str(uuid.uuid4())

client = pymongo.MongoClient('mongodb://db:27017/')
db = client['coordinates_db']
collection = db['coordinates']

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/draw-coordinates', methods=['POST'])
def draw_coordinates():
    print(request.files)
    coordinates = read_coordinates(request.files['file'])
    plt.figure()
    plt.scatter(coordinates[:,0], coordinates[:,1], color='red')
    plt.title(f'Input coordinates for {len(coordinates)} cities')
    
    img = io.BytesIO()
    plt.savefig(img, format='png')
    img.seek(0)
    plt.close()
    plot_url = base64.b64encode(img.getvalue()).decode()
    return jsonify({'plot_url': plot_url})

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ['csv']

@app.route('/request-config', methods=['POST'])
def process_option():
    data = request.get_json()
    model_name = data['model_name']
    config = json.load(open(f'configs/{model_name}.json'))
    # app.logger.debug(config)
    return jsonify(config)
    # return jsonify({'message': 'Config file loaded successfully'})

@app.route('/inference', methods=['POST'])
def inference():
    file = request.files['file']
    model_name = request.form['model_name']
    coordinates = read_coordinates(file)
    inferencer = Inferencer(model_name)
    result_tour = inferencer.inference(coordinates)
    sorted_coordinates = coordinates[result_tour.astype(int)]
    plot_url = draw_tour(sorted_coordinates)
    return jsonify({
        'tour': result_tour.tolist(),
        'sorted_x': sorted_coordinates[:, 0].tolist(),
        'sorted_y': sorted_coordinates[:, 1].tolist(),
        'plot_url': plot_url
    })

def draw_tour(coordinates):
    plt.figure()
    plt.scatter(coordinates[:,0], coordinates[:,1], color='red')
    for i in range(len(coordinates)-1):
        xs = [coordinates[i][0], coordinates[i+1][0]]
        ys = [coordinates[i][1], coordinates[i+1][1]]
        plt.plot(xs, ys, color='black')
    plt.plot([coordinates[-1][0], coordinates[0][0]], [coordinates[-1][1], coordinates[0][1]], color='black')
    plt.title(f'Result tour for {len(coordinates)} cities')
    img = io.BytesIO()
    plt.savefig(img, format='png')
    img.seek(0)
    plt.close()
    plot_url = base64.b64encode(img.getvalue()).decode()
    return plot_url

def read_coordinates(file):
    return pd.read_csv(file).to_numpy()  # only supports .csv for now


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
