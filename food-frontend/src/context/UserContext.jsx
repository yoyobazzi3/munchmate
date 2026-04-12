import { createContext, useContext, useState } from "react";
import { getUser, saveUser, clearUser } from "../utils/tokenService";

/**
 * Global context to synchronize the active user's authentication and profile state.
 */
const UserContext = createContext(null);

/**
 * Top-level provider that initializes user boundaries using local storage state,
 * and distributes login/logout mutation callbacks for centralized access.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => getUser());

  /**
   * Persists a new authenticated session context locally and broadcasts globally.
   *
   * @param {Object} userData - Serialized profile object.
   */
  const loginUser = (userData) => {
    saveUser(userData);
    setUser(userData);
  };

  /**
   * Discards the active user session boundaries and cleans memory traces.
   */
  const logoutUser = () => {
    clearUser();
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, loginUser, logoutUser }}>
      {children}
    </UserContext.Provider>
  );
};

/**
 * Convenient custom hook for deep components to safely read and mutate user sessions.
 *
 * @returns {{
 *   user: Object|null,
 *   loginUser: (userData: Object) => void,
 *   logoutUser: () => void
 * }}
 */
export const useUser = () => useContext(UserContext);
