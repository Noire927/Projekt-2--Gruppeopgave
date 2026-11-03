class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.preferences = data.preferences;
  }
}

module.exports = User;
