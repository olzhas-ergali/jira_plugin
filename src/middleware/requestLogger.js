/**
 * Middleware для логирования запросов
 * @param {Object} req - Запрос
 * @param {Object} res - Ответ
 * @param {Function} next - Следующий middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Логируем входящий запрос
  console.log(`📥 ${req.method} ${req.path} - ${req.ip} - ${new Date().toISOString()}`);
  
  // Перехватываем ответ
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    // Определяем эмодзи для статуса
    let statusEmoji = '✅';
    if (status >= 400 && status < 500) statusEmoji = '⚠️';
    if (status >= 500) statusEmoji = '❌';
    
    console.log(`📤 ${statusEmoji} ${req.method} ${req.path} - ${status} - ${duration}ms`);
    
    // Восстанавливаем оригинальный метод
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = requestLogger;
