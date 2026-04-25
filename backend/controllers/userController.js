import User from '../models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { generateToken } from '../utils/generateToken.js';
import transporter from '../config/email.js';
// @desc     Auth user & get token
// @method   POST
// @endpoint /api/users/login
// @access   Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.statusCode = 404;
      throw new Error(
        'Invalid email address. Please check your email and try again.'
      );
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      res.statusCode = 401;
      throw new Error(
        'Invalid password. Please check your password and try again.'
      );
    }

    // Generate 6-digit OTP, hash it, store with 10-minute expiry
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.mfaOtp = hashedOtp;
    user.mfaOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.mfaOtpAttempts = 0;
    await user.save();

    await transporter.sendMail({
      from: `"MERN Shop" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: 'Your MERN Shop Login Code',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #e0e0e0;border-radius:8px">
          <h2 style="color:#222;margin-top:0">Login Verification</h2>
          <p style="color:#555">Hi ${user.name},</p>
          <p style="color:#555">Use the code below to complete your sign-in. It expires in <strong>10 minutes</strong>.</p>
          <div style="text-align:center;margin:28px 0">
            <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#1a1f2e;background:#f5f5f5;padding:14px 24px;border-radius:8px;display:inline-block">${otp}</span>
          </div>
          <p style="color:#888;font-size:13px">If you did not attempt to log in, please ignore this email.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
          <p style="color:#aaa;font-size:12px;margin:0">MERN Shop &bull; Do not share this code with anyone</p>
        </div>
      `
    });

    res.status(200).json({
      mfaRequired: true,
      userId: user._id,
      message: 'Verification code sent to your email.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc     Verify MFA OTP and issue session token
// @method   POST
// @endpoint /api/v1/users/verify-mfa
// @access   Public
const verifyMfa = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);

    if (!user || !user.mfaOtp || !user.mfaOtpExpiry) {
      res.statusCode = 400;
      throw new Error('Invalid or expired verification session. Please log in again.');
    }

    if (user.mfaOtpExpiry < new Date()) {
      user.mfaOtp = undefined;
      user.mfaOtpExpiry = undefined;
      user.mfaOtpAttempts = 0;
      await user.save();
      res.statusCode = 400;
      throw new Error('Verification code has expired. Please log in again.');
    }

    if (user.mfaOtpAttempts >= 3) {
      user.mfaOtp = undefined;
      user.mfaOtpExpiry = undefined;
      user.mfaOtpAttempts = 0;
      await user.save();
      res.statusCode = 429;
      throw new Error('Too many failed attempts. Please log in again.');
    }

    const match = await bcrypt.compare(otp, user.mfaOtp);

    if (!match) {
      user.mfaOtpAttempts += 1;
      await user.save();
      const remaining = 3 - user.mfaOtpAttempts;
      res.statusCode = 401;
      throw new Error(`Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
    }

    // OTP valid — clear MFA fields and issue session
    user.mfaOtp = undefined;
    user.mfaOtpExpiry = undefined;
    user.mfaOtpAttempts = 0;
    await user.save();

    generateToken(req, res, user._id);

    res.status(200).json({
      message: 'Login successful.',
      userId: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin
    });
  } catch (error) {
    next(error);
  }
};

// @desc     Register user
// @method   POST
// @endpoint /api/users
// @access   Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.statusCode = 409;
      throw new Error('User already exists. Please choose a different email.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    generateToken(req, res, user._id);

    res.status(201).json({
      message: 'Registration successful. Welcome!',
      userId: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin
    });
  } catch (error) {
    next(error);
  }
};

// @desc     Logout user / clear cookie
// @method   POST
// @endpoint /api/users/logout
// @access   Private
const logoutUser = (req, res) => {
  res.clearCookie('jwt', { httpOnly: true });

  res.status(200).json({ message: 'Logout successful' });
};

// @desc     Get user profile
// @method   GET
// @endpoint /api/users/profile
// @access   Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found!');
    }

    res.status(200).json({
      message: 'User profile retrieved successfully',
      userId: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin
    });
  } catch (error) {
    next(error);
  }
};

// @desc     Get admins
// @method   GET
// @endpoint /api/users/admins
// @access   Private/Admin
const admins = async (req, res, next) => {
  try {
    const admins = await User.find({ isAdmin: true });

    if (!admins || admins.length === 0) {
      res.statusCode = 404;
      throw new Error('No admins found!');
    }
    res.status(200).json(admins);
  } catch (error) {
    next(error);
  }
};

// @desc     Get users
// @method   GET
// @endpoint /api/users
// @access   Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ isAdmin: false });

    if (!users || users.length === 0) {
      res.statusCode = 404;
      throw new Error('No users found!');
    }
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};
// @desc     Get user
// @method   GET
// @endpoint /api/users/:id
// @access   Private/Admin
const getUserById = async (req, res, next) => {
  try {
    const { id: userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found!');
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: 'Internal Server Error'
    });
  }
};

// @desc     Update user
// @method   PUT
// @endpoint /api/users/:id
// @access   Private/Admin
const updateUser = async (req, res, next) => {
  try {
    const { name, email, isAdmin } = req.body;
    const { id: userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found!');
    }
    user.name = name || user.name;
    user.email = email || user.email;
    user.isAdmin = Boolean(isAdmin);

    const updatedUser = await user.save();

    res.status(200).json({ message: 'User updated', updatedUser });
  } catch (error) {
    res.status(500).json({
      message: 'Internal Server Error'
    });
  }
};

// @desc     Update user profile
// @method   PUT
// @endpoint /api/users/profile
// @access   Private
const updateUserProfile = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found. Unable to update profile.');
    }

    user.name = name || user.name;
    user.email = email || user.email;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      message: 'User profile updated successfully.',
      userId: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin
    });
  } catch (error) {
    next(error);
  }
};

// @desc     Delete user
// @method   DELETE
// @endpoint /api/users/:id
// @access   Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const { id: userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found!');
    }
    await User.deleteOne({ _id: user._id });
    res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc     Send reset password email
// @method   POST
// @endpoint /api/users/reset-password/request
// @access   Public
const resetPasswordRequest = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found!');
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '15m'
    });
    const passwordResetLink = `https://mern-shop-abxs.onrender.com/reset-password/${user._id}/${token}`;
    console.log(passwordResetLink);
    await transporter.sendMail({
      from: `"MERN Shop" <${process.env.EMAIL_FROM}>`, // sender address
      to: user.email, // list of receivers
      subject: 'Password Reset', // Subject line
      html: `<p>Hi ${user.name},</p>

            <p>We received a password reset request for your account. Click the link below to set a new password:</p>

            <p><a href=${passwordResetLink} target="_blank">${passwordResetLink}</a></p>

            <p>If you didn't request this, you can ignore this email.</p>

            <p>Thanks,<br>
            MERN Shop Team</p>` // html body
    });

    res
      .status(200)
      .json({ message: 'Password reset email sent, please check your email.' });
  } catch (error) {
    next(error);
  }
};

// @desc     Reset password
// @method   POST
// @endpoint /api/users/reset-password/reset/:id/:token
// @access   Private
const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const { id: userId, token } = req.params;
    const user = await User.findById(userId);
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    if (!decodedToken) {
      res.statusCode = 401;
      throw new Error('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password successfully reset' });
  } catch (error) {
    next(error);
  }
};

export {
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
  getUsers,
  getUserById,
  updateUser,
  updateUserProfile,
  deleteUser,
  admins,
  resetPasswordRequest,
  resetPassword,
  verifyMfa
};
