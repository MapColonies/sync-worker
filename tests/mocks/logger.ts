interface ILogger {
  info: (level: string, message: string) => void;
  debug: (level: string, message: string) => void;
  error: (level: string, message: string) => void;
}

const logMock = jest.fn();
const logger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
} as ILogger;

export { logMock, logger };
