/**
 * Sentry Security & Performance Simulator
 * Traps runtime exceptions, failed API calls, and layout failures.
 */
class SentrySimulator {
  init() {
    window.addEventListener('error', (event) => {
      this.captureException(event.error || new Error(event.message), {
        context: 'Global Window Event',
        filename: event.filename,
        lineno: event.lineno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.captureException(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
        context: 'Promise Rejection'
      });
    });

    console.log("Sentry Shield activated. Monitoring security events and crashes.");
  }

  captureException(error, extraMetadata = {}) {
    const errorLog = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      metadata: extraMetadata,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Log to console for security auditing
    console.group("%c🚨 SENTRY EXCEPTION CAPTURED", "color: #ef4444; font-weight: bold; font-size: 11px;");
    console.error("Error Message:", errorLog.message);
    console.log("Stack Trace:", errorLog.stack);
    console.log("Metadata:", errorLog.metadata);
    console.groupEnd();

    // In a real Sentry deployment, this would POST to Sentry endpoints.
    // For local security dashboarding, we can store it in a temporary local log.
    const recentLogs = JSON.parse(localStorage.getItem('sentry_logs') || '[]');
    recentLogs.unshift(errorLog);
    localStorage.setItem('sentry_logs', JSON.stringify(recentLogs.slice(0, 50)));
  }

  captureMessage(message, level = 'info') {
    console.log(`%c[Sentry (${level})]: ${message}`, "color: #eab308; font-weight: bold;");
  }
}

export const Sentry = new SentrySimulator();
