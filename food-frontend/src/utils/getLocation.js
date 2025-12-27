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
          enableHighAccuracy: false, // Try false first, might be more reliable if GPS is weak
          timeout: 10000, // Wait 10 seconds
          maximumAge: 0 // Force a fresh location reading
        }
      );
    } else {
      // Reject with an object containing a user-friendly message
      reject({ message: "Geolocation is not supported by your browser." });
    }
  });
};

// Example usage:
getUserLocation()
.then(coords => {
  console.log("Location found:", coords);
  // Do something with coords.latitude and coords.longitude
})
.catch(errorInfo => {
  console.error("Failed to get location:", errorInfo.message);
  // Display errorInfo.message to the user
  // You can still access the original error via errorInfo.originalError if needed
});