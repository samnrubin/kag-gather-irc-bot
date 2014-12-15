//var playerManagement = require('./playerManagement.js');
module.exports = function(db, bot, config, links, playerManagement, send, logger, serversArray, channels) {
    var serverCommands = [{
        command: "!add",
        fn: addPub
    }, {
        command: "!rem",
        fn: remPub
    }, {
        command: "leftgame??????????????",
        fn: pubLeftGame
    }, {
        command: "!list",
        fn: showListOnServer
    }, {
        command: "!checksubs",
        fn: showSubsOnServer
    }, {
        command: "!sub",
        fn: subPubIn
    }, {
        command: "!help",
        fn: showPubHelp
    }, {
        command: "!say",
        fn: SayFromPub
    }, {
        command: "!servers",
        fn: showServersOnPub
    }];
    //var playingArray = [];    //defined in diff file

    function parseData(data, serverI) {
logger.info('received server data: '+data);
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

    function addPub(data, serverI) {

    }

    function remPub(data, serverI) {
        
    }

    function pubLeftGame(data, serverI) {
        
    }

    function showListOnServer(data, serverI) {
        
    }

    function showSubsOnServer(data, serverI) {
        
    }

    function subPubIn(data, serverI) {
        
    }

    function showPubHelp(data, serverI) {
        
    }

    function sayFromPub(data, serverI) {
        
    }

    function showServersOnPub(data, serverI) {
        
    }

    return {
        parseData: parseData
    };
};
