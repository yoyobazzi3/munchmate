import { createContext, useContext, useState } from "react";
import { getUser, saveUser, clearUser } from "../utils/tokenService";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => getUser());

  const loginUser = (userData) => {
    saveUser(userData);
    setUser(userData);
  };

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

export const useUser = () => useContext(UserContext);
