import sqlite_utils

import os

def get_db():
    db_path = os.environ.get("DB_PATH", "/home/richie/halfway/tfl.db")
    
    return sqlite_utils.Database(db_path)

def get_all_stations(db):
    return [row["NAME"] for row in db.query("SELECT NAME FROM STATIONS")]
