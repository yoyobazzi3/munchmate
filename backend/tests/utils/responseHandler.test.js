import { describe, it, expect, vi } from 'vitest';
import { sendSuccess, sendError } from '../../utils/responseHandler.js';

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('sendSuccess', () => {
  it('responds with 200 and the provided data by default', () => {
    const res = mockRes();
    sendSuccess(res, { message: 'ok' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'ok' });
  });

  it('uses an empty object when no data is provided', () => {
    const res = mockRes();
    sendSuccess(res);
    expect(res.json).toHaveBeenCalledWith({});
  });

  it('respects a custom status code', () => {
    const res = mockRes();
    sendSuccess(res, { message: 'created' }, 201);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('sendError', () => {
  it('responds with 500 and a default message when called with no arguments', () => {
    const res = mockRes();
    sendError(res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });

  it('uses the provided error message and status code', () => {
    const res = mockRes();
    sendError(res, 'Not found', 404);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
  });
});
