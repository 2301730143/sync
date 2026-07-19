const prisma = require('../config/db');
const { ok, AppError } = require('../utils/apiResponse');

async function listNotifications(req, res) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return ok(res, notifications);
}

async function markRead(req, res) {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification || notification.userId !== req.user.id) {
    throw new AppError('Notification not found', 404);
  }
  const updated = await prisma.notification.update({ where: { id: notification.id }, data: { isRead: true } });
  return ok(res, updated);
}

module.exports = { listNotifications, markRead };
