from pydantic import BaseModel

class StationInput(BaseModel):
    stations: list[str]

class Journey(BaseModel):
    from_station: str
    time: int

class MeetingPointResult(BaseModel):
    station_name: str
    mean_time: float
    variance: float
    score: float
    journeys: list[Journey]
