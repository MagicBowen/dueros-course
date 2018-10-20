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
            if (request.getQuery().indexOf('测试列表') != -1) {
                const list = [
                    {
                        name : '数学',
                        preiod : "上午",
                        weekday: "星期二",
                        startTime   : '9:00',
                        endTime  : '10:00',
                        location: '学二楼3楼304',
                        week: 'both',
                        teacher: '杨老师'
                    },
                    {
                        name : '语文',
                        preiod : "上午",
                        weekday: "星期二",
                        startTime   : '11:00',
                        endTime  : '12:00',
                        location: '学二楼3楼304',
                        week: 'both',
                        teacher: '杨老师'
                    }
                ]
                return {
                    directives: [that.getListTemplate(list)],
                    outputSpeech: '列表显示如上，您满意了吗？'
                }
            }            
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

        if (this.shouldDisplayQrcode(result)) {
            let reply = '请使用微信扫描二维码，打开小程序进行课程的录制和修改。'
            return {
                directives: [this.getTextTemplateWithImage(reply, result.image)],
                outputSpeech: reply
            }
        }

        return {
            directives: [this.getTextTemplate(result.reply)],
            outputSpeech: result.reply
        }
    }

    shouldDisplayQrcode(result) {
        if (!this.isSupportDisplay()) return false
        return ((result.intent.indexOf('how-to-record') != -1)||(result.reply.indexOf('哒尔文') != -1))
    }

    getTextTemplate(text) {
        let bodyTemplate = new BaseBot.Directive.Display.Template.BodyTemplate1();
        bodyTemplate.setTitle('课程表');
        bodyTemplate.setPlainTextContent(text);
        bodyTemplate.setBackGroundImage(config.background);
        let renderTemplate = new BaseBot.Directive.Display.RenderTemplate(bodyTemplate);
        return renderTemplate;
    }

    getTextTemplateWithImage(text, image) {
        let bodyTemplate = new BaseBot.Directive.Display.Template.BodyTemplate2();
        bodyTemplate.setTitle('课程表');
        bodyTemplate.setPlainContent(text);
        bodyTemplate.setImage(image, 100, 100);
        bodyTemplate.setBackGroundImage(config.background);
        let renderTemplate = new BaseBot.Directive.Display.RenderTemplate(bodyTemplate);
        return renderTemplate;
    }

    getSecondaryTitle(item){
        if(item.startTime != "" || item.endTime != ""){
            var startTime = (item.startTime == "") ? "?" : item.startTime
            var endTime = (item.startTime == "") ? "?" : item.endTime
            return startTime + "~" + endTime
        }
        return item.preiod
    }

    getThirdTitle(item){
        let info = ''
        if (item.teacher) {
            info += ('任课老师：' + item.teacher)
            if (item.location) info += ('，上课地点：' + item.location)
        }
        else {
            if (item.location) info += ('上课地点：' + item.location)
        }
        return info
    }

    getListTemplate(list) {
        let listTemplate = new BaseBot.Directive.Display.Template.ListTemplate2();
        listTemplate.setTitle('课程表');
        listTemplate.setBackGroundImage(config.background);
        for (let item of list) {
            let listItem = new BaseBot.Directive.Display.Template.ListTemplateItem();
            listItem.setToken('token');
            listItem.setImage('https://skillstore.cdn.bcebos.com/icon/100/c709eed1-c07a-be4a-b242-0b0d8b777041.jpg');
            listItem.setPlainPrimaryText('一级标题');  
            listItem.setPlainSecondaryText('二级标题'); 
            listItem.setPlainTertiaryText('三级标题');
            
            // listItem.setPlainPrimaryText(item.name); 
            // var secondTitle = this.getSecondaryTitle(item)
            // var thridTitle = this.getThirdTitle(item)
            // console.log('secodTitle', secondTitle, 'thridTitle', thridTitle)
            // if (secondTitle !== "") {
            //     console.log('格式不对.......')
            //     listItem.setPlainSecondaryText("时间格式不对");
            // }
            // if (thridTitle !== '') {
            //     listItem.setPlainTertiaryText(thridTitle);
            // }
            listTemplate.addItem(listItem);
        }
        let renderTemplate = new BaseBot.Directive.Display.RenderTemplate(listTemplate);
        return renderTemplate;
    }
}

module.exports = Bot
