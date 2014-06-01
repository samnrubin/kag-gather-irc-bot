var irc = require("irc");
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
var mysql = require('mysql');
var pool = mysql.createPool({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database
});

//Other
var version = config.bot.version;
var saveLogs = config.options.saveLogs;
var saveErrorLogs = config.options.saveErrorLogs;
var checkFrequency = config.options.checkFrequency;
var guideLink = config.options.guideURL ? " To know how to do that and learn the commands, read the guide at " + config.options.guideURL + " ." : "";
if (saveLogs) {
    var date = new Date();
    var dia = date.getDate();
    var mes = date.getMonth() + 1;
    var ano = date.getFullYear();
    date = dia + "-" + mes + "-" + ano;
    var logStream = fs.createWriteStream("IRC-Log[" + date + "].txt", {
        flag: "a"
    });
    setInterval(function() {
        var dataAtual = new Date();
        var diaAtual = dataAtual.getDate();
        if (diaAtual !== dia) {
            var mesAtual = dataAtual.getMonth() + 1;
            var anoAtual = dataAtual.getFullYear();
            dataAtual = diaAtual + "-" + mesAtual + "-" + anoAtual;
            logStream = fs.createWriteStream("IRC-Log[" + dataAtual + "].txt", {
                flag: "a"
            });
        }
    }, checkFrequency * 1000);
}
if (saveErrorLogs) {
    var errorLogStream = fs.createWriteStream("ERROR-LOG.txt", {
        flag: "a"
    });
}
//Match config
var playersNeeded = config.options.playersNeeded;
var teamSize = playersNeeded / 2;
var adminList = config.options.adminList;
var isPlaying = false;
var isBotOn = true;
var seclevID = config.options.playerSeclev;
//Objects
var serversConfig = {
    serversArray: config.serverList,
    votesArray: [{
        account: "LickTT",
        vote: "USA"
    }],
    addVoteTo: function(name) {
        for (var i = 0; i < this.serversArray.length; i++) {
            if (this.serversArray[i].name === name) {
                this.serversArray[i].votes += 1;
            }
        };
    },
    getMostVotedServer: function() {
        var mostVoted = [0, ""];
        for (var i = 0; i < this.serversArray.length; i++) {
            if (this.serversArray[i].votes > mostVoted[0]) {
                mostVoted = [this.serversArray[i].votes, this.serversArray[i].name];
            }
        };
        return mostVoted;
    },
    playerAlreadyVoted: function(account) {
        var voted = false;
        for (var i = 0; i < this.votesArray.length; i++) {
            if (this.votesArray[i].account == account) {
                voted = true;
            }
        };
        return voted;
    },
    resetVoting: function() {
        for (var i = 0; i < this.serversArray.length; i++) {
            this.serversArray.votes = 0;
        };
        votesArray = [];
    }
}
var playersArray = [
    /*{
    account: "LickTT",
    nick: "LucasTT",
    host: "127.0.0.1",
    vote: null
}*/
];

var links = require("../lib/links.js")({
    pool: pool,
    usersTable: config.mysql.usersTable
});
var subsArray = [];
var playingArray = [];
var playingServer = null;
var db = require("../lib/db.js")({
    pool: pool,
    usersTable: config.mysql.usersTable,
    matchTable: config.mysql.matchTable
});
//Error handling
// exite process todo
// 
bot.addListener("error", function(err) {
    if (saveErrorLogs) {
        errorLogStream.write("[IRC-ERROR]\n" + err.stack + "\n============= END IRC ERROR =============\n");
    } else {
        console.log(err.stack);
    }
});

