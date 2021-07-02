require('dotenv').config();
var dhive = require("@hiveio/dhive");

var client = new dhive.Client(["https://api.hive.blog", "https://api.hivekings.com", "https://anyx.io", "https://api.openhive.network"]);

var key1 = dhive.PrivateKey.fromString(process.env.POSTING1);
var key2 = dhive.PrivateKey.fromString(process.env.POSTING2);

const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

async function vote(author, permlink, perc) {
    await client.broadcast
        .vote({
                voter: process.env.ACCOUNT1,
                author: author,
                permlink: permlink,
                weight: perc * 100
            },
            key1
        )
    return await client.broadcast
        .vote({
                voter: process.env.ACCOUNT2,
                author: author,
                permlink: permlink,
                weight: perc * 100
            },
            key2
        )
}

function getTimeIntervals(interval = 30, multiplier) {
    Number.prototype.padLeft = function(base, chr) {
        var len = (String(base || 10).length - String(this).length) + 1;
        return len > 0 ? new Array(len).join(chr || '0') + this : this;
    }
    const hftime = new Date('2021-06-30 14:00:00Z');
    const diff = new Date().getTime() - hftime.getTime();

    var t1 = new Date(hftime.getTime() - (multiplier * interval * MIN));
    let t2 = new Date(hftime.getTime() - ((multiplier + 1) * interval * MIN));

    let d1 = [
        t1.getFullYear(),
        (t1.getMonth() + 1).padLeft(),
        t1.getUTCDate().padLeft(),

    ].join('-') + ' ' + [
        t1.getUTCHours().padLeft(),
        t1.getMinutes().padLeft(),
        t1.getSeconds().padLeft()
    ].join(':') + '.00';

    let d2 = [
        t2.getFullYear(),
        (t2.getMonth() + 1).padLeft(),
        t2.getUTCDate().padLeft(),
    ].join('-') + ' ' + [t2.getUTCHours().padLeft(),
        t2.getMinutes().padLeft(),
        t2.getSeconds().padLeft()
    ].join(':') + '.00';
    return {
        d1: d2,
        d2: d1
    }
}
// console.log(getTimeIntervals())

function wait(ms) {
    console.log(`Waiting ${ms} ms..`)
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, ms)
    })
}
module.exports = {
    vote: vote,
    getTimeIntervals: getTimeIntervals,
    wait: wait
}