import pool from '../config/db.js';

const getRestaurantCtrl = {
  /**
   * Fetches all restaurants from the database.
   */
  getAllRestaurants: async (req, res) => {
    try {
      const [restaurants] = await pool.query("SELECT * FROM restaurants");

      res.status(200).json({ message: "Restaurants fetched successfully", restaurants });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  }
};

export default getRestaurantCtrl;
