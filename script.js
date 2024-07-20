// Function to set up the chart
function setupChart() {
    // Remove any existing SVG to reset the chart
    d3.select("#chart svg").remove();

    // Set the dimensions and margins of the graph
    const margin = {top: 20, right: 50, bottom: 50, left: 60};
    const containerWidth = document.querySelector('.chart').clientWidth;
    const width = containerWidth - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Variables for adjusting label position
    const labelSpacing = 10;  // Horizontal spacing between the marker and the label
    const labelHeightOffset = -10;  // Vertical offset for the label
    const labelPadding = 3;  // Padding for the label background

    // Append the SVG object to the body of the page
    const svg = d3.select("#chart")
                  .append("svg")
                  .attr("width", containerWidth)
                  .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                  .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse the date / time
    const parseDate = d3.timeParse("%Y/%m/%d");

    // Format currency
    const formatCurrency = d => `NT$ ${d.toLocaleString()}`;

    // Load the data
    d3.csv("Orphasol_1000days.csv", d => {
        d.Date = parseDate(d.Date);
        d.accumulate = +d.accumulate;
        return d;
    }).then(data => {
        // Sort the data by Date
        data.sort((a, b) => a.Date - b.Date);

        // Set up scales
        const x = d3.scaleTime()
                    .range([0, width])
                    .domain([data[0].Date, data[0].Date]);  // Start with the first date only

        const y = d3.scaleLinear()
                    .range([height, 0])
                    .domain([d3.min(data, d => d.accumulate), d3.max(data, d => d.accumulate)]);

        // Add X axis
        const xAxisGroup = svg.append("g")
                         .attr("transform", `translate(0,${height})`)
                         .attr("class", "x axis")
                         .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y-%m-%d")).tickSizeOuter(0));

        // Add Y axis
        const yAxisGroup = svg.append("g")
                         .attr("class", "y axis")
                         .call(d3.axisLeft(y));

        // Add the line path
        const line = svg.append("path")
                        .datum([])
                        .attr("class", "line")
                        .attr("d", d3.line()
                            .x(d => x(d.Date))
                            .y(d => y(d.accumulate))
                        );

        // Add the shadow for the marker
        const shadow = svg.append("circle")
                          .attr("class", "shadow")
                          .attr("cx", 0)
                          .attr("cy", 0)
                          .attr("r", 7);

        // Add the marker for the current data point
        const dot = svg.append("circle")
                       .attr("class", "dot")
                       .attr("cx", 0)
                       .attr("cy", 0)
                       .attr("r", 5);

        // Add the label background rectangle
        const labelBg = svg.append("rect")
                           .attr("class", "label-bg")
                           .attr("x", 0)
                           .attr("y", 0)
                           .attr("width", 0)
                           .attr("height", 0);

        // Add the label for the current data point
        const label = svg.append("text")
                         .attr("class", "label")
                         .attr("x", 0)
                         .attr("y", 0)
                         .text("");

        // Animation function
        function animateLine(data) {
            const n = data.length;
            let i = 0;

            function draw() {
                if (i < n) {
                    const currentData = data.slice(0, i + 1);

                    // Update the x-axis domain to the current date range
                    x.domain([data[0].Date, data[i].Date]);

                    // Update the y-axis domain to fit the data
                    y.domain([d3.min(currentData, d => d.accumulate), d3.max(currentData, d => d.accumulate)]);

                    // Update the line
                    line.datum(currentData)
                        .attr("d", d3.line()
                            .x(d => x(d.Date))
                            .y(d => y(d.accumulate))
                        );

                    // Update the x-axis
                    svg.select(".x.axis")
                       .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y-%m-%d")).tickSizeOuter(0))
                       .selectAll("text")
                       .attr("transform", "rotate(-45)")
                       .style("text-anchor", "end");

                    // Update the y-axis
                    svg.select(".y.axis")
                       .call(d3.axisLeft(y));

                    // Update the label
                    const lastDataPoint = currentData[currentData.length - 1];
                    const labelText = formatCurrency(lastDataPoint.accumulate);
                    label.text(labelText);

                    const labelWidth = label.node().getComputedTextLength();
                    const labelX = x(lastDataPoint.Date) + labelSpacing;
                    const labelY = y(lastDataPoint.accumulate) + labelHeightOffset;

                    label.attr("x", labelX)
                         .attr("y", labelY);

                    // Update the label background rectangle
                    labelBg.attr("x", labelX - labelPadding)
                           .attr("y", labelY - 12 - labelPadding)
                           .attr("width", labelWidth + 2 * labelPadding)
                           .attr("height", 16 + 2 * labelPadding);  // 16 is the height of the label

                    // Ensure label stays within chart boundaries
                    if (labelX + labelWidth > width - margin.right) {
                        label.attr("x", x(lastDataPoint.Date) - labelWidth - labelSpacing);
                        labelBg.attr("x", x(lastDataPoint.Date) - labelWidth - labelSpacing - labelPadding);
                    }

                    // Update the shadow
                    shadow.attr("cx", x(lastDataPoint.Date))
                          .attr("cy", y(lastDataPoint.accumulate));

                    // Update the marker
                    dot.attr("cx", x(lastDataPoint.Date))
                       .attr("cy", y(lastDataPoint.accumulate));

                    i++;
                    setTimeout(draw, 25); // Adjust the speed of the animation by changing the timeout duration
                }
            }

            draw();
        }

        // Start the animation
        animateLine(data);
    });
}

// Set up the chart initially
setupChart();

// Redraw the chart when the window is resized
window.addEventListener('resize', setupChart);
