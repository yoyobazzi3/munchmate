import bcrypt from 'bcryptjs';
import { sendError, sendSuccess } from '../utils/responseHandler.js';
import userRepository from '../repositories/userRepository.js';

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
    if (!users.length) return sendError(res, 'Invalid or expired reset code.', 400);

    const user = users[0];

    if (!user.reset_code || !user.reset_code_expires) {
      return sendError(res, 'Invalid or expired reset code.', 400);
    }

    if (new Date() > new Date(user.reset_code_expires)) {
      return sendError(res, 'Reset code has expired. Please request a new one.', 400);
    }

    const codeMatches = await bcrypt.compare(code, user.reset_code);
    if (!codeMatches) return sendError(res, 'Invalid or expired reset code.', 400);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(user.id, hashedPassword);
    await userRepository.clearResetCode(user.id);

    sendSuccess(res, { message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    sendError(res, 'Failed to reset password.', 500);
  }
};

export default resetPasswordCtrl;
