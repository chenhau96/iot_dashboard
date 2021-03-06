
var parsedData;
var chartTitle = "";
var updateFlag = false;
var iconCels = "\u2103";  // Celsius icon
var updateInterval = 30000; // 30s
var transitionDuration = 1000; // 1000ms
var red = "#e60000", blue = "#0044cc";  // color hex code

// Time formatting
var ttFormatTime = d3.timeFormat("%d-%m-%Y %X");
var dateFormatTime = d3.timeFormat("%Y-%m-%d");
var nestedFormatTime = d3.timeFormat("%d-%m-%Y");
var barChartFormatTime = d3.timeFormat("%d-%m");

// Chart width and height setting
var svgWidth = 650, svgHeight = 350;
var margin = { top: 20, right: 20, bottom: 50, left: 80 };
var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;
var width_mid = width / 2;
var height_mid = height / 2;

// API URL for device data
var api = 'http://localhost:8000/api/devices/?device_id=' + device_id +
        '&data=' + whichData + '&timestamp=' + chart_config.timeline;

// After everything (HTML elements) is loaded
document.addEventListener("DOMContentLoaded", function(event) {

  // Set Preferences Value
  setPreferenceValue()

  // Set 'show_in_main' checkbox value
  var checkbox = document.getElementById("show_in_main");
  if (chart_config.show_in_main)
    checkbox.checked = true;

  // Make first letter of each data uppercase, to become the chart title
  var firstLetterUpper = whichData.charAt(0).toUpperCase();
  chartTitle = firstLetterUpper + whichData.substr(1);
  d3.select(".chart-title").text(chartTitle);

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
        alert("No data is retrieved.");
      }
      else {
        parsedData = parseData(apiData);
        console.log(parsedData);
        if (!updateFlag) {
          // First display of chart
          updateFlag = true;

          drawWhichChart(chart_config.chart_type, parsedData);
        }
        else {
          // After display the chart, update it every 5s
          updateWhichChart(chart_config.chart_type, parsedData);
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
        data_point: apiData[i].data[whichData],
      }
    );
  }
  return arr;
}


/*
 * Draw Charts Section
 */

// Function to process which chart type to draw
function drawWhichChart(chart_type, data) {
  switch(chart_type) {
    case 'barchart':
      drawBarChart(data);
      break;
    case 'scatterplot':
      drawScatterPlot(data);
      break;
    case 'linechart':
    default:
      drawLineChart(data);
  }
}

// Function to process which chart type to draw
function updateWhichChart(chart_type, data) {
  switch(chart_type) {
    case 'barchart':
      updateBarChart(data);
      break;
    case 'scatterplot':
      updateScatterPlot(data);
      break;
    case 'linechart':
    default:
      updateLineChart(data);
  }
}

