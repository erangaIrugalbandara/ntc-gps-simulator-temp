const axios = require('axios');
const BUS_ID_MAPPING = require('./busIdMapping');

// Configuration
const API_URL = 'http://localhost:3000/api/admin/locations';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGRmOGEyYTAyNzExYmNhYWU0YWY1ZiIsImlhdCI6MTc1OTM3ODI1OCwiZXhwIjoxNzkwOTE0MjU4fQ.Vfv7FFk_h0TP2lMlX7QywZJCV_tI2De_Jueebawz9iQ';

// Route ID mapping - YOU NEED TO UPDATE THESE WITH YOUR ACTUAL DATABASE ROUTE IDS
// Run this query in MongoDB to get your route IDs: db.routes.find({}, {routeNumber: 1, _id: 1})
const ROUTE_ID_MAPPING = {
  'ROUTE_001': '68dda464d12b6ad6fc5fe4d1', // Colombo - Kandy
  'ROUTE_002': '68dda464d12b6ad6fc5fe4d2', // Colombo - Galle
  'ROUTE_003': '68dda464d12b6ad6fc5fe4d3', // Colombo - Ratnapura
  'ROUTE_004': '68dda464d12b6ad6fc5fe4d4', // Colombo - Anuradhapura
  'ROUTE_005': '68dda464d12b6ad6fc5fe4d5'  // Kandy - Badulla
};

