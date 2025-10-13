require('dotenv').config();
const axios = require('axios');
const http = require('http');

// Configuration from environment variables
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const UPDATE_INTERVAL = parseInt(process.env.UPDATE_INTERVAL) || 30000;
const HEALTH_CHECK_PORT = parseInt(process.env.HEALTH_CHECK_PORT) || 10000;

// Storage for dynamic data
let ADMIN_TOKEN = null;
let BUS_ID_MAPPING = {};
let ROUTE_ID_MAPPING = {};
let TRIP_MAPPING = {};

// Real GPS coordinates for Sri Lankan inter-provincial routes
const ROUTES = {
  'R001': {
    name: 'Colombo - Kandy',
    waypoints: [
      { lat: 6.9271, lng: 79.8612, name: 'Colombo Fort', stopDuration: 300 },
      { lat: 6.9319, lng: 79.8478, name: 'Pettah', stopDuration: 120 },
      { lat: 7.0378, lng: 79.9003, name: 'Kelaniya', stopDuration: 60 },
      { lat: 7.0873, lng: 79.9553, name: 'Kiribathgoda', stopDuration: 180 },
      { lat: 7.1431, lng: 79.9969, name: 'Kadawatha', stopDuration: 120 },
      { lat: 7.1906, lng: 80.1003, name: 'Nittambuwa', stopDuration: 300 },
      { lat: 7.2336, lng: 80.1956, name: 'Warakapola', stopDuration: 240 },
      { lat: 7.2503, lng: 80.3464, name: 'Kegalle', stopDuration: 420 },
      { lat: 7.3311, lng: 80.5978, name: 'Kadugannawa', stopDuration: 180 },
      { lat: 7.2906, lng: 80.6337, name: 'Kandy Central', stopDuration: 600 }
    ],
    averageSpeed: 45,
    distance: 115
  },
  'R002': {
    name: 'Colombo - Galle',
    waypoints: [
      { lat: 6.9271, lng: 79.8612, name: 'Colombo Fort', stopDuration: 300 },
      { lat: 6.8485, lng: 79.8848, name: 'Wellawatte', stopDuration: 120 },
      { lat: 6.7648, lng: 79.9014, name: 'Moratuwa', stopDuration: 180 },
      { lat: 6.7133, lng: 79.9206, name: 'Panadura', stopDuration: 240 },
      { lat: 6.6186, lng: 79.9883, name: 'Kalutara', stopDuration: 300 },
      { lat: 6.4218, lng: 80.0180, name: 'Beruwala', stopDuration: 180 },
      { lat: 6.3676, lng: 80.0142, name: 'Bentota', stopDuration: 120 },
      { lat: 6.2390, lng: 80.0503, name: 'Ambalangoda', stopDuration: 240 },
      { lat: 6.1408, lng: 80.099, name: 'Hikkaduwa', stopDuration: 180 },
      { lat: 6.0535, lng: 80.2210, name: 'Galle Fort', stopDuration: 600 }
    ],
    averageSpeed: 50,
    distance: 119
  },
  'R003': {
    name: 'Colombo - Ratnapura',
    waypoints: [
      { lat: 6.9271, lng: 79.8612, name: 'Colombo Fort', stopDuration: 300 },
      { lat: 6.8560, lng: 79.9208, name: 'Nugegoda', stopDuration: 120 },
      { lat: 6.8211, lng: 80.0377, name: 'Hanwella', stopDuration: 180 },
      { lat: 6.7354, lng: 80.1495, name: 'Avissawella', stopDuration: 240 },
      { lat: 6.6892, lng: 80.2372, name: 'Eheliyagoda', stopDuration: 180 },
      { lat: 6.6659, lng: 80.3729, name: 'Kuruwita', stopDuration: 120 },
      { lat: 6.6835, lng: 80.3992, name: 'Ratnapura', stopDuration: 600 }
    ],
    averageSpeed: 40,
    distance: 101
  },
  'R004': {
    name: 'Colombo - Anuradhapura',
    waypoints: [
      { lat: 6.9271, lng: 79.8612, name: 'Colombo Fort', stopDuration: 300 },
      { lat: 7.1067, lng: 79.8392, name: 'Negombo', stopDuration: 240 },
      { lat: 7.2167, lng: 79.8500, name: 'Chilaw', stopDuration: 300 },
      { lat: 8.0362, lng: 80.0851, name: 'Puttalam', stopDuration: 360 },
      { lat: 8.3114, lng: 80.4037, name: 'Anuradhapura', stopDuration: 600 }
    ],
    averageSpeed: 55,
    distance: 206
  },
  'R005': {
    name: 'Kandy - Badulla',
    waypoints: [
      { lat: 7.2906, lng: 80.6337, name: 'Kandy Central', stopDuration: 300 },
      { lat: 7.2683, lng: 80.5908, name: 'Peradeniya', stopDuration: 120 },
      { lat: 7.2571, lng: 80.5821, name: 'Gampola', stopDuration: 180 },
      { lat: 7.0378, lng: 80.7675, name: 'Nuwara Eliya', stopDuration: 420 },
      { lat: 6.9895, lng: 81.0550, name: 'Ella', stopDuration: 240 },
      { lat: 6.9934, lng: 81.0550, name: 'Badulla', stopDuration: 600 }
    ],
    averageSpeed: 35,
    distance: 142
  }
};

