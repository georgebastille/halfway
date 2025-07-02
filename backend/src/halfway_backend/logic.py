import numpy as np

def calculate_meeting_points(journey_data: dict, fairness_weight: float) -> list[dict]:
    # journey_data is a dictionary where keys are destination station codes
    # and values are lists of journey times from each starting point.
    # Example: {"STATION_B_CODE": [time_from_A, time_from_B, ...]}

    results = []
    for station_code, times in journey_data.items():
        mean_time = np.mean(times)
        variance = np.var(times)

        # Combine mean and variance into a single score
        # fairness_weight (0 to 1) controls the balance
        # 0 = fastest (lowest mean), 1 = fairest (lowest variance)
        score = (1 - fairness_weight) * mean_time + fairness_weight * variance

        results.append({
            "station_code": station_code,
            "mean_time": mean_time,
            "variance": variance,
            "score": score,
            "times": times
        })
    
    # Sort results by score (lowest score is best)
    results.sort(key=lambda x: x["score"])
    
    return results
