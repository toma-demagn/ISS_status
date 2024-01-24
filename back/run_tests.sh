#!/bin/bash

# To run unit tests with venv

python3 -m venv env
source env/bin/activate
pip install -r requirements.txt
pytest tests

deactivate
