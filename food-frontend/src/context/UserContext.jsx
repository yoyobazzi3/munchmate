import { useState } from "react";
import { getUser, saveUser, clearUser } from "../utils/tokenService";
import { UserContext } from "../hooks/useUser";

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
