export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      rotate: {
        'y-180': 'rotateY(180deg)',
      },
      height: {
        '420': '420px',
      }
    },
  },
  safelist: [
    // Colors for dynamic KPI cards
    'bg-blue-50',
    'bg-green-50',
    'bg-purple-50',
    'bg-orange-50',
    'bg-red-50',
    'bg-blue-100',
    'bg-green-100',
    'bg-purple-100',
    'bg-orange-100',
    'bg-red-100',
    'from-blue-50',
    'from-green-50',
    'from-purple-50',
    'from-orange-50',
    'from-red-50',
    'text-blue-600',
    'text-green-600',
    'text-purple-600', 
    'text-orange-600',
    'text-red-600',
  ],
  plugins: [],
}