const jwt = require("jsonwebtoken");
const config = process.env;

module.exports.verifyToken = (req, res, next) => {
    const token = 
        req.body.token || req.query.token || req.headers["x-access-token"];

    if(!token) {
        return res.status(403).send("A token is required for authentication")
    }
    try {
        const decoded = jwt.verify(token, config.TOKEN_KEY);
        req.user = decoded
    }catch(err) {
        return res.status(401).send("Invalid Token")
    }
    return next();
};


module.exports.isLoggedIn = (req, res, next) => {
    if (!req.session.user_id) {
        // Store thr URL they are requesting
        req.session.returnTo = req.originalUrl
        req.flash('error', 'You must be signed in');
        return res.redirect('/login')
    }
    next();
}
