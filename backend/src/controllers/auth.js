import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../utils/prisma.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { createError } from "../middleware/errorHandler.js";
import { Resend } from "resend";

const issueTokens = async (user) => {
  const accessPayload = {
    id: user.id,
    role: user.role,
  };

  const refreshPayload = {
    id: user.id,
    role: user.role,
    jti: crypto.randomUUID(),
  };

  const accessToken = signAccessToken(accessPayload);
  const refreshToken = signRefreshToken(refreshPayload);

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
    data: {
      token: refreshToken,
      user_id: user.id,
      expires_at,
    },
  });

  return {
    accessToken,
    refreshToken,
  };
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
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profile_image_url: true,
        is_active: true,
        created_at: true,

        capitalSeekerProfile: {
          select: {
            id: true,
            entity_type: true,
            organisation_name: true,
            linkedin_url: true,
            experience_summary: true,
            city: true,
            country: true,
          },
        },

        investorProfile: {
          select: {
            id: true,
            investor_category: true,
            fund_name: true,
            aum_range: true,
            ticket_min: true,
            ticket_max: true,
            preferred_sectors: true,
            preferred_stage: true,
            preferred_entity_type: true,
            geography_preference: true,
            lead_interest: true,
            co_invest_interest: true,
            board_seat_interest: true,
            bio: true,
            linkedin_url: true,
          },
        },
      },
    });

    if (!user) {
      throw createError(404, "User not found");
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
const passwordResetResend = () =>
  process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const PASSWORD_RESET_EXPIRY_MS = 30 * 60 * 1000;

export const forgotPassword = async (req, res, next) => {
  let user;

  try {
    const email =
      typeof req.body.email === "string" ? req.body.email.trim() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw createError(400, "Enter a valid email address");
    }

    user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
        is_active: true,
        is_system: false,
      },
    });

    // Always return the same response for unknown or ineligible accounts.
    const genericResponse = {
      success: true,
      message:
        "If an eligible account exists for that email, a password-reset link will be sent.",
    };

    if (!user) {
      return res.json(genericResponse);
    }

    const resend = passwordResetResend();

    if (!resend) {
      console.error("Password reset email is not configured.");
      return res.json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const token_hash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expires_at = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);

    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.deleteMany({
        where: { user_id: user.id },
      });

      await tx.passwordResetToken.create({
        data: {
          token_hash,
          user_id: user.id,
          expires_at,
        },
      });
    });

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      await prisma.passwordResetToken.deleteMany({
        where: { token_hash },
      });

      console.error("FRONTEND_URL is not configured for password reset.");
      return res.json(genericResponse);
    }

    const resetUrl = new URL("/reset-password", frontendUrl);
    resetUrl.searchParams.set("token", rawToken);

    try {
      const result = await resend.emails.send({
        from: "KuberList <noreply@kuberlist.com>",
        to: [user.email],
        subject: "Reset your KuberList password",
        text: [
          `Hello ${user.name},`,
          "",
          "We received a request to reset your KuberList password.",
          "",
          `Use this link within 30 minutes: ${resetUrl.toString()}`,
          "",
          "If you did not request a password reset, you can ignore this email.",
        ].join("\n"),
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;line-height:1.6">
            <h2>Reset your KuberList password</h2>
            <p>Hello ${String(user.name).replace(
              /[&<>"']/g,
              (c) =>
                ({
                  "&": "&amp;",
                  "<": "&lt;",
                  ">": "&gt;",
                  '"': "&quot;",
                  "'": "&#39;",
                })[c],
            )},</p>
            <p>We received a request to reset your KuberList password.</p>
            <p>
              <a href="${resetUrl.toString()}"
                 style="display:inline-block;background:#022440;color:#ffffff;padding:12px 20px;text-decoration:none;border-radius:5px">
                Reset password
              </a>
            </p>
            <p>This link expires in 30 minutes and can only be used once.</p>
            <p>If you did not request this, you can safely ignore this email.</p>
          </div>
        `,
      });

      if (result.error) {
        throw new Error("Resend rejected the password-reset email.");
      }
    } catch (emailError) {
      await prisma.passwordResetToken.deleteMany({
        where: { token_hash },
      });

      console.error(
        "Password-reset email delivery failed:",
        emailError?.message || "Unknown email delivery error",
      );
    }

    return res.json(genericResponse);
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body || {};

    if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
      throw createError(400, "This reset link is invalid or expired.");
    }

    if (typeof password !== "string" || password.length < 8) {
      throw createError(400, "Password must be at least 8 characters.");
    }

    if (password.length > 128) {
      throw createError(400, "Password is too long.");
    }

    const token_hash = crypto.createHash("sha256").update(token).digest("hex");

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token_hash },
    });

    if (!resetRecord || resetRecord.expires_at <= new Date()) {
      throw createError(400, "This reset link is invalid or expired.");
    }

    const password_hash = await bcrypt.hash(password, 12);

    await prisma.$transaction(async (tx) => {
      // Consume the token only if it is still valid.
      const consumed = await tx.passwordResetToken.deleteMany({
        where: {
          id: resetRecord.id,
          expires_at: { gt: new Date() },
        },
      });

      if (consumed.count !== 1) {
        throw createError(400, "This reset link is invalid or expired.");
      }

      await tx.user.update({
        where: { id: resetRecord.user_id },
        data: { password_hash },
      });

      // Remove other reset links and revoke refresh tokens.
      await tx.passwordResetToken.deleteMany({
        where: { user_id: resetRecord.user_id },
      });

      await tx.refreshToken.deleteMany({
        where: { user_id: resetRecord.user_id },
      });
    });

    return res.json({
      success: true,
      message:
        "Your password has been reset. Please log in with your new password.",
    });
  } catch (err) {
    next(err);
  }
};
