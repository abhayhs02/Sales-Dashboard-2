import React, { useContext, useState } from 'react';
import { DataContext } from '../context/DataContext';
import KPISection from './KPIs/KPISection';
import ChartSection from './Charts/ChartSection';
import DataTable from './Tables/DataTable';

const DashboardView = () => {
  const { data } = useContext(DataContext);
  const [activeTab1, setActiveTab1] = useState('monthly');
  const [activeTab2, setActiveTab2] = useState('categories');
  const [activeTab3, setActiveTab3] = useState('geo');
  
  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <KPISection data={data} />
      
      {/* First Row of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart Card */}
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
            <ChartSection.LineChart data={data} timeFrame={activeTab1} />
          </div>
        </div>
        
        {/* Bar Chart Card */}
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
      </div>
      
      {/* Second Row of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-medium mb-4">Category Distribution</h2>
          <div className="h-64">
            <ChartSection.PieChart data={data} />
          </div>
        </div>
        
        {/* Geographic Map / Network Graph */}
        <div className="bg-white rounded-lg shadow-md lg:col-span-2 overflow-hidden">
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
          <div className="p-4 h-64">
            {activeTab3 === 'geo' && <ChartSection.GeoMap data={data} />}
            {activeTab3 === 'network' && <ChartSection.ForceGraph data={data} />}
            {activeTab3 === 'sunburst' && <ChartSection.SunburstChart data={data} />}
          </div>
        </div>
      </div>
      
      {/* Third Row: Stream Graph */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-medium mb-4">Time-Series Analysis</h2>
        <div className="h-64">
          <ChartSection.StreamGraph data={data} />
        </div>
      </div>
      
      {/* Fourth Row: Data Table */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-medium mb-4">Recent Orders</h2>
        <DataTable data={data} />
      </div>
    </div>
  );
};

export default DashboardView;