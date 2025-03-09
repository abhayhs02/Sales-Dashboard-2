import React, { useMemo, useState } from 'react';
import FlippableKPICard from './KPICard';
import { FiDollarSign, FiShoppingBag, FiPackage, FiUsers, FiX } from 'react-icons/fi';

const KPISection = ({ data }) => {
  const [selectedKPI, setSelectedKPI] = useState(null);
  
  // Memoized KPI calculations
  const kpiData = useMemo(() => {
    if (!data || !data.length) {
      return {
        totalSales: 0,
        totalProfit: 0,
        totalOrders: 0,
        uniqueCustomers: 0
      };
    }

    // Calculate total sales
    const totalSales = data.reduce((sum, item) => 
      sum + ((item.OrderItemQuantity || 0) * (item.PerUnitPrice || 0)), 0);
    
    // Calculate total profit
    const totalProfit = data.reduce((sum, item) => 
      sum + (item.Profit || 0), 0);
    
    // Calculate unique orders (by customer + date combination)
    const orderSet = new Set();
    data.forEach(item => {
      if (item.OrderDate && item.CustomerName) {
        orderSet.add(`${item.OrderDate}_${item.CustomerName}`);
      }
    });
    const totalOrders = orderSet.size;
    
    // Calculate unique customers
    const uniqueCustomers = new Set(
      data.map(item => item.CustomerName).filter(Boolean)
    ).size;
    
    // Calculate monthly data for sparklines (last 6 months)
    const monthlyData = {};
    
    data.forEach(item => {
      if (!item.OrderDate) return;
      
      const date = new Date(item.OrderDate);
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          sales: 0,
          profit: 0,
          orders: new Set(),
          customers: new Set()
        };
      }
      
      const monthData = monthlyData[monthYear];
      monthData.sales += (item.OrderItemQuantity || 0) * (item.PerUnitPrice || 0);
      monthData.profit += item.Profit || 0;
      
      if (item.CustomerName) {
        monthData.orders.add(`${item.OrderDate}_${item.CustomerName}`);
        monthData.customers.add(item.CustomerName);
      }
    });
    
    // Convert to arrays for sparklines
    const months = Object.keys(monthlyData).sort();
    const lastSixMonths = months.slice(-6);
    
    const sparklineData = {
      sales: lastSixMonths.map(month => monthlyData[month].sales),
      profit: lastSixMonths.map(month => monthlyData[month].profit),
      orders: lastSixMonths.map(month => monthlyData[month].orders.size),
      customers: lastSixMonths.map(month => monthlyData[month].customers.size)
    };
    
    // Calculate changes (comparing last month to previous month)
    const calcChange = (data) => {
      if (data.length < 2) return 0;
      const last = data[data.length - 1];
      const previous = data[data.length - 2];
      return previous ? ((last - previous) / previous) * 100 : 0;
    };
    
    return {
      totalSales,
      totalProfit,
      totalOrders,
      uniqueCustomers,
      sparklineData,
      changes: {
        sales: calcChange(sparklineData.sales),
        profit: calcChange(sparklineData.profit),
        orders: calcChange(sparklineData.orders),
        customers: calcChange(sparklineData.customers)
      }
    };
  }, [data]);

  // KPI descriptions
  const kpiDescriptions = {
    "Total Sales": "The total monetary value of all products sold in the selected period. This KPI shows the revenue generated before any deductions or costs. The upward or downward trend indicates whether sales are growing or declining compared to the previous period.",
    
    "Total Profit": "The net earnings after all costs have been deducted from sales revenue. This KPI measures the actual financial gain of the business. A positive trend indicates improving profit margins and business health.",
    
    "Total Orders": "The count of unique customer transactions processed within the selected period. This KPI helps track sales activity volume independent of monetary value. The trend shows whether customer purchasing frequency is increasing or decreasing.",
    
    "Unique Customers": "The number of individual customers who made at least one purchase during the selected period. This KPI helps track customer acquisition and retention. An upward trend indicates successful customer acquisition efforts."
  };

  // Card click handler to show modal
  const handleCardClick = (kpiName) => {
    setSelectedKPI(kpiName);
  };

  // Close modal
  const closeModal = () => {
    setSelectedKPI(null);
  };

  // Determine trend text
  const getTrendText = (change) => {
    if (change === undefined || change === null) return "Stable";
    if (change > 5) return "Strong upward trend";
    if (change > 0) return "Slight upward trend";
    if (change < -5) return "Strong downward trend";
    if (change < 0) return "Slight downward trend";
    return "Stable";
  };

  // Modal content based on selected KPI
  const renderModalContent = () => {
    if (!selectedKPI) return null;

    let value, change, color, icon, sparklineData;
    
    switch (selectedKPI) {
      case "Total Sales":
        value = `$${kpiData.totalSales.toLocaleString()}`;
        change = kpiData.changes.sales;
        color = 'blue';
        icon = <FiDollarSign size={20} style={{ color: '#4f46e5' }} />;
        sparklineData = kpiData.sparklineData.sales;
        break;
      case "Total Profit":
        value = `$${kpiData.totalProfit.toLocaleString()}`;
        change = kpiData.changes.profit;
        color = 'green';
        icon = <FiDollarSign size={20} style={{ color: '#10b981' }} />;
        sparklineData = kpiData.sparklineData.profit;
        break;
      case "Total Orders":
        value = kpiData.totalOrders.toLocaleString();
        change = kpiData.changes.orders;
        color = 'purple';
        icon = <FiShoppingBag size={20} style={{ color: '#8b5cf6' }} />;
        sparklineData = kpiData.sparklineData.orders;
        break;
      case "Unique Customers":
        value = kpiData.uniqueCustomers.toLocaleString();
        change = kpiData.changes.customers;
        color = 'orange';
        icon = <FiUsers size={20} style={{ color: '#f97316' }} />;
        sparklineData = kpiData.sparklineData.customers;
        break;
      default:
        return null;
    }

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

    const colorCode = getColorCode(color);
    
    return (
      <div className="bg-white rounded-lg p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full mr-3" style={{ backgroundColor: `${colorCode}20` }}>
              {icon}
            </div>
            <h3 className="text-xl font-bold">{selectedKPI}</h3>
          </div>
          <button 
            onClick={closeModal} 
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600">
            {kpiDescriptions[selectedKPI]}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-500">Current Value</div>
            <div className="text-xl font-bold">{value}</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-500">Change</div>
            <div className={`text-xl font-bold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-500">Trend</div>
            <div className="text-lg">{getTrendText(change)}</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-500">Period</div>
            <div className="text-lg">Last 6 months</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div onClick={() => handleCardClick("Total Sales")}>
          <FlippableKPICard
            title="Total Sales"
            value={`$${kpiData.totalSales.toLocaleString()}`}
            icon={<FiDollarSign size={20} className="text-blue-600" />}
            change={kpiData.changes.sales}
            sparklineData={kpiData.sparklineData.sales}
            color="blue"
          />
        </div>
        
        <div onClick={() => handleCardClick("Total Profit")}>
          <FlippableKPICard
            title="Total Profit"
            value={`$${kpiData.totalProfit.toLocaleString()}`}
            icon={<FiDollarSign size={20} className="text-green-600" />}
            change={kpiData.changes.profit}
            sparklineData={kpiData.sparklineData.profit}
            color="green"
          />
        </div>
        
        <div onClick={() => handleCardClick("Total Orders")}>
          <FlippableKPICard
            title="Total Orders"
            value={kpiData.totalOrders.toLocaleString()}
            icon={<FiShoppingBag size={20} className="text-purple-600" />}
            change={kpiData.changes.orders}
            sparklineData={kpiData.sparklineData.orders}
            color="purple"
          />
        </div>
        
        <div onClick={() => handleCardClick("Unique Customers")}>
          <FlippableKPICard
            title="Unique Customers"
            value={kpiData.uniqueCustomers.toLocaleString()}
            icon={<FiUsers size={20} className="text-orange-600" />}
            change={kpiData.changes.customers}
            sparklineData={kpiData.sparklineData.customers}
            color="orange"
          />
        </div>
      </div>

      {/* Modal */}
      {selectedKPI && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative" onClick={e => e.stopPropagation()}>
            {renderModalContent()}
          </div>
        </div>
      )}
    </>
  );
};

export default KPISection;