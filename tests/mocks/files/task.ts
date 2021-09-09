import { ITaskResponse, TaskStatus } from '@map-colonies/mc-priority-queue';

const task: ITaskResponse = {
  id: '2ca74c07-48dd-6cc2-t512-3f9ot62f52d7',
  status: TaskStatus.PENDING,
  percentage: 0,
  description: '',
  created: '',
  reason: '',
  updated: '',
  jobId: '1ca23d85-98cf-6c72-c836-3c9ot85t42d2',
  attempts: 0,
  parameters: {
    resourceId: 'bluemarble',
    resourceVersion: '1.0',
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

export { task };
