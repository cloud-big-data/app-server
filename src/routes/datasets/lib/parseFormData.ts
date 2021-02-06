import { v4 as uuidv4 } from 'uuid';
import * as R from 'ramda';
import { IBoardData } from '../../../types';
import parseDataType from './parseDataType';

const parseFormData = (
  fileName: string,
  userId: string,
  csvAsJson: Array<any>,
): IBoardData => ({
  title: fileName,
  visibilitySettings: {
    owner: userId,
    editors: [userId],
    viewers: [],
  },
  columns: Object.keys(csvAsJson[0]).map(key => ({
    _id: uuidv4(),
    value: key,
    dataType: parseDataType(csvAsJson[0][key]),
  })),
  rows: csvAsJson.map((row, index) => ({
    _id: uuidv4(),
    index,
    cells: R.pipe(
      R.values,
      R.map(row => ({
        _id: uuidv4(),
        value: row,
      })),
    )(row),
  })),
  layerToggles: {
    groupings: true,
    filters: true,
    joins: true,
    smartColumns: true,
  },
});

export default parseFormData;
