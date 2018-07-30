
var chart_config = {
  threshold: 30,
  color: "steelblue",
  chartType: "lineChart",
  timeline: "last3Days",
};

var parsedData;
var ttFormatTime = d3.timeFormat("%d-%m-%Y %X");
var iconCels = "\u2103";  // Celsius icon
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
var api = 'http://localhost:8000/api/devices/?device_id=' + device_id +
          '&data=' + whichData;

// After everything is loaded
document.addEventListener("DOMContentLoaded", function(event) {
  // Fetch data from API
  fetchDataFromAPI(api);

  // Update the charts based on updateInterval value
  setInterval(function() {
    fetchDataFromAPI(api);
  }, updateInterval);
});

function fetchDataFromAPI(api) {
  fetch(api)
    .then(function(response) { return response.json(); })
    .then(function(apiData) {
      if (apiData.length == 0) {
        alert("Today has no data yet");
      }
      else {
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
          //console.log(parsedData);
          updateChart(parsedData);
        }
      }
    })
}

function parseData(apiData) {
  var arr = [];

  for (var i in apiData) {
    // Convert API string date to Date object
    var datetime = new Date(apiData[i].timestamp);

    // Convert to local datetime
    var localDateTime = datetime.getTime() - (datetime.getTimezoneOffset() * 60000);

    // Push the essential data to an array
    arr.push(
      {
        ts: localDateTime,
        temperature: apiData[i].data[whichData],
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
    //.domain(d3.extent(data, function(d) { return d.temperature }))
    .domain([d3.min(data, function(d) { return d.temperature - 5}), d3.max(data, function(d) { return d.temperature + 5})])
    .range([height, 0]);

  // define x-axis
  var xAxis = d3.axisBottom(x)
    .tickSize(-height)   // length of the each tick
    .tickPadding(10);
    //.ticks(d3.timeHour.every(24))
    //.tickFormat(d3.timeFormat("%m-%d"));

  // define y-axis
  var yAxis = d3.axisLeft(y)
    .tickSize(-width)
    .tickPadding(10);

  var line = d3.line()
    //.curve(d3.curveBasis)
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

  // add line path of the line chart
  g.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", chart_config.color)
    .attr("stroke-width", 1.5)
    .attr("d", line(data));

  // add data points to the line
  g.selectAll("circle").data(data).enter()
    .append("circle")
    .attr("class", "dotPoint")
    .attr("r", 4)
    .attr("cx", (d, i) => x(d.ts))
    .attr("cy", (d, i) => y(d.temperature))
    .attr("fill", (d) => {
      // if beyond threshold, change data point's color to red
      return (d.temperature >= 30) ? "red" : "blue";
    });
}

// Change color function
function changeColor(e) {
  // Get value from color drop down list
  var color = e.target.value;

  // Change the color of the line
  d3.select(".line").attr("stroke", color);
}

// Change timeline function
function changeTimeline(e) {
  // Get value from timeline drop down lsit
  var timeline = e.target.value;

  // Set new API call to retrieve new set of data
  if (timeline == "today") {
    api = 'http://localhost:8000/api/devices/?timestamp=today';
  }
  else if (timeline == "last3Days") {
    api = 'http://localhost:8000/api/devices/?timestamp=last3day';
  }
  else if (timeline == "last7Days") {
    api = 'http://localhost:8000/api/devices/?timestamp=last7day';
  }
  else if (timeline == "thisMonth") {
    api = 'http://localhost:8000/api/devices/?timestamp=this-month';
  }
  else if (timeline == "thisYear") {
    api = 'http://localhost:8000/api/devices/?timestamp=this-year';
  }

  // Fetch data from new API
  fetchDataFromAPI(api);
}

// Update chart function
function updateChart(data) {
  // Scale the x and y axis again
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
  var path = d3.selectAll(".line").data(data);

  // Delete the old line path from the chart
  path.exit().remove();

  // Add new line path to the chart
  path
    .enter()
    .append("path")
    .merge(path)
    .attr("class", "line")
    .transition()
    .duration(750)  // length of animation in ms;
    .attr("d", line(data))

  // Update the x-axis
  svg.select(".x-axis")
    .duration(750)
    .call(xAxis);

  // Update the y-axis
  svg.select(".y-axis")
    .duration(750)
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

