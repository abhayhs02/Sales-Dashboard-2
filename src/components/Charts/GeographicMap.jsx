import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Papa from 'papaparse';

import GeoMapPieChart from '../GeoMapCharts/GeoMapPieChart';
import GeoMapTable from '../GeoMapCharts/GeoMapTable';
import GeoMapBarChart from '../GeoMapCharts/GeoMapBarChart';
import GeoMapTableGalaryView from '../GeoMapCharts/GeoMapTableGalaryView'; // Import the new component

// Fix for Leaflet marker issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
});

L.Marker.prototype.options.icon = DefaultIcon;

const GeographicMap = () => {
  const [mapData, setMapData] = useState(null);
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('products');
  const [csvData, setCsvData] = useState([]);
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [zoomLevel, setZoomLevel] = useState(2);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const mapRef = useRef(null);
  const [countryCoordinates, setCountryCoordinates] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState(null); // State for selected employee

  const [drillLevel, setDrillLevel] = useState('country');
  const [currentFilter, setCurrentFilter] = useState(null);

  const parseCSVData = (csvText) => {
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(results.errors);
          } else {
            resolve(results.data);
          }
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  };

  const fetchCSVData = async () => {
    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/abhayhs02/Sales-Dashboard-2/refs/heads/main/src/MLDataset.csv'
      );
      const csvText = await response.text();
      const data = await parseCSVData(csvText);
      setCsvData(data);
      console.log('Fetched CSV Data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching or parsing CSV data:', error);
      return null;
    }
  };

  const getColor = (value, minValue, maxValue) => {
    if (value === 0) {
      return '#FFFFFF';
    }

    const percentile = ((value - minValue) / (maxValue - minValue)) * 100;

    if (percentile <= 10) return '#F6BDC0';
    if (percentile <= 35) return '#F1959B';
    if (percentile <= 70) return '#F07470';
    if (percentile <= 85) return '#EA4C46';
    return '#DC1C13';
  };

  const formatTooltipContent = (name, dataPoint, selectedFilter) => {
    let measureName;
    let formattedValue;
    let value = 0;

    if (dataPoint) {
      switch (selectedFilter) {
        case 'products':
          measureName = 'Total Products';
          value = dataPoint.productsValue || 0;
          formattedValue = Math.round(value);
          break;
        case 'employees':
          measureName = 'No of Employees';
          value = dataPoint.employeesValue || 0;
          formattedValue = Math.round(value);
          break;
        case 'inventory':
          measureName = 'Inventory Valuation';
          value = dataPoint.inventoryValue || 0;
          formattedValue = `$${value.toFixed(2)}`;
          break;
        default:
          measureName = 'Value';
          formattedValue = value;
      }
    }

    return `<span class="tooltip-content">
              <div>${name}</div>
              <div>${measureName}: ${formattedValue}</div>
            </span>`;
  };

  const aggregateData = useCallback((data, filter, drill, current) => {
    if (!data) return null;

    const aggregatedData = {};

    data.forEach((item) => {
      const region = item.RegionName || 'Unknown';
      const country = item.CountryName || 'Unknown';
      const state = item.State || 'Unknown';
      const city = item.City || 'Unknown';
      const warehouseName = item.WarehouseName || 'Unknown';
      const postalCode = item.PostalCode || 'Unknown';

      if (current && drill !== 'country' && item[current.type] !== current.name) {
        return;
      }

      let productsValue = item.OrderItemQuantity || 0;
      let employeesValue = 1;
      let inventoryValue = item.ProductStandardCost || 0;

      let locationName;
      let locationType;

      switch (drill) {
        case 'country':
          locationName = country;
          locationType = 'country';
          break;
        case 'state':
          locationName = state;
          locationType = 'state';
          break;
        case 'city':
          locationName = city;
          locationType = 'city';
          break;
        case 'warehouse':
          locationName = warehouseName;
          locationType = 'warehouse';
          break;
        default:
          return;
      }

      if (!aggregatedData[locationName]) {
        aggregatedData[locationName] = {
          name: locationName,
          type: locationType,
          productsValue: 0,
          employeesValue: 0,
          inventoryValue: 0,
        };
      }

      aggregatedData[locationName].productsValue += productsValue;
      aggregatedData[locationName].employeesValue += employeesValue;
      aggregatedData[locationName].inventoryValue += inventoryValue;
    });

    const aggregatedArray = Object.values(aggregatedData);

    console.log('Aggregated Data:', aggregatedArray);
    setMapData(aggregatedArray);
    return aggregatedArray;
  }, []);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
      .then((response) => response.json())
      .then((data) => {
        setGeoJsonData(data);
      })
      .catch((error) => console.error('Error fetching GeoJSON:', error));
  }, []);

  useEffect(() => {
    const fetchDataAndAggregate = async () => {
      const data = await fetchCSVData();
      if (data) {
        aggregateData(data, selectedFilter, drillLevel, currentFilter);
      }
    };

    fetchDataAndAggregate();
  }, [aggregateData, selectedFilter, drillLevel, currentFilter]);

  const handleFilterChange = (event) => {
    setSelectedFilter(event.target.value);
    aggregateData(csvData, event.target.value, drillLevel, currentFilter);
  };

  const handleCountryClick = (countryName) => {
    if (!countryName) return;

    setSelectedCountry(countryName);

    let filteredData;
    switch (selectedFilter) {
      case 'products':
        filteredData = csvData.filter(
          (item) => item.CountryName === countryName
        );
        const categoryData = {};
        filteredData.forEach((item) => {
          const category = item.CategoryName || 'Unknown';
          categoryData[category] = (categoryData[category] || 0) + item.OrderItemQuantity;
        });
        setChartData(
          Object.keys(categoryData).map((key) => ({ name: key, value: categoryData[key] }))
        );
        break;
      case 'employees':
        filteredData = csvData.filter(
          (item) => item.CountryName === countryName
        );
        const employeeData = [];
        filteredData.forEach((item) => {
          if (item.EmployeeName && !employeeData.find(e => e.EmployeeName === item.EmployeeName)) {
            employeeData.push(item); // Store the entire employee object
          }
        });
        setChartData(employeeData);
        break;
      case 'inventory':
        filteredData = csvData.filter(
          (item) => item.CountryName === countryName
        );
        const inventoryData = {};
        filteredData.forEach((item) => {
          const category = item.CategoryName || 'Unknown';
          inventoryData[category] = (inventoryData[category] || 0) + item.ProductStandardCost;
        });
        setChartData(
          Object.keys(inventoryData).map((key) => ({ name: key, value: inventoryData[key] }))
        );
        break;
      default:
        setChartData(null);
    }

    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedEmployee(null); // Also clear selected employee when closing the main popup
  };

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee); // Set the selected employee
  };

  const handleCloseEmployeePopup = () => {
    setSelectedEmployee(null); // Clear the selected employee
  };

  const renderChart = () => {
    if (!showPopup || !selectedCountry || !chartData) return null;

    const popupStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'white',
      padding: '20px',
      boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.5)',
      zIndex: 1001,
      width: selectedFilter === 'employees' ? '90%' : '80%', // Larger width for employees
      maxWidth: selectedFilter === 'employees' ? '800px' : '600px', // Larger max width for employees
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    };

    const backdropStyle = {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
    };

    let chartHeading = "";
    switch (selectedFilter) {
      case 'products':
        chartHeading = `${selectedCountry} - Products distribution over Category`;
        break;
      case 'employees':
        chartHeading = `${selectedCountry} - Employees`;
        break;
      case 'inventory':
        chartHeading = `${selectedCountry} - Category Wise Inventory Valuation($)`;
        break;
      default:
        chartHeading = selectedCountry;
    }

    switch (selectedFilter) {
      case 'products':
        return (
          <div style={backdropStyle}>
            <div className="rounded-lg shadow-md" style={popupStyle}>
              <button
                onClick={closePopup}
                className="absolute top-2 left-2 bg-gray-100 hover:bg-gray-200 rounded-full p-2"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <h2 style={{ fontWeight: 'bold' }}>{chartHeading}</h2>
              <GeoMapPieChart data={chartData} onClose={closePopup} countryName={selectedCountry} />
            </div>
          </div>
        );
      case 'employees':
        return (
          <div style={backdropStyle}>
            <div className="rounded-lg shadow-md" style={popupStyle}>
              <button
                onClick={closePopup}
                className="absolute top-2 left-2 bg-gray-100 hover:bg-gray-200 rounded-full p-2"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <h2 style={{ fontWeight: 'bold' }}>{chartHeading}</h2>
              <GeoMapTable data={chartData}  onEmployeeClick={handleEmployeeClick}/> {/* Pass the click handler */}
            </div>
          </div>
        );
      case 'inventory':
        return (
          <div style={backdropStyle}>
            <div className="rounded-lg shadow-md" style={popupStyle}>
              <button
                onClick={closePopup}
                className="absolute top-2 left-2 bg-gray-100 hover:bg-gray-200 rounded-full p-2"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <h2 style={{ fontWeight: 'bold' }}>{chartHeading}</h2>
              <GeoMapBarChart data={chartData} onClose={closePopup} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const mapContentStyle = {
    transform: 'scaleY(0.8) !important',
    transformOrigin: 'center center !important',
  };

  const bindTooltip = (layer, feature, dataPoint) => {
    layer.bindTooltip(formatTooltipContent(feature.properties.name, dataPoint, selectedFilter), {
      sticky: true,
    });

    layer.on('mouseover', function (e) {
      this.openTooltip();
    });
    layer.on('mouseout', function (e) {
      this.closeTooltip();
    });
    layer.on({
      click: (e) => {
        if (dataPoint) {
          handleCountryClick(feature.properties.name);
        }
        e.target.closePopup();
      },
    });
  };

  const onEachFeature = useCallback(
    (feature, layer) => {
      const featureName = feature.properties.name;
      const dataPoint = mapData
        ? mapData.find((item) => item.name === featureName)
        : null;

      // Add the layer to the map *before* calculating the centroid
    if (mapRef.current) { // Ensure mapRef.current is available
      layer.addTo(mapRef.current);
    }

      if (dataPoint) {
        bindTooltip(layer, feature, dataPoint);
      }
    },
    [mapData, selectedFilter]
  );

  useEffect(() => {
    if (!geoJsonData || !mapData || !mapRef.current) return;

    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.GeoJSON) {
        mapRef.current.removeLayer(layer);
      }
    });

    const geoJsonLayer = L.geoJSON(geoJsonData, {
      style: (feature) => {
        const featureName = feature.properties.name;
        const dataPoint = mapData
          ? mapData.find((item) => item.name === featureName)
          : null;

        let value = 0;
        if (dataPoint) {
          switch (selectedFilter) {
            case 'products':
              value = dataPoint.productsValue || 0;
              break;
            case 'employees':
              value = dataPoint.employeesValue || 0;
              break;
            case 'inventory':
              value = dataPoint.inventoryValue || 0;
              break;
            default:
              value = 0;
          }
        }

        const minValue = mapData
          ? Math.min(...mapData.map((item) => {
            switch (selectedFilter) {
              case 'products':
                return item.productsValue || 0;
              case 'employees':
                return item.employeesValue || 0;
              case 'inventory':
                return item.inventoryValue || 0;
              default:
                return 0;
            }
          }))
          : 0;
        const maxValue = mapData
          ? Math.max(...mapData.map((item) => {
            switch (selectedFilter) {
              case 'products':
                return item.productsValue || 0;
              case 'employees':
                return item.employeesValue || 0;
              case 'inventory':
                return item.inventoryValue || 0;
              default:
                return 0;
            }
          }))
          : 0;
        const fillColor = getColor(value, minValue, maxValue);

        return {
          fillColor: fillColor,
          weight: 1,
          opacity: 1,
          color: 'gray',
          fillOpacity: 0.7,
        };
      },
      onEachFeature: onEachFeature,
    });

    geoJsonLayer.addTo(mapRef.current);
  }, [geoJsonData, mapData, selectedFilter, onEachFeature]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Dropdown Filter */}
      <select
        value={selectedFilter}
        onChange={handleFilterChange}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          padding: '8px',
          fontSize: '14px',
        }}
      >
        <option value="products">Products</option>
        <option value="employees">Employees</option>
        <option value="inventory">Inventory</option>
      </select>

      {/* Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={zoomLevel}
        style={{
          width: '100%',
          height: '500px',
        }}
        zoomControl={false}
        dragging={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        touchZoom={false}
        ref={mapRef}
      >
        <TileLayer
          url="https://tile.openstreetmap.de/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          noWrap={true}
        />
      </MapContainer>
      {renderChart()}

      {/* Employee Gallery Popup */}
      {selectedEmployee && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1002, // Higher z-index than the main popup
          }}
        >
          <GeoMapTableGalaryView employee={selectedEmployee} onClose={handleCloseEmployeePopup} />
        </div>
      )}
    </div>
  );
};

export default GeographicMap;