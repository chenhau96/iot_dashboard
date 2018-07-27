
var parsedData;
var ttFormatTime = d3.timeFormat("%d-%m-%Y %X");
var iconCels = "\u2103";
var interval = 5000;

document.addEventListener("DOMContentLoaded", function(event) {
  var api = 'http://localhost:8000/api/devices/?device_id=' + device_id;

  // Set an interval to update the charts without reloading the page
  //setInterval(function() {
      fetchDataFromAPI(api);
  //   },
  //   interval);
});

function fetchDataFromAPI(api) {
  fetch(api)
    .then(function(response) { return response.json(); })
    .then(function(apiData) {
      //console.log(data[0].data);
      for (var whichData in apiData[0].data) {
          parsedData = parseData(apiData, whichData)
          drawLineChart(parsedData, whichData);
      }
    })
}

function parseData(data, whichData) {
  var arr = [];
  for (var i in data) {
    var datetime = new Date(data[i].timestamp);
    arr.push(
       {
           ts: datetime,
           temperature: data[i].data[whichData],
       }
    );
  }
  return arr;
}

function drawLineChart(data, whichData) {

  var div = d3.select(".device-charts")
  .append("div")
  .attr("id", whichData);

  var svgWidth = 650, svgHeight = 400;
  var margin = { top: 20, right: 20, bottom: 50, left: 80 };
  var width = svgWidth - margin.left - margin.right;
  var height = svgHeight - margin.top - margin.bottom;
  var width_mid = width / 2;
  var height_mid = height / 2;

  var svg = d3.select('#' + whichData)
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

  var g = svg.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var x = d3.scaleTime()
  .domain(d3.extent(data, function(d) { return d.ts }))
  .range([0, width]);

  var y = d3.scaleLinear()
  .domain(d3.extent(data, function(d) { return d.temperature }))
  .range([height, 0]);

  var xAxis = d3.axisBottom(x)
  //.ticks(d3.timeHour.every(24))
  .tickSize(8);   // length of the each tick
  //.tickFormat(d3.timeFormat("%m-%d"));

  var yAxis = d3.axisLeft(y)
  .tickSize(8);

  var line = d3.line()
    .x(function(d) { return x(d.ts)})
    .y(function(d) { return y(d.temperature)});

  // append x-axis and label
  g.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .append("text")
    .attr("class", "text-label")
    .attr("fill", "#000")
    .attr("transform", "translate(" + width_mid + ", " + 40 + ")")
    .attr("text-anchor", "middle")
    .text("Timeline");

  // append y-axis and label
  g.append("g")
    .call(yAxis)
    .append("text")
    .attr("class", "text-label")
    .attr("fill", "#000")
    .attr("x", 60 - height_mid)
    .attr("y", 30 - margin.left)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "end")
    .text(whichData);

  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("class", "line")
    .attr("stroke-width", 1.5)
    .attr("d", line);

  g.selectAll("circle").data(data).enter()
    .append("circle")
    .attr("r", 4)
    .attr("cx", (d, i) => x(d.ts))
    .attr("cy", (d, i) => y(d.temperature));
}

function updateChart() {

}


