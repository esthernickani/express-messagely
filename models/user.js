/** User class for message.ly */

const { DB_URI, BCRYPT_WORK_FACTOR } = require("../config");
const db = require("../db");
const ExpressError = require("../expressError");
const current_timestamp = require("../helper_func")
const bcrypt = require("bcrypt")


/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    const hashedPwd = await bcrypt.hash(
      password, BCRYPT_WORK_FACTOR
    )
    const result = await db.query(
        `INSERT INTO user
        (username, password, first_name, last_name, phone)
        VALUES ($1, $2, $3, $4, $5, current_timestamp)
        RETURNING username, password, first_name, last_name, phone, join_at`,
      [username, hashedPwd, first_name, last_name, phone])

      return result.rows[0]
   }  

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    try {
      const result = await db.query(
        `SELECT password FROM users WHERE username = $1`,
        [username]);
        const user = result.rows[0];
  
        if (user) {
          if (await bcrypt.compare(password, user.password) === true) {
            return true
          }
        }
        throw new ExpressError("Invalid user/password", 400)
    } catch (err) {
      return next(err)
    }
    

  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    const result = await db.query(
      `INSERT into users (last_login_at)
      VALUES ($1)
      RETURNING last_login_at`
      [current_timestamp]);

      return result.rows[0];
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    const result = await db.query(
      `SELECT * FROM users
      RETURNING username, first_name, last_name, phone`
    )

    return result.rows[0]
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT * FROM users
      WHERE username = $1
      RETURNING first_name, last_name, phone, join_at, last_login_at`
    [username])

    return result.rows[0]
   }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const messages_result = await db.query(
      `SELECT * FROM messages
      WHERE from_username = $1
      RETURNING id, to_user, body, sent_at, read_at`
      [username]);

    const message_result = messages_result.rows[0]

    const to_user_result = await db.query(
      `SELECT * FROM users
      WHERE username = $1
      RETURNING username, first_name, last_name, phone`
    [message_result.to_user])
    
    const result = [
      {
        'id': message_result.id,
        'to_user': to_user_result.rows[0],
        'body': message_result.body,
        'sent_at': message_result.sent_at,
        'read_at': message_result.read_at
      }
    ]
    return result;
   }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const messages_result = await db.query(
      `SELECT * FROM messages
      WHERE to_username = $1
      RETURNING id, to_user, body, sent_at, read_at`
      [username]);

    const message_result = messages_result.rows[0]

    const from_user_result = await db.query(
      `SELECT * FROM users
      WHERE username = $1
      RETURNING username, first_name, last_name, phone`
    [message_result.from_user])
    
    const result = [
      {
        'id': message_result.id,
        'from_user': from_user_result.rows[0],
        'body': message_result.body,
        'sent_at': message_result.sent_at,
        'read_at': message_result.read_at
      }
    ]
    return result;
   }
}


module.exports = User;