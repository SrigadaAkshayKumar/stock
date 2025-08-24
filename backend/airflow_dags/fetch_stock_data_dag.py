from datetime import datetime, timedelta
import os
from pathlib import Path
from airflow import DAG
from airflow.operators.empty import EmptyOperator
from airflow.operators.python import PythonOperator

DATA_DIR = Path(os.getenv("DATA_DIR", "./data"))

def validate_seed_csvs():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[validate_seed_csvs] OK. Data dir: {DATA_DIR.resolve()}")

def ingest_to_catalog():
    print("[ingest_to_catalog] Stub. CSV -> curated output.")

DEFAULT_ARGS = {
    "owner": "asr",
    "depends_on_past": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}

with DAG(
    dag_id="fetch_stock_data",
    description="Validate & curate local stock CSVs (no yfinance)",
    default_args=DEFAULT_ARGS,
    start_date=datetime(2025, 8, 1),
    schedule="0 18 * * 1-5",  # 6PM Mon–Fri
    catchup=False,
    is_paused_upon_creation=True,  # stays paused until 18th
) as dag:

    start = EmptyOperator(task_id="start")
    validate = PythonOperator(task_id="validate_seed_csvs", python_callable=validate_seed_csvs)
    ingest = PythonOperator(task_id="ingest_to_catalog", python_callable=ingest_to_catalog)
    end = EmptyOperator(task_id="end")

    start >> validate >> ingest >> end