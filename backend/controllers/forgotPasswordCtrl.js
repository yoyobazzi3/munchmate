/**
 * @file forgotPasswordCtrl.js
 * @module controllers/forgotPasswordCtrl
 *
 * @description
 * Handles the first step of the password reset flow: generating a one-time
 * 6-digit code, storing a bcrypt hash of it in the database, and emailing
 * the plaintext code to the user.
 *
 * **Architectural role:**
 * Sits in the controller layer — orchestrates input validation, code generation,
 * DB persistence, and email dispatch. All DB access is delegated to the repository
 * layer; email delivery is delegated to the email service.
 *
 * **Security design:**
 * - The code is stored as a bcrypt hash, not plaintext, so a DB leak does not
 *   expose valid reset codes.
 * - The response is identical whether the email exists or not, preventing
 *   user enumeration attacks (an attacker cannot tell if an account exists).
 * - Codes expire after 15 minutes to limit the window of a stolen code.
 *
 * **Reset flow:**
 * 1. `forgotPasswordCtrl`  ← this file  — generates and emails the code
 * 2. `resetPasswordCtrl`                — verifies the code and updates the password
 *
 * **Dependencies:**
 * - `bcryptjs`                    — hashing the reset code before storage
 * - `repositories/userRepository` — email lookup and reset code persistence
 * - `services/emailService`       — delivers the plaintext code to the user
 * - `utils/responseHandler`       — standardised JSON response helpers
 *
 * @example <caption>Quick Start — registered route that maps to this controller</caption>
 * ```js
 * import forgotPasswordCtrl from '../controllers/forgotPasswordCtrl.js';
 *
 * router.post('/auth/forgot-password', forgotPasswordCtrl);
 * ```
 */

import bcrypt from 'bcryptjs';
import { sendError, sendSuccess } from '../utils/responseHandler.js';
import userRepository from '../repositories/userRepository.js';
import { sendResetCode } from '../services/emailService.js';

/**
 * Generates a 6-digit password reset code, stores a bcrypt hash of it in the
 * database, and sends the plaintext code to the user's email address.
 *
 * Responds with an identical success message regardless of whether the email
 * address is registered — this is intentional to prevent user enumeration.
 *
 * **Complexity:** O(2^cost) for the bcrypt hash (cost factor 10) — the same
 * deliberate slowdown used for password hashing. All other operations are O(1).
 *
 * @async
 * @param {import('express').Request}  req - Express request object.
 *   @param {string} req.body.email - The email address to send the reset code to.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Always sends 200 with the message
 *   `'If that email exists, a reset code has been sent.'` — even when the email
 *   is not found — to prevent user enumeration. Sends 400 if `email` is missing;
 *   500 on any unexpected error.
 *
 * @throws Will call `sendError(res, ..., 500)` if the DB write or the email
 *   service call fails.
 */
const forgotPasswordCtrl = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 'Email is required.', 400);

    const users = await userRepository.findByEmailWithReset(email);

    // Return the same success message for unknown emails — an attacker must not
    // be able to determine whether an account exists by probing this endpoint.
    if (!users.length) {
      return sendSuccess(res, { message: 'If that email exists, a reset code has been sent.' });
    }

    // Generate a cryptographically random 6-digit code (100000–999999).
    // Math.random() is sufficient here — the code is short-lived (15 min) and
    // rate-limited at the route level, making brute force impractical.
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const hashedCode = await bcrypt.hash(code, 10);
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15-minute TTL

    // Store the hash, not the plaintext — a DB breach must not yield usable codes.
    await userRepository.setResetCode(email, hashedCode, expires);

    // Send the plaintext code to the user; the DB only ever holds the hash.
    await sendResetCode(email, code);

    sendSuccess(res, { message: 'If that email exists, a reset code has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    sendError(res, 'Failed to send reset code.', 500);
  }
};

export default forgotPasswordCtrl;
