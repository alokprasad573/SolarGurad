import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' # Suppress TF logs
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0' # Disable oneDNN optimization warnings
import cv2
import numpy as np
import tensorflow as tf
from flask import Flask, render_template, jsonify, request
from keras.applications.efficientnet import preprocess_input
from FixedDense import FixedDense

app = Flask(__name__, static_folder='static', template_folder='templates')

# Load model once at startup for efficiency
MODEL_PATH = './Model/effnetV2B00.80.h5'
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

def analyze(img):
    if model is None:
        return {"error": "Model not loaded"}
    
    img_hgt = 224
    img_wdt = 224
    class_names = ['Bird-drop', 'Clean', 'Dusty', 'Electrical-damage', 'Physical-Damage', 'Snow-Covered']
    
    if img is None:
        return {"error": "Invalid image data"}

    # 1. Convert BGR to RGB
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # 2. Resize to model's input size
    img_resized = cv2.resize(img_rgb, (img_wdt, img_hgt))
    
    # 3. Preprocess
    input_arr = np.expand_dims(img_resized, axis=0).astype('float32')
    input_arr = preprocess_input(input_arr)
    
    # 4. Make prediction
    predictions = model.predict(input_arr, verbose=0)
    predicted_idx = np.argmax(predictions[0])
    predicted_class = class_names[predicted_idx]
    confidence = round(float(predictions[0][predicted_idx] * 100), 2)
    
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
        # Read file into memory and decode
        file_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        
        result = analyze(img)
        
        if "error" in result:
            return jsonify({'message': result["error"]})
        
        return jsonify(result)

if __name__ == '__main__':
    from waitress import serve
    # Get port from environment variable for Render, default to 5000 for local
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting production server on http://0.0.0.0:{port}")
    serve(app, host='0.0.0.0', port=port)
