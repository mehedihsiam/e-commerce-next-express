export const formatUserForResponsePublic = user => {
  const { password, otp, __v, otpExpires, ...publicData } = user;
  return publicData;
};

export const formatUserForResponsePrivate = user => {
  const { password, otp, __v, otpExpires, ...privateData } = user;
  return privateData;
};
