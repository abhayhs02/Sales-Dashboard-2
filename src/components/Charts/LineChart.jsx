import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

// An improved line chart implementation with contained tooltip
const ImprovedLineChart = ({ data, timeFrame = 'monthly' }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
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
  
  // Process data for the line chart
  const chartData = React.useMemo(() => {
    if (!data || !data.length) return [];
    
    // Group data by time period
    const timeSeriesData = {};
    const getTimeKey = (date) => {
      if (timeFrame === 'monthly') {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      } else {
        // Weekly timeframe
        const weekNumber = d3.timeWeek.count(d3.timeYear(date), date);
        return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
      }
    };
    
    // First, identify the valid date range in the data
    const validDates = data
      .filter(item => item.OrderDate instanceof Date && !isNaN(item.OrderDate))
      .map(item => item.OrderDate);
    
    if (validDates.length === 0) return [];
    
    // Sort dates and get min/max
    validDates.sort((a, b) => a - b);
    const minDate = validDates[0];
    const maxDate = validDates[validDates.length - 1];
    
    console.log(`Data date range: ${minDate.toISOString()} to ${maxDate.toISOString()}`);
    
    // Process the actual data
    data.forEach(item => {
      if (!item.OrderDate || !(item.OrderDate instanceof Date) || isNaN(item.OrderDate)) return;
      
      const timeKey = getTimeKey(item.OrderDate);
      
      if (!timeSeriesData[timeKey]) {
        timeSeriesData[timeKey] = {
          date: new Date(item.OrderDate.getFullYear(), item.OrderDate.getMonth(), 15), // middle of month
          key: timeKey,
          sales: 0,
          profit: 0
        };
      }
      
      timeSeriesData[timeKey].sales += (item.OrderItemQuantity || 0) * (item.PerUnitPrice || 0);
      timeSeriesData[timeKey].profit += item.Profit || 0;
    });
    
    // Convert to array and sort by date
    return Object.values(timeSeriesData)
      .sort((a, b) => a.date - b.date);
  }, [data, timeFrame]);
  
  // Draw the chart when data or dimensions change
  useEffect(() => {
    if (!svgRef.current || !tooltipRef.current || !chartData.length || !dimensions.width || !dimensions.height) return;
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();
    
    const { width, height } = dimensions;
    const margin = { top: 20, right: 50, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(chartData, d => d.date))
      .range([0, innerWidth]);
    
    const yScaleSales = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.sales)])
      .nice()
      .range([innerHeight, 0]);
    
    const yScaleProfit = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.profit)])
      .nice()
      .range([innerHeight, 0]);
    
    // Create line generators
    const lineSales = d3.line()
      .x(d => xScale(d.date))
      .y(d => yScaleSales(d.sales))
      .curve(d3.curveMonotoneX);
    
    const lineProfit = d3.line()
      .x(d => xScale(d.date))
      .y(d => yScaleProfit(d.profit))
      .curve(d3.curveMonotoneX);
    
    // Create area generator for sales
    const areaSales = d3.area()
      .x(d => xScale(d.date))
      .y0(innerHeight)
      .y1(d => yScaleSales(d.sales))
      .curve(d3.curveMonotoneX);
    
    // Create gradient for sales area
    const salesGradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "sales-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    
    salesGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#4f46e5")
      .attr("stop-opacity", 0.3);
    
    salesGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#4f46e5")
      .attr("stop-opacity", 0);
    
    // Add sales area
    svg.append("path")
      .datum(chartData)
      .attr("fill", "url(#sales-gradient)")
      .attr("d", areaSales);
    
    // Add x-axis with proper date format based on data range
    const xAxis = d3.axisBottom(xScale);
    
    // Customize tick format based on date range
    if (timeFrame === 'monthly') {
      xAxis.ticks(d3.timeMonth.every(1))
        .tickFormat(d3.timeFormat("%b %Y"));
    } else {
      xAxis.ticks(d3.timeWeek.every(2))
        .tickFormat(d3.timeFormat("W%W %Y"));
    }
    
    svg.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em");
    
    // Add y-axis for sales
    svg.append("g")
      .call(d3.axisLeft(yScaleSales)
        .ticks(5)
        .tickFormat(d => d === 0 ? '0' : d >= 1000000 ? `$${d/1000000}M` : d >= 1000 ? `$${d/1000}K` : `$${d}`));
    
    // Add y-axis for profit
    svg.append("g")
      .attr("transform", `translate(${innerWidth}, 0)`)
      .call(d3.axisRight(yScaleProfit)
        .ticks(5)
        .tickFormat(d => d === 0 ? '0' : d >= 1000000 ? `$${d/1000000}M` : d >= 1000 ? `$${d/1000}K` : `$${d}`));
    
    // Add sales line
    svg.append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "#4f46e5")
      .attr("stroke-width", 2)
      .attr("d", lineSales);
    
    // Add profit line
    svg.append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "#10b981")
      .attr("stroke-width", 2)
      .attr("d", lineProfit);
    
    // Add data points for sales
    svg.selectAll(".dot-sales")
      .data(chartData)
      .enter()
      .append("circle")
      .attr("class", "dot-sales")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yScaleSales(d.sales))
      .attr("r", 4)
      .attr("fill", "#4f46e5");
    
    // Add data points for profit
    svg.selectAll(".dot-profit")
      .data(chartData)
      .enter()
      .append("circle")
      .attr("class", "dot-profit")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yScaleProfit(d.profit))
      .attr("r", 4)
      .attr("fill", "#10b981");
    
    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${innerWidth - 100}, 0)`);
    
    // Sales legend
    legend.append("line")
      .attr("x1", 0)
      .attr("y1", 7)
      .attr("x2", 15)
      .attr("y2", 7)
      .attr("stroke", "#4f46e5")
      .attr("stroke-width", 2);
    
    legend.append("text")
      .attr("x", 20)
      .attr("y", 10)
      .text("Sales")
      .attr("font-size", "12px");
    
    // Profit legend
    legend.append("line")
      .attr("x1", 0)
      .attr("y1", 27)
      .attr("x2", 15)
      .attr("y2", 27)
      .attr("stroke", "#10b981")
      .attr("stroke-width", 2);
    
    legend.append("text")
      .attr("x", 20)
      .attr("y", 30)
      .text("Profit")
      .attr("font-size", "12px");
    
    // Initialize tooltip
    const tooltip = d3.select(tooltipRef.current)
      .style("opacity", 0)
      .style("background-color", "white")
      .style("border", "1px solid #ddd")
      .style("border-radius", "4px")
      .style("padding", "10px")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("box-shadow", "0 4px 8px rgba(0,0,0,0.1)")
      .style("z-index", "10");
    
    // Add interactive overlay
    svg.append("rect")
      .attr("class", "overlay")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mousemove", function(event) {
        const [mouseX] = d3.pointer(event);
        const x0 = xScale.invert(mouseX);
        
        // Find closest data point
        const bisectDate = d3.bisector(d => d.date).left;
        const i = bisectDate(chartData, x0, 1);
        
        // Handle edge cases
        if (i === 0) {
          handleDataPoint(chartData[0], event);
        } else if (i >= chartData.length) {
          handleDataPoint(chartData[chartData.length - 1], event);
        } else {
          const d0 = chartData[i - 1];
          const d1 = chartData[i];
          const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
          handleDataPoint(d, event);
        }
      })
      .on("mouseout", function() {
        svg.selectAll(".hover-line").remove();
        tooltip.style("opacity", 0);
      });
    
    // Function to handle data point hover
    function handleDataPoint(d, event) {
      // Show vertical line at that point
      svg.selectAll(".hover-line").remove();
      svg.append("line")
        .attr("class", "hover-line")
        .attr("x1", xScale(d.date))
        .attr("x2", xScale(d.date))
        .attr("y1", 0)
        .attr("y2", innerHeight)
        .attr("stroke", "#9ca3af")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3");
      
      // Calculate tooltip position - ensure it stays within container bounds
      const formatDate = timeFrame === 'monthly' 
        ? d3.timeFormat("%B %Y") 
        : d3.timeFormat("Week %W, %Y");
      
      // Get container bounds
      const containerBounds = containerRef.current.getBoundingClientRect();
      const svgBounds = svgRef.current.getBoundingClientRect();
      
      // Get mouse position relative to the SVG
      const mousePosition = d3.pointer(event, containerRef.current);
      
      // Calculate tooltip dimensions
      const tooltipNode = tooltip.node();
      const tooltipWidth = tooltipNode.offsetWidth;
      const tooltipHeight = tooltipNode.offsetHeight;
      
      // Calculate position
      let left = mousePosition[0] + 15;
      let top = mousePosition[1] - 10;
      
      // Ensure tooltip stays within right edge
      if (left + tooltipWidth > containerBounds.width) {
        left = mousePosition[0] - tooltipWidth - 15;
      }
      
      // Ensure tooltip stays within bottom edge
      if (top + tooltipHeight > containerBounds.height) {
        top = mousePosition[1] - tooltipHeight - 10;
      }
      
      // Ensure tooltip doesn't go above top edge
      if (top < 0) {
        top = 5;
      }
      
      // Ensure tooltip doesn't go left of left edge
      if (left < 0) {
        left = 5;
      }
      
      // Show and position tooltip
      tooltip
        .style("opacity", 1)
        .html(`
          <div class="p-2">
            <div class="font-bold mb-1">${formatDate(d.date)}</div>
            <div class="text-indigo-600">Sales: $${d.sales.toLocaleString()}</div>
            <div class="text-emerald-600">Profit: $${d.profit.toLocaleString()}</div>
            <div class="text-gray-600">Margin: ${(d.profit / d.sales * 100).toFixed(1)}%</div>
          </div>
        `)
        .style("left", `${left}px`)
        .style("top", `${top}px`);
    }
    
  }, [chartData, dimensions, timeFrame]);
  
  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full"></svg>
      <div
        ref={tooltipRef}
        className="absolute opacity-0 bg-white shadow-md rounded-md text-sm pointer-events-none z-10"
      ></div>
      
      {(!chartData || chartData.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75">
          <div className="text-center p-4">
            <div className="text-gray-500 mb-2">No data available for the selected period</div>
            <div className="text-sm text-gray-400">
              Try selecting a different date range
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovedLineChart;