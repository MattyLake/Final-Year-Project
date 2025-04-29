import { getAppState } from "./main.js";

const container = document.getElementById('country-graph');
const containerWidth = container.getBoundingClientRect().width;

window.addEventListener('load', () => {
    drawLogGraphForCountry(getAppState().selectedCountryCode);
});

// Now set width and height dynamically
const margin = { top: 20, right: 30, bottom: 40, left: 60 };
const width = containerWidth - margin.left - margin.right;
const height = 200 - margin.top - margin.bottom; // keep height fixed for now
console.log('Container width:', containerWidth, 'Graph width:', width, 'Graph height:', height);

let weekMarker = null; // Declare weekMarker here
let weekLabel = null; // Declare weekLabel here

const svgLog = d3.select("#graph")
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

const lineSusceptible = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.susceptible));


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
    const countryData = getCountryData(countryCode);

    if (!countryData) {
        console.error('No data to draw');
        return;
    }

    const graphData = prepareGraphData(countryData);
    console.log('Graph data:', graphData);

    // Clear old graph
    d3.select("#country-graph").selectAll("*").remove();

    const svgLog = d3.select("#country-graph")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Domains
    x.domain(d3.extent(graphData, d => d.date));
    y.domain([1, d3.max(graphData, d => Math.max(d.susceptible, d.cases, d.deaths))]);

    // X Axis
    svgLog.append("g")
        .attr("transform", `translate(0,${height})`)
        //.call(d3.axisBottom(x).ticks(10).tickFormat(d3.timeFormat("%Y-%W")));
        .call(d3.axisBottom(x).ticks(0).tickFormat(d3.timeFormat("")));

    // Y Axis
    svgLog.append("g")
        .call(d3.axisLeft(y).ticks(10, "~s"));

    // Lines
    // svgLog.append("path")
    //     .datum(graphData)
    //     .attr("fill", "none")
    //     .attr("stroke", "blue")
    //     .attr("stroke-width", 2)
    //     .attr("d", lineSusceptible);

    svgLog.append("path")
        .datum(graphData)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("d", lineCases);

    svgLog.append("path")
        .datum(graphData)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("d", lineDeaths);
    
    // // X Axis Label
    // svgLog.append("text")
    //     .attr("text-anchor", "middle")
    //     .attr("x", width / 2)
    //     .attr("y", height + margin.bottom - 5)
    //     .text("Time (Weeks)")
    //     .attr("fill", "white");

    // // Y Axis Label
    // svgLog.append("text")
    //     .attr("text-anchor", "middle")
    //     .attr("transform", "rotate(-90)")
    //     .attr("x", -height / 2)
    //     .attr("y", -margin.left + 20)
    //     .text("Population (log scale)")
    //     .attr("fill", "white");
    
    // const legendData = [
    //     { name: "Susceptible", color: "blue" },
    //     { name: "Cases", color: "red" },
    //     { name: "Deaths", color: "black" }
    // ];
    
    // // Create one 'g' per legend item
    // const legend = svgLog.selectAll(".legend")
    //     .data(legendData)
    //     .enter()
    //     .append("g")
    //     .attr("class", "legend")
    //     .attr("transform", (d, i) => `translate(0,${i * 20})`);
    
    // // Draw colored squares
    // legend.append("rect")
    //     .attr("x", width - 18)
    //     .attr("width", 18)
    //     .attr("height", 18)
    //     .style("fill", d => d.color);
    
    // // Draw legend text
    // legend.append("text")
    //     .attr("x", width - 24)
    //     .attr("y", 9)
    //     .attr("dy", "0.35em")
    //     .style("text-anchor", "end")
    //     .style("fill", "white")
    //     .text(d => d.name);

    weekMarker = svgLog.append("line")
        .attr("class", "week-marker")
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5"); // dotted line
    
    weekLabel = svgLog.append("text")
        .attr("class", "week-label")
        .attr("text-anchor", "middle")
        .attr("y", -5) // position slightly above the graph
        .attr("fill", "white")
        .attr("font-size", "12px");
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