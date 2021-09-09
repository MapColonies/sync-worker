const hashUpdateMock = jest.fn();
const hashDigestMock = jest.fn();
const cipherUpdateMock = jest.fn();

const createHash = jest.fn(() => {
  return {
    update: hashUpdateMock,
    digest: hashDigestMock,
  };
});

const createCipherivMock = jest.fn(() => {
  return {
    update: cipherUpdateMock,
  };
});

export { hashUpdateMock, hashDigestMock, cipherUpdateMock, createHash, createCipherivMock };
