import { FaMapMarkerAlt, FaSlidersH, FaMagic } from "react-icons/fa";

const HowItWorks = () => (
  <div id="how-it-works" className="how-it-works-v2">
    <div className="hiw-header">
      <h2>How It Works</h2>
      <p>Finding your next favorite restaurant is as easy as 1-2-3</p>
    </div>

    <div className="hiw-steps">
      <div className="hiw-step">
        <div className="hiw-step-icon-wrapper">
          <span className="hiw-step-num">01</span>
          <div className="hiw-icon-box"><FaMapMarkerAlt /></div>
        </div>
        <h3>Share Your Location</h3>
        <p>Enable location services or enter your address to find the best restaurants nearby.</p>
      </div>

      <div className="hiw-connector" />

      <div className="hiw-step">
        <div className="hiw-step-icon-wrapper">
          <span className="hiw-step-num">02</span>
          <div className="hiw-icon-box"><FaSlidersH /></div>
        </div>
        <h3>Set Your Preferences</h3>
        <p>Filter by cuisine, price range, dietary restrictions, and more to match your taste.</p>
      </div>

      <div className="hiw-connector" />

      <div className="hiw-step">
        <div className="hiw-step-icon-wrapper">
          <span className="hiw-step-num">03</span>
          <div className="hiw-icon-box"><FaMagic /></div>
        </div>
        <h3>Discover &amp; Enjoy</h3>
        <p>Browse personalized AI recommendations and find your perfect meal in minutes.</p>
      </div>
    </div>
  </div>
);

export default HowItWorks;
