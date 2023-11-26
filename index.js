let appKey = 'f7b2914081174a55bf563056fb25d3ae'

function sign() {
    // 20231126133740
    let timestamp = dateFormat('yyyyMMddhhmmss', new Date())
    let random = parseInt(100 + Math.random() * 900)
    let signKey = busSign(appKey, timestamp + random)
    return {
        timestamp: timestamp,
        random: random,
        signKey: signKey
    }
}

function param() {
    return paramMap[radio]
}

let stationUrl = 'http://223.111.7.137:2001/BusService/Query_RouteStatData/?RouteID=${RouteID}&timeStamp=${timestamp}&Random=${random}&SignKey=${signKey}'
let carUrl = 'http://223.111.7.137:2001/BusService/Query_ByStationIDReturnAll/?RouteID=${RouteID}&IsmainsubCombine=1&StationID=${StationID}&timeStamp=${timestamp}&Random=${random}&SignKey=${signKey}'

let radio = 'radio225'

let stationIdNameMap = {}

let importantStationList = ['农科站', '康居路', '市民之家']

let paramMap = {
    'radio225': {
        'RouteID': 'LJLOJK',
        'StationID1': 'LJKP',
        'StationID2': 'KPP'
    },
    'radio230': {
        'RouteID': 'LJMJJK',
        'StationID1': 'LJKP',
        'StationID2': 'KPP'
    },
}

$("#route :radio").on("click", function () {
    radio = $(this)[0].id
    init()
})

init()

setInterval(() => {
    refresh()
}, 5000)

function init() {
    // station
    let signData = sign()
    let paramData = param()
    let url = stationUrl.replace('${timestamp}', signData.timestamp)
        .replace('${random}', signData.random)
        .replace('${signKey}', signData.signKey)
        .replace('${RouteID}', paramData.RouteID)
    post(url, (res) => {
        let route = res.result[0]
        /*route.RouteName
        route.TimeStamp*/
        let segment1 = route.SegmentList[0]
        for (let i = 0; i < segment1.StationList.length; i++) {
            let station = segment1.StationList[i]
            stationIdNameMap[station.StationID] = station.StationName
        }
        let segment2 = route.SegmentList[1]
        for (let i = 0; i < segment2.StationList.length; i++) {
            let station = segment2.StationList[i]
            stationIdNameMap[station.StationID] = station.StationName
        }
        let stationList = segment1.SegmentName === '汽车客运站' ? segment1.StationList : segment2.StationList
        let tbody = $('#tbody')
        tbody.empty()
        for (let i = 0; i < stationList.length; i++) {
            let station = stationList[i]
            let tr = $('<tr></tr>')
            let id = station.StationName
            if (importantStationList.indexOf(id) > -1) {
                tr.append('<td id="name_' + id + '" style="color: red;">' + station.StationName + '</td>')
            } else {
                tr.append('<td id="name_' + id + '">' + station.StationName + '</td>')
            }
            tr.append('<td id="car1_' + id + '"></td>')
            tr.append('<td id="car2_' + id + '"></td>')
            tbody.append(tr)
        }
        // car
        refresh()
    })
}

function refresh() {
    // empty
    $('div.realtime').remove()
    // car
    let signData = sign()
    let paramData = param()
    let car1Url = carUrl.replace('${timestamp}', signData.timestamp)
        .replace('${random}', signData.random)
        .replace('${signKey}', signData.signKey)
        .replace('${RouteID}', paramData.RouteID)
        .replace('${StationID}', paramData.StationID1)
    post(car1Url, (res) => {
        let realtime = res.result[0]
        showCar(1, realtime)
    })
    let car2Url = carUrl.replace('${timestamp}', signData.timestamp)
        .replace('${random}', signData.random)
        .replace('${signKey}', signData.signKey)
        .replace('${RouteID}', paramData.RouteID)
        .replace('${StationID}', paramData.StationID2)
    post(car2Url, (res) => {
        let realtime = res.result[0]
        showCar(2, realtime)
    })
    // time
    $('#updateTime').text(new Date())
}

function showCar(num, realtime) {
    $('#car' + num + '_head').html('<div>' + realtime.EndStaInfo + '</div><div><span class="tip">' + realtime.FirtLastShiftInfo + '</span></div>')
    let carList = realtime.RealtimeInfoList
    for (let i = 0; i < carList.length; i++) {
        let car = carList[i]
        let time = car.ArriveTime.substring(11)
        $('#car' + num + '_' + stationIdNameMap[car.StationID]).html('<div class="realtime">' + car.BusName + '</div><div class="realtime"><span class="tip">' + time + '</span></div>')
    }
}

function post(serviceUrl, callback) {
    let token = dateFormat('yyyyMMddhhmmss', new Date()) + '999999'
    let random = Math.random()
    let is_app_login = 0
    let url = 'https://www.njlsgj.com/mobile/service/httpget?token=' + token + '&_random=' + random + '&is_app_login=' + is_app_login
    $.post(url, 'url=' + encodeURIComponent(serviceUrl), (res) => {
        callback(res)
    })
}

function dateFormat(fmt, date) {
    var o = {
        "M+": date.getMonth() + 1,                 //月份
        "d+": date.getDate(),                    //日
        "h+": date.getHours(),                   //小时
        "m+": date.getMinutes(),                 //分
        "s+": date.getSeconds(),                 //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        "S": date.getMilliseconds()             //毫秒
    }
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length))
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)))
    return fmt
}

function busSign(secret_key, str) {
    return sha256.hmac(secret_key, str)
}
