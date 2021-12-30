import { ITileRange } from '@map-colonies/mc-utils';
import { getTask } from '../mocks/files/task';
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
      const task = getTask();
      const params = task.parameters as IParameters;
      const layerId = `${params.resourceId}-${params.resourceVersion}`;

      // expectation;
      await expect(nifiClient.notifyNifiOnComplete(task.jobId as string, layerId)).resolves.not.toThrow();
      expect(axiosMocks.post).toHaveBeenCalledTimes(1);
    });
  });
});
