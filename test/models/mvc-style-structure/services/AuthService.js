// Authentication Service - Handles user authentication and authorization
import { createHash, randomBytes } from 'crypto';

export class AuthService {
  constructor() {
    this.sessions = new Map();
    this.secretKey = 'mvc-demo-secret-key';
  }

  async hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const hash = createHash('sha256').update(password + salt).digest('hex');
    return `${salt}:${hash}`;
  }

  async verifyPassword(password, hashedPassword) {
    const [salt, hash] = hashedPassword.split(':');
    const computedHash = createHash('sha256').update(password + salt).digest('hex');
    return hash === computedHash;
  }

  async generateToken(user) {
    const tokenData = {
      userId: user.id,
      email: user.email,
      issuedAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    const token = this.createToken(tokenData);
    this.sessions.set(token, tokenData);
    return token;
  }

  createToken(data) {
    const payload = Buffer.from(JSON.stringify(data)).toString('base64');
    const signature = createHash('sha256')
      .update(payload + this.secretKey)
      .digest('hex');
    return `${payload}.${signature}`;
  }

  async verifyToken(token) {
    if (!token) return null;

    const sessionData = this.sessions.get(token);
    if (!sessionData) return null;

    // Check if token is expired
    if (Date.now() > sessionData.expiresAt) {
      this.sessions.delete(token);
      return null;
    }

    return sessionData;
  }

  async refreshToken(oldToken) {
    const sessionData = this.sessions.get(oldToken);
    if (!sessionData) return null;

    // Remove old token
    this.sessions.delete(oldToken);

    // Create new token with extended expiry
    const newTokenData = {
      ...sessionData,
      issuedAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000)
    };

    const newToken = this.createToken(newTokenData);
    this.sessions.set(newToken, newTokenData);
    return newToken;
  }

  async revokeToken(token) {
    return this.sessions.delete(token);
  }

  async revokeAllTokensForUser(userId) {
    let revokedCount = 0;
    for (const [token, sessionData] of this.sessions.entries()) {
      if (sessionData.userId === userId) {
        this.sessions.delete(token);
        revokedCount++;
      }
    }
    return revokedCount;
  }

  isTokenExpired(sessionData) {
    return Date.now() > sessionData.expiresAt;
  }

  getActiveSessionCount() {
    return this.sessions.size;
  }

  cleanupExpiredSessions() {
    let cleanedCount = 0;
    for (const [token, sessionData] of this.sessions.entries()) {
      if (this.isTokenExpired(sessionData)) {
        this.sessions.delete(token);
        cleanedCount++;
      }
    }
    return cleanedCount;
  }
}
