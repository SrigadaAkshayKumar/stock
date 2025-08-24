# Airflow (Local Dev)

- DAGs live in `../airflow_dags/`.
- The `fetch_stock_data` DAG is **paused by default**; enable only after 18 Aug EOD per maintainer.
- No remote API calls; only works with local `./data/*.csv`.

## Local Run (optional)
python -m venv .venv && source .venv/bin/activate
pip install "apache-airflow==2.9.3" --constraint "https://raw.githubusercontent.com/apache/airflow/constraints-2.9.3/constraints-3.10.txt"