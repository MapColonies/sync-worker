export interface IConfig {
  get: <T>(setting: string) => T;
  has: (setting: string) => boolean;
}

export interface OpenApiConfig {
  filePath: string;
  basePath: string;
  jsonPath: string;
  uiPath: string;
}

export interface IQueueConfig {
  jobManagerBaseUrl: string;
  heartbeatManagerBaseUrl: string;
  dequeueIntervalMs: number;
  heartbeatIntervalMs: number;
  jobType: string;
  tilesTaskType: string;
  tocTaskType: string;
}

export interface ITilesConfig {
  path: string;
  format: string;
  uploadBatchSize: number;
  sigIsNeeded: boolean;
}

export interface IGatewayConfig {
  url: string;
  routeId: string;
}

export interface ICryptoConfig {
  readFileEncoding: BufferEncoding;
  pem: string;
  shaSize: string;
  algoritm: string;
}

export interface IGatewayAuthConfig {
  enabled: boolean;
  username: string;
  password: string;
}

export interface ITileRange {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  zoom: number;
}

export interface IParameters {
  batch: ITileRange[];
  resourceId: string;
  resourceVersion: string;
  layerRelativePath: string;
  target: string;
  tocData?: Record<string, unknown>;
}