process.on("uncaughtException", function(err) {
    if (saveErrorLogs) {
        errorLogStream.write("[PROCESS-ERROR]\n" + err.stack + "\n=========== END PROCESS ERROR ===========\n");
    } else {
        console.log(err.stack);
    }
});
// IRC Parsing;
var match = function(message, cmd) {
    return (message.indexOf(cmd) === 0);
}
var commands = [{
    command: "!add",
    fn: add,
    adminOnly: false
}, {
    command: "!rem",
    fn: removePlayerFromQueue,
    adminOnly: false
}, {
    command: "!list",
    fn: showList,
    adminOnly: false
}, {
    command: "!status",
    fn: status,
    adminOnly: false
}, {
    command: "!isbanned",
    fn: isBanned,
    adminOnly: false
}, {
    command: "!help",
    fn: showHelp,
    adminOnly: false
}, {
    command: "!stats",
    fn: showPlayerStats,
    adminOnly: false
}, {
    command: "!say",
    fn: sendMessageToServer,
    adminOnly: false
}, {
    command: "!link",
    fn: requestIRCLink,
    adminOnly: false
}, {
    command: "!frem",
    fn: forceRemove,
    adminOnly: true
}, {
    command: "!stop",
    fn: stopBot,
    adminOnly: true
}, {
    command: "!pause",
    fn: pauseBot,
    adminOnly: true
}, {
    command: "!resume",
    fn: resumeBot,
    adminOnly: true
}, {
    command: "!ban",
    fn: banPlayerByAccount,
    adminOnly: true
}, {
    command: "!unban",
    fn: unbanPlayerByAccount,
    adminOnly: true
}, {
    command: "!execute",
    fn: executeCommand,
    adminOnly: true
}, {
    command: "!clear",
    fn: clearQueues,
    adminOnly: true
}, {
    command: "!banlist",
    fn: showBanList,
    adminOnly: true
}, {
    command: "!force_match_end",
    fn: forceMatchEnd,
    adminOnly: true
}, {
    command: "!username",
    fn: getUserUsername,
    adminOnly: true
}, {
    command: "!authname",
    fn: getUserAuthname,
    adminOnly: true
}, {
    command: "!version",
    fn: showVersion,
    adminOnly: true
}, {
    command: "!givewin",
    fn: giveWin,
    adminOnly: true
}, {
    command: "!server",
    fn: showServerList,
    adminOnly: false
}];

