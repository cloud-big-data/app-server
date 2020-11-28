import moment from 'moment';
import { DataTypes } from '../../../types';

const parseDataType = (value: string): DataTypes => {
  if (moment(value, moment.ISO_8601, true).isValid()) {
    return 'date';
  }
  if (/^\d+$/.test(value)) {
    return 'number';
  }
  return 'string';
}

export default parseDataType;
