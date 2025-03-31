import { loadData, loadAllData } from './interface.js'
import { setTimelineDate, convertDateFromSlider } from './timeline.js';

let baseColour = "#aaaaaa";
let highlightColour = "#888888";
let clickColour = "#aa4444";
let borderColour = "#333333";
let strokeWeight = 0.25;
let hoverStrokeWeight = 1;
let clickStrokeWeight = 2;



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

const state = { // Object is constant, but properties are mutable
    country: null,
    date: document.getElementById("timeline-slider").value
}

var countries = d3.json("data/mapPolygonData").then(function(data) {
    // Bind data and create one path per GeoJSON feature
    svg.append("g")
        .selectAll("path")
        .data(data.features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", baseColour)
        .attr("stroke", borderColour)
        .attr("stroke-width", 0.25)
        .on("mouseover", function(event, d) {
            d3.select(this)
                .style("cursor", "pointer");

            d3.select("#info-container > .header")
                .text(d.properties.name);

            if (state.country === null || d3.select(this).datum().properties.iso_a3 != state.country.datum().properties.iso_a3) {
                d3.select(this)
                    .attr("stroke-width", hoverStrokeWeight)
                    .attr("stroke", highlightColour);
                
                d3.select("#info-container > .header")
                    .style("color", "gray");
            } else {
                d3.select(this)
                    .attr("stroke-width", clickStrokeWeight)
                    .attr("stroke", clickColour);

                d3.select("#info-container > .header")
                    .style("color", "white");
            }
        })
        .on("mouseout", function() {
            if (state.country === null || d3.select(this).datum().properties.iso_a3 != state.country.datum().properties.iso_a3) {
                d3.select(this)
                .style("cursor", "default")
                .attr("stroke", borderColour)
                .attr("stroke-width", strokeWeight);
                
                if (state.country === null) {
                    d3.select("#info-container > .header")
                        .text("Hover over a country")
                        .style("color", "white");
                } else {
                    d3.select("#info-container > .header")
                        .text(state.country.datum().properties.name)
                        .style("color", "white");
                }                    
            } else {
                d3.select(this)
                    .attr("stroke", clickColour)
                    .attr("stroke-width", clickStrokeWeight);
            }
        })
        .on("click", async function(event, d) {
            if (state.country !== null) {
                state.country.attr("stroke", borderColour)
                    .attr("stroke-width", 0.25);
            }
            state.country = d3.select(this);
            // currentCountry.attr("fill", clickColour);
            state.country.attr("stroke", clickColour)
                          .attr("stroke-width", 3);
            d3.select("#info-container > .header")
                .text(state.country.datum().properties.name)
                .style("color", "white");

            d3.select("#info-container > .header")
                .text(d.properties.name);

            try {
                let currentData = await loadData(state);
                setTimelineDate(state.date);
                if (currentData) {
                    updateDashboard(currentData, state);
                } else {
                    d3.select("#info-container > .content > #info-box")
                        .text("No data available");
                }
            } catch (error) {
                console.error('Error loading or parsing data:', error);
            }
        });
}).catch(function(error) {
    console.error('Error loading or parsing data:', error);
});

// Give the timeline slider an event listener to update the date and render the dashboard on new data
document.getElementById("timeline-slider").addEventListener("input", async function() {
    state.date = convertDateFromSlider(this.value);
    let currentData = await loadData(state);
    setTimelineDate(state.date);
    console.log("Current date: " + state.date);
    updateChloropleth(state);
    if (currentData) {
        updateDashboard(currentData, state);
    } else {
        d3.select("#info-container > .content > #info-box")
            .text("No data available");
    }
});

function updateDashboard(data, state) {
    d3.select("#info-container > .content > #info-box")
        .text("Cases: " + data.cases
            + "\nDeaths: " + data.deaths
            + "\nSusceptible: " + data.susceptible
            + "\nCountry: " + state.country.datum().properties.name);
}

async function updateChloropleth(state) {
    // Update map chloropleth information using loadAllData function
    loadAllData(state).then(function(allData) {
        if (allData) {
            Object.keys(allData).forEach(countryCode => {
                let countryData = allData[countryCode];
                let cases = countryData.data[state.date]?.cases || 0;
                let country = svg.selectAll("path").filter(d => d.properties.iso_a3 === countryCode);
                if (!country.empty()) {
                    country.transition()
                        .duration(100) // Smooth transition duration in milliseconds
                        .attr("fill", d3.interpolateReds(Math.log10(cases + 1) / Math.log10(1000000 + 1))) // Logarithmic scaling
                }
            });
        } else {
            console.log("No data available to update the map.");
        }
    });
}