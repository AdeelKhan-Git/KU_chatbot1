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

# Upgrade pip and install dependencies
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy the full Django project
COPY . /Chatbot/

# Expose Django
EXPOSE 8080

# Run Django
CMD ["sh", "-c", "python manage.py migrate && python manage.py collectstatic --noinput && gunicorn Chatbot.wsgi:application --bind 0.0.0.0:$PORT"]
