const User = require("../models/user.model");
const TemporaryUser = require("../models/temporaryUser.model");
const SuccessHandler = require("../utils/successHandler.util");
const ErrorHandler = require("../utils/errorHandler.util");

const signUp = async (req, res) => {
  try {
    const { username, email, password } = req.tempUser;

    const userExist = await User.findOne({ email });

    if (userExist) {
      return new ErrorHandler(
        409,
        "You already have an account with this email",
      )
        .log("user pre existed", "user is already registered")
        .send(res);
    }

    const userCreated = await User.create({ username, email, password });
    await TemporaryUser.deleteMany({ email });
    const token = userCreated.generateLogTrackTkn();

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "strict", // or "none" if frontend is on another domain
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const data = {
      id: userCreated._id,
      username: userCreated.username,
      email: userCreated.email,
      creator: userCreated.creator,
    };
    return new SuccessHandler(201, "sign-up successfully done", data).send(res);
  } catch (error) {
    return new ErrorHandler(500, "internal server error")
      .log("user not created", error)
      .send(res);
  }
};

module.exports = signUp;
