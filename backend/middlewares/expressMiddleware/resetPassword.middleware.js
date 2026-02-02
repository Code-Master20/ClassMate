const express = require("express");
const User = require("../../models/user.model");
const ErrorHandler = require("../../utils/errorHandler.util");
const sendOtp = require("../../services/sendOtp.service");
const TemporaryUser = require("../../models/temporaryUser.model");

const resetPasswordWithOldPassword = async (req, res, next) => {
  try {
    const { email, password, newPassword } = req.body;

    const userExisted = await User.findOne({ email });
    if (!userExisted) {
      return new ErrorHandler(404, "Account not found")
        .log(
          "error during password reset",
          "account not found for entered email",
        )
        .send(res);
    }

    const isMatchOldPassword = await userExisted.comparePassword(password);
    if (!isMatchOldPassword) {
      return new ErrorHandler(401, "Old password not correct")
        .log(
          "password not matched",
          "Password not matched to the old one you registered with us before",
        )
        .send(res);
    }

    userExisted.password = newPassword;
    await userExisted.save();
    req.user = {
      id: userExisted._id,
      username: userExisted.username,
      email: userExisted.email,
      creator: userExisted.creator,
    };
    next();
  } catch (error) {
    return new ErrorHandler(500, "internal server error")
      .log("password reset failed", error)
      .send(res);
  }
};

const resetPasswordWithOtp = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;
    const userExisted = await User.findOne({ email });

    if (!userExisted) {
      return new ErrorHandler(404, "please provide correct email address")
        .log("non-existed email :", "email is not registered to any account")
        .send(res);
    }

    // console.log(userExisted.password);
    await TemporaryUser.create({
      username: userExisted.username,
      email,
      password: newPassword,
    });

    req.user = {
      username: userExisted.username,
      email,
      newPassword,
    };
    next();
  } catch (error) {
    return new ErrorHandler(500, error).send(res);
  }
};
module.exports = { resetPasswordWithOtp, resetPasswordWithOldPassword };
