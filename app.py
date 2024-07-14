import sys
from web_utils import *
from flask import Flask, render_template, request, jsonify, session, redirect
import pymongo, os, uuid, logging, json
import matplotlib.pyplot as plt
import plotly.graph_objs as go
import plotly

from inference import Inferencer
from utils import *

app = JsonApp(Flask(__name__))
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

@app.route('/request-config', methods=['POST'])
def process_option():
    data = request.get_json()
    model_name = data['model_name']
    config = json.load(open(f'configs/{model_name}.json'))
    return jsonify(config)

# @app.route('/request-config-options', methods=['POST'])
# def process_config_options():
#     data = request.get_json()
#     model_name = data['model_name']
#     config_key = data['config_key']
#     selectable_options = MODEL_DICT[model_name]['selectable_options']
#     print(selectable_options[config_key](), file=sys.stderr)
#     return jsonify({'config_options': selectable_options[config_key]()})
    
    

@app.route('/inference', methods=['POST'])
def inference():
    coordinates = json.loads(request.form['coordinates'])
    if coordinates['x'] == [] or coordinates['y'] == [] or\
        len(coordinates['x']) != len(coordinates['y']):
        raise ValueError('Invalid data: x or y coordinates are empty or have different lengths')
    
    coordinates = coordinates_from_dict(coordinates)
    model_name = request.form['model_name']
    model_config = json.loads(request.form['config']) 

    inferencer = Inferencer(model_name, model_config)
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
    app.run(host='0.0.0.0', port=5000, debug=False)
