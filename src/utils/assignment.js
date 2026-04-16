export const ASSIGNMENT_WEIGHTS = {
  distance: 0.5,
  activeOrders: 0.3,
  rating: 0.2,
};

export const calculateDistance = (driverLocation, pickupLocation) => {
  const driverLat = Number(driverLocation?.lat ?? 0);
  const driverLng = Number(driverLocation?.lng ?? 0);
  const pickupLat = Number(pickupLocation?.lat ?? 0);
  const pickupLng = Number(pickupLocation?.lng ?? 0);

  const deltaLat = driverLat - pickupLat;
  const deltaLng = driverLng - pickupLng;

  return Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng);
};

export const calculateAssignmentScore = (driver, pickupLocation) => {
  const driverLocation = driver.currentLocation || {
    lat: driver.lat,
    lng: driver.lng,
  };

  const distance = calculateDistance(driverLocation, pickupLocation);
  const activeOrders = Number(driver.activeOrdersCount || 0);
  const rating = Number(driver.rating || 0);

  const score =
    distance * ASSIGNMENT_WEIGHTS.distance +
    activeOrders * ASSIGNMENT_WEIGHTS.activeOrders -
    rating * ASSIGNMENT_WEIGHTS.rating;

  return {
    score,
    distance,
    activeOrders,
    rating,
  };
};

export const rankDriversForOrder = (drivers, pickupLocation) => {
  return [...drivers]
    .map((driver) => {
      const result = calculateAssignmentScore(driver, pickupLocation);
      return {
        ...driver,
        assignmentScore: result.score,
        assignmentMeta: result,
      };
    })
    .sort((a, b) => {
      if (a.assignmentScore === b.assignmentScore) {
        return a.assignmentMeta.distance - b.assignmentMeta.distance;
      }
      return a.assignmentScore - b.assignmentScore;
    });
};

export const selectBestDriver = (drivers, pickupLocation) => {
  const ranked = rankDriversForOrder(drivers, pickupLocation);
  return ranked[0] || null;
};
