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

emailOtpSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("otp")) return next();
    const saltRounds = await bcrypt.genSalt(10);
    const hashed_otp = await bcrypt.hash(this.otp, saltRounds);
    this.otp = hashed_otp;
    next();
  } catch (error) {
    console.error("otp could not be hashed");
    next(error);
  }
});

// auto-delete expired OTPs
emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailOtp = mongoose.model("EmailOtp", emailOtpSchema);

module.exports = EmailOtp;
