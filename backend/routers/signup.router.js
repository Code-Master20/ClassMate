const express = require("express");
const router = express.Router();
const {
  signUpZodSchema,
} = require("../utils/credentialValidatorSchema.util.js");
const zodyCredentialValidator = require("../middlewares/zodMiddleware/zodCredentialValidator.middleware.js");
const signUp = require("../controllers/signup.controller.js");
const sendingOtpToEmail = require("../middlewares/expressMiddleware/sendingOtpToEmail.middleware.js");
const otpVerify = require("../middlewares/expressMiddleware/otpVerify.middleware.js");

router
  .route("/sign-up")
  .post(
    zodyCredentialValidator(signUpZodSchema),
    sendingOtpToEmail,
    otpVerify,
    signUp,
  );

module.exports = router;
