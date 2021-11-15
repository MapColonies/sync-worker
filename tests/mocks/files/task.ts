import { ITaskResponse, TaskStatus } from '@map-colonies/mc-priority-queue';

const task: ITaskResponse = {
  id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  status: TaskStatus.PENDING,
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
};

const taskWithTocData = { ...task };
taskWithTocData.parameters = { ...(task.parameters as Record<string, unknown>) };
(taskWithTocData.parameters as { tocData: Record<string, unknown> }).tocData = { todTestFata: 'data' };

export { task, taskWithTocData };
