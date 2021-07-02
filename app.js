require('dotenv').config();
const sql = require('mssql');
var dhive = require("@hiveio/dhive");

const utils = require('./utils')

const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const interval = 380; // in minutes

const blacklist = ["adm", "qurator", "steemed-proxy", "sweetsssj", "alpha", "adm", "canadian-coconut", "threespeak", "leo.voter", "blocktrades", "pfunk", "mmmmkkkk311", "hive.curation", "appreciator", "theycallmedan", "coinomite", "acidyo", "bdvoter", "xeldal", "enki", "ocdb", "ranchorelaxo", "trafalgar", "haejin", "vcelier", "edicted", "curangel", "tribesteemup"];

const hftime = new Date('2021-06-30 14:00:00Z');

const sqlConfig = {
    user: process.env.DBUSER,
    password: process.env.DBPWD,
    database: process.env.DBNAME,
    server: process.env.DBURL,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: false, // for azure
        trustServerCertificate: false // change to true for local dev / self-signed certs
    }
};

let i = 5;

(async () => {
    try {
        // make sure that any items are correctly URL encoded in the connection string
        await sql.connect(sqlConfig)
        console.log('Connection to sql database stablished!')
        start(i)
    } catch (err) {
        return console.log(err)
        // await utils.wait(1000);
        // start()
    }
})();

async function loop(posts) {
    let j = 0;
    for (let i = 0; i < posts.length; i++) {
        if (j > 4) return
        let post = posts[i]
        const {
            permlink,
            author,
            active_votes,
            net_rshares,
            depth,
            allow_curation_rewards,
            reward_weight
        } = post;
        let perc = 7 // net_rshares > '43780543342116' ? 40 : 20;

        console.log(`https://hiveblockexplorer.com/@${post.author}/${post.permlink}`)
        let voters = JSON.parse(active_votes).map(el => el.voter);

        if (parseFloat(reward_weight) < 10000 || allow_curation_rewards == 'false') {
            console.log('No curation reward of below 100%, skipping..');
            continue;
        }
        if (parseFloat(depth) !== 0) {
            console.log('This is a comment, skipping..');
            continue;
        }
        if (voters.indexOf(process.env.ACCOUNT1) > -1) {
            console.log(`${process.env.ACCOUNT1} Already voted, skipping..`)
            continue
        }
        try {
            blacklist.forEach(account => {
                let index = voters.indexOf(account);
                if (index > -1) {
                    let vote = JSON.parse(active_votes)[index];
                    let time = new Date(vote.time + "Z");
                    if ((vote.voter == "ocdb" || vote.voter == "blocktrades" || vote.voter == "theycallmedan") && time > hftime) throw new Error("alreaedy voted by OCDB/blocktrades")
                    if (vote.percent > 1999 && time > hftime) {
                        throw new Error(`Blacklisted acc ${account} detected voted with percent > ${vote.percent} at ${time}`);
                    }
                    let timediff = new Date().getTime() - time
                    if (time > hftime && timediff > 10 * HOUR) {
                        throw new Error(`Time difffrom voter ${vote.voter} too big ${parseFloat(timediff/HOUR).toFixed(1)}, skipping`)
                    }
                }

            })
        } catch (e) {
            console.log(e);
            // return console.log(JSON.parse(active_votes))
            continue;
        }

        try {
            let vote = await utils.vote(author, permlink, perc);
            console.log(vote)
            j++
        } catch (e) {
            if (e.jse_info && e.jse_info.code == '10') {
                console.log(`${process.env.ACCOUNT1} Already voted, skipping..`)
                continue
            }
            console.log(e)
        }
        await utils.wait(500)
    }
    return
}


async function start(i = 0) {
    console.log('starting..' + i)
    let {
        d1,
        d2
    } = utils.getTimeIntervals(interval, i)
    let query = `select * FROM dbo.Comments where created between '${d1}' and '${d2}' and net_rshares > 1000000 ORDER BY net_rshares DESC;`
    console.log(query)
    const result = await sql.query(query)
    console.log(result.recordset.length)
    try {
        await loop(result.recordset)
    } catch (e) {
        console.log(e)
    }
    console.log('Ending round **')
    // await utils.wait(interval * MIN);
    i++
    if (i > 14) return
    return await start(i)
}