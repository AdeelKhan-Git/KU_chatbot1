# Base image with Ollama pre-installed
FROM ollama/ollama:latest

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    OLLAMA_HOST=http://localhost:11434 \
    DJANGO_SETTINGS_MODULE=Chatbot.settings \
    VENV_PATH=/opt/venv

# Install Python and system dependencies
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv gcc libffi-dev libssl-dev && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /Chatbot

# Create Python virtual environment
RUN python3 -m venv $VENV_PATH
ENV PATH="$VENV_PATH/bin:$PATH"

# Copy requirements first (better cache usage)
COPY requirements.txt /Chatbot/

# Install Python dependencies inside venv
RUN pip install --upgrade pip && pip install --prefer-binary -r requirements.txt

# Copy the full Django project
COPY . /Chatbot/

# Expose Django and Ollama ports
EXPOSE 8000 11434

# Entrypoint: start Ollama in background, then Django
ENTRYPOINT ["bash", "-c"]
CMD ["ollama serve & python manage.py runserver 0.0.0.0:8000 & wait"]