/*jshint unused:true*/
var irc = require("irc");
var mysql = require("mysql");
var fs = require("fs");
var winston = require("winston");

var WinstonLevels = {
    levels: {
        message: 1,
        info: 2,
        ircError: 3,
        error: 4
    },
    colors: {
        message: 'blue',
        info: 'green',
        ircError: 'yellow',
        error: 'red'
    }
};
var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)({
            colorize: true,
            level: 'info',
            timestamp:true
        }),
        new(winston.transports.DailyRotateFile)({
            name: 'plain',
            level: 'message',
            filename: './logs/plain/[messages].txt',
            datePattern: 'dd-MM-yyyy',
            json: false,
        }),
        new(winston.transports.DailyRotateFile)({
            name: 'json',
            level: 'message',
            filename: './logs/json/[messages].txt',
            datePattern: 'dd-MM-yyyy',
            json: true,
        }),
        new(winston.transports.File)({
            name: 'error-file',
            level: 'error',
            filename: './logs/[error].txt',
            datePattern: 'dd-MM-yyyy',
            json: true,
        }),

    ],
    levels: WinstonLevels.levels,
    colors: WinstonLevels.colors
});
var Socket = require('net').Socket;

//Load Configs
var config = JSON.parse(fs.readFileSync("config.json", {
    encoding: "utf8"
}));
//IRC Config
var channels = config.bot.channels;
var bot = new irc.Client('irc.quakenet.org', config.bot.userName, config.bot);
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
config.pool = pool;
var playerManagement = require('./lib/playerManagement.js');
var db = require("./lib/db.js")({
    pool: pool,
    usersTable: config.mysql.usersTable,
    matchTable: config.mysql.matchTable
}, logger, playerManagement);

var links = require('./lib/links.js')(config);

var serverCommands = require('./lib/serverCommands.js')(db, bot, config, links, playerManagement, send, logger, serversArray, channels);
var botControl = require('./lib/bot.js')(db, bot, config, links, playerManagement, send, logger, channels);

//IRC Handling
bot.addListener("message#", botControl.parseMessage);
bot.addListener("registered", function() {
    if (logIn) {
        bot.send("AUTH", botAccount, botPassword);
    }
});
bot.addListener("part", botControl.onPart);
bot.addListener("quit", botControl.onPart);
bot.addListener("kick", botControl.onPart);
bot.addListener("kill", botControl.onPart);
bot.addListener("nick", botControl.onNick);
//Servers
var socketArray = [];
var serversArray = config.serverList;
var socketRcon = [];
//var connectedArray = [];
serversArray.forEach(function(srvconfig, serverID) {
    var sock = new Socket();
    sock.setEncoding("utf8");
    sock.setNoDelay();
    sock.setTimeout(1000);

    socketArray.push(sock);
    socketRcon.push(srvconfig.rcon);

    playerManagement.connectedArray.push(false);

    sock.on("connect", function() {
        this.write(socketRcon[serverID] + "\n", "utf8");
        logger.info("Connected to the KAG Gather Server ID: "+serverID);
        bot.say(channels, "Connection established to gather server "+serverID+"("+serversArray[serverID].name+")");
	playerManagement.connectedArray[serverID]=true;
    });
    sock.on("data", function(data) {
        serverCommands.parseData(data, serverID);
    });
    sock.on("error", function(err) {
        logger.error("Gather " +serverID+ " Socket " + err);
        /*logger.info('Couldnt connect to KAG Gather server: '+serverID+', trying again in 5 minutes');

        sock.setTimeout(300000, function() {            //300000ms=5mins
            sock.connect(srvconfig.port, srvconfig.ip);
        });*/
    });
    sock.on("close", function() {
        logger.error("Socket is now closed on Gather server: "+serverID);
        playerManagement.connectedArray[serverID]=false;
        bot.say(channels, "Connection with gather server "+serverID+" ("+serversArray[serverID].name+") lost");

        logger.info("Attempting to reconnect to Gather server: "+serverID+"  in 5 minutes");
        sock.setTimeout(300000, function() {            //300000ms=5mins
            sock.connect(srvconfig.port, srvconfig.ip);
        });
    });
    sock.connect(srvconfig.port, srvconfig.ip);
});

function send(serverID, text) {
logger.info("connected: "+playerManagement.connectedArray[serverID]);
    if (socketArray[serverID]) {
        /*if(!connectedArray[serverID]) {
            bot.say(channels, "attempting to reconnect bot to server "+serverID);
            socketArray[serverID].connect(serversArray[serverID].port, serversArray[serverID].ip);
        }*/
        socketArray[serverID].write(text + "\n");
        return true;
    }
    return false;
}


// pubServers
var pubSocketArray = [];
var pubServersArray = config.pubServerList;
var pubSocketRcon = [];
var pubConnectedArray = [];
if(pubServersArray){
    pubServersArray.forEach(function(srvconfig, serverID) {
        var sock = new Socket();
        sock.setEncoding("utf8");
        sock.setNoDelay();
        sock.setTimeout(1000);

        pubSocketArray.push(sock);
        pubSocketRcon.push(srvconfig.rcon);

        sock.on("connect", function() {
            this.write(pubSocketRcon[serverID] + "\n", "utf8");

            logger.info("Connected to KAG Public Server: "+serverID);
            pubConnectedArray[serverID]=true;
        });
        sock.on("data", function(data) {
            pubServer.parseData(data, serverID);
        });
        sock.on("error", function(err) {
            logger.error("Public "+serverID+" Socket " + err);
            /*logger.info('Couldnt connect to KAG Public server: '+serverID+', trying again in 5 minutes');

            sock.setTimeout(300000, function() {            //300000ms=5mins
                sock.connect(srvconfig.port, srvconfig.ip);
            });*/
        });
        sock.on("close", function() {
            logger.error("Socket is now closed on Public server: "+serverID);
            pubConnectedArray[serverID]=false;

            logger.info("Attempting to reconnect to Public server "+serverID+" in 5 minutes");
            sock.setTimeout(300000, function() {            //300000ms=5mins
                sock.connect(srvconfig.port, srvconfig.ip);
            });

        });
        sock.connect(srvconfig.port, srvconfig.ip);
    });
}

function sendPub(serverID, text) {
logger.info("connected: "+pubConnectedArray[serverID]);
if(!pubSocketArray) return false;
    if (pubSocketArray[serverID]) {
        /*if(!pubConnectedArray[serverID]) {
            bot.say(channels, "attempting to reconnect bot to pub server "+serverID);
            pubSocketArray[serverID].connect(pubServersArray[serverID].port, pubServersArray[serverID].ip);
        }*/
        pubSocketArray[serverID].write(text + "\n");
        return true;
    }
    return false;
}


//Error handling - logs/saves and exit process(1)
bot.addListener("error", function(err) {
    logger.ircError(err);
});
process.on("uncaughtException", function(err) {
    logger.error(JSON.stringify(err.stack));

    setTimeout(function() {
        process.exit(1);
    }, 50); // so it exits after it has been logged
});

logger.info('Starting the bot.');
