
// Save the token to localStorage
export const saveToken = (token) => {
    localStorage.setItem('token', token);
  };
  
  // Retrieve the token from localStorage
  export const getToken = () => {
    return localStorage.getItem('token');
  };
  
  // Remove the token from localStorage
  export const removeToken = () => {
    localStorage.removeItem('token');
  };