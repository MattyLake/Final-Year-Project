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
    .translate([width / 2, height/1.43]);

var path = d3.geoPath().projection(projection);

let currentCountry = null;

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

            if (currentCountry === null || d3.select(this).datum().properties.iso_a3 != currentCountry.datum().properties.iso_a3) {
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
            if (currentCountry === null || d3.select(this).datum().properties.iso_a3 != currentCountry.datum().properties.iso_a3) {
                d3.select(this)
                .style("cursor", "default")
                .attr("stroke", borderColour)
                .attr("stroke-width", strokeWeight);
                
                if (currentCountry === null) {
                    d3.select("#info-container > .header")
                        .text("Hover over a country")
                        .style("color", "white");
                } else {
                    d3.select("#info-container > .header")
                        .text(currentCountry.datum().properties.name)
                        .style("color", "white");
                }                    
            } else {
                d3.select(this)
                    .attr("stroke", clickColour)
                    .attr("stroke-width", clickStrokeWeight);
            }
        })
        .on("click", function(event, d) {
            if (currentCountry !== null) {
                currentCountry.attr("stroke", borderColour)
                    .attr("stroke-width", 0.25);
            }
            currentCountry = d3.select(this);
            // currentCountry.attr("fill", clickColour);
            currentCountry.attr("stroke", clickColour)
                          .attr("stroke-width", 3);
            d3.select("#info-container > .header")
                .text(currentCountry.datum().properties.name)
                .style("color", "white");

            d3.select("#info-container > .header")
                .text(d.properties.name);

            loadData(d.properties.iso_a3);
        });
}).catch(function(error) {
    console.error('Error loading or parsing data:', error);
});


function loadData(countryCode) {
    let currentTimestamp = 1587855600;
    let currentCountryCode = countryCode;
    d3.json("data/pandemicData").then(function(data) {
        try {
            d3.select("#info-container > .content > #info-box")
                .text("Cases: " + data[countryCode].data[currentTimestamp].cases + " Deaths: " + data[countryCode].data[currentTimestamp].deaths);
        } catch (error) {
            d3.select("#info-container > .content > #info-box")
                .text("No data available");
        }
    }).catch(function(error) { 
        console.error('Error loading or parsing data:', error);
    });
}