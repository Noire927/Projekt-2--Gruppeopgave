const fs = require("node:fs");
const User = require("./user");

class UserManager {
  constructor(users, usersFile) {
    this.users = users;
    this.usersFile = usersFile;
  }

  // Add a new user
  addUser(userData) {
    userData.id = this.users.length + 1;

    const user = new User(userData);

    this.users.push(user);

    this.saveUsers();

    return user;
  }

  // Find a user by email
  findByEmail(email) {
    return this.users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  // Save users to the JSON file
  saveUsers() {
    fs.writeFileSync(this.usersFile, JSON.stringify(this.users, null, 2));
  }
}

module.exports = UserManager;
