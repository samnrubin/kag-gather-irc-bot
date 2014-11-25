var floodControl = require('./floodcontrol');
//var playerManagement = require('./playerManagement.js');
module.exports = function(db, bot, config, links, playerManagement, send, logger, channels) {
    var commands = [{
        command: "!add",
        fn: addHandler,
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
        command: "!sub",
        fn: makeSub,
        adminOnly: false,
        description: "subs player into the match if sub position is availible",
        usage: "!sub"
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
        usage: "!isbanned <kagname>"
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
        usage: "!ban <authname> <time>"
    }, {
        command: "!unban",
        fn: unbanPlayerByAccount,
        adminOnly: true,
        description: "Admin only. Unbans a player.",
        usage: "!unban <authname>"
    }, {
        command: "!bankagname",
        fn: banPlayerByKagName,
        adminOnly: true,
        description: "Admin only. Bans a player.",
        usage: "!ban <kagname> <time>"
    }, {
        command: "!unbankagname",
        fn: unbanPlayerByKagName,
        adminOnly: true,
        description: "Admin only. Unbans a player.",
        usage: "!unban <kagname>"
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
    var playersArray = [];
    //var subsArray = [];
    //var playingArray = [];    //defined in diff file
    var playingServer = null;
    var serversArray = config.serverList;
    var saveLogs = config.options.saveLogs;
    //Match config
    var playersNeeded = config.options.playersNeeded;
    var teamSize = playersNeeded / 2;
    var isPlaying = false;
    var isBotOn = true;
    var seclevID = config.options.playerSeclev;
    var guideLink = config.options.guideURL ? " To know how to do that and learn the commands, read the guide at " + config.options.guideURL + " ." : "";

    function match(message, cmd) {
        return (message.indexOf(cmd) === 0);
    }

    function parseMessage(from, to, message) {
        logger.message("[" + to + "]<" + from + "> " + message);
        bot.whois(from, function(WHOIS) {
            var isPlayerAdmin = isAdmin(WHOIS.account);
            var canExecute = isPlayerAdmin || isBotOn;
            for (var i = 0; i < commands.length; i++) {
                if (canExecute) {
                    if (match(message, commands[i].command)) {
                        if (!floodControl.userIsFlooding(WHOIS.account, commands[i].command)) {
                            if (commands[i].adminOnly) {
                                if (isPlayerAdmin) {
                                    commands[i].fn(from, to, message);
                                }
                            } else {
                                commands[i].fn(from, to, message);
                            }
                        }
                    }
                }
            }
        });
    }
    //IRC Functions
    function shufflePlayers(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        logger.info('Shuffling players...');
    }

    function addHandler(from, to, message) {
//logger.info('playerManagement: '+playerManagement);
//logger.info('playermgmt: '+playermgmt2);
        if(isPlaying) return;   //temp check so nobody added to sublist
        canUserAdd(from, function(response) {
            if (response.can) {
                //var list = isPlaying ? 'sub-list' : 'list';
                var vote = message.split(' ')[1] ? message.split(' ')[1] : null;
                if (vote != null){
                    if (!isValidVote(vote) && vote) {
                        bot.say(to, from + ": '" + vote + "' is an unkown server name. Use !servers to get the server name you want.");
                        return;
                    }
                }
                addPlayerToQueue(response.kagName, response.user.nick, response.user.host, vote);
                //var showLeft = isPlaying ? false : true;
                var voteString = "with no server vote";
                if(vote!=null) voteString="with vote "+vote;
                //if (showLeft) {
                    bot.say(to, response.kagName + " was added to the list [" + playersArray.length + "/" + playersNeeded + "] "+ voteString);
                /*} else {
                    bot.say(to, from + " was added to the " + list + " " + voteString);
                }*/
                if (playersArray.length === playersNeeded) {
                    startMatch(to);
                }
            } else {
                bot.say(to, response.message);
                return;
            }
        });
    }

    function getTeams(callback) {
        var playersArrayCopy = playersArray.slice();
        playersArrayCopy = playersArrayCopy.map(function(x) {
            return x.kagName;
        });
        shufflePlayers(playersArrayCopy);

        //db.getPlayerListByAuth(playersArrayCopy, function(players) {
            players = players.map(function(x) {
                return x.name;
            });
            var blueTeam = players.splice(0, teamSize);
            var redTeam = players.splice(0, teamSize);
            callback(blueTeam, redTeam);
        //});
    }

    function getMostVotedServer() {
        var votes = [];
        for (var i = 0; i < playersArray.length; i++) {
            if (playersArray[i].vote) {
                var aleadyInArray = false;
                for (var j = 0; j < votes.length; j++) {
                    if (votes[j].name === playersArray[i].vote) {
                        aleadyInArray = true;
                        votes[j].count += 1;
                    }
                }
                if (!aleadyInArray) {
                    votes.push({
                        name: playersArray[i].vote,
                        count: 1
                    });
                }
            }
        }
        var mostVotedID = 0;
        var mostVotesCount = 0;
        for (var k = 0; k < votes.length; k++) {
            if (votes[k].count > mostVotesCount) {
                mostVotedID = k;
                mostVotesCount = votes[k].count;
            }
        }
        return mostVotedID;
    }

    function canUserAdd(userNick, callback) {
        var kagName=getKagNameByNick(userNick);
        bot.whois(userNick, function(WHOIS) {
	        if(kagName==undefined){
        	    callback({
                	can: false,
	                message: userNick + ": you must link to play, you can link using !link <kagUsername>",
        	        user: WHOIS,
			kagName : kagName
	            });
        	}
            	//if (WHOIS.account) {
                db.isKagAccountBanned(kagName, function(isBanned) {
                    if (isBanned) {
                        callback({
                            can: false,
                            message: userNick + ": You can't add because you are banned. Type !isbanned to see when your ban expires.",
                            user: WHOIS,
                            kagName: kagName
                        });
                        return;
                    }
                    if (playerIsInQueue(kagName)) {
                        callback({
                            can: false,
                            message: userNick + ": you're already in the queue, remove yourself from the queue using !rem",
                            user: WHOIS,
                            kagName: kagName
                        });
                        return;
                    }
                    if (isPlaying) {
                        callback({
                            can: false,
                            message: userNick + ": A match is alreay running, you must wait until it finishes to add",
                            user: WHOIS,
                            kagName: kagName
                        });
                        return;
                    }
                    callback({
                        can: true,
                        message: null,
                        user: WHOIS,
                        kagName: kagName
                    });
                    return;
                });
            /*} else {
                callback({
                    can: false,
                    message: userNick + ": you must be authed to play, use !help for more help",
                    user: WHOIS,
                    kagName: kagName
                });
                return;
            }*/
        });
    }

    function addPlayerToQueue(kagName, nick, host, vote) {
/*        if (list === "sub-list") {
return; //temporary, make sure not check sub list
            playerManagement.subsArray.push({
                account: account,
                nick: nick,
                host: host
            });
            logger.info('Added "' + nick + '" to the sub-list.');
            return playerManagement.subsArray;
        } else {*/
            playersArray.push({
                kagName: kagName,
                nick: nick,
                host: host,
                vote: vote
            });
            logger.info('Added "' + nick + '" to the list.');
            return playersArray;
        //}
    }

    function sendUpdatedTeams(){
        //set the teams for the kag server by doing these commands
            //string[] blue={'player1', 'player2', 'etc'}; getRules().set('blueTeam',blue);
            //string[] red={'player1', 'player2', 'etc'}; getRules().set('redTeam',red);
            //getRules().set_bool('teamsSet',true);

        //blue
        var teamString="{";
        for (var i=0; i < playerManagement.playingArray.blueTeam.length-1; i++){
            teamString=teamString+"'"+playerManagement.playingArray.blueTeam[i]+"'"
            teamString=teamString+", ";
        }
        teamString=teamString+"'"+playerManagement.playingArray.blueTeam[playerManagement.playingArray.blueTeam.length-1]+"'}; ";
        send(playingServer, "string[] blue=" + teamString + "getRules().set('blueTeam',blue);");
        //red
        teamString="{";
        for (var i=0; i < playerManagement.playingArray.redTeam.length-1; i++){
            teamString=teamString+"'"+playerManagement.playingArray.redTeam[i]+"'"
            teamString=teamString+", ";
        }
        teamString=teamString+"'"+playerManagement.playingArray.redTeam[playerManagement.playingArray.redTeam.length-1]+"'}; ";
        send(playingServer, "string[] red=" + teamString + "getRules().set('redTeam',red);");

        send(playingServer, "getRules().set_bool('teamsUpdated',true);");
    }

    function makeSub(from, to, message){
        if(!isPlaying){
            bot.say(to, from + ": There is no match running, use !add to add to the queue for the next match!");
            return;
        }
        var kagName=getkagNameByNick(from);
        if(kagName){
        //bot.whois(from, function(WHOIS) {
            //db.getPlayerByAuth(WHOIS.account, function(player) {
                if(playerManagement.makeSub(kagName)){
                    bot.say(channels, from + " has subbed into the match!");
                    sendUpdatedTeams();
                }else{
                    bot.say(to, from +": There is no sub position available");
            	}
	        //});
        //});
        }else{
            bot.say(to, from+": You must be linked/authed to join a game");
        }
    }

    function getKagNameByNick(nick){
        var kagName=db.getTempKagNameByNick(nick);
logger.info("kagName: "+kagName);
        if(kagName!=undefined){
            return kagName;
        }else{
            bot.whois(nick, function(WHOIS) {
logger.info("WHOIS.account: "+WHOIS.account);
                if(!WHOIS.account) return;
                db.getPlayerByAuth(WHOIS.account, function(player) {
logger.info("player: "+player+" player.name: "+player.name);
                    if(player=="player-no-exists") return;
                    else return player.name;

                });
            });
        }
        return;
    }
//this code wont work, no way to get nick from auth without having a userlist
    /*function getNickFromKagName(kagName){
        var nick=db.getTempNickFromKagName();
        if(nick!=undefined){
            return nick;
        }else{
            db.getPlayerByAccount(kagName, function(player) {
                if(player=="player-no-exists") return;
                bot.whois(player.authName
                else return player.authName;
            });
        }
    }*/

    function startMatch(to) {
        logger.info('Setting a new match up...');
        playerList = playersArray.slice();
        playingServer = getMostVotedServer();
        getTeams(function(blueTeam, redTeam) {
            logger.info('Getting teams...');
//logger.info("blue team: "+blue);

            //set the teams for the kag server by doing these commands
            //string[] blue={'player1', 'player2', 'etc'}; getRules().set('blueTeam',blue);
            //string[] red={'player1', 'player2', 'etc'}; getRules().set('redTeam',red);
            //getRules().set_bool('teamsSet',true);

            //blue
            var teamString="{";
            for (var i=0; i < blueTeam.length-1; i++){
                teamString=teamString+"'"+blueTeam[i]+"'"
                teamString=teamString+", ";
            }
            teamString=teamString+"'"+blueTeam[blueTeam.length-1]+"'}; ";
            send(playingServer, "string[] blue=" + teamString + "getRules().set('blueTeam',blue);");
            //red
            var teamString="{";
            for (var i=0; i < redTeam.length-1; i++){
                teamString=teamString+"'"+redTeam[i]+"'"
                teamString=teamString+", ";
            }
            teamString=teamString+"'"+redTeam[redTeam.length-1]+"'}; ";
            send(playingServer, "string[] red=" + teamString + "getRules().set('redTeam',red);");
            
            send(playingServer, "getRules().set_bool('teamsSet',true);");


            /*)db.getPlayerListByAuth(playerList, function(result) {
                for (var i = 0; i < result.length; i++) {
                    send(playingServer, "/assignseclev " + result[i].name + " " + seclevID);
                }
                
            });*/
            for (var i = 0; i < playersArray.length; i++) {
                bot.say(playersArray[i].nick, "You are now playing for gather on the " + serversArray[playingServer].name + " server.");
            }

            playerManagement.playingArray = {
                blueTeam: blueTeam,
                redTeam: redTeam
            };

logger.info('playingarray: '+playerManagement.playingArray+'playingarray.blueTeam: '+playerManagement.playingArray.blueTeam+'playingarraylength: '+playerManagement.playingArray.length+'playingarray.blueteam.length: '+playerManagement.playingArray.blueTeam.length);
/*
            var blueTeamNicks = [];
            var redTeamNicks = [];

            for(var i=0;i<playerManagement.blueTeam.length;i++){
                blueTeamNicks[i]=playerManagement.blueTeam[i].nick;
            }
            for(var i=0;i<playerManagement.redTeam.length;i++){
                redTeamNicks[i]=playerManagement.redTeam[i].nick;
            }
            logger.info('blue: '+blueTeamNicks+' red: '+redTeamNicks);
*/
            playersArray = [];
            isPlaying = true;

            logger.info('Match set.');
            bot.say(to, "Match started on server " + serversArray[playingServer].name + ": " + blueTeam + "(Blue Team) VS " + redTeam + " (Red Team)" + " kag://"+serversArray[playingServer].publicIp +":"+serversArray[playingServer].port );
        });
    }

    function removePlayerFromQueue(from, to) {
        var kagName = getKagNameFromNick(from);
        //if (isPlaying) {          //if the player isnt the the queue, want to do the same thing wether there is a game running or not
        logger.info('irc name?: '+from+' kag name?: '+kagName);
        if (playerIsPlaying(kagName)) {
            logger.info('player is in the game');
            playerManagement.addSubRequest(player.name);
            bot.say(to, from + " left the match");
            bot.say(to, "A sub is needed for the game running on server: "+serversArray[playingServer].name + " you may sub into the match using !sub");
        } else if(playerIsInQueue(kagName)){
            for (var i = 0; i < playersArray.length; i++) { 
                if (playersArray[i].kagName === kagName) {
                    playersArray.splice(i, 1);
                    bot.say(to, from + " was removed from the list"+" [" + playersArray.length + "/" + playersNeeded + "] "+"remaining");
                    logger.info('Removed "' + from + '" from queue.');
                    return;
                }
            }
        }
        return;
        //}
        /*bot.whois(from, function(WHOIS) {
            var account = WHOIS.account;
            var removed = false;
            logger.info('irc name?: '+from+' auth account?: '+account);
            if (isPlaying) {
                db.getPlayerByAuth(WHOIS.account, function(player) {
                    logger.info('game is running: checking if player: '+player.name+' is playing');
                    if (playerIsPlaying(player.name)) {
                        logger.info('player is in the game');
                            playerManagement.addSubRequest(player.name);
                            removed = true;
                            bot.say(to, from + " left the match");
                            bot.say(to, "A sub is needed for the game running on server: "+serversArray[playingServer].name + " you may sub into the match using !sub");
                            //requestSub(["", player]); //to do: modify requestSub so it won't need a dummy array index when used from IRC
                        
                    }
                });
                if(playerManagement.subsArray != undefined){
                    for (var i = 0; i < playerManagement.subsArray.length; i++) {
                        if (playerManagement.subsArray[i].account === account) {
                            playerManagement.subsArray.splice(i, 1);
                            removed = true;
                            bot.say(to, from + " was removed from the sub-list");
                        }
                    }
                }
            } else {
                for (var i = 0; i < playersArray.length; i++) { // jshint ignore:line
                    if (playersArray[i].account === account) {
                        playersArray.splice(i, 1);
                        removed = true;
                        bot.say(to, from + " was removed from the list"+" [" + playersArray.length + "/" + playersNeeded + "] "+"remaining");
                        logger.info('Removed "' + from + '" from queue.');
                    }
                }
            }
            if (!removed) //{
                bot.say(to, from + " wasn't on the list. (maybe) (bugs)");
                logger.info('"wasnt on list"');
            //} else {
                //logger.info('Removed "' + from + '" from queue.');
            //}
        });*/
    }

    function playerIsInQueue(kagName) {
        var is = false;
        if (isPlaying) {
            /*if(playerManagement.subsArray!=undefined){
                for (var i = 0; i < playerManagement.subsArray.length; i++) {
                    if (playerManagement.subsArray[i].account === account) {
                        is = true;
                    }
                }
            }*/
        } else {
            if(playersArray!=undefined){
                for (var i = 0; i < playersArray.length; i++) { // jshint ignore:line
                    if (playersArray[i].kagname === kagName) {
                        is = true;
                    }
                }
            }
        }
        return is;
    }

    function playerIsPlaying(kagName) {
        logger.info('playerisplaying called: '+playerManagement.playingArray.length+' playing array is: '+playerManagement.playingArray);
        for (var i = 0; i < playerManagement.playingArray.blueTeam.length; i++) {
            logger.info('playerIsPlaying?: '+kagName+' compare to: player in list: '+playerManagement.playingArray.blueTeam[i].account+' nick: '+playerManagement.playingArray.blueTeam[i].nick+' host: '+playerManagement.playingArray.blueTeam[i].host);
            if (playerManagement.playingArray.blueTeam[i] === kagName) {
                return true;
            }
        }
        for (var i = 0; i < playerManagement.playingArray.redTeam.length; i++) {
            logger.info('playerIsPlaying?: '+kagName+' compare to: player in list: '+playerManagement.playingArray.redTeam[i].account+' nick: '+playerManagement.playingArray.redTeam[i].nick+' host: '+playerManagement.playingArray.redTeam[i].host);
            if (playerManagement.playingArray.redTeam[i] === kagName) {
                return true;
            }
        }
        return false;
    }

    function showList(from, to) {
logger.info("Showing player list for "+from+" to "+to);
        if (isPlaying) {
            bot.say(from, "Game is aready running");
            /*var list = [];
            for (var i = 0; i < playerManagement.subsArray.length; i++) {
                list.push(playerManagement.subsArray[i].nick);
            }
            bot.say(from, "Sub-list(" + list.length + "): " + list);*/
        } else {
            var list = []; // jshint ignore:line
            for (var i = 0; i < playersArray.length; i++) { // jshint ignore:line
                list.push(playersArray[i].nick);
                list.push("("+playersArray[i].kagName+") ");
            }
            bot.say(from, "List(" + list.length + "): " + list);
        }
    }

    function isAdmin(account) {
        for (var i = 0; i < config.options.adminList.length; i++) {
            if (config.options.adminList[i] === account) {
                return true;
            }
        }
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
        if(player==undefined) {
            bot.say(to, from +": usage is !isbanned <kagUsername>");
            return;
        }
        db.isKagAccountBanned(player, function(isbanned, banExpires) {
            if (isBanned === "player-no-exists") {
                bot.say(to, from + ": the player doesn't exist");
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
        bot.say(from, "In order to play you must be linked and authed. Follow this guide to set up an auth account: https://www.quakenet.org/help/q/how-to-register-an-account-with-q .  You can link using !link <kagUsername>.  More on how to play gather: "+ guideLink);
    }

    function showPlayerStats(from, to, message) {
        var msg = message.split(" ");
        var player = msg[1];
        db.getPlayerStats(player, function(stats) {
            if (stats === "player-no-exists") {
                bot.say(to, from + ": this player doesn't exist");
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
            removePlayerFromQueue(msg[1], to);      //the players nick
            /*var authname = msg[1];
            if (isPlaying) {
                if (playerIsPlaying(authname)) {
                    db.getPlayerByAuth(WHOIS.account, function(player) {
                        bot.say(to, from + " was removed from the queue");
                        requestSub(["", player]); //to do: modify requestSub so it won't need a dummy array index when used from IRC
                    });
                }
            }

            for (var i = 0; i < playersArray.length; i++) {
                logger.info('checking: '+playersArray[i].account);
                if (playersArray[i].account === authname) {
                    playersArray.splice(i, 1);
                    bot.say(to, from + " was removed from the list");
                    return;
                }
            }
            for (var j = 0; j < playerManagement.subsArray.length; j++) {
                if (playerManagement.subsArray[j].account === authname) {
                    playerManagement.subsArray.splice(j, 1);
                    bot.say(to, from + " was removed from the sub-list");
                    return;
                }
            }*/
        }else bot.say(to, "insufficient arguments for !frem");
    }

    function stopBot(from, to) {
        isBotOn = false;
        playersArray = [];
        logger.info('Bot stopped by ' + from);
    }

    function pauseBot(from, to) {
        isBotOn = false;
        logger.info('Bot paused by ' + from);
    }

    function resumeBot(from, to) {
        isBotOn = true;
        logger.info('Bot resumed by ' + from);
    }

    function banPlayerByAccount(from, to, message) {
        var msg = message.split(" ");
        if (msg[1]) {
            var account = msg[1];
        } else {
            bot.say("insufficient arguments for ban command");
            return;
        }
        if (msg[2]) {
            var time = msg[2];
        } else {
            bot.say("insufficient arguments for ban command");
            return;
        }
        pool.getConnection(function(err, connection) {
            var actualDate = new Date();

            actualDate.setDate(actualDate.getDate() + parseInt(time));
            actualDate = actualDate.toString();
            connection.query("UPDATE " + usersTable + " SET banExpires=? WHERE authname=?", [actualDate, account], function(err) {
                if (err) throw err;
                bot.say(to, account + " is now banned for " + time + " days.");
                logger.info('Banned player ' + account + ' for ' + time + ' days.');
            });
        });
    }

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
                logger.info('Unbanned ' + account);
            });
        });
    }

    function banPlayerByKagName(from, to, message) {
        var msg = message.split(" ");
        if (msg[1]) {
            var account = msg[1];
        } else {
            bot.say("insufficient arguments for ban command");
            return;
        }
        if (msg[2]) {
            var time = msg[2];
        } else {
            bot.say("insufficient arguments for ban command");
            return;
        }
        pool.getConnection(function(err, connection) {
            var actualDate = new Date();

            actualDate.setDate(actualDate.getDate() + parseInt(time));
            actualDate = actualDate.toString();
            connection.query("UPDATE " + usersTable + " SET banExpires=? WHERE name=?", [actualDate, account], function(err) {
                if (err) throw err;
                bot.say(to, account + " is now banned for " + time + " days.");
                logger.info('Banned player ' + account + ' for ' + time + ' days.');
            });
        });
    }

    function unbanPlayerByKagName(from, to, message) {
        var msg = message.split(" ");
        if (msg[1]) {
            var account = msg[1];
        } else {
            return;
        }
        pool.getConnection(function(err, connection) {
            connection.query("UPDATE " + usersTable + " SET banExpires='null' WHERE name=?", [account], function(err) {
                if (err) throw err;
                bot.say(to, account + " is now unbanned.");
                logger.info('Unbanned ' + account);
            });
        });
    }

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
        logger.info('Ran command ' + msg + ' on server ' + serverI);
        bot.say(from, "Ran '" + msg + "' on server " + serverI + ".");
    }

    function clearQueues(from, to) {
        playersArray = [];
        playerManagement.subsArray = [];
        bot.say(to, "Queues cleaned by " + from + ".");
        logger.info('Clearing queues.');
    }

    function showBanList(from, to) {
        pool.getConnection(function(err, connection) {
            connection.query("SELECT name FROM " + usersTable + " WHERE banExpires!='null';", function(err, results) {
                var banList = [];
                for (var i = 0; i < results.length; i++) {
                    banList.push(results[i].name);
                }
                bot.say(from, "Ban list:" + banList);
            });
        });
    }

    function forceMatchEnd(from, to) {
        /*db.getPlayerListByAuth(playerManagement.playingArray.blueTeam, function(result) {
            for (var i = 0; i < result.length; i++) {
                send(playingServer, "/kick " + result[i]);
            }*/
            playerManagement.playingArray.blueTeam = [];
        //});
        /*db.getPlayerListByAuth(playerManagement.playingArray.redTeam, function(result) {
            for (var i = 0; i < result.length; i++) {
                send(playingServer, "/kick " + result[i]);
            }*/
            playerManagement.playingArray.blueTeam = [];
            //playerManagement.subsArray = [];
        //});
        bot.say(to, "Forced end on server " + playingServer + ", by " + from + ".");
        playingServer = null;
        isPlaying = false;
        logger.info('Forced match end on ' + playingServer + ' by ' + from);
    }

    function getUserAuthname(from, to, message) {
        var msg = message.split(" ");
        if (msg[1]) {
            db.getPlayerByAccount(msg[1], function(result) {
                if (result === "player-no-exists") {
                    bot.say(from, "The player '" + msg[1] + "' isn't registered, or doesn't exist.");
                } else {
                    bot.say(from, msg[1] + "'s authname is: " + result.authname);
                }
            });
        }
    }

    function getUserUsername(from, to, message) {
        var msg = message.split(" ");
        if (msg[1]) {
            var kagName=getkagNameByNick(msg[1]);
            if(kagName){
            //db.getPlayerByAuth(msg[1], function(result) {
            //if (result === "player-no-exists") {
                bot.say(from, "The account '" + msg[1] + "' isn't registered, or doesn't exist.");
            } else {
                bot.say(from, msg[1] + "'s KAG username is: " + kagname /*result.name*/);
            }
            //});
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
                    matchEnded(["Blue"], msg[2], to);
                    return;
                }
                if (msg[1] === "red") {
                    matchEnded(["Red"], msg[2], to);
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
        }
        bot.say(from, "Server names: " + serverNames);
    }

    function isValidVote(serverName) {
        for (var i = 0; i < config.serverList.length; i++) {
            if (config.serverList[i].name === serverName.toUpperCase()) {
                return true;
            }
        }
        return false;
    }

    function commandSpecificHelp(from, to, message) {
        var commandName = message.split(" ")[1];
        var command = isValidCommand(commandName);
        if (command.isValid) {
            var i = command.ID;
            bot.say(from, "Description: " + commands[i].description + "\nUsage: " + commands[i].usage);
        } else {
            bot.say(from, "Uknown '" + command + "' command.");
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
        }
        return {
            isValid: false,
            commandID: null
        };
    }

    function requestIRCLink(from, to, message) {
        var msg = message.split(" ");
        var username = msg[1];
	if(username==undefined) {
		bot.say(to, from + ": usage is !link KAGUsername");
		return;
	}
        bot.whois(from, function(WHOIS) {
            if (WHOIS.account) {
                links.requestIRCLink(WHOIS.account, username, function(result) {
                    bot.say(to, from + ": " + result.message);
                });
            } else {
                db.addTempLinkData(WHOIS.nick, username);
                bot.say(to, from + ": You are not authed, so a temporary link was made for you, !help for more info.  You may now add using !add");
                bot.say(to, "temp links not working yet - make an auth");    
            }
        });
    }

    function onPart(a, b, c, raw) {
        for (var i = 0; i < playersArray.length; i++) {
            if (playersArray[i].host === raw.host) {
                playersArray.splice(i, 1);
                bot.say(channels, raw.nick + " was removed from the queue(left IRC)"+" [" + playersArray.length + "/" + playersNeeded + "] "+"remaining");
                logger.info('Removed "' + raw.nick + '" from queue.');
            }
        }
        db.removeTempLinkData(raw.nick);
        /*for (var j = 0; j < playerManagement.subsArray.length; j++) {
            if (playerManagement.subsArray[j].host === raw.host) {
                playerManagement.subsArray.splice(j, 1);
                bot.say(channels, raw.nick + " was removed from the queue(left IRC).");
            }
        }*/
    }

    function onNick(oldNick, newNick) {
        for (var i = 0; i < playersArray.length; i++) {
            if (playersArray[i].nick === oldNick) {
                playersArray[i].nick = newNick;
            }
        }
        db.updateTempLinkNick(oldNick, newNick);
        /*for (var j = 0; j < playerManagement.subsArray.length; j++) {
            if (playerManagement.subsArray[j].nick === oldNick) {
                playerManagement.subsArray[j].nick = newNick;
            }
        }*/
    }
    return {
        parseMessage: parseMessage,
        onPart: onPart,
        onNick: onNick
    };
};
