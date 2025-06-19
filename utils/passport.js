const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/user");

passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username, password });
    if (user) return done(null, user);


    return done(null, false, { message: "User not found" });
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    let user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});
