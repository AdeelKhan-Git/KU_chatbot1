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

WORKDIR /Chatbot

# Copy Pipenv files
COPY Pipfile Pipfile.lock /Chatbot/

# Install dependencies
RUN pip install --upgrade pip pipenv && \
    pipenv requirements > requirements.txt && \
    pip install --no-cache-dir -r requirements.txt

# Copy the full project
COPY . /Chatbot/

EXPOSE 8080

CMD ["sh", "-c", "python manage.py migrate && python manage.py collectstatic --noinput && celery -A Chatbot worker --loglevel=info --concurrency=2 & gunicorn Chatbot.wsgi:application --bind 0.0.0.0:$PORT --worker-class gevent --workers 2 --timeout 120"]