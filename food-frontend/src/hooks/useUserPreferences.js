import { useState, useEffect } from "react";
import { getPreferences, savePreferences as savePrefsService } from "../services/preferencesService";

/**
 * useUserPreferences — loads the current user's preferences on mount and
 * exposes a save function that keeps the local state in sync.
 *
 * @param {Object}  [options]
 * @param {boolean} [options.enabled=true] - Set to false to skip the fetch
 *   (e.g. for unauthenticated users where the request would 401).
 *
 * @returns {{
 *   preferences: Object|null,
 *   loading: boolean,
 *   error: any,
 *   savePreferences: (prefs: Object) => Promise<Object>
 * }}
 */
const useUserPreferences = ({ enabled = true } = {}) => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    getPreferences()
      .then(setPreferences)
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [enabled]);

  const savePreferences = async (prefs) => {
    const updated = await savePrefsService(prefs);
    setPreferences(updated);
    return updated;
  };

  return { preferences, loading, error, savePreferences };
};

export default useUserPreferences;
