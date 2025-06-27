interface GeocodeResult {
  lat: number;
  lng: number;
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("Google Maps API Key is not configured.");
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}&language=vi`; // Thêm language=vi để ưu tiên kết quả ở VN

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Maps API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results[0]) {
      console.warn(`Geocoding failed for address: "${address}". Status: ${data.status}`);
      return null;
    }

    const location = data.results[0].geometry.location; // { lat: number, lng: number }
    return location;

  } catch (error) {
    console.error("Error during geocoding:", error);
    return null;
  }
} 