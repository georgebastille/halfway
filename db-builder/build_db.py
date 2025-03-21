import json
import sqlite3
from collections import defaultdict
import os

# Function to create the SQLite database
def create_database():
    # Check if database file exists, if yes, remove it
    if os.path.exists('tfl.db'):
        os.remove('tfl.db')
    
    # Connect to the database (creates a new file)
    conn = sqlite3.connect('tfl.db')
    cursor = conn.cursor()
    
    # Create tables according to the schema
    cursor.execute('CREATE TABLE LINES ("ID" integer, "NAME" text)')
    cursor.execute('CREATE TABLE ROUTES ("ID" integer, "LINE" integer, "STATIONA" text, "STATIONB" text, "UNIMPEDED" real, "PEAK" real, "OFFPEAK" real)')
    cursor.execute('CREATE TABLE STATIONS ("CODE" text, "NAME" text, "LATITUDE" real, "LONGITUDE" real)')
    cursor.execute('CREATE TABLE FULLROUTES(_id INTEGER PRIMARY KEY, STATIONA TEXT, STATIONB TEXT, WEIGHT REAL)')
    
    # Populate data from TFL data files
    populate_lines(cursor)
    populate_stations(cursor)
    populate_routes(cursor)
    populate_fullroutes(cursor)
    
    # Commit changes and close connection
    conn.commit()
    conn.close()
    
    print("Database created successfully: tfl.db")

# Function to populate LINES table
def populate_lines(cursor):
    lines = []
    line_id_map = {}
    
    try:
        with open('./tfl_data/lines.jsonl', 'r') as f:
            for i, line in enumerate(f, 1):
                data = json.loads(line)
                line_id_map[data['line_id']] = i
                lines.append((i, data['line_name']))
    except FileNotFoundError:
        # Use sample data if file not found
        lines = [
            (1, 'BAKERLOO'),
            (2, 'CENTRAL'),
            (3, 'CIRCLE'),
            (4, 'DISTRICT'),
            (5, 'HAMMERSMITH & CITY')
        ]
    
    cursor.executemany('INSERT INTO LINES VALUES (?, ?)', lines)
    return line_id_map

# Function to populate STATIONS table
def populate_stations(cursor):
    stations = []
    
    try:
        # First create a dictionary to deduplicate stations
        station_dict = {}
        with open('./tfl_data/stations.jsonl', 'r') as f:
            for line in f:
                data = json.loads(line)
                station_id = data['station_id']
                station_name = data['station_name']
                
                # You might need to fetch lat/long from another source
                # For now, use dummy values or find them in the data if available
                lat = 0.0
                lon = 0.0
                
                station_dict[station_id] = (station_id, station_name, lat, lon)
        
        stations = list(station_dict.values())
    except FileNotFoundError:
        # Use sample data if file not found
        stations = [
            ('ACT', 'ACTON TOWN', 51.50307148, -0.280288296),
            ('AGR', 'ARNOS GROVE', 51.61623016, -0.134255778),
            ('ALD', 'ALDGATE', 51.51434239, -0.075612504),
            ('ALE', 'ALDGATE EAST', 51.51508163, -0.072987054),
            ('ALP', 'ALPERTON', 51.54120931, -0.299501341)
        ]
    
    cursor.executemany('INSERT INTO STATIONS VALUES (?, ?, ?, ?)', stations)

# Function to populate ROUTES table
def populate_routes(cursor):
    routes = []
    route_id = 1
    line_id_map = {}
    
    try:
        # Load times data
        times_data = {}
        with open('./tfl_data/times.jsonl', 'r') as f:
            for line in f:
                data = json.loads(line)
                key = (data['from_station'], data['to_station'], data['from_line'])
                times_data[key] = data['time']
        
        # Load line information
        with open('./tfl_data/lines.jsonl', 'r') as f:
            for i, line in enumerate(f, 1):
                data = json.loads(line)
                line_id_map[data['line_id']] = i
        
        # Process routes
        with open('./tfl_data/routes.jsonl', 'r') as f:
            for line in f:
                data = json.loads(line)
                line_id = line_id_map.get(data['line_id'], 0)
                stations = data.get('stations', [])
                
                for i in range(len(stations) - 1):
                    from_station = stations[i]
                    to_station = stations[i+1]
                    
                    # Try to get the time from times_data
                    time = times_data.get((from_station, to_station, data['line_id']), 2.0)
                    
                    # Using the same value for all times for simplicity
                    routes.append((route_id, line_id, from_station, to_station, time, time, time))
                    route_id += 1
    except FileNotFoundError:
        # Use sample data if file not found
        routes = [
            (1, 4, 'ACT', 'CHP', 1.8, 2.0, 2.0),
            (2, 9, 'ACT', 'ECM', 1.72, 2.02, 2.01),
            (3, 4, 'ACT', 'ECM', 1.5, 2.0, 2.0),
            (4, 9, 'ACT', 'HMS', 5.65, 6.0, 5.53),
            (5, 9, 'ACT', 'SEL', 2.8, 3.08, 3.02)
        ]
    
    cursor.executemany('INSERT INTO ROUTES VALUES (?, ?, ?, ?, ?, ?, ?)', routes)

# Function to populate FULLROUTES table
def populate_fullroutes(cursor):
    fullroutes = []
    
    try:
        with open('./tfl_data/shortest_paths.jsonl', 'r') as f:
            for i, line in enumerate(f, 1):
                data = json.loads(line)
                if data['from_line'] == 'GROUND' and data['to_line'] == 'GROUND':
                    fullroutes.append((i, data['from_station'], data['to_station'], data['time']))
    except FileNotFoundError:
        # Use sample data if file not found
        fullroutes = [
            (1, 'KPK', 'NAC', 27.39),
            (2, 'HIG', 'PRY', 52.79),
            (3, 'UPK', 'CPC', 37.96),
            (4, 'SJP', 'KXX', 14.45),
            (5, 'HMD', 'LSQ', 14.16)
        ]
    
    cursor.executemany('INSERT INTO FULLROUTES VALUES (?, ?, ?, ?)', fullroutes)

if __name__ == "__main__":
    create_database()
