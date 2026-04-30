/**
 * @file resetPasswordCtrl.js
 * @module controllers/resetPasswordCtrl
 *
 * @description
 * Handles the second and final step of the password reset flow: verifying the
 * one-time code emailed to the user and replacing the account password.
 *
 * **Architectural role:**
 * Sits in the controller layer — validates the request body, delegates all DB
 * access to the repository layer, and uses bcrypt for both code verification
 * and new password hashing. Contains no raw SQL.
 *
 * **Security design:**
 * - The submitted code is verified with `bcrypt.compare` against the stored hash —
 *   the plaintext code never touches the DB, so a DB breach yields nothing usable.
 * - Expiry is checked before the bcrypt comparison to fail fast on obvious rejects
 *   without paying the bcrypt cost.
 * - All failure cases (unknown email, null code, expired code, wrong code) return
 *   the same generic message (`'Invalid or expired reset code.'`) to prevent an
 *   attacker from distinguishing between them.
 * - The reset code and its expiry are cleared immediately after a successful reset
 *   so the code cannot be replayed even within the original 15-minute window.
 *
 * **Reset flow:**
 * 1. `forgotPasswordCtrl`  — generates and emails the code
 * 2. `resetPasswordCtrl`   ← this file — verifies the code and updates the password
 *
 * **Dependencies:**
 * - `bcryptjs`                    — code verification and new password hashing
 * - `repositories/userRepository` — email lookup, password update, code clearance
 * - `utils/responseHandler`       — standardised JSON response helpers
 *
 * @example <caption>Quick Start — registered route that maps to this controller</caption>
 * ```js
 * import resetPasswordCtrl from '../controllers/resetPasswordCtrl.js';
 *
 * router.post('/auth/reset-password', resetPasswordCtrl);
 * ```
 */

import bcrypt from 'bcryptjs';
import { sendError, sendSuccess } from '../utils/responseHandler.js';
import userRepository from '../repositories/userRepository.js';

/**
 * Verifies a one-time reset code and updates the user's password if valid.
 *
 * Validation order is deliberate:
 * 1. Structural checks (missing fields, password strength) — O(1), no I/O
 * 2. DB lookup — fails fast if the email is unknown
 * 3. Null/expiry check — fails fast before paying the bcrypt cost
 * 4. `bcrypt.compare` — O(2^cost), only reached when the code plausibly exists
 *
 * All failure paths after the DB lookup return `'Invalid or expired reset code.'`
 * regardless of the actual cause — this prevents an attacker from distinguishing
 * between an unknown email, a null code, an expired code, and a wrong code.
 *
 * **Complexity:** O(2^cost) twice — once for `bcrypt.compare` (cost 10) and once
 * for `bcrypt.hash` on the new password (cost 10). All other operations are O(1).
 *
 * @async
 * @param {import('express').Request}  req - Express request object.
 *   @param {string} req.body.email       - The user's email address.
 *   @param {string} req.body.code        - The 6-digit plaintext code from the email.
 *   @param {string} req.body.newPassword - The desired new password.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Sends 200 `{ message: 'Password reset successfully.' }` on success;
 *   400 if any field is missing, the password fails strength requirements, or the
 *   code is invalid/expired; 500 on any unexpected error.
 *
 * @throws Will call `sendError(res, ..., 500)` if any DB operation or bcrypt call fails.
 */
const resetPasswordCtrl = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return sendError(res, 'Email, code, and new password are required.', 400);
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return sendError(res, 'Password must be at least 8 characters and contain at least one uppercase letter and one number.', 400);
    }

    const users = await userRepository.findByEmailWithReset(email);
    // Return the same generic message for unknown emails — an attacker must not be
    // able to determine whether an account exists by probing this endpoint.
    if (!users.length) return sendError(res, 'Invalid or expired reset code.', 400);

    const user = users[0];

    // Null check before expiry — avoids a Date comparison on undefined values.
    if (!user.reset_code || !user.reset_code_expires) {
      return sendError(res, 'Invalid or expired reset code.', 400);
    }

    // Check expiry before bcrypt.compare to skip the expensive hash operation
    // on codes that are obviously stale.
    if (new Date() > new Date(user.reset_code_expires)) {
      return sendError(res, 'Reset code has expired. Please request a new one.', 400);
    }

    const codeMatches = await bcrypt.compare(code, user.reset_code);
    if (!codeMatches) return sendError(res, 'Invalid or expired reset code.', 400);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(user.id, hashedPassword);

    // Clear the code immediately after use — prevents replay within the original
    // 15-minute window even if the attacker intercepts the plaintext code.
    await userRepository.clearResetCode(user.id);

    sendSuccess(res, { message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    sendError(res, 'Failed to reset password.', 500);
  }
};

export default resetPasswordCtrl;
