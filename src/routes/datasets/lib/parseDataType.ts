import moment from 'moment';
import { DataTypes } from '../../../types';

const parseDataType = (value: string): DataTypes => {
  if (/^\d+$/.test(value)) {
    return 'number';
  }
  if (moment(value, moment.ISO_8601, true).isValid()) {
    return 'date';
  }
  return 'string';
};

export default parseDataType;
