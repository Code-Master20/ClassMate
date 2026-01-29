const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const emailOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      default: () => Date.now() + 5 * 60 * 1000, // 5 minutes
    },
  },
  { timestamps: true },
);

emailOtpSchema.pre("save", async function () {
  try {
    const email_otp = this;
    if (!email_otp.isModified("otp")) {
      return;
    }
    const saltRounds = await bcrypt.genSalt(10);
    const hashed_otp = await bcrypt.hash(String(email_otp.otp), saltRounds);
    email_otp.otp = hashed_otp;
    return;
  } catch (error) {
    console.error("otp could not be hashed");
    console.log(error);
    return;
  }
});

// auto-delete expired OTPs
emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailOtp = mongoose.model("EmailOtp", emailOtpSchema);

module.exports = EmailOtp;
