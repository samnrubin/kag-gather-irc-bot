var mysql = require('mysql');
var fs = require('fs');
var configData = fs.readFileSync("config.json", {
    encoding: "utf8"
});
var config = JSON.parse(configData);

var connection = mysql.createConnection({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password
});

connection.connect();
connection.query('CREATE DATABASE ' + config.mysql.database + ';', function(err) {
    if (err) throw err;
    console.log("Database '" + config.mysql.database + "' created with success. Now creating tables.");
    connection.changeUser({
        database: config.mysql.database
    }, function(err) {
        if (err) throw err;
        connection.query("CREATE TABLE `" + config.mysql.matchTable + "` (`id` int(11) not null auto_increment,`blueTeam` text,`redTeam` text,`winner` tinytext,PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;", function(err) {
            if (err) throw err;
            console.log("Table '" + config.mysql.matchTable + "' created with success.");
            connection.query("CREATE TABLE " + config.mysql.usersTable + " (`name` text,`stats` text,`banExpires` text,`id` int(11) not null auto_increment,`authname` text,UNIQUE KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;", function(err) {
                if (err) throw err;
                console.log("Table '" + config.mysql.usersTable + "' created with success.");
                console.log("The configuration has been finished. To run the bot type 'npm start' without the quotes.");
                connection.end();
            });
        });
    });
});