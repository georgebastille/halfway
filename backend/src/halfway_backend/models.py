from pydantic import BaseModel

class StationInput(BaseModel):
    stations: list[str]

class MeetingPointResult(BaseModel):
    station_name: str
    mean_time: float
    variance: float
    score: float # A combined score based on fairness and speed
