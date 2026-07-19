const { verifyToken } = require('../utils/jwt');
const { AppError } = require('../utils/apiResponse');
const prisma = require('../config/db');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw new AppError('Authentication required', 401);
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    throw new AppError('Invalid or expired session', 401);
  }

  req.user = {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
  };

  next();
}

async function requireProjectAccess(req, res, next) {
  const projectId = req.params.id || req.params.projectId;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: true,
    },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const membership = project.members.find(
    (member) => member.userId === req.user.id
  );

  const isOwner = project.ownerId === req.user.id;

  if (!isOwner && !membership) {
    throw new AppError(
      'You do not have access to this project',
      403
    );
  }

  req.project = project;
  req.membership = membership || null;
  req.isProjectOwner = isOwner;

  next();
}

module.exports = {
  requireAuth,
  requireProjectAccess,
};