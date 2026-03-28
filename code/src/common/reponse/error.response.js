export const errorResponse = ({ error, res , status }={}) => {
  return res.status(status ?? 500).json({
    status: status,
    message: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
};
  