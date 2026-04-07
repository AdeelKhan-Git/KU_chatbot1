#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate

echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "Starting Celery..."
celery -A Chatbot worker --loglevel=info --concurrency=2 &

echo "Starting Gunicorn..."
exec gunicorn Chatbot.wsgi:application --bind 0.0.0.0:$PORT --worker-class gevent --workers 2 --timeout 120