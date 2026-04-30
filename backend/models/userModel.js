import mongoose from 'mongoose';

// Define the schema for users
const userSchema = new mongoose.Schema(
  {
    // User's name
    name: {
      type: String,
      required: true
    },
    // User's email, must be unique
    email: {
      type: String,
      required: true,
      unique: true
    },
    // User's password
    password: {
      type: String,
      required: true
    },
    // Indicates whether the user is an admin or not
    isAdmin: {
      type: Boolean,
      required: true,
      default: false
    },
    isSuperAdmin: {
      type: Boolean,
      required: true,
      default: false
    },
    isVerified: {
      type: Boolean,
      required: true,
      default: false
    },
    mfaOtp: { type: String },
    mfaOtpExpiry: { type: Date },
    mfaOtpAttempts: { type: Number, default: 0 },
    // Brute-force lockout fields
    loginAttempts: { type: Number, required: true, default: 0 },
    lockUntil: { type: Date }
  },
  { timestamps: true } // Adds createdAt and updatedAt timestamps
);

// Create the User model
const User = mongoose.model('User', userSchema);

// Export the User model
export default User;
