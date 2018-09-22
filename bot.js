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
        const user_context = {
            supportDisplay : this.isSupportDisplay()
        }

        this.addLaunchHandler(() => {
            this.waitAnswer()
            var that = this
            return chatbot.replyToEvent(user_id, 'open-app', user_context)
                          .then((result) => { return that.getQrcodeImageUrl(user_id, result)})
                          .then((result) => { return new Promise((resolve) => { resolve(that.buildResponse(result)) }) })
                          .catch((error) => {
                            console.log('Error occurred: ' + error + ', ' + error.stack)
                        })
        });

        this.addIntentHandler('ai.dueros.common.default_intent', () => {
            this.waitAnswer()
            var that = this
            return chatbot.replyToText(user_id, request.getQuery(), user_context)
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
            return chatbot.replyToEvent(user_id, 'close-app', user_context)
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
        if (result.intent.indexOf('close-app') != -1) {
            this.setExpectSpeech(false)
            this.endDialog()
            return {outputSpeech: result.reply}
        }

        if (this.shouldRedirectForDisplay(result)) {
            let reply = `推荐您使用微信扫码录入课程。或者直接对我说出您${result.data[0].time}要上的全部课程名称？`
            return {
                directives: [this.getTemplateWithoutCourse(reply, result.image)],
                outputSpeech: reply
            }
        }

        if (this.shouldDisplayQrcode(result)) {
            let reply = '使用微信扫描二维码，打开小程序，录课更方便！'
            return {
                directives: [this.getTemplateWithoutCourse(reply, result.image)],
                outputSpeech: reply
            }         
        }

        if (this.shouldFindDarwin(result)) {
            return {
                directives: [this.getTemplateWithoutCourse(result.reply, result.image)],
                outputSpeech: result.reply
            }   
        }

        return {
            directives: [this.getTextTeplate(result.reply)],
            outputSpeech: result.reply
        }
    }

    shouldRedirectForDisplay(result) {
        if (!this.isSupportDisplay()) return false
        return ((result.data)&&(result.data[0].intent === 'record-course'))
    }

    shouldDisplayQrcode(result) {
        if (!this.isSupportDisplay()) return false
        return (result.intent.indexOf('how-to-record') != -1)
    }

    shouldFindDarwin(result) {
        if (!this.isSupportDisplay()) return false
        return (result.reply.indexOf('哒尔文') != -1)
    }
    
    getTextTeplate(text) {
        let bodyTemplate = new BaseBot.Directive.Display.Template.BodyTemplate1();
        bodyTemplate.setTitle('课程表');
        bodyTemplate.setPlainTextContent(text);
        bodyTemplate.setBackGroundImage(config.background);
        let renderTemplate = new BaseBot.Directive.Display.RenderTemplate(bodyTemplate);
        return renderTemplate;
    }

    getTemplateWithoutCourse(text, image) {
        let bodyTemplate = new BaseBot.Directive.Display.Template.BodyTemplate2();
        bodyTemplate.setTitle('课程表');
        bodyTemplate.setPlainContent(text);
        bodyTemplate.setImage(image, 100, 100);
        bodyTemplate.setBackGroundImage(config.background);
        let renderTemplate = new BaseBot.Directive.Display.RenderTemplate(bodyTemplate);
        return renderTemplate;        
    }
}

module.exports = Bot
