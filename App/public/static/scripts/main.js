import { loadPandemicDataForCountry, getUniqueDataKeys } from './interface.js';
import { drawLogGraphForCountry, updateWeekMarker } from './countryGraph.js';

let baseColour = "#aaaaaa";
let highlightColour = "#5BC0EB";
let clickColour = "#aa4444";
let borderColour = "#333333";
let strokeWeight = 0.25;
let hoverStrokeWeight = 2;
let clickStrokeWeight = 2;
const datesArray = await getUniqueDataKeys().then(function(data) {
    return data;
});

const pandemicData = await d3.json("data/pandemicData").then(function(data) {
    return data;
});

populateCountrySuggestions();

let appState = {
    selectedCountry: null,
    selectedCountryCode: null,
    countryPandemicData: null,
    currentWeek: datesArray[0] // Default to the first date in the data
};

let mapDiv = document.getElementById("map-container");
const rect = mapDiv.getBoundingClientRect();
const width = rect.width;
const height = rect.height;

var svg = d3.select("#map-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

var projection = d3.geoMercator()
    .scale(150)
    .translate([width / 2, height/1.48]);
    // Not perfectly centered, because Antarctica is not shown but coordinates still remain

var path = d3.geoPath().projection(projection);

var countries = d3.json("data/mapPolygonData").then(function(data) {
    // Bind data and create one path per GeoJSON feature
    svg.append("g")
        .selectAll("path")
        .data(data.features)
        .enter().append("path")
        .attr("class", "country") // Add the 'country' class to each path
        .attr("d", path)
        .attr("fill", baseColour)
        .attr("stroke", borderColour)
        .attr("stroke-width", strokeWeight)
        .on("mouseover", function(event, d) {
            d3.select(this)
                .style("cursor", "pointer")
                .attr("stroke", highlightColour)
                .attr("stroke-width", hoverStrokeWeight);
            
            d3.select("#info-container > .header")
                .text(d.properties.name) // hovered country's name
                .style("color", "gray");
        })
        .on("mouseout", function(event, d) {
            d3.select(this)
                .attr("stroke", borderColour)
                .attr("stroke-width", strokeWeight);

            if (appState.selectedCountry) {
                    d3.select("#info-container > .header")
                        .text(appState.selectedCountry)
                        .style("color", "white");
                } else {
                    d3.select("#info-container > .header")
                        .text("Select a country")
                        .style("color", "white");
                }
        })
        .on('click', async function(event, d) {
            // d is the GeoJSON feature for the clicked country
            appState.selectedCountry = d.properties.name; // Adjust based on your GeoJSON
            appState.selectedCountryCode = d.properties.iso_a3; // Adjust based on your GeoJSON
            
            const countryPandemicData = await loadPandemicDataForCountry(d.properties.iso_a3);
            appState.countryPandemicData = countryPandemicData;
        
            // Set country name in the header
            d3.select("#info-container > .header")
                .text(appState.selectedCountry)
                .style("color", "white");
            
            // Set country data in the info box
            d3.select("#info-box")
                .text(`Loading data for ${appState.selectedCountry}...`);

            if (zoomMode) {
                const bounds = path.bounds(d);
                const dx = bounds[1][0] - bounds[0][0];
                const dy = bounds[1][1] - bounds[0][1];
                const x = (bounds[0][0] + bounds[1][0]) / 2;
                const y = (bounds[0][1] + bounds[1][1]) / 2;
                const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)));
                const translate = [width / 2 - scale * x, height / 2 - scale * y];
        
                svg.transition()
                    .duration(750)
                    .call(
                        zoom.transform,
                        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
                    );
            }

            // Re-render the detail panel
            drawLogGraphForCountry(appState.selectedCountryCode);
            renderCountryDetails();
        });
}).then(function() {
    // Update map colors initially
    updateMapColors();
    renderCountryDetails();
    d3.select("#timeline-date")
        .text(`Week: ${appState.currentWeek}`); // Set initial date in the timeline
}).catch(function(error) {
    console.error('Error loading or parsing data:', error);
});
let zoomMode = false; // Starts in Earth mode
var zoom = d3.zoom()
    .scaleExtent([1, 8]) // Min and max zoom levels
    .on("zoom", function(event) {
        svg.select("g")  // Assuming your countries are inside a <g>
            .attr("transform", event.transform);
    });

svg.call(zoom);

d3.select("#zoom-toggle-button")
    .on("click", function() {
        zoomMode = !zoomMode; // Flip the state

        if (zoomMode) {
            d3.select("#zoom-icon").text("zoom_in_map"); // Zoom Mode icon

            // 👉 If a country is already selected, zoom into it immediately
            if (appState.selectedCountryCode) {
                zoomToSelectedCountry();
            }
        } else {
            d3.select("#zoom-icon").text("public"); // Earth Mode icon
            resetZoom(); // Reset zoom when switching back to Earth mode
        }
    });

function resetZoom() {
    svg.transition()
        .duration(750)
        .call(
            zoom.transform,
            d3.zoomIdentity
        );
}

function zoomToSelectedCountry() {
    // Find the country feature based on ISO code
    d3.json("data/mapPolygonData").then(function(data) {
        const selectedFeature = data.features.find(
            feature => feature.properties.iso_a3 === appState.selectedCountryCode
        );

        if (selectedFeature) {
            const bounds = path.bounds(selectedFeature);
            const dx = bounds[1][0] - bounds[0][0];
            const dy = bounds[1][1] - bounds[0][1];
            const x = (bounds[0][0] + bounds[1][0]) / 2;
            const y = (bounds[0][1] + bounds[1][1]) / 2;
            const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)));
            const translate = [width / 2 - scale * x, height / 2 - scale * y];

            svg.transition()
                .duration(750)
                .call(
                    zoom.transform,
                    d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
                );
        }
    }).catch(function(error) {
        console.error('Error loading mapPolygonData for zooming:', error);
    });
}

