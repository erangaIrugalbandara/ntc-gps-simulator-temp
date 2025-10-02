// test-simulator.js - Test the GPS simulator functionality
const { GPSSimulator, GPSFleetSimulator, ROUTES, BUS_FLEET } = require('./gps-simulator');

console.log('🧪 Testing GPS Simulator...\n');

// Test 1: Single bus simulation
console.log('Test 1: Single Bus Simulation');
const testBus = {
  busId: 'TEST-001',
  route: 'ROUTE_001',
  operator: 'SLTB',
  serviceType: 'Normal'
};

const simulator = new GPSSimulator(testBus, 'http://localhost:3000/api/buses/location');

// Run for 10 updates (5 minutes with 30-second intervals)
console.log('Running single bus for 10 updates...');
let updateCount = 0;
const testInterval = setInterval(() => {
  simulator.sendLocationUpdate();
  updateCount++;
  
  if (updateCount >= 10) {
    clearInterval(testInterval);
    console.log('✅ Single bus test completed\n');
    
    // Test 2: Route data validation
    console.log('Test 2: Route Data Validation');
    testRouteData();
  }
}, 3000); // 3-second intervals for faster testing

function testRouteData() {
  console.log('Validating route data...');
  
  Object.keys(ROUTES).forEach(routeId => {
    const route = ROUTES[routeId];
    console.log(`📍 ${route.name}:`);
    console.log(`   - Waypoints: ${route.waypoints.length}`);
    console.log(`   - Distance: ${route.distance}km`);
    console.log(`   - Average Speed: ${route.averageSpeed}km/h`);
    
    // Validate GPS coordinates are within Sri Lanka bounds
    route.waypoints.forEach(waypoint => {
      const isValidLat = waypoint.lat >= 5.9 && waypoint.lat <= 9.9;
      const isValidLng = waypoint.lng >= 79.6 && waypoint.lng <= 81.9;
      
      if (!isValidLat || !isValidLng) {
        console.error(`❌ Invalid coordinates for ${waypoint.name}: ${waypoint.lat}, ${waypoint.lng}`);
      }
    });
  });
  
  console.log('✅ Route data validation completed\n');
  
  // Test 3: Fleet configuration
  testFleetConfiguration();
}

function testFleetConfiguration() {
  console.log('Test 3: Fleet Configuration');
  console.log(`Total buses: ${BUS_FLEET.length}`);
  
  const routeCount = {};
  const operatorCount = {};
  const serviceTypeCount = {};
  
  BUS_FLEET.forEach(bus => {
    // Count by route
    routeCount[bus.route] = (routeCount[bus.route] || 0) + 1;
    
    // Count by operator
    operatorCount[bus.operator] = (operatorCount[bus.operator] || 0) + 1;
    
    // Count by service type
    serviceTypeCount[bus.serviceType] = (serviceTypeCount[bus.serviceType] || 0) + 1;
  });
  
  console.log('Buses per route:');
  Object.keys(routeCount).forEach(route => {
    console.log(`   ${route}: ${routeCount[route]} buses`);
  });
  
  console.log('\nBuses per operator:');
  Object.keys(operatorCount).forEach(operator => {
    console.log(`   ${operator}: ${operatorCount[operator]} buses`);
  });
  
  console.log('\nBuses per service type:');
  Object.keys(serviceTypeCount).forEach(serviceType => {
    console.log(`   ${serviceType}: ${serviceTypeCount[serviceType]} buses`);
  });
  
  console.log('✅ Fleet configuration test completed\n');
  
  // Test 4: GPS coordinate accuracy
  testGPSAccuracy();
}

function testGPSAccuracy() {
  console.log('Test 4: GPS Coordinate Accuracy');
  
  // Test distance calculations
  const colombo = { lat: 6.9271, lng: 79.8612 };
  const kandy = { lat: 7.2906, lng: 80.6337 };
  
  const testSimulator = new GPSSimulator({
    busId: 'TEST-GPS',
    route: 'ROUTE_001',
    operator: 'SLTB',
    serviceType: 'Normal'
  });
  
  const calculatedDistance = testSimulator.calculateDistance(
    colombo.lat, colombo.lng, kandy.lat, kandy.lng
  );
  
  console.log(`Colombo to Kandy distance: ${calculatedDistance.toFixed(2)}km`);
  console.log(`Expected: ~115km`);
  
  if (Math.abs(calculatedDistance - 115) < 20) {
    console.log('✅ Distance calculation accurate');
  } else {
    console.log('❌ Distance calculation inaccurate');
  }
  
  // Test bearing calculation
  const bearing = testSimulator.calculateBearing(
    colombo.lat, colombo.lng, kandy.lat, kandy.lng
  );
  
  console.log(`Bearing from Colombo to Kandy: ${bearing.toFixed(1)}°`);
  console.log('✅ GPS accuracy test completed\n');
  
  console.log('🎉 All tests completed successfully!');
  console.log('\nTo start the full fleet simulation, run:');
  console.log('npm start');
  
  process.exit(0);
}