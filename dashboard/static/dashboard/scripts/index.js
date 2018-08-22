
var parsedData;
var dev_config;

var row;
var chartCount = 0;
var count = 0;

var updateFlag = false;
var chartTitle = "";
var ttFormatTime = d3.timeFormat("%d-%m-%Y %X");
var transitionDuration = 1000; // 1000ms
var red = "#e60000", blue = "#000066";  // color hex code

// Chart width and height setting
var svgWidth = 300, svgHeight = 200;
var margin = { top: 10, right: 10, bottom: 50, left: 40 };
var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;
var width_mid = width / 2;
var height_mid = height / 2;

// API URL for device configuration
var deviceConfigAPI = 'http://localhost:8000/api/device-config/';

document.addEventListener("DOMContentLoaded", function(event) {
  // First rendering of chart and get device configuration
  // Device config and other info are saved into session
  fetchDeviceConfig(deviceConfigAPI);

  // Update charts using information saved in session
  // in an interval of 30s
  setInterval(function() {
    updateFlag = true;
    for (var i = 1; i <= count; i++) {
      var sessionObj = JSON.parse(sessionStorage.getItem("chart_" + i));

      fetchDataFromAPI(sessionObj);
    }
    console.log("Finished updating.");
  }, 30000);
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

              // Get the device_id, device_name, data
              var device_id = dev_config[obj].device_id;
              var device_name = dev_config[obj].device_name;
              console.log(device_name);
              var data = dev_config[obj].chart_config[whichData];
              data = Object.keys(data);
              console.log("Current whichData: " + data);

              // Get the chart config of the current device
              var chart_config = {
                threshold: dev_config[obj].chart_config[whichData][data].threshold,
                color: dev_config[obj].chart_config[whichData][data].color,
                chart_type: dev_config[obj].chart_config[whichData][data].chart_type,
                timestamp: dev_config[obj].chart_config[whichData][data].timeline,
              };


              // Construct the API URL to get device data
              var data_api = 'http://localhost:8000/api/devices/?device_id=' +
                device_id + '&data=' + data + '&timestamp=' + chart_config.timestamp;

              // Wrap all the necessary information
              var wrapperObj = {
                "device_id": device_id,
                "device_name": device_name,
                "whichData": data,
                "chart_config": chart_config,
                "data_api": data_api,
              }
              console.log(wrapperObj);

              // Store wrapperObj information into session storage
              // for update chart purpose
              count++;
              sessionStorage.setItem("chart_" + count, JSON.stringify(wrapperObj));


              //fetchDataFromAPI(data_api, device_id, data, chart_config)
              fetchDataFromAPI(wrapperObj);
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
    configForShowMain.device_name = apiData[i].device_name;

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

function fetchDataFromAPI(wrapperObj) {
  fetch(wrapperObj.data_api)
    .then(function(response) { return response.json(); })
    .then(function(apiData) {
      if (apiData.length == 0) {
        console.log("Device " + wrapperObj.device_id + "'s " + wrapperObj.whichData + " has no data");
      }
      else {
        parsedData = parseData(apiData, wrapperObj.whichData);

        if (updateFlag) {
          // Update chart
          updateWhichChart(wrapperObj, parsedData);
        }
        else {
          // Draw chart
          generateCard(wrapperObj.device_id, wrapperObj.device_name,
            wrapperObj.whichData);
          drawWhichChart(wrapperObj, parsedData);
        }
      }
    })
}

// Function to generate card to hold each chart
function generateCard(device_id, device_name, whichData) {
  whichData = whichData + "";

  // Make first letter of each data uppercase, to become the chart title
  var firstLetterUpper = whichData.charAt(0).toUpperCase();
  chartTitle = firstLetterUpper + whichData.substr(1);
  chartTitle = device_name + " - " + chartTitle;

  // Generate the url for each chart, to link to chart detail page
  var chart_detail_url = "http://localhost:8000/dashboard/device/" +
    device_id + "/" + whichData;

  // Generate a card skeleton to hold chart title and the chart
  // Each row only holds 3 charts
  if (chartCount % 3 == 0) {
    row = d3.select("#device-charts")
    .append("div")
    .attr("class", "row");
  }

  var div = row.append("div")
      .attr("class", "col-md-4 mb-3")
        .append("div")
        .attr("class", "card");

  // Card header to hold the chart title
  var card_header = div.append("h6")
    .attr("class", "card-header")

  card_header.append("a")
    .attr("href", chart_detail_url)
    .text(chartTitle);

  // Card body to hold the chart
  div.append("div")
    .attr("class", "card-body svg-container")
    .attr("id", whichData + "_" + device_id);

  // Increment chart count
  chartCount++;
}

// Function to process which chart type to draw
function drawWhichChart(wrapperObj, data) {
  switch(wrapperObj.chart_config.chart_type) {
    case 'scatterplot':
      drawScatterPlot(wrapperObj, data);
      break;
    case 'linechart':
    default:
      drawLineChart(wrapperObj, data);
  }
}

// Function to process which chart type to draw
function updateWhichChart(wrapperObj, data) {
  switch(wrapperObj.chart_config.chart_type) {
    case 'scatterplot':
      updateScatterPlot(wrapperObj, data);
      break;
    case 'linechart':
    default:
      updateLineChart(wrapperObj, data);
  }
}

// Line Chart
function drawLineChart(wrapperObj, data) {
  // Remove existing svg if any
  //d3.select("svg").remove();

  // Set svg width and height
  var svg = d3.select("#" + wrapperObj.whichData + "_" + wrapperObj.device_id)
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
    .call(xAxis);

  // append y-axis and label in a group tag
  g.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

  // add line path of the line chart
  g.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", wrapperObj.chart_config.color)
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
      return (d.data_point >= wrapperObj.chart_config.threshold) ? red : blue;
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
function updateLineChart(wrapperObj, data) {
  console.log("Updating linechart on " + wrapperObj.device_name
    + "-" + wrapperObj.whichData);

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

  var svg =
    d3.select("#" + wrapperObj.whichData + "_" + wrapperObj.device_id)
      .select("svg");
  var path = svg.select(".chart").selectAll("path.line");

  /** Update Line **/
  // Update new line path to the chart
  path
    .data(data)
    .enter()
    .append("path")
    .merge(path)
    .attr("class", "line")
    .style("fill", "none")
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
    .transition()
    .duration(transitionDuration)
    .call(xAxis);

  // Update the y-axis
  svg.select(".y-axis")
    .transition()
    .duration(transitionDuration)
    .call(yAxis);

  /** Update Circle **/
  // Update existing data points
  svg.selectAll("circle").data(data)
    .attr("class", "dotPoint")
    .attr("r", 4)
    .attr("cx", (d, i) => x(d.ts))
    .attr("cy", (d, i) => y(d.data_point))
    .attr("fill", (d) => {
      // if beyond threshold, change data point's color to red
      return (d.data_point >= wrapperObj.chart_config.threshold) ? red : blue;
    })
    .transition()
    .duration(transitionDuration);

  // Add tooltip
  var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none")
    .style("opacity", 0);

  // Create new data points, if there is new data
  svg.selectAll("circle").data(data)
    .enter()
    .append("circle")
    .attr("class", "dotPoint")
    .attr("r", 4)
    .attr("cx", (d, i) => x(d.ts))
    .attr("cy", (d, i) => y(d.data_point))
    .attr("fill", (d) => {
      // if beyond threshold, change data point's color to red
      return (d.data_point >= wrapperObj.chart_config.threshold) ? red : blue;
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
  svg.selectAll("circle")
    .data(data)
    .exit()
    .remove();
}

// Scatterplot
function drawScatterPlot(wrapperObj, data) {
  // Remove existing svg if any
  //d3.select("svg").remove();

  var svg = d3.select("#" + wrapperObj.whichData + "_" + wrapperObj.device_id)
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
    .tickSize(8)
    .tickPadding(5);

    // append x-axis and label in a group tag
  chart.append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  // append y-axis and label in a group tag
  chart.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

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
      return (d.data_point >= wrapperObj.chart_config.threshold) ? red : blue;
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
function updateScatterPlot(wrapperObj, data) {
  console.log("Updating scatterplot on " + wrapperObj.device_name
    + "-" + wrapperObj.whichData);

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

  var svg =
    d3.select("#" + wrapperObj.whichData + "_" + wrapperObj.device_id)
      .select("svg");

    // Update the x-axis
  svg.select(".x-axis")
    .transition()
    .duration(transitionDuration)
    .call(xAxis);

  // Update the y-axis
  svg.select(".y-axis")
    .transition()
    .duration(transitionDuration)
    .call(yAxis);

  /** Update Circle **/
  // Update existing data points
  svg.select(".chart").selectAll("circle").data(data)
    .attr("class", "dotPoint")
    .attr("r", 4)
    .attr("cx", (d, i) => x(d.ts))
    .attr("cy", (d, i) => y(d.data_point))
    .attr("fill", (d) => {
      // if beyond threshold, change data point's color to red
      return (d.data_point >= wrapperObj.chart_config.threshold) ? red : blue;
    })
    .transition()
    .duration(transitionDuration);

  // Add tooltip
  var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none")
    .style("opacity", 0);

  // Create new data points, if there is new data
  svg.select(".chart").selectAll("circle").data(data)
    .enter()
    .append("circle")
    .attr("class", "dotPoint")
    .attr("r", 4)
    .attr("cx", (d, i) => x(d.ts))
    .attr("cy", (d, i) => y(d.data_point))
    .attr("fill", (d) => {
      // if beyond threshold, change data point's color to red
      return (d.data_point >= wrapperObj.chart_config.threshold) ? red : blue;
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
  svg.select(".chart").selectAll("circle")
    .data(data)
    .exit()
    .remove();
}
