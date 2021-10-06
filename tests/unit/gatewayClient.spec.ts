import FormData from 'form-data';
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
let appendStub: jest.SpyInstance;
let gatewayClient: GatewayClient;

const container = registerExternalValues();

const getMockFileBuffer = (): Buffer => {
  const fileBuffer = Buffer.from(['mockData']);
  return fileBuffer;
};

describe('gatewayClient', () => {
  beforeAll(function () {
    initAxiosMock();
    gatewayClient = container.resolve(GatewayClient);
  });

  beforeEach(function () {
    appendStub = jest.spyOn(FormData.prototype, 'append');
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
      const buffer = getMockFileBuffer();
      // action
      const action = async () => {
        await gatewayClient.upload(buffer);
      };
      // expectation;
      await expect(action()).resolves.not.toThrow();
      expect(appendStub).toHaveBeenCalledTimes(1);
      expect(axiosMocks.post).toHaveBeenCalledTimes(1);
    });
  });
});
