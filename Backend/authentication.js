const crypto = require("node:crypto");

class Authentication {
  constructor(userManager) {
    this.userManager = userManager;
    this.activeTokens = {};
  }

  // Log in a user
  login(email, password) {
    const user = this.userManager.findByEmail(email);

    if (!user || password !== user.password) {
      return null;
    }

    // Generate a login token
    const token = crypto.randomBytes(32).toString("hex");

    this.activeTokens[token] = user.id;

    return token;
  }

  // Verify a login token
  verifyToken(token) {
    return this.activeTokens[token] !== undefined;
  }
}

module.exports = Authentication;
