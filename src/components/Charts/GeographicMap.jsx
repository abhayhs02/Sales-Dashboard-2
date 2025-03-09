import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';

const GeographicMap = ({ data }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [worldData, setWorldData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('world'); // 'world', 'region', 'country'
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [zoomTransform, setZoomTransform] = useState(null);
  
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
  
  // Load world map data
  useEffect(() => {
    setLoading(true);
    
    // Load world TopoJSON data
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(response => response.json())
      .then(topology => {
        const countries = feature(topology, topology.objects.countries);
        
        // Load country names dataset
        fetch('https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/slim-2/slim-2.json')
          .then(response => response.json())
          .then(countryNames => {
            // Combine the geojson with country names
            const countriesWithNames = countries.features.map(country => {
              const match = countryNames.find(c => c['country-code'] === country.id.toString());
              return {
                ...country,
                properties: {
                  ...country.properties,
                  name: match ? match.name : 'Unknown',
                  region: match ? match.region : 'Unknown',
                  'sub-region': match ? match['sub-region'] : 'Unknown'
                }
              };
            });
            
            setWorldData({ 
              ...countries, 
              features: countriesWithNames 
            });
            setLoading(false);
          })
          .catch(error => {
            console.error('Error loading country names:', error);
            setError('Failed to load country names');
            setLoading(false);
          });
      })
      .catch(error => {
        console.error('Error loading world map data:', error);
        setError('Failed to load world map data');
        setLoading(false);
      });
  }, []);
  
  // Process data for the map
  const mapData = React.useMemo(() => {
    if (!data || !data.length) return {};
    
    // Aggregate data by region and country
    const regionMap = {};
    const countryMap = {};
    const stateMap = {};
    const cityMap = {};
    
    data.forEach(item => {
      const region = item.RegionName || 'Unknown';
      const country = item.CountryName || 'Unknown';
      const state = item.State || 'Unknown';
      const city = item.City || 'Unknown';
      const salesValue = (item.OrderItemQuantity || 0) * (item.PerUnitPrice || 0);
      
      // Aggregate by region
      if (!regionMap[region]) {
        regionMap[region] = { 
          region, 
          sales: 0, 
          orders: 0,
          profit: 0,
          countries: new Set() 
        };
      }
      regionMap[region].sales += salesValue;
      regionMap[region].profit += (item.Profit || 0);
      regionMap[region].orders += 1;
      regionMap[region].countries.add(country);
      
      // Aggregate by country
      const countryKey = `${region}-${country}`;
      if (!countryMap[countryKey]) {
        countryMap[countryKey] = { 
          region, 
          country, 
          sales: 0, 
          orders: 0,
          profit: 0,
          states: new Set() 
        };
      }
      countryMap[countryKey].sales += salesValue;
      countryMap[countryKey].profit += (item.Profit || 0);
      countryMap[countryKey].orders += 1;
      countryMap[countryKey].states.add(state);
      
      // Aggregate by state
      const stateKey = `${region}-${country}-${state}`;
      if (!stateMap[stateKey]) {
        stateMap[stateKey] = { 
          region, 
          country, 
          state, 
          sales: 0, 
          orders: 0,
          profit: 0,
          cities: new Set() 
        };
      }
      stateMap[stateKey].sales += salesValue;
      stateMap[stateKey].profit += (item.Profit || 0);
      stateMap[stateKey].orders += 1;
      stateMap[stateKey].cities.add(city);
      
      // Aggregate by city
      const cityKey = `${region}-${country}-${state}-${city}`;
      if (!cityMap[cityKey]) {
        cityMap[cityKey] = { 
          region, 
          country, 
          state, 
          city, 
          sales: 0, 
          orders: 0,
          profit: 0 
        };
      }
      cityMap[cityKey].sales += salesValue;
      cityMap[cityKey].profit += (item.Profit || 0);
      cityMap[cityKey].orders += 1;
    });
    
    // Convert Sets to arrays and sort by sales
    Object.values(regionMap).forEach(region => {
      region.countries = Array.from(region.countries);
      region.countryCount = region.countries.length;
    });
    
    Object.values(countryMap).forEach(country => {
      country.states = Array.from(country.states);
      country.stateCount = country.states.length;
    });
    
    Object.values(stateMap).forEach(state => {
      state.cities = Array.from(state.cities);
      state.cityCount = state.cities.length;
    });
    
    return {
      regions: Object.values(regionMap).sort((a, b) => b.sales - a.sales),
      countries: Object.values(countryMap).sort((a, b) => b.sales - a.sales),
      states: Object.values(stateMap).sort((a, b) => b.sales - a.sales),
      cities: Object.values(cityMap).sort((a, b) => b.sales - a.sales)
    };
  }, [data]);
  
  // Draw the map when data and world data are available
  useEffect(() => {
    if (!svgRef.current || !worldData || !mapData.regions || !dimensions.width || !dimensions.height) return;
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();
    
    const { width, height } = dimensions;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
    
    // Create a group for the map
    const mapGroup = svg.append("g");
    
    // Define the projection
    const projection = d3.geoMercator()
      .fitSize([width, height], worldData);
    
    // Define the path generator
    const pathGenerator = d3.geoPath().projection(projection);
    
    // Create the zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        mapGroup.attr("transform", event.transform);
        setZoomTransform(event.transform);
      });
    
    // Apply zoom to the SVG
    svg.call(zoom);
    
    // Reset zoom if view mode changed
    if (zoomTransform) {
      svg.call(zoom.transform, zoomTransform);
    } else {
      // Reset zoom
      svg.call(zoom.transform, d3.zoomIdentity);
    }
    
    // Create color scale for regions/countries based on sales
    let colorDomain, colorRange;
    
    if (viewMode === 'world') {
      // For world view, colorize by region
      const regions = new Set(worldData.features.map(d => d.properties.region));
      colorDomain = Array.from(regions);
      colorRange = d3.schemeCategory10.slice(0, colorDomain.length);
    } else {
      // For region/country view, colorize by sales amount
      const salesValues = viewMode === 'region' 
        ? mapData.countries.filter(c => c.region === selectedRegion).map(c => c.sales)
        : mapData.states.filter(s => s.country === selectedCountry).map(s => s.sales);
      
      colorDomain = [d3.min(salesValues) || 0, d3.max(salesValues) || 100000];
      colorRange = ["#e0f2ff", "#0a58ca"]; // Light blue to dark blue
    }
    
    const colorScale = viewMode === 'world'
      ? d3.scaleOrdinal().domain(colorDomain).range(colorRange)
      : d3.scaleSequential(d3.interpolateBlues).domain([0, d3.max(colorDomain)]);
    
    // Draw the base world map
    mapGroup.selectAll(".country")
      .data(worldData.features)
      .enter()
      .append("path")
      .attr("class", "country")
      .attr("d", pathGenerator)
      .attr("fill", d => {
        if (viewMode === 'world') {
          return colorScale(d.properties.region);
        } else if (viewMode === 'region') {
          // Only highlight countries in the selected region
          if (d.properties.region === selectedRegion) {
            // Find the country in our data
            const country = mapData.countries.find(c => 
              c.country === d.properties.name && c.region === selectedRegion);
            return country ? colorScale(country.sales) : "#eee";
          }
          return "#eee"; // Gray for non-selected regions
        } else {
          // In country view, only highlight the selected country
          return d.properties.name === selectedCountry ? "#2563eb" : "#eee";
        }
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0.7)
      .attr("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .attr("stroke-width", 1.5)
          .attr("stroke", "#000");
          
        // Show tooltip
        const [x, y] = d3.pointer(event);
        
        let tooltipContent = '';
        
        if (viewMode === 'world') {
          const regionData = mapData.regions.find(r => r.region === d.properties.region);
          
          tooltipContent = `
            <div class="font-bold text-lg">${d.properties.region || 'Unknown'}</div>
            <div class="text-gray-600">${d.properties.name}</div>
            ${regionData ? `
              <div class="mt-2">
                <div class="text-blue-600">Sales: $${regionData.sales.toLocaleString()}</div>
                <div class="text-green-600">Profit: $${regionData.profit.toLocaleString()}</div>
                <div class="text-gray-600">Orders: ${regionData.orders.toLocaleString()}</div>
                <div class="text-gray-600">Countries: ${regionData.countryCount}</div>
              </div>
            ` : '<div class="text-gray-600 mt-2">No sales data available</div>'}
            <div class="mt-2 text-xs text-blue-600">Click to zoom in</div>
          `;
        } else if (viewMode === 'region') {
          const countryData = mapData.countries.find(c => 
            c.country === d.properties.name && c.region === selectedRegion);
            
          tooltipContent = `
            <div class="font-bold text-lg">${d.properties.name || 'Unknown'}</div>
            <div class="text-gray-600">${d.properties['sub-region'] || ''}</div>
            ${countryData ? `
              <div class="mt-2">
                <div class="text-blue-600">Sales: $${countryData.sales.toLocaleString()}</div>
                <div class="text-green-600">Profit: $${countryData.profit.toLocaleString()}</div>
                <div class="text-gray-600">Orders: ${countryData.orders.toLocaleString()}</div>
                <div class="text-gray-600">States: ${countryData.stateCount}</div>
              </div>
            ` : '<div class="text-gray-600 mt-2">No sales data available</div>'}
            <div class="mt-2 text-xs text-blue-600">Click to zoom in</div>
          `;
        }
        
        d3.select(containerRef.current)
          .append("div")
          .attr("class", "map-tooltip")
          .style("position", "absolute")
          .style("left", `${x + 10}px`)
          .style("top", `${y + 10}px`)
          .style("background", "white")
          .style("padding", "8px 12px")
          .style("border-radius", "4px")
          .style("box-shadow", "0 2px 10px rgba(0,0,0,0.1)")
          .style("z-index", "10")
          .style("pointer-events", "none")
          .html(tooltipContent);
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr("stroke-width", 0.5)
          .attr("stroke", "#fff");
          
        // Remove tooltip
        d3.select(containerRef.current)
          .selectAll(".map-tooltip")
          .remove();
      })
      .on("click", function(event, d) {
        if (viewMode === 'world') {
          // Zoom to region
          setSelectedRegion(d.properties.region);
          setViewMode('region');
          setZoomTransform(null); // Reset zoom
        } else if (viewMode === 'region' && d.properties.region === selectedRegion) {
          // Zoom to country
          setSelectedCountry(d.properties.name);
          setViewMode('country');
          setZoomTransform(null); // Reset zoom
          
          // Zoom to the selected country
          const bounds = pathGenerator.bounds(d);
          const dx = bounds[1][0] - bounds[0][0];
          const dy = bounds[1][1] - bounds[0][1];
          const x = (bounds[0][0] + bounds[1][0]) / 2;
          const y = (bounds[0][1] + bounds[1][1]) / 2;
          const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)));
          const translate = [width / 2 - scale * x, height / 2 - scale * y];
          
          svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
          );
        }
      });
    
    // Add labels for regions or countries based on view mode
    if (viewMode === 'world') {
      // Add region labels (only if enough space)
      mapGroup.selectAll(".region-label")
        .data(Array.from(new Set(worldData.features.map(d => d.properties.region)))
          .filter(region => region && region !== 'Unknown'))
        .enter()
        .append("text")
        .attr("class", "region-label")
        .attr("transform", d => {
          // Find centroid of all countries in the region
          const countries = worldData.features.filter(f => f.properties.region === d);
          if (countries.length === 0) return "translate(0,0)";
          
          // Calculate the centroid of the first country in each region as an approximation
          const centroid = pathGenerator.centroid(countries[0]);
          return `translate(${centroid[0]}, ${centroid[1]})`;
        })
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("fill", "#333")
        .attr("stroke", "white")
        .attr("stroke-width", 3)
        .attr("stroke-linejoin", "round")
        .attr("paint-order", "stroke")
        .text(d => d);
    } else if (viewMode === 'region') {
      // Add country labels for the selected region
      const countriesInRegion = worldData.features
        .filter(d => d.properties.region === selectedRegion);
        
      mapGroup.selectAll(".country-label")
        .data(countriesInRegion)
        .enter()
        .append("text")
        .attr("class", "country-label")
        .attr("transform", d => {
          const centroid = pathGenerator.centroid(d);
          return `translate(${centroid[0]}, ${centroid[1]})`;
        })
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#333")
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .attr("stroke-linejoin", "round")
        .attr("paint-order", "stroke")
        .text(d => d.properties.name);
    }
    
    // Add back button if we're not at the world view
    if (viewMode !== 'world') {
      svg.append("g")
        .attr("class", "back-button")
        .attr("transform", `translate(20, 20)`)
        .append("rect")
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("width", 100)
        .attr("height", 30)
        .attr("fill", "#4f46e5")
        .attr("cursor", "pointer")
        .on("click", () => {
          if (viewMode === 'country') {
            setViewMode('region');
            setSelectedCountry(null);
          } else {
            setViewMode('world');
            setSelectedRegion(null);
          }
          setZoomTransform(null);
        });
      
      svg.select(".back-button")
        .append("text")
        .attr("x", 50)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "12px")
        .text("← Back")
        .attr("cursor", "pointer");
    }
    
    // Add legend
    if (viewMode === 'world') {
      // Categorical legend for regions
      const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 150}, 20)`);
      
      const regions = Array.from(new Set(worldData.features.map(d => d.properties.region)))
        .filter(region => region && region !== 'Unknown')
        .sort();
      
      regions.forEach((region, i) => {
        const legendRow = legend.append("g")
          .attr("transform", `translate(0, ${i * 20})`);
        
        legendRow.append("rect")
          .attr("width", 15)
          .attr("height", 15)
          .attr("fill", colorScale(region));
        
        legendRow.append("text")
          .attr("x", 20)
          .attr("y", 12)
          .attr("font-size", "10px")
          .text(region);
      });
    } else {
      // Continuous color legend
      const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 150}, 20)`);
      
      // Create gradient
      const defs = svg.append("defs");
      const gradient = defs.append("linearGradient")
        .attr("id", "sales-gradient")
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "0%")
        .attr("y2", "0%");
      
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorRange[0]);
      
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorRange[1]);
      
      // Draw the gradient rectangle
      legend.append("rect")
        .attr("width", 20)
        .attr("height", 150)
        .attr("fill", "url(#sales-gradient)");
      
      // Add scale ticks
      const scale = d3.scaleLinear()
        .domain([0, d3.max(colorDomain)])
        .range([150, 0]);
      
      const axis = d3.axisRight(scale)
        .ticks(5)
        .tickFormat(d => d >= 1000000 ? `$${d/1000000}M` : d >= 1000 ? `$${d/1000}K` : `$${d}`);
      
      legend.append("g")
        .attr("transform", "translate(20, 0)")
        .call(axis);
      
      // Add legend title
      legend.append("text")
        .attr("x", 10)
        .attr("y", -5)
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .text("Sales");
    }
    
    // If we're in country view, add state bubbles if available
    if (viewMode === 'country') {
      const countryStates = mapData.states.filter(s => s.country === selectedCountry);
      
      if (countryStates.length > 0) {
        // We don't have exact state coordinates, so we'll create a grid layout
        const rows = Math.ceil(Math.sqrt(countryStates.length));
        const cols = Math.ceil(countryStates.length / rows);
        const cellWidth = width / (cols + 1);
        const cellHeight = height / (rows + 2);
        
        // Find max sales for scaling
        const maxStateSales = d3.max(countryStates, d => d.sales);
        
        // Create scale for bubble size
        const bubbleScale = d3.scaleSqrt()
          .domain([0, maxStateSales])
          .range([5, 40]);
        
        // Create state bubbles
        const stateBubbles = mapGroup.selectAll(".state-bubble")
          .data(countryStates)
          .enter()
          .append("g")
          .attr("class", "state-bubble")
          .attr("transform", (d, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            return `translate(${(col + 0.5) * cellWidth}, ${(row + 1) * cellHeight})`;
          });
        
        // Add circles
        stateBubbles.append("circle")
          .attr("r", d => bubbleScale(d.sales))
          .attr("fill", d => d3.interpolateBlues(d.sales / maxStateSales))
          .attr("stroke", "#fff")
          .attr("stroke-width", 1)
          .attr("opacity", 0.8);
        
        // Add state labels
        stateBubbles.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", 4)
          .attr("font-size", "10px")
          .attr("fill", "#333")
          .text(d => d.state);
        
        // Add title
        svg.append("text")
          .attr("x", width / 2)
          .attr("y", 40)
          .attr("text-anchor", "middle")
          .attr("font-size", "16px")
          .attr("font-weight", "bold")
          .text(`States in ${selectedCountry}`);
      }
    }
    
    // Add title based on view mode
    const title = svg.append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "bold");
    
    if (viewMode === 'world') {
      title.text("World Sales Distribution");
    } else if (viewMode === 'region') {
      title.text(`${selectedRegion} Region`);
    } else if (viewMode === 'country') {
      title.text(`${selectedCountry}`);
    }
    
  }, [worldData, mapData, dimensions, viewMode, selectedRegion, selectedCountry, zoomTransform]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded">
        <div className="text-center p-4">
          <div className="text-gray-500 mb-2">Loading Geographic Data...</div>
          <div className="w-12 h-12 border-4 border-t-indigo-500 border-gray-200 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded">
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">Error: {error}</div>
          <div className="text-sm text-gray-400">
            Could not load geographic data. Please try again later.
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full"></svg>
      
      {/* Additional info panel */}
      {viewMode !== 'world' && (
        <div className="absolute top-16 right-4 bg-white shadow-md rounded-md p-4 max-w-xs">
          <h3 className="font-bold text-lg mb-2">
            {viewMode === 'region' ? selectedRegion : selectedCountry}
          </h3>
          <div className="text-sm">
            {viewMode === 'region' && (
              <div>
                <div className="mb-1">
                  Countries: {mapData.countries.filter(c => c.region === selectedRegion).length}
                </div>
                <div className="mb-1">
                  Total Sales: ${mapData.countries
                    .filter(c => c.region === selectedRegion)
                    .reduce((sum, c) => sum + c.sales, 0).toLocaleString()}
                </div>
                <div>
                  Click on a country to explore states and cities.
                </div>
              </div>
            )}
            
            {viewMode === 'country' && (
              <div>
                <div className="mb-1">
                  States: {mapData.states.filter(s => s.country === selectedCountry).length}
                </div>
                <div className="mb-1">
                  Cities: {mapData.cities.filter(c => c.country === selectedCountry).length}
                </div>
                <div className="mb-1">
                  Total Sales: ${mapData.states
                    .filter(s => s.country === selectedCountry)
                    .reduce((sum, s) => sum + s.sales, 0).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GeographicMap;