# Halfway

Find the fairest place for a group to meet in London based on Tube travel times

This is a work in progress project whose aim is to help people find the best place to meet in London.
Have you ever had the conversation with friends:
```
Hey lets all meet next week.
Great, where shall we go?
Umm, well somewhere near mine would be great.
But that is really far for me.
etc
```

Halfway uses data provide by TFL to determine the best places to meet.
There is a small amount of customisation in the choice, would you like the absolute fairest (i.e. 30 minutes for each person), the minimal total travelling time (i.e. 10 minutes for 2 people, 25 minutes for the other), or something in between?
It supports groups of any size.

## Current status:
#### [Database Builder](./db-builder) - take tube data pulled from the tfl api and construct an sqlite3 db with journey times from every station to every other station precalculated
#### [Backend](./backend) - A Python-based backend using FastAPI to serve the station data and calculate the best meeting points.
#### [Frontend](./frontend) - A simple HTML/CSS/JS frontend to interact with the backend.
#### [Android client](./archive/android-client) - (Archived) map based app that allows user to add locations and shows the fairest meeting points.
#### [Expo client](./archive/expo-client-16) - (Archived) most recent adventure, combine it all into a cross platform application in React Native, no backend required (Work in Progress)

## Getting Started

### Prerequisites
- Python 3.8+
- `uv` for package management

### Installation and Running

1. **Build the database:**
   ```bash
   python db-builder/build_db.py
   ```

2. **Set up the backend:**
   ```bash
   cd backend
   uv venv
   source .venv/bin/activate
   uv pip install -r requirements.txt
   ```

3. **Run the backend server:**
   ```bash
   uvicorn halfway_backend.main:app --host 0.0.0.0 --port 8000
   ```

4. **Open the frontend:**
   Open `frontend/index.html` in your web browser.

### Running Tests

To run the backend tests, navigate to the `backend` directory and run:
```bash
source .venv/bin/activate
pytest
```
