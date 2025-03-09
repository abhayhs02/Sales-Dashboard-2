import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

const NetworkVisualization = ({ data }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedNode, setSelectedNode] = useState(null);
  
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
  
  // Process data for the network graph
  const graphData = React.useMemo(() => {
    if (!data || !data.length) return { nodes: [], links: [] };
    
    // Define nodes: Products and Categories
    const productMap = {};
    const categoryMap = {};
    const customerMap = {};
    
    data.forEach(item => {
      const product = item.ProductName;
      const category = item.CategoryName;
      const customer = item.CustomerName;
      
      if (product && !productMap[product]) {
        productMap[product] = {
          id: product,
          type: 'product',
          category: category,
          totalSales: 0,
          count: 0,
          customers: new Set(),
          orders: new Set()
        };
      }
      
      if (product) {
        productMap[product].totalSales += (item.OrderItemQuantity || 0) * (item.PerUnitPrice || 0);
        productMap[product].count += 1;
        if (customer) productMap[product].customers.add(customer);
        if (item.OrderDate) productMap[product].orders.add(item.OrderDate.toString());
      }
      
      if (category && !categoryMap[category]) {
        categoryMap[category] = {
          id: category,
          type: 'category',
          totalSales: 0,
          count: 0,
          products: new Set()
        };
      }
      
      if (category) {
        categoryMap[category].totalSales += (item.OrderItemQuantity || 0) * (item.PerUnitPrice || 0);
        categoryMap[category].count += 1;
        if (product) categoryMap[category].products.add(product);
      }
      
      if (customer && !customerMap[customer] && product) {
        customerMap[customer] = {
          id: customer,
          type: 'customer',
          totalSpent: 0,
          purchases: new Set()
        };
      }
      
      if (customer && product) {
        customerMap[customer].totalSpent += (item.OrderItemQuantity || 0) * (item.PerUnitPrice || 0);
        customerMap[customer].purchases.add(product);
      }
    });
    
    // Calculate co-purchasing relationships between products
    const coPurchaseMap = {};
    
    Object.keys(customerMap).forEach(customer => {
      const purchases = Array.from(customerMap[customer].purchases);
      
      // Create links between products purchased by the same customer
      for (let i = 0; i < purchases.length; i++) {
        for (let j = i + 1; j < purchases.length; j++) {
          const product1 = purchases[i];
          const product2 = purchases[j];
          
          const linkKey = product1 < product2 
            ? `${product1}-${product2}` 
            : `${product2}-${product1}`;
            
          if (!coPurchaseMap[linkKey]) {
            coPurchaseMap[linkKey] = {
              source: product1,
              target: product2,
              weight: 0,
              customers: new Set()
            };
          }
          
          coPurchaseMap[linkKey].weight += 1;
          coPurchaseMap[linkKey].customers.add(customer);
        }
      }
    });
    
    // Convert Sets to counts
    Object.values(productMap).forEach(product => {
      product.customerCount = product.customers.size;
      product.orderCount = product.orders.size;
      delete product.customers;
      delete product.orders;
    });
    
    Object.values(categoryMap).forEach(category => {
      category.productCount = category.products.size;
      delete category.products;
    });
    
    Object.values(coPurchaseMap).forEach(link => {
      link.customerCount = link.customers.size;
      delete link.customers;
    });
    
    // Create nodes list (include top categories by sales and top products within categories)
    const topCategories = Object.values(categoryMap)
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);
    
    const topCategoryIds = new Set(topCategories.map(c => c.id));
    
    const topProducts = Object.values(productMap)
      .filter(p => topCategoryIds.has(p.category))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 30);
    
    const topProductIds = new Set(topProducts.map(p => p.id));
    
    // Create links list
    // 1. Category-Product links
    const categoryProductLinks = topProducts.map(product => ({
      source: product.category,
      target: product.id,
      type: 'category-product',
      weight: 3
    }));
    
    // 2. Product-Product links (co-purchasing)
    const productProductLinks = Object.values(coPurchaseMap)
      .filter(link => 
        topProductIds.has(link.source) && 
        topProductIds.has(link.target) &&
        link.weight > 1 // Only include stronger relationships
      )
      .map(link => ({
        ...link,
        type: 'co-purchase',
        strength: link.weight
      }));
    
    // Final graph data
    return {
      nodes: [
        ...topCategories,
        ...topProducts
      ],
      links: [
        ...categoryProductLinks,
        ...productProductLinks
      ]
    };
  }, [data]);
  
  // Draw the network graph
  useEffect(() => {
    if (!svgRef.current || !dimensions.width || !dimensions.height || !graphData.nodes.length) return;
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();
    
    const { width, height } = dimensions;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
    
    // Add a group for zoom/pan
    const g = svg.append("g");
    
    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom);
    
    // Define forces
    const simulation = d3.forceSimulation(graphData.nodes)
      .force("link", d3.forceLink(graphData.links)
        .id(d => d.id)
        .distance(link => {
          if (link.type === 'category-product') return 80;
          return 120 / (link.strength || 1);
        })
        .strength(link => {
          if (link.type === 'category-product') return 0.7;
          return 0.2 + Math.min(0.5, link.strength / 10);
        })
      )
      .force("charge", d3.forceManyBody()
        .strength(d => {
          return d.type === 'category' ? -500 : -200;
        })
      )
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05))
      .force("collision", d3.forceCollide(d => 
        d.type === 'category' ? 60 : 30
      ));
    
    // Define color scales
    const categoryColorScale = d3.scaleOrdinal(d3.schemeCategory10);
    
    // Draw links
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(graphData.links)
      .enter()
      .append("line")
      .attr("stroke-width", d => {
        if (d.type === 'category-product') return 2;
        return 1 + Math.min(5, d.strength / 2);
      })
      .attr("stroke", d => {
        if (d.type === 'category-product') return "#aaa";
        return "#999";
      })
      .attr("stroke-opacity", d => {
        if (d.type === 'category-product') return 0.6;
        return 0.3 + Math.min(0.6, d.strength / 10);
      });
    
    // Create a group for each node
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll(".node")
      .data(graphData.nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .on("click", (event, d) => {
        setSelectedNode(d);
        event.stopPropagation();
      })
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      );
    
    // Draw circles for nodes
    node.append("circle")
      .attr("r", d => d.type === 'category' ? 30 : 10 + Math.sqrt(d.totalSales) / 150)
      .attr("fill", d => {
        if (d.type === 'category') return categoryColorScale(d.id);
        return categoryColorScale(d.category);
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("fill-opacity", d => d.type === 'category' ? 0.8 : 0.7);
    
    // Add labels
    node.append("text")
      .attr("dy", d => d.type === 'category' ? "0.3em" : "-1.2em")
      .attr("text-anchor", "middle")
      .attr("font-size", d => d.type === 'category' ? "12px" : "10px")
      .attr("font-weight", d => d.type === 'category' ? "bold" : "normal")
      .text(d => d.id)
      .attr("fill", d => d.type === 'category' ? "#fff" : "#333")
      .each(function(d) {
        // Truncate long product names
        if (d.type === 'product') {
          const text = d3.select(this);
          let textLength = text.node().getComputedTextLength();
          let textContent = text.text();
          const maxLength = 14;
          
          while (textLength > 120 && textContent.length > maxLength) {
            textContent = textContent.slice(0, -1);
            text.text(textContent + '...');
            textLength = text.node().getComputedTextLength();
          }
        }
      });
    
    // Add sales amount for product nodes
    node.filter(d => d.type === 'product')
      .append("text")
      .attr("dy", "1em")
      .attr("text-anchor", "middle")
      .attr("font-size", "8px")
      .attr("fill", "#666")
      .text(d => `$${Math.round(d.totalSales).toLocaleString()}`);
    
    // Handle simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
      
      node
        .attr("transform", d => `translate(${d.x}, ${d.y})`);
    });
    
    // Handle node dragging
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    // Add click handler to clear selection when clicking on background
    svg.on("click", () => {
      setSelectedNode(null);
    });
    
    // Add simulation controls
    const controls = svg.append("g")
      .attr("class", "controls")
      .attr("transform", `translate(${width - 120}, 20)`);
    
    controls.append("rect")
      .attr("width", 100)
      .attr("height", 30)
      .attr("rx", 5)
      .attr("fill", "#f3f4f6")
      .attr("stroke", "#d1d5db");
    
    controls.append("text")
      .attr("x", 50)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("Recenter")
      .attr("cursor", "pointer")
      .on("click", () => {
        svg.transition().duration(750).call(
          zoom.transform,
          d3.zoomIdentity
        );
        
        // Restart simulation
        simulation.alpha(0.3).restart();
      });
    
    // Add legend
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(20, ${height - 90})`);
    
    // Legend background
    legend.append("rect")
      .attr("width", 150)
      .attr("height", 70)
      .attr("fill", "white")
      .attr("opacity", 0.8)
      .attr("rx", 5);
    
    // Category node legend
    legend.append("circle")
      .attr("cx", 15)
      .attr("cy", 20)
      .attr("r", 8)
      .attr("fill", categoryColorScale(graphData.nodes.find(n => n.type === 'category').id));
    
    legend.append("text")
      .attr("x", 30)
      .attr("y", 24)
      .attr("font-size", "12px")
      .text("Category");
    
    // Product node legend
    legend.append("circle")
      .attr("cx", 15)
      .attr("cy", 45)
      .attr("r", 5)
      .attr("fill", categoryColorScale(graphData.nodes.find(n => n.type === 'product').category));
    
    legend.append("text")
      .attr("x", 30)
      .attr("y", 49)
      .attr("font-size", "12px")
      .text("Product");
    
    // Connection legend
    legend.append("line")
      .attr("x1", 10)
      .attr("y1", 65)
      .attr("x2", 20)
      .attr("y2", 65)
      .attr("stroke", "#999")
      .attr("stroke-width", 2);
    
    legend.append("text")
      .attr("x", 30)
      .attr("y", 69)
      .attr("font-size", "12px")
      .text("Co-purchases");
    
    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .text("Product Relationship Network");
    
    // Add subtitle
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 45)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#666")
      .text("Products often purchased together, grouped by category");
      
    // Cleanup when unmounting
    return () => {
      simulation.stop();
    };
  }, [graphData, dimensions]);
  
  // Render node details panel when a node is selected
  const renderNodeDetails = () => {
    if (!selectedNode) return null;
    
    return (
      <div className="absolute top-16 right-4 bg-white shadow-md rounded-md p-4 max-w-xs">
        <button 
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" 
          onClick={() => setSelectedNode(null)}
        >
          ✕
        </button>
        
        <h3 className="font-bold text-lg mb-2 pr-6">
          {selectedNode.id}
        </h3>
        
        {selectedNode.type === 'category' ? (
          <div className="text-sm">
            <div className="mb-1">
              Total Sales: ${selectedNode.totalSales.toLocaleString()}
            </div>
            <div className="mb-1">
              Products: {selectedNode.productCount}
            </div>
            <div className="mb-1">
              Order Count: {selectedNode.count}
            </div>
          </div>
        ) : (
          <div className="text-sm">
            <div className="mb-1">
              Category: {selectedNode.category}
            </div>
            <div className="mb-1">
              Total Sales: ${selectedNode.totalSales.toLocaleString()}
            </div>
            <div className="mb-1">
              Customers: {selectedNode.customerCount}
            </div>
            <div className="mb-1">
              Orders: {selectedNode.orderCount}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full"></svg>
      {renderNodeDetails()}
      
      {graphData.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75">
          <div className="text-center p-4">
            <div className="text-gray-500 mb-2">No relationship data available</div>
            <div className="text-sm text-gray-400">
              Try selecting a different date range or filters
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkVisualization;