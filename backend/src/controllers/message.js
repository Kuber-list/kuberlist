import { notifyMessageReceived } from "../services/notification.service.js";
import { trackActivity } from "../middleware/activity.js";
import prisma from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";

// ── POST /messages ────────────────────────────────────────────────
export const sendMessage = async (req, res, next) => {
  try {
    const { connection_id, message, attachments } = req.body;
    if (!connection_id) throw createError(400, "connection_id is required");
    if (!message?.trim()) throw createError(400, "message cannot be empty");

    const connection = req.connection;
    if (connection.status === "CLOSED") {
      throw createError(400, "Cannot send messages in a closed connection");
    }

    const msg = await prisma.message.create({
      data: {
        connection_id,
        sender_id: req.user.id,
        message: message.trim(),
        attachments: attachments || [],
        read_by: [req.user.id], // sender has already "read" their own message
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });

    // Notify the other party
    const conn = await prisma.connection.findUnique({
      where: {
        id: connection_id,
      },

      include: {
        listing: true,

        investor: {
          select: {
            name: true,
          },
        },

        seeker: {
          select: {
            name: true,
          },
        },
      },
    });
    const recipientId =
      req.user.id === conn.investor_id ? conn.seeker_id : conn.investor_id;
    const senderName =
      conn.investor_id === req.user.id
        ? conn.investor?.name
        : conn.seeker?.name;
    notifyMessageReceived(
      recipientId,
      senderName || "Someone",
      conn.listing?.name || "your listing",
      conn.id,
    ).catch((err) => {
      console.error(err);
    });
    // Track as DISCUSSION activity
    if (conn.listing_id) {
      trackActivity(req.user.id, conn.listing_id, "DISCUSSION", null).catch(
        () => {},
      );
    }
    res.status(201).json({ success: true, data: msg });
  } catch (err) {
    next(err);
  }
};

// ── GET /messages/:connection_id ──────────────────────────────────
export const getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { connection_id: req.connection.id },
        include: { sender: { select: { id: true, name: true, role: true } } },
        orderBy: { created_at: "asc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.message.count({ where: { connection_id: req.connection.id } }),
    ]);

    // Mark all unread messages in this connection as read for current user
    const unreadIds = messages
      .filter(
        (m) => m.sender_id !== req.user.id && !m.read_by.includes(req.user.id),
      )
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      // Update in background — don't block response
      prisma.message
        .updateMany({
          where: { id: { in: unreadIds } },
          data: { read_by: { push: req.user.id } },
        })
        .catch(() => {});
    }

    res.json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /messages/unread-count ────────────────────────────────────
// Returns total unread message count across all connections for the current user
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all connections this user belongs to
    const connections = await prisma.connection.findMany({
      where: {
        OR: [{ investor_id: userId }, { seeker_id: userId }],
        status: "ACTIVE",
      },
      select: { id: true },
    });

    if (connections.length === 0) {
      return res.json({ success: true, data: { count: 0 } });
    }

    const connectionIds = connections.map((c) => c.id);

    // Count messages not sent by this user and not in their read_by array
    const unread = await prisma.message.count({
      where: {
        connection_id: { in: connectionIds },
        sender_id: { not: userId },
        NOT: { read_by: { has: userId } },
      },
    });

    res.json({ success: true, data: { count: unread } });
  } catch (err) {
    next(err);
  }
};
