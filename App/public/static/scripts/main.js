import { loadPandemicDataForCountry, getUniqueDataKeys } from './interface.js';
import { drawLogGraphForCountry, updateWeekMarkerCountry } from './countryGraph.js';
import { initComparisonGraph, updateComparisonGraph, updateWeekMarkerComparison } from './comparisonGraph.js';

let baseColour = "#aaaaaa";
let highlightColour = "#5BC0EB";
let clickColour = "#318ab0";
let borderColour = "#333333";
let strokeWeight = 0.25;
let hoverStrokeWeight = 2;
let clickStrokeWeight = 4;
const datesArray = await getUniqueDataKeys().then(function(data) {
    return data;
});

let fullPandemicDataset = {};
async function loadPandemicDataset() {
    try {
        const response = await fetch("data/pandemicData"); // or wherever your file is
        if (!response.ok) {
            throw new Error('Network error');
        }
        fullPandemicDataset = await response.json();
        console.log('Pandemic dataset loaded:', fullPandemicDataset);
    } catch (error) {
        console.error('Error loading pandemic dataset:', error);
    }
}
await loadPandemicDataset(); // Load the dataset first
const mapGeoData = await d3.json("data/mapPolygonData");
window.fullPandemicDataset = fullPandemicDataset; // Make it globally accessible

// Merge GeoJSON properties into pandemicData
mapGeoData.features.forEach(feature => {
    const iso = feature.properties.iso_a3;
    const target = fullPandemicDataset[iso];
    if (target) {
        // Merge extra properties (like GDP) from GeoJSON into pandemicData
        target.extra = feature.properties;
    }
});

console.log('Merged pandemic data:', fullPandemicDataset);

populateCountrySuggestions(); // Function call to populate datalist for searchbar
populateCountrySuggestions("search-container", "country-options");
populateCountrySuggestions("compare-country-code", "compare-options");

initComparisonGraph("#comparison-graph");

let appState = {
    selectedCountry: null,
    selectedCountryCode: null,
    countryPandemicData: null,
    currentWeek: datesArray[0] // Default to the first date in the data
};
window.appState = appState; // Make it globally accessible

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
                .text(d.properties.name)
                .style("color", "gray");
        })
        
        .on("mouseout", function(event, d) {
            const countryCode = d.properties.iso_a3;
        
            // If this is the selected country, keep the click color
            const isSelected = appState.selectedCountryCode === countryCode;
        
            d3.select(this)
                .attr("stroke", isSelected ? clickColour : borderColour)
                .attr("stroke-width", isSelected ? clickStrokeWeight : strokeWeight);
        
            // Restore header
            const header = d3.select("#info-container > .header");
            if (appState.selectedCountry) {
                header.text(appState.selectedCountry).style("color", "white");
            } else {
                header.text("Select a country").style("color", "white");
            }
        })
        .on("click", async function(event, d) {
            const countryName = d.properties.name;
            const countryCode = d.properties.iso_a3;
        
            // Update app state
            appState.selectedCountry = countryName;
            appState.selectedCountryCode = countryCode;
        
            // Load pandemic data for this country
            const countryPandemicData = await loadPandemicDataForCountry(countryCode);
            appState.countryPandemicData = countryPandemicData;
        
            // Set header
            d3.select("#info-container > .header")
                .text(countryName)
                .style("color", "white");
        
            // Info box loading message
            d3.select("#info-box")
                .text(`Loading data for ${countryName}...`);
        
            // Reset all borders
            d3.selectAll("path.country")
                .attr("stroke", borderColour)
                .attr("stroke-width", strokeWeight);
        
            // Highlight clicked country
            d3.select(this)
                .attr("stroke", clickColour)
                .attr("stroke-width", clickStrokeWeight);
        
            // Optional zoom
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
        
            // Update detail panel + graphs
            drawLogGraphForCountry(countryCode);
            updateComparisonGraph(fullPandemicDataset);
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

const colorScale = d3.scaleSequentialLog()
    .domain([1, 100000]) // minimum and maximum number of cases, using 1 to avoid log(0)
    .interpolator(d3.interpolateReds);

// Legend for the color scale
const legendSvg = d3.select("#legend-container svg");

const defs = legendSvg.append("defs");

const gradient = defs.append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("x1", "0%")
    .attr("x2", "100%");

const nStops = 10;
for (let i = 0; i <= nStops; i++) {
    gradient.append("stop")
        .attr("offset", `${(i / nStops) * 100}%`)
        .attr("stop-color", colorScale(Math.pow(10, (i / nStops) * (Math.log10(100000) - Math.log10(1)) + Math.log10(1))));
}

const legendWidth = 200;
const legendHeight = 10;

legendSvg.append("rect")
    .attr("x", 10)
    .attr("y", 10)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");

legendSvg.append("text")
    .attr("x", 10)
    .attr("y", 45)
    .attr("fill", "white") // or a color that fits your theme
    .attr("font-size", "12px")
    .text("Weekly Cases (Log Scale)");

const legendScale = d3.scaleLog()
    .domain([1, 100000])
    .range([0, legendWidth]);

const legendAxis = d3.axisBottom(legendScale)
    .ticks(4, "~s")
    .tickSize(legendHeight + 4);

legendSvg.append("g")
    .attr("transform", "translate(10,10)")
    .call(legendAxis)
    .select(".domain").remove();



// Timeline slider logic
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
        updateWeekMarkerCountry();
        updateWeekMarkerComparison()
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
            No pandemic data available for this country.
        `);
        return;
    }

    let data = appState.countryPandemicData.data;
    let currentWeek = appState.currentWeek;

    if (data[currentWeek]) {
        // detailDiv.html(`
        //     Cases: ${data[currentWeek].cases}<br/>
        //     Deaths: ${data[currentWeek].deaths}<br/>
        //     Susceptible: ${appState.countryPandemicData.properties.population - data[currentWeek].cases - data[currentWeek].deaths}
        // `);
        detailDiv.html(`
            <span style="color: red">Cases: </span>: ${data[currentWeek].cases}
            &nbsp;&nbsp;
            <span style="color: black">Deaths: </span>: ${data[currentWeek].deaths}
            &nbsp;&nbsp;
        `);
    } else {
        detailDiv.html(`
            Data for the selected week is not available.
        `);
    }
}

function updateMapColors() {
    d3.selectAll('path.country')
        .transition()
        .duration(200)
        .style('fill', function(d) {
            let countryName = d.properties.name;
            let countryCode = d.properties.iso_a3;
            let weekData = null;
            try {
                weekData = fullPandemicDataset[countryCode].data[appState.currentWeek];
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

const searchInput = document.getElementById('search');

searchInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const query = searchInput.value.trim().toLowerCase();
        handleCountrySearch(query);
    }
});

function populateCountrySuggestions(inputId, datalistId = 'country-options') {
    const datalist = document.getElementById(datalistId) || document.createElement('datalist');
    datalist.id = datalistId;

    // Attach to document once
    if (!datalist.parentElement) {
        document.body.appendChild(datalist);
    }

    // Clear old options
    datalist.innerHTML = "";

    // Populate with full country names
    Object.values(fullPandemicDataset).forEach(country => {
        const option = document.createElement('option');
        option.value = country.properties.country; // e.g. "France"
        datalist.appendChild(option);
    });

    // Bind datalist to input field
    const input = document.getElementById(inputId);
    if (input) {
        input.setAttribute("list", datalistId);
    }
}

function handleCountrySearch(query) {
    const matchingCountry = Object.values(fullPandemicDataset).find(country => {
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