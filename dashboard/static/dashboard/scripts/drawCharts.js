
var color;
var parsedData;
var ttFormatTime = d3.timeFormat("%d-%m-%Y %X");
var iconCels = "\u2103";
var updateFlag = false;
var updateInterval = 30000; // 30 seconds

// Chart width and height setting
var svgWidth = 650, svgHeight = 400;
var margin = { top: 20, right: 20, bottom: 50, left: 80 };
var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;
var width_mid = width / 2;
var height_mid = height / 2;

// API URL
var api = 'http://localhost:8000/api/devices';

// After everything is loaded
document.addEventListener("DOMContentLoaded", function(event) {
  color = document.getElementById("colors").value;
  fetchDataFromAPI(api);

  setInterval(function() {
    fetchDataFromAPI(api);
  }, updateInterval);
});

function fetchDataFromAPI(api) {
  fetch(api)
    .then(function(response) { return response.json(); })
    .then(function(apiData) {
      if (!updateFlag) {
        // First display of chart
        updateFlag = true;
        parsedData = parseData(apiData);
        console.log(parsedData);
        drawLineChart(parsedData);
      }
      else {
        // After display the chart, update it every 5s
        parsedData = parseData(apiData);
        console.log(parsedData);
        updateChart(parsedData);
      }
    })
}

function parseData(data) {
  var arr = [];
  for (var i in data) {
    var datetime = new Date(data[i].timestamp);
    //console.log(parseDate(datetime));
    arr.push(
      {
        ts: datetime,
        temperature: data[i].data["temperature"],
      }
    );
  }
  return arr;
}

function drawLineChart(data) {

  var svg = d3.select('svg')
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  var g = svg.append("g")
    .attr("class", "chart")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // scale the range of x-axis
  var x = d3.scaleTime()
    .domain(d3.extent(data, function(d) { return d.ts }))
    .range([0, width]);

  // scale the range of y-axis
  var y = d3.scaleLinear()
    .domain(d3.extent(data, function(d) { return d.temperature }))
    .range([height, 0]);

  var xAxis = d3.axisBottom(x)
    .tickSize(8);   // length of the each tick
    //.ticks(d3.timeHour.every(24))
    //.tickFormat(d3.timeFormat("%m-%d"));

  var yAxis = d3.axisLeft(y)
    .tickSize(8);

  var line = d3.line()
    .x(function(d) { return x(d.ts)})
    .y(function(d) { return y(d.temperature)});

  // append x-axis and label
  g.append("g")
    .attr("class", "x-axis")
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
    .attr("class", "y-axis")
    .call(yAxis)
    .append("text")
    .attr("class", "text-label")
    .attr("fill", "#000")
    .attr("x", 60 - height_mid)
    .attr("y", 30 - margin.left)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "end")
    .text("Temperature " + iconCels);

  g.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", 1.5)
    .attr("d", line);

  g.selectAll("circle").data(data).enter()
    .append("circle")
    .attr("class", "dotPoint")
    .attr("r", 4)
    .attr("cx", (d, i) => x(d.ts))
    .attr("cy", (d, i) => y(d.temperature))
    .attr("fill", (d) => {
      return (d.temperature >= 30) ? "red" : "blue";
    });
}

function changeColor(e) {
  color = e.target.value;
  d3.select(".line").attr("stroke", color);
}

function changeTimeline(e) {
  var timeline = e.target.value;
  if (timeline == "today") {
    api = 'http://localhost:8000/api/devices/?timestamp=today';
    fetchDataFromAPI(api);
  }
  else if (timeline == "last7Days") {
    api = 'http://localhost:8000/api/devices/?timestamp=last7day';
    fetchDataFromAPI(api);
  }
  else if (timeline == "thisMonth") {
    api = 'http://localhost:8000/api/devices/?timestamp=thismonth';
    fetchDataFromAPI(api);
  }
  else if (timeline == "thisYear") {
    api = 'http://localhost:8000/api/devices/?timestamp=thisyear';
    fetchDataFromAPI(api);
  }
}

function drawScatterPlot(data) {
  /*var svgWidth = 600, svgHeight = 380;
  var margin = { top: 30, right: 30, bottom: 30, left: 30 };
  var width = svgWidth - margin.left - margin.right;
  var height = svgHeight - margin.top - margin.bottom;

  var svg = d3.select('svg')
  .attr("width", svgWidth)
  .attr("height", svgHeight);

  svg.selectAll("circle")
  .data(data)
  .enter()
  .append("circle")
  .attr("r", 3)
  .attr("cx", (d, i) => d.ts)
  .attr("cy", (d, i) => height - d.temp)
  .attr("fill", (d) => {
  return d.temp > 25.0 ? "red" : "blue";
  });*/

}

function updateChart(data) {
  var x = d3.scaleTime()
    .domain(d3.extent(data, function(d) { return d.ts }))
    .range([0, width]);

  var y = d3.scaleLinear()
    .domain(d3.extent(data, function(d) { return d.temperature }))
    .range([height, 0]);

  var xAxis = d3.axisBottom(x)
    .tickSize(8);   // length of the each tick
    //.ticks(d3.timeHour.every(24))
    //.tickFormat(d3.timeFormat("%m-%d"));

  var yAxis = d3.axisLeft(y)
    .tickSize(8);

  var line = d3.line()
    .x(function(d) { return x(d.ts)})
    .y(function(d) { return y(d.temperature)});

  var svg = d3.select("svg").transition();

  svg.select(".line")
    .duration(1000)  // length of animation in ms
    .attr("d", line);

  svg.select(".x-axis")
    .duration(1000)
    .call(xAxis);

  svg.select(".y-axis")
    .duration(1000)
    .call(yAxis);

/*
  // update all circles
  d3.selectAll("circle")
    .data(data)
    .transition()
    .duration(1000)
    .attr("cx", (d, i) => x(d.ts))
    .attr("cy", (d, i) => y(d.temperature));

  d3.select("svg").selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("r", 3)
    .attr("cx", (d, i) => x(d.ts))
    .attr("cy", (d, i) => y(d.temperature));

  d3.select("svg").selectAll("circle")
    .data(data)
    .exit()
    .remove();*/
}

