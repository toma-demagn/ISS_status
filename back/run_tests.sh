#!/bin/bash

# Create a new virtual environment
python3 -m venv env

# Activate the virtual environment
source env/bin/activate

# Install requirements
pip install -r requirements.txt

# Run tests
pytest tests

# Deactivate the virtual environment
deactivate
