import { GatewayClient } from '../../../src/clients/services/gatewayClient';

const uploadImageToGWMock = jest.fn();
const uploadJsonToGWMock = jest.fn();

const gatewayClientMock = {
  uploadImageToGW: uploadImageToGWMock,
  uploadJsonToGW: uploadJsonToGWMock,
} as unknown as GatewayClient;

export { gatewayClientMock, uploadImageToGWMock, uploadJsonToGWMock };
