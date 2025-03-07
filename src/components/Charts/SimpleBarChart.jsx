import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

// A simplified bar chart implementation
const SimpleBarChart = ({ data, type = 'categories' }) => {
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
  
  // Process data for the bar chart
  const chartData = React.useMemo(() => {
    if (!data || !data.length) return [];
    
    if (type === 'categories') {
      // Group by category
      const categoryMap = {};
      
      data.forEach(item => {
        const category = item.CategoryName || 'Unknown';
        if (!categoryMap[category]) {
          categoryMap[category] = {
            category,
            sales: 0,
            profit: 0
          };
        }
        categoryMap[category].sales += (item.OrderItemQuantity || 0) * (item.PerUnitPrice || 0);
        categoryMap[category].profit += item.Profit || 0;
      });
      
      return Object.values(categoryMap).sort((a, b) => b.sales - a.sales);
    } else {
      // Group by product (top products)
      const productMap = {};
      
      data.forEach(item => {
        const product = item.ProductName || 'Unknown';
        if (!productMap[product]) {
          productMap[product] = {
            product,
            sales: 0,
            profit: 0
          };
        }
        productMap[product].sales += (item.OrderItemQuantity || 0) * (item.PerUnitPrice || 0);
        productMap[product].profit += item.Profit || 0;
      });
      
      // Return top 10 products by profit
      return Object.values(productMap)
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 10);
    }
  }, [data, type]);
  
  // Draw the chart when data or dimensions change
  useEffect(() => {
    if (!svgRef.current || !tooltipRef.current || !chartData.length || !dimensions.width || !dimensions.height) return;
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();
    
    const { width, height } = dimensions;
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Define key for x-axis based on chart type
    const xKey = type === 'categories' ? 'category' : 'product';
    
    // Create scales
    const xScale = d3.scaleBand()
      .domain(chartData.map(d => d[xKey]))
      .range([0, innerWidth])
      .padding(0.3);
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => Math.max(d.sales, d.profit))])
      .nice()
      .range([innerHeight, 0]);
    
    // Create color scale
    const colorScale = d3.scaleOrdinal()
      .domain(['sales', 'profit'])
      .range(['#4f46e5', '#10b981']);
    
    // Add x-axis
    svg.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em");
    
    // Add y-axis
    svg.append("g")
      .call(d3.axisLeft(yScale)
        .ticks(5)
        .tickFormat(d => d === 0 ? '0' : d >= 1000000 ? `$${d/1000000}M` : d >= 1000 ? `$${d/1000}K` : `$${d}`));
    
    // Add sales bars
    svg.selectAll(".bar-sales")
      .data(chartData)
      .enter()
      .append("rect")
      .attr("class", "bar-sales")
      .attr("x", d => xScale(d[xKey]))
      .attr("width", xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.sales))
      .attr("height", d => innerHeight - yScale(d.sales))
      .attr("fill", colorScale('sales'))
      .attr("rx", 2)
      .on("mouseover", function(event, d) {
        // Highlight bar
        d3.select(this)
          .attr("opacity", 0.8);
        
        // Show tooltip
        const tooltip = d3.select(tooltipRef.current);
        tooltip.style("opacity", 1)
          .html(`
            <div class="p-2">
              <div class="font-bold mb-1">${d[xKey]}</div>
              <div class="text-indigo-600">Sales: $${d.sales.toLocaleString()}</div>
              <div class="text-emerald-600">Profit: $${d.profit.toLocaleString()}</div>
              <div class="text-gray-600">Margin: ${(d.profit / d.sales * 100).toFixed(1)}%</div>
            </div>
          `)
          .style("left", `${event.pageX + 15}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", function() {
        // Reset highlight
        d3.select(this)
          .attr("opacity", 1);
        
        // Hide tooltip
        d3.select(tooltipRef.current).style("opacity", 0);
      });
    
    // Add profit bars
    svg.selectAll(".bar-profit")
      .data(chartData)
      .enter()
      .append("rect")
      .attr("class", "bar-profit")
      .attr("x", d => xScale(d[xKey]) + xScale.bandwidth() / 2)
      .attr("width", xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.profit))
      .attr("height", d => innerHeight - yScale(d.profit))
      .attr("fill", colorScale('profit'))
      .attr("rx", 2)
      .on("mouseover", function(event, d) {
        // Highlight bar
        d3.select(this)
          .attr("opacity", 0.8);
        
        // Show tooltip
        const tooltip = d3.select(tooltipRef.current);
        tooltip.style("opacity", 1)
          .html(`
            <div class="p-2">
              <div class="font-bold mb-1">${d[xKey]}</div>
              <div class="text-indigo-600">Sales: $${d.sales.toLocaleString()}</div>
              <div class="text-emerald-600">Profit: $${d.profit.toLocaleString()}</div>
              <div class="text-gray-600">Margin: ${(d.profit / d.sales * 100).toFixed(1)}%</div>
            </div>
          `)
          .style("left", `${event.pageX + 15}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", function() {
        // Reset highlight
        d3.select(this)
          .attr("opacity", 1);
        
        // Hide tooltip
        d3.select(tooltipRef.current).style("opacity", 0);
      });
    
    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${innerWidth - 100}, 0)`);
    
    // Sales legend
    legend.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", colorScale('sales'));
    
    legend.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text("Sales")
      .attr("font-size", "12px");
    
    // Profit legend
    legend.append("rect")
      .attr("x", 0)
      .attr("y", 25)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", colorScale('profit'));
    
    legend.append("text")
      .attr("x", 20)
      .attr("y", 37)
      .text("Profit")
      .attr("font-size", "12px");
    
  }, [chartData, dimensions, type]);
  
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

export default SimpleBarChart;