import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

const StreamGraph = ({ data }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Set up dimensions when the component mounts
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries.length) return;
      
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);
  
  // Process data for the stream graph
  const processedData = React.useMemo(() => {
    if (!data || !data.length) return [];
    
    // Group data by month and category
    const timeSeriesData = {};
    
    data.forEach(item => {
      if (!item.OrderDate || !item.CategoryName) return;
      
      const date = new Date(item.OrderDate);
      const month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const category = item.CategoryName;
      
      if (!timeSeriesData[month]) {
        timeSeriesData[month] = {};
      }
      
      if (!timeSeriesData[month][category]) {
        timeSeriesData[month][category] = 0;
      }
      
      timeSeriesData[month][category] += (item.OrderItemQuantity || 0) * (item.PerUnitPrice || 0);
    });
    
    // Get all months and categories
    const months = Object.keys(timeSeriesData).sort();
    const categories = new Set();
    
    Object.values(timeSeriesData).forEach(monthData => {
      Object.keys(monthData).forEach(category => {
        categories.add(category);
      });
    });
    
    // Fill in missing values with zeros
    const categoriesArray = Array.from(categories);
    
    months.forEach(month => {
      categoriesArray.forEach(category => {
        if (!timeSeriesData[month][category]) {
          timeSeriesData[month][category] = 0;
        }
      });
    });
    
    // Convert to format expected by d3.stack
    const stackData = months.map(month => {
      const monthObj = { month };
      categoriesArray.forEach(category => {
        monthObj[category] = timeSeriesData[month][category];
      });
      return monthObj;
    });
    
    return {
      stackData,
      categories: categoriesArray,
      months
    };
  }, [data]);
  
  // Draw the stream graph
  useEffect(() => {
    if (!svgRef.current || !dimensions.width || !dimensions.height || !processedData.stackData || processedData.stackData.length === 0) return;
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();
    
    const { width, height } = dimensions;
    const margin = { top: 20, right: 80, bottom: 30, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Create tooltip div
    const tooltip = d3.select(containerRef.current)
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "white")
      .style("border", "1px solid #ddd")
      .style("border-radius", "4px")
      .style("padding", "8px")
      .style("box-shadow", "0 4px 8px rgba(0,0,0,0.1)")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "10");
    
    // Parse dates for x scale
    const parseDate = d3.timeParse("%Y-%m");
    const dates = processedData.months.map(d => parseDate(d));
    
    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(dates))
      .range([0, innerWidth]);
    
    // Create stack generator
    const stack = d3.stack()
      .offset(d3.stackOffsetWiggle) // Stream graph style offset
      .order(d3.stackOrderInsideOut) // Order for stream graph
      .keys(processedData.categories);
    
    const layers = stack(processedData.stackData);
    
    // Create y scale (domain will be adjusted for stream graph)
    const yScale = d3.scaleLinear()
      .domain([
        d3.min(layers, layer => d3.min(layer, d => d[0])),
        d3.max(layers, layer => d3.max(layer, d => d[1]))
      ])
      .range([innerHeight, 0]);
    
    // Create color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(processedData.categories);
    
    // Create area generator
    const area = d3.area()
      .x((d, i) => xScale(parseDate(processedData.stackData[i].month)))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]))
      .curve(d3.curveBasis); // Smooth curves
    
    // Draw streams
    svg.selectAll(".layer")
      .data(layers)
      .enter()
      .append("path")
      .attr("class", "layer")
      .attr("d", area)
      .attr("fill", (d, i) => colorScale(d.key))
      .attr("opacity", 0.8)
      .on("mouseover", function(event, d) {
        // Highlight stream
        d3.select(this)
          .attr("opacity", 1)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1);
        
        // Show tooltip at the mouse position
        const [x, y] = d3.pointer(event, containerRef.current);
        
        // Calculate values for this category
        const categoryTotal = d3.sum(processedData.stackData, item => item[d.key]);
        const categoryAvg = categoryTotal / processedData.stackData.length;
        
        // Find the closest date to show specific value
        const xPos = d3.pointer(event)[0];
        const xDate = xScale.invert(xPos);
        const bisectDate = d3.bisector(d => parseDate(d.month)).left;
        const index = bisectDate(processedData.stackData, xDate, 1);
        const leftDate = processedData.stackData[Math.max(0, index - 1)];
        const rightDate = processedData.stackData[Math.min(processedData.stackData.length - 1, index)];
        const closestDate = xDate - parseDate(leftDate.month) > parseDate(rightDate.month) - xDate ? rightDate : leftDate;
        
        tooltip.html(`
          <div class="font-bold">${d.key}</div>
          <div class="mt-2">
            <div>Date: ${closestDate.month}</div>
            <div class="text-blue-600">Value: $${closestDate[d.key].toLocaleString()}</div>
            <div class="text-gray-600">Average: $${categoryAvg.toFixed(2).toLocaleString()}</div>
            <div class="text-gray-600">Total: $${categoryTotal.toFixed(2).toLocaleString()}</div>
          </div>
        `)
        .style("visibility", "visible")
        .style("left", `${x + 10}px`)
        .style("top", `${y + 10}px`);
      })
      .on("mousemove", function(event) {
        // Move tooltip with mouse
        const [x, y] = d3.pointer(event, containerRef.current);
        tooltip
          .style("left", `${x + 10}px`)
          .style("top", `${y + 10}px`);
      })
      .on("mouseout", function() {
        // Reset stream
        d3.select(this)
          .attr("opacity", 0.8)
          .attr("stroke", "none");
          
        // Hide tooltip
        tooltip.style("visibility", "hidden");
      });
    
    // Add x-axis
    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .ticks(Math.min(processedData.months.length, 10))
        .tickFormat(d3.timeFormat("%b %Y")));
    
    // Add title
    svg.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text("Sales by Category Over Time");
    
    // Add legend
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${innerWidth + 10}, 0)`);
    
    // Add legend items
    processedData.categories.forEach((category, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);
      
      legendRow.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", colorScale(category));
      
      legendRow.append("text")
        .attr("x", 20)
        .attr("y", 10)
        .attr("font-size", "12px")
        .text(category);
    });
    
    // Clean up
    return () => {
      tooltip.remove();
    };
  }, [processedData, dimensions]);
  
  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full"></svg>
      
      {(!processedData.stackData || processedData.stackData.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center p-4">
            <div className="text-gray-500 mb-2">No time-series data available</div>
            <div className="text-sm text-gray-400">
              Try selecting a different date range or filters
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamGraph;