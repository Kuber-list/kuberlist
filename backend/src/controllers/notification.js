import prisma from '../utils/prisma.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where:   { user_id: req.user.id },
        orderBy: { created_at: 'desc' },
        skip, take: parseInt(limit),
      }),
      prisma.notification.count({ where: { user_id: req.user.id } }),
      prisma.notification.count({ where: { user_id: req.user.id, read: false } }),
    ]);

    res.json({ success: true, data: notifications, unread_count: unreadCount, pagination: { page: parseInt(page), total, pages: Math.ceil(total/parseInt(limit)) } });
  } catch (err) { next(err); }
};

export const markRead = async (req, res, next) => {
  try {
    const { ids } = req.body; // array of notification ids, or empty = mark all
    const where = ids?.length
      ? { id: { in: ids }, user_id: req.user.id }
      : { user_id: req.user.id, read: false };
    await prisma.notification.updateMany({ where, data: { read: true } });
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await prisma.notification.count({ where: { user_id: req.user.id, read: false } });
    res.json({ success: true, data: { count } });
  } catch (err) { next(err); }
};
