// In-app Developer Console & Logger Service
export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warn' | 'error' | 'success';
  message: string;
  details?: string;
}

type LogListener = (logs: LogEntry[]) => void;

class ConsoleLoggerService {
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private originalLog: typeof console.log;
  private originalWarn: typeof console.warn;
  private originalError: typeof console.error;
  private isIntercepting = false;

  constructor() {
    this.originalLog = console.log;
    this.originalWarn = console.warn;
    this.originalError = console.error;
    this.initializeInterception();
  }

  private addEntry(type: 'info' | 'warn' | 'error' | 'success', message: string, details?: string) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details
    };

    // Keep log buffer to a reasonable limit (e.g. max 500 entries) to prevent high memory usage
    this.logs.push(entry);
    if (this.logs.length > 500) {
      this.logs.shift();
    }

    this.notifyListeners();
  }

  public logCustom(type: 'info' | 'warn' | 'error' | 'success', message: string, details?: string) {
    this.addEntry(type, message, details);
  }

  private initializeInterception() {
    if (this.isIntercepting) return;
    this.isIntercepting = true;

    // Capture standard logs
    console.log = (...args: any[]) => {
      this.originalLog.apply(console, args);
      const msg = args.map(arg => this.formatArg(arg)).join(' ');
      this.addEntry('info', msg);
    };

    // Capture warnings
    console.warn = (...args: any[]) => {
      this.originalWarn.apply(console, args);
      const msg = args.map(arg => this.formatArg(arg)).join(' ');
      this.addEntry('warn', msg);
    };

    // Capture errors
    console.error = (...args: any[]) => {
      this.originalError.apply(console, args);
      const msg = args.map(arg => this.formatArg(arg)).join(' ');
      this.addEntry('error', msg);
    };

    // Capture uncaught window runtime errors
    window.addEventListener('error', (event) => {
      this.addEntry('error', `Runtime Error: ${event.message}`, `Source: ${event.filename}:${event.lineno}:${event.colno}`);
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.addEntry('error', `Unhandled Promise Rejection: ${event.reason?.message || event.reason}`, event.reason?.stack);
    });

    // Record system parameters at startup
    this.addEntry('success', 'Console Logger Service initialized successfully.');
    this.addEntry('info', `Platform: ${navigator.userAgent}`);
    this.addEntry('info', `Viewport: ${window.innerWidth}x${window.innerHeight}px (dpr: ${window.devicePixelRatio})`);
    this.addEntry('info', `Online Status: ${navigator.onLine ? 'Online' : 'Offline'}`);
    this.addEntry('info', `Local Time: ${new Date().toISOString()}`);
  }

  private formatArg(arg: any): string {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (_) {
        return Object.prototype.toString.call(arg);
      }
    }
    return String(arg);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    this.addEntry('info', 'Console logs cleared.');
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    // Emit current state immediately
    listener([...this.logs]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const currentLogs = [...this.logs];
    this.listeners.forEach(listener => {
      try {
        listener(currentLogs);
      } catch (err) {
        this.originalError('Error notifying log listener:', err);
      }
    });
  }
}

export const loggerService = new ConsoleLoggerService();
