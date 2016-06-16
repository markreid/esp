# esp

A really simple boilerplate for getting an app with [Express](http://expressjs.com/), [Socket.IO](http://socket.io) and [Passport](http://passportjs.org) up and running.

I find myself starting a lot of apps with this setup so I figured I'd knock up a quick boilerplate that just covers the basics of setting up an OAuth2-based authentication with Passport and applying it to a simple Express app with Socket.io integration for realtime sockety goodness.

## Running the demo app

This repo is intended as more of a guide, but if you want you can fairly easily run the app.

I've used the Google OAuth2 strategy because that's the one I use most frequently. You can trivially switch it out for another strategy, or you can get your own [Google OAuth 2 credentials](https://developers.google.com/identity/protocols/OAuth2) and run it.

To get it going:

```
npm install
# copy config.js.example to config.js and edit your configuration
npm run start
```


## notes

#### Session Stores
We use MemoryStore as the session store, which you *shouldn't* do in production. In a real app you'll want to switch it out with [something else](https://github.com/expressjs/session#compatible-session-stores).


#### Express middleware
There are two things you need to consider when using middleware to change the behaviour of routes:

* Middleware must be declared BEFORE the route (ie app.use before app.get or app.route)
* App routes will run any middleware that matches the _beginning_ of the path. ie, `app.use('/foobar')` will run on
  * `app.get('/foobar')`
  * `app.get('/foobar/qux')`
