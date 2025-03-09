import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

const SunburstVisualization = ({ data }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedPath, setSelectedPath] = useState([]);
  
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
  
  // Process data for the sunburst visualization
  const hierarchyData = React.useMemo(() => {
    if (!data || !data.length) return { name: 'root', children: [] };
    
    // Create nested hierarchy: Region > Country > Category > Product
    const root = { name: 'root', children: [] };
    const regionMap = {};
    
    data.forEach(item => {
      const region = item.RegionName || 'Unknown';
      const country = item.CountryName || 'Unknown';
      const category = item.CategoryName || 'Unknown';
      const product = item.ProductName || 'Unknown';
      const salesValue = (item.OrderItemQuantity || 0) * (item.PerUnitPrice || 0);
      const profit = item.Profit || 0;
      
      // Add region if it doesn't exist
      if (!regionMap[region]) {
        const regionNode = { name: region, children: [] };
        regionMap[region] = { node: regionNode, countries: {} };
        root.children.push(regionNode);
      }
      
      // Add country if it doesn't exist
      if (!regionMap[region].countries[country]) {
        const countryNode = { name: country, children: [] };
        regionMap[region].countries[country] = { node: countryNode, categories: {} };
        regionMap[region].node.children.push(countryNode);
      }
      
      // Add category if it doesn't exist
      if (!regionMap[region].countries[country].categories[category]) {
        const categoryNode = { name: category, children: [] };
        regionMap[region].countries[country].categories[category] = { 
          node: categoryNode, 
          products: {} 
        };
        regionMap[region].countries[country].node.children.push(categoryNode);
      }
      
      // Add product if it doesn't exist, otherwise update values
      if (!regionMap[region].countries[country].categories[category].products[product]) {
        regionMap[region].countries[country].categories[category].products[product] = {
          name: product,
          value: salesValue,
          profit: profit,
          count: 1
        };
        regionMap[region].countries[country].categories[category].node.children.push(
          regionMap[region].countries[country].categories[category].products[product]
        );
      } else {
        const productNode = regionMap[region].countries[country].categories[category].products[product];
        productNode.value += salesValue;
        productNode.profit += profit;
        productNode.count += 1;
      }
    });
    
    // Calculate values for intermediate nodes (sum of children)
    function calculateValues(node) {
      if (!node.children || node.children.length === 0) {
        return node.value || 0;
      }
      
      let sum = 0;
      let profitSum = 0;
      let countSum = 0;
      
      node.children.forEach(child => {
        sum += calculateValues(child);
        profitSum += child.profit || 0;
        countSum += child.count || 0;
      });
      
      node.value = sum;
      node.profit = profitSum;
      node.count = countSum;
      
      return sum;
    }
    
    calculateValues(root);
    
    return root;
  }, [data]);
  
  // Draw the sunburst chart
  useEffect(() => {
    if (!svgRef.current || !hierarchyData.children || !dimensions.width || !dimensions.height) return;
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();
    
    const { width, height } = dimensions;
    const radius = Math.min(width, height) / 2;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);
    
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
    
    // Create hierarchy and partition layout
    const root = d3.hierarchy(hierarchyData)
      .sum(d => d.value);
    
    // Extract levels for colorization
    const regions = new Set();
    const countries = new Set();
    const categories = new Set();
    
    root.children.forEach(region => {
      regions.add(region.data.name);
      region.children.forEach(country => {
        countries.add(country.data.name);
        country.children.forEach(category => {
          categories.add(category.data.name);
        });
      });
    });
    
    // Create color scales for each level
    const regionColorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(Array.from(regions));
    
    const countryColorScale = d3.scaleOrdinal(d3.schemeSet3)
      .domain(Array.from(countries));
    
    const categoryColorScale = d3.scaleOrdinal(d3.schemePaired)
      .domain(Array.from(categories));
    
    // Create partition layout
    const partition = d3.partition()
      .size([2 * Math.PI, radius * 0.9]);
    
    const partitionedRoot = partition(root);
    
    // Create arc generator
    const arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1)
      .padAngle(0.005)
      .padRadius(radius / 3);
    
    // Draw arcs
    const paths = svg.selectAll("path")
      .data(partitionedRoot.descendants().filter(d => d.depth))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => {
        if (d.depth === 1) return regionColorScale(d.data.name);
        if (d.depth === 2) return countryColorScale(d.data.name);
        if (d.depth === 3) return categoryColorScale(d.data.name);
        return "#ccc";
      })
      .attr("stroke", "white")
      .attr("stroke-width", 0.5)
      .attr("opacity", d => {
        // Highlight selected path
        if (selectedPath.length === 0) return 1;
        
        let node = root;
        for (const name of selectedPath) {
          const found = node.children?.find(child => child.data.name === name);
          if (!found) return 0.3; // Dim if not in the selected path
          node = found;
        }
        
        // Check if this node is the selected one or its ancestor/descendant
        let current = d;
        const nodePath = [];
        while (current.parent) {
          nodePath.unshift(current.data.name);
          current = current.parent;
        }
        
        // Check if this node's path starts with the selected path
        if (selectedPath.every((name, index) => index >= nodePath.length || nodePath[index] === name)) {
          return 1;
        }
        
        // Check if the selected path starts with this node's path
        if (nodePath.every((name, index) => index >= selectedPath.length || selectedPath[index] === name)) {
          return 1;
        }
        
        return 0.3; // Dim otherwise
      })
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .attr("stroke-width", 1.5)
          .attr("stroke", "#333");
        
        // Position tooltip
        const [x, y] = d3.pointer(event, containerRef.current);
        
        // Show tooltip
        tooltip.html(`
          <div class="font-bold">${d.data.name}</div>
          <div class="text-sm text-gray-600">
            ${d.depth === 1 ? 'Region' : d.depth === 2 ? 'Country' : d.depth === 3 ? 'Category' : 'Product'}
          </div>
          <div class="mt-2">
            <div class="text-blue-600">Sales: $${d.data.value.toLocaleString()}</div>
            <div class="text-green-600">Profit: $${d.data.profit.toLocaleString()}</div>
            <div class="text-gray-600">Margin: ${(d.data.profit / d.data.value * 100).toFixed(1)}%</div>
          </div>
          ${d.children ? `<div class="text-gray-600">Items: ${d.children.length}</div>` : ''}
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
        d3.select(this)
          .attr("stroke-width", 0.5)
          .attr("stroke", "white");
          
        // Hide tooltip
        tooltip.style("visibility", "hidden");
      })
      .on("click", function(event, d) {
        event.stopPropagation();
        
        // Build path from root to this node
        const path = [];
        let current = d;
        while (current.parent && current.depth > 0) {
          path.unshift(current.data.name);
          current = current.parent;
        }
        
        // If this is already the selected path, go one level up
        if (JSON.stringify(path) === JSON.stringify(selectedPath)) {
          setSelectedPath(path.slice(0, -1));
        } else {
          setSelectedPath(path);
        }
      });
    
    // Add text labels for larger segments
    svg.selectAll("text")
      .data(partitionedRoot.descendants().filter(d => {
        // Only show labels for segments that are big enough
        return d.depth && (d.x1 - d.x0) > 0.15;
      }))
      .enter()
      .append("text")
      .attr("transform", d => {
        const x = (d.x0 + d.x1) / 2;
        const y = (d.y0 + d.y1) / 2;
        const angle = x - Math.PI / 2;
        const radius = y;
        return `rotate(${angle * 180 / Math.PI}) translate(${radius}, 0) rotate(${angle >= 0 ? 90 : -90})`;
      })
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", d => d.depth === 1 ? "12px" : "10px")
      .attr("fill", "white")
      .attr("pointer-events", "none")
      .text(d => {
        // Truncate text if needed
        const name = d.data.name;
        const angle = d.x1 - d.x0;
        const maxLength = Math.floor(angle * 20);
        return name.length > maxLength ? name.substring(0, maxLength - 3) + '...' : name;
      });
    
    // Add center circle for resetting selection
    svg.append("circle")
      .attr("r", radius * 0.1)
      .attr("fill", "white")
      .attr("stroke", "#ddd")
      .attr("cursor", "pointer")
      .on("click", () => {
        setSelectedPath([]);
      });
    
    // Add center text
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("cursor", "pointer")
      .text("Reset")
      .on("click", () => {
        setSelectedPath([]);
      });
    
    // Add breadcrumb navigation
    if (selectedPath.length > 0) {
      const breadcrumb = svg.append("g")
        .attr("transform", `translate(${-width/2 + 20}, ${-height/2 + 20})`);
        
      breadcrumb.append("text")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text("Path: ");
      
      selectedPath.forEach((name, index) => {
        breadcrumb.append("text")
          .attr("font-size", "14px")
          .attr("x", 50 + index * 10)
          .attr("y", index * 20)
          .text(name + (index < selectedPath.length - 1 ? " >" : ""));
      });
    }
    
    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${radius * 0.8}, ${-radius * 0.8})`);
      
    // Add legend title
    legend.append("text")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("y", -20)
      .text("Hierarchy Levels");
    
    // Region legend
    legend.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("y", 0)
      .attr("fill", regionColorScale(Array.from(regions)[0]));
      
    legend.append("text")
      .attr("font-size", "10px")
      .attr("x", 16)
      .attr("y", 10)
      .text("Region");
    
    // Country legend
    legend.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("y", 20)
      .attr("fill", countryColorScale(Array.from(countries)[0]));
      
    legend.append("text")
      .attr("font-size", "10px")
      .attr("x", 16)
      .attr("y", 30)
      .text("Country");
    
    // Category legend
    legend.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("y", 40)
      .attr("fill", categoryColorScale(Array.from(categories)[0]));
      
    legend.append("text")
      .attr("font-size", "10px")
      .attr("x", 16)
      .attr("y", 50)
      .text("Category");
    
    // Product legend
    legend.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("y", 60)
      .attr("fill", "#ccc");
      
    legend.append("text")
      .attr("font-size", "10px")
      .attr("x", 16)
      .attr("y", 70)
      .text("Product");
    
    // Add title
    svg.append("text")
      .attr("x", 0)
      .attr("y", -radius - 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .text("Sales Hierarchy");
    
    // Add subtitle
    svg.append("text")
      .attr("x", 0)
      .attr("y", -radius - 4)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#666")
      .text("Region > Country > Category > Product");
    
    // Add additional info text
    if (selectedPath.length === 0) {
      svg.append("text")
        .attr("x", 0)
        .attr("y", radius + 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#666")
        .text("Click on segments to explore deeper");
    }
    
    // Clean up on unmount
    return () => {
      tooltip.remove();
    };
  }, [hierarchyData, dimensions, selectedPath]);
  
  // Render information panel
  const renderInfoPanel = () => {
    if (!hierarchyData || selectedPath.length === 0) return null;
    
    // Find the selected node data
    let currentNode = hierarchyData;
    for (const name of selectedPath) {
      const childNode = currentNode.children?.find(child => child.name === name);
      if (!childNode) return null;
      currentNode = childNode;
    }
    
    return (
      <div className="absolute top-4 right-4 bg-white shadow-md rounded-md p-4 max-w-xs">
        <h3 className="font-bold text-lg mb-2">
          {currentNode.name}
        </h3>
        <div className="text-sm">
          <div className="mb-1">
            <span className="font-medium">Level:</span> {selectedPath.length === 1 ? 'Region' : 
                                              selectedPath.length === 2 ? 'Country' : 
                                              selectedPath.length === 3 ? 'Category' : 'Product'}
          </div>
          <div className="mb-1">
            <span className="font-medium">Total Sales:</span> ${currentNode.value.toLocaleString()}
          </div>
          <div className="mb-1">
            <span className="font-medium">Total Profit:</span> ${currentNode.profit.toLocaleString()}
          </div>
          <div className="mb-1">
            <span className="font-medium">Profit Margin:</span> {(currentNode.profit / currentNode.value * 100).toFixed(1)}%
          </div>
          {currentNode.children && (
            <div className="mb-1">
              <span className="font-medium">Subcategories:</span> {currentNode.children.length}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full" onClick={() => setSelectedPath([])}></svg>
      {renderInfoPanel()}
      
      {hierarchyData.children && hierarchyData.children.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center p-4">
            <div className="text-gray-500 mb-2">No hierarchical data available</div>
            <div className="text-sm text-gray-400">
              Try selecting a different date range or filters
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SunburstVisualization;