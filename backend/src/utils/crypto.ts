import argon2 from 'argon2';

export const hashPassword = async (password: string): Promise<string> => {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3
  });
};

export const verifyPassword = async (
  hashedPassword: string,
  password: string
): Promise<boolean> => {
  return await argon2.verify(hashedPassword, password);
};