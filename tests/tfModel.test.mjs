import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as tf from '@tensorflow/tfjs';
import {
  CLASS_NAMES,
  IMG_SIZE,
  MAX_IMAGE_BYTES,
  formatPrediction,
  validateImageFile,
} from '../lib/tfModel.js';

test('preserves exact 6 SolarGuard class names and order', () => {
  assert.deepEqual(CLASS_NAMES, [
    'Bird-drop',
    'Clean',
    'Dusty',
    'Electrical-damage',
    'Physical-Damage',
    'Snow-Covered',
  ]);
  assert.equal(IMG_SIZE, 224);
});

test('validateImageFile accepts valid images and rejects invalid/oversized files', () => {
  assert.deepEqual(
    validateImageFile({ name: 'panel.jpg', type: 'image/jpeg', size: 1024 }),
    { valid: true }
  );
  assert.deepEqual(
    validateImageFile({ name: 'panel.PNG', type: '', size: 2048 }),
    { valid: true }
  );

  assert.equal(validateImageFile(null).valid, false);
  assert.equal(
    validateImageFile({ name: 'doc.pdf', type: 'application/pdf', size: 500 })
      .valid,
    false
  );
  assert.equal(
    validateImageFile({ name: 'empty.jpg', type: 'image/jpeg', size: 0 }).valid,
    false
  );
  assert.equal(
    validateImageFile({
      name: 'huge.jpg',
      type: 'image/jpeg',
      size: MAX_IMAGE_BYTES + 1,
    }).valid,
    false
  );
});

test('formatPrediction returns argmax class with 2-decimal confidence and guards bad outputs', () => {
  const res = formatPrediction([0.02, 0.05, 0.1, 0.78456, 0.03, 0.01544]);
  assert.deepEqual(res, {
    class_name: 'Electrical-damage',
    confidence: 78.46,
  });

  assert.throws(() => formatPrediction([0.5, 0.5]), /Unexpected model output/);
  assert.throws(
    () => formatPrediction([NaN, 0.2, 0.2, 0.2, 0.2, 0.2]),
    /non-finite/
  );
});

test('public/model/model.json Float16 GraphModel loads and runs synchronous inference', async () => {
  await tf.setBackend('cpu');
  await tf.ready();

  const modelDir = path.resolve(process.cwd(), 'public', 'model');
  const modelJsonPath = path.join(modelDir, 'model.json');
  assert.equal(
    fs.existsSync(modelJsonPath),
    true,
    'public/model/model.json must exist'
  );

  const modelJson = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
  assert.equal(modelJson.format, 'graph-model');

  const shardPaths = modelJson.weightsManifest[0].paths;
  const buffers = shardPaths.map((p) => fs.readFileSync(path.join(modelDir, p)));
  const totalBytes = buffers.reduce((sum, b) => sum + b.byteLength, 0);
  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const buf of buffers) {
    merged.set(buf, offset);
    offset += buf.byteLength;
  }

  const handler = tf.io.fromMemory({
    modelTopology: modelJson.modelTopology,
    weightSpecs: modelJson.weightsManifest[0].weights,
    weightData: merged.buffer,
    format: modelJson.format,
    generatedBy: modelJson.generatedBy,
    convertedBy: modelJson.convertedBy,
  });

  const model = await tf.loadGraphModel(handler);
  const input = tf.zeros([1, IMG_SIZE, IMG_SIZE, 3], 'float32');
  const rawOut = model.execute(input);
  const outTensor = Array.isArray(rawOut) ? rawOut[0] : rawOut;
  const scores = Array.from(await outTensor.data());

  input.dispose();
  if (Array.isArray(rawOut)) {
    rawOut.forEach((t) => t.dispose());
  } else {
    rawOut.dispose();
  }
  model.dispose();

  assert.deepEqual(outTensor.shape, [1, 6]);
  const probSum = scores.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(probSum - 1.0) < 1e-3, `Expected prob sum ~1, got ${probSum}`);

  const formatted = formatPrediction(scores);
  assert.ok(CLASS_NAMES.includes(formatted.class_name));
  assert.ok(formatted.confidence >= 0 && formatted.confidence <= 100);
});
