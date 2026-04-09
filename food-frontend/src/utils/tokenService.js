export const saveToken = (token) => localStorage.setItem('token', token);
export const getToken = () => localStorage.getItem('token');
export const removeToken = () => localStorage.removeItem('token');

export const saveRefreshToken = (token) => localStorage.setItem('refreshToken', token);
export const getRefreshToken = () => localStorage.getItem('refreshToken');
export const removeRefreshToken = () => localStorage.removeItem('refreshToken');

export const clearAllTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};