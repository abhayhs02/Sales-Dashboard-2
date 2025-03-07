import React from 'react';
import SimplePieChart from './SimplePieChart';
import SimpleBarChart from './SimpleBarChart';
import SimpleLineChart from './SimpleLineChart';
import SimpleGeoMap from './SimpleGeoMap';
import SimpleForceGraph from './SimpleForceGraph';
import SimpleSunburstChart from './SimpleSunburstChart';
import SimpleStreamGraph from './SimpleStreamGraph';

// This module exports simplified chart components
// for use in the dashboard
const ChartSection = {
  PieChart: SimplePieChart,
  BarChart: SimpleBarChart,
  LineChart: SimpleLineChart,
  GeoMap: SimpleGeoMap,
  ForceGraph: SimpleForceGraph,
  SunburstChart: SimpleSunburstChart,
  StreamGraph: SimpleStreamGraph
};

export default ChartSection;