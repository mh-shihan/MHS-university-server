import { model, Schema } from 'mongoose';
import { FacultyModel, TFaculty } from './faculty.interface';
import { userNameSchema } from '../../commonSchema/module.commonSchema';
import { Gender } from '../../constants/model.constant';

const facultySchema = new Schema<TFaculty, FacultyModel>(
  {
    id: {
      type: String,
      required: [true, ' ID is required'],
      unique: [true, 'ID is duplicate'],
    },
    user: {
      type: Schema.Types.ObjectId,
      required: [true, 'User ID is required!'],
      unique: [true, 'ID is duplicate'],
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
        message: '{VALUES} is not a valid gender',
      },
      required: [true, 'Gender is required'],
    },
    dateOfBirth: { type: Date },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
    },
    contactNo: {
      type: String,
      required: [true, 'Contact Number is required'],
    },
    emergencyContactNo: {
      type: String,
      required: [true, 'Emergency Contact Number is required'],
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
    academicDepartment: {
      type: Schema.Types.ObjectId,
      required: [true, 'User id is required'],
      ref: 'AcademicDepartment',
    },
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

// Generating Fullname
facultySchema.virtual('fullName').get(function () {
  return this?.name
    ? `${this?.name?.firstName} ${this?.name?.middleName} ${this?.name?.lastName}`
    : null;
});

// Filter Out deleted documents
facultySchema.pre('find', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

facultySchema.pre('findOne', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

facultySchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

//checking if user is already exist!
facultySchema.statics.isFacultyExists = async function (id: string) {
  const existingFaculty = await Faculty.findOne({ id }, { _id: 1 });
  return existingFaculty;
};

export const Faculty = model<TFaculty, FacultyModel>('Faculty', facultySchema);
