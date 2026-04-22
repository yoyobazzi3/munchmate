import { FaUtensils } from "react-icons/fa";

/**
 * Loading indicator rendered while executing restaurant queries.
 * @returns {JSX.Element}
 */
export const LoadingState = () => (
  <div className="loading-container">
    <div className="loading-animation"><FaUtensils className="loading-icon" /></div>
    <p className="loading-text">Finding delicious restaurants near you...</p>
  </div>
);

/**
 * Fallback feedback UI rendered when a location/filter combination yields zero matches.
 * @returns {JSX.Element}
 */
export const EmptyResultsState = () => (
  <div className="empty-results-container">
    <div className="empty-icon">🍽️</div>
    <h3>No Restaurants Found</h3>
    <p>We couldn't find any restaurants matching your criteria.</p>
    <p>Try adjusting your filters or search terms.</p>
  </div>
);

/**
 * Shown when no geolocation or text location is available.
 * @returns {JSX.Element}
 */
export const NoLocationState = ({ onRequestLocation }) => (
  <div className="empty-results-container">
    <div className="empty-icon">📍</div>
    <h3>Location Not Available</h3>
    <p>We need your location to show restaurants near you.</p>
    {onRequestLocation && (
      <button className="retry-button" onClick={onRequestLocation}>
        Share My Location
      </button>
    )}
  </div>
);

/**
 * Granular error UI element displayed upon a failed network resolution or tracking failure.
 *
 * @param {Object} props
 * @param {string} props.message - User-friendly error message description.
 * @param {function():void} props.onRetry - Callback to re-attempt the failed operation.
 * @returns {JSX.Element}
 */
export const ErrorState = ({ message, onRetry }) => (
  <div className="error-container">
    <div className="error-icon">⚠️</div>
    <h3>Oops! Something went wrong</h3>
    <p>{message}</p>
    <button className="retry-button" onClick={onRetry}>Try Again</button>
  </div>
);
