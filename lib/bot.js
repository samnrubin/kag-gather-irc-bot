var floodControl = require('./floodcontrol');
//var playerManagement = require('./playerManagement.js');
module.exports = function(db, bot, config, links, playerManagement, send, logger, channels) {
    var commands = [{
        command: "!whatis",
        fn: commandSpecificHelp,
        adminOnly: false,
        description: "returns usage of a command",
        usage: "!whatis <command>"
    },{
        command: "!commands",
        fn: commandList,
        adminOnly: false,
        description: "returns a list of commands",
        usage: "!commands"
    },{
        command: "!add",
        fn: addHandler,
        adminOnly: false,
        description: "Add yourself to the gather queue so you can play, if there's already a match running, you get added to the sub-list.",
        usage: "!add <optional:servername>"
    }, {
        command: "!rem",
        fn: removeSelfFromQueue,
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
        command: "!rsub",
        fn: addSubVote,
        adminOnly: false,
        description: "adds a vote to sub a player",
        usage: "!rsub <kagname>"
    }, {
        command: "!subs?",
        fn: getSubs,
        adminOnly: false,
        description: "returns info on the available sub positions",
        usage: "!subs"
    }, {
        command: "!sub",
        fn: makeSub,
        adminOnly: false,
        description: "subs player into the match if sub position is available",
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
        usage: "!frem <kagName>"
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
        command: "!end",
        fn: addEndVote,
        adminOnly: false,
        description: "Adds vote to end a match with no stats counted",
        usage: "!end"
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
    }, /*{
        command: "!version",
        fn: showVersion,
        adminOnly: true,
        description: "Shows the bot's version.",
        usage: "!version"
    },*/ {
        command: "!givewin",
        fn: giveWin,
        adminOnly: false,
        description: "gives win if admin, adds vote for give win if not. Force ends a match counting stats.",
        usage: "!givewin <teamname>"
    }, {
        command: "!restartbot",
        fn: restartBot,
        adminOnly: true,
        description: "restarts the bot by causing a crash",
        usage: "!restartbot"
    }, {
        command: "!servers",
        fn: showServerList,
        adminOnly: false,
        description: "Shows the available server names.",
        usage: "!servers"
    }];
    var playersArray = [];
    //var subsArray = [];
    //var playingArray = [];    //defined in diff file
    //var playerManagement.playingServer = null;     //moved to playerManagement.js
    var serversArray = config.serverList;
    var saveLogs = config.options.saveLogs;
    //Match config
    var playersNeeded = config.options.playersNeeded;
    var teamSize = playersNeeded / 2;
    //var playerManagement.isPlaying = false;        //moved to playerManagement.js
    var isBotOn = true;
    var seclevID = config.options.playerSeclev;
    var guideLink = config.options.guideURL ? " To know how to do that and learn the commands, read the guide at " + config.options.guideURL + " ." : "";
    var endVotes = [];
    var endVotesRequired = 6;
    var giveWinBlueVotes = [];
    var giveWinRedVotes = [];
    var giveWinVotesRequired = 7;
    var defaultServer = 0;

    function match(message, cmd) {
        return (message.indexOf(cmd) === 0);
    }

    function parseMessage(from, to, message) {
logger.info("received message: "+from+": "+message);
        if(message[0]!="!") return;
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
logger.info("ececuting command: "+commands[i].command+" from: "+from);
                                    commands[i].fn(from, to, message);
                                }else{
                                    bot.say(to, from+": you must be an admin to execute that command");
                                }
                            } else {
logger.info("ececuting command: "+commands[i].command+" from: "+from);
                                commands[i].fn(from, to, message);
                            }
                        }
                        return;
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
logger.info("checking can add: "+from);
        canUserAdd(from, function(response) {
            if (response.can) {
                //var list = playerManagement.isPlaying ? 'sub-list' : 'list';
                var vote = message.split(' ')[1] ? message.split(' ')[1] : null;
logger.info("checking vote: "+from);
                if (vote != null){
                    vote=vote.toUpperCase();
                    if (!isValidVote(vote) && vote) {
                        bot.say(to, from + ": '" + vote + "' is an unknown server name. Use !servers to get the server name you want.");
                        return;
                    }
                }
                //var showLeft = playerManagement.isPlaying ? false : true;
                addPlayerToQueue(response.kagName, response.user.nick, response.user.host, vote);
                var voteString = "with no server vote";
                if(vote!=null) voteString="with vote "+vote;
                //if (showLeft) {
                    bot.say(to, response.kagName + " was added to the list [" + playersArray.length + "/" + playersNeeded + "] "+ voteString);
                /*} else {
                    bot.say(to, from + " was added to the " + list + " " + voteString);
                }*/
logger.info("checking if match should start: "+from);
                if (playersArray.length === playersNeeded) {
                    startMatch(from, to);
                } else if(vote){
                    if(!playerManagement.connectedArray[getServerIDFromName(vote)])
                        bot.say(to, from+": the bot is not currently connected your server choice, if a conection cannot be reestablished before the game starts your vote will not be counted");
                }
            } else {
logger.info("can't add: "+from);
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
            //players = players.map(function(x) {
                //return x.name;
            //});
            var blueTeam = playersArrayCopy.splice(0, teamSize);
            var redTeam = playersArrayCopy.splice(0, teamSize);
            callback(blueTeam, redTeam);
        //});
    }

    function getServerIDFromName(serverName){
        for(var i=0;i<serversArray.length;i++){
            if(serversArray[i].name==serverName)
                return i;
        }
    }

    function getMostVotedServer(from, to) {
        var votes = [];
        for(var j = 0; j<serversArray.length;j++){
            votes.push({
                name: serversArray[j].name,
                count: 0
            });
        }

        for (var i = 0; i < playersArray.length; i++) {
            if (playersArray[i].vote) {
                var aleadyInArray = false;
                for (var j = 0; j < votes.length; j++) {
                    if (votes[j].name === playersArray[i].vote) {
                        aleadyInArray = true;
                        votes[j].count += 1;
                    }
                }
            }
        }
        var mostVotedID = defaultServer;
        var mostVotedName = "";
        var mostVotesCount = 0;
        var foundMostVoted = false;

        while(!foundMostVoted){
            for (var k = 0; k < votes.length; k++) {
                if (votes[k].count >= mostVotesCount) {
                    mostVotedName = votes.name;
                    mostVotesCount = votes[k].count;
                    mostVotedID=k;                             //so can remove if server not connected
                }
            }

logger.info("server: "+mostVotedID+" connected: "+playerManagement.connectedArray[mostVotedID])
            if(playerManagement.connectedArray[mostVotedID]) {
                foundMostVoted=true;
            } else {
                bot.say(to, "no connection with server "+votes[mostVotedID].name+", choosing next most voted server");
                votes.splice(mostVotedID, 1);            //delete server from vote options
                mostVotesCount=0;
            }

            if(votes.length<=0) {
                mostVotedID=-1;
                foundMostVoted = true;
            }
        }

        return mostVotedID;
    }

    function canUserAdd(userNick, callback) {
        getKagNameByNick(userNick, function(kagName){
logger.info("got kag name from nick canuseradd");
            bot.whois(userNick, function(WHOIS) {
logger.info("can add kagname: "+kagName);
    	        if(kagName==undefined){
                    if(WHOIS.account){          //they are authed
                        callback({
                            can: false,
                            message: userNick + ": you must link your irc account to your kag account using !link KAGUsername",
                            user: WHOIS,
                            kagName : kagName
                        });
                    }else{
                	    callback({
                            can: false,
                            message: userNick + ": you must be linked or authed to play, type !help for help authing or you can link using !link KAGUsername",
                            user: WHOIS,
                            kagName : kagName
        	            });
                    }
    		    return;
            	}else{
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
                        } else if (playerIsInQueue(kagName)) {
                            callback({
                                can: false,
                                message: userNick + ": you're already in the queue, if you want to leave it use !rem",
                                user: WHOIS,
                                kagName: kagName
                            });
                            return;
                        } else if (playerManagement.isPlaying) {
                            callback({
                                can: false,
                                message: userNick + ": A match is alreay running, you must wait until it finishes to add",
                                user: WHOIS,
                                kagName: kagName
                            });
                            return;
                        } else {
                            callback({
                            	can: true,
                            	message: null,
                            	user: WHOIS,
                            	kagName: kagName
                            });
                            return;
			}
                    });
                }
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
        send(playerManagement.playingServer, "string[] blue=" + teamString + "getRules().set('blueTeam',blue);");
        //red
        teamString="{";
        for (var i=0; i < playerManagement.playingArray.redTeam.length-1; i++){
            teamString=teamString+"'"+playerManagement.playingArray.redTeam[i]+"'"
            teamString=teamString+", ";
        }
        teamString=teamString+"'"+playerManagement.playingArray.redTeam[playerManagement.playingArray.redTeam.length-1]+"'}; ";
        send(playerManagement.playingServer, "string[] red=" + teamString + "getRules().set('redTeam',red);");

        send(playerManagement.playingServer, "getRules().set_bool('teamsUpdated',true);");
    }

    function getSubs(from, to, message){
        if(playerManagement.subRequests && playerManagement.subRequests.length>0){
            var subs="";
            for(var i=0; i<playerManagement.subRequests.length;i++){
                subs=subs+playerManagement.subRequests[i].KAGName+", ";
            }
            bot.say(from, "sub positions available to replace: "+subs+"on server: "+serversArray[playerManagement.playingServer].name);
            return;
        }else{
            bot.say(from, "there are no sub positions available");
            return;
        }
    }

    function makeSub(from, to, message){
        if(!playerManagement.isPlaying){
            bot.say(to, from + ": There is no match running, use !add to add to the queue for the next match!");
            return;
        }
        getKagNameByNick(from, function(kagName) {
            if(kagName){
            //bot.whois(from, function(WHOIS) {
                //db.getPlayerByAuth(WHOIS.account, function(player) {
                    if(playerManagement.playerIsPlaying(kagName) && playerManagement.isPlayerBeingSubbed(kagName)==-1){
                        bot.say(to, from+": you are already playing in the match");
                        return;
                    }else {
                        var subTeam = playerManagement.makeSub(kagName);
                        if(subTeam!=-1){
                            if(serversArray[playerManagement.playingServer].password){
                                bot.say(from, "you can join the game using http://furai.pl/joingame/"+serversArray[playerManagement.playingServer].publicIp +"/"+serversArray[playerManagement.playingServer].port+"/"+serversArray[playerManagement.playingServer].password);
                            }else{
                                bot.say(from, "you can join the game using http://furai.pl/joingame/"+serversArray[playerManagement.playingServer].publicIp +"/"+serversArray[playerManagement.playingServer].port );
                            }
                            bot.say(channels, from + " has subbed into the match for "+subTeam+" team on the "+serversArray[playerManagement.playingServer].name+" server! Check your query for a link");
                            sendUpdatedTeams();
                        }else{
                            bot.say(to, from +": There is no sub position available");
                    	}
                    }
    	        //});
            //});
            }else{
                bot.say(to, from+": You must be linked/authed to join a game");
            }
        });
    }

    function getKagNameByNick(nick, callback){
logger.info("getting kag name by nick");
        db.getTempKagNameByNick(nick, function(kagName) {
logger.info("got temp kag name");
            if(kagName!=undefined){
                callback(kagName);
            }else{
                bot.whois(nick, function(WHOIS) {
logger.info("got WHOIS");
                    if(!WHOIS.account){
			callback(undefined);
                    }else{
logger.info("getting player by auth");
			db.getPlayerByAuth(WHOIS.account, function(player) {
logger.info("got auth account");
                            callback(player.name);
                    	});
		    }
                });
            }
        });
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

    function startMatch(from, to) {
        logger.info('Setting a new match up...');
        playerList = playersArray.slice();
        playerManagement.playingServer = getMostVotedServer(from, to);
        if(playerManagement.playingServer==-1){          //no servers available, end the match
            logger.info('no servers available');
            bot.say(to, "No servers Available - match cancelled, all players must re-add to the queue to try again");
            playersArray = [];
            return;
        }
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
            send(playerManagement.playingServer, "string[] blue=" + teamString + "getRules().set('blueTeam',blue);");
            //red
            var teamString="{";
            for (var i=0; i < redTeam.length-1; i++){
                teamString=teamString+"'"+redTeam[i]+"'"
                teamString=teamString+", ";
            }
            teamString=teamString+"'"+redTeam[redTeam.length-1]+"'}; ";
            send(playerManagement.playingServer, "string[] red=" + teamString + "getRules().set('redTeam',red);");
            
            send(playerManagement.playingServer, "getRules().set_bool('teamsSet',true);");


            /*)db.getPlayerListByAuth(playerList, function(result) {
                for (var i = 0; i < result.length; i++) {
                    send(playerManagement.playingServer, "/assignseclev " + result[i].name + " " + seclevID);
                }
                
            });*/
            for (var i = 0; i < playersArray.length; i++) {
                var passwordString = "";
                /*if(serversArray[playerManagement.playingServer].password)
                    passwordString=" With password: " + serversArray[playerManagement.playingServer].password;
                bot.say(playersArray[i].nick, "You are now playing gather on the " + serversArray[playerManagement.playingServer].name + " server."+passwordString);
*/
            if(serversArray[playerManagement.playingServer].password){
                bot.say(playersArray[i].nick, "you can join the game using http://furai.pl/joingame/"+serversArray[playerManagement.playingServer].publicIp +"/"+serversArray[playerManagement.playingServer].port+"/"+serversArray[playerManagement.playingServer].password);
            }else{
                bot.say(playersArray[i].nick, "you can join the game using http://furai.pl/joingame/"+serversArray[playerManagement.playingServer].publicIp +"/"+serversArray[playerManagement.playingServer].port );
            }
            }

            playerManagement.playingArray = {
                blueTeam: blueTeam,
                redTeam: redTeam
            };

logger.info('playingarray: '+playerManagement.playingArray+'playingarray.blueTeam: '+playerManagement.playingArray.blueTeam+'playingarraylength: '+playerManagement.playingArray.length+'playingarray.blueteam.length: '+playerManagement.playingArray.blueTeam.length);

            var playerNicks = [];

            for(var i=0;i<playersArray.length;i++){
                playerNicks[i]=playersArray[i].nick;
            }
            bot.say(to, playerNicks);
            //logger.info('blue: '+blueTeamNicks+' red: '+redTeamNicks);

            playersArray = [];
            playerManagement.isPlaying = true;

            logger.info('Match set.');
            if(serversArray[playerManagement.playingServer].password){
                bot.say(to, "Match started on server " + serversArray[playerManagement.playingServer].name + ": " + blueTeam + "(Blue Team) VS " + redTeam + " (Red Team)" /*+ " join with http://furai.pl/joingame/"+serversArray[playerManagement.playingServer].publicIp +"/"+serversArray[playerManagement.playingServer].port+"/"+serversArray[playerManagement.playingServer].password*/);
            }else{
                bot.say(to, "Match started on server " + serversArray[playerManagement.playingServer].name + ": " + blueTeam + "(Blue Team) VS " + redTeam + " (Red Team)" /*+ " join with http://furai.pl/joingame/"+serversArray[playerManagement.playingServer].publicIp +"/"+serversArray[playerManagement.playingServer].port*/ );
            }
        });
    }

    function removeSelfFromQueue(from, to){
        getKagNameByNick(from,function(kagName) {
            if(kagName)
                removePlayerFromQueue(from, to, kagName);
            else
                bot.say(to, from+": you are not in the queue");
        });
    }

    function removePlayerFromQueue(from, to, kagName) {
            //if (playerManagement.isPlaying) {          //if the player isnt the the queue, want to do the same thing wether there is a game running or not
        logger.info('irc name?: '+from+' kag name?: '+kagName);
        if (playerManagement.playerIsPlaying(kagName)) {
            logger.info('player is in the game');
            playerManagement.addSubRequest(kagName);
            bot.say(to, kagName + " left the match");
            bot.say(to, "A sub is needed for the game running on server: "+serversArray[playerManagement.playingServer].name + " you may sub into the match using !sub");
        } else if(playerIsInQueue(kagName)){
            for (var i = 0; i < playersArray.length; i++) { 
                if (playersArray[i].kagName === kagName) {
                    playersArray.splice(i, 1);
                    bot.say(to, kagName + " was removed from the list"+" [" + playersArray.length + "/" + playersNeeded + "] "+"remaining");
                    logger.info('Removed "' + kagName + '" from queue.');
                    return;
                }
            }
        }else{
            bot.say(to, kagName + " is not in the list");
        }
        //}
        /*bot.whois(from, function(WHOIS) {
            var account = WHOIS.account;
            var removed = false;
            logger.info('irc name?: '+from+' auth account?: '+account);
            if (playerManagement.isPlaying) {
                db.getPlayerByAuth(WHOIS.account, function(player) {
                    logger.info('game is running: checking if player: '+player.name+' is playing');
                    if (playerisPlaying(player.name)) {
                        logger.info('player is in the game');
                            playerManagement.addSubRequest(player.name);
                            removed = true;
                            bot.say(to, from + " left the match");
                            bot.say(to, "A sub is needed for the game running on server: "+serversArray[playerManagement.playingServer].name + " you may sub into the match using !sub");
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
        if (playerManagement.isPlaying) {
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
                    if (playersArray[i].kagName === kagName) {
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
        if (playerManagement.isPlaying) {
            var serverLink= "http://furai.pl/joingame/"+serversArray[playerManagement.playingServer].publicIp +"/"+serversArray[playerManagement.playingServer].port;
            if(serversArray[playerManagement.playingServer].password) serverLink=serverLink+"/"+serversArray[playerManagement.playingServer].password;

            var subRequired = "";
            if(playerManagement.subRequired && playerManagement.subRequired.length>=0) subRequired=" there is a sub required";

            bot.say(from, "Game is aready running on the "+serversArray[playerManagement.playingServer].name+" server, with players "+playerManagement.playingArray.blueTeam +" vs "+playerManagement.playingArray.redTeam+" "+serverLink+subRequired);
            /*var list = [];
            for (var i = 0; i < playerManagement.subsArray.length; i++) {
                list.push(playerManagement.subsArray[i].nick);
            }
            bot.say(from, "Sub-list(" + list.length + "): " + list);*/
        } else {
            var list = []; // jshint ignore:line
            for (var i = 0; i < playersArray.length; i++) { // jshint ignore:line
                list.push(playersArray[i].nick);
                //list.push("("+playersArray[i].kagName+") ");
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
        if (playerManagement.isPlaying) {
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
        bot.say(from, "In order to play you must be authed and/or linked. Follow this guide to set up an auth account: https://www.quakenet.org/help/q/how-to-register-an-account-with-q .  You can link using !link <kagUsername> (this will create a temporary link if you are not authed).  More help and information on how to play gather can be found at: "+ guideLink);
        bot.say(from, "forgotten your auth password? https://www.quakenet.org/help/general/ive-lost-my-password");
    }

    function showPlayerStats(from, to, message) {
        var msg = message.split(" ");
        var player = msg[1];
        db.getPlayerStats(player, function(stats) {
            if (stats === "player-no-exists") {
                bot.say(to, from + ": this player doesn't exist, make sure you use the player's irc account name, stats for players without an auth are not recorded");
            } else {
                stats = stats.split(",");
                bot.say(to, from + ": '" + player + "' has " + stats[0] + " wins and " + stats[1] + " losses.");
            }
        });
    }

    function sendMessageToServer(from, to, message) {
        var msg = message.split(" ");
        msg.shift();
        var server=-1;
        for(var i=0; i<serversArray.length;i++){
            if(serversArray[i].name==msg[0].toUpperCase())
                server = i;
        }
        msg.shift();
        msg = msg.join(" ");
        var rightID = send(server, "/msg <" + from + ">" + msg);
        if (!rightID) {
            bot.say(to, from + ": wrong server ID.");
        }
    }

    function forceRemove(from, to, message) {
        var msg = message.split(" ");
logger.info("message: "+message);
logger.info("msg: "+msg);
        if (msg[1]) {
            removePlayerFromQueue(from, to, msg[1]);      //the players nick
            /*var authname = msg[1];
            if (playerManagement.isPlaying) {
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
            connection.release();
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
            connection.release();
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
            connection.release();
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
            connection.release();
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
        //playerManagement.subsArray = [];
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
            connection.release();
        });
    }

    function forceMatchEnd(from, to) {
        /*db.getPlayerListByAuth(playerManagement.playingArray.blueTeam, function(result) {
            for (var i = 0; i < result.length; i++) {
                send(playerManagement.playingServer, "/kick " + result[i]);
            }*/
            //playerManagement.playingArray.blueTeam = [];
        //});
        /*db.getPlayerListByAuth(playerManagement.playingArray.redTeam, function(result) {
            for (var i = 0; i < result.length; i++) {
                send(playerManagement.playingServer, "/kick " + result[i]);
            }*/
            //playerManagement.playingArray.blueTeam = [];
            //playerManagement.subsArray = [];
        //});
        if(!playerManagement.isPlaying){
            bot.say(to, from+": Cannot end when no game running");
            return;
        }
        playerManagement.endMatch();
        bot.say(to, "Forced end on server " + playerManagement.playingServer + ", by " + from + ".");
        logger.info('Forced match end on ' + playerManagement.playingServer + ' by ' + from);
    }

    function addEndVote(from, to) {
        if(!playerManagement.isPlaying) {
            bot.say(to,from+ ": Cannot vote for end when no game running");
            return;
        }
        getKagNameByNick(from, function(kagName) {
            for(var i=0;i<endVotes.length;i++){
                if(endVotes[i]==kagName) {
                    bot.say(to, from+": you have already voted to force end the match");
                    return;
                }
            }
            endVotes.push(kagName);
            if(endVotes.length>=endVotesRequired){
                playerManagement.endMatch();
                bot.say(to, "Forced end on server " + playerManagement.playingServer);
                logger.info('Forced match end on ' + playerManagement.playingServer);
            }else{
                bot.say(to, "vote to force end the match counted for "+from+" ["+endVotes.length+"/"+endVotesRequired+"]");
            }
        });
    }

    function addSubVote(from, to, message) {
        if(!playerManagement.isPlaying){
            bot.say(to, from + ": Cannot vote for sub when no game running");
            return;
        }
        var msg = message.split(" ");
        var playerToSub = msg[1];
        if(!playerToSub){
            bot.say(to, "invalid use of command, try !rsub <kagUsernameOfPlayerToSub>");
            return;
        }
        getKagNameByNick(from, function(kagName) {
            if(!kagName){
                bot.say(to, from+"you must be linked/authed to request a sub");
                return;
            }
            var returnString = playerManagement.addSubVote(playerToSub, kagName);
            var returns = returnString.split(" ");
            if(returns[1]=="sub" && returns[2]=="position" && returns[3]=="is" ){		//some returns should have nick attached to the start
                bot.say(to, returnString);
            } else {
                bot.say(to, from+returnString);
            }
        });
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
            db.getPlayerByAuth(msg[1], function(result) {
                if (result === "player-no-exists") {
                    bot.say(from, "The account '" + msg[1] + "' isn't registered, or doesn't exist.");
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
        if(!playerManagement.isPlaying) {
            bot.say(to, from + ": Cannot give win when no game running");
            return;
        }
        var msg=message.split(" ");
        var teamNum;
logger.info("msg[1]= "+msg[1]);
        if (msg[1] == "blue") teamNum=0;
        else if (msg[1] == "red") teamNum=1;
        else{
            bot.say(to, "Invalid input for !givewin <teamname>");
            return;
        }

    	getKagNameByNick(from, function(kagName) {
                if(!kagName) {
                    bot.say(to, from+": you must be linked to do that");
    		return;
                }
                bot.whois(from, function(WHOIS) {
                    if(isAdmin(WHOIS.account)){
                        var msg = message.split(" ");
                        if (msg[1]) {
                            //if (msg[2]) {
                                if (msg[1] === "blue") {
                                    db.addResultsToDB(0);
                                    playerManagement.endMatch();
                                    //matchEnded(["Blue"], msg[2], to);
                                    bot.say(to,"match ended with win given to blue team by "+from);
                                    logger.info("match ended with win given to blue team by "+from);
                                    return;
                                }
                                if (msg[1] === "red") {
                                    db.addResultsToDB(1);
                                    playerManagement.endMatch();
                                    //matchEnded(["Red"], msg[2], to);
                                    bot.say(to,"match ended with win given to red team by "+from);
                                    logger.info("match ended with win given to red team by "+from);
                                    return;
                                }
                            //}
                        }
                    }else{
                        //check if voted for any team yet
                        if(teamNum==0){
                            for(var i=0;i<giveWinBlueVotes.length;i++){
                                if(giveWinBlueVotes[i]==kagName) {
                                    giveWinBlueVotes.splice(i,1);
                                    bot.say(to,from +": your previous vote was removed");
                                }
                            }
                        }else if(teamNum==1){
                            for(var i=0;i<giveWinRedVotes.length;i++){
                                if(giveWinRedVotes[i]==kagName) {
                                    giveWinBlueVotes.splice(i,1);
                                    bot.say(to, from +": your previous vote was removed");
                                }
                            }
                        }
                        if(teamNum==0){
                            giveWinBlueVotes.push(kagName);
                            bot.say(to, "vote to give win counted for blue ["+giveWinBlueVotes.length+"/"+giveWinVotesRequired+"]");
                            if(giveWinBlueVotes.length>=giveWinVotesRequired){
                                db.addResultsToDB(0);
                                playerManagement.endMatch();
                                bot.say(to,"match ended with win given to blue team");
                                logger.info("match ended with win given to blue team");
                            }
                        }else if(teamNum==1){
                            giveWinRedVotes.push(kagName);
                            bot.say(to, "vote to give win counted for red ["+giveWinRedVotes.length+"/"+giveWinVotesRequired+"]");
                            if(giveWinRedVotes.length>=giveWinVotesRequired){
                                db.addResultsToDB(1);
                                playerManagement.endMatch();
                                bot.say(to,"match ended with win given to red team");
                                logger.info("match ended with win given to red team");
                            }
                        }
                    }
                });
    	});
    }

    function restartBot(from, to){
        thisIsAMadeUpVarToCauseACrash.Crash();
    }

    function showServerList(from, to) {
        var serverNames = [];
        for (var i = 0; i < config.serverList.length; i++) {
            serverNames.push(config.serverList[i].name);
        }
        bot.say(from, "Server names: " + serverNames);
        showConnectedServers(from, to);
    }

    function showConnectedServers(from, to){
        if(!playerManagement.connectedArray) return;
        bot.say(from, "Server connection status is: "+playerManagement.connectedArray);
    }

    function isValidVote(serverName) {
        for (var i = 0; i < config.serverList.length; i++) {
            if (config.serverList[i].name === serverName) {
                return true;
            }
        }
        return false;
    }

    function commandList(from,to){
        var commandString="";
        for(var i=0;i<commands.length;i++){
            commandString = commandString + commands[i].command + " ";
        }
        bot.say(from, "use !whatis <command> for command usage, commands are: "+commandString);
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
		bot.say(to, from + ": usage is !link KAGUsername, make sure to use the right username, its case sensitive");
		return;
	}
        bot.whois(from, function(WHOIS) {
            if (WHOIS.account) {
                links.requestIRCLink(WHOIS.account, username, function(result) {
                    bot.say(to, from + ": " + result.message);
                });
            } else {
                db.addTempLinkData(WHOIS.nick, username, function(returnVal) {
                    if(!returnVal) bot.say(to, from + ": could not create temporary link, the KAG account is already in use, try authing if you already linked before?");
                    else bot.say(to, from + ": You are not authed, so a temporary link was made for you, stats will not be tracked for you !help for more info.  You may now add using !add");
                }); 
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
