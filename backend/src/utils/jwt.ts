import jwt from 'jsonwebtoken';
import Config from '../config';

export interface JwtPayload {
  userId: string;
  email: string;
}

export const generateToken = (userId: string, email: string): string => {
  const payload: JwtPayload = { userId, email };
  return jwt.sign(payload, Config.JWT_SECRET, {
    expiresIn: Config.ACCESS_TOKEN_EXPIRY
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, Config.JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
};