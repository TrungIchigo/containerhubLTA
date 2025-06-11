interface GeocodeResult {
  lat: number;
  lng: number;
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