var irc = require("irc");
var colors = require('irc-colors');
var mysql = require("mysql");
var fs = require("fs");
var Socket = require('net').Socket;

//Load Configs
var config = JSON.parse(fs.readFileSync("config.json", {
    encoding: "utf8"
}));
//IRC Config
var channels = config.bot.channels;
var bot = new irc.Client('irc.quakenet.org', 'gatherBot', config.bot);
var botAccount = config.bot.authname;
var botPassword = config.bot.password;
var logIn = (botAccount && botPassword);
//MySQL Config
var pool = mysql.createPool({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database
});

//Other
var version = "KAG Gather Bot v1.1.0";
var saveLogs = config.options.saveLogs;
var saveErrorLogs = config.options.saveErrorLogs;
var checkFrequency = config.options.checkFrequency;
var guideLink = config.options.guideURL ? " To know how to do that and learn the commands, read the guide at " + config.options.guideURL + " ." : "";

if (saveErrorLogs) {
    var errorLogStream = fs.createWriteStream("ERROR-LOG.txt", {
        flag: "a"
    });
}
//Match config
var links = require("./lib/links.js")({
    pool: pool,
    usersTable: config.mysql.usersTable
});
var db = require("./lib/db.js")({
    pool: pool,
    usersTable: config.mysql.usersTable,
    matchTable: config.mysql.matchTable
});
var botControl = require('./lib/bot.js')(db, bot, config);
console.log(config);
var parseMessage = botControl.parseMessage;
//Error handling - logs/saves and exit process(1)
bot.addListener("error", function(err) {
    if (saveErrorLogs) {
        errorLogStream.write("[IRC-ERROR]\n" + JSON.stringify(err) + "\n============= END IRC ERROR =============\n");
    } else {
        console.log(err.stack);
    }
});

process.on("uncaughtException", function(err) {
    if (saveErrorLogs) {
        errorLogStream.write("[PROCESS-ERROR]\n" + JSON.stringify(err) + "\n=========== END PROCESS ERROR ===========\n");
    } else {
        console.log(err.stack);
    }
    process.exit(1);
});
// IRC Parsing;
function isAdmin(account) {
    for (var i = 0; i < adminList.length; i++) {
        if (adminList[i] === account) {
            return true;
        }
    };
    return false;
}
//IRC Handling
bot.addListener("message#", parseMessage);
bot.addListener("registered", function() {
    if (logIn) {
        bot.send("AUTH", botAccount, botPassword);
    }
});
bot.addListener("part", function(a, b, c, raw) {
    for (var i = 0; i < playersArray.length; i++) {
        if (playersArray[i].host === raw.host) {
            playersArray.splice(i, 1);
            bot.say(channels, raw.nick + " was removed from the queue(left IRC).");
        }
    };
    for (var i = 0; i < subsArray.length; i++) {
        if (subsArray[i].host === raw.host) {
            subsArray.splice(i, 1);
            bot.say(channels, raw.nick + " was removed from the queue(left IRC).");
        }
    };
});
//Server Functions
var socketArray = [];
var serversArray = config.serverList;
var socketRcon = [];
var serverCommands = [{
    command: "RESTARTMAP",
    fn: restartMap
}, {
    command: "NEXTMAP",
    fn: nextMap
}, {
    command: "Blue won",
    fn: matchEnded
}, {
    command: "Red won",
    fn: matchEnded
}, {
    command: "TEAMS",
    fn: sendTeams
}, {
    command: "SAY",
    fn: sayToChannel
}, {
    command: "RSUB",
    fn: requestSub
}, {
    command: "LINK",
    fn: requestKAGLink
}, {
    command: "round drawn",
    fn: roundDrawn
}, {
    command: "Blue round won",
    fn: roundBlue
}, {
    command: "Red round won",
    fn: roundRed
}];
serversArray.forEach(function(srvconfig, i) {
    var sock = new Socket();
    sock.setEncoding("utf8");
    sock.setNoDelay();
    sock.setTimeout(1000);

    socketArray.push(sock);
    socketRcon.push(srvconfig.rcon);

    sock.on("connect", function() {
        this.write(srvconfig.rcon + "\n", "utf8");
        console.log("Connected to the KAG Server...");
    });
    sock.on("data", function(data) {
        //console.log(data);
        parseData(data, i);
    });
    sock.on("error", function(err) {
        console.log("Socket Error:" + err);
    });
    sock.on("close", function(err) {
        console.log("Socket is now closed:" + err);
    });
    sock.connect(srvconfig.port, srvconfig.ip);
});

function parseData(data, serverI) {
    data = data.split("\n");
    for (var j = 0; j < data.length; j++) {
        data[j] = data[j].substring(11, data[j].length);
        console.log(data[j]);

        if (data[j].indexOf("[Gather] ") === 0) {
            data[j] = data[j].substring(9, data[j].length);

            for (var i = 0; i < serverCommands.length; i++) {
                if (data[j].indexOf(serverCommands[i].command) === 0) {
                    data[j] = data[j].split(" ");

                    var last = data[j].length - 1;
                    data[j][last] = data[j][last].substr(0, data[j][last].length);

                    serverCommands[i].fn(data[j], serverI);
                }
            };
        }
    }
}

