import base64
import io
from flask import Flask, render_template, request, jsonify, session, redirect
import pymongo, os, uuid, logging, json
import matplotlib.pyplot as plt
import plotly.graph_objs as go
import plotly

from inference import Inferencer
from utils import *

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
    coordinates = read_coordinates(request.files['file'])
    fig = go.Figure(data=go.Scatter(x=coordinates[:,0], y=coordinates[:,1], mode='markers',
                                    marker=dict(size=10, color='red')),
                    layout=go.Layout(title=f'Input coordinates for {len(coordinates)} cities'))
    graph_json = json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
    return jsonify({'graph': graph_json})
    # plt.figure()
    # plt.scatter(coordinates[:,0], coordinates[:,1], color='red')
    # plt.title(f'Input coordinates for {len(coordinates)} cities')
    
    # img = io.BytesIO()
    # plt.savefig(img, format='png')
    # img.seek(0)
    # plt.close()
    # plot_url = base64.b64encode(img.getvalue()).decode()
    # return jsonify({'plot_url': plot_url})


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
    graph_json = draw_tour(sorted_coordinates)
    return jsonify({
        'tour': result_tour.tolist(),
        'sorted_x': sorted_coordinates[:, 0].tolist(),
        'sorted_y': sorted_coordinates[:, 1].tolist(),
        'graph': graph_json
    })


@app.route('/model-options', methods=['POST'])
def model_options():
    return jsonify({'model_options': sorted([os.path.splitext(fname)[0] for fname in os.listdir('configs')])})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
