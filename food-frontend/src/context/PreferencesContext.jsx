import { createContext, useContext, useState, useEffect } from "react";
import { getPreferences, savePreferences as savePrefsService } from "../services/preferencesService";
import { useUser } from "./UserContext";

const PreferencesContext = createContext(null);

export const PreferencesProvider = ({ children }) => {
  const { user } = useUser();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch preferences whenever the user changes.
  // Clears automatically on logout (user → null).
  useEffect(() => {
    if (!user) {
      setPreferences(null);
      return;
    }
    setLoading(true);
    getPreferences()
      .then(setPreferences)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const savePreferences = async (prefs) => {
    const updated = await savePrefsService(prefs);
    setPreferences(updated);
    return updated;
  };

  return (
    <PreferencesContext.Provider value={{ preferences, loading, savePreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => useContext(PreferencesContext);
