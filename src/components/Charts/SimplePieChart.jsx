import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

// A simplified pie chart implementation
const SimplePieChart = ({ data }) => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Set up dimensions when the component mounts
  useEffect(() => {
    if (!svgRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries.length) return;
      
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    
    resizeObserver.observe(svgRef.current.parentElement);
    
    return () => {
      if (svgRef.current?.parentElement) {
        resizeObserver.unobserve(svgRef.current.parentElement);
      }
    };
  }, []);
  
  // Process data for the pie chart
  const chartData = React.useMemo(() => {
    if (!data || !data.length) return [];
    
    // Group by category
    const categoryMap = {};
    
    data.forEach(item => {
      const category = item.CategoryName || 'Unknown';
      if (!categoryMap[category]) {
        categoryMap[category] = {
          category,
          value: 0
        };
      }
      categoryMap[category].value += (item.OrderItemQuantity || 0) * (item.PerUnitPrice || 0);
    });
    
    return Object.values(categoryMap).sort((a, b) => b.value - a.value);
  }, [data]);
  
  // Draw the chart when data or dimensions change
  useEffect(() => {
    if (!svgRef.current || !tooltipRef.current || !chartData.length || !dimensions.width || !dimensions.height) return;
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();
    
    const { width, height } = dimensions;
    const radius = Math.min(width, height) / 2 * 0.8;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);
    
    // Create color scale
    const colorScale = d3.scaleOrdinal()
      .domain(chartData.map(d => d.category))
      .range(d3.schemeSet2);
    
    // Create pie generator
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);
    
    // Create arc generator
    const arc = d3.arc()
      .innerRadius(radius * 0.5) // Create a donut chart by setting innerRadius
      .outerRadius(radius * 0.8);
    
    // Create arc generator for hover effect
    const arcHover = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.85);
    
    // Generate pie slices
    const pieData = pie(chartData);
    
    // Add slices
    const slices = svg.selectAll(".slice")
      .data(pieData)
      .enter()
      .append("path")
      .attr("class", "slice")
      .attr("d", arc)
      .attr("fill", d => colorScale(d.data.category))
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .on("mouseover", function(event, d) {
        // Highlight slice
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arcHover);
        
        // Show tooltip
        const tooltip = d3.select(tooltipRef.current);
        tooltip.style("opacity", 1)
          .html(`
            <div class="p-2">
              <div class="font-bold mb-1">${d.data.category}</div>
              <div class="text-indigo-600">$${d.data.value.toLocaleString()}</div>
            </div>
          `)
          .style("left", `${event.pageX + 15}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", function() {
        // Reset slice
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arc);
        
        // Hide tooltip
        d3.select(tooltipRef.current).style("opacity", 0);
      });
    
    // Add center text
    const totalValue = d3.sum(chartData, d => d.value);
    
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.2em")
      .attr("font-size", "14px")
      .attr("fill", "#666")
      .text("Total");
    
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1em")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text(`$${totalValue.toLocaleString()}`);
  }, [chartData, dimensions]);
  
  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full"></svg>
      <div
        ref={tooltipRef}
        className="absolute bg-white shadow-md rounded-md text-sm pointer-events-none opacity-0 z-10"
        style={{
          transition: "opacity 0.2s ease-in-out",
          top: 0,
          left: 0
        }}
      ></div>
    </div>
  );
};

export default SimplePieChart;