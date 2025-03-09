import React, { useContext, useState } from 'react';
import { DataContext } from '../context/DataContext';
import KPISection from './KPIs/KPISection';
import ChartSection from './Charts/ChartSection';
import ImprovedLineChart from './Charts/LineChart';
import DataTable from './Tables/DataTable';

const DashboardView = () => {
  const { data } = useContext(DataContext);
  const [activeTab1, setActiveTab1] = useState('monthly');
  const [activeTab2, setActiveTab2] = useState('categories');
  const [activeTab3, setActiveTab3] = useState('geo');
  
  return (
    <div className="space-y-6">
      {/* First Row: KPI Cards */}
      <div className="w-full">
        <KPISection data={data} />
      </div>
      
      {/* Second Row: Line Chart (Full Width) */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b">
          <button
            className={`py-3 px-6 ${activeTab1 === 'monthly' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab1('monthly')}
          >
            Monthly Trends
          </button>
          <button
            className={`py-3 px-6 ${activeTab1 === 'weekly' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab1('weekly')}
          >
            Weekly Details
          </button>
        </div>
        <div className="p-4 h-80">
          <ImprovedLineChart data={data} timeFrame={activeTab1} />
        </div>
      </div>
      
      {/* Third Row: Bar Chart and Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b">
            <button
              className={`py-3 px-6 ${activeTab2 === 'categories' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab2('categories')}
            >
              By Category
            </button>
            <button
              className={`py-3 px-6 ${activeTab2 === 'products' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab2('products')}
            >
              Top Products
            </button>
          </div>
          <div className="p-4 h-80">
            <ChartSection.BarChart data={data} type={activeTab2} />
          </div>
        </div>
        
        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-medium mb-4">Category Distribution</h2>
          <div className="h-80">
            <ChartSection.PieChart data={data} />
          </div>
        </div>
      </div>
      
      {/* Fourth Row: Geographic/Network/Hierarchy Visualization (Full Width) */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b">
          <button
            className={`py-3 px-6 ${activeTab3 === 'geo' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab3('geo')}
          >
            Geographic
          </button>
          <button
            className={`py-3 px-6 ${activeTab3 === 'network' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab3('network')}
          >
            Network
          </button>
          <button
            className={`py-3 px-6 ${activeTab3 === 'sunburst' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab3('sunburst')}
          >
            Hierarchy
          </button>
        </div>
        <div className="p-4 h-[420px]"> {/* Taller height for complex visualizations */}
          {activeTab3 === 'geo' && <ChartSection.GeoMap data={data} />}
          {activeTab3 === 'network' && <ChartSection.ForceGraph data={data} />}
          {activeTab3 === 'sunburst' && <ChartSection.SunburstChart data={data} />}
        </div>
      </div>
      
      {/* Fifth Row: Data Table */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-medium mb-4">Recent Orders</h2>
        <DataTable data={data} />
      </div>
    </div>
  );
};

export default DashboardView;