function restartMap(data, serverI) {
    send(serverI, "/restartmap");
}

function nextMap(data, serverI) {
    send(serverI, "/nextmap");
}

function matchEnded(data, serverI, to) {
    var whoWon;
    if (data[0] === "Blue") {
        bot.say(channels, "Match ended on server " + serverI + ". The blue team has won.");
        for (var i = 0; i < playingArray.blueTeam.length; i++) {
            db.getPlayerByAuth(playingArray.blueTeam[i], function(result) {
                send(serverI, "/kick " + result.name);
            });
            db.addVictoryTo(playingArray.blueTeam[i]);
        };
        for (var i = 0; i < playingArray.redTeam.length; i++) {
            db.getPlayerByAuth(playingArray.redTeam[i], function(result) {
                send(serverI, "/kick " + result.name);
            });
            db.addLoseTo(playingArray.redTeam[i]);
        };
        whoWon = 0;
    } else {
        bot.say(to, "Match ended on server " + serverI + ". The red team has won. You can now add to the list.");
        for (var i = 0; i < playingArray.blueTeam.length; i++) {
            db.getPlayerByAuth(playingArray.blueTeam[i], function(result) {
                send(serverI, "/kick " + result.name);
            });
            db.addLoseTo(playingArray.blueTeam[i]);
        };
        for (var i = 0; i < playingArray.redTeam.length; i++) {
            db.getPlayerByAuth(playingArray.redTeam[i], function(result) {
                send(serverI, "/kick " + result.name);
            });
            db.addVictoryTo(playingArray.redTeam[i]);
        };
        whoWon = 1;
    }
    db.addMatchToDB(playersArray.blueTeam, playersArray.redTeam, whoWon);
    subsArray = [];
    playingArray = {};
}

function sendTeams(data, serverI) {
    db.getPlayerListByAuth(playingArray.blueTeam, function(result) {
        var list = [];
        for (var i = 0; i < result.length; i++) {
            list.push(result[i].name);
        };
        send(serverI, "/msg Blue team: " + list);
    });
    db.getPlayerListByAuth(playingArray.redTeam, function(result) {
        var list = [];
        for (var i = 0; i < result.length; i++) {
            list.push(result[i].name);
        };
        send(serverI, "/msg Red team: " + list);
    });
}

function sayToChannel(data) {
    data.shift();
    var name = data[0];
    data.shift();
    var message = data.join(" ");
    bot.say(channels, "<" + name + ">" + message);
}

function requestSub(data, serverI) {
    var subbed = data[1];
    send(serverI, "/kick " + subbed);
    if (subsArray[0]) {
        db.getPlayerByAuth(subsArray[0].account, function(result) {
            send(serverI, "/assignseclev " + result.name + " " + seclevID);
        });
        bot.say(subsArray[0].nick, "You are now playing for gather in place of " + subbed + ". The server's IP:Port : " + serversArray[serverI].publicIp + ":" + serversArray[serverI].port);

        db.getPlayerByAccount(subbed, function(result) {
            var team = "";
            for (var i = 0; i < playersArray.blueTeam.length; i++) {
                if (playersArray.blueTeam[i].account === result.authname) {
                    playingArray.blueTeam.splice(i, 1);
                    team = "blue";
                }
            };
            for (var i = 0; i < playersArray.redTeam.length; i++) {
                if (playersArray.redTeam[i].account === result.authname) {
                    playingArray.redTeam.splice(i, 1);
                    team = "red";
                }
            };
            if (team === "blue") {
                playingArray.blueTeam.push(subsArray[0]);
            } else {
                playingArray.redTeam.push(subsArray[0]);
            }
            subsArray.splice(0, 1);
        });
    }
}

function send(serverID, text) {
    if (socketArray[serverID]) {
        socketArray[serverID].write(text + "\n");
        return true;
    }
    return false;
}

function getMostVotedServer() {
    var votes = {};
    for (var i = 0; i < playersArray.length; i++) {
        if (playersArray[i].vote) {
            if (votes[playersArray[i].vote]) {
                votes[playersArray[i].vote] += 1;
            } else {
                votes[playersArray[i].vote] = 1;
            }
        }
    };
    var mostVoted = [serversArray[0].name, 0];
    for (name in votes) {
        if (votes[name] > mostVoted[1]) {
            mostVoted[1] = votes[name];
            mostVoted[0] = name;
        }
    }
    for (var i = 0; i < serversArray.length; i++) {
        if (serversArray[i].name === mostVoted[0]) {
            return i;
        }
    };
}

function requestKAGLink(data, serverI) {
    var authname = data[1];
    var username = data[2];
    links.requestLink(authname, username, function(result) {
        send(serverI, username + ": " + result.message);
    })
}

function roundDrawn(data, serverI) {
    bot.say(channels, "Round finished on server " + serverI + ": it's a draw.");
}

function roundBlue(data, serverI) {
    bot.say(channels, "Round finished on server " + serverI + ": the blue team has won.");
}

function roundRed(data, serverI) {
    bot.say(channels, "Round finished on server " + serverI + ": the red team has won.");
}