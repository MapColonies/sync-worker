import fs from 'fs';
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
let createReadStreamStub: jest.SpyInstance;
let appendStub: jest.SpyInstance;
let gatewayClient: GatewayClient;

const container = registerExternalValues();
const mockFileToUpload = 'tests/mocks/files/mockTile.png';
describe('gatewayClient', () => {
  beforeAll(function () {
    initAxiosMock();
    gatewayClient = container.resolve(GatewayClient);
  });

  beforeEach(function () {
    createReadStreamStub = jest.spyOn(fs, 'createReadStream');
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
      // action
      const action = async () => {
        await gatewayClient.upload(mockFileToUpload);
      };
      // expectation;
      await expect(action()).resolves.not.toThrow();
      expect(createReadStreamStub).toHaveBeenCalledTimes(1);
      expect(appendStub).toHaveBeenCalledTimes(1);
      expect(axiosMocks.post).toHaveBeenCalledTimes(1);
    });
  });
});
