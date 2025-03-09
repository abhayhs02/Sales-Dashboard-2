import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

const EnhancedPieChart = ({ data }) => {
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
    if (!svgRef.current || !chartData.length || !dimensions.width || !dimensions.height) return;
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();
    
    const { width, height } = dimensions;
    const radius = Math.min(width, height) / 2 * 0.7;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);
    
    // Create color scale
    const colorScale = d3.scaleOrdinal()
      .domain(chartData.map(d => d.category))
      .range(d3.schemeCategory10);
    
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
    
    // Create a tooltip div that is hidden by default
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
        
        // Position tooltip relative to mouse pointer
        const [x, y] = d3.pointer(event, containerRef.current);
        
        // Show tooltip
        tooltip.html(`
          <div class="font-bold mb-1">${d.data.category}</div>
          <div class="text-indigo-600">$${d.data.value.toLocaleString()}</div>
          <div class="text-gray-600">${(d.data.value / d3.sum(chartData, d => d.value) * 100).toFixed(1)}%</div>
        `)
        .style("visibility", "visible")
        .style("left", `${x + 10}px`)
        .style("top", `${y - 10}px`);
      })
      .on("mousemove", function(event) {
        // Move tooltip with mouse
        const [x, y] = d3.pointer(event, containerRef.current);
        tooltip
          .style("left", `${x + 10}px`)
          .style("top", `${y - 10}px`);
      })
      .on("mouseout", function() {
        // Reset slice
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arc);
        
        // Hide tooltip
        tooltip.style("visibility", "hidden");
      });
    
    // Add labels to the slices
    svg.selectAll(".slice-label")
      .data(pieData.filter(d => (d.endAngle - d.startAngle) > 0.25)) // Only label larger slices
      .enter()
      .append("text")
      .attr("class", "slice-label")
      .attr("transform", d => {
        const pos = arc.centroid(d);
        // Move the label slightly outward for better readability
        const x = pos[0] * 1.1;
        const y = pos[1] * 1.1;
        return `translate(${x}, ${y})`;
      })
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#333")
      .text(d => {
        // Short version of the category name
        const name = d.data.category;
        return name.length > 10 ? name.substring(0, 8) + '...' : name;
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
    
    // Add legends
    const legendRectSize = 12;
    const legendSpacing = 6;
    const legendHeight = legendRectSize + legendSpacing;
    
    // Create a separate group for the legend
    const legend = svg.selectAll('.legend')
      .data(chartData)
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', (d, i) => {
        const rows = Math.min(chartData.length, 5);  // Maximum 5 items per column
        const cols = Math.ceil(chartData.length / rows);
        
        const row = i % rows;
        const col = Math.floor(i / rows);
        
        // Position the legend in the bottom right corner
        const x = (col * 150) - (radius * 0.9);
        const y = (row * legendHeight) + (radius * 0.7);
        
        return `translate(${x}, ${y})`;
      });
    
    // Add colored rectangles to legend
    legend.append('rect')
      .attr('width', legendRectSize)
      .attr('height', legendRectSize)
      .style('fill', d => colorScale(d.category))
      .style('stroke', d => colorScale(d.category));
    
    // Add text to legend
    legend.append('text')
      .attr('x', legendRectSize + legendSpacing)
      .attr('y', legendRectSize - 2)
      .attr('font-size', '12px')
      .text(d => {
        const label = d.category;
        return label.length > 15 ? label.substring(0, 13) + '...' : label;
      });
      
    // Clean up on component unmount
    return () => {
      tooltip.remove();
    };
    
  }, [chartData, dimensions]);
  
  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
};

export default EnhancedPieChart;