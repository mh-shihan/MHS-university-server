import status from 'http-status';
import AppError from '../../errors/AppError';
import { TLoginUser } from './auth.interface';
import {
  createAccessToken,
  createRefreshToken,
  createToken,
  isUserExistsWithErrorMessageByCustomId,
} from './auth.utils';
import { User } from '../user/user.model';
import { JwtPayload } from 'jsonwebtoken';
import config from '../../config';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../../utils/sendEmail';

const loginUser = async (payload: TLoginUser) => {
  const user = await isUserExistsWithErrorMessageByCustomId(payload.id);

  //   checking if the user is already deleted
  const isDeleted = user?.isDeleted;

  if (isDeleted) {
    throw new AppError(status.FORBIDDEN, 'This user is deleted!');
  }

  // checking if the user is blocked
  const userStatus = user?.status;

  if (userStatus === 'blocked') {
    throw new AppError(status.FORBIDDEN, 'This user is blocked! !');
  }

  //   Checking if the password is correct
  const isPasswordMatched = await User.isPasswordMatched(
    payload?.password,
    user?.password,
  );

  if (!isPasswordMatched) {
    throw new AppError(status.FORBIDDEN, 'Password do not matched!');
  }

  //   Create Token and send to the client
  const jwtPayload = {
    userId: user.id,
    role: user.role,
  };

  const accessToken = createAccessToken(jwtPayload);

  const refreshToken = createRefreshToken(jwtPayload);

  return {
    accessToken,
    refreshToken,
    needsPasswordChange: user?.needsPasswordChange,
  };
};

const changePassword = async (
  userData: JwtPayload,
  payload: { oldPassword: string; newPassword: string },
) => {
  const user = await isUserExistsWithErrorMessageByCustomId(userData.userId);

  //   checking if the user is already deleted
  const isDeleted = user?.isDeleted;

  if (isDeleted) {
    throw new AppError(status.FORBIDDEN, 'This user is deleted!');
  }

  // checking if the user is blocked
  const userStatus = user?.status;

  if (userStatus === 'blocked') {
    throw new AppError(status.FORBIDDEN, 'This user is blocked! !');
  }

  // Checking if the password is correct
  const isPasswordMatched = await User.isPasswordMatched(
    payload?.oldPassword,
    user?.password,
  );

  if (!isPasswordMatched) {
    throw new AppError(status.FORBIDDEN, 'Password do not matched!');
  }

  // Hash new password
  const newHashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  await User.findOneAndUpdate(
    { id: userData.userId, role: userData.role },
    {
      password: newHashedPassword,
      needsPasswordChange: false,
      passwordChangedAt: new Date(),
    },
  );

  return null;
};

const refreshToken = async (token: string) => {
  if (!token) {
    throw new AppError(status.UNAUTHORIZED, 'You are not authorized!');
  }

  // Check if the token is valid
  const decoded = jwt.verify(
    token,
    config.jwt_refresh_token_secret as string,
  ) as JwtPayload;

  const { userId, iat } = decoded;

  const user = await isUserExistsWithErrorMessageByCustomId(userId);

  //   checking if the user is already deleted
  const isDeleted = user?.isDeleted;

  if (isDeleted) {
    throw new AppError(status.FORBIDDEN, 'This user is deleted!');
  }

  // checking if the user is blocked
  const userStatus = user?.status;

  if (userStatus === 'blocked') {
    throw new AppError(status.FORBIDDEN, 'This user is blocked! !');
  }

  if (
    user.passwordChangedAt &&
    User.isJWTIssuedBeforePasswordChanged(user.passwordChangedAt, iat as number)
  ) {
    throw new AppError(
      status.UNAUTHORIZED,
      '----You are not authorized!--------',
    );
  }

  //Create Token and send to the client
  const jwtPayload = {
    userId: user.id,
    role: user.role,
  };

  const accessToken = createAccessToken(jwtPayload);

  return {
    accessToken,
  };
};

const forgatPassword = async (id: string) => {
  const user = await isUserExistsWithErrorMessageByCustomId(id);

  //   checking if the user is already deleted
  const isDeleted = user?.isDeleted;

  if (isDeleted) {
    throw new AppError(status.FORBIDDEN, 'This user is deleted!');
  }

  // checking if the user is blocked
  const userStatus = user?.status;

  if (userStatus === 'blocked') {
    throw new AppError(status.FORBIDDEN, 'This user is blocked! !');
  }

  const jwtPayload = {
    userId: user.id,
    role: user.role,
  };

  const resetToken = createToken(
    jwtPayload,
    config.jwt_access_token_secret as string,
    '10m',
  );

  const resetUILink = `${config.reset_pass_ui_url}?id=${user.id}&token=${resetToken}`;

  sendEmail(user.email, resetUILink);

  // console.log(resetUILink);
};

export const AuthServices = {
  loginUser,
  changePassword,
  refreshToken,
  forgatPassword,
};
