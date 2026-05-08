export function calculateSpeed(lat1, lon1, lat2, lon2, time1, time2) {
  // Haversine formula
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // distance in km
  
  // Time difference in hours
  const timeDiffHours = Math.abs(time2 - time1) / 3600;
  
  if (timeDiffHours === 0) return 0;
  
  return distance / timeDiffHours;
}
