import { Model } from 'mongoose';
import { USER_ROLE } from './user.constant';

export type TRole = 'super-admin' | 'admin' | 'student' | 'faculty';

export interface TUser {
  id: string;
  email: string;
  password: string;
  needsPasswordChange: boolean;
  passwordChangedAt?: Date;
  role: TRole;
  status: 'in-progress' | 'blocked';
  isDeleted: boolean;
}

export type TUserRole = keyof typeof USER_ROLE;

export interface UserModel extends Model<TUser> {
  // myStaticMethod(): number;
  isUserExistsByCustomId(id: string): Promise<TUser>;

  isPasswordMatched(
    plainTextPassword: string,
    hashPassword: string,
  ): Promise<boolean>;

  isJWTIssuedBeforePasswordChanged(
    passwordChangedTimestamp: Date,
    jwtIssuedTimestamp: number,
  ): boolean;
}
