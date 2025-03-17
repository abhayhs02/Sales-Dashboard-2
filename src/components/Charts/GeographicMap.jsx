import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Papa from 'papaparse'; // Keep the import even if it's causing errors

import GeoMapPieChart from '../GeoMapCharts/GeoMapPieChart';
import GeoMapTable from '../GeoMapCharts/GeoMapTable';
import GeoMapBarChart from '../GeoMapCharts/GeoMapBarChart';
import GeoMapTableGalaryView from '../GeoMapCharts/GeoMapTableGalaryView';

import './GeographicMap.css'; // Import the CSS file
import { DataContext } from '../../context/DataContext'; // Import DataContext

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
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [drillLevel, setDrillLevel] = useState('country');
  const [currentFilter, setCurrentFilter] = useState(null);

  const { isDarkMode } = useContext(DataContext); // Access isDarkMode from DataContext

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
            employeeData.push(item);
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
    setSelectedEmployee(null);
  };

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleCloseEmployeePopup = () => {
    setSelectedEmployee(null);
  };

  const renderChart = () => {
    if (!showPopup || !selectedCountry || !chartData) return null;

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

    let popupContent;
    switch (selectedFilter) {
      case 'products':
        popupContent = <GeoMapPieChart data={chartData} onClose={closePopup} countryName={selectedCountry} />;
        break;
      case 'employees':
        popupContent = <GeoMapTable data={chartData} onEmployeeClick={handleEmployeeClick} />;
        break;
      case 'inventory':
        popupContent = <GeoMapBarChart data={chartData} onClose={closePopup} />;
        break;
      default:
        popupContent = null;
    }

    return (
      <div className={`popup-backdrop ${isDarkMode ? 'dark' : ''}`}>
        <div className={`popup-container rounded-lg shadow-md ${isDarkMode ? 'dark' : ''}`}>
          <div className="popup-header">
            <button
              onClick={closePopup}
              className={`popup-close-button ${isDarkMode ? 'dark' : ''}`}
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
            <h2 className="popup-heading">{chartHeading}</h2>
          </div>
          {popupContent}
        </div>
      </div>
    );
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
    <div className={`geographic-map-container ${isDarkMode ? 'dark' : ''}`}>
      {/* Enhanced Dropdown Filter */}
      <div className="filter-container">
        <select
          value={selectedFilter}
          onChange={handleFilterChange}
          className={`filter-select ${isDarkMode ? 'dark' : ''}`}
        >
          <option value="products">Products</option>
          <option value="employees">Employees</option>
          <option value="inventory">Inventory</option>
        </select>
      </div>

      {/* Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={zoomLevel}
        className="map-container"
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
        <div className="employee-gallery-backdrop">
          <GeoMapTableGalaryView employee={selectedEmployee} onClose={handleCloseEmployeePopup} />
        </div>
      )}
    </div>
  );
};

export default GeographicMap;