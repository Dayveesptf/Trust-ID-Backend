import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ApiError } from "../utils/apiError.js";

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export async function register(req, res) {
  const { firstName, lastName, email, phone, password } = req.body;

  if (!firstName || !lastName || !email || !phone || !password) {
    throw new ApiError(400, "firstName, lastName, email, phone and password are required");
  }
  if (password.length < 8) throw new ApiError(400, "Password must be at least 8 characters");

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, "An account with this email already exists");

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    password: hashedPassword
  });

  res.status(201).json({
    success: true,
    data: {
      user: user.toJSON(),
      token: signToken(user._id.toString())
    }
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) throw new ApiError(400, "Email and password are required");

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const safeUser = user.toObject();
  delete safeUser.password;

  res.json({
    success: true,
    data: {
      user: safeUser,
      token: signToken(user._id.toString())
    }
  });
}

export async function me(req, res) {
  res.json({ success: true, data: { user: req.user } });
}