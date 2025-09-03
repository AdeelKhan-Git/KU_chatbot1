# Base image with Ollama already installed
FROM ollama/ollama:latest


ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    OLLAMA_HOST=http://ollama:11434 \
    DJANGO_SETTINGS_MODULE=Chatbot.settings
    
# Install Python and system dependencies
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv gcc libffi-dev libssl-dev && \
    rm -rf /var/lib/apt/lists/*

# Set workdir
WORKDIR /Chatbot

# Create virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements first (better cache usage)
COPY requirements.txt /Chatbot/

# Install Python deps inside venv
RUN pip install --upgrade pip && pip install --prefer-binary -r requirements.txt

# Copy full backend project
COPY . /Chatbot/

# Expose both Django and Ollama ports
EXPOSE 8000 11434
ENTRYPOINT ["/bin/bash", "-c"]

CMD ["ollama serve & exec python manage.py runserver 0.0.0.0:8000"]


