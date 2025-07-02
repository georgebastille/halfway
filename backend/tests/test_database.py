import os
import pytest
from halfway_backend import database

@pytest.fixture
def db():
    # Construct the absolute path to the database file
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "tfl.db"))
    os.environ["DB_PATH"] = db_path
    return database.get_db()

def test_get_all_stations(db):
    stations = database.get_all_stations(db)
    assert isinstance(stations, list)
    assert len(stations) > 0
    assert "Acton Town Underground Station" in stations