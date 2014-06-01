module.exports = function(config) {
    var pool = config.pool;
    var usersTable = config.usersTable;
    var matchTable = config.matchTable;
    return {
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
                };
                connection.query(sqlQuery, function(err, result) {
                    if (err) throw err;
                    connection.release();
                    callback(result);
                });
            });
        },

        addVictoryTo: function(account, cb) {
            //done
            pool.getConnection(function(err, connection) {
                if (err) throw err;
                connection.query("SELECT stats FROM " + usersTable + " WHERE authname=? LIMIT 1;", [account], function(err, result) {
                    var stats = result[0].stats;
                    stats = stats.split(",");
                    stats[0] = (parseInt(stats[0]) + 1).toString();
                    stats = stats.join(",");
                    connection.query("UPDATE " + usersTable + " SET stats=? WHERE authname=?;", [stats, account], function(err) {
                        if (err) throw err;
                        connection.release();
                        cb();
                    });
                });

            });
        },

        addLoseTo: function(account, cb) {
            //done
            pool.getConnection(function(err, connection) {
                if (err) throw err;
                connection.query("SELECT stats FROM " + usersTable + " WHERE authname=? LIMIT 1;", [account], function(err, result) {
                    var stats = result[0].stats;
                    stats = stats.split(",");
                    stats[1] = (parseInt(stats[1]) + 1).toString();
                    stats = stats.join(",");
                    connection.query("UPDATE " + usersTable + " SET stats=? WHERE authname=?;", [stats, account], function(err, result) {
                        if (err) throw err;
                        connection.release();
                        cb();
                    });
                });

            });
        },
        addMatchToDB: function(blueTeam, redTeam, whoWon, cb) {
            //done
            pool.getConnection(function(err, connection) {
                if (err) throw err;
                connection.query("INSERT INTO " + matchTable + " (blueTeam,redTeam,winner) VALUES(?,?,?);", [blueTeam.join(","), redTeam.join(","), whoWon], function(err, result) {
                    if (err) throw err;
                    cb(result);
                    connection.release();
                });
            });
        }
    }
}