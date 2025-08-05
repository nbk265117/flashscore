/**
 * Logger Utility
 * Provides consistent logging functionality across the application
 */
class Logger {
  static info(message) {
    console.log(`ℹ️  ${new Date().toISOString()}: ${message}`);
  }

  static success(message) {
    console.log(`✅ ${new Date().toISOString()}: ${message}`);
  }

  static warning(message) {
    console.warn(`⚠️  ${new Date().toISOString()}: ${message}`);
  }

  static error(message) {
    console.error(`❌ ${new Date().toISOString()}: ${message}`);
  }

  static debug(message) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🐛 ${new Date().toISOString()}: ${message}`);
    }
  }
}

module.exports = Logger; 