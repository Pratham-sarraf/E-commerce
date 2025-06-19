const Admin = require("../models/admin");

async function isAdmin(req, res, next) {
  try {
 
    const { isAdmin } = req.user;

    if(isAdmin){
        return next();
    } else {
      return res.redirect("/");
    }
  } catch (err) {
    console.error("Error in isLogin middleware:", err);
    return res.status(500).send("Server error");
  }
}

module.exports = isAdmin;
