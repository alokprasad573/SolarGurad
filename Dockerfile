# ── Stage 1: Builder ──────────────────────────────────────────────────────────
# Use a lightweight Python 3.12 base image for building dependencies
FROM python:3.12-slim AS builder

# Install system packages needed for compiling and OpenCV support:
#   build-essential  – Compiler tools (gcc, make) for building Python packages
#   libglib2.0-0     – Required by OpenCV
#   libgl1           – OpenGL runtime library for image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libglib2.0-0 \
        libgl1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside container
WORKDIR /app

# Copy dependency list into container (cached separately for faster rebuilds)
COPY requirements.txt .

# Install Python dependencies into a separate prefix for clean copy to runtime
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
# Use another lightweight Python image for the final production runtime
FROM python:3.12-slim AS runtime

# Metadata labels for documentation
LABEL maintainer="SolarGuard"
LABEL description="SolarGuard – AI-powered solar panel defect classification (Flask + TensorFlow)"

# Install only runtime libraries (lighter than builder stage):
#   libglib2.0-0  – Needed by OpenCV
#   libgl1        – OpenGL runtime
#   libgomp1      – GNU OpenMP library (used by TensorFlow)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libglib2.0-0 \
        libgl1 \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder stage into runtime image
COPY --from=builder /install /usr/local

# Set working directory
WORKDIR /app

# Copy all project files into container
COPY . .

# Expose port 3000 for the Flask / Waitress server
EXPOSE 3000

# Environment variables to suppress TensorFlow verbosity and set port
ENV TF_CPP_MIN_LOG_LEVEL=3
ENV TF_ENABLE_ONEDNN_OPTS=0
ENV PORT=3000

# Create a non-root user for security and hand over ownership
RUN useradd --no-create-home --shell /bin/false appuser \
    && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Start the production server via Waitress
CMD ["python", "app.py"]
