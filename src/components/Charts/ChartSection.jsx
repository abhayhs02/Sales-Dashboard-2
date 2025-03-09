import React from 'react';
import EnhancedPieChart from './SimplePieChart';
import SimpleBarChart from './SimpleBarChart';
import ImprovedLineChart from './LineChart';
import GeographicMap from './GeographicMap';
import NetworkVisualization from './NetworkVisualization';
import SunburstVisualization from './SunburstVisualization';
import StreamGraph from './StreamGraph';

// This module exports chart components for use in the dashboard
const ChartSection = {
  PieChart: EnhancedPieChart,
  BarChart: SimpleBarChart,
  LineChart: ImprovedLineChart, // Using the improved line chart with contained tooltip
  GeoMap: GeographicMap,
  ForceGraph: NetworkVisualization,
  SunburstChart: SunburstVisualization,
  StreamGraph: StreamGraph
};

export default ChartSection;