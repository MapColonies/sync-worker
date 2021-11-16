import { GatewayClient } from '../../src/clients/services/gatewayClient';
import { registerExternalValues } from '../ testContainerConfig';
import { axiosMocks, initAxiosMock } from '../mocks/axiosMock';

const axiosTestResponseBody = {
  value: 'test',
};
const axiosTestResponse = {
  data: axiosTestResponseBody,
};

// fsp module stubs
let gatewayClient: GatewayClient;

const container = registerExternalValues();

const getMockFileBuffer = (): Buffer => {
  const fileBuffer = Buffer.from('mockData');
  return fileBuffer;
};

describe('gatewayClient', () => {
  beforeAll(function () {
    initAxiosMock();
    gatewayClient = container.resolve(GatewayClient);
  });

  afterEach(() => {
    container.reset();
    container.clearInstances();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('#upload', () => {
    it('should successfully upload a file', async function () {
      axiosMocks.post.mockResolvedValue(axiosTestResponse);
      const filename = '/4/4/4.png';
      const buffer = getMockFileBuffer();
      // action
      const action = async () => {
        await gatewayClient.uploadImageToGW(buffer, filename);
      };
      // expectation;
      await expect(action()).resolves.not.toThrow();
      expect(axiosMocks.post).toHaveBeenCalledTimes(1);
    });
  });
});
