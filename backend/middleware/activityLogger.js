/**
 * Custom Request Activity Logger Middleware
 */
export const activityLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const userString = req.user 
      ? `[User: ${req.user.name} (${req.user.role})]` 
      : '[Public/Unauthenticated]';
      
    console.log(
      `[API ACCESS LOG] ${new Date().toISOString()} | ` +
      `${req.method} ${req.originalUrl} | ` +
      `Status: ${res.statusCode} | ` +
      `Duration: ${duration}ms | ` +
      `${userString}`
    );
  });

  next();
};
