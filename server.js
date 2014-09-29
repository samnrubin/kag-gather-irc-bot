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
            level: 'info'
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
config.pool = pool;
var db = require("./lib/db.js")({
    pool: pool,
    usersTable: config.mysql.usersTable,
    matchTable: config.mysql.matchTable
}, logger);

var links = require('./lib/links.js')(config);

var botControl = require('./lib/bot.js')(db, bot, config, links, send, logger);
var serverCommands = require('./lib/serverCommands.js')(db, bot, config, links, send, logger, serversArray, channels);

//IRC Handling
bot.addListener("message#", botControl.parseMessage);
bot.addListener("registered", function() {
    if (logIn) {
        bot.send("AUTH", botAccount, botPassword);
    }
});
bot.addListener("part", botControl.onPart);
bot.addListener("nick", botControl.onNick);
//Servers
var socketArray = [];
var serversArray = config.serverList;
var socketRcon = [];
serversArray.forEach(function(srvconfig, serverID) {
    var sock = new Socket();
    sock.setEncoding("utf8");
    sock.setNoDelay();
    sock.setTimeout(1000);

    socketArray.push(sock);
    socketRcon.push(srvconfig.rcon);

    sock.on("connect", function() {
        this.write(srvconfig.rcon + "\n", "utf8");
        logger.info("Connected to the KAG Server...");
    });
    sock.on("data", function(data) {
        serverCommands.parseData(data, serverID);
    });
    sock.on("error", function(err) {
        logger.error("Socket " + err);
    });
    sock.on("close", function() {
        logger.error("Socket is now closed.");
    });
    sock.connect(srvconfig.port, srvconfig.ip);
});

function send(serverID, text) {
    if (socketArray[serverID]) {
        socketArray[serverID].write(text + "\n");
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