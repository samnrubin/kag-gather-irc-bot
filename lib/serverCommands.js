module.exports = function(db, bot, config, send, logger, serversArray) {
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

    function parseData(data, serverI) {
        data = data.split("\n");
        for (var j = 0; j < data.length; j++) {
            data[j] = data[j].substring(11, data[j].length);

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
        logger.info('Received RESTARTMAP command, restarting map.');
    }

    function nextMap(data, serverI) {
        send(serverI, "/nextmap");
        logger.info('Received NEXTMAP command, nextmapping.');
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
        logger.info('Match ended on server ' + serverI + " .");
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
        logger.info('Sending message from "' + name + '" to IRC channel.');
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
        logger.info('Requesting sub.');
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
    return {
        parseData: parseData
    };
}