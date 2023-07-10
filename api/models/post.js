import { db } from "../connect.js";

class Post {
  constructor({ id, url, thumbnail, date, category, title }) {
    this.id = id;
    this.url = url;
    this.thumbnail = thumbnail;
    this.date = date;
    this.category = category;
    this.title = title;
  }

  // A method to save a new post to the database
  async save() {
    const q = `INSERT INTO post (url, thumbnail, date, category, title) VALUES ($1, $2, $3, $4, $5)`;
    const values = [
      this.url,
      this.thumbnail,
      this.date,
      this.category,
      this.title,
    ];
    await db.query(q, values);
  }

  // A method to update an existing post in the database
  async update() {
    const q = `UPDATE post SET url = $1, thumbnail = $2, date = $3, category = $4, title = $5 WHERE id = $6`;
    const values = [
      this.url,
      this.thumbnail,
      this.date,
      this.category,
      this.title,
      this.id,
    ];
    await db.query(q, values);
  }

  // A method to delete a post from the database
  async delete() {
    const q = `DELETE FROM post WHERE id = $1`;
    const values = [this.id];
    await db.query(q, values);
  }

  // A static method to find a post by id from the database
  static async findById(id) {
    const q = `SELECT * FROM post WHERE id = $1`;
    const values = [id];
    const result = await db.query(q, values);
    if (result.rows.length > 0) {
      return new Post(result.rows[0]);
    } else {
      return null;
    }
  }

  // A static method to find all posts from the database
  static async findAll() {
    const q = `SELECT * FROM post ORDER BY date DESC`;
    const result = await db.query(q);
    return result.rows.map((row) => new Post(row));
  }
}

export default Post;
