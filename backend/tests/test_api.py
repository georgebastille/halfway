import pytest
from fastapi.testclient import TestClient
from halfway_backend.main import app
from unittest.mock import patch, MagicMock

client = TestClient(app)

@pytest.fixture
def mock_db():
    with patch("halfway_backend.database.get_db") as mock_get_db:
        mock_db_instance = MagicMock()
        mock_get_db.return_value = mock_db_instance

        def mock_query_return(query_string, params=None):
            if "SELECT NAME FROM STATIONS" in query_string:
                return iter([
                    {"NAME": "Acton Town Underground Station"},
                    {"NAME": "Baker Street Underground Station"}
                ])
            if "SELECT CODE FROM STATIONS" in query_string:
                if params and params[0] == "Acton Town Underground Station":
                    return [{"CODE": "ACT"}]
                elif params and params[0] == "Baker Street Underground Station":
                    return [{"CODE": "BST"}]
            elif "FROM FULLROUTES AS FR" in query_string:
                return iter([
                    {"STATIONA": "ACT", "STATIONB": "BST", "WEIGHT": 10, "STATIONB_NAME": "Baker Street Underground Station"},
                    {"STATIONA": "ACT", "STATIONB": "ACT", "WEIGHT": 0, "STATIONB_NAME": "Acton Town Underground Station"},
                    {"STATIONA": "BST", "STATIONB": "ACT", "WEIGHT": 10, "STATIONB_NAME": "Acton Town Underground Station"},
                    {"STATIONA": "BST", "STATIONB": "BST", "WEIGHT": 0, "STATIONB_NAME": "Baker Street Underground Station"},
                ])
            return MagicMock()

        mock_db_instance.query.side_effect = mock_query_return
        yield mock_db_instance

def test_calculate_fairest_fastest(mock_db):
    response = client.post(
        "/api/calculate",
        json={
            "stations": [
                "Acton Town Underground Station",
                "Baker Street Underground Station"
            ]
        },
        params={
            "fairness_weight": 0.5
        }
    )
    assert response.status_code == 200
    results = response.json()
    assert isinstance(results, list)
    assert len(results) > 0
    assert "station_name" in results[0]
    assert "mean_time" in results[0]
    assert "variance" in results[0]
    assert "score" in results[0]
