const otpSender = require("../../utils/otpSender.js");
const EmailOtp = require("../../models/emailOtp.model.js");
const TemporaryUser = require("../../models/temporaryUser.model.js");

const sendingOtpToEmail = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    let otp = "";
    for (let i = 0; i < 8; i++) {
      const randomNum = String(Math.floor(Math.random() * 10)); //[0,9]
      otp += randomNum;
    }
    // const otp = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join(""); one line code for otp generation
    await EmailOtp.deleteMany({ email });
    await EmailOtp.create({ email, otp });

    await otpSender({
      to: email,
      subject: "email verification code",
      text: `Welcome to the world of ClassMate`,
      html: `
        <h3>Your verification code</h3>
        <p>${otp}</p>
      `,
    });

    await TemporaryUser.create({ username, email, password });

    res.status(200).json({
      success: true,
      message: "verification code sent successfully to your email",
    });
  } catch (error) {}
};

module.exports = sendingOtpToEmail;
