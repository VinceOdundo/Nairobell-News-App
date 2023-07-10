import { db } from "../connect.js";

class User {
  constructor({
    id,
    username,
    firstName,
    lastName,
    email,
    pronouns,
    profilePic,
    password,
  }) {
    this.id = id;
    this.username = username;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.pronouns = pronouns;
    this.profilePic = profilePic;
    this.password = password;
  }

  // A method to save a new user to the database
  async save() {
    const q = `INSERT INTO user (username, firstName, lastName, email, pronouns, profilePic, password) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
    const values = [
      this.username,
      this.firstName,
      this.lastName,
      this.email,
      this.pronouns,
      this.profilePic,
      this.password,
    ];
    await db.query(q, values);
  }

  // A method to update an existing user in the database
  async update() {
    const q = `UPDATE user SET username = $1, firstName = $2, lastName = $3, email = $4, pronouns = $5, profilePic = $6 WHERE id = $7`;
    const values = [
      this.username,
      this.firstName,
      this.lastName,
      this.email,
      this.pronouns,
      this.profilePic,
      this.id,
    ];
    await db.query(q, values);
  }

  // A method to delete a user from the database
  async delete() {
    const q = `DELETE FROM user WHERE id = $1`;
    const values = [this.id];
    await db.query(q, values);
  }

  // A static method to find a user by id from the database
  static async findById(id) {
    const q = `SELECT * FROM user WHERE id = $1`;
    const values = [id];
    const result = await db.query(q, values);
    if (result.rows.length > 0) {
      return new User(result.rows[0]);
    } else {
      return null;
    }
  }

  // A static method to find a user by username from the database
  static async findByUsername(username) {
    const q = `SELECT * FROM user WHERE username = $1`;
    const values = [username];
    const result = await db.query(q, values);
    if (result.rows.length > 0) {
      return new User(result.rows[0]);
    } else {
      return null;
    }
  }

  // A static method to find all users from the database
  static async findAll() {
    const q = `SELECT * FROM user`;
    const result = await db.query(q);
    return result.rows.map((row) => new User(row));
  }
}

// Export the User model here
export default User;
