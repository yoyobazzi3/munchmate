import fetch from "node-fetch";

/**
 * Controller specifically structured to manage external proxying networks.
 * Resolves browser CORS blocking policies naturally and prevents accidental
 * outbound exposure of backend environment secrets.
 */
const proxyCtrl = {
  /**
   * Streams Google Places imagery data back natively avoiding frontend API exposure.
   * Automatically validates photo reference formatting maliciously stopping deep traversal.
   * 
   * @param {Object} req - Express request with specific `ref` and pixel `w` bounds.
   * @param {Object} res - Express response stream pushing the binary image.
   */
  imageProxy: async (req, res) => {
    const { ref, w } = req.query;

    if (!ref || !/^places\/[^/]+\/photos\/[^/]+$/.test(ref)) {
      return res.status(400).json({ error: "Invalid image reference parsing parameters." });
    }

    // Force secure bounds bounding width between browser size or 1600x
    const width = Math.min(parseInt(w) || 400, 1600);
    
    try {
      const apiKey = process.env.PLACES_API_KEY;
      const upstream = await fetch(
        `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=${width}&key=${apiKey}`
      );
      
      if (!upstream.ok) return res.status(upstream.status).end();
      
      const contentType = upstream.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400"); // Cache permanently locally
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      
      upstream.body.pipe(res);
    } catch {
      res.status(502).end();
    }
  },

  /**
   * Reverses raw geometric coordinates safely back to readable city strings.
   * OpenStreetMap Nominatim harshly blocks browser CORS requests — so we bypass natively via node.
   * 
   * @param {Object} req - Express request housing strict JSON lat/lon metrics.
   * @param {Object} res - Express response pushing final mapped JSON payload mapping.
   */
  reverseGeocode: async (req, res) => {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: "Strict latitude and longitude parameters required." });
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
        { headers: { "User-Agent": "MunchMate/1.0" } }
      );
      
      const data = await response.json();
      res.json(data);
    } catch {
      res.status(500).json({ error: "Geometric geocoding conversion completely failed." });
    }
  }
};

export default proxyCtrl;
