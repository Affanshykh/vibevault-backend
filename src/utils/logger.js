const levels = ['error', 'warn', 'info', 'http', 'debug']

const logger = levels.reduce((acc, level) => {
  acc[level] = (...args) => {
    const timestamp = new Date().toISOString()
    console[level === 'error' ? 'error' : 'log'](`[${timestamp}] [${level.toUpperCase()}]`, ...args)
  }
  return acc
}, {})

export default logger
