const Station = require('../models/Station');
const Vehicle = require('../models/Vehicle');

// Simple Haversine distance formula
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

exports.planRoute = async (req, res) => {
  try {
    const { start, destination, vehicleId, modelName, tankCapacityKg, currentFuelPct } = req.body;
    
    if (!start || !destination || start.lat === undefined || destination.lat === undefined) {
      return res.status(400).json({ message: 'Start and destination coordinates are required' });
    }

    const totalDistanceKm = parseFloat(getDistance(start.lat, start.lng, destination.lat, destination.lng).toFixed(1));
    const estimatedTimeMins = Math.round((totalDistanceKm / 55) * 60); // 55 km/h average traffic speed

    let capacity = Number(tankCapacityKg) || 5.6; // standard 5.6kg default
    let fuelLevelPct = currentFuelPct !== undefined ? Number(currentFuelPct) : 70;
    let efficiency = 0.95; // 0.95 kg H2 per 100km

    if (vehicleId) {
      const vehicle = await Vehicle.findById(vehicleId);
      if (vehicle) {
        capacity = vehicle.tankCapacityKg || capacity;
        fuelLevelPct = vehicle.currentFuelLevelPct !== undefined ? vehicle.currentFuelLevelPct : fuelLevelPct;
        efficiency = vehicle.efficiencyKgPer100Km || efficiency;
      }
    }

    const currentFuelKg = (fuelLevelPct / 100) * capacity;
    const maxRangeKm = Math.round((currentFuelKg / efficiency) * 100);
    const fuelNeededTotalKg = parseFloat(((totalDistanceKm / 100) * efficiency).toFixed(2));
    const needsRefuel = maxRangeKm < totalDistanceKm;
    const remainingRangeAtDestinationKm = Math.max(0, maxRangeKm - totalDistanceKm);

    // Fetch active & operational stations
    const stations = await Station.find({ status: { $in: ['operational', 'active'] } });
    
    const midLat = (start.lat + destination.lat) / 2;
    const midLng = (start.lng + destination.lng) / 2;

    const stationsWithMetrics = stations.map(s => {
      const sLat = s.location?.coordinates?.[1] || 0;
      const sLng = s.location?.coordinates?.[0] || 0;
      const distFromStart = getDistance(start.lat, start.lng, sLat, sLng);
      const distFromDest = getDistance(sLat, sLng, destination.lat, destination.lng);
      const distFromMid = getDistance(midLat, midLng, sLat, sLng);
      const detourKm = parseFloat(Math.max(0, (distFromStart + distFromDest) - totalDistanceKm).toFixed(1));
      
      return {
        _id: s._id,
        name: s.name,
        status: s.status,
        coordinates: [sLat, sLng],
        pricePerKg: s.pricePerKg || 16,
        availablePumps: s.availablePumps || 2,
        totalPumps: s.totalPumps || 4,
        queueLength: s.queueLength || 0,
        waitTime: s.waitTime || 5,
        distFromStart: parseFloat(distFromStart.toFixed(1)),
        distFromMid: parseFloat(distFromMid.toFixed(1)),
        detourKm
      };
    });

    // Rank stations by least detour distance and highest pump availability
    stationsWithMetrics.sort((a, b) => a.detourKm - b.detourKm || b.availablePumps - a.availablePumps);

    const recommendedStop = stationsWithMetrics.length > 0 ? stationsWithMetrics[0] : null;

    // Environmental stats
    const co2SavedKg = parseFloat((totalDistanceKm * 0.12).toFixed(1)); // ~120g CO2 saved per km vs ICE

    // Generate intermediate path waypoints for smooth map rendering
    const waypoints = [
      [start.lat, start.lng],
      ...(recommendedStop && needsRefuel ? [recommendedStop.coordinates] : [[midLat, midLng]]),
      [destination.lat, destination.lng]
    ];

    res.json({
      success: true,
      data: {
        totalDistanceKm,
        estimatedTimeMins,
        currentFuelKg: parseFloat(currentFuelKg.toFixed(2)),
        maxRangeKm,
        fuelNeededTotalKg,
        needsRefuel,
        remainingRangeAtDestinationKm,
        co2SavedKg,
        recommendedStop,
        allCorridorStations: stationsWithMetrics.slice(0, 5),
        waypoints
      }
    });

  } catch (error) {
    console.error('Route Plan Error:', error);
    res.status(500).json({ message: 'Failed to plan route' });
  }
};