// Line Chart
function drawLineChart(data) {
  // Remove existing svg if any
  d3.select("svg").remove();

  // Set svg width and height
  var svg = d3.select("#chart-content")
    .append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + svgWidth + " " + svgHeight)
    //class to make it responsive
    .classed("svg-content-responsive", true);

  // Set the chart position within the svg
  var g = svg.append("g")
    .attr("class", "chart")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // scale the range of x-axis
  var x = d3.scaleTime()
    .domain(d3.extent(data, function(d) { return d.ts }))
    .range([0, width]);

  // scale the range of y-axis
  var y = d3.scaleLinear()
    .domain(d3.extent(data, function(d) { return d.data_point }))
    .range([height, 0]);

  // define x-axis
  var xAxis = d3.axisBottom(x)
    .ticks(5)
    .tickSize(8)   // length of the each tick
    .tickPadding(5);
    //.ticks(d3.timeHour.every(24))
    //.tickFormat(d3.timeFormat("%m-%d"));

  // define y-axis
  var yAxis = d3.axisLeft(y)
    .ticks(5)
    .tickSize(-width)
    .tickPadding(10);

  // d3's line generator
  var line = d3.line()
    .curve(d3.curveLinear)
    .x(function(d) { return x(d.ts)})
    .y(function(d) { return y(d.data_point)});

  // append x-axis and label in a group tag
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

  // append y-axis and label in a group tag
  g.append("g")
    .attr("class", "y-axis grid")
    .call(yAxis)
    .append("text")
    .attr("class", "text-label")
    .attr("fill", "#000")
    .attr("x", 60 - height_mid)
    .attr("y", 30 - margin.left)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "end")
    .text(() => {
      if (chartTitle == "Temperature")
        chartTitle += " " + iconCels;
      return chartTitle;
    });

  // add line path of the line chart
  g.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", chart_config.color)
    .attr("stroke-width", 1.5)
    .attr("d", line(data));

  // Add tooltip
  var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none")
    .style("opacity", 0);

  // add data points to the line
  g.selectAll("circle").data(data).enter()
    .append("circle")
    .attr("class", "dotPoint")
    .attr("r", 4)
    .attr("cx", (d, i) => x(d.ts))
    .attr("cy", (d, i) => y(d.data_point))
    .attr("fill", (d) => {
      // if beyond threshold, change data point's color to red
      return (d.data_point >= chart_config.threshold) ? red : blue;
    })
    // Tooltip mouseover
    .on("mouseover", function(d) {
      div.transition()
        .duration(200)
        .style("display", "inline")
        .style("opacity", .9);
      div.html(ttFormatTime(d.ts) + "<br/>" +
        "<b>" + d.data_point.toFixed(2) + "</b>")
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
    .on("mouseout", function(d) {
      div.transition()
        .duration(500)
        .style("opacity", 0);
    });
}

// Update Line Chart
function updateLineChart(data) {
  // Scale the x and y axis again
  var x = d3.scaleTime()
    .domain(d3.extent(data, function(d) { return d.ts }))
    .range([0, width]);

  var y = d3.scaleLinear()
    .domain(d3.extent(data, function(d) { return d.data_point }))
    .range([height, 0]);

  // Define the x and y axis
  var xAxis = d3.axisBottom(x)
    .ticks(5)
    .tickSize(8) // length of the each tick
    .tickPadding(5);

  var yAxis = d3.axisLeft(y)
    .ticks(5)
    .tickSize(-width)
    .tickPadding(10);

  // Generate the line
  var line = d3.line()
    .curve(d3.curveLinear)
    .x(function(d) { return x(d.ts)})
    .y(function(d) { return y(d.data_point)});

  var svg = d3.select("svg").transition();
  var path = d3.selectAll("path.line");

  /** Update Line **/
  // Update new line path to the chart
  path
    .data(data)
    .enter()
    .append("path")
    .merge(path)
    .attr("class", "line")
    .transition()
    .duration(1000)
    .attrTween("d", function() {
      // Do interpolation on previous data for a smooth transition
      var previous = d3.select(this).attr("d");
      var current = line(data);
      return d3.interpolatePath(previous, current);
    });

  // Delete the old line path from the chart
  path.exit().remove();

  // Update the x-axis
  svg.select(".x-axis")
    .duration(transitionDuration)
    .call(xAxis);

  // Update the y-axis
  svg.select(".y-axis")
    .duration(transitionDuration)
    .call(yAxis);

  /** Update Circle **/
  // Update existing data points
  d3.select(".chart").selectAll("circle").data(data)
    .attr("class", "dotPoint")
    .attr("r", 4)
    .attr("cx", (d, i) => x(d.ts))
    .attr("cy", (d, i) => y(d.data_point))
    .attr("fill", (d) => {
      // if beyond threshold, change data point's color to red
      return (d.data_point >= chart_config.threshold) ? red : blue;
    })
    .transition()
    .duration(transitionDuration);

  // Add tooltip
  var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none")
    .style("opacity", 0);

  // Create new data points, if there is new data
  d3.select(".chart").selectAll("circle").data(data)
    .enter()
    .append("circle")
    .attr("class", "dotPoint")
    .attr("r", 4)
    .attr("cx", (d, i) => x(d.ts))
    .attr("cy", (d, i) => y(d.data_point))
    .attr("fill", (d) => {
      // if beyond threshold, change data point's color to red
      return (d.data_point >= chart_config.threshold) ? red : blue;
    })
    .on("mouseover", function(d) {
      div.transition()
        .duration(200)
        .style("display", "inline")
        .style("opacity", .9);
      div.html(ttFormatTime(d.ts) + "<br/>" +
        "<b>" + d.data_point.toFixed(2) + "</b>")
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
    .on("mouseout", function(d) {
      div.transition()
        .duration(500)
        .style("opacity", 0);
    });

  // Remove old data points
  d3.select(".chart").selectAll("circle")
    .data(data)
    .exit()
    .remove();
}

// Scatterplot
function drawScatterPlot(data) {
  // Remove existing svg if any
  d3.select("svg").remove();

  var svg = d3.select("#chart-content")
    .append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + svgWidth + " " + svgHeight)
    //class to make it responsive
    .classed("svg-content-responsive", true);

  var chart = svg.append("g")
    .attr("class", "chart")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // scale the range of x-axis
  var x = d3.scaleTime()
    .domain(d3.extent(data, function(d) { return d.ts }))
    .range([0, width]);

  // scale the range of y-axis
  var y = d3.scaleLinear()
    .domain(d3.extent(data, function(d) { return d.data_point }))
    .range([height, 0]);

  // define x-axis
  var xAxis = d3.axisBottom(x)
    .ticks(5)
    .tickSize(8)   // length of the each tick
    .tickPadding(5);

  // define y-axis
  var yAxis = d3.axisLeft(y)
    .ticks(5)
    .tickSize(-width)
    .tickPadding(10);

    // append x-axis and label in a group tag
  chart.append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .append("text")
    .attr("class", "text-label")
    .attr("fill", "#000")
    .attr("transform", "translate(" + width_mid + ", " + 40 + ")")
    .attr("text-anchor", "middle")
    .text("Timeline");

  // append y-axis and label in a group tag
  chart.append("g")
    .attr("class", "y-axis grid")
    .call(yAxis)
    .append("text")
    .attr("class", "text-label")
    .attr("fill", "#000")
    .attr("x", 60 - height_mid)
    .attr("y", 30 - margin.left)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "end")
    .text(() => {
      if (chartTitle == "Temperature")
        chartTitle += " " + iconCels;
      return chartTitle;
    });

  // Add tooltip
  var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none")
    .style("opacity", 0);

  // add data points to the line
  chart.selectAll("circle").data(data).enter()
    .append("circle")
    .attr("class", "dotPoint")
    .attr("r", 4)
    .attr("cx", (d, i) => x(d.ts))
    .attr("cy", (d, i) => y(d.data_point))
    .attr("fill", (d) => {
      // if beyond threshold, change data point's color to red
      return (d.data_point >= chart_config.threshold) ? red : chart_config.color;
    })
    // Tooltip mouseover
    .on("mouseover", function(d) {
      div.transition()
        .duration(200)
        .style("display", "inline")
        .style("opacity", .9);
      div.html(ttFormatTime(d.ts) + "<br/>" +
        "<b>" + d.data_point.toFixed(2) + "</b>")
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
    .on("mouseout", function(d) {
      div.transition()
        .duration(500)
        .style("opacity", 0);
    });
}

// Update Scatterplot
function updateScatterPlot(data) {
  // Scale the x and y axis again
  var x = d3.scaleTime()
    .domain(d3.extent(data, function(d) { return d.ts }))
    .range([0, width]);

  var y = d3.scaleLinear()
    .domain(d3.extent(data, function(d) { return d.data_point }))
    .range([height, 0]);

  // Define the x and y axis
  var xAxis = d3.axisBottom(x)
    .ticks(5)
    .tickSize(8) // length of the each tick
    .tickPadding(5);

  var yAxis = d3.axisLeft(y)
    .ticks(5)
    .tickSize(-width)
    .tickPadding(10);

  var svg = d3.select("svg").transition();

    // Update the x-axis
  svg.select(".x-axis")
    .duration(transitionDuration)
    .call(xAxis);

  // Update the y-axis
  svg.select(".y-axis")
    .duration(transitionDuration)
    .call(yAxis);

  /** Update Circle **/
  // Update existing data points
  d3.select(".chart").selectAll("circle").data(data)
    .attr("class", "dotPoint")
    .attr("r", 4)
    .attr("cx", (d, i) => x(d.ts))
    .attr("cy", (d, i) => y(d.data_point))
    .attr("fill", (d) => {
      // if beyond threshold, change data point's color to red
      return (d.data_point >= chart_config.threshold) ? red : chart_config.color;
    })
    .transition()
    .duration(transitionDuration);

  // Add tooltip
  var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none")
    .style("opacity", 0);

  // Create new data points, if there is new data
  d3.select(".chart").selectAll("circle").data(data)
    .enter()
    .append("circle")
    .attr("class", "dotPoint")
    .attr("r", 4)
    .attr("cx", (d, i) => x(d.ts))
    .attr("cy", (d, i) => y(d.data_point))
    .attr("fill", (d) => {
      // if beyond threshold, change data point's color to red
      return (d.data_point >= chart_config.threshold) ? red : chart_config.color;
    })
    .on("mouseover", function(d) {
      div.transition()
        .duration(200)
        .style("display", "inline")
        .style("opacity", .9);
      div.html(ttFormatTime(d.ts) + "<br/>" +
        "<b>" + d.data_point.toFixed(2) + "</b>")
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
    .on("mouseout", function(d) {
      div.transition()
        .duration(500)
        .style("opacity", 0);
    });

  // Remove old data points
  d3.select(".chart").selectAll("circle")
    .data(data)
    .exit()
    .remove();
}

// Bar Chart
function drawBarChart(data) {
  // Remove existing svg if any
  d3.select("svg").remove();

  // Aggregate data with same date and calc the mean
  var dataArray = getMeanDataOnDailyBasis(data);
  parsedData = dataArray;

  var svg = d3.select("#chart-content")
    .append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + svgWidth + " " + svgHeight)
    //class to make it responsive
    .classed("svg-content-responsive", true);

  var chart = svg.append("g")
    .attr("class", "chart")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // scale the range of x-axis
  var x = d3.scaleBand()
    .domain(dataArray.map(function(d) { return d.ts; }))
    .range([0, width])
    .padding(0.3);

  // scale the range of y-axis
  var y = d3.scaleLinear()
    .domain(d3.extent(dataArray, function(d) { return d.data_point }))
    .range([height, 0]);

  // define x-axis
  var xAxis = d3.axisBottom(x)
    .tickSize(8)   // length of the each tick
    .tickFormat(barChartFormatTime)
    .tickPadding(5);

  // Define x-axis ticks values if the timeline selected is
  // either 'thisMonth' or 'thisYear' since the ticks auto generated
  // will be too many and causes overlapping.
  var barChartTicks = [];
  var curSelectedTimeline = document.getElementById("timeline").value;
  if (curSelectedTimeline == "thisMonth" || curSelectedTimeline == "thisYear") {
    for(var i in dataArray) {
      if (i % 3 == 0)
        barChartTicks.push(dataArray[i].ts);
    }
    xAxis.tickValues(barChartTicks);
  }

  // define y-axis
  var yAxis = d3.axisLeft(y)
    .ticks(5)
    .tickSize(-width)
    .tickPadding(10);

  // append x-axis and label in a group tag
  chart.append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .append("text")
    .attr("class", "text-label")
    .attr("fill", "#000")
    .attr("transform", "translate(" + width_mid + ", " + 40 + ")")
    .attr("text-anchor", "middle")
    .text("Timeline");

  // append y-axis and label in a group tag
  chart.append("g")
    .attr("class", "y-axis grid")
    .call(yAxis)
    .append("text")
    .attr("class", "text-label")
    .attr("fill", "#000")
    .attr("x", 60 - height_mid)
    .attr("y", 30 - margin.left)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "end")
    .text(() => {
      if (chartTitle == "Temperature")
        chartTitle += " " + iconCels;
      return chartTitle;
    });

  // Add tooltip
  var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none")
    .style("opacity", 0);

  // add data points to the line
  chart.selectAll("rect").data(dataArray).enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d, i) => x(d.ts))
    .attr("y", (d, i) => y(d.data_point))
    .attr("width", x.bandwidth())
    .attr("height", function(d) { return height - y(d.data_point); })
    .attr("fill", (d) => {
      // if beyond threshold, change data point's color to red
      return (d.data_point >= chart_config.threshold) ? red : chart_config.color;
    })
    // Tooltip mouseover
    .on("mouseover", function(d) {
      div.transition()
        .duration(200)
        .style("display", "inline")
        .style("opacity", .9);
      div.html(nestedFormatTime(d.ts) + "<br/>" +
        "<b>Avg: " + d.data_point.toFixed(2) + "</b>")
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
    .on("mouseout", function(d) {
      div.transition()
        .duration(500)
        .style("opacity", 0);
    });
}

// Update Bar Chart
function updateBarChart(data) {
  var dataArray = getMeanDataOnDailyBasis(data);
  parsedData = dataArray;

  // scale the range of x-axis
  var x = d3.scaleBand()
    .domain(dataArray.map(function(d) { return d.ts; }))
    .range([0, width])
    .padding(0.3);

  // scale the range of y-axis
  var y = d3.scaleLinear()
    .domain(d3.extent(dataArray, function(d) { return d.data_point }))
    .range([height, 0]);

  // define x-axis
  var xAxis = d3.axisBottom(x)
    .tickSize(8)   // length of the each tick
    .tickFormat(barChartFormatTime)
    .tickPadding(5);

  // Define x-axis ticks values if the timeline selected is
  // either 'thisMonth' or 'thisYear' since the ticks auto generated
  // will be too many and causes overlapping.
  var barChartTicks = [];
  var curSelectedTimeline = document.getElementById("timeline").value;
  if (curSelectedTimeline == "thisMonth" || curSelectedTimeline == "thisYear") {
    for(var i in dataArray) {
      if (i % 3 == 0)
        barChartTicks.push(dataArray[i].ts);
    }
    xAxis.tickValues(barChartTicks);
  }

  // define y-axis
  var yAxis = d3.axisLeft(y)
    .ticks(5)
    .tickSize(-width)
    .tickPadding(10);

  var svg = d3.select("svg").transition();

  // Update the x-axis
  svg.select(".x-axis")
    .duration(transitionDuration)
    .call(xAxis);

  // Update the y-axis
  svg.select(".y-axis")
    .duration(transitionDuration)
    .call(yAxis);

  // Add tooltip
  var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none")
    .style("opacity", 0);

  // Remove old data points
  var bars = d3.select(".chart").selectAll("rect")
    .remove()
    .exit()
    .data(dataArray);

  // Add new data points to the chart
  bars.enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d, i) => x(d.ts))
    .attr("y", (d, i) => y(d.data_point))
    .attr("width", x.bandwidth())
    .attr("height", function(d) { return height - y(d.data_point); })
    .attr("fill", (d) => {
      // if beyond threshold, change data point's color to red
      return (d.data_point >= chart_config.threshold) ? red : chart_config.color;
    })
    // Tooltip mouseover
    .on("mouseover", function(d) {
      div.transition()
        .duration(200)
        .style("display", "inline")
        .style("opacity", .9);
      div.html(nestedFormatTime(d.ts) + "<br/>" +
        "<b>Avg: " + d.data_point.toFixed(2) + "</b>")
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
    .on("mouseout", function(d) {
      div.transition()
        .duration(500)
        .style("opacity", 0);
    });
}

// Aggregate data and find mean
function getMeanDataOnDailyBasis(data) {
  // Aggregate data with same date and calc the mean
  var nestedData = d3.nest()
    .key(function(d) { return dateFormatTime(d.ts); })
    .rollup(function(d) {
      return d3.mean(d, function(g) {return g.data_point; });
    }).entries(data);

  // Convert nested data into array
  var dataArray = [];
  for (var i = 0; i < nestedData.length; i++) {
    var dateString = nestedData[i].key + "T00:00:00Z";
    console.log(dateString);
    dataArray.push(
      {
        ts: new Date(dateString),
        data_point: nestedData[i].value,
      }
    );
  }

  return dataArray;
}


/*
 * Preferences Section
 */
// Set Saved Preferences Value
function setPreferenceValue() {
  setValue("threshold", chart_config.threshold);
  setValue("color", chart_config.color);
  setValue("chart_type", chart_config.chart_type);
  setValue("timeline", chart_config.timeline);
}

// Set Form Value
function setValue(id, value) {
    var element = document.getElementById(id);
    element.value = value;
}

// Change Threshold Function
function changeThreshold(e) {
  // Get value from threshold textbox
  chart_config.threshold = e.target.value;
  console.log("New threshold value: " + e.target.value);

  var selectedChart = document.getElementById("chart_type").value;

  switch(selectedChart) {
    case 'linechart':
    case 'scatterplot':
      d3.selectAll("circle").data(parsedData)
        .attr("fill", (d) => {
          return (d.data_point >= chart_config.threshold) ? red : chart_config.color;
        })
        .transition()
        .duration(transitionDuration);
      break;
    case 'barchart':
      d3.selectAll("rect").data(parsedData)
        .attr("fill", (d) => {
          // if beyond threshold, change data point's color to red
          return (d.data_point >= chart_config.threshold) ? red : chart_config.color;
        })
        .transition()
        .duration(transitionDuration);
      break;
  }

}

// Change Color Function
function changeColor(e) {
  // Get value from color dropdown list
  chart_config.color = e.target.value;
  console.log("New color value: " + e.target.value);

  var selectedChart = document.getElementById("chart_type").value;

  switch(selectedChart) {
    case 'linechart':
      // Change the color of the line
      d3.select(".line").attr("stroke", chart_config.color);
      break;
    case 'scatterplot':
      d3.selectAll("circle").data(parsedData)
        .attr("fill", (d) => {
          return (d.data_point >= chart_config.threshold) ? red : chart_config.color;
        })
        .transition()
        .duration(transitionDuration);
      break;
    case 'barchart':
      d3.selectAll("rect").data(parsedData)
        .attr("fill", (d) => {
          // if beyond threshold, change data point's color to red
          return (d.data_point >= chart_config.threshold) ? red : chart_config.color;
        })
        .transition()
        .duration(transitionDuration);
      break;
  }

}

// Change Chart Type Function
function changeChartType(e) {
  // Get value from chart type dropdown list
  chart_config.chart_type = e.target.value;
  console.log("New chart type value: " + e.target.value);

  drawWhichChart(chart_config.chart_type, parsedData);
}

// Change Timeline Function
function changeTimeline(e) {
  // Get value from timeline dropdown list
  chart_config.timeline = e.target.value;
  console.log("New timeline value: " + e.target.value);

  api = 'http://localhost:8000/api/devices/?device_id=' + device_id +
          '&data=' + whichData + '&timestamp=' + chart_config.timeline;

  // Fetch data from new API
  fetchDataFromAPI(api);
}


/** Get csrf token in order to post data using Ajax **/
// using jQuery
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
var csrftoken = getCookie('csrftoken');

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

// 'show_in_main' Checkbox
function isChecked(checkbox) {
  var value = false
  if (checkbox.checked) {
    value = true;
    console.log("Checkbox is checked");
  }
  else {
    value = false;
    console.log("Checkbox is unchecked");
  }

  var update_link = 'http://localhost:8000/dashboard/device/' + device_id
      + '/' + whichData + '/update_show';

  $.ajax({
    type:'post',
    url: update_link,
    data: {'show_in_main': value},
    success: function(msg) {
      // Show the modal
      $('#cb-result').modal('show');

      if (value)
        $('.modal-body').text("Added to main dashboard.");
      else
        $('.modal-body').text("Removed from main dashboard.");
    }
  });
}



