# Stage 1: Builder image
FROM python:3.12-slim AS builder   # Use a lightweight Python 3.12 base image for building dependencies

# Install system packages needed for compiling and OpenCV support
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \           # Compiler tools (gcc, make) for building Python packages
        libglib2.0-0 \              # Required by OpenCV
        libgl1 \                    # OpenGL runtime library for image processing
    && rm -rf /var/lib/apt/lists/*  # Clean up apt cache to reduce image size

WORKDIR /app                       # Set working directory inside container

COPY requirements.txt .             # Copy dependency list into container

# Install Python dependencies into a separate folder (/install) for later use
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt



# Stage 2: Runtime image
FROM python:3.12-slim AS runtime   # Use another lightweight Python image for final runtime

# Metadata labels for documentation
LABEL maintainer="SolarGuard"
LABEL description="SolarGuard – AI-powered solar panel defect classification (Flask + TensorFlow)"

# Install only runtime libraries (lighter than builder stage)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libglib2.0-0 \              # Needed by OpenCV
        libgl1 \                    # OpenGL runtime
        libgomp1 \                  # GNU OpenMP library (used by TensorFlow)
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder stage into runtime image
COPY --from=builder /install /usr/local

WORKDIR /app                       # Set working directory

COPY . .                            # Copy all project files into container

EXPOSE 3000                         # Expose port 3000 for Flask app

# Environment variables to optimize TensorFlow runtime
ENV TF_CPP_MIN_LOG_LEVEL=3          # Suppress TensorFlow debug logs
ENV TF_ENABLE_ONEDNN_OPTS=0         # Disable oneDNN optimizations (avoid CPU issues)
ENV PORT=3000                       # Define app port

# Create a non-root user for security
RUN useradd --no-create-home --shell /bin/false appuser \
    && chown -R appuser:appuser /app
USER appuser                        # Switch to non-root user

# Command to start the Flask app
CMD ["python", "app.py"]
