export const humanReadableDistance = (distanceInMeters: number) => {
  if (distanceInMeters < 1000) {
    return `${distanceInMeters.toFixed(0)}m`
  } else {
    return `${(distanceInMeters / 1000).toFixed(1)}km`
  }
}
