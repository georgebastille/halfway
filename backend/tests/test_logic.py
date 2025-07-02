import pytest
from halfway_backend.logic import calculate_meeting_points

def test_calculate_meeting_points_fastest():
    journey_data = {
        "A": [10, 10, 10],
        "B": [5, 15, 20],
        "C": [1, 2, 3]
    }
    # When fairness_weight is 0, it should prioritize lowest mean
    results = calculate_meeting_points(journey_data, 0.0)
    assert results[0]["station_code"] == "C" # Mean: 2
    assert results[1]["station_code"] == "A" # Mean: 10
    assert results[2]["station_code"] == "B" # Mean: 13.33

def test_calculate_meeting_points_fairest():
    journey_data = {
        "A": [10, 10, 10],
        "B": [5, 15, 20],
        "C": [1, 2, 3]
    }
    # When fairness_weight is 1, it should prioritize lowest variance
    results = calculate_meeting_points(journey_data, 1.0)
    assert results[0]["station_code"] == "A" # Variance: 0
    assert results[1]["station_code"] == "C" # Variance: 0.66
    assert results[2]["station_code"] == "B" # Variance: 38.88

def test_calculate_meeting_points_balanced():
    journey_data = {
        "A": [10, 10, 10], # Mean 10, Var 0
        "B": [1, 10, 19],  # Mean 10, Var 54
        "C": [5, 6, 7]   # Mean 6, Var 0.66
    }
    # With a balanced weight, it should consider both
    results = calculate_meeting_points(journey_data, 0.5)
    # Expected order: C (low mean, low var), A (avg mean, low var), B (avg mean, high var)
    assert results[0]["station_code"] == "C"
    assert results[1]["station_code"] == "A"
    assert results[2]["station_code"] == "B"
