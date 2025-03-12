const axios = require("axios");

const appId = "YOUR_APP_ID";
const appKey = "YOUR_APP_KEY";

// Function to get a list of stations
async function getStations() {
  try {
    const response = await axios.get(
      `https://api.tfl.gov.uk/StopPoint/Search?query=station&app_id=${appId}&app_key=${appKey}`,
    );
    return response.data.matches;
  } catch (error) {
    console.error("Error fetching stations:", error);
    return [];
  }
}

// Function to get travel time between two stations
async function getTravelTime(fromStationId, toStationId) {
  try {
    const response = await axios.get(
      `https://api.tfl.gov.uk/Journey/JourneyResults/${fromStationId}/to/${toStationId}?app_id=${appId}&app_key=${appKey}`,
    );
    const journey = response.data.journeys[0];
    return journey.duration;
  } catch (error) {
    console.error("Error fetching travel time:", error);
    return null;
  }
}

// Example usage
(async () => {
  const stations = await getStations();
  console.log("Stations:", stations);

  if (stations.length >= 2) {
    const fromStationId = stations[0].id;
    const toStationId = stations[1].id;
    const travelTime = await getTravelTime(fromStationId, toStationId);
    console.log(
      `Travel time from ${stations[0].name} to ${stations[1].name}: ${travelTime} minutes`,
    );
  }
})();
