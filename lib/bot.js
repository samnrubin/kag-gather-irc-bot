module.exports = function(db, bot, config) {
    console.log(commands);
    var commands = [{
        command: "!add",
        fn: add,
        adminOnly: false,
        description: "Add yourself to the gather queue so you can play, if there's already a match running, you get added to the sub-list.",
        usage: "!add <optional:servername>"
    }, {
        command: "!rem",
        fn: removePlayerFromQueue,
        adminOnly: false,
        description: "Remove yourself from the gather queue or the sub-list.",
        usage: "!rem"
    }, {
        command: "!list",
        fn: showList,
        adminOnly: false,
        description: "Shows the list of players in the actual queue or sub-list.",
        usage: "!list"
    }, {
        command: "!status",
        fn: status,
        adminOnly: false,
        description: "Shows the bot status",
        usage: "!status"
    }, {
        command: "!isbanned",
        fn: isBanned,
        adminOnly: false,
        description: "Shows if a player is banned, if the player is, shows when the ban will expire.",
        usage: "!isbanned <authname>"
    }, {
        command: "!help",
        fn: showHelp,
        adminOnly: false,
        description: "Shows basic help.",
        usage: "!help"
    }, {
        command: "!stats",
        fn: showPlayerStats,
        adminOnly: false,
        description: "Shows a player's stats(wins/losses)",
        usage: "!stats <authname>"
    }, {
        command: "!say",
        fn: sendMessageToServer,
        adminOnly: false,
        description: "Sends a message to a Gather KAG Server",
        usage: "!say <serverName> <message>"
    }, {
        command: "!link",
        fn: requestIRCLink,
        adminOnly: false,
        description: "Requests a link. This is required to play.",
        usage: "!link <kagusername>"
    }, {
        command: "!frem",
        fn: forceRemove,
        adminOnly: true,
        description: "Admin only. Removes a player from the queue.",
        usage: "!frem <authname>"
    }, {
        command: "!stop",
        fn: stopBot,
        adminOnly: true,
        description: "Stops the bot and clean queues.",
        usage: "!stop"
    }, {
        command: "!pause",
        fn: pauseBot,
        adminOnly: true,
        description: "Pauses the bot, queues are not cleaned.",
        usage: "!pause"
    }, {
        command: "!resume",
        fn: resumeBot,
        adminOnly: true,
        description: "Resumes the bot if was previously paused or stopped.",
        usage: "!resume"
    }, {
        command: "!ban",
        fn: banPlayerByAccount,
        adminOnly: true,
        description: "Admin only. Bans a player.",
        usage: "!ban <authname>"
    }, {
        command: "!unban",
        fn: unbanPlayerByAccount,
        adminOnly: true,
        description: "Admin only. Unbans a player.",
        usage: "!unban <authname>"
    }, {
        command: "!execute",
        fn: executeCommand,
        adminOnly: true,
        description: "Admin only. Use with caution. Executes a command in the server.",
        usage: "!execute <command>"
    }, {
        command: "!clear",
        fn: clearQueues,
        adminOnly: true,
        description: "Admin only. Clear queues, sub and list.",
        usage: "!clear"
    }, {
        command: "!banlist",
        fn: showBanList,
        adminOnly: true,
        description: "Admin only. Shows the ban-list.",
        usage: "!banlist"
    }, {
        command: "!force_match_end",
        fn: forceMatchEnd,
        adminOnly: true,
        description: "Admin only. Use with caution. Forces the match end, no stats are counted.",
        usage: "!force_match_end"
    }, {
        command: "!username",
        fn: getUserUsername,
        adminOnly: false,
        description: "Shows the user's KAG username.",
        usage: "!username <authname>"
    }, {
        command: "!authname",
        fn: getUserAuthname,
        adminOnly: false,
        description: "Shows the user's IRC authname.",
        usage: "!authname <kagusername>"
    }, {
        command: "!version",
        fn: showVersion,
        adminOnly: true,
        description: "Shows the bot's version.",
        usage: "!version"
    }, {
        command: "!givewin",
        fn: giveWin,
        adminOnly: true,
        description: "Admin only. Use with caution. Force ends a match counting stats.",
        usage: "!givewin <teamname>"
    }, {
        command: "!server",
        fn: showServerList,
        adminOnly: false,
        description: "Shows the available server names.",
        usage: "!server"
    }, {
        command: "!whatis",
        fn: commandSpecificHelp,
        adminOnly: false,
        description: "What are you doing?",
        usage: "You know how."
    }];

    var subsArray = [];
    var playingArray = [];
    var playingServer = null;
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
    var serversArray = config.serverList;
    var saveLogs = config.options.saveLogs;
    var playersArray = [];
    //Match config
    var playersNeeded = config.options.playersNeeded;
    var teamSize = playersNeeded / 2;
    var isPlaying = false;
    var isBotOn = true;
    var seclevID = config.options.playerSeclev;

    function match(message, cmd) {
        return (message.indexOf(cmd) === 0);
    }

    function parseMessage(from, to, message) {
        // if (saveLogs) {
        //     logStream.write("[" + (new Date().toJSON()) + "][" + to + "]<" + from + ">" + message + "\n");
        // }
        bot.whois(from, function(WHOIS) {
            var isPlayerAdmin = isAdmin(WHOIS.account);
            var canExecute = isPlayerAdmin || isBotOn;
            for (var i = 0; i < commands.length; i++) {
                if (canExecute) {
                    if (match(message, commands[i].command)) {
                        if (commands[i].adminOnly) {
                            if (isPlayerAdmin) {
                                commands[i].fn(from, to, message);
                            }
                        } else {
                            commands[i].fn(from, to, message);
                        }
                    }
                }
            };
        })
    }
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
                                    //case insensitive
                                    vote = vote.toUpperCase();
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
                                var playersArrayCopy = playersArray.slice();
                                playersArrayCopy = playersArrayCopy.map(function(x) {
                                    return x.account;
                                });
                                shufflePlayers(playersArrayCopy);
                                playingServer = getMostVotedServer();


                                db.getPlayerListByAuth(playersArrayCopy, function(players) {
                                    players = players.map(function(x) {
                                        return x.name;
                                    });
                                    var blueTeam = players.splice(0, teamSize);
                                    var redTeam = players.splice(0, teamSize);

                                    var blueTeamNames = /*colors.blue*/ (blueTeam.join(','));
                                    var redTeamNames = /*colors.red*/ (redTeam.join(','));
                                    bot.say(to, "Match started on server " + serversArray[playingServer].name + ": " + blueTeamNames + " VS " + redTeamNames);
                                    startMatch(playersArrayCopy, blueTeam, redTeam, playingServer);
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
        for (var i = 0; i < config.options.adminList.length; i++) {
            if (config.options.adminList[i] === account) {
                return true;
            }
        };
        return false;
    }

    function status(from, to, message) {
        var botStatus = isBotOn ? "on" : "off";
        if (isPlaying) {
            bot.say(to, "There is a match happening. And the bot is " + botStatus + ".");
        } else {
            bot.say(to, "There isn't a match happening. And the bot is " + botStatus + ".");
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

    function stopBot(from, to) {
        isBotOn = false;
        playersArray = [];
    }

    function pauseBot(from, to) {
        isBotOn = false;
    }

    function resumeBot(from, to) {
        isBotOn = true;
    }

    function banPlayerByAccount(from, to, message) {
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
    };

    function unbanPlayerByAccount(from, to, message) {
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
    };

    function executeCommand(from, to, message) {
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

    function clearQueues(from, to) {
        playersArray = [];
        subsArray = [];
        bot.say(to, "Queues cleaned by " + from + ".");
    }

    function showBanList(from, to) {
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

    function forceMatchEnd(from, to) {
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

    function getUserAuthname(from, to, message) {
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
    };

    function getUserUsername(from, to, message) {
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

    function showVersion(from) {
        bot.say(from, "Bot's version: " + version);
    }

    function giveWin(from, to, message) {
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

    function commandSpecificHelp(from, to, message) {
        var commandName = message.split(" ")[1]
        var command = isValidCommand(commandName);
        if (command.isValid) {
            var i = command.ID;
            bot.say(from, "Description: " + commands[i].description + "\nUsage: " + commands[i].usage);
        } else {
            bot.say(from, "Uknown '" + command + "' command.")
        }
    }

    function isValidCommand(command) {
        for (var i = 0; i < commands.length; i++) {
            if (commands[i].command === command) {
                return {
                    isValid: true,
                    ID: i
                };
            }
        };
        return {
            isValid: false,
            commandID: null
        };
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
    return {
        parseMessage: parseMessage
    }
}