// Bus fleet configuration
const BUS_FLEET = [
  { busNumber: 'NB-1001', route: 'R001', operator: 'SLTB', serviceType: 'Normal' },
  { busNumber: 'NB-1002', route: 'R001', operator: 'SLTB', serviceType: 'Semi-Luxury' },
  { busNumber: 'NB-1003', route: 'R001', operator: 'Private', serviceType: 'AC' },
  { busNumber: 'NB-1004', route: 'R001', operator: 'SLTB', serviceType: 'Normal' },
  { busNumber: 'NB-1005', route: 'R001', operator: 'Private', serviceType: 'Semi-Luxury' },
  { busNumber: 'NB-2001', route: 'R002', operator: 'SLTB', serviceType: 'Normal' },
  { busNumber: 'NB-2002', route: 'R002', operator: 'Private', serviceType: 'AC' },
  { busNumber: 'NB-2003', route: 'R002', operator: 'SLTB', serviceType: 'Semi-Luxury' },
  { busNumber: 'NB-2004', route: 'R002', operator: 'Private', serviceType: 'Normal' },
  { busNumber: 'NB-2005', route: 'R002', operator: 'SLTB', serviceType: 'AC' },
  { busNumber: 'NB-3001', route: 'R003', operator: 'SLTB', serviceType: 'Normal' },
  { busNumber: 'NB-3002', route: 'R003', operator: 'Private', serviceType: 'Semi-Luxury' },
  { busNumber: 'NB-3003', route: 'R003', operator: 'SLTB', serviceType: 'Normal' },
  { busNumber: 'NB-3004', route: 'R003', operator: 'Private', serviceType: 'AC' },
  { busNumber: 'NB-3005', route: 'R003', operator: 'SLTB', serviceType: 'Semi-Luxury' },
  { busNumber: 'NB-4001', route: 'R004', operator: 'SLTB', serviceType: 'Normal' },
  { busNumber: 'NB-4002', route: 'R004', operator: 'Private', serviceType: 'AC' },
  { busNumber: 'NB-4003', route: 'R004', operator: 'SLTB', serviceType: 'Semi-Luxury' },
  { busNumber: 'NB-4004', route: 'R004', operator: 'Private', serviceType: 'Normal' },
  { busNumber: 'NB-4005', route: 'R004', operator: 'SLTB', serviceType: 'AC' },
  { busNumber: 'NB-5001', route: 'R005', operator: 'SLTB', serviceType: 'Normal' },
  { busNumber: 'NB-5002', route: 'R005', operator: 'Private', serviceType: 'Semi-Luxury' },
  { busNumber: 'NB-5003', route: 'R005', operator: 'SLTB', serviceType: 'AC' },
  { busNumber: 'NB-5004', route: 'R005', operator: 'Private', serviceType: 'Normal' },
  { busNumber: 'NB-5005', route: 'R005', operator: 'SLTB', serviceType: 'Semi-Luxury' }
];

