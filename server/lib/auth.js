import jwt from 'jsonwebtoken';

export const COOKIE_NAME = 'hoop_session';

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  }
  return secret;
}

export function createSessionToken(user) {
  return jwt.sign(
    { sub: String(user.id), email: user.email, name: user.display_name },
    jwtSecret(),
    { expiresIn: '7d' },
  );
}

export function setSessionCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    path: '/',
  });
}

export function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'Please log in to continue.' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret());
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      name: payload.name,
    };
    return next();
  } catch {
    clearSessionCookie(res);
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}

