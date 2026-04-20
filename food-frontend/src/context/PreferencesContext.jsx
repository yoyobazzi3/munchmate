import { createContext, useContext, useState, useEffect } from "react";
import { getPreferences, savePreferences as savePrefsService } from "../services/preferencesService";
import { useUser } from "./UserContext";

/**
 * Context for managing and distributing user food preferences globally.
 */
const PreferencesContext = createContext(null);

/**
 * Provider component that hydrates user preferences on load and exposes
 * them downstream alongside a mutation function to update them.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
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

  /**
   * Persists the given preferences to the backend and updates the local state.
   * 
   * @param {Object} prefs - The new preference parameters.
   * @returns {Promise<Object>} The updated preferences state.
   */
  const savePreferences = async (prefs) => {
    const updated = await savePrefsService(prefs);
    setPreferences(updated);
    return updated;
  };

  const refreshPreferences = async () => {
    try {
      const fresh = await getPreferences();
      setPreferences(fresh);
    } catch { /* silent */ }
  };

  return (
    <PreferencesContext.Provider value={{ preferences, loading, savePreferences, refreshPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
};

/**
 * Custom hook to securely consume the preferences state and updater globally.
 * 
 * @returns {{
 *   preferences: Object|null,
 *   loading: boolean,
 *   savePreferences: (prefs: Object) => Promise<Object>
 * }}
 */
export const usePreferences = () => useContext(PreferencesContext);
