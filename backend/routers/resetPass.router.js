const router = require("express").Router();
const {
  passResetZodSchema,
  passResetWithOtpZodSchema,
} = require("../utils/credentialValidatorSchema.util.js");
const zodyCredentialValidator = require("../middlewares/zodMiddleware/zodCredentialValidator.middleware");
const {
  resetPasswordWithOldPassword,
  resetPasswordWithOtp,
} = require("../middlewares/expressMiddleware/resetPassword.middleware");
const sendingOtpToEmail = require("../middlewares/expressMiddleware/sendingOtpToEmail.middleware");
const logIn = require("../controllers/login.controller");
const otpVerify = require("../middlewares/expressMiddleware/otpVerify.middleware.js");

router.post(
  "/reset-password-with-old-password",
  zodyCredentialValidator(passResetZodSchema),
  resetPasswordWithOldPassword,
  logIn,
);

router.post(
  "/reset-password-with-otp",
  zodyCredentialValidator(passResetWithOtpZodSchema),
  resetPasswordWithOtp,
  sendingOtpToEmail.sendingOtpForPassReset,
);

router.post("/reset-password-with-otp/verify-otp", otpVerify, logIn);

module.exports = router;

/*
POST is used when:
creating something
performing an action
changing server state
sending sensitive data

GET is for reading data only.
PUT is for updating an existing resource that is already identified. */
