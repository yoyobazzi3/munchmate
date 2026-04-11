/**
 * Validates the parameters provided during user signup.
 * Ensures all required fields are present and checks password strength constraints.
 * 
 * @param {Object} data - The request body data containing signup info.
 * @returns {Object} { isValid: true } on success, or { isValid: false, error: string } on failure.
 */
export const validateSignupParams = (data) => {
  const { firstName, lastName, email, password } = data;
  if (!firstName || !lastName || !email || !password) {
    return { isValid: false, error: "First name, last name, email, and password are required." };
  }
  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters." };
  }
  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one uppercase letter and one number." };
  }
  return { isValid: true };
};
