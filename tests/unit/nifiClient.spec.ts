import { ITileRange } from '@map-colonies/mc-utils';
import { task } from '../mocks/files/task';
import { registerExternalValues } from '../ testContainerConfig';
import { axiosMocks, initAxiosMock } from '../mocks/axiosMock';
import { NifiClient } from '../../src/clients/services/nifiClient';

const axiosTestResponseBody = {
  value: 'test',
};
const axiosTestResponse = {
  data: axiosTestResponseBody,
};

interface IParameters {
  batch: ITileRange[];
  resourceId: string;
  resourceVersion: string;
}

let nifiClient: NifiClient;

const container = registerExternalValues();

describe('nifiClient', () => {
  beforeAll(function () {
    initAxiosMock();
    nifiClient = container.resolve(NifiClient);
  });

  afterEach(() => {
    container.reset();
    container.clearInstances();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('#notifyNifiOnSuccess', () => {
    it('should successfully notify Nifi after job success', async function () {
      axiosMocks.post.mockResolvedValue(axiosTestResponse);
      const params = task.parameters as IParameters;
      const layerId = `${params.resourceId}-${params.resourceVersion}`;
      // action
      const action = async () => {
        await nifiClient.notifyNifiOnComplete(task.jobId, layerId);
      };
      // expectation;
      await expect(action()).resolves.not.toThrow();
      expect(axiosMocks.post).toHaveBeenCalledTimes(1);
    });
  });
});
