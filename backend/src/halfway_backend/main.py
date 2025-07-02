from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
from halfway_backend.database import get_db, get_all_stations
from halfway_backend.logic import calculate_meeting_points
from halfway_backend.models import StationInput, MeetingPointResult, Journey
import sqlite_utils
from pathlib import Path

app = FastAPI()

@app.get("/api/stations")
async def get_stations():
    db = get_db()
    stations = get_all_stations(db)
    return {"stations": stations}

@app.post("/api/calculate", response_model=list[MeetingPointResult])
async def calculate_fairest_fastest(input: StationInput, fairness_weight: float = 0.5):
    db = get_db()
    
    # Validate input stations
    all_stations = get_all_stations(db)
    print(f"All stations: {all_stations}")
    for station_name in input.stations:
        if station_name not in all_stations:
            raise HTTPException(status_code=400, detail=f"Station '{station_name}' not found.")

    # Get station codes for the input station names
    station_codes = []
    for station_name in input.stations:
        code_rows = list(db.query("SELECT CODE FROM STATIONS WHERE NAME = ?", [station_name]))
        code_row = code_rows[0] if code_rows else None
        if code_row:
            station_codes.append(code_row["CODE"])
        else:
            raise HTTPException(status_code=400, detail=f"Could not find code for station '{station_name}'.")

    # Construct a single query to FULLROUTES to fetch all relevant data
    placeholders = ', '.join(['?' for _ in station_codes])
    query = f"""
        SELECT
            FR.STATIONA,
            FR.STATIONB,
            FR.WEIGHT,
            S.NAME AS STATIONB_NAME
        FROM
            FULLROUTES AS FR
        JOIN
            STATIONS AS S ON FR.STATIONB = S.CODE
        WHERE
            FR.STATIONA IN ({placeholders})
    """
    all_journey_rows = list(db.query(query, station_codes))

    journey_data = {}
    station_names_map = {} # To store station_code to station_name mapping
    for row in all_journey_rows:
        station_a_code = row["STATIONA"]
        station_b_code = row["STATIONB"]
        station_b_name = row["STATIONB_NAME"]
        weight = row["WEIGHT"]

        if station_b_code not in journey_data:
            journey_data[station_b_code] = {code: 0 for code in station_codes}
        journey_data[station_b_code][station_a_code] = weight
        station_names_map[station_b_code] = station_b_name # Store the name

    # Filter out stations that don't have journey data from all starting points
    num_start_points = len(input.stations)
    
    filtered_journey_data = {}
    for station_b_code, journeys in journey_data.items():
        if len(journeys) == num_start_points:
            # Ensure the order of times matches the order of input stations
            ordered_times = [journeys[code] for code in station_codes]
            if not all(t == 0 for t in ordered_times):
                 filtered_journey_data[station_b_code] = ordered_times

    # Calculate meeting points
    calculated_results = calculate_meeting_points(filtered_journey_data, fairness_weight)

    # Convert station codes back to names for the output
    final_results = []
    for result in calculated_results:
        station_name = station_names_map.get(result["station_code"])
        if station_name:
            journeys = [
                Journey(from_station=start_station, time=time)
                for start_station, time in zip(input.stations, result["times"])
            ]
            result["station_name"] = station_name
            result["journeys"] = journeys
            final_results.append(MeetingPointResult(**result))
    
    return final_results

static_dir = Path(__file__).parent.parent.parent.parent / "frontend"
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
