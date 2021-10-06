import { promises as fsp } from 'fs';
import * as utils from '../../src/common/utils';

let accessStub: jest.SpyInstance;

describe('utils', () => {
  beforeEach(function () {
    accessStub = jest.spyOn(fsp, 'access');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('#isFileExists', () => {
    it('should return true if file is exists', async function () {
      // mock
      const existsFilePath = 'tests/mocks/files/mockTile.png';
      // action
      const res = await utils.isFileExists(existsFilePath);

      // expectation
      expect(res).toBeTruthy();
      expect(accessStub).toHaveBeenCalledTimes(1);
    });

    it('should return false if file is not exists', async function () {
      // mock
      const notExistsFilePath = 'tests/mock/notExists.png';
      // action
      const res = await utils.isFileExists(notExistsFilePath);

      // expectation
      expect(res).toBeFalsy();
      expect(accessStub).toHaveBeenCalledTimes(1);
    });
  });
});
