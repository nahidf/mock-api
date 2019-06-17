'use strict';
var fs = require('fs'),
  router = require('express').Router();

/* Authy Mock APIs */

router.get("/mock/authy/phones/verification/check", file("api/authy/verify.json"));
router.post("/mock/authy/phones/verification/start", file("api/authy/start.json"));


function file(filename) {
  return (request, response) => {
    response.writeHead(200, 'OK', {"Transfer-Encoding": "chunked", "Content-Type": "application/json"});
    fs.createReadStream(filename).pipe(response);
  };
}

function ok(request, response) {
  response.writeHead(200, 'OK');
  response.end();
}

module.exports = router;
