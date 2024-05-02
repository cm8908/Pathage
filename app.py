from flask import Flask, render_template, request, jsonify, session, redirect
import pymongo, os, uuid, logging, json
import pandas as pd

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

# @app.route('/upload', methods=['POST'])
# def upload():
#     app.logger.debug('Uploading file')
#     if 'file' not in request.files:
#         return redirect('/')
#     file = request.files['file']
#     if file and not allowed_file(file.filename):
#         app.logger.debug('File is allowed')
#         return redirect('/')
#     user_id = session.get('user_id', SESS_ID)        
#     file.save(os.path.join(app.config['UPLOAD_FOLDER'], f'{user_id}_input_coordinates.csv'))
#     # collection.insert_one({'coordinates': coordinates})
#     # inference(coordinates)

#     return redirect('/')

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
    app.logger.debug(result_tour)
    # request.coordinate
    # request.model_name
    return 'Inference done'
    

def read_coordinates(file):
    return pd.read_csv(file).to_numpy()  # only supports .csv for now


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
