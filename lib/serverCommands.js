//var playerManagement = require('./playerManagement.js');
module.exports = function(db, bot, config, links, playerManagement, send, logger, serversArray, channels) {
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
    //var playingArray = [];    //defined in diff file

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
                }
            }
        }
    }

    function restartMap(data, serverI) {
        var sent = send(serverI, "/restartmap");
        logger.info('Received RESTARTMAP command, restarting map' + sent + '.');
    }

    function nextMap(data, serverI) {
        send(serverI, "/nextmap");
        logger.info('Received NEXTMAP command, nextmapping.');
    }

    function matchEnded(data, serverI, to) {
        var whoWon;
        logger.info("checking the value of playerManagement.playingArray: "+playerManagement.playingArray+" blueteam: "+playerManagement.playingArray.blueTeam);
        if (data[0] === "Blue") {
            bot.say(channels, "Match ended on server " + serverI + ". The blue team has won.");
            for (var i = 0; i < playerManagement.playingArray.blueTeam.length; i++) {
                db.addVictoryTo(playerManagement.playingArray.blueTeam[i]);
            }
            for (var j = 0; j < playerManagement.playingArray.redTeam.length; j++) {
                db.addLoseTo(playerManagement.playingArray.redTeam[j]);
            }
            whoWon = 0;
        } else {
            bot.say(to, "Match ended on server " + serverI + ". The red team has won. You can now add to the list.");
            for (var i = 0; i < playerManagement.playingArray.blueTeam.length; i++) { // jshint ignore:line
                db.addLoseTo(playerManagement.playingArray.blueTeam[i]);
            }
            for (var j = 0; j < playerManagement.playingArray.redTeam.length; j++) { // jshint ignore:line
                db.addVictoryTo(playerManagement.playingArray.redTeam[j]);
            }
            whoWon = 1;
        }
        db.addMatchToDB(playingArray.blueTeam, playingArray.redTeam, whoWon);
        playerManagement.subsArray = [];
        playerManagement.playingArray = {};
        logger.info('Match ended on server ' + serverI + " .");
    }

    function sendTeams(data, serverI) {
        db.getPlayerListByAuth(playerManagement.playingArray.blueTeam, function(result) {
            var list = [];
            for (var i = 0; i < result.length; i++) {
                list.push(result[i].name);
            }
            send(serverI, "/msg Blue team: " + list);
        });
        db.getPlayerListByAuth(playerManagement.playingArray.redTeam, function(result) {
            var list = [];
            for (var i = 0; i < result.length; i++) {
                list.push(result[i].name);
            }
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
logger.info("checking the value of playerManagement.playingArray: "+arrayObj.playingArray+" blueteam: "+arrayObj.playingArray.blueTeam);
    }

    function requestSub(data, serverI) {

        playerMangement.addSubRequest(data[1]);
        /*var subbed = data[1];
        send(serverI, "/kick " + subbed);
        if (playerManagement.subsArray[0]) {
            db.getPlayerByAuth(playerManagement.subsArray[0].account, function(result) {
                send(serverI, "/assignseclev " + result.name + " " + seclevID);
            });
            bot.say(playerManagement.subsArray[0].nick, "You are now playing for gather in place of " + subbed + ". The server's IP:Port : " + serversArray[serverI].publicIp + ":" + serversArray[serverI].port);
            bot.say(channels,playerManagement.subsArray[0].nick+ "subbed into the match");

            db.getPlayerByAccount(subbed, function(result) {
                var team = "";
                for (var i = 0; i < playersArray.blueTeam.length; i++) {
                    if (playersArray.blueTeam[i].account === result.authname) {
                        playingArray.blueTeam.splice(i, 1);
                        team = "blue";
                    }
                }
                for (var j = 0; j < playersArray.redTeam.length; j++) {
                    if (playersArray.redTeam[j].account === result.authname) {
                        playingArray.redTeam.splice(j, 1);
                        team = "red";
                    }
                }
                if (team === "blue") {
                    playingArray.blueTeam.push(playerManagement.subsArray[0]);
                } else {
                    playingArray.redTeam.push(playerManagement.subsArray[0]);
                }
                playerManagement.subsArray.splice(0, 1);
            });
        }
        logger.info('Requesting sub.');*/
    }

    function requestKAGLink(data, serverI) {
        var authname = data[1];
        var username = data[2];
        links.requestLink(authname, username, function(result) {
            send(serverI, "/msg " + username + ": " + result.message);
        });
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
};