// Authentication function
async function login() {
  try {
    console.log('🔐 Logging in as admin...');
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    });
    
    ADMIN_TOKEN = response.data.data.token;
    console.log('✓ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

// Fetch bus and route mappings from database
async function fetchMappings() {
  try {
    console.log('\n📡 Fetching bus and route mappings from database...');
    
    // Fetch all buses
    const busResponse = await axios.get(`${API_BASE_URL}/api/admin/buses?limit=100`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    busResponse.data.data.buses.forEach(bus => {
      BUS_ID_MAPPING[bus.busNumber] = bus._id;
    });
    
    console.log(`✓ Mapped ${Object.keys(BUS_ID_MAPPING).length} buses`);
    
    // Fetch all routes
    const routeResponse = await axios.get(`${API_BASE_URL}/api/admin/routes?limit=100`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    routeResponse.data.data.routes.forEach(route => {
      ROUTE_ID_MAPPING[route.routeNumber] = route._id;
    });
    
    console.log(`✓ Mapped ${Object.keys(ROUTE_ID_MAPPING).length} routes`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to fetch mappings:', error.response?.data?.message || error.message);
    return false;
  }
}

// Initialize trips for all buses
async function initializeTrips() {
  console.log('\n🚀 Initializing trips for all buses...\n');
  
  for (const busConfig of BUS_FLEET) {
    try {
      const dbBusId = BUS_ID_MAPPING[busConfig.busNumber];
      const routeId = ROUTE_ID_MAPPING[busConfig.route];
      
      if (!dbBusId) {
        console.log(`❌ No bus mapping for ${busConfig.busNumber}`);
        continue;
      }
      
      if (!routeId) {
        console.log(`❌ No route mapping for ${busConfig.route}`);
        continue;
      }
      
      // Check if trip already exists for this bus
      const checkResponse = await axios.get(
        `${API_BASE_URL}/api/admin/trips?status=in_progress&limit=100`,
        {
          headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        }
      );
      
      const existingTrip = checkResponse.data.data.trips.find(
        trip => trip.bus._id === dbBusId
      );
      
      if (existingTrip) {
        TRIP_MAPPING[busConfig.busNumber] = existingTrip._id;
        console.log(`✓ Existing trip found for ${busConfig.busNumber}: ${existingTrip._id}`);
        continue;
      }
      
      // Create new trip
      const now = new Date();
      const tripData = {
        tripNumber: `TRIP-${busConfig.busNumber}-${Date.now()}`,
        bus: dbBusId,
        route: routeId,
        direction: 'outbound',
        departureTime: now.toISOString(),
        arrivalTime: new Date(now.getTime() + 4 * 3600000).toISOString(),
        status: 'in_progress'
      };
      
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/trips`,
        tripData,
        {
          headers: {
            'Authorization': `Bearer ${ADMIN_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      TRIP_MAPPING[busConfig.busNumber] = response.data.data.trip._id;
      console.log(`✓ Trip created for ${busConfig.busNumber}: ${TRIP_MAPPING[busConfig.busNumber]}`);
      
    } catch (error) {
      console.error(`❌ Failed to initialize trip for ${busConfig.busNumber}:`, error.response?.data?.message || error.message);
    }
  }
  
  console.log(`\n✓ Trip initialization complete: ${Object.keys(TRIP_MAPPING).length}/${BUS_FLEET.length} buses ready\n`);
}

class GPSSimulator {
  constructor(busConfig) {
    this.busNumber = busConfig.busNumber;
    this.busConfig = busConfig;
    this.route = ROUTES[busConfig.route];
    this.operator = busConfig.operator;
    this.serviceType = busConfig.serviceType;
    
    this.currentWaypointIndex = 0;
    this.direction = 'outbound';
    this.progress = 0;
    this.isAtStop = false;
    this.stopStartTime = null;
    this.speed = 0;
    this.heading = 0;
    
    this.baseSpeed = this.route.averageSpeed;
    this.speedVariation = 0.8 + Math.random() * 0.4;
    
    console.log(`Bus ${this.busNumber} initialized on ${this.route.name}`);
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  calculateBearing(lat1, lng1, lat2, lng2) {
    const dLng = this.toRadians(lng2 - lng1);
    const y = Math.sin(dLng) * Math.cos(this.toRadians(lat2));
    const x = Math.cos(this.toRadians(lat1)) * Math.sin(this.toRadians(lat2)) -
              Math.sin(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.cos(dLng);
    let bearing = Math.atan2(y, x);
    bearing = bearing * (180 / Math.PI);
    return (bearing + 360) % 360;
  }

  interpolatePosition(startPoint, endPoint, progress) {
    const lat = startPoint.lat + (endPoint.lat - startPoint.lat) * progress;
    const lng = startPoint.lng + (endPoint.lng - startPoint.lng) * progress;
    return { lat, lng };
  }

  async renewTrip() {
  try {
    const dbBusId = BUS_ID_MAPPING[this.busNumber];
    const routeId = ROUTE_ID_MAPPING[this.routeConfig.route];
    
    if (!dbBusId || !routeId) return;
    
    // Create new trip
    const now = new Date();
    const tripData = {
      tripNumber: `TRIP-${this.busNumber}-${Date.now()}`,
      bus: dbBusId,
      route: routeId,
      direction: this.direction,
      departureTime: now.toISOString(),
      arrivalTime: new Date(now.getTime() + 4 * 3600000).toISOString(),
      status: 'in_progress'
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/api/admin/trips`,
      tripData,
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    TRIP_MAPPING[this.busNumber] = response.data.data.trip._id;
    console.log(`✓ New trip created for ${this.busNumber}`);
  } catch (error) {
    console.error(`Failed to renew trip for ${this.busNumber}:`, error.message);
  }
}

  addGPSNoise(lat, lng) {
    const noiseRange = 0.0001;
    const latNoise = (Math.random() - 0.5) * noiseRange;
    const lngNoise = (Math.random() - 0.5) * noiseRange;
    return {
      lat: lat + latNoise,
      lng: lng + lngNoise
    };
  }

  calculateRealisticSpeed() {
    if (this.isAtStop) return 0;
    
    let currentSpeed = this.baseSpeed * this.speedVariation;
    const trafficVariation = 0.8 + Math.random() * 0.4;
    currentSpeed *= trafficVariation;
    
    if (this.route.name === 'Kandy - Badulla') {
      currentSpeed *= 0.7;
    }
    
    if (this.route.name === 'Colombo - Galle') {
      currentSpeed *= 1.2;
    }
    
    return Math.max(10, Math.min(80, currentSpeed));
  }

  getCurrentPosition() {
  const waypoints = this.route.waypoints;
  
  // Handle stop behavior
  if (this.isAtStop) {
    const currentWaypoint = waypoints[this.currentWaypointIndex];
    const stopDuration = currentWaypoint.stopDuration || 120;
    
    if (Date.now() - this.stopStartTime >= stopDuration * 1000) {
      this.isAtStop = false;
      this.stopStartTime = null;
      console.log(`Bus ${this.busNumber} departing from ${currentWaypoint.name}`);
    } else {
      const position = this.addGPSNoise(currentWaypoint.lat, currentWaypoint.lng);
      return {
        ...position,
        speed: 0,
        heading: this.heading,
        status: 'at_stop',
        currentStop: currentWaypoint.name
      };
    }
  }

  let currentWaypoint, nextWaypoint;
  
  if (this.direction === 'outbound') {
    currentWaypoint = waypoints[this.currentWaypointIndex];
    nextWaypoint = waypoints[this.currentWaypointIndex + 1];
  } else {
    currentWaypoint = waypoints[this.currentWaypointIndex];
    nextWaypoint = waypoints[this.currentWaypointIndex - 1];
  }

  // Check if we've reached the end of the route
  if (!nextWaypoint) {
    // Reverse direction
    if (this.direction === 'outbound') {
      console.log(`Bus ${this.busNumber} reached destination, reversing to inbound`);
      this.direction = 'inbound';
      this.currentWaypointIndex = waypoints.length - 1;
      nextWaypoint = waypoints[this.currentWaypointIndex - 1];
    } else {
      console.log(`Bus ${this.busNumber} returned to origin, reversing to outbound`);
      this.direction = 'outbound';
      this.currentWaypointIndex = 0;
      nextWaypoint = waypoints[1];
    }
    this.progress = 0;
    
    // Don't snap - smoothly continue from current position
    currentWaypoint = waypoints[this.currentWaypointIndex];
  }

  const position = this.interpolatePosition(currentWaypoint, nextWaypoint, this.progress);
  
  this.speed = this.calculateRealisticSpeed();
  this.heading = this.calculateBearing(
    currentWaypoint.lat, currentWaypoint.lng,
    nextWaypoint.lat, nextWaypoint.lng
  );

  const segmentDistance = this.calculateDistance(
    currentWaypoint.lat, currentWaypoint.lng,
    nextWaypoint.lat, nextWaypoint.lng
  );
  
  // Calculate progress based on speed and time
  const progressIncrement = (this.speed / 3600) / segmentDistance;
  this.progress += progressIncrement;

  if (this.progress >= 1) {
    this.progress = 0;
    
    if (this.direction === 'outbound') {
      this.currentWaypointIndex++;
    } else {
      this.currentWaypointIndex--;
    }
    
    // Check if next waypoint exists and has a stop
    const reachedWaypoint = waypoints[this.currentWaypointIndex];
    if (reachedWaypoint && reachedWaypoint.stopDuration > 0) {
      this.isAtStop = true;
      this.stopStartTime = Date.now();
      console.log(`Bus ${this.busNumber} arrived at ${reachedWaypoint.name}`);
    }
  }

  const noisyPosition = this.addGPSNoise(position.lat, position.lng);
  
  return {
    ...noisyPosition,
    speed: Math.round(this.speed * 10) / 10,
    heading: Math.round(this.heading),
    status: 'in_transit',
    currentStop: null
  };
}

  async sendLocationUpdate() {
    try {
      const location = this.getCurrentPosition();
      const dbBusId = BUS_ID_MAPPING[this.busNumber];
      
      if (!dbBusId) {
        console.log(`No mapping for ${this.busNumber}`);
        return;
      }
      
      const locationData = {
        busId: dbBusId,
        latitude: location.lat,
        longitude: location.lng,
        speed: location.speed,
        heading: location.heading,
        timestamp: new Date().toISOString()
      };

      await axios.post(`${API_BASE_URL}/api/admin/locations`, locationData, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`${this.busNumber}: ✓ ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)} | ${location.speed}km/h`);
      
    } catch (error) {
      if (error.response?.status === 401) {
        console.error(`${this.busNumber}: ❌ Authentication failed - token may be expired`);
        process.exit(1);
      }
      console.error(`${this.busNumber}: ❌ ${error.response?.data?.message || error.message}`);
    }
  }

  startSimulation(updateInterval) {
    console.log(`Starting GPS simulation for bus ${this.busNumber}`);
    
    this.sendLocationUpdate();
    
    this.simulationInterval = setInterval(() => {
      this.sendLocationUpdate();
    }, updateInterval);
  }

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      console.log(`Stopped GPS simulation for bus ${this.busNumber}`);
    }
  }
}

class GPSFleetSimulator {
  constructor() {
    this.activeBuses = new Map();
    console.log('Initializing GPS Fleet Simulator for Sri Lanka NTC');
  }

  startFleetSimulation(updateInterval) {
    console.log(`\n🚀 Starting simulation for ${BUS_FLEET.length} buses across ${Object.keys(ROUTES).length} routes\n`);
    
    BUS_FLEET.forEach((busConfig, index) => {
      setTimeout(() => {
        const simulator = new GPSSimulator(busConfig);
        simulator.startSimulation(updateInterval);
        this.activeBuses.set(busConfig.busNumber, simulator);
      }, index * 2000);
    });
  }

  stopFleetSimulation() {
    console.log('Stopping all bus simulations...');
    this.activeBuses.forEach((simulator) => {
      simulator.stopSimulation();
    });
    this.activeBuses.clear();
  }
}

// Health check server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    status: 'running', 
    message: 'GPS Simulator is active',
    activeBuses: BUS_FLEET.length,
    timestamp: new Date().toISOString()
  }));
});

server.listen(HEALTH_CHECK_PORT, '0.0.0.0', () => {
  console.log(`✓ Health check server running on port ${HEALTH_CHECK_PORT}`);
});

// Main execution
async function main() {
  console.log('\n=== NTC GPS Simulator Starting ===\n');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Update Interval: ${UPDATE_INTERVAL}ms`);
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('\n❌ Failed to authenticate. Exiting...');
    process.exit(1);
  }
  
  // Step 2: Fetch mappings
  const mappingsSuccess = await fetchMappings();
  if (!mappingsSuccess) {
    console.error('\n❌ Failed to fetch mappings. Exiting...');
    process.exit(1);
  }
  
  // Step 3: Initialize trips
  await initializeTrips();
  
  // Step 4: Start simulation
  const fleetSimulator = new GPSFleetSimulator();
  fleetSimulator.startFleetSimulation(UPDATE_INTERVAL);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\nShutting down GPS Fleet Simulator...');
    fleetSimulator.stopFleetSimulation();
    server.close();
    process.exit(0);
  });
}

// Run if this is the main module
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { GPSFleetSimulator, GPSSimulator };