require('dotenv').config();
var _ = require('underscore');
var http = require('http');
var request = require('request');
var async = require('async');
var bodyParser = require('body-parser');
var express = require('express');
var app = express();
app.use(bodyParser.json());


var HYLO_URL  = process.env.HYLO_URL;
var HOOKS_URL = HYLO_URL + '/noo/community/:communityId/hooks';
var POST_URL  = HYLO_URL + '/noo/post';

var SERVICE_TOKEN = process.env.WEBHOOK_SERVICE_TOKEN;

app.post('/services/:communityId/:hookId/:hookSecret', function (req, res) {
 
  // check using Hylo api whether this is a valid webhook for the community
  request.get(HOOKS_URL + '?webhooks_token=' + SERVICE_TOKEN.replace(':communityId', req.params.communityId), function (err, response, body) {
    if (err) {
      console.log(err);
      return res.sendStatus(400); // TODO
    }

    var hooks;
    try {
      hooks = JSON.parse(body);
    } catch (err) {
      console.log(err);
      return res.sendStatus(400); // TODO
    }
    var hookId = req.params.hookId;
    var hookSecret = req.params.hookSecret;
    var communityHasHook = _.find(hooks, function (hook) { return hookId === hook.id && hookSecret === hook.secret });

    if (!communityHasHook) return res.sendStatus(404);
 
    var options = {
      uri: POST_URL, 
      form: {
        hook_id: hookId,
        hook_secret: hookSecret,
        webhooks_token: SERVICE_TOKEN,
        community: req.params.communityId,
        payload: req.body
      }
    };

    request.post(options, function (err, response, body) {
       if (err) {
         console.log(err);
         return res.sendStatus(500);
       }
       res.sendStatus(200); // HURRAY
    }); // request.post
  }); // request.get
}); // app.post

var server = http.createServer(app);
server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Hooks server listening at", addr.address + ":" + addr.port);
});