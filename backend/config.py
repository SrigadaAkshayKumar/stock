"""
Configuration module for environment-specific settings used across the application.
"""

import os

class Config:
    # Directory where stock CSV data is stored (can be overridden by environment variable)
    DATA_DIR = os.getenv("DATA_DIR", "data")