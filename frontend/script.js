document.addEventListener('DOMContentLoaded', () => {
    const stationInputsDiv = document.getElementById('station-inputs');
    const addStationButton = document.getElementById('add-station');
    const fairnessSlider = document.getElementById('fairness-slider');
    const sliderValueSpan = document.getElementById('slider-value');
    const findMeetingPointsButton = document.getElementById('find-meeting-points');
    const resultsList = document.getElementById('results-list');

    let stationCounter = 2;
    let allStations = [];

    // Fetch all stations for autocomplete
    fetch('/api/stations')
        .then(response => response.json())
        .then(data => {
            allStations = data.stations;
            // Setup autocomplete for initial inputs
            document.querySelectorAll('.station-input').forEach(input => {
                setupAutocomplete(input);
            });
        })
        .catch(error => console.error('Error fetching stations:', error));

    function setupAutocomplete(input) {
        let currentFocus;

        input.addEventListener('input', function(e) {
            let a, b, i, val = this.value;
            closeAllLists();
            if (!val) { return false;}
            currentFocus = -1;
            a = document.createElement("DIV");
            a.setAttribute("id", this.id + "autocomplete-list");
            a.setAttribute("class", "autocomplete-items");
            this.parentNode.appendChild(a);
            for (i = 0; i < allStations.length; i++) {
                if (allStations[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                    b = document.createElement("DIV");
                    b.innerHTML = "<strong>" + allStations[i].substr(0, val.length) + "</strong>";
                    b.innerHTML += allStations[i].substr(val.length);
                    b.innerHTML += "<input type='hidden' value='" + allStations[i] + "'>";
                    b.addEventListener("click", function(e) {
                        input.value = this.getElementsByTagName("input")[0].value;
                        closeAllLists();
                    });
                    a.appendChild(b);
                }
            }
        });

        input.addEventListener('keydown', function(e) {
            let x = document.getElementById(this.id + "autocomplete-list");
            if (x) x = x.getElementsByTagName("div");
            if (e.keyCode == 40) { // Arrow Down
                currentFocus++;
                addActive(x);
            } else if (e.keyCode == 38) { // Arrow Up
                currentFocus--;
                addActive(x);
            } else if (e.keyCode == 13) { // Enter
                e.preventDefault();
                if (currentFocus > -1) {
                    if (x) x[currentFocus].click();
                }
            }
        });

        function addActive(x) {
            if (!x) return false;
            removeActive(x);
            if (currentFocus >= x.length) currentFocus = 0;
            if (currentFocus < 0) currentFocus = (x.length - 1);
            x[currentFocus].classList.add("autocomplete-active");
        }

        function removeActive(x) {
            for (let i = 0; i < x.length; i++) {
                x[i].classList.remove("autocomplete-active");
            }
        }

        function closeAllLists(elmnt) {
            const x = document.getElementsByClassName("autocomplete-items");
            for (let i = 0; i < x.length; i++) {
                if (elmnt != x[i] && elmnt != input) {
                    x[i].parentNode.removeChild(x[i]);
                }
            }
        }

        document.addEventListener("click", function (e) {
            closeAllLists(e.target);
        });
    }

    addStationButton.addEventListener('click', () => {
        stationCounter++;
        const newStationInputGroup = document.createElement('div');
        newStationInputGroup.classList.add('station-input-group');
        newStationInputGroup.innerHTML = `
            <label for="station${stationCounter}">Starting Point ${stationCounter}:</label>
            <input type="text" id="station${stationCounter}" class="station-input" placeholder="Enter station name">
        `;
        stationInputsDiv.appendChild(newStationInputGroup);
        setupAutocomplete(document.getElementById(`station${stationCounter}`)); // Setup autocomplete for new input
    });

    function updateMeetingPoints(fairnessWeight) {
        const selectedStations = [];
        document.querySelectorAll('.station-input').forEach(input => {
            if (input.value.trim() !== '') {
                selectedStations.push(input.value.trim());
            }
        });

        if (selectedStations.length < 2) {
            resultsList.innerHTML = '<li>Please enter at least two starting points.</li>';
            return;
        }

        const apiUrl = `/api/calculate?fairness_weight=${fairnessWeight}`;

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ stations: selectedStations }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            resultsList.innerHTML = '';
            if (data.length === 0) {
                resultsList.innerHTML = '<li>No meeting points found.</li>';
            } else {
                data.forEach(result => {
                    const li = document.createElement('li');
                    li.textContent = `${result.station_name} (Mean Time: ${result.mean_time.toFixed(2)} mins, Variance: ${result.variance.toFixed(2)})`;
                    resultsList.appendChild(li);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching meeting points:', error);
            resultsList.innerHTML = '<li>Error fetching results.</li>';
        });
    }

    findMeetingPointsButton.addEventListener('click', () => {
        const fairnessWeight = parseFloat(fairnessSlider.value) / 4;
        updateMeetingPoints(fairnessWeight);
    });

    fairnessSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        let fairnessText = '';
        
        switch (value) {
            case 0:
                fairnessText = 'Fastest';
                break;
            case 1:
                fairnessText = 'Leaning Towards Fastest';
                break;
            case 2:
                fairnessText = 'Balanced';
                break;
            case 3:
                fairnessText = 'Leaning Towards Fairest';
                break;
            case 4:
                fairnessText = 'Fairest';
                break;
        }
        sliderValueSpan.textContent = fairnessText;
        const fairnessWeight = value / 4.0;

        const selectedStations = [];
        document.querySelectorAll('.station-input').forEach(input => {
            if (input.value.trim() !== '') {
                selectedStations.push(input.value.trim());
            }
        });
        if (selectedStations.length >= 2) {
            updateMeetingPoints(fairnessWeight);
        }
    });
});
