import React, { useMemo } from 'react';
import KPICard from './KPICard';
import { FiDollarSign, FiShoppingBag, FiPackage, FiUsers } from 'react-icons/fi';

const KPISection = ({ data }) => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPICard
        title="Total Sales"
        value={`$${kpiData.totalSales.toLocaleString()}`}
        icon={<FiDollarSign size={20} className="text-blue-600" />}
        change={kpiData.changes.sales}
        sparklineData={kpiData.sparklineData.sales}
        color="blue"
      />
      
      <KPICard
        title="Total Profit"
        value={`$${kpiData.totalProfit.toLocaleString()}`}
        icon={<FiDollarSign size={20} className="text-green-600" />}
        change={kpiData.changes.profit}
        sparklineData={kpiData.sparklineData.profit}
        color="green"
      />
      
      <KPICard
        title="Total Orders"
        value={kpiData.totalOrders.toLocaleString()}
        icon={<FiShoppingBag size={20} className="text-purple-600" />}
        change={kpiData.changes.orders}
        sparklineData={kpiData.sparklineData.orders}
        color="purple"
      />
      
      <KPICard
        title="Unique Customers"
        value={kpiData.uniqueCustomers.toLocaleString()}
        icon={<FiUsers size={20} className="text-orange-600" />}
        change={kpiData.changes.customers}
        sparklineData={kpiData.sparklineData.customers}
        color="orange"
      />
    </div>
  );
};

export default KPISection;