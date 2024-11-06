#!/bin/sh
source env/bin/activate
flask --app webapp.py --debug run --host=0.0.0.0