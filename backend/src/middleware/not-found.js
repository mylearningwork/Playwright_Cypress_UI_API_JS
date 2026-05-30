export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `No route found for ${req.method} ${req.originalUrl}`,
      requestId: req.id
    }
  });
}
