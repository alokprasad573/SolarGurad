# SolarGuard — EfficientNetV2B0 Fine-Tuning & HPO Report

Structured summary of the 15-trial Hyperparameter Optimization (HPO) and 2-stage fine-tuning run for **SolarGuard** (`EfficientNetV2B0`), ready for inclusion in final project documentation.

---

## 1. Executive Summary

| Metric / Property | Value |
| :--- | :--- |
| **Model Architecture** | `EfficientNetV2B0` (ImageNet pretrained, `include_preprocessing=True`, `224x224x3`) |
| **Framework & Device** | TensorFlow `2.22.0-rc1` · CPU (`float32`) |
| **HPO Engine** | Built-in Adaptive HPO (15 trials: 9 Explore + 6 Exploit) |
| **Dataset Cleaning** | `871` raw → **`776` clean unique images** (`87` duplicates removed, `2` cross-class conflicts excluded) |
| **Split Strategy** | Stratified `70% / 15% / 15%` (`544` Train / `116` Val / `116` Test) |
| **Best Validation Macro-F1** | **0.8570** (Final model) / **0.8757** (Best HPO trial #5) |
| **Held-Out Test Accuracy** | **82.76%** (`96 / 116`) |
| **Held-Out Test Macro-F1 (1-Crop)** | **0.8171** (Weighted F1: `0.8260`) |
| **Held-Out Test Macro-F1 (4x TTA)** | **0.8298** (Weighted F1: `0.8289`) |
| **Fit Diagnosis** | `OVERFITTING` (`Train F1: 0.9828` vs `Val F1: 0.8570`, Gap: `0.1258`) |

---

## 2. Dataset Hygiene & Stratified Splits

Before splitting, all files in `./Data/*` were hashed with MD5 to eliminate train/validation/test data leakage:

* **Raw files scanned:** `871`
* **Same-class exact duplicates removed:** `87`
* **Cross-class label conflicts excluded:** `2` hashes (`8` files)
  * `b932e847`: `Bird-drop` (`Bird (22, 46, 57, 176, 184).jpg`) vs `Physical-Damage` (`Physical (51).jpg`)
  * `a5c5841c`: `Bird-drop` (`Bird (193).jpg`) vs `Dusty` (`Dust (187).jpg`)
* **Final clean dataset:** **`776` unique images**

### Per-Class Distribution

| Class | Raw | Clean Unique | Train (70%) | Val (15%) | Test (15%) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Bird-drop** | 191 | 141 | 99 | 21 | 21 |
| **Clean** | 193 | 186 | 130 | 28 | 28 |
| **Dusty** | 192 | 182 | 128 | 27 | 27 |
| **Electrical-damage** | 103 | 91 | 63 | 14 | 14 |
| **Physical-Damage** | 69 | 63 | 45 | 9 | 9 |
| **Snow-Covered** | 123 | 113 | 79 | 17 | 17 |
| **Total** | **871** | **776** | **544** | **116** | **116** |

---

## 3. Hyperparameter Optimization (HPO)

Each HPO trial ran **2-stage training** (up to 12 epochs Stage 1 frozen warmup + up to 18 epochs Stage 2 partial backbone unfreezing with all `BatchNormalization` layers frozen) and was scored by a generalization-penalized objective:

$$\text{Objective} = \text{Val Macro-F1} - 0.35 \cdot \max\big(0,\; (\text{Train Macro-F1} - \text{Val Macro-F1}) - 0.08\big)$$

### All 15 Trials Summary

| Trial | Phase | Unfrozen Non-BN Layers | Val Macro-F1 | Train Macro-F1 | Gen. Gap | Objective Score | Duration (s) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | Explore | 16 | 0.8541 | 0.9878 | 0.1337 | 0.8353 | 279.9 |
| 2 | Explore | 16 | 0.8470 | 0.8808 | **0.0338** | 0.8470 | 267.0 |
| 3 | Explore | 60 | 0.8560 | 0.9692 | 0.1132 | 0.8444 | 410.1 |
| 4 | Explore | 36 | 0.8012 | 0.9192 | 0.1180 | 0.7879 | 327.2 |
| **5** | **Explore** | **36** | **0.8757** | **0.9920** | **0.1164** | **0.8629** | **429.5** |
| 6 | Explore | 60 | 0.8465 | 0.9525 | 0.1060 | 0.8374 | 376.5 |
| 7 | Explore | 60 | 0.8279 | 0.9147 | 0.0868 | 0.8255 | 299.3 |
| 8 | Explore | 87 | 0.8254 | 0.9745 | 0.1491 | 0.8012 | 540.6 |
| 9 | Explore | 87 | 0.8486 | 0.9837 | 0.1351 | 0.8294 | 432.0 |
| 10 | Exploit | 16 | 0.8024 | 0.9509 | 0.1485 | 0.7785 | 433.3 |
| 11 | Exploit | 60 | 0.7974 | 0.9123 | 0.1150 | 0.7851 | 420.9 |
| 12 | Exploit | 60 | 0.8268 | 0.9472 | 0.1205 | 0.8126 | 291.5 |
| 13 | Exploit | 60 | 0.8526 | 0.9854 | 0.1328 | 0.8341 | 428.9 |
| 14 | Exploit | 16 | 0.8364 | 0.9228 | 0.0864 | 0.8341 | 457.6 |
| 15 | Exploit | 36 | 0.8602 | 0.9721 | 0.1120 | 0.8490 | 356.8 |

> **Winner:** **Trial 5** (`Objective = 0.8629`, `Val Macro-F1 = 0.8757`).  
> **Lowest Overfitting Gap:** **Trial 2** (`Gap = 0.0338`, `Val Macro-F1 = 0.8470`, `dense_units = 0`, `aug_strength = strong`).

### Selected Best Hyperparameters (Trial 5)

| Hyperparameter | Selected Value | Role |
| :--- | :--- | :--- |
| `batch_size` | `16` | Mini-batch size |
| `aug_strength` | `"light"` | Training-only `tf.data` augmentation preset |
| `class_weight_alpha` | `0.5` | Square-root damped inverse-frequency class weights |
| `dense_units` | `256` | Bottleneck head size (`swish` activation) |
| `dropout_1` | `0.4319` | Post-GAP dropout rate |
| `dropout_2` | `0.4456` | Post-Dense dropout rate |
| `l2_reg` | `5.136e-4` | Kernel L2 weight regularization |
| `weight_decay` | `2.181e-3` | `AdamW` decoupled weight decay |
| `label_smoothing` | `0.057` | Categorical cross-entropy label smoothing |
| `lr_head` | `8.522e-4` | Stage 1 (frozen backbone) learning rate |
| `lr_ft` | `9.572e-5` | Stage 2 (backbone fine-tuning) learning rate |
| `unfreeze_layers` | `45` (`36` non-BN) | Top backbone layers unfrozen in Stage 2 |

---

## 4. Final 2-Stage Fine-Tuning Progression

* **Stage 1 — Frozen Backbone Warmup (`20 / 20` epochs):**
  * Train accuracy rose from `0.4246` → `0.8750` (`loss: 2.1920` → `0.8328`).
  * Validation accuracy peaked at **`0.8448`** (Epoch 18) with best `val_loss = 1.0175` (Epoch 16); `ReduceLROnPlateau` stepped LR from `8.52e-4` → `4.26e-4` → `2.13e-4` → `1.07e-4`.
* **Stage 2 — Backbone Fine-Tuning (`9 / 35` epochs, Early Stopped):**
  * Unfroze top `45` backbone layers (`36` trainable non-BN layers; all `BatchNormalization` layers kept frozen).
  * Reached best `val_loss = 1.0055` and `val_accuracy = 0.8448` at Epoch 3 before early stopping restored the best checkpoint.

---

## 5. Held-Out Test Set Evaluation (`116` Unseen Images)

### Standard 1-Crop Inference

| Class | Precision | Recall | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: |
| **Bird-drop** | 0.9412 | 0.7619 | 0.8421 | 21 |
| **Clean** | 0.7714 | 0.9643 | 0.8571 | 28 |
| **Dusty** | 0.7308 | 0.7037 | 0.7170 | 27 |
| **Electrical-damage** | 0.9286 | 0.9286 | 0.9286 | 14 |
| **Physical-Damage** | 0.6250 | 0.5556 | 0.5882 | 9 |
| **Snow-Covered** | 1.0000 | 0.9412 | 0.9697 | 17 |
| **Accuracy** | — | — | **0.8276** | **116** |
| **Macro Avg** | **0.8328** | **0.8092** | **0.8171** | **116** |
| **Weighted Avg** | — | — | **0.8260** | **116** |

### 4x Test-Time Augmentation (TTA: Original + H-Flip + V-Flip + HV-Flip)

| Class | Precision | Recall | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: |
| **Bird-drop** | 0.9412 | 0.7619 | 0.8421 | 21 |
| **Clean** | 0.7429 | 0.9286 | 0.8254 | 28 |
| **Dusty** | 0.7917 | 0.7037 | 0.7451 | 27 |
| **Electrical-damage** | 0.9286 | 0.9286 | 0.9286 | 14 |
| **Physical-Damage** | 0.6364 | 0.7778 | **0.7000** | 9 |
| **Snow-Covered** | 1.0000 | 0.8824 | 0.9375 | 17 |
| **Accuracy** | — | — | **0.8276** | **116** |
| **Macro Avg** | **0.8401** | **0.8305** | **0.8298** | **116** |
| **Weighted Avg** | — | — | **0.8289** | **116** |

> **Impact of 4x TTA:** Macro-F1 improved from `0.8171` → **`0.8298`** (+1.27%), driven by a major recall boost on the smallest minority class **`Physical-Damage`** (`0.5556` → `0.7778`, F1 `0.5882` → `0.7000`) and higher precision on **`Dusty`** (`0.7308` → `0.7917`).

### Test Confusion Matrix (4x TTA)

| True \ Predicted | Bird-drop | Clean | Dusty | Electrical-damage | Physical-Damage | Snow-Covered |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Bird-drop** | **16** | 1 | 3 | 0 | 1 | 0 |
| **Clean** | 0 | **26** | 2 | 0 | 0 | 0 |
| **Dusty** | 1 | 5 | **19** | 0 | 2 | 0 |
| **Electrical-damage** | 0 | 0 | 0 | **13** | 1 | 0 |
| **Physical-Damage** | 0 | 1 | 0 | 1 | **7** | 0 |
| **Snow-Covered** | 0 | 2 | 0 | 0 | 0 | **15** |

---

## 6. Fit Diagnosis & Observations

* **Automated Diagnosis:** `[OVERFITTING]` — `Train Macro-F1 (0.9828)` exceeded `Val Macro-F1 (0.8570)` by `0.1258` (just above the `0.12` threshold).
* **Primary Error Pattern:** Most test misclassifications occur between visually similar classes (**`Dusty` ↔ `Clean`** — 5 Dusty panels predicted as Clean) and minority **`Physical-Damage`** (`9` test samples).
* **Baseline Improvement:** Compared to the earlier notebook baseline (`80.0%` validation accuracy on an un-deduplicated split with 93 duplicates), this fine-tuned model achieves **`82.76%` accuracy and `82.98%` Macro-F1 on a strictly deduplicated, unseen held-out test set**, with **`Electrical-damage` F1 improving from `0.79` → `0.93`**.
* **Next-Iteration Tuning Ideas:**
  * Increase `aug_strength` to `"medium"` or `"strong"` and test `dense_units = 0` (direct linear head — Trial 2 achieved a `0.0338` train-val gap).
  * Collect additional `Physical-Damage` and lightly soiled `Dusty` examples to reduce `Dusty` ↔ `Clean` confusion.

---

## 7. Saved Artifacts

| Artifact | Path | Description |
| :--- | :--- | :--- |
| Native Keras Model | `model/finetuned/effnetV2B0_finetuned.keras` | Recommended format for inference & deployment |
| Legacy H5 Model | `model/finetuned/effnetV2B0_finetuned.h5` | Backward-compatible HDF5 export |
| Training Curves | `model/finetuned/training_curves.png` | Stage 1 + Stage 2 Loss & Accuracy plots |
| Confusion Matrix | `model/finetuned/confusion_matrix.png` | Held-out test confusion matrix (4x TTA) |
| Full JSON Report | `model/finetuned/training_report.json` | Complete trial logs, metrics, and split stats |
