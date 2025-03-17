import React, { useRef, useEffect, useState } from 'react';
import { FiTrendingUp, FiTrendingDown, FiInfo } from 'react-icons/fi';
import * as d3 from 'd3';
// import './KPICard.css'; // Removed import of CSS file

const FlippableKPICard = ({ title, value, icon, change, sparklineData = [], color, description }) => {
  const sparklineRef = useRef(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // Draw sparkline on component mount and when data changes
  useEffect(() => {
    if (sparklineData && sparklineData.length > 0 && sparklineRef.current && !isFlipped) {
      drawSparkline(sparklineRef.current, sparklineData, color);
    }
  }, [sparklineData, color, isFlipped]);

  // Function to draw sparkline
  const drawSparkline = (element, data, color) => {
    // Clear previous sparkline
    d3.select(element).selectAll("*").remove();

    // Set dimensions
    const width = 100;
    const height = 30;
    const margin = { top: 5, right: 5, bottom: 5, left: 5 };

    // Create SVG
    const svg = d3.select(element)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Handle case with not enough data
    if (data.length < 2) {
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#ccc")
        .attr("font-size", "10px")
        .text("Not enough data");
      return;
    }

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([d3.min(data) * 0.9, d3.max(data) * 1.1])
      .range([height - margin.bottom, margin.top]);

    // Create line generator
    const line = d3.line()
      .x((d, i) => xScale(i))
      .y(d => yScale(d))
      .curve(d3.curveBasis);

    // Draw the line
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", getColorCode(color))
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add gradient area under the line
    const area = d3.area()
      .x((d, i) => xScale(i))
      .y0(height - margin.bottom)
      .y1(d => yScale(d))
      .curve(d3.curveBasis);

    // Create gradient
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", `gradient-${title.replace(/\s+/g, '-')}`)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", getColorCode(color))
      .attr("stop-opacity", 0.5);

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", getColorCode(color))
      .attr("stop-opacity", 0);

    // Add area path
    svg.append("path")
      .datum(data)
      .attr("fill", `url(#gradient-${title.replace(/\s+/g, '-')})`)
      .attr("d", area);

    // Add dot for the last value
    svg.append("circle")
      .attr("cx", xScale(data.length - 1))
      .attr("cy", yScale(data[data.length - 1]))
      .attr("r", 3)
      .attr("fill", getColorCode(color));
  };

  // Helper function to get color code
  const getColorCode = (color) => {
    const colorMap = {
      blue: '#4f46e5',
      green: '#10b981',
      purple: '#8b5cf6',
      orange: '#f97316',
      red: '#ef4444'
    };
    return colorMap[color] || colorMap.blue;
  };

  // Format the change indicator
  const formatChange = (change) => {
    const isPositive = change >= 0;
    const formattedValue = Math.abs(change).toFixed(1);
    const Icon = isPositive ? FiTrendingUp : FiTrendingDown;
    const colorClass = isPositive ? 'text-green-500' : 'text-red-500';

    return (
      <div className={`flex items-center ${colorClass}`}>
        <Icon className="mr-1" />
        <span>{formattedValue}%</span>
      </div>
    );
  };

  // Get default descriptions if not provided
  const getDefaultDescription = () => {
    const defaultDescriptions = {
      "Total Sales": "Total revenue generated from all sales during the selected period. The trend line shows sales over the past 6 months.",
      "Total Profit": "Net profit after deducting all costs from sales. The trend line indicates profit movement over the past 6 months.",
      "Total Orders": "Number of unique orders processed during the selected period. The trend shows order volume over the past 6 months.",
      "Unique Customers": "Count of distinct customers who made purchases. The trend shows customer acquisition over the past 6 months."
    };

    return description || defaultDescriptions[title] || "Key performance indicator tracking business metrics over time.";
  };

  // Determine trend text
  const getTrendText = () => {
    if (change === undefined || change === null) return "Stable";
    if (change > 5) return "Strong upward trend";
    if (change > 0) return "Slight upward trend";
    if (change < -5) return "Strong downward trend";
    if (change < 0) return "Slight downward trend";
    return "Stable";
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md p-4 h-40 hover:shadow-lg transition-shadow cursor-pointer"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between', // Add this line
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className={`p-2 rounded-full`} style={{ backgroundColor: getColorCode(color) + '20' }}>
          {React.cloneElement(icon, { style: { color: getColorCode(color) } })}
        </div>
      </div>

      <div className="mb-2">
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="text-sm">{formatChange(change)}</div>
        )}
      </div>

      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-2" ref={sparklineRef}></div>
      )}
    </div>
  );
};

export default FlippableKPICard;