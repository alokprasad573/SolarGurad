# ☀️ SolarGuard: Protecting Every Photon with AI.

![Solar Energy](https://img.shields.io/badge/Domain-Renewable%20Energy-orange)
![Deep Learning](https://img.shields.io/badge/Framework-TensorFlow-blue)
![Model](https://img.shields.io/badge/Architecture-EfficientNetV2B0-green)
![Accuracy](https://img.shields.io/badge/Accuracy-80%25-brightgreen)
![Docker](https://img.shields.io/badge/Container-Docker-2496ED?logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Orchestration-Kubernetes-326CE5?logo=kubernetes&logoColor=white)

An automated deep learning solution designed to identify physical and electrical anomalies in solar panels. Using an EfficientNetV2B0 backbone, this system categorizes module health into 6 distinct classes, enabling predictive maintenance for sustainable energy infrastructure.

## 🚀 Key Features
- **EfficientNetV2B0 Architecture:** Optimized for high accuracy with low computational overhead.
- **6-Class Diagnostics:** Identifies Bird-drop, Clean, Dusty, Electrical-damage, Physical-Damage, and Snow-Covered panels.
- **Real-Time Interface:** Interactive dashboard for RGB module analysis.
- **Automated Recommendations:** Provides field-level maintenance advice based on detection results.

## 🖼️ Application Walkthrough

| **Step 1: Home Page** | **Step 2: Module Upload** |
|:---:|:---:|
| ![Home](static/images/home.png) | ![Upload](static/images/upload.png) |
| **Home Page** <br> A sleek, intuitive dashboard serving as the central hub for automated solar panel inspection. | **Module Upload** <br> A seamless drag-and-drop interface for uploading high-resolution solar module imagery for analysis. |

| **Step 3: AI Analysis** | **Step 4: Diagnostic Result** |
|:---:|:---:|
| ![Analysis](static/images/analysis.png) | ![Result](static/images/result.png) |
| **AI Analysis** <br> Advanced feature extraction powered by EfficientNetV2B0 to rapidly detect and classify surface anomalies. | **Diagnostic Result** <br> Detailed diagnostic breakdown providing predicted defect classes, confidence scores, and actionable maintenance tasks. |

---

## 📈 Dataset Distribution

The model is trained on a dataset containing the following class distribution:
- **Bird-drop:** 191 images
- **Clean:** 194 images
- **Dusty:** 192 images
- **Electrical-damage:** 103 images
- **Physical-Damage:** 69 images
- **Snow-Covered:** 123 images

---

## 📊 Model Performance
| Category | Precision | Recall | F1-Score | Support | Status |
|:---|:---:|:---:|:---:|:---:|:---|
| 🦅 **Bird-drop** | 0.86 | 0.78 | 0.82 | 40 | Maintenance Needed |
| ✨ **Clean** | 0.64 | 0.91 | 0.75 | 33 | Optimal Condition |
| 🌫️ **Dusty** | 0.86 | 0.79 | 0.83 | 48 | Minor Cleaning |
| ⚡ **Electrical-damage** | 0.73 | 0.85 | 0.79 | 13 | **Critical Risk** |
| 🔨 **Physical-Damage** | 0.86 | 0.57 | 0.69 | 21 | Attention Required |
| ❄️ **Snow-Covered** | 0.94 | 0.89 | 0.92 | 19 | Obstructed |
| | | | | |
| **Accuracy** | | | **0.80** | **174** | |


## 📂 Project Structure
```text
SolarGuard-Protecting-Every-Photon-with-AI/
├── Model/                      # Trained model weights
│   └── effnetV2B00.80.h5       # EfficientNetV2B0 (80% accuracy)
├── NoteBooks/                  # Jupyter notebooks
│   ├── EfficientNetV2B0.ipynb  # Model training workflow
│   ├── SolarPanelDefectClassification.ipynb
│   └── Test.ipynb              # Batch testing & evaluation
├── static/                     # Front-end resources
│   ├── images/                 # Web UI screenshots
│   ├── script.js               # UI logic & API communication
│   └── style.css               # Custom glassmorphism styling
├── templates/
│   └── index.html              # Dashboard view
├── k8s/                        # Kubernetes manifests
│   ├── namespace.yaml          # Isolated namespace for all K8s resources
│   ├── configmap.yaml          # Environment variable configuration
│   ├── pvc.yaml                # Persistent storage for model weights
│   ├── deployment.yaml         # Pod spec with probes & resource limits
│   ├── service.yaml            # LoadBalancer service (port 80 → 3000)
│   └── hpa.yaml                # Horizontal Pod Autoscaler (2–8 replicas)
├── app.py                      # Flask inference API & routing
├── FixedDense.py               # Custom Keras layer for model compatibility
├── requirements.txt            # Project dependencies
├── Dockerfile                  # Multi-stage Docker build configuration
├── docker-compose.yml          # Docker Compose orchestration
├── .dockerignore               # Files excluded from Docker build context
├── .gitignore                  # Git ignore rules
└── Readme.md
```

## 💻 Tech Stack
- **Languages:** Python, HTML/CSS, JavaScript
- **Deep Learning:** TensorFlow, Keras (EfficientNetV2B0 transfer learning)
- **Computer Vision:** OpenCV, scikit-image
- **Data Science:** NumPy, scikit-learn, Matplotlib
- **Web Framework:** Flask, waitress (production server)
- **Frontend:** Tailwind CSS (CDN), Vanilla JS
- **Containerization:** Docker, Docker Compose
- **Orchestration:** Kubernetes (Deployment, Service, HPA, PVC)

## 🔧 Installation & Usage

### Option A — Local Python Environment
1. **Clone the repository:**
   ```bash
   git clone https://github.com/alokprasad573/Solar-Panel-Anomaly-Detection-using-Deep-Learning.git
   cd Solar-Panel-Anomaly-Detection-using-Deep-Learning
   ```
2. **Setup environment:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Run the application:**
   ```bash
   python app.py
   ```
   Open `http://localhost:3000` in your browser.

---

## 🐳 Docker Deployment

The project ships with a **multi-stage Dockerfile** and a **Docker Compose** configuration for zero-dependency, one-command deployment.

### Docker Architecture

| Stage | Base Image | Purpose |
|:---|:---|:---|
| `builder` | `python:3.12-slim` | Compiles & installs all pip dependencies |
| `runtime` | `python:3.12-slim` | Lean production image with only runtime libs |

**Key features:**
- 🔒 Runs as a **non-root user** (`appuser`) for security
- 📦 **Multi-stage build** — no compiler tools in the final image
- 🔁 **Model volume mount** — swap model weights without rebuilding
- ❤️ **Health check** — auto-monitors the Flask endpoint every 30s
- ⚙️ **Environment variables** pre-configured for TensorFlow optimisation

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/alokprasad573/Solar-Panel-Anomaly-Detection-using-Deep-Learning.git
   cd Solar-Panel-Anomaly-Detection-using-Deep-Learning
   ```

2. **Ensure the model file is present:**
   ```
   Model/effnetV2B00.80.h5
   ```

3. **Build & start the container:**
   ```bash
   docker compose up --build
   ```
   > ⏳ First build takes **5–15 minutes** — TensorFlow is a large dependency. Subsequent builds use the Docker cache.

4. **Open the app in your browser:**
   ```
   http://localhost:3000
   ```

### Docker Commands Cheat Sheet

| Action | Command |
|:---|:---|
| Build & start (foreground) | `docker compose up --build` |
| Build & start (background) | `docker compose up -d --build` |
| View live logs | `docker compose logs -f` |
| Stop the container | `docker compose down` |
| Rebuild from scratch | `docker compose build --no-cache` |
| Open a shell inside container | `docker compose exec solarguard bash` |

### Environment Variables

| Variable | Default | Description |
|:---|:---:|:---|
| `PORT` | `3000` | Port the Waitress server listens on |
| `TF_CPP_MIN_LOG_LEVEL` | `3` | Suppresses TensorFlow verbose logs |
| `TF_ENABLE_ONEDNN_OPTS` | `0` | Disables oneDNN CPU warnings |

---

## ☸️ Kubernetes Deployment

Full production-grade Kubernetes manifests are provided in the [`k8s/`](k8s/) directory for deploying SolarGuard on any Kubernetes cluster (Minikube, GKE, EKS, AKS, etc.).

### K8s Manifest Overview

| File | Kind | Purpose |
|:---|:---|:---|
| `namespace.yaml` | `Namespace` | Isolated `solarguard` namespace |
| `configmap.yaml` | `ConfigMap` | Environment variables (PORT, TF flags) |
| `pvc.yaml` | `PersistentVolumeClaim` | Persistent storage for model weights |
| `deployment.yaml` | `Deployment` | Pod spec with 2 replicas, probes & resource limits |
| `service.yaml` | `Service` | LoadBalancer exposing port `80 → 3000` |
| `hpa.yaml` | `HorizontalPodAutoscaler` | Auto-scales 2–8 pods on CPU/memory pressure |

### K8s Architecture

```
                    ┌─────────────────────────────────┐
                    │      Namespace: solarguard       │
                    │                                 │
  Internet ──► :80  │  LoadBalancer Service           │
                    │       │                         │
                    │       ▼                         │
                    │  ┌─────────┐  ┌─────────┐      │
                    │  │  Pod 1  │  │  Pod 2  │ ···  │  ◄── HPA (2–8)
                    │  │ :3000   │  │ :3000   │      │
                    │  └────┬────┘  └────┬────┘      │
                    │       └─────┬──────┘           │
                    │             ▼                   │
                    │      PVC (Model weights)        │
                    │      /app/Model (ReadOnly)      │
                    └─────────────────────────────────┘
```

### Prerequisites

- A running Kubernetes cluster (local: [Minikube](https://minikube.sigs.k8s.io/) or [Docker Desktop K8s](https://docs.docker.com/desktop/kubernetes/))
- `kubectl` CLI installed and configured
- The `solarguard:latest` image available to your cluster (see Step 1 below)

### Quick Start

**Step 1 — Build & load the image into your cluster**

```bash
# Build the image
docker build -t solarguard:latest .

# For Minikube — load directly (no registry needed)
minikube image load solarguard:latest

# For cloud clusters — push to a registry first, then update
# deployment.yaml image field to your registry path:
docker tag solarguard:latest ghcr.io/<your-username>/solarguard:latest
docker push ghcr.io/<your-username>/solarguard:latest
```

**Step 2 — Copy model weights into the PVC**

```bash
# Apply namespace & PVC first
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/pvc.yaml

# Temporarily mount the PVC to copy weights
kubectl run model-loader --image=busybox --restart=Never \
  --overrides='{
    "spec": {
      "volumes": [{"name":"m","persistentVolumeClaim":{"claimName":"solarguard-model-pvc"}}],
      "containers": [{"name":"c","image":"busybox","command":["sleep","3600"],
        "volumeMounts":[{"name":"m","mountPath":"/model"}]}]
    }
  }' -n solarguard

kubectl cp Model/effnetV2B00.80.h5 solarguard/model-loader:/model/effnetV2B00.80.h5
kubectl delete pod model-loader -n solarguard
```

**Step 3 — Deploy all resources**

```bash
kubectl apply -f k8s/
```

**Step 4 — Access the application**

```bash
# Cloud (GKE / EKS / AKS) — get the external IP
kubectl get service solarguard-service -n solarguard

# Minikube — open directly in browser
minikube service solarguard-service -n solarguard
```

### Kubectl Cheat Sheet

| Action | Command |
|:---|:---|
| Deploy all manifests | `kubectl apply -f k8s/` |
| Check pod status | `kubectl get pods -n solarguard` |
| Stream pod logs | `kubectl logs -f deploy/solarguard -n solarguard` |
| Describe a pod | `kubectl describe pod -l app=solarguard -n solarguard` |
| Scale manually | `kubectl scale deploy/solarguard --replicas=4 -n solarguard` |
| Check HPA status | `kubectl get hpa -n solarguard` |
| Open shell in pod | `kubectl exec -it deploy/solarguard -n solarguard -- bash` |
| Tear down everything | `kubectl delete -f k8s/` |

### Resource Configuration

| Resource | Request | Limit |
|:---|:---:|:---:|
| CPU | `500m` (0.5 core) | `2000m` (2 cores) |
| Memory | `1 Gi` | `2 Gi` |

> **HPA** automatically scales replicas between **2** and **8** when CPU > 70% or Memory > 80%.

---
*Developed for smart grid optimization and predictive maintenance.*
