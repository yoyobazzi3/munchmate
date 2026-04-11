import fetch from "node-fetch";

/**
 * Fetches places from the Google Places API using a POST textSearch request.
 * Abstracted to handle pagination and error handling centrally.
 * 
 * @param {string} url - The Google Places API endpoint URL.
 * @param {Object} body - The JSON body to send in the request.
 * @param {string} apiKey - The Google API key.
 * @param {string} fieldMask - Comma-separated list of fields to return.
 * @param {number} [maxPages=1] - Maximum number of pages to fetch.
 * @returns {Promise<Array>} List of raw place objects from the API.
 * @throws Will throw an error if the initial API request fails.
 */
export const fetchGooglePlaces = async (url, body, apiKey, fieldMask, maxPages = 1) => {
  let allPlaces = [];
  let pageToken = null;

  for (let page = 0; page < maxPages; page++) {
    const requestBody = { ...body };
    if (pageToken) requestBody.pageToken = pageToken;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      if (page === 0) {
        console.error("Places API error:", data);
        const error = new Error("Failed to fetch from Google Places");
        error.status = response.status;
        throw error;
      }
      break;
    }

    allPlaces = allPlaces.concat(data.places || []);
    pageToken = data.nextPageToken || null;
    if (!pageToken) break;
  }

  return allPlaces;
};

/**
 * Fetches the granular details for a specific place by its ID.
 * 
 * @param {string} id - The unique Google Place ID.
 * @param {string} apiKey - The Google API key.
 * @param {string} fieldMask - Comma-separated list of fields to return.
 * @returns {Promise<Object>} The raw JSON details object directly from the API.
 * @throws Will throw an error if the request fails completely.
 */
export const fetchGooglePlaceDetails = async (id, apiKey, fieldMask) => {
  const url = `https://places.googleapis.com/v1/places/${id}`;
  const response = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
    },
  });

  if (!response.ok) {
    const err = await response.json();
    const error = new Error(err.message || "Failed to fetch place details");
    error.status = response.status;
    error.details = err;
    throw error;
  }

  return response.json();
};