const timelineDiv = document.getElementById('timeline');
const timelineRect = timelineDiv.getBoundingClientRect();
const timelineWidth = timelineRect.width;

const slider = d3
    .sliderBottom()
    .min(0)
    .max(datesArray.length - 1)
    .step(1)
    .width(timelineWidth - 60) // Adjust width to fit the div with some padding
    .ticks(10)
    .tickFormat(function(d) {
        return datesArray[d]; // 👈 instead of showing number, show week string
    })
    .default(0)
    .on('onchange', val => {
        const selectedWeek = datesArray[val];
        appState.currentWeek = selectedWeek;

        d3.select('#timeline-date').text(`Week: ${selectedWeek}`);

        updateMapColors();
        renderCountryDetails();
        updateWeekMarker();
    });

d3.select('#timeline')
    .append('svg')
    .attr('width', timelineWidth)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(30,15)')
    .call(slider);


function renderCountryDetails() {
    const detailDiv = d3.select("#info-box"); // your target div

    if (appState.selectedCountry === null) {
        detailDiv.html('<p>No country selected</p>');
        return;
    }

    if (!appState.countryPandemicData || !appState.countryPandemicData.data) {
        detailDiv.html(`
            <h2>${appState.selectedCountry}</h2>
            <p>No pandemic data available for this country.</p>
        `);
        return;
    }

    let data = appState.countryPandemicData.data;
    let currentWeek = appState.currentWeek;

    if (data[currentWeek]) {
        detailDiv.html(`
            <h2>${appState.selectedCountry}</h2>
            <p>Cases: ${data[currentWeek].cases}</p>
            <p>Deaths: ${data[currentWeek].deaths}</p>
            <p>Susceptible: ${appState.countryPandemicData.properties.population - data[currentWeek].cases - data[currentWeek].deaths}</p>
        `);
    } else {
        detailDiv.html(`
            <h2>${appState.selectedCountry}</h2>
            <p>Data for the selected week is not available.</p>
        `);
    }
}


const colorScale = d3.scaleSequentialLog()
    .domain([1, 10000]) // minimum and maximum number of cases, using 1 to avoid log(0)
    .interpolator(d3.interpolateReds);

function updateMapColors() {
    d3.selectAll('path.country')
        .transition()
        .duration(200)
        .style('fill', function(d) {
            let countryName = d.properties.name;
            let countryCode = d.properties.iso_a3;
            let weekData = null;
            try {
                weekData = pandemicData[countryCode].data[appState.currentWeek];
            }
            catch (error) {
                console.error("Error accessing data for country:", countryName, error);
            }

            if (weekData) {
                return colorScale(weekData.cases);
            } else {
                return '#ccc';
            }
        });
}

let isPlaying = false;
let animationInterval = null;
d3.select("#play-button")
    .on("click", function() {
        if (isPlaying) {
            pauseAnimation();
        } else {
            startAnimation();
        }
    });

    function startAnimation() {
        isPlaying = true;
        d3.select("#play-icon").text("pause"); // Material Icon name = "pause"
    
        animationInterval = setInterval(() => {
            let currentIndex = datesArray.indexOf(appState.currentWeek);
    
            if (currentIndex < datesArray.length - 1) {
                const nextIndex = currentIndex + 1;
                const nextWeek = datesArray[nextIndex];
                appState.currentWeek = nextWeek;
    
                slider.value(nextIndex); // Move the slider
                d3.select('#timeline-date').text(`Week: ${nextWeek}`);
    
                updateMapColors();
                renderCountryDetails();
            } else {
                pauseAnimation(); // Stop at end
            }
        }, 1000); // adjust speed as needed
    }
    
    function pauseAnimation() {
        isPlaying = false;
        d3.select("#play-icon").text("play_arrow"); // Material Icon name = "play_arrow"
    
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
        }
    }

export function getAppState() {
    return appState;
}

const searchInput = document.getElementById('search');

searchInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const query = searchInput.value.trim().toLowerCase();
        handleCountrySearch(query);
    }
});

function populateCountrySuggestions() {
    const datalist = document.getElementById('country-options');

    // Clear any old options
    datalist.innerHTML = "";

    // Loop through all countries
    Object.values(pandemicData).forEach(country => {
        const option = document.createElement('option');
        option.value = country.properties.country;
        datalist.appendChild(option);
    });
}

function handleCountrySearch(query) {
    const matchingCountry = Object.values(pandemicData).find(country => {
        return country.properties.country.toLowerCase() === query;
    });

    if (matchingCountry) {
        appState.selectedCountry = matchingCountry.properties.country;
        appState.selectedCountryCode = matchingCountry.properties.country_code;
        appState.countryPandemicData = matchingCountry;

        d3.select("#info-container > .header")
                .text(appState.selectedCountry)
                .style("color", "white");
        
        searchInput.value = ''; // Clear the search input

        renderCountryDetails();
        updateMapColors();
        drawLogGraphForCountry(matchingCountry.properties.country_code);

        if (zoomMode) {
            zoomToSelectedCountry();
        }
    } else {
        alert('No matching country found.');
    }
}