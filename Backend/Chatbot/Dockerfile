# Base Python image
FROM python:3.11-slim

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=Chatbot.settings

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /Chatbot

# Copy requirements first (better cache usage)
COPY requirements.txt .

# Install Python dependencies inside venv
RUN pip install --upgrade pip && pip install --prefer-binary -r requirements.txt

# Copy the full Django project
COPY . /Chatbot/

# Expose Django
EXPOSE 8000 

# Run Django
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]