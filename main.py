import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' # Suppress TF logs
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0' # Disable oneDNN optimization warnings
import cv2
import numpy as np
import tensorflow as tf
from flask import Flask, render_template, jsonify, request
from tensorflow.keras.applications.efficientnet import preprocess_input
from FixedDense import FixedDense

app = Flask(__name__, static_folder='static', template_folder='templates')

# Load model once at startup for efficiency
MODEL_PATH = './Model/effnet_0.82.h5'
if os.path.exists(MODEL_PATH):
    model = tf.keras.models.load_model(
        MODEL_PATH,
        compile=False,
        custom_objects={'FixedDense': FixedDense}
    )
else:
    model = None
    print(f"Warning: Model not found at {MODEL_PATH}")

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

def analyze(img_path):
    if model is None:
        return {"error": "Model not loaded"}
    
    img_hgt = 224
    img_wdt = 224
    class_names = ['Bird-drop', 'Clean', 'Dusty', 'Electrical-damage', 'Physical-Damage', 'Snow-Covered']
    
    img = cv2.imread(img_path)
    if img is None:
        return {"error": f"Could not load image at {img_path}"}

    # 1. Convert BGR to RGB
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # 2. Resize to model's input size
    img_resized = cv2.resize(img_rgb, (img_wdt, img_hgt))
    
    # 3. Preprocess
    input_arr = np.expand_dims(img_resized, axis=0)
    input_arr = preprocess_input(input_arr)
    
    # 4. Make prediction
    predictions = model.predict(input_arr)
    score = tf.nn.softmax(predictions[0]).numpy()
    
    predicted_index = np.argmax(predictions[0])
    predicted_class = class_names[predicted_index]
    confidence = float(score[predicted_index])
    
    return {
        "class_name": predicted_class,
        "confidence": confidence
    }

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'})

    if file:
        # Save file temporarily
        temp_path = os.path.join('static', 'temp_upload.jpg')
        if not os.path.exists('static'):
            os.makedirs('static')
        file.save(temp_path)
        
        result = analyze(temp_path)
        
        if "error" in result:
            return jsonify({'message': result["error"]})
        
        return jsonify(result)

if __name__ == '__main__':
    from waitress import serve
    print("Starting production server on http://127.0.0.1:5000")
    serve(app, host='127.0.0.1', port=5000)
