const BaseBot = require('bot-sdk')
const chatbot = require('./chatbot')
const config = require('./config')
const request = require('request')
const Request = require('bot-sdk/lib/Request')

class Bot extends BaseBot {
    constructor(postData) {
        super(postData)

        const request = new Request(postData)
        const user_id = 'dueros_' + request.getUserId()

        this.addLaunchHandler(() => {
            this.waitAnswer()
            var that = this
            return chatbot.replyToEvent(user_id, 'open-app')
                          .then((result) => { return that.getQrcodeImageUrl(user_id, result)})
                          .then((result) => { return new Promise((resolve) => { resolve(that.buildResponse(result)) }) })
                          .catch((error) => {
                            console.log('Error occurred: ' + error + ', ' + error.stack)
                        })
        });

        this.addIntentHandler('ai.dueros.common.default_intent', () => {
            this.waitAnswer()
            var that = this
            return chatbot.replyToText(user_id, request.getQuery())
                          .then((result) => { return that.getQrcodeImageUrl(user_id, result)})
                          .then((result) => { return new Promise((resolve) => { resolve(that.buildResponse(result)) }) })
                          .catch((error) => {
                            console.log('Error occurred: ' + error)
                        })
        });
        
        this.addSessionEndedHandler(() => {
            this.setExpectSpeech(false)
            this.endDialog()
            var that = this
            return chatbot.replyToEvent(user_id, 'close-app')
                          .then((result) => { return that.getQrcodeImageUrl(user_id, result)})            
                          .then((result) => { return new Promise((resolve) => { resolve(that.buildResponse(result)) }) })
                          .catch((error) => {
                              console.log('Error occurred: ' + error)
                          })
        })
    }

    getQrcodeImageUrl(userId, result) {
        return new Promise( (resolve, reject) => { 
            request( { method : 'GET'
                     , uri : config.wechat_url + `/qrcode?scene=${userId}&source=dueros`
                     }, (err, res, body) => {
                        if (!err && res.statusCode == 200) {
                            result.image = config.wechat_url + JSON.parse(body).url
                            console.log('get image : ' + result.image)
                            resolve(result);
                          } else {
                            reject(err);
                          }
                     }
                )
            } 
        );
    }

    buildResponse(result) {
        console.log('intent : ' + result.intent)
        if (result.intent.indexOf('close-app') != -1) {
            this.setExpectSpeech(false)
            this.endDialog()
            return {outputSpeech: result.reply}
        }
        if ((result.intent.indexOf('how-to-record') != -1) ||
            (result.intent.indexOf('unknown') != -1)) {
                let reply = '微信扫描二维码，使用小程序录课更方便哦'
                return {
                    directives: [this.getTemplateWithoutCourse(reply, result.image)],
                    outputSpeech: reply
                }
        }
        return {
            directives: [this.getTextTeplate(result.reply)],
            outputSpeech: result.reply
        }
    }
    
    getTextTeplate(text) {
        let bodyTemplate = new BaseBot.Directive.Display.Template.BodyTemplate1();
        bodyTemplate.setTitle('课程表');
        bodyTemplate.setPlainTextContent(text);
        bodyTemplate.setBackGroundImage(config.wechat_url + '/image/course1.jpg');
        let renderTemplate = new BaseBot.Directive.Display.RenderTemplate(bodyTemplate);
        return renderTemplate;
    }

    getTemplateWithoutCourse(text, image) {
        let bodyTemplate = new BaseBot.Directive.Display.Template.BodyTemplate3();
        bodyTemplate.setTitle('课程表');
        bodyTemplate.setPlainContent(text);
        bodyTemplate.setImage(image);
        bodyTemplate.setBackGroundImage(config.wechat_url + '/image/course1.jpg');
        let renderTemplate = new BaseBot.Directive.Display.RenderTemplate(bodyTemplate);
        return renderTemplate;        
    }
}

module.exports = Bot
