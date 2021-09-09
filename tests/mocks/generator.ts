import { ITile } from '@map-colonies/mc-utils';

function* generator(): Generator<ITile> {
  yield {
    zoom: 0,
    x: 0,
    y: 1,
  };
}

const mockTileGenerator = generator();

export { mockTileGenerator };
