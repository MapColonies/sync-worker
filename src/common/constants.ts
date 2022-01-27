export const DEFAULT_SERVER_PORT = 80;

export const IGNORED_OUTGOING_TRACE_ROUTES = [/^.*\/v1\/metrics.*$/];
export const IGNORED_INCOMING_TRACE_ROUTES = [/^.*\/docs.*$/];

export const SERVICE_NAME = 'sync-worker';

export enum Services {
  LOGGER = 'ILogger',
  CONFIG = 'IConfig',
  TRACER = 'TRACER',
  METER = 'METER',
  QUEUE_CONFIG = 'IQueueconfig',
  TILES_CONFIG = 'ITilesConfig',
  CRYPTO_CONFIG = 'ICryptoConfig',
  GATEWAY_CONFIG = 'IGatewayConfig',
  STORAGE_PROVIDER = 'storageProvider',
}

export const FILENAME_SAPERATOR_CHARACTER = '~~';
