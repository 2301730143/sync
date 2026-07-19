const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { signToken } = require('../utils/jwt');
const { ok, created, AppError } = require('../utils/apiResponse');

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarColor: user.avatarColor,
    emailNotificationsEnabled: user.emailNotificationsEnabled,
  };
}

async function register(req, res) {
  const { name, email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  const user = await prisma.user.create({
    data: { name, email, passwordHash, avatarColor },
  });

  const token = signToken({ sub: user.id, name: user.name, email: user.email });
  return created(res, { user: publicUser(user), token });
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken({ sub: user.id, name: user.name, email: user.email });
  return ok(res, { user: publicUser(user), token });
}

async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new AppError('User not found', 404);
  return ok(res, { user: publicUser(user) });
}

async function updatePreferences(req, res) {
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { emailNotificationsEnabled: req.body.emailNotificationsEnabled },
  });
  return ok(res, { user: publicUser(user) });
}

module.exports = { register, login, me, updatePreferences };
