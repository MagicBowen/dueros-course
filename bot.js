const BaseBot = require('bot-sdk');
const chatbot = require('./chatbot');

class Bot extends BaseBot {
    /**
     * postData可以不传，由于DuerOS对bot是post请求，sdk默认自动获取
     */
    constructor(postData) {
            super(postData);

            const request = new BaseBot.Request(postData)

            this.addLaunchHandler(() => {
                return chatbot.replyToEvent(request.getUserId(), 'open-app')
            });

            this.addIntentHandler('ai.dueros.common.default_intent', () => {
                return chatbot.replyToText(request.getUserId(), request.getQuery())
            });

            this.addSessionEndedHandler(() => {
                return chatbot.replyToEvent(request.getUserId(), 'close-app')
            })
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