/**
 * ESP
 * Boilerplate app for combining
 * Express & Socket.IO with auth
 * from Passport.
 */


const config = require('./config');

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cookie = require('cookie');
const memoryStore = new session.MemoryStore(); // see README - don't use MemoryStore in prod
const GoogleStrategy = require('passport-google-oauth20').Strategy;


// instantiate an express app
const app = express();

// basic session configuration, use our memoryStore (see README)
app.use(session({
  secret: config.SESSION_SECRET,
  store: memoryStore,
  resave: false,
  saveUninitialized: true,
}));


// provide an http server for our app, and bind socket.io to it
const http = require('http').Server(app);
const io = require('socket.io')(http);



// time to configure passport...

// serialize the user to save in the session store.
// generally speaking, you just want to store a unique id
// to keep session storage small.
passport.serializeUser((userObject, done) => {
  done(null, userObject.id);
});

// inverse of the above. take the serialized user (their id)
// and fetch the full user object. this will be attached to
// every request as req.session.passport.user
passport.deserializeUser((userId, done) => {
  done(null, {
    id: userId
  });
});


// add passport middleware to app
app.use(passport.initialize());
app.use(passport.session());


// configure passport strategies

// Google OAuth2
passport.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: config.GOOGLE_AUTH_CALLBACK_URL,
  },
  function googleStrategyCallback(accessToken, refreshToken, googleProfile, callback) {
    /**
     * This is called by Passport when the user comes back from the Google OAuth2 sign-in.
     * We take the profile object returned by Google and find our matching user.
     * In a real app, this is where you'd want to look in your DB for the user, like:
     *
     *   db.users.findOne({
     *     googleProfileId: googleProfile.id
     *   }).then(user => {
     *     return callback(null, user);
     *   }).catch(err => {
     *     return callback(err);
     *   });
     *
     * But! for this basic demo, we just return an object with an id property.
     */

    return callback(null, {
      id: googleProfile.id
    });
  }
));

// add the route for signing in via Google
app.get('/auth/google', passport.authenticate('google', {
  scope: ['email'] // request specific scope/permissions from Google
}));

// callback route that Google will redirect to after a successful login
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function successfulGoogleAuthCallback(req, res) {
    // the user's now successfully authenticated.
    // their user object is now available on each subsequent request:
    console.log(req.session.passport.user);
    res.redirect('/loggedin');
  }
);


// serve the index.
// you can see this regardless of whether you're logged in or not.
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

/**
 * express auth middleware.
 * prevents access to an express route if the user isn't authed.
 *
 * this middleware will apply to any routes that match the specified
 * path - ie, /loggedin AND /loggedin/foobar
 * and will be applied to any routes declared AFTER the middleware.
 */
app.use('/loggedin', function authMiddleware(req, res, next) {
  if(!req.session.passport) {
    return res.redirect('/');
  }
  next();
});


// serve our logged-in page.
// auth middleware will prevent access to this unless you're logged in.
app.get('/loggedin', (req, res) => {
  res.sendFile(__dirname + '/views/loggedin.html');
});


/**
 * socket.io auth middleware
 * prevent socket connection if the user isn't authed.
 */
io.use((socket, next) => {
  // the same cookie that express sets is passed to the socket request
  // so we need to parse it, and try and load a session from the store.
  // this is more-or-less what app.use(passport.session()) does for our
  // express routes.
  const parsedCookie = cookie.parse(socket.request.headers.cookie);
  const sessionId = parsedCookie['connect.sid'];

  // not absolutely sure why we need to substring this, i guess MemoryStore
  // doesn't use the entire ID as a key.
  const shortId = sessionId.substr(2, 32);
  memoryStore.load(shortId, function(err, session){
    if(!session || !session.passport) {
      return next(new Error('Not authenticated'));
    }
    next();
  });
});


// socket.io connection handler
io.on('connection', (socket) => {
  console.log('a socket is now connected');

  socket.on('message', function socketMessageHandler(){
    console.log('message received');
  });
});


// start the http server
http.listen(config.PORT, () => {
  console.log(`Running on ${config.PORT}`);
});

