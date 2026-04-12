import { FaClock } from "react-icons/fa";
import { DAYS_OF_WEEK } from "../utils/constants";
import { formatTime } from "../utils/timeFormatters";

/**
 * Renders a sequential list of daily operating hours for a given establishment.
 *
 * @param {Object} props
 * @param {Array<Object>} props.hours - Standardized hours array (usually from the Yelp payload).
 * @returns {JSX.Element|null}
 */
const HoursSection = ({ hours }) => {
  if (!hours || !hours[0]?.open) return null;

  return (
    <div className="hours-section">
      <h3><FaClock className="section-icon" /> Hours</h3>
      <div className="hours-list">
        {DAYS_OF_WEEK.map((day, index) => {
          const dayHours = hours[0].open.find((h) => h.day === index);
          return (
            <div key={index} className="hours-item">
              <span className="day">{day}</span>
              <span className="time">
                {dayHours
                  ? `${formatTime(dayHours.start)} - ${formatTime(dayHours.end)}`
                  : "Closed"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HoursSection;
