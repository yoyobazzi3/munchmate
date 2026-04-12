import { useState, useEffect } from "react";
import { verify } from "../services/authService";
import { clearUser } from "../utils/tokenService";

/**
 * useAuth — verifies the current session by calling GET /auth/verify.
 * The browser automatically sends the HttpOnly accessToken cookie.
 *
 * @returns {{ authState: "checking" | "ok" | "fail" }}
 */
const useAuth = () => {
  const [authState, setAuthState] = useState("checking");

  useEffect(() => {
    verify()
      .then(() => setAuthState("ok"))
      .catch(() => {
        clearUser();
        setAuthState("fail");
      });
  }, []);

  return { authState };
};

export default useAuth;
