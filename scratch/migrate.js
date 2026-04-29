import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../backend/models/userModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const migrate = async () => {
  await connectDB();
  try {
    const result = await User.updateMany(
      { isAdmin: true },
      { $set: { isSuperAdmin: true } }
    );
    console.log(`Migrated ${result.modifiedCount} existing admins to superadmins.`);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

migrate();
