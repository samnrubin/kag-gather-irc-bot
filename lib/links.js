module.exports = function(config) {
    var pool = config.pool;
    var usersTable = config.mysql.usersTable;
    return {
        IRCRequests: [],
        KAGRequests: [],
        addIRCRequest: function(authname, username) {
            for (var i = 0; i < this.IRCRequests.length; i++) {
                if (this.IRCRequests[i].account === authname) {
                    //return 'already-requested';
                    //overwrite old request
                    this.IRCRequests[i].account=authname;
                    this.IRCRequests[i].username=username;
                }
            }
            this.IRCRequests.push({
                account: authname,
                username: username
            });
            var index = this.IRCRequests.length;
            (function(IRCRequests) {
                setTimeout(function() {
                    IRCRequests.splice(--index, 1);
                }, 300000);
            })(this.IRCRequests);
        },
        addKAGRequest: function(authname, username) {
            for (var i = 0; i < this.KAGRequests.length; i++) {
                if (this.KAGRequests[i].account === authname) {
                    //return 'already-requested';
                    this.KAGRequests[i].account=authname;
                    this.KAGRequests[i].username=username;
                }
            }
            this.KAGRequests.push({
                account: authname,
                username: username
            });
            var index = this.KAGRequests.length;
            (function(KAGRequests) {
                setTimeout(function() {
                    KAGRequests.splice(--index, 1);
                }, 300000);
            })(this.KAGRequests);
        },
        validateIRCRequest: function(authname, username) {
            this.addIRCRequest(authname, username);
            for (var i = 0; i < this.KAGRequests.length; i++) {
                if (this.KAGRequests[i].account === authname && this.KAGRequests[i].username === username) {
                    this.KAGRequests.splice(--i, 1);
                    return true;
                }
            }
            return false;
        },
        validateKAGRequest: function(authname, username) {
            this.addKAGRequest(authname, username);
            for (var i = 0; i < this.IRCRequests.length; i++) {
                if (this.IRCRequests[i].account === authname && this.IRCRequests[i].username === username) {
                    this.IRCRequests.splice(--i, 1);
                    return true;
                }
            }
            return false;
        },
        requestLink: function(authname, username, callback) {
            //var validator = this.validateKAGRequest(authname, username);
            //if (validator) {
                pool.getConnection(function(err, connection) {
                    if (err) throw err;
                    connection.query("SELECT COUNT(id) FROM " + usersTable + " WHERE name=?;", [username], function(err, result) {
                        if(err) throw err;
                        if (result[0]["COUNT(id)"] === 0) {
                            connection.query("INSERT INTO " + usersTable + " (name,stats,banExpires,authname) VALUES (?,?,?,?);", [username, "0,0", "null", authname], function(err) {
                                if (err) throw err;
                                callback({
                                    inserted: true,
                                    message: 'Registered with success. You can now add to the queue on IRC using !add.'
                                });
                                // send(serverI, "/msg " + username + ": Registered with success. You can now add to the queue on IRC using !add.");
                            });
                        } else {
                            callback({
                                inserted: false,
                                message: 'You are already registered.'
                            });
                            // send(serverI, "/msg " + username + ": You are already registered.");
                        }
                    });
                });
            /*} else {
                // send(serverI, "/msg " + username + ": Now go to the IRC channel and type !link <kagusername> <authname>");
                callback({
                    inserted: false,
                    message: 'Now go to the IRC channel and type !link <kagusername> <authname>',
                });
            }*/
            connection.release();
        },
        /*requestIRCLink: function(account, username, callback) {
            var validator = this.validateIRCRequest(account, username);

            if (validator) {
                pool.getConnection(function(err, connection) {
                    if (err) throw err;
                    connection.query("SELECT COUNT(id) FROM " + usersTable + " WHERE authname=?;", [account], function(err, result) {
                        if(err) throw err;
                        if (result[0]["COUNT(id)"] === 0) {
                            connection.query("INSERT INTO " + usersTable + " (name,stats,banExpires,authname) VALUES (?,?,?,?);", [username, "0,0", "null", account], function(err) {
                                if (err) throw err;
                                callback({
                                    status: 'registered',
                                    message: 'Registered with success. You can now add to the queue on IRC using !add.'
                                });
                            });
                        } else {
                            callback({
                                status: 'already-registered',
                                message: 'You are already registered. Use !add to add to the list'
                            });
                        }
                    });
                });
            } else {
                callback({
                    status: 'kag-request-missing',
                    message: 'Now go to a KAG Gather Server and type !link <authname>'
                });
            }
        }*/
        requestIRCLink: function(account, kagUsername, callback) {
            //var validator = this.validateIRCRequest(account, kagUsername);

            //if (validator) {
                pool.getConnection(function(err, connection) {
                    if (err) throw err;
                    connection.query("SELECT COUNT(id) FROM " + usersTable + " WHERE authname=?;", [account], function(err, result) {
                        if(err) throw err;
                        if (result[0]["COUNT(id)"] === 0) {
                            connection.query("INSERT INTO " + usersTable + " (name,stats,banExpires,authname) VALUES (?,?,?,?);", [kagUsername, "0,0", "null", account], function(err) {
                                if (err) throw err;
                                callback({
                                    status: 'registered',
                                    message: 'Linked successfully. You can now add to the queue using !add.'
                                });
                            });
                        } else {
                            connection.query("UPDATE " + usersTable + " SET name=? WHERE authname=?;", [kagUsername,account], function(err){
                                if(err) throw err;
                                callback({
                                    status: 'already-registered',
                                    message: 'Your details were updated. Use !add to add to the list'
                                });
                            });
                        }
                    });
                });
            /*} else {
                callback({
                    status: 'kag-request-missing',
                    message: 'Now go to a KAG Gather Server and type !link <authname>'
                });
            }*/
            connection.release();
        }
    };
};
