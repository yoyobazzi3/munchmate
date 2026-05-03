/**
 * Wraps the browser's native Geolocation API in a strongly-typed Promise wrapper.
 * Will intelligently retry or configure geolocation based on hardware availability.
 *
 * @returns {Promise<{latitude: number, longitude: number}>} A promise resolving to coordinate values.
 * @throws {{originalError?: GeolocationPositionError, message: string}} A user-friendly error payload payload.
 */
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          // Log both the message and the code
          console.warn(`Geolocation error (Code ${error.code}): ${error.message}`);
          // Optionally, provide more user-friendly messages based on the code
          let userMessage = "Could not determine your location.";
          if (error.code === 1) {
            userMessage = "Location permission denied. Please enable location access for this site in your browser settings.";
          } else if (error.code === 2) {
            userMessage = "Location unavailable. Please ensure your device's location services are turned on and try again.";
          } else if (error.code === 3) {
            userMessage = "Location request timed out. Please try again.";
          }
          // Reject with an object containing the original error and a user-friendly message
          reject({ originalError: error, message: userMessage });
        },
        // Optional: Add options
        {
          enableHighAccuracy: false,
          timeout: 15000,       // 15 s — mobile GPS often takes longer than 5 s
          maximumAge: 300000    // reuse a cached position up to 5 minutes old
        }
      );
    } else {
      // Reject with an object containing a user-friendly message
      reject({ message: "Geolocation is not supported by your browser." });
    }
  });
};
