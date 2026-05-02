import { useState, useEffect } from "react";
import { verify } from "../services/authService";
import { useUser } from "./useUser";

/**
 * useAuth — verifies the current session by calling GET /auth/verify.
 * The browser automatically sends the HttpOnly accessToken cookie.
 *
 * @returns {{ authState: "checking" | "ok" | "fail" }}
 */
const useAuth = () => {
  const [authState, setAuthState] = useState("checking");
  const { logoutUser } = useUser();

  useEffect(() => {
    verify()
      .then(() => setAuthState("ok"))
      .catch(() => {
        logoutUser();
        setAuthState("fail");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { authState };
};

export default useAuth;
