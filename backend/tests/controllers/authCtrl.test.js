import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all external dependencies before importing the controller
vi.mock('../../repositories/userRepository.js', () => ({
  default: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    createUser: vi.fn(),
    createPreferences: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock('../../utils/jwtUtils.js', () => ({
  generateAccessToken: vi.fn().mockReturnValue('mock-access-token'),
  generateRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
}));

import authCtrl from '../../controllers/authCtrl.js';
import userRepository from '../../repositories/userRepository.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.cookie = vi.fn().mockReturnValue(res);
  res.clearCookie = vi.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => vi.clearAllMocks());

// ── signup ────────────────────────────────────────────────────────────────────

describe('authCtrl.signup', () => {
  const validBody = {
    firstName: 'John', lastName: 'Doe',
    email: 'john@example.com', password: 'Password1',
    favoriteCuisines: ['Italian'], priceRange: '$$',
  };

  it('creates user and responds 201 on valid input', async () => {
    bcrypt.hash.mockResolvedValue('hashed');
    userRepository.createUser.mockResolvedValue({ insertId: 1 });
    userRepository.createPreferences.mockResolvedValue();

    const req = { body: validBody };
    const res = mockRes();

    await authCtrl.signup(req, res);

    expect(userRepository.createUser).toHaveBeenCalledWith('John', 'Doe', 'john@example.com', 'hashed');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });

  it('returns 400 when required fields are missing', async () => {
    const req = { body: { firstName: 'John' } };
    const res = mockRes();

    await authCtrl.signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(userRepository.createUser).not.toHaveBeenCalled();
  });

  it('returns 400 when password is too weak', async () => {
    const req = { body: { ...validBody, password: 'weak' } };
    const res = mockRes();

    await authCtrl.signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ── login ─────────────────────────────────────────────────────────────────────

describe('authCtrl.login', () => {
  const user = { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com', password_hash: 'hashed' };

  it('sets cookies and responds 200 on valid credentials', async () => {
    userRepository.findByEmail.mockResolvedValue([user]);
    bcrypt.compare.mockResolvedValue(true);

    const req = { body: { email: 'john@example.com', password: 'Password1' } };
    const res = mockRes();

    await authCtrl.login(req, res);

    expect(res.cookie).toHaveBeenCalledWith('accessToken', 'mock-access-token', expect.any(Object));
    expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token', expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Login successful!' }));
  });

  it('returns 401 when user is not found', async () => {
    userRepository.findByEmail.mockResolvedValue([]);

    const req = { body: { email: 'nobody@example.com', password: 'Password1' } };
    const res = mockRes();

    await authCtrl.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('returns 401 when password does not match', async () => {
    userRepository.findByEmail.mockResolvedValue([user]);
    bcrypt.compare.mockResolvedValue(false);

    const req = { body: { email: 'john@example.com', password: 'wrong' } };
    const res = mockRes();

    await authCtrl.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.cookie).not.toHaveBeenCalled();
  });
});

// ── refresh ───────────────────────────────────────────────────────────────────

describe('authCtrl.refresh', () => {
  const user = { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com' };

  it('issues a new access token cookie when refresh token is valid', async () => {
    jwt.verify.mockReturnValue({ userId: 1 });
    userRepository.findById.mockResolvedValue([user]);

    const req = { cookies: { refreshToken: 'valid-token' } };
    const res = mockRes();

    await authCtrl.refresh(req, res);

    expect(res.cookie).toHaveBeenCalledWith('accessToken', 'mock-access-token', expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 401 when no refresh token cookie is present', async () => {
    const req = { cookies: {} };
    const res = mockRes();

    await authCtrl.refresh(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('returns 403 when the refresh token is invalid', async () => {
    jwt.verify.mockImplementation(() => { throw new Error('invalid'); });

    const req = { cookies: { refreshToken: 'bad-token' } };
    const res = mockRes();

    await authCtrl.refresh(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ── logout ────────────────────────────────────────────────────────────────────

describe('authCtrl.logout', () => {
  it('clears both cookies and responds 200', () => {
    const req = {};
    const res = mockRes();

    authCtrl.logout(req, res);

    expect(res.clearCookie).toHaveBeenCalledWith('accessToken', expect.any(Object));
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Logged out.' });
  });
});