//IRC Handling
bot.addListener("message#", function(from, to, message) {
    if (saveLogs) {
        logStream.write("[" + (new Date().toJSON()) + "][" + to + "]<" + from + ">" + message + "\n");
    }
    if (isBotOn) {
        for (var i = 0; i < commands.length; i++) {
            if (match(message, commands[i].command)) {
                if (isBotOn) {
                    commands[i].fn(from, to, message);
                } else {
                    if (commands[i].adminOnly) {
                        commands[i].fn(from, to, message);
                    }
                }
            }
        };
    }
});
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
//IRC Functions
function shufflePlayers(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function add(from, to, message) {
    bot.whois(from, function(WHOIS) {
        db.isPlayerBanned(WHOIS.account, function(isBanned) {
            if (WHOIS.account) {
                if (isBanned === "player-no-exists") {
                    bot.say(to, from + ": you must link to play.");
                    return;
                }
                if (!isBanned) {
                    if (playerIsInQueue(WHOIS.account)) {
                        bot.say(to, from + ": you're already in the queue.");
                    } else {
                        //adds the player to the list
                        var msg = message.split(" ");
                        var vote = msg[1];
                        //adds to the sublist if already playing
                        if (isPlaying) {
                            if (playerIsPlaying(WHOIS.account)) {
                                bot.say(to, from + ": you're already playing.");
                            } else {
                                subsArray.push({
                                    account: WHOIS.account,
                                    nick: WHOIS.nick,
                                    host: WHOIS.host,
                                });
                                bot.say(to, from + " has  added to the sub-list");
                            }
                        } else {
                            // adds to the playerlist
                            if (vote) {
                                if (isValidVote(vote)) {
                                    playersArray.push({
                                        account: WHOIS.account,
                                        nick: WHOIS.nick,
                                        host: WHOIS.host,
                                        vote: vote
                                    });
                                    bot.say(to, from + " added to the list [" + playersArray.length + "/" + playersNeeded + "] with vote " + vote);
                                } else {
                                    bot.say(to, from + ": '" + vote + "' is an unkown server name. Use !servers to get the server name you want.");
                                }
                            } else {
                                playersArray.push({
                                    account: WHOIS.account,
                                    nick: WHOIS.nick,
                                    host: WHOIS.host,
                                    vote: null
                                });
                                bot.say(to, from + " added to the list [" + playersArray.length + "/" + playersNeeded + "]");
                            }
                        }
                        if (playersArray.length === playersNeeded) {
                            //starts match
                            var playerList = [];
                            for (var i = 0; i < playersArray.length; i++) {
                                playerList.push(playersArray[i].account);
                            };
                            shufflePlayers(playerList);
                            var playerListCopy = playerList.slice();
                            var blueTeam = playerList.splice(0, teamSize);
                            var redTeam = playerList.splice(0, teamSize);
                            var server = getMostVotedServer();
                            playingServer = server;

                            db.getPlayerListByAuth(blueTeam.concat(redTeam), function(players) {
                                //todo: names are objects, get only .name
                                var blueTeamNames = players.splice(0, teamSize);
                                var redTeamNames = players.splice(0, teamSize);

                                blueTeam = irc.colors.wrap("dark_blue", blueTeam);
                                redTeam = irc.colors.wrap("light_red", redTeam);

                                bot.say(to, "Match started on server " + serversConfig.serversArray[server].name + ": " + blueTeamNames + " VS " + redTeamNames);
                                startMatch(playerListCopy, blueTeam, redTeam, server);
                            });
                        }
                    }
                } else {
                    bot.say(to, from + ": You can't add because you are banned. Type !isbanned to see when your ban expires.");
                }
            } else {
                bot.say(to, from + ": you must be authed to add.");
            }
        });
    });
}

function startMatch(playerList, blueTeam, redTeam, serverI) {
    db.getPlayerListByAuth(playerList, function(result) {
        for (var i = 0; i < result.length; i++) {
            send(serverI, "/assignseclev " + result[i].name + " " + seclevID);
        };
    });
    isPlaying = true;
    playingArray = {
        blueTeam: [],
        redTeam: []
    }
    for (var i = 0; i < blueTeam.length; i++) {
        playingArray.blueTeam.push(blueTeam[i]);
    };
    for (var i = 0; i < redTeam.length; i++) {
        playingArray.redTeam.push(redTeam[i]);
    };
    playersArray = [];
}

function removePlayerFromQueue(from, to) {
    bot.whois(from, function(WHOIS) {
        var account = WHOIS.account;
        var removed = false;
        if (isPlaying) {
            if (playerIsPlaying(WHOIS.account)) {
                db.getPlayerByAuth(WHOIS.account, function(player) {
                    requestSub(["", player]); //to do: modify requestSub so it won't need a dummy array index when used from IRC
                });
            }
            for (var i = 0; i < subsArray.length; i++) {
                if (subsArray[i].account === account) {
                    subsArray.splice(i, 1);
                    removed = true;
                    bot.say(to, from + " was removed from the sub-list");
                }
            };
        } else {
            for (var i = 0; i < playersArray.length; i++) {
                if (playersArray[i].account === account) {
                    playersArray.splice(i, 1);
                    removed = true;
                    bot.say(to, from + " was removed from the list");
                }
            };
        }
        if (!removed) {
            bot.say(to, from + " wasn't on the list.");
        }
    });
}

function playerIsInQueue(account) {
    var is = false;
    if (isPlaying) {
        for (var i = 0; i < subsArray.length; i++) {
            if (subsArray[i].account === account) {
                is = true;
            }
        };
    } else {
        for (var i = 0; i < playersArray.length; i++) {
            if (playersArray[i].account === account) {
                is = true;
            }
        };
    }
    return is;
}

function playerIsPlaying(account) {
    for (var i = 0; i < playingArray.length; i++) {
        if (playingArray[i].account === account) {
            return true;
        }
    };
    return false;
}

function showList(from, to) {
    if (isPlaying) {
        var list = [];
        for (var i = 0; i < subsArray.length; i++) {
            list.push(subsArray[i].nick);
        };
        bot.say(from, "Sub-list(" + list.length + "): " + list);
    } else {
        var list = [];
        for (var i = 0; i < playersArray.length; i++) {
            list.push(playersArray[i].nick);
        };
        bot.say(from, "List(" + list.length + "): " + list);
    }
}

function isAdmin(account) {
    for (var i = 0; i < adminList.length; i++) {
        if (adminList[i] === account) {
            return true;
        }
    };
    return false;
}

function status(from, to, message) {
    var botStatus = isBotOn ? "on" : "off";
    if (isPlaying) {
        bot.say(to, "There is a match happening. You can add to the sub-list. And the bot is " + botStatus + ".");
    } else {
        bot.say(to, "There isn't a match happening. You can add to the list. And the bot is " + botStatus + ".");
    }
}

function isBanned(from, to, message) {
    var msg = message.split(" ");
    var player = msg[1];
    db.isPlayerBanned(player, function(isbanned, banExpires) {
        if (isBanned === "player-no-exists") {
            bot.say(to, from + ": this player doesn't exists");
        } else {
            if (banExpires) {
                bot.say(to, from + ": '" + player + "' is banned, his ban will expire in " + banExpires + ".");
            } else {
                bot.say(to, from + ": '" + player + "' is not banned.");
            }
        }

    });
}

function showHelp(from) {
    bot.say(from, "The requeriments to play are: you must be linked and authed. Here's a guide on how to auth: https://www.quakenet.org/help/q/how-to-register-an-account-with-q." + guideLink)
}

function showPlayerStats(from, to, message) {
    var msg = message.split(" ");
    var player = msg[1];
    db.getPlayerStats(player, function(stats) {
        if (stats === "player-no-exists") {
            bot.say(to, from + ": this player doesn't exists");
        } else {
            stats = stats.split(",");
            bot.say(to, from + ": '" + player + "' has " + stats[0] + " wins and " + stats[1] + " losses.");
        }
    });
}

function sendMessageToServer(from, to, message) {
    var msg = message.split(" ");
    msg.shift();
    var server = msg[0];
    msg.shift();
    msg = msg.join(" ");
    var rightID = send(server, "/msg <" + from + ">" + msg);
    if (!rightID) {
        bot.say(to, from + ": wrong server ID.");
    }
}

function forceRemove(from, to, message) {
    bot.whois(from, function(WHOIS) {
        if (WHOIS.account) {
            if (isAdmin(WHOIS.account)) {
                var msg = message.split(" ");
                if (msg[1]) {
                    var authname = msg[1];
                    for (var i = 0; i < playersArray.length; i++) {
                        if (playersArray[i].account === authname) {
                            playersArray.splice(i, 1);
                            return;
                        }
                    };
                    for (var i = 0; i < subsArray.length; i++) {
                        if (subsArray[i].account === authname) {
                            subsArray.splice(i, 1);
                            return;
                        }
                    };
                }
            }
        }
    });
}

function stopBot(from, to) {
    bot.whois(from, function(WHOIS) {
        if (WHOIS.account) {
            if (isAdmin(WHOIS.account)) {
                isBotOn = false;
                playersArray = [];
            }
        }
    });
}

function pauseBot(from, to) {
    bot.whois(from, function(WHOIS) {
        if (WHOIS.account) {
            if (isAdmin(WHOIS.account)) {
                isBotOn = false;
            }
        }
    });
}

function resumeBot(from, to) {
    bot.whois(from, function(WHOIS) {
        if (WHOIS.account) {
            if (isAdmin(WHOIS.account)) {
                isBotOn = true;
            }
        }
    });
}

function banPlayerByAccount(from, to, message) {
    bot.whois(from, function(WHOIS) {
        if (WHOIS.account) {
            if (isAdmin(WHOIS.account)) {
                var msg = message.split(" ");
                if (msg[1]) {
                    var account = msg[1];
                } else {
                    return;
                }
                if (msg[2]) {
                    var time = msg[2];
                } else {
                    return;
                }
                pool.getConnection(function(err, connection) {
                    var actualDate = new Date();

                    actualDate.setDate(actualDate.getDate() + parseInt(time));
                    actualDate = actualDate.toString();
                    connection.query("UPDATE " + usersTable + " SET banExpires=? WHERE authname=?", [actualDate, account], function(err) {
                        if (err) throw err;
                        bot.say(to, account + " is now banned for " + time + " days.");
                    });
                });
            }
        }
    });
};

function unbanPlayerByAccount(from, to, message) {
    bot.whois(from, function(WHOIS) {
        if (WHOIS.account) {
            if (isAdmin(WHOIS.account)) {
                var msg = message.split(" ");
                if (msg[1]) {
                    var account = msg[1];
                } else {
                    return;
                }
                pool.getConnection(function(err, connection) {
                    connection.query("UPDATE " + usersTable + " SET banExpires='null' WHERE authname=?", [account], function(err) {
                        if (err) throw err;
                        bot.say(to, account + " is now unbanned.");
                    });
                });
            }
        }
    });
};

function executeCommand(from, to, message) {
    bot.whois(from, function(WHOIS) {
        if (WHOIS.account) {
            if (isAdmin(WHOIS.account)) {
                var msg = message.split(" ");
                msg.shift();
                if (!msg[0]) {
                    return;
                }
                var serverI = msg[0];
                msg.shift();
                msg = msg.join(" ");
                send(serverI, msg);
                bot.say(from, "Ran '" + msg + "' on server " + serverI + ".");
            }
        }
    });
}

function clearQueues(from, to) {
    bot.whois(from, function(WHOIS) {
        if (WHOIS.account) {
            if (isAdmin(WHOIS.account)) {
                playersArray = [];
                subsArray = [];
                bot.say(to, "Queues cleaned by " + from + ".");
            }
        }
    });
}

function showBanList(from, to) {
    bot.whois(from, function(WHOIS) {
        if (WHOIS.account) {
            if (isAdmin(WHOIS.account)) {
                pool.getConnection(function(err, connection) {
                    connection.query("SELECT authname FROM " + usersTable + " WHERE banExpires!='null';", function(err, results) {
                        var banList = [];
                        for (var i = 0; i < results.length; i++) {
                            banList.push(results[i].authname);
                        };
                        bot.say(from, "Ban list:" + banList);
                    });
                })
            }
        }
    });
}

function forceMatchEnd(from, to) {
    send("/reloadseclevs");
    bot.whois(from, function(WHOIS) {
        if (WHOIS.account) {
            if (isAdmin(WHOIS.account)) {
                db.getPlayerListByAuth(playingArray.blueTeam, function(result) {
                    for (var i = 0; i < result.length; i++) {
                        send(playingServer, "/kick " + result[i]);
                    };
                    playingArray.blueTeam = [];
                });
                db.getPlayerListByAuth(playingArray.redTeam, function(result) {
                    for (var i = 0; i < result.length; i++) {
                        send(playingServer, "/kick " + result[i]);
                    };
                    playingArray.blueTeam = [];
                    subsArray = [];
                });
                bot.say(to, "Forced end on server " + playingServer + ", by " + from + ".");
                playingServer = null;
                isPlaying = false;
            }
        }
    });
}

function getUserAuthname(from, to, message) {
    bot.whois(from, function(WHOIS) {
        if (WHOIS.account) {
            if (isAdmin(WHOIS.account)) {
                var msg = message.split(" ");
                if (msg[1]) {
                    db.getPlayerByAccount(msg[1], function(result) {
                        if (result === "player-no-exists") {
                            bot.say(from, "The player '" + msg[1] + "' isn't registered, or doesn't exists.");
                        } else {
                            bot.say(from, msg[1] + "'s authname is: " + result.authname);
                        }
                    });
                }
            }
        }
    });
};

function getUserUsername(from, to, message) {
    bot.whois(from, function(WHOIS) {
        if (WHOIS.account) {
            if (isAdmin(WHOIS.account)) {
                var msg = message.split(" ");
                if (msg[1]) {
                    db.getPlayerByAuth(msg[1], function(result) {
                        if (result === "player-no-exists") {
                            bot.say(from, "The account '" + msg[1] + "' isn't registered, or doesn't exists.");
                        } else {
                            bot.say(from, msg[1] + "'s KAG username is: " + result.name);
                        }
                    });
                }
            }
        }
    });
}

function showVersion(from) {
    bot.whois(from, function(WHOIS) {
        if (WHOIS.account) {
            if (isAdmin(WHOIS.account)) {
                bot.say(from, "Bot's version: " + version);
            }
        }
    });
}

function giveWin(from, to, message) {
    bot.whois(from, function(WHOIS) {
        if (WHOIS.account) {
            if (isAdmin(WHOIS.account)) {
                var msg = message.split(" ");
                if (msg[1]) {
                    if (msg[2]) {
                        if (msg[1] === "blue") {
                            matchEnded(["Blue"], msg[2], to)
                            return;
                        }
                        if (msg[1] === "red") {
                            matchEnded(["Red"], msg[2], to)
                            return;
                        }
                    }
                }
                bot.say(from, "Invalid input for !givewin.");
            }
        }
    });
}

function showServerList(from) {
    var serverNames = [];
    for (var i = 0; i < config.serverList.length; i++) {
        serverNames.push(config.serverList[i].name);
    };
    bot.say(from, "Server names: " + serverNames);
}

function isValidVote(serverName) {
    for (var i = 0; i < config.serverList.length; i++) {
        if (config.serverList[i].name === serverName) {
            return true;
        }
    };
    return false;
}
//Server Functions
var socketArray = [];
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
serversConfig.serversArray.forEach(function(srvconfig, i) {
    var sock = new Socket();
    sock.setEncoding("utf8");
    sock.setNoDelay();
    sock.setTimeout(1000);

    socketArray.push(sock);
    socketRcon.push(srvconfig.rcon);

    sock.on("connect", function() {
        this.write(srvconfig.rcon + "\n", "utf8");
        console.log("CONNECTED TO THE SERVER...");
    });
    sock.on("data", function(data) {
        //console.log(data);
        parseData(data, i);
    });
    sock.on("error", function(err) {
        console.log("ERROR:" + err);
    });
    sock.on("close", function(err) {
        console.log("CLOSED:" + err);
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
        bot.say(subsArray[0].nick, "You are now playing for gather in place of " + subbed + ". The server's IP:Port : " + serversConfig.serversArray[serverI].publicIp + ":" + serversConfig.serversArray[serverI].port);

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

function requestIRCLink(from, to, message) {
    var msg = message.split(" ");
    var username = msg[1];
    bot.whois(from, function(WHOIS) {
        if (WHOIS.account) {
            links.requestIRCLink(WHOIS.account, username, function(result) {
                bot.say(to, from + ": " + result.message);
            });
        } else {
            bot.say(to, from + ": You are not authed.");
        }
    });
}

function requestKAGLink(data, serverI) {
    var authname = data[1];
    var username = data[2];
    links.requestLink(authname, username, function(result) {
        send(serverI, username + ": " + result.message);
    })
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
    var mostVoted = [serversConfig.serversArray[0].name, 0];
    for (name in votes) {
        if (votes[name] > mostVoted[1]) {
            mostVoted[1] = votes[name];
            mostVoted[0] = name;
        }
    }
    for (var i = 0; i < serversConfig.serversArray.length; i++) {
        if (serversConfig.serversArray[i].name === mostVoted[0]) {
            return i;
        }
    };
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