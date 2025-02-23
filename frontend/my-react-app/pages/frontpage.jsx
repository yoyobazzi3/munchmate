import React from 'react';
import { Link } from 'react-router-dom';

const Frontpage = () => {
  return (
    <div className="frontpage-container">
      <h1>Hello World</h1>
      <p>Welcome to the front page!</p>
      <div className="auth-links">
        <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
      </div>
    </div>
  );
};

export default Frontpage;
