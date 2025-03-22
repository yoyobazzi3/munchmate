import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const YELP_API_KEY = process.env.YELP_API_KEY;

const getRestaurantDetails = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Missing restaurant ID" });

  try {
    const yelpRes = await fetch(`https://api.yelp.com/v3/businesses/${id}`, {
      headers: {
        Authorization: `Bearer ${YELP_API_KEY}`
      }
    });

    if (!yelpRes.ok) {
      const err = await yelpRes.json();
      return res.status(yelpRes.status).json({ error: err });
    }

    const data = await yelpRes.json();
    res.json(data);
  } catch (err) {
    console.error("Error fetching details:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default { getRestaurantDetails };