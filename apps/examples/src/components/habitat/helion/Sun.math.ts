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

// totally stupid, should do this analytically/ mathematically
export function getMinMaxElevation(dayOfYear: number, latitude: number, longitude: number): [number, number] {
  let min = 90;
  let max = -90;
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const elevation = solarElevationAngle(hour, minute, dayOfYear, latitude, longitude);
      min = Math.min(min, elevation);
      max = Math.max(max, elevation);
    }
  }
  return [min, max];
}

function solarNoonTime(longitude: number, equationOfTime: number): number {
  const solarNoon = (720 - 4 * longitude - equationOfTime) / 1440;
  return solarNoon;
}

function equationOfTime(dayOfYear: number): number {
  const B = degreesToRadians((360 / 365) * (dayOfYear - 81));
  const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  return EoT;
}

function hourAngleForElevation(latitude: number, declination: number, elevation: number = 0): number {
  const latitudeRad = degreesToRadians(latitude);
  const declinationRad = degreesToRadians(declination);
  const elevationRad = degreesToRadians(elevation);

  const hourAngleRad = Math.acos(
      (Math.sin(elevationRad) - Math.sin(latitudeRad) * Math.sin(declinationRad)) /
      (Math.cos(latitudeRad) * Math.cos(declinationRad))
  );

  return radiansToDegrees(hourAngleRad);
}

export function sunriseSunsetTimes(dayOfYear: number, latitude: number, longitude: number): { sunrise: number, sunset: number } {
  const declination = solarDeclination(dayOfYear);
  const hourAngle = hourAngleForElevation(latitude, declination);

  const eot = equationOfTime(dayOfYear);
  const solarNoon = solarNoonTime(longitude, eot);

  const sunrise = solarNoon - (hourAngle * 4) / 1440;
  const sunset = solarNoon + (hourAngle * 4) / 1440;

  return { sunrise, sunset };
}

export function solarNoon(dayOfYear: number, longitude: number): number {
  const eot = equationOfTime(dayOfYear);
  return solarNoonTime(longitude, eot);
}
