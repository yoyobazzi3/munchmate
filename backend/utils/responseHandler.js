export const sendError = (res, error = "Internal server error", statusCode = 500) => {
  return res.status(statusCode).json({ error });
};

export const sendSuccess = (res, data = {}, statusCode = 200) => {
  return res.status(statusCode).json(data);
};
