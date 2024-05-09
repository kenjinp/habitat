function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

function solarDeclination(dayOfYear: number): number {
  const declination = 23.44 * Math.sin(degreesToRadians((360 / 365) * (dayOfYear - 81)));
  return declination;
}

function solarHourAngle(hour: number, minute: number, longitude: number): number {
  const fractionalHour = hour + minute / 60;
  const solarTime = fractionalHour + (longitude / 15);
  const hourAngle = 15 * (solarTime - 12);
  return hourAngle;
}

function solarElevationAngle(hour: number, minute: number, dayOfYear: number, latitude: number, longitude: number): number {
  const declination = degreesToRadians(solarDeclination(dayOfYear));
  const latitudeRad = degreesToRadians(latitude);
  const hourAngleRad = degreesToRadians(solarHourAngle(hour, minute, longitude));
  
  const elevationRad = Math.asin(Math.sin(latitudeRad) * Math.sin(declination) +
      Math.cos(latitudeRad) * Math.cos(declination) * Math.cos(hourAngleRad));
  
  return radiansToDegrees(elevationRad);
}

// Example usage:
// New York (Latitude: 40.7128, Longitude: -74.0060)
// On the 172nd day of the year (June 21st - Summer Solstice)
// At 0.5 of the day (midday)
export function sunElevation(dayFraction: number, dayOfYear: number, latitude: number, longitude: number): number {
  // Convert dayFraction (0.0 to 1.0) to hours and minutes
  const totalMinutesInDay = 24 * 60;
  const totalMinutes = Math.round(dayFraction * totalMinutesInDay);
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  
  return solarElevationAngle(hour, minute, dayOfYear, latitude, longitude);
}