// Real GPS coordinates for Sri Lankan inter-provincial routes
const ROUTES = {
  'ROUTE_001': {
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
  
  'ROUTE_002': {
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

  'ROUTE_003': {
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

  'ROUTE_004': {
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

  'ROUTE_005': {
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
  { busId: 'NB-1001', route: 'ROUTE_001', operator: 'SLTB', serviceType: 'Normal' },
  { busId: 'NB-1002', route: 'ROUTE_001', operator: 'SLTB', serviceType: 'Semi-Luxury' },
  { busId: 'NB-1003', route: 'ROUTE_001', operator: 'Private', serviceType: 'AC' },
  { busId: 'NB-1004', route: 'ROUTE_001', operator: 'SLTB', serviceType: 'Normal' },
  { busId: 'NB-1005', route: 'ROUTE_001', operator: 'Private', serviceType: 'Semi-Luxury' },
  { busId: 'NB-2001', route: 'ROUTE_002', operator: 'SLTB', serviceType: 'Normal' },
  { busId: 'NB-2002', route: 'ROUTE_002', operator: 'Private', serviceType: 'AC' },
  { busId: 'NB-2003', route: 'ROUTE_002', operator: 'SLTB', serviceType: 'Semi-Luxury' },
  { busId: 'NB-2004', route: 'ROUTE_002', operator: 'Private', serviceType: 'Normal' },
  { busId: 'NB-2005', route: 'ROUTE_002', operator: 'SLTB', serviceType: 'AC' },
  { busId: 'NB-3001', route: 'ROUTE_003', operator: 'SLTB', serviceType: 'Normal' },
  { busId: 'NB-3002', route: 'ROUTE_003', operator: 'Private', serviceType: 'Semi-Luxury' },
  { busId: 'NB-3003', route: 'ROUTE_003', operator: 'SLTB', serviceType: 'Normal' },
  { busId: 'NB-3004', route: 'ROUTE_003', operator: 'Private', serviceType: 'AC' },
  { busId: 'NB-3005', route: 'ROUTE_003', operator: 'SLTB', serviceType: 'Semi-Luxury' },
  { busId: 'NB-4001', route: 'ROUTE_004', operator: 'SLTB', serviceType: 'Normal' },
  { busId: 'NB-4002', route: 'ROUTE_004', operator: 'Private', serviceType: 'AC' },
  { busId: 'NB-4003', route: 'ROUTE_004', operator: 'SLTB', serviceType: 'Semi-Luxury' },
  { busId: 'NB-4004', route: 'ROUTE_004', operator: 'Private', serviceType: 'Normal' },
  { busId: 'NB-4005', route: 'ROUTE_004', operator: 'SLTB', serviceType: 'AC' },
  { busId: 'NB-5001', route: 'ROUTE_005', operator: 'SLTB', serviceType: 'Normal' },
  { busId: 'NB-5002', route: 'ROUTE_005', operator: 'Private', serviceType: 'Semi-Luxury' },
  { busId: 'NB-5003', route: 'ROUTE_005', operator: 'SLTB', serviceType: 'AC' },
  { busId: 'NB-5004', route: 'ROUTE_005', operator: 'Private', serviceType: 'Normal' },
  { busId: 'NB-5005', route: 'ROUTE_005', operator: 'SLTB', serviceType: 'Semi-Luxury' }
];

// Store trip IDs
const TRIP_MAPPING = {};

// Initialize trips for all buses
async function initializeTrips() {
  console.log('\n=== Initializing trips for all buses ===\n');
  
  for (const busConfig of BUS_FLEET) {
    try {
      const dbBusId = BUS_ID_MAPPING[busConfig.busId];
      const routeId = ROUTE_ID_MAPPING[busConfig.route];
      
      if (!dbBusId) {
        console.log(`❌ No bus mapping for ${busConfig.busId}`);
        continue;
      }
      
      if (!routeId) {
        console.log(`❌ No route mapping for ${busConfig.route}`);
        continue;
      }
      
      // Check if trip already exists for this bus
      const checkResponse = await axios.get(
        `http://localhost:3000/api/admin/trips?status=in_progress`,
        {
          headers: {
            'Authorization': `Bearer ${ADMIN_TOKEN}`
          }
        }
      );
      
      const existingTrip = checkResponse.data.data.trips.find(
        trip => trip.bus._id === dbBusId
      );
      
      if (existingTrip) {
        TRIP_MAPPING[busConfig.busId] = existingTrip._id;
        console.log(`✓ Existing trip found for ${busConfig.busId}: ${existingTrip._id}`);
        continue;
      }
      
      // Create new trip
      const now = new Date();
      const tripData = {
        tripNumber: `TRIP-${busConfig.busId}-${Date.now()}`,
        bus: dbBusId,
        route: routeId,
        direction: 'outbound',
        departureTime: now.toISOString(),
        arrivalTime: new Date(now.getTime() + 4 * 3600000).toISOString(), // 4 hours later
        status: 'in_progress'
      };
      
      const response = await axios.post(
        'http://localhost:3000/api/admin/trips',
        tripData,
        {
          headers: {
            'Authorization': `Bearer ${ADMIN_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      TRIP_MAPPING[busConfig.busId] = response.data.data.trip._id;
      console.log(`✓ Trip created for ${busConfig.busId}: ${TRIP_MAPPING[busConfig.busId]}`);
      
    } catch (error) {
      console.error(`❌ Failed to initialize trip for ${busConfig.busId}:`, error.response?.data?.message || error.message);
    }
  }
  
  console.log(`\n=== Trip initialization complete: ${Object.keys(TRIP_MAPPING).length}/${BUS_FLEET.length} buses ready ===\n`);
}

class GPSSimulator {
  constructor(busConfig) {
    this.busId = busConfig.busId;
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
    
    console.log(`Bus ${this.busId} initialized on ${this.route.name}`);
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
    
    if (this.isAtStop) {
      const currentWaypoint = waypoints[this.currentWaypointIndex];
      const stopDuration = currentWaypoint.stopDuration || 120;
      
      if (Date.now() - this.stopStartTime >= stopDuration * 1000) {
        this.isAtStop = false;
        this.stopStartTime = null;
        console.log(`Bus ${this.busId} departing from ${currentWaypoint.name}`);
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

    if (!nextWaypoint) {
      this.direction = this.direction === 'outbound' ? 'inbound' : 'outbound';
      this.progress = 0;
      
      if (this.direction === 'inbound') {
        this.currentWaypointIndex = waypoints.length - 1;
        nextWaypoint = waypoints[this.currentWaypointIndex - 1];
      } else {
        this.currentWaypointIndex = 0;
        nextWaypoint = waypoints[1];
      }
      
      console.log(`Bus ${this.busId} now ${this.direction} on ${this.route.name}`);
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
    const progressIncrement = (this.speed / 3600) / segmentDistance;
    this.progress += progressIncrement;

    if (this.progress >= 1) {
      this.progress = 0;
      
      if (this.direction === 'outbound') {
        this.currentWaypointIndex++;
      } else {
        this.currentWaypointIndex--;
      }
      
      const reachedWaypoint = waypoints[this.currentWaypointIndex];
        
      if (reachedWaypoint && reachedWaypoint.stopDuration > 0) {
        this.isAtStop = true;
        this.stopStartTime = Date.now();
        console.log(`Bus ${this.busId} arrived at ${reachedWaypoint.name}`);
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
      const dbBusId = BUS_ID_MAPPING[this.busId];
      
      if (!dbBusId) {
        console.log(`No mapping for ${this.busId}`);
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

      const response = await axios.post(API_URL, locationData, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`${this.busId}: ✓ Location sent - ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)} | ${location.speed}km/h`);
      
    } catch (error) {
      console.error(`${this.busId}: ❌ ${error.response?.data?.message || error.message}`);
    }
  }

  startSimulation(updateInterval = 30000) {
    console.log(`Starting GPS simulation for bus ${this.busId}`);
    
    this.sendLocationUpdate();
    
    this.simulationInterval = setInterval(() => {
      this.sendLocationUpdate();
    }, updateInterval);
  }

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      console.log(`Stopped GPS simulation for bus ${this.busId}`);
    }
  }
}

class GPSFleetSimulator {
  constructor() {
    this.activeBuses = new Map();
    console.log('Initializing GPS Fleet Simulator for Sri Lanka NTC');
  }

  startFleetSimulation(updateInterval = 30000) {
    console.log(`Starting simulation for ${BUS_FLEET.length} buses across ${Object.keys(ROUTES).length} routes`);
    
    BUS_FLEET.forEach((busConfig, index) => {
      setTimeout(() => {
        const simulator = new GPSSimulator(busConfig);
        simulator.startSimulation(updateInterval);
        this.activeBuses.set(busConfig.busId, simulator);
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

if (require.main === module) {
  const fleetSimulator = new GPSFleetSimulator();
  
  // Initialize trips first, then start simulation
  initializeTrips()
    .then(() => {
      console.log('\n🚀 Starting GPS fleet simulation...\n');
      fleetSimulator.startFleetSimulation(30000);
    })
    .catch(error => {
      console.error('Failed to initialize:', error);
      process.exit(1);
    });
  
  process.on('SIGINT', () => {
    console.log('\n\nShutting down GPS Fleet Simulator...');
    fleetSimulator.stopFleetSimulation();
    process.exit(0);
  });
}

module.exports = { GPSFleetSimulator, GPSSimulator };