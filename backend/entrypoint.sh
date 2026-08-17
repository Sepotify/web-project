#!/bin/sh
set -e

python - <<'PY'
import os
import time

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

from django.db import connections
from django.db.utils import OperationalError

for attempt in range(40):
    try:
        connections["default"].ensure_connection()
        print("Database is ready.")
        break
    except OperationalError:
        print("Waiting for database...")
        time.sleep(1)
else:
    raise SystemExit("Database did not become ready in time.")
PY

python manage.py migrate --noinput
python manage.py collectstatic --noinput
python manage.py seed_users

exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2 --timeout 120 --access-logfile -
