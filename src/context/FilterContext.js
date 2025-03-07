import { createContext } from 'react';

// Create a context for filters with default values
export const FilterContext = createContext({
  filters: {
    dateRange: {
      startDate: new Date('2013-01-01'),
      endDate: new Date('2018-01-01')
    },
    regions: [],
    countries: [],
    categories: [],
    statuses: []
  },
  updateFilter: () => {},
  resetFilters: () => {},
  filterOptions: {}
});