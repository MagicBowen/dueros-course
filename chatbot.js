request = require('request-json');
config = require("./config")

var client = request.createClient(config.chatbot_url)

console.log("connect to chatbot dm client:" + config.chatbot_url)

const agent = 'course-record';
function concatReplies(replies) {
    var result = '';
    for(var i = 0; i < replies.length; i++) {
        result += replies[i];
    }
    console.log('reply: ' + result)
    return result;
}

function asyncPost(data, dueros) {
    return new Promise(function (resolve, reject) {
        client.post('query', data, function (error, res, body) {
        if (!error && res.statusCode == 200) {
          resolve({intent : body.intents[0].name, reply : concatReplies(body.reply)});
        } else {
          console.log(error)
          reject(error);
        }
      });
    });
  }

function replyToText(userId, text, userContext, dueros) {
    var data = { query : { query : text, confidence : 1.0 }, session : userId, agent : agent, userContext:userContext };
    console.log('user : ' + userId + ', query: ' + text)
    return asyncPost(data, dueros)
}

function replyToEvent(userId, eventType, userContext, dueros) {
    var data = { event : { name : eventType }, session : userId, agent : agent, userContext:userContext };
    console.log('user : ' + userId + ', event: ' + eventType)
    return asyncPost(data, dueros)
}

module.exports = {
    replyToText,
    replyToEvent
}