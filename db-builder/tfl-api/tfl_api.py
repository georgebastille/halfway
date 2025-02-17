import requests
import sys
from typing import Final, NamedTuple
from collections import defaultdict
from tqdm import tqdm
import os


class Station(NamedTuple):
    id: str
    name: str
    line_id: str


class StationTimeInterval(NamedTuple):
    id: str
    min_time: int
    max_time: int


class TflAPI:
    def __init__(self, app_id, app_key):
        self.app_id = app_id
        self.app_key = app_key
        self.base_url = "https://api.tfl.gov.uk"

    def _fetch_tfl_data(self, endpoint, params=None) -> dict | list | None:
        url = f"{self.base_url}{endpoint}"
        params = params or {}
        params.update({"app_id": self.app_id, "app_key": self.app_key})

        try:
            response = requests.get(url, params=params, timeout=15)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            print(f"\nHTTP Error {e}")
        except Exception as e:
            print(f"\nError fetching {url}: {str(e)}")
        return None

    def get_modes(self) -> list[str]:
        mode_response = self._fetch_tfl_data("/Line/Meta/Modes")
        modes: list[str] = []
        if mode_response is None:
            return modes

        modes = [x.get("modeName", None) for x in mode_response]
        return modes

    def get_lines(self, modes: list[str]) -> dict[str, str]:
        lines = self._fetch_tfl_data("/Line/Mode/" + ",".join(modes))
        line_d: dict[str, str] = {}
        if lines is None:
            return line_d

        for line in lines:
            line_d[line["id"]] = line["name"]
        return line_d

    def get_stations(self, line_id: str) -> dict[str, Station]:
        stations = self._fetch_tfl_data(
            f"/Line/{line_id}/StopPoints?tflOperatedNationalRailStationsOnly=false"
        )
        stations_d: dict[str, Station] = {}

        if stations is None:
            return stations_d

        for station in stations:
            name = station["commonName"]
            id = station["naptanId"]
            stations_d[id] = Station(name=name, id=id, line_id=line_id)

        return stations_d

    def get_first_stations(self, line_id: str, direction: str) -> list[str]:
        ordered_stations = self._fetch_tfl_data(
            f"/Line/{line_id}/Route/Sequence/{direction}"
        )

        if not isinstance(ordered_stations, dict):
            return []

        first_stations = []
        if ordered_stations is None:
            return first_stations

        orderedLineRoutes = ordered_stations.get("orderedLineRoutes", [])
        for variation in orderedLineRoutes:
            first = variation.get("naptanIds", [None])[0]
            if first is not None:
                first_stations.append(first)
        return first_stations

    def _time_from_journey(self, journey: dict) -> int:
        return int(journey["hour"]) * 60 + int(journey["minute"])

    def get_time_between_trains_at_station(self, line_id: str, station_id: str):
        timetables = self._fetch_tfl_data(f"/Line/{line_id}/Timetable/{station_id}")
        if timetables is None:
            return []
        if not isinstance(timetables, dict):
            return []

        gaps_between_trains: list[int] = self.get_time_between_trains_at_station1(timetables)
        gaps_between_trains.extend(self.get_time_between_trains_at_station2(timetables))
        return gaps_between_trains

    def get_time_between_trains_at_station1(self, timetables):
        gaps_between_trains: list[int] = []

        routes = timetables.get("timetable", {}).get("routes", [])
        for route in routes:
            schedules = route.get("schedules", [])
            for schedule in schedules:
                journeys = schedule.get("knownJourneys", [])
                previous_journey = None
                for journey in journeys:
                    mins_past_midnight = self._time_from_journey(journey)
                    if previous_journey:
                        gap = mins_past_midnight - previous_journey
                        if gap > 0:
                            gaps_between_trains.append(gap)
                    previous_journey = mins_past_midnight
        return gaps_between_trains

    def get_time_between_trains_at_station2(self, timetables):
        gaps_between_trains: list[int] = []

        routes = timetables.get("timetable", {}).get("routes", [])
        for route in routes:
            schedules = route.get("schedules", [])
            for schedule in schedules:
                periods = schedule.get("periods", [])
                for period in periods:
                    high = period.get("frequency", {}).get("highestFrequency", None)
                    low = period.get("frequency", {}).get("lowestFrequency", None)
                    if high is not None:
                        gaps_between_trains.append(high)
                    if low is not None:
                        gaps_between_trains.append(low)
        return gaps_between_trains

    def get_timetables(
        self, line_id: str, station_id: str
    ) -> list[list[StationTimeInterval]]:
        timetables = self._fetch_tfl_data(
            f"/Line/{line_id}/Timetable/{station_id}?direction=outbound"
        )
        times: list[list[StationTimeInterval]] = []
        if timetables is None:
            return times

        return times


DESIRED_MODES: Final = ["dlr", "elizabeth-line", "overground", "tube", "tram"]

if __name__ == "__main__":
    app_id = os.environ.get("TFL_APP_ID")
    app_key = os.environ.get("TFL_APP_KEY")
    print(f"Using TFL App ID = {app_id}")
    tfl = TflAPI(app_id, app_key)
    modes = tfl.get_modes()
    # Check that the modes we expect are available
    if not set(DESIRED_MODES).issubset(modes):
        print(
            f"Unexpected Travel Mode detected:\nRequested = {DESIRED_MODES}\nRecieved from TFL = {modes}"
        )
        sys.exit()
    line_id_2_name = tfl.get_lines(DESIRED_MODES)
    line_platform: dict[str, dict[str, Station]] = {}
    station_id_2_name: dict[str, str] = {}
    station_id_2_lines: dict[str, list[str]] = defaultdict(list)
    line_id_2_first_stations: dict[str, set[str]] = defaultdict(set)

    for line_id in tqdm(line_id_2_name.keys()):
        # print(line_id)
        station_d = tfl.get_stations(line_id)
        train_gaps = []
        for station_id, station_tuple in station_d.items():
            station_id_2_name[station_id] = station_tuple.name
            station_id_2_lines[station_id].append(station_tuple.line_id)
            train_gaps.extend(tfl.get_time_between_trains_at_station(line_id, station_id))
        print(f"{line_id} - {min(train_gaps) if train_gaps else -1}")

        # for direction in ["inbound", "outbound"]:
        # first_stations = tfl.get_first_stations(line_id, direction)
        # line_id_2_first_stations[line_id].update(first_stations)

        # for start_station in line_id_2_first_stations[line_id]:
        # wait_time = tfl.get_time_between_trains_at_station(line_id, start_station)

    # for line_id, first_stations in line_id_2_first_stations.items():
    #    print(f"{line_id}: {','.join([station_id_2_name[x] for x in first_stations])}")

    # for each line, go outbound and inbound and identify the first station
    # From this we get a list for each line, a list of starting stations
