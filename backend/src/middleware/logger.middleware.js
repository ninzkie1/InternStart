const logger = (req, res, next) => {
  // Save original end function
  const originalEnd = res.end;
  const startTime = Date.now();

  // Override end function
  res.end = function() {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;

    // Only log non-OPTIONS requests
    if (method !== 'OPTIONS') {
      console.log(`${method} ${url} ${status} ${duration}ms`);
    }

    // Call original end function
    originalEnd.apply(res, arguments);
  };

  next();
};

module.exports = logger; 