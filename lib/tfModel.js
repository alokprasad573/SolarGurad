import * as tf from '@tensorflow/tfjs';

export const CLASS_NAMES = [
  'Bird-drop',
  'Clean',
  'Dusty',
  'Electrical-damage',
  'Physical-Damage',
  'Snow-Covered',
];

export const IMG_SIZE = 224;
export const DEFAULT_MODEL_URL =
  process.env.NEXT_PUBLIC_MODEL_URL || '/model/model.json';

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB
const ALLOWED_IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|bmp|gif|img)$/i;

let cachedModelUrl = null;
let cachedModelPromise = null;

/**
 * Validates an uploaded File before decoding it in the browser.
 * Returns { valid: true } or { valid: false, error: string }.
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }
  const hasImageMime =
    typeof file.type === 'string' && file.type.startsWith('image/');
  const hasImageExt =
    typeof file.name === 'string' && ALLOWED_IMAGE_EXTENSIONS.test(file.name);

  if (!hasImageMime && !hasImageExt) {
    return {
      valid: false,
      error: 'Unsupported file format. Please select a JPG, JPEG, or PNG image.',
    };
  }
  if (typeof file.size === 'number' && file.size === 0) {
    return { valid: false, error: 'Selected image file is empty.' };
  }
  if (typeof file.size === 'number' && file.size > MAX_IMAGE_BYTES) {
    return {
      valid: false,
      error: 'Image file is too large. Please select an image under 20 MB.',
    };
  }
  return { valid: true };
}

/**
 * Converts a 6-element softmax probability vector into the API result object.
 */
export function formatPrediction(scores) {
  if (!scores || scores.length !== CLASS_NAMES.length) {
    throw new Error(
      `Unexpected model output length: expected ${CLASS_NAMES.length}, got ${scores ? scores.length : 0}.`
    );
  }

  let predictedIdx = 0;
  let maxScore = -Infinity;
  for (let i = 0; i < scores.length; i += 1) {
    const val = Number(scores[i]);
    if (!Number.isFinite(val)) {
      throw new Error('Model returned non-finite prediction scores.');
    }
    if (val > maxScore) {
      maxScore = val;
      predictedIdx = i;
    }
  }

  return {
    class_name: CLASS_NAMES[predictedIdx],
    confidence: Number((maxScore * 100).toFixed(2)),
  };
}

async function ensureBackendReady() {
  try {
    await tf.ready();
  } catch {
    await tf.setBackend('cpu');
    await tf.ready();
  }
}

async function runModelForward(loaded, inputTensor) {
  if (loaded.type === 'graph') {
    if (!loaded.useAsync && typeof loaded.model.execute === 'function') {
      try {
        return loaded.model.execute(inputTensor);
      } catch {
        // Fallback for graph models containing control-flow ops
        loaded.useAsync = true;
      }
    }
    return typeof loaded.model.executeAsync === 'function'
      ? await loaded.model.executeAsync(inputTensor)
      : loaded.model.predict(inputTensor);
  }
  return loaded.model.predict(inputTensor);
}

function disposeTensorResult(output) {
  if (Array.isArray(output)) {
    output.forEach((t) => t && typeof t.dispose === 'function' && t.dispose());
  } else if (output && typeof output.dispose === 'function') {
    output.dispose();
  }
}

async function warmupModel(loaded) {
  const dummy = tf.zeros([1, IMG_SIZE, IMG_SIZE, 3], 'float32');
  let out = null;
  try {
    out = await runModelForward(loaded, dummy);
    if (Array.isArray(out)) {
      await Promise.all(out.map((t) => t.data()));
    } else if (out && typeof out.data === 'function') {
      await out.data();
    }
  } finally {
    dummy.dispose();
    disposeTensorResult(out);
  }
}

/**
 * Loads the TensorFlow.js model once per URL and caches it for subsequent predictions.
 * Automatically detects GraphModel ("graph-model") vs LayersModel ("layers-model").
 */
export async function loadSolarGuardModel(modelUrl = DEFAULT_MODEL_URL) {
  if (!cachedModelPromise || cachedModelUrl !== modelUrl) {
    cachedModelUrl = modelUrl;
    cachedModelPromise = (async () => {
      await ensureBackendReady();

      const res = await fetch(modelUrl, { cache: 'default' });
      if (!res.ok) {
        throw new Error(
          `TensorFlow.js model not found at "${modelUrl}" (HTTP ${res.status}). ` +
            `Ensure model.json and shard .bin files are present in public/model/.`
        );
      }

      const modelJson = await res.json();
      const format = modelJson?.format || '';

      let loaded;
      if (format === 'graph-model') {
        const model = await tf.loadGraphModel(modelUrl);
        loaded = { model, type: 'graph', useAsync: false };
      } else {
        const model = await tf.loadLayersModel(modelUrl);
        loaded = { model, type: 'layers', useAsync: false };
      }

      await warmupModel(loaded);
      return loaded;
    })().catch((err) => {
      if (cachedModelUrl === modelUrl) {
        cachedModelPromise = null;
        cachedModelUrl = null;
      }
      throw err;
    });
  }

  return cachedModelPromise;
}

/**
 * Runs client-side EfficientNetV2B0 inference matching training preprocessing:
 * RGB [0, 255] float32 resized bilinearly to 224x224 (rescaling is built into the model).
 */
export async function predictImageElement(
  imageElement,
  modelUrl = DEFAULT_MODEL_URL
) {
  const loaded = await loadSolarGuardModel(modelUrl);

  const inputTensor = tf.tidy(() => {
    return tf.browser
      .fromPixels(imageElement, 3)
      .resizeBilinear([IMG_SIZE, IMG_SIZE])
      .toFloat()
      .expandDims(0);
  });

  let rawOutput = null;
  try {
    rawOutput = await runModelForward(loaded, inputTensor);
    const outputTensor = Array.isArray(rawOutput) ? rawOutput[0] : rawOutput;
    const scores = await outputTensor.data();
    return formatPrediction(scores);
  } finally {
    inputTensor.dispose();
    disposeTensorResult(rawOutput);
  }
}
