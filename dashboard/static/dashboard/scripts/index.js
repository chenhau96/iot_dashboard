
var parsedData;
var dev_config;

var updateFlag = false;
var chartTitle = "";
var ttFormatTime = d3.timeFormat("%d-%m-%Y %X");
var iconCels = "\u2103";  // Celsius icon
var transitionDuration = 1000; // 1000ms
var red = "#e60000", blue = "#000066";  // color hex code

// Chart width and height setting
var svgWidth = 350, svgHeight = 200;
var margin = { top: 20, right: 20, bottom: 50, left: 80 };
var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;
var width_mid = width / 2;
var height_mid = height / 2;

// API URL for device configuration
var deviceConfigAPI = 'http://localhost:8000/api/device-config/';

document.addEventListener("DOMContentLoaded", function(event) {

  fetchDeviceConfig(deviceConfigAPI);

});

function fetchDeviceConfig(api) {
  fetch(api)
    .then(function(response) { return response.json(); })
    .then(function(apiData) {
      if (apiData) {
        // Get device config with 'show_in_main' = true
        dev_config = getDeviceConfig(apiData);
        console.log(dev_config);

        if (dev_config) {
          for (var obj in dev_config) {
            for (var whichData in dev_config[obj].chart_config) {
              // Get the device_id, data, timestamp
              var device_id = dev_config[obj].device_id;
              var data = dev_config[obj].chart_config[whichData];
              data = Object.keys(data);
              var timestamp = dev_config[obj].chart_config[whichData][data].timeline;
              var chart_type = dev_config[obj].chart_config[whichData][data].chart_type;

              var chart_config = {
                threshold: dev_config[obj].chart_config[whichData][data].threshold,
                color: dev_config[obj].chart_config[whichData][data].color,
                chart_type: dev_config[obj].chart_config[whichData][data].chart_type,
              };


              // Construct the API URL to get device data
              var data_api = 'http://localhost:8000/api/devices/?device_id=' +
                device_id + '&data=' + data + '&timestamp=' + timestamp;

              fetchDataFromAPI(data_api, data, chart_config)
            }
          }
        }
      }
    })
}

function getDeviceConfig(apiData) {
  // Array to store all device config with 'show_in_main' = true
  var device_config = [];

  // object to store each device config
  var configForShowMain = {};

  // temporary object to store config for each show_in_main = true
  var configObj = {};

  // array to store configObj
  var arr = [];

  for (var i in apiData) {
    // Get each object device ID
    configForShowMain.device_id = apiData[i].device_id;

    // Get each object chart_config
    for (var whichConfig in apiData[i].chart_config) {
      var config = apiData[i].chart_config[whichConfig];
      var data_key = Object.keys(config);

      if (config[data_key].show_in_main) {
        // If 'show_in_main' = true,
        // push the object to configObj
        configObj[data_key] = config[data_key];
        arr.push(configObj);

        // Reset configObj to empty object
        configObj = {};
      }
    }

    // Set chart_config attribute to the array of configObj
    configForShowMain['chart_config'] = arr;

    // Push each device object with filtered chart config to dev_config
    device_config.push(configForShowMain);

    return device_config;
  }

}

function fetchDataFromAPI(api, whichData, chart_config) {
  fetch(api)
    .then(function(response) { return response.json(); })
    .then(function(apiData) {
      if (apiData.length == 0) {
        alert("No data is retrieved.");
      }
      else {
        parsedData = parseData(apiData, whichData);

        drawWhichChart(chart_config, parsedData);
      }
    })
}

function parseData(apiData, whichData) {
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

function generateCard() {
  // Make first letter of each data uppercase, to become the chart title
  var firstLetterUpper = whichData.charAt(0).toUpperCase();
  var chartTitle = firstLetterUpper + whichData.substr(1);

  // Generate the url for each chart, to link to chart detail page
  var url = chart_detail_url.replace("data", whichData);

  // Generate a card skeleton to hold chart title and the chart
  var div = d3.select(".device-charts")
    .append("div")
    .attr("class", "row")
      .append("div")
      .attr("class", "col-lg-8")
        .append("div")
        .attr("class", "card mb-3");

  // Card header to hold the chart title
  var card_header = div.append("h6")
    .attr("class", "card-header")

  card_header.append("a")
    .attr("href", url)
    .text(chartTitle);

  // Card body to hold the chart
  div.append("div")
    .attr("class", "card-body")
    .attr("id", whichData);
}

// Function to process which chart type to draw
function drawWhichChart(chart_config, data) {
  switch(chart_config.chart_type) {
    case 'scatterplot':
      drawScatterPlot(data, chart_config);
      break;
    case 'linechart':
    default:
      drawLineChart(data, chart_config);
  }
}

// Function to process which chart type to draw
function updateWhichChart(chart_type, data) {
  switch(chart_type) {
    case 'scatterplot':
      updateScatterPlot(data);
      break;
    case 'linechart':
    default:
      updateLineChart(data);
  }
}

// Line Chart
function drawLineChart(data, chart_config) {
  console.log(chart_config);
  // Remove existing svg if any
  //d3.select("svg").remove();

  // Set svg width and height
  var svg = d3.select("#chart-content")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

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
    .tickSize(8)
    .tickPadding(5);

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
    .attr("class", "y-axis")
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
    .tickSize(8)
    .tickPadding(5);

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
function drawScatterPlot(data, chart_config) {
  // Remove existing svg if any
  //d3.select("svg").remove();

  var svg = d3.select("#chart-content")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

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
    .tickSize(8)
    .tickPadding(5);

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
    .attr("class", "y-axis")
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
    .tickSize(8)
    .tickPadding(5);

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
