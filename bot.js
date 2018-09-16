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
        if (intent.indexOf('close-app') != -1) {
            this.setExpectSpeech(false)
            this.endDialog()
            return {
                outputSpeech: result
            }
        }
        return {
            directives: [this.getTextTeplate(result)],
            outputSpeech: result
        }
    }
    
    getTextTeplate(text) {
        let bodyTemplate = new BaseBot.Directive.Display.Template.BodyTemplate1();
        bodyTemplate.setTitle('课程表');
        bodyTemplate.setPlainTextContent(text);
        let renderTemplate = new BaseBot.Directive.Display.RenderTemplate(bodyTemplate);
        return renderTemplate;
    }
}

module.exports = Bot
