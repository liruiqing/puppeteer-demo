/**
 * Created by yuan on 2018/9/12.
 */
const puppeteer = require('puppeteer');
var conf = require('./config/config');
var pool = conf.pool;
var save = require('./save')


const crawler = async() => {
    const pathToExtension = require('path').join(__dirname, 'chrome-mac/Chromium.app/Contents/MacOS/Chromium');
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: pathToExtension
    });
    const page = await browser.newPage();

    await page.setViewport({width: 1280, height: 800});
    await page.goto('https://weibo.com/rmrb');
    await page.waitForNavigation();

    await page.addScriptTag({url: 'https://code.jquery.com/jquery-3.2.1.min.js'})

    const LIST_SELECTOR = 'div[action-type=feed_list_item]'

    const user = await page.evaluate((infoDiv)=> {
        return Array.prototype.slice.apply(document.querySelectorAll(infoDiv))
            .map($userListItem => {
                var weiboDiv = $($userListItem)
                var webUrl = 'http://weibo.com'

                var weiboInfo = {
                    "tbinfo":  weiboDiv.attr("tbinfo"),
                    "mid": weiboDiv.attr("mid"),
                    "isforward":weiboDiv.attr("isforward"),
                    "minfo":weiboDiv.attr("minfo"),
                    "omid":weiboDiv.attr("omid"),
                    "text":weiboDiv.find(".WB_detail>.WB_text").text().trim(),
                    'link':webUrl.concat(weiboDiv.find(".WB_detail>.WB_from a").eq(0).attr("href")) ,
                    "sendAt":new Date(parseInt(weiboDiv.find(".WB_detail>.WB_from a").eq(0).attr("date")))
                };

                if(weiboInfo.isforward){
                    var forward = weiboDiv.find("div[node-type=feed_list_forwardContent]");

                    if(forward.length > 0){
                        var forwardUser = forward.find("a[node-type=feed_list_originNick]");

                        var userCard = forwardUser.attr("usercard");

                        weiboInfo.forward = {
                            name:forwardUser.attr("nick-name"),
                            id:userCard ? userCard.split("=")[1] : "error",
                            text:forward.find(".WB_text").text().trim(),
                            "sendAt":new Date(parseInt(forward.find(".WB_from a").eq(0).attr("date")))
                        };
                    }
                }
                return weiboInfo
            })
    }, LIST_SELECTOR)

    pool.getConnection(function(err, connection) {
        save.kNewscom({"connection":connection,"res":user},function () {
            console.log('insert success')
        })
    })

    console.log('useruser',user)

}


const getWeibo = async(feedSelector)=>{
    var weiboDiv = $(feedSelector);
    var webUrl = 'http://weibo.com'

    return {}

    var weiboInfo = {
        "tbinfo":  weiboDiv.attr("tbinfo"),
        "mid": weiboDiv.attr("mid"),
        "isforward":weiboDiv.attr("isforward"),
        "minfo":weiboDiv.attr("minfo"),
        "omid":weiboDiv.attr("omid"),
        "text":weiboDiv.find(".WB_detail>.WB_text").text().trim(),
        'link':webUrl.concat(weiboDiv.find(".WB_detail>.WB_from a").eq(0).attr("href")) ,
        "sendAt":new Date(parseInt(weiboDiv.find(".WB_detail>.WB_from a").eq(0).attr("date")))
    };

    if(weiboInfo.isforward){
        var forward = weiboDiv.find("div[node-type=feed_list_forwardContent]");

        if(forward.length > 0){
            var forwardUser = forward.find("a[node-type=feed_list_originNick]");

            var userCard = forwardUser.attr("usercard");

            weiboInfo.forward = {
                name:forwardUser.attr("nick-name"),
                id:userCard ? userCard.split("=")[1] : "error",
                text:forward.find(".WB_text").text().trim(),
                "sendAt":new Date(parseInt(forward.find(".WB_from a").eq(0).attr("date")))
            };
        }
    }
    return weiboInfo;
}

crawler()