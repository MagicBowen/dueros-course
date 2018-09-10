const BaseBot = require('bot-sdk');
const chatbot = require('./chatbot');
const Request = require('bot-sdk/lib/Request')

class Bot extends BaseBot {
    /**
     * postData可以不传，由于DuerOS对bot是post请求，sdk默认自动获取
     */
    constructor(postData) {
        super(postData);

        const request = new Request(postData)
        const user_id = 'dueros_' + request.getUserId()

        this.addLaunchHandler(() => {
            this.waitAnswer()
            return chatbot.replyToEvent(user_id, 'open-app', this.buildResponse)
        });

        this.addIntentHandler('ai.dueros.common.default_intent', () => {
            this.waitAnswer()
            return chatbot.replyToText(user_id, request.getQuery(), this.buildResponse)
        });
        
        this.addSessionEndedHandler(() => {
            this.setExpectSpeech(false)
            this.endDialog()
            return chatbot.replyToEvent(user_id, 'close-app', this.buildResponse)
        })
    }

    buildResponse(intent, result) {
        if (intent === 'close-app') {
            this.setExpectSpeech(false)
            this.endDialog()            
        }
        return {
            directives: [this.getTemplate1(result)],
            outputSpeech: result            
        }
    }
    /**
     *  获取文本展现模板
     *
     *  @param {string} text 歌曲详情
     *  @return {RenderTemplate} 渲染模版
     */
    getTemplate1(text) {
        let bodyTemplate = new BaseBot.Directive.Display.Template.BodyTemplate1();
        bodyTemplate.setPlainTextContent(text);
        let renderTemplate = new BaseBot.Directive.Display.RenderTemplate(bodyTemplate);
        return renderTemplate;
    }
}

module.exports = Bot