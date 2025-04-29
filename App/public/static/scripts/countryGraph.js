import { getAppState } from "./main.js";

const container = document.getElementById('country-graph');
const containerWidth = container.getBoundingClientRect().width;

// window.addEventListener('load', () => {
//     drawLogGraphForCountry(getAppState().selectedCountryCode);
// });

// Now set width and height dynamically
const margin = { top: 20, right: 30, bottom: 40, left: 60 };
const width = containerWidth - margin.left - margin.right;
const height = 200 - margin.top - margin.bottom; // keep height fixed for now
console.log('Container width:', containerWidth, 'Graph width:', width, 'Graph height:', height);

let weekMarker = null; // Declare weekMarker here
let weekLabel = null; // Declare weekLabel here

// Create SVG once
const svgLog = d3.select("#country-graph")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const x = d3.scaleTime()
    .range([0, width]);

const y = d3.scaleLog()
    .clamp(true) // clamps out-of-bounds values
    .range([height, 0]);

const lineCases = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.cases));

const lineDeaths = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.deaths));

// Create Lines once
const casesLine = svgLog.append("path")
    .attr("class", "line-cases")
    .attr("fill", "none")
    .attr("stroke", "red")
    .attr("stroke-width", 2);

const deathsLine = svgLog.append("path")
    .attr("class", "line-deaths")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2);

// Axis groups (optional if you want to update axis dynamically)
const xAxisGroup = svgLog.append("g")
    .attr("transform", `translate(0,${height})`)
    .attr("class", "x-axis");

const yAxisGroup = svgLog.append("g")
    .attr("class", "y-axis");

// Create Week Marker once
weekMarker = svgLog.append("line")
    .attr("class", "week-marker")
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "5,5");

weekLabel = svgLog.append("text")
    .attr("class", "week-label")
    .attr("text-anchor", "middle")
    .attr("y", -5)
    .attr("fill", "white")
    .attr("font-size", "12px");

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

function getCountryData(countryCode) {
    if (!fullPandemicDataset[countryCode]) {
        console.warn(`No data found for country code ${countryCode}`);
        return null;
    }
    console.log(`Data for ${countryCode}:`, fullPandemicDataset[countryCode]);
    return fullPandemicDataset[countryCode];
}

function prepareGraphData(countryData) {
    const data = countryData.data;
    const population = countryData.properties.population;

    const parseWeek = d3.timeParse("%Y-%W"); // for "2020-01" week format

    return Object.keys(data).map(week => {
        const entry = data[week];
        return {
            date: parseWeek(week),
            cases: entry.cases,
            deaths: entry.deaths,
            susceptible: Math.max(1, population - entry.cases - entry.deaths)
        };
    });
}

export async function drawLogGraphForCountry(countryCode) {
    d3.select("#country-graph")
        .style("visibility", "visible")
        .style("opacity", 1);

    const countryData = getCountryData(countryCode);

    if (!countryData) {
        console.error('No data to draw');

        // 👇 Hide the graph if no data
        d3.select("#country-graph")
            .style("visibility", "hidden")
            .style("opacity", 0);

        return;
    }

    const graphData = prepareGraphData(countryData);

    if (graphData.length === 0) {
        console.warn('Country has no graph data');

        // 👇 Hide the graph if no graph points
        d3.select("#country-graph")
            .style("display", "none")
            .style("visibility", "hidden")
            .style("opacity", 0);

        return;
    }

    updateGraphLines(graphData); // Smoothly transition to new country's data
    updateWeekMarker(); // Update week marker to current week
}

await loadPandemicDataset(); // Load the dataset first
// drawLogGraphForCountry("GBR"); // Example usage, replace with actual country code

export function updateWeekMarker() {
    if (!weekMarker || !weekLabel) {
        console.warn('Week marker or label not initialized yet.');
        return;
    }

    const currentDate = d3.timeParse("%Y-%W")(getAppState().currentWeek);

    weekMarker
        .transition()
        .duration(200)
        .attr("x1", x(currentDate))
        .attr("x2", x(currentDate));

    weekLabel
        .transition()
        .duration(200)
        .attr("x", x(currentDate))
        .text(getAppState().currentWeek); // set text to current week
}

function updateGraphLines(graphData) {
    // Update x and y domain based on new data
    x.domain(d3.extent(graphData, d => d.date));
    y.domain([1, d3.max(graphData, d => Math.max(d.susceptible, d.cases, d.deaths))]);

    // Update axis if needed (optional)
    d3.select(".x-axis")
        .transition()
        .duration(1000)
        .call(d3.axisBottom(x).ticks(0));

    d3.select(".y-axis")
        .transition()
        .duration(1000)
        .call(d3.axisLeft(y).ticks(10, "~s"));


    // Animate line transition
    d3.select(".line-cases")
        .datum(graphData)
        .transition()
        .duration(1000) // 1 second smooth
        .attr("d", lineCases);

    d3.select(".line-deaths")
        .datum(graphData)
        .transition()
        .duration(1000)
        .attr("d", lineDeaths);

    // d3.select(".line-susceptible")
    //     .datum(graphData)
    //     .transition()
    //     .duration(1000)
    //     .attr("d", lineSusceptible);
}