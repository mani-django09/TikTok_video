#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Install gunicorn explicitly
pip install gunicorn

# Collect static files
python manage.py collectstatic --no-input

# Run migrations
python manage.py migrate