'use strict';
var express = require('express'),
  router = require('./api/endpoints');

server(process.env.PORT);

function server(port = 8080) {
  express()
    .use(router)
    .listen(port);
}
