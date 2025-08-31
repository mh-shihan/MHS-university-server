import { Schema, model } from 'mongoose';
import { AdminModel, TAdmin } from './admin.interface';
import { userNameSchema } from '../../commonSchema/module.commonSchema';
import { BloodGroup, Gender } from '../../constants/model.constant';

const adminSchema = new Schema<TAdmin, AdminModel>(
  {
    id: {
      type: String,
      required: [true, 'ID is required'],
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      required: [true, 'User id is required'],
      unique: true,
      ref: 'User',
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
    },
    name: {
      type: userNameSchema,
      required: [true, 'Name is required'],
    },
    gender: {
      type: String,
      enum: {
        values: Gender,
        message: '{VALUE} is not a valid gender',
      },
      required: [true, 'Gender is required'],
    },
    dateOfBirth: { type: Date },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
    },
    contactNo: { type: String, required: [true, 'Contact number is required'] },
    emergencyContactNo: {
      type: String,
      required: [true, 'Emergency contact number is required'],
    },
    bloodGroup: {
      type: String,
      enum: {
        values: BloodGroup,
        message: '{VALUE} is not a valid blood group',
      },
    },
    presentAddress: {
      type: String,
      required: [true, 'Present address is required'],
    },
    permanentAddress: {
      type: String,
      required: [true, 'Permanent address is required'],
    },
    profileImg: { type: String },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
  },
);

// generating full name
adminSchema.virtual('fullName').get(function () {
  return this?.name
    ? `${this?.name?.firstName} ${this?.name?.middleName} ${this?.name?.lastName}`
    : null;
});

// filter out deleted documents
adminSchema.pre('find', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

adminSchema.pre('findOne', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

adminSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

//checking if user is already exist!
adminSchema.statics.isAdminExists = async function (id: string) {
  const existingAdmin = await Admin.findOne({ id });
  return existingAdmin;
};

export const Admin = model<TAdmin, AdminModel>('Admin', adminSchema);
