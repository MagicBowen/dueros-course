const BaseBot = require('bot-sdk');
const chatbot = require('./chatbot');
const Request = require('bot-sdk/lib/Request')

class Bot extends BaseBot {
    constructor(postData) {
        super(postData)

        const request = new Request(postData)
        const user_id = 'dueros_' + request.getUserId()

        this.addLaunchHandler(() => {
            this.waitAnswer()
            return chatbot.replyToEvent(user_id, 'open-app', null, this)
        });

        this.addIntentHandler('ai.dueros.common.default_intent', () => {
            this.waitAnswer()
            return chatbot.replyToText(user_id, request.getQuery(), null, this)
        });
        
        this.addSessionEndedHandler(() => {
            this.setExpectSpeech(false)
            this.endDialog()
            return chatbot.replyToEvent(user_id, 'close-app', null, this)
        })
    }

    buildResponse(intent, result) {
        console.log(intent)
        if (intent === 'close-app') {
            this.setExpectSpeech(false)
            this.endDialog()            
        }
        return {
            directives: [this.getTemplate1(result)],
            outputSpeech: result            
        }
    }
    
    getTemplate1(text) {
        let bodyTemplate = new BaseBot.Directive.Display.Template.BodyTemplate1();
        bodyTemplate.setPlainTextContent(text);
        let renderTemplate = new BaseBot.Directive.Display.RenderTemplate(bodyTemplate);
        return renderTemplate;
    }
}

module.exports = Bot
