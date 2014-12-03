module.exports = function(config, logger) {
    var pool = config.pool;
    var usersTable = config.usersTable;
    var matchTable = config.matchTable;
    return {
        //temp links
        tempLinkData: [],
        addTempLinkData: function(nick, kagUsername, callback){
            getPlayerByAccount(kagUsername, function(player){
                if(player=="player-no-exists"){
                    callback(false);
                    return;
                }
                for (var i = 0; i < this.tempLinkData.length; i++) {
                    if (this.tempLinkData[i].nick == nick) {
                        //overwrite old data
                        this.tempLinkData[i].kagUsername=kagUsername;
                        callback(true);
                        return;
                    }
                }
                //werent already in the array
                this.tempLinkData.push({
                    nick: nick,
                    kagUsername: kagUsername
                });
                callback(true);
                return;
                /*var index = this.tempLinkData.length;
                (function(tempLinkData) {
                    setTimeout(function() {
                        tempLinkData.splice(--index, 1);
                    }, 7200000);    //7200000=2 hours
                })(this.tempLinkData);*/        //just wait to remove them when they leave irc
            });
        },
        updateTempLinkNick: function(oldNick, newNick){
            for (var i = 0; i < this.tempLinkData.length; i++) {
                if (this.tempLinkData[i].nick == oldNick) {
                    //overwrite old data
                    this.tempLinkData[i].nick=newNick;
                    return;
                }
            }
        },
        removeTempLinkData: function(nick){
            for (var i = 0; i < this.tempLinkData.length; i++) {
                if (this.tempLinkData[i].nick == nick) {
                    //remove from array
                    tempLinkData.splice(i, 1);
                    return;
                }
            }
        },

        getTempKagNameByNick: function(nick,callback){
            for (var i = 0; i < this.tempLinkData.length; i++) {
                if (this.tempLinkData[i].nick == nick) {
                    callback(this.tempLinkData[i].kagUsername);
		    return;
                }
            }
            callback(undefined);
            return;
        },

        getTempNickByKagName: function(kagName,callback){
            for (var i = 0; i < this.tempLinkData.length; i++) {
                if (this.tempLinkData[i].kagUsername == kagName) {
                    callback(this.tempLinkData[i].nick);
                }
            }
            callback(undefined);
            return;
        },

        isPlayerBanned: function(authname, cb) {
            //done
            pool.getConnection(function(err, connection) {
                connection.query("SELECT banExpires FROM " + usersTable + " WHERE authname=? LIMIT 1;", [authname], function(err, player) {
                    if (typeof player[0] === "undefined") {
                        cb("player-no-exists");
                        return;
                    }
                    var actualDate = new Date();
                    var banDate = new Date(player[0].banExpires);
                    if (actualDate.getTime() > banDate.getTime()) {
                        player[0].banExpires = "null";
                        connection.query("UPDATE " + usersTable + " SET banExpires='null' WHERE authname=?", [authname], function(err) {
                            if (err) throw err;
                        });
                    }
                    if (player[0].banExpires == "null") {
                        cb(false);
                    } else {
                        cb(true, player[0].banExpires);
                    }
                    connection.release();
                });
            });
        },
        isKagAccountBanned: function(kagName, cb) {
            //done
            pool.getConnection(function(err, connection) {
                connection.query("SELECT banExpires FROM " + usersTable + " WHERE name=? LIMIT 1;", [kagName], function(err, player) {
logger.info("isKagAccountBanned player: "+player+" player[0]: "+player[0]);
                    if (typeof player[0] === "undefined") {
                        cb(false);
                        return;
                    }
                    var actualDate = new Date();
                    var banDate = new Date(player[0].banExpires);
                    if (actualDate.getTime() > banDate.getTime()) {
                        player[0].banExpires = "null";
                        connection.query("UPDATE " + usersTable + " SET banExpires='null' WHERE name=?", [kagName], function(err) {
                            if (err) throw err;
                        });
                    }
                    if (player[0].banExpires == "null") {
                        cb(false);
                    } else {
                        cb(true, player[0].banExpires);
                    }
                    connection.release();
                });
            });
        },
        getPlayerStats: function(account, cb) {
            //done
            pool.getConnection(function(err, connection) {
                connection.query("SELECT stats FROM " + usersTable + " WHERE authname=? LIMIT 1;", [account], function(err, player) {
                    if (typeof player[0] === "undefined") {
                        cb("player-no-exists");
                        return;
                    }
                    connection.release();
                    cb(player[0].stats);
                });
            });
        },

        getPlayerByAuth: function(account, callback) {
            //done
            pool.getConnection(function(err, connection) {
                connection.query("SELECT name FROM " + usersTable + " WHERE authname=? LIMIT 1;", [account], function(err, result) {
                    if (err) throw err;
                    if (result[0]) {
                        callback(result[0]);
                    } else {
                        callback("player-no-exists");
                    }
                    connection.release();
                });
            });
        },

        getPlayerByAccount: function(name, callback) {
            //done
            pool.getConnection(function(err, connection) {
                connection.query("SELECT authname FROM " + usersTable + " WHERE name=? LIMIT 1;", [name], function(err, result) {
                    if (err) throw err;
                    if (result[0]) {
                        callback(result[0]);
                    } else {
                        callback("player-no-exists");
                    }
                    connection.release();
                });
            });
        },
        getPlayerListByAuth: function(accounts, callback) {
            //done
            if (accounts.length === 0) {
                throw new Error('ACCOUNTS_EMPTY | ' + accounts);
            }
            pool.getConnection(function(err, connection) {
                var sqlQuery = "";
                for (var i = 0; i < accounts.length; i++) {
                    if (i === 0) {
                        sqlQuery = "SELECT name FROM " + usersTable + " WHERE authname='" + accounts[i] + "' ";
                    } else {
                        if (i === accounts.length - 1) {
                            sqlQuery += "UNION SELECT name FROM " + usersTable + " WHERE authname='" + accounts[i] + "';";
                        } else {
                            if (i !== 0 && i !== accounts.length - 1) {
                                sqlQuery += "UNION SELECT name FROM " + usersTable + " WHERE authname='" + accounts[i] + "' ";
                            }
                        }
                    }
                }
                connection.query(sqlQuery, function(err, result) {
                    if (err) throw err;
                    connection.release();
                    callback(result);
                });
            });
        },

        addVictoryTo: function(kagAccount) {
            //done
            pool.getConnection(function(err, connection) {
                if (err) throw err;
                connection.query("SELECT stats FROM " + usersTable + " WHERE name=? LIMIT 1;", [kagAccount], function(err, result) {
                    if (err) throw err;
                    logger.info("stats result is: "+result);
                    var stats = result[0].stats;
                    stats = stats.split(",");
                    stats[0] = (parseInt(stats[0]) + 1).toString();
                    stats = stats.join(",");
                    connection.query("UPDATE " + usersTable + " SET stats=? WHERE name=?;", [stats, kagAccount], function(err) {
                        if (err) throw err;
                        logger.info('Added victory to "' + kagAccount + '"');
                        connection.release();
                        //cb();
                    });
                });

            });
        },

        addLoseTo: function(kagAccount) {
            //done
            pool.getConnection(function(err, connection) {
                if (err) throw err;
                connection.query("SELECT stats FROM " + usersTable + " WHERE name=? LIMIT 1;", [kagAccount], function(err, result) {
                    if (err) throw err;
                    var stats = result[0].stats;
                    stats = stats.split(",");
                    stats[1] = (parseInt(stats[1]) + 1).toString();
                    stats = stats.join(",");
                    connection.query("UPDATE " + usersTable + " SET stats=? WHERE name=?;", [stats, kagAccount], function(err, result) {
                        if (err) throw err;
                        logger.info('Added lose to "' + kagAccount + '"');
                        connection.release();
                        //cb();
                    });
                });

            });
        },
        addMatchToDB: function(blueTeam, redTeam, whoWon) {
            //done
            pool.getConnection(function(err, connection) {
                if (err) throw err;
                connection.query("INSERT INTO " + matchTable + " (blueTeam,redTeam,winner) VALUES(?,?,?);", [blueTeam.join(","), redTeam.join(","), whoWon], function(err, result) {
                    if (err) throw err;
                    logger.info('Added a new match to the DB');
                    //cb(result);
                    connection.release();
                });
            });
        }
    };
};
