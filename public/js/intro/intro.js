let tracking = false;
let lastQuestion = "";

//去掉所有的html标记
function delHtmlTag(str) {
    return str.replace(/<(?:.|\s)*?>/g, "").replace(/[\r\n ]/g, "");
}

function getQuestion() {
    return $(".textStem__1F3Jh")[0].innerHTML;
}

function getIsAnswering() {
    return $('.textChoiceButton__138gl').length > 0
}

function checkNeedGetAnswer() {
    if (!getIsAnswering()) return false;

    if (lastQuestion == getQuestion()) return false;

    return !tracking;
}

function supportPage() {
    return getTitle().split("/").length === 1;
}

function getTitle() {
    let str = window.location.href.replace("https://app.pluralsight.com/score/skill-assessment/", "");

    str = str.split("?")[0];

    return str;
}

async function getAnswer() {
    tracking = true;

    const question = getQuestion();

    console.log(question);

    let {possibleIndex, answer} = await request(getTitle(), question);

    console.log(possibleIndex, answer);

    tracking = false;

    lastQuestion = question;

    // 找到后向对应标签中添加展示符
    markToData(answer, possibleIndex);
}

function request(type, question) {
    return new Promise((resolve, reject) => {
        chrome.extension.sendRequest({key: "onIntroDataNeedRequest", type, question}, (response) => {
            resolve(response)
        });
    });
}

function markToData(answer, possibleIndex) {
    if (possibleIndex === -1) {
        $(".stemTextWrapper__1rvD9").append("<p>未找到答案</p>");
        return;
    }

    const answerHtml = delHtmlTag(answer);

    let choices = $('.unansweredChoices__3vK1x > li > div');

    let finalIndex = -1;

    for (let i = 0; i < choices.length; i++) {
        if (answerHtml == delHtmlTag(choices[i].innerHTML)) {
            finalIndex = i;
        }
    }

    if (finalIndex === -1 && possibleIndex === -1) {
        $(".stemTextWrapper__1rvD9").prepend("<p>No Match</p>")
    } else if (finalIndex !== -1) {
        $('.unansweredChoices__3vK1x > li')[finalIndex].append("Right Answer")
    } else if (possibleIndex !== -1) {
        $('.unansweredChoices__3vK1x > li')[possibleIndex].append("Possible Answer")
    }
}

if (supportPage()) {
    setInterval(() => {
        if (checkNeedGetAnswer()) {
            getAnswer().then();
        } else {
            console.log("不需要获取数据");
        }
    }, 3000);
}
