# Base Python image
FROM python:3.11-slim

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=Chatbot.settings \
    PORT=8080

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    python3-dev \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /Chatbot

# Copy Pipenv files first (for caching)
COPY Pipfile Pipfile.lock /Chatbot/

# Upgrade pip and install pipenv
RUN pip install --upgrade pip pipenv

# Install dependencies inside Docker system Python (no venv)
RUN pipenv install --system --deploy --ignore-pipfile --no-cache-dir

# Copy the full Django project
COPY . /Chatbot/

# Expose Django port
EXPOSE 8080

# Run Django migrations, collectstatic, then gunicorn
CMD ["sh", "-c", "python manage.py migrate && python manage.py collectstatic --noinput && gunicorn Chatbot.wsgi:application --bind 0.0.0.0:$PORT"]