import bcrypt from "bcryptjs";
import prisma from "../utils/prisma.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { createError } from "../middleware/errorHandler.js";

const issueTokens = async (user) => {
  const payload = { id: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.deleteMany({
    where: {
      user_id: user.id,
      expires_at: {
        lt: new Date(),
      },
    },
  });
  await prisma.refreshToken.create({
    data: { token: refreshToken, user_id: user.id, expires_at },
  });
  return { accessToken, refreshToken };
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role)
      throw createError(400, "All fields required");
    if (!["CAPITAL_SEEKER", "INVESTOR"].includes(role))
      throw createError(400, "Invalid role");
    if (password.length < 8)
      throw createError(400, "Password must be at least 8 characters");

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw createError(409, "Email already registered");

    const password_hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        role,
        ...(role === "CAPITAL_SEEKER" && {
          capitalSeekerProfile: { create: {} },
        }),
        ...(role === "INVESTOR" && { investorProfile: { create: {} } }),
      },
    });

    const { accessToken, refreshToken } = await issueTokens(user);
    res.status(201).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile_image_url: user.profile_image_url,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      throw createError(400, "Email and password required");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw createError(401, "Invalid credentials");

    if (user.is_system) {
      throw createError(403, "System accounts cannot login");
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw createError(401, "Invalid credentials");

    const { accessToken, refreshToken } = await issueTokens(user);
    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile_image_url: user.profile_image_url,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw createError(400, "Refresh token required");

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    if (!stored || stored.expires_at < new Date())
      throw createError(401, "Invalid refresh token");

    const decoded = verifyRefreshToken(refreshToken);

    if (stored.user_id !== decoded.id) {
      throw createError(401, "Invalid refresh token");
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });
    if (!user) throw createError(401, "User not found");
    if (user.is_system) {
      throw createError(403, "System accounts cannot login");
    }
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    const tokens = await issueTokens(user);
    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken)
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { capitalSeekerProfile: true, investorProfile: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
