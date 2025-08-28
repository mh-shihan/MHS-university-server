import { Schema } from 'mongoose';
import { TUserName } from '../interface/modules';
import validator from 'validator';

export const userNameSchema = new Schema<TUserName>({
  firstName: {
    type: String,
    maxlength: [20, 'First name can not be more than 20 characters'],
    trim: true,
    validate: {
      validator: function (value: string) {
        const firstNameStr = value.charAt(0).toUpperCase() + value.slice(1);
        return firstNameStr === value;
      },
      message: '{VALUE} is not in capitalize format.',
    },
    required: [true, 'First name is required'],
  },
  middleName: { type: String, required: [true, 'Middle name is required'] },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    validate: {
      validator: (value: string) => validator.isAlpha(value),
      message: '{VALUE} is not valid.',
    },
  },
});
