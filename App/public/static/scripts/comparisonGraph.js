import { getCountryData } from "./countryGraph.js";

let svg, x, y, line, baseLinePath, compareLinePath;
let container, width, height;
let weekMarker = null; // Declare weekMarker
let weekLabel = null; // Declare weekLabel


// Initialize the comparison graph
export function initComparisonGraph(containerSelector) {
    container = document.querySelector(containerSelector);
    const containerWidth = container.getBoundingClientRect().width;

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    width = containerWidth - margin.left - margin.right;
    height = 150;

    svg = d3.select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    x = d3.scaleTime().range([0, width]);
    y = d3.scaleLog().clamp(true).range([height, 0]);

    svg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`);
    svg.append("g").attr("class", "y-axis");

    line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.value));

    baseLinePath = svg.append("path")
        .attr("class", "line-base")
        .attr("stroke", "orange")
        .attr("stroke-width", 2)
        .attr("fill", "none");

    compareLinePath = svg.append("path")
        .attr("class", "line-compare")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("fill", "none");

    // Create Week Marker once
    weekMarker = svg.append("line")
    .attr("class", "week-marker")
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "5,5");

    weekLabel = svg.append("text")
    .attr("class", "week-label")
    .attr("text-anchor", "middle")
    .attr("y", height + 20)
    .attr("fill", "white")
    .attr("font-size", "12px");

    // Clear previous listeners if reinitiated
    document.getElementById("compare-metric")?.addEventListener("change", () => {
        if (window.fullPandemicDataset) updateComparisonGraph(window.fullPandemicDataset);
    });

    document.getElementById("compare-country-code")?.addEventListener("change", () => {
        if (window.fullPandemicDataset) updateComparisonGraph(window.fullPandemicDataset);
    });

    document.getElementById("normalize-toggle")?.addEventListener("change", () => {
        if (window.fullPandemicDataset) updateComparisonGraph(window.fullPandemicDataset);
    });
}

// Update the comparison graph with new data
export function updateComparisonGraph(fullDataset) {
    const metric = document.getElementById("compare-metric").value;
    const compareEntry = document.getElementById("compare-country-code").value;
    const compareCode = getCodeFromName(compareEntry) || "USA"; // Default to USA if invalid code is provided
    if (!compareCode || !fullDataset[compareCode]) {
        console.warn(`Invalid or missing compare country code: "${compareCode}"`);
    }
    const baseCode = window.appState?.selectedCountryCode;
    const normalize = document.getElementById("normalize-toggle").checked;

    const baseData = prepareCountryLineData(baseCode, metric, fullDataset, normalize);
    const compareData = prepareCountryLineData(compareCode, metric, fullDataset, normalize);

    d3.select("#comparison-graph")
        .style("visibility", "visible")
        .style("opacity", 1);

    if (baseData.length === 0 && compareData.length === 0) return;

    const countryData = getCountryData(appState.selectedCountryCode);

    if (!countryData) {
        console.error('No data to draw');

        // Hide the graph if no data
        d3.select("#comparison-graph")
            .style("visibility", "hidden")
            .style("opacity", 0);

        return;
    }

    const allData = baseData.concat(compareData);
    x.domain(d3.extent(allData, d => d.date));
    y.domain([1, d3.max(allData, d => d.value)]);

    svg.select(".x-axis")
        .transition().duration(500)
        .call(d3.axisBottom(x).ticks(0));

    svg.select(".y-axis")
        .transition().duration(500)
        .call(d3.axisLeft(y).ticks(5, "~s"));

    baseLinePath
        .datum(baseData)
        .transition().duration(1000)
        .attr("d", line);

    compareLinePath
        .datum(compareData)
        .transition().duration(1000)
        .attr("d", line);
    
    updateWeekMarkerComparison()
}

// Moves the week marker to the current week
export function updateWeekMarkerComparison() {
    if (!weekMarker || !weekLabel) {
        console.warn('Week marker or label not initialized yet.');
        return;
    }

    const currentDate = d3.timeParse("%Y-%W")(appState.currentWeek);
    const currentWeekKey = appState.currentWeek;

    weekMarker
        .transition()
        .duration(200)
        .attr("x1", x(currentDate))
        .attr("x2", x(currentDate));

    weekLabel
        .transition()
        .duration(200)
        .attr("x", x(currentDate))
        .text(appState.currentWeek); // set text to current week

    // Display current values
    const metric = document.getElementById("compare-metric").value;
    const normalize = document.getElementById("normalize-toggle").checked;
    const compareEntry = document.getElementById("compare-country-code").value.trim().toUpperCase() || "USA";
    const compareCode = getCodeFromName(compareEntry) || "USA"; // Default to USA if invalid code is provided
    const baseCode = window.appState.selectedCountryCode;

    const baseCountry = window.fullPandemicDataset[baseCode];
    const compareCountry = window.fullPandemicDataset[compareCode];

    const getValue = (country) => {
        if (!country || !country.data[currentWeekKey]) return "—";

        const raw = country.data[currentWeekKey][metric];
        if (!normalize) return raw;

        const gdp = +country.extra?.gdp_md || 0;
        const pop = +country.properties?.population || 1;
        const perCapita = gdp > 0 ? gdp * 1_000_000 / pop : 1;

        return (raw / perCapita).toFixed(2);
    };

    const valueBase = getValue(baseCountry);
    const valueCompare = getValue(compareCountry);

    const metricLabel = {
        cases: "Cases",
        deaths: "Deaths"
    }[metric] || metric;
    
    const labelSuffix = normalize ? " [per GDP]" : "";
    const fullLabel = `${metricLabel}${labelSuffix}`;

    d3.select("#comparison-values").html(`
        <strong>${fullLabel}</strong><br>
        <span style="color: orange">${baseCode}</span>: ${valueBase}
        &nbsp;&nbsp;
        <span style="color: steelblue">${compareCode}</span>: ${valueCompare}
    `);
}

function prepareCountryLineData(code, metric, fullDataset, normalize = false) {
    const country = fullDataset[code];
    if (!country) return [];

    const parseWeek = d3.timeParse("%Y-%V");

    const gdpMillion = +country.extra?.gdp_md || 0;
    const population = +country.properties.population || 1;
    const gdpPerCapita = (gdpMillion > 0 && population > 0)
    ? (gdpMillion * 1_000_000) / population
    : 1;

    return Object.entries(country.data)
        .map(([week, values]) => {
            const date = parseWeek(week);
            const raw = values?.[metric];
            if (!date || raw == null || isNaN(raw)) return null;

            let value = Math.max(1, raw);
            if (normalize) {
                value = value / gdpPerCapita;
            }

            return { date, value };
        })
        .filter(Boolean);
}

function getCodeFromName(name) {
    if (!name || typeof name !== "string") return null;

    const upperName = name.trim().toUpperCase();

    for (const [code, country] of Object.entries(fullPandemicDataset)) {
        const countryName = country.properties.country?.toUpperCase();
        if (countryName === upperName) {
            return code;
        }
    }

    return null; // not found
}