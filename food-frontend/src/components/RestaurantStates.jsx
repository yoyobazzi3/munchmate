import { FaUtensils } from "react-icons/fa";

export const LoadingState = () => (
  <div className="loading-container">
    <div className="loading-animation"><FaUtensils className="loading-icon" /></div>
    <p className="loading-text">Finding delicious restaurants near you...</p>
  </div>
);

export const EmptyResultsState = () => (
  <div className="empty-results-container">
    <div className="empty-icon">🍽️</div>
    <h3>No Restaurants Found</h3>
    <p>We couldn't find any restaurants matching your criteria.</p>
    <p>Try adjusting your filters or search terms.</p>
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="error-container">
    <div className="error-icon">⚠️</div>
    <h3>Oops! Something went wrong</h3>
    <p>{message}</p>
    <button className="retry-button" onClick={onRetry}>Try Again</button>
  </div>
);
