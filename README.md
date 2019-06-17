# mock-api

mock-api is a simple node.js project that lets you easily mock up APIs, generate custom data, and preform operations on it using RESTful interface. 
here is some scenarios which mock-api can be used on

- By front-end developers to create a mock server to simulate each endpoint and its corresponding response before sending an actual request. Developers can view potential responses, without spinning up a back end.
- Running Performance test for some particular part of code, while mocking the APIs called over https.

## Quick Start

1.  `npm install`
2.  `node server.js`
3.  Open browser to http://localhost:8080 and browse the mock apis.

### Add a new mock endpoint 

- Add your route on `endpoint.js` 
  - If you are adding a new route group make sure to add a folder for json results under `api`
- Add rewrite rule for new route group on `web.config`
  - This is needed just if you are adding a new route group

### Run locally using IISnode

- Install [IISnode](https://github.com/tjanczuk/iisnode/blob/master/README.md) on ur local machin
- Add a new iis site with a child app as `mock` and point it to the repo folder 
- Make sure to run `npm install` on repo root

## Deploy 

- This project is setup to be deployed by TeamCity 