import { ITaskResponse, OperationStatus } from '@map-colonies/mc-priority-queue';
import { cloneDeep } from 'lodash';
import { IParameters } from '../../../src/common/interfaces';

const task = {
  id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  status: OperationStatus.PENDING,
  percentage: 0,
  description: '',
  created: '',
  reason: '',
  updated: '',
  jobId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
  attempts: 0,
  parameters: {
    resourceId: 'testId',
    resourceVersion: 'testVersion',
    layerRelativePath: 'testId/testVersion/testProductType',
    batch: [
      {
        maxX: 8,
        maxY: 4,
        minX: 0,
        minY: 0,
        zoom: 2,
      },
    ],
  },
} as ITaskResponse<IParameters>;

function getTask(): ITaskResponse<IParameters> {
  return cloneDeep(task);
}

export { getTask };
