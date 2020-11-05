import moment from 'moment';
import { DataTypes } from '../../../types';

const parseDataType = (value: string): DataTypes => {
  if (moment(value, moment.ISO_8601, true).isValid()) {
    return DataTypes.date;
  }
  if (!isNaN(parseInt(value))) {
    return DataTypes.number;
  }
  return DataTypes.string;
}

export default parseDataType;
