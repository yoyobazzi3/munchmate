import bcrypt from 'bcryptjs';
import { sendError, sendSuccess } from '../utils/responseHandler.js';
import userRepository from '../repositories/userRepository.js';
import { sendResetCode } from '../services/emailService.js';

const isDev = process.env.NODE_ENV !== 'production';

const forgotPasswordCtrl = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 'Email is required.', 400);

    const users = await userRepository.findByEmailWithReset(email);

    // Always respond the same way to prevent email enumeration
    if (!users.length) {
      return sendSuccess(res, { message: 'If that email exists, a reset code has been sent.' });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const hashedCode = await bcrypt.hash(code, 10);
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await userRepository.setResetCode(email, hashedCode, expires);
    await sendResetCode(email, code);

    const response = { message: 'If that email exists, a reset code has been sent.' };
    if (isDev) response.devCode = code;

    sendSuccess(res, response);
  } catch (error) {
    console.error('Forgot password error:', error);
    sendError(res, 'Failed to send reset code.', 500);
  }
};

export default forgotPasswordCtrl;
