const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  console.log(`📥 ${req.method} ${req.path} - ${req.ip} - ${new Date().toISOString()}`);
  
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    let statusEmoji = '✅';
    if (status >= 400 && status < 500) statusEmoji = '⚠️';
    if (status >= 500) statusEmoji = '❌';
    
    console.log(`📤 ${statusEmoji} ${req.method} ${req.path} - ${status} - ${duration}ms`);
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = requestLogger;
