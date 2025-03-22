import { loadData } from './interface.js';

const div = d3.select('#pie-chart');
let div2 = document.getElementById("pie-chart");
const rect = div2.getBoundingClientRect();
// TODO: Need real dimensions for pie chart
const width = 100;
const height = 100;
const radius = Math.min(width, height) / 2;

loadData('USA', 1619910000).then(function(fetchData) {
    console.log(fetchData);
    const data = [fetchData.cases, fetchData.deaths, fetchData.susceptible];
    console.log(data);
    drawPie(data);
});

function drawPie(data) {
    // TODO: Need a good colour scale for piechart
    const colorScale = d3.scaleOrdinal(["#E63462","#000000","#14CC60"]);

    const svg = div.append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
            .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie().value(d => d).sort(null);
    const arc = d3.arc()
        .outerRadius(radius)
        .innerRadius(radius*0.5);

    console.log(pie(data));

    const g = svg.selectAll('.arc')
        .data(pie(data))
        .enter().append('g')
        .attr('class', 'arc');

    g.append('path')
        .attr('d', arc)
        .attr('class', 'arc')
        .style('fill', (d, i) => colorScale(i))
        .style('stroke', '#333333')
        .style('stroke-width', 0)
        .on('mouseover', function (d, i) {
            d3.select(this).transition()
                .duration(200)
                .attr('opacity', '0.7');
        })
        .on('mouseout', function (d, i) {
            d3.select(this).transition()
                .duration(200)
                .attr('opacity', '1');
        });

        // Hover over pie chart segments to give alt text
        g.append("title")
            .text(function(d, i) {
                // Return name of segment by dictionary key and value
                const labels = ['Cases', 'Deaths', 'Susceptible'];
                return labels[i] + ": " + d.value;
            });

}