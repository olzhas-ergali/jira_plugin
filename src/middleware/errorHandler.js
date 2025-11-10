/**
 * Middleware для обработки ошибок
 * @param {Error} err - Ошибка
 * @param {Object} req - Запрос
 * @param {Object} res - Ответ
 * @param {Function} next - Следующий middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Unhandled error:', err);

  // Ошибки валидации Joi
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      error: 'Ошибка валидации',
      details: err.details[0].message
    });
  }

  // Ошибки axios (внешние API)
  if (err.response) {
    const status = err.response.status;
    const message = err.response.data?.message || err.message;
    
    return res.status(status >= 400 && status < 500 ? status : 500).json({
      success: false,
      error: 'Ошибка внешнего сервиса',
      message: message,
      service: err.config?.url?.includes('openai') ? 'OpenAI' : 'Jira'
    });
  }

  // Ошибки подключения
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      success: false,
      error: 'Сервис недоступен',
      message: 'Не удается подключиться к внешнему сервису'
    });
  }

  // Общие ошибки
  res.status(500).json({
    success: false,
    error: 'Внутренняя ошибка сервера',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Произошла внутренняя ошибка'
  });
};

module.exports = errorHandler;
