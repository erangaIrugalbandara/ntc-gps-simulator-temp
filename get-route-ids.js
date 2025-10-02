const axios = require('axios');

const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGRmOGEyYTAyNzExYmNhYWU0YWY1ZiIsImlhdCI6MTc1OTM3ODI1OCwiZXhwIjoxNzkwOTE0MjU4fQ.Vfv7FFk_h0TP2lMlX7QywZJCV_tI2De_Jueebawz9iQ';

async function getRouteIds() {
  try {
    console.log('Fetching routes from API...\n');
    
    const response = await axios.get('http://localhost:3000/api/public/routes', {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });
    
    const routes = response.data.data.routes;
    
    console.log('=== COPY THIS MAPPING TO gps-simulator.js ===\n');
    console.log('const ROUTE_ID_MAPPING = {');
    
    routes.forEach(route => {
      // Try to match with our simulator routes
      let routeCode = '';
      if (route.name.includes('Colombo') && route.name.includes('Kandy')) {
        routeCode = 'ROUTE_001';
      } else if (route.name.includes('Colombo') && route.name.includes('Galle')) {
        routeCode = 'ROUTE_002';
      } else if (route.name.includes('Colombo') && route.name.includes('Ratnapura')) {
        routeCode = 'ROUTE_003';
      } else if (route.name.includes('Colombo') && route.name.includes('Anuradhapura')) {
        routeCode = 'ROUTE_004';
      } else if (route.name.includes('Kandy') && route.name.includes('Badulla')) {
        routeCode = 'ROUTE_005';
      }
      
      if (routeCode) {
        console.log(`  '${routeCode}': '${route._id}', // ${route.name}`);
      }
    });
    
    console.log('};\n');
    console.log('=== END OF MAPPING ===\n');
    
  } catch (error) {
    console.error('Error fetching routes:', error.response?.data || error.message);
  }
}

getRouteIds();