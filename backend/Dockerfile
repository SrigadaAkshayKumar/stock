FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=10000

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN useradd --create-home appuser && mkdir -p /app/storage && chown -R appuser /app/storage
USER appuser

EXPOSE 10000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request,os; urllib.request.urlopen(f'http://localhost:{os.environ.get(\"PORT\",\"10000\")}/api/health')"
# One process per container: the in-process job queue and rate limiter keep state in
# memory. Scale horizontally with more containers once jobs move to a shared queue
# (see docs/DEPLOYMENT_AWS.md).
CMD gunicorn --bind 0.0.0.0:${PORT} --workers 1 --threads 8 --timeout 120 app:app
