const User = require('../models/user')
const router = new express.Router();
const { SECRET_KEY } = require('../config')
const jwt = require("jsonwebtoken")
/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async function(res, req, next) {
    const { username, password } = req.body
    let user = await User.authenticate(username, password)
    
    if (user) {
        let token = jwt.sign({username, password}, SECRET_KEY)
        User.updateLoginTimestamp(username)
        return res.json( {token} )
    }

}) 

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post('/register', async function(res, req, next) {
    const { username, password, first_name, last_name, phone } = req.body
    let user = await User.register(username, password, first_name, last_name, phone)
    
    if (user) {
        let token = jwt.sign({username, password}, SECRET_KEY)
        User.updateLoginTimestamp(username)
        return res.json( {token} )
    }

}) 