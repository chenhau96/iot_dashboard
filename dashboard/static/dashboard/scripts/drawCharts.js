  //var api = 'https://api.coindesk.com/v1/bpi/historical/close.json?start=2017-12-31&end=2018-04-01';
  var color = "blue";
  var parsedData;

  var api = 'http://localhost:8000/api/devices';
  document.addEventListener("DOMContentLoaded", function(event) {
   fetch(api)
     .then(function(response) { return response.json(); })
     .then(function(data) {
         parsedData = parseData(data)
         console.log(parsedData);
         drawChart(parsedData);
         //drawScatterPlot(parsedData);
     })
  });

  function parseData(data) {
    var arr = [];
    for (var i in data) {
        arr.push(
           {
               //ts: data[i].timestamp,
               ts: i,
               temp: data[i].data["temperature"],
           }
        );
    }
    return arr;
  }

  function drawScatterPlot(data) {
     var svgWidth = 600, svgHeight = 380;
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
        });

  }

  function drawChart(data) {
    //Defining time format
     var utcParser = d3.utcParse("%Y-%m-%dT%H:%M:%S.%LZ");

     var svgWidth = 600, svgHeight = 380;
     var margin = { top: 20, right: 20, bottom: 30, left: 50 };
     var width = svgWidth - margin.left - margin.right;
     var height = svgHeight - margin.top - margin.bottom;

     var svg = d3.select('svg')
        .attr("width", svgWidth)
        .attr("height", svgHeight);

     var g = svg.append("g")
        .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")"
        );

     var x = d3.scaleTime().rangeRound([0, width]);
     var y = d3.scaleLinear().rangeRound([height, 0]);

     var line = d3.line()
         .x(function(d) { return x(d.ts)})
         .y(function(d) { return y(d.temp)})
         x.domain(d3.extent(data, function(d) { return d.ts }));
         y.domain(d3.extent(data, function(d) { return d.temp }));

     g.append("g")
         .attr("transform", "translate(0," + height + ")")
         .call(d3.axisBottom(x))
         .select(".domain")
         .remove();

     g.append("g")
         .call(d3.axisLeft(y))
         .append("text")
         .attr("fill", "#000")
         .attr("transform", "rotate(-90)")
         .attr("y", 6)
         .attr("dy", "0.71em")
         .attr("text-anchor", "end")
         .text("Temperature C");

     g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", line);
  }

  function changeColor(e) {
    console.log(color);
    color = e.target.value;
    drawChart(parsedData);
  }