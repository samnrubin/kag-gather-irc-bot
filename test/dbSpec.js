//Load Configs
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("config.json", {
    encoding: "utf8"
}));
//MySQL Config
var mysql = require('mysql');
var pool = mysql.createPool({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database
});
var usersTable = config.mysql.usersTable;
var expect = require("chai").expect;
var db = require("../lib/db.js")({
    pool: pool,
    usersTable: config.mysql.usersTable,
    matchTable: config.mysql.matchTable
});

describe("DB-Functions", function() {
    //adds test-players
    before(function(done) {
        pool.getConnection(function(err, connection) {
            connection.query("INSERT INTO " + usersTable + " (`name`, `stats`, `banExpires`, `authname`) VALUES ('__test__DummyBanned', '0,0', 'Fri May 30 2015 21:26:37 GMT-0300 (Hora oficial do Brasil)', '__test__DummyBanned'), ('__test__DummyStats', '10,5', 'null', '__test__DummyStats'), ('__test__DummyName', '0,0', 'null', '__test__DummyAuth');", function(err) {
                if (err) throw err;
                done();
            });
        });
    });
    describe('#isPlayerBanned()', function() {
        it("should return if a player is banned", function(done) {
            db.isPlayerBanned('__test__DummyBanned', function(isBanned) {
                db.isPlayerBanned('__test__DummyAuth', function(isBanned1) {
                    expect(isBanned1).to.be.equal(false);
                    expect(isBanned).to.be.equal(true);
                    done();
                });
            });
        });
    });
    describe('#getPlayerStats', function() {
        it('should return the players stats in a string', function(done) {
            db.getPlayerStats('__test__DummyStats', function(stats) {
                expect(stats).to.equal("10,5");
                done();
            });
        });
    });
    describe('#getPlayerByAuth', function() {
        it('should return the accounts username', function(done) {
            db.getPlayerByAuth('__test__DummyAuth', function(player) {
                expect(player.name).to.equal('__test__DummyName');
                done();
            });
        });
    });
    describe('#getPlayerByAccount', function() {
        it('should return the players info', function(done) {
            db.getPlayerByAccount('__test__DummyName', function(player) {
                expect(player.authname).to.equal('__test__DummyAuth');
                done();
            });
        });
    });
    describe('#addVictoryTo', function() {
        it('should increase the victory count of a player', function(done) {
            db.getPlayerStats('__test__DummyAuth', function(stats) {
                var wins = parseInt(stats.split(',')[0]);
                db.addVictoryTo('__test__DummyAuth', function() {
                    done();
                });
            });
        });
    });
    describe('#addLoseTo', function() {
        it('should increase the lose count of a player', function(done) {
            db.getPlayerStats('__test__DummyAuth', function(stats) {
                var losses = parseInt(stats.split(',')[1]);
                db.addLoseTo('__test__DummyAuth', function() {
                    db.getPlayerStats('__test__DummyAuth', function(afterStats) {
                        afterStats = parseInt(afterStats.split(',')[1]);
                        expect(afterStats).to.equal(losses + 1);
                        done();
                    });
                });
            });
        });
    });

    describe('#addMatchToDB', function() {
        it('should add a match to the database', function(done) {
            db.addMatchToDB(['__test__Dummy', '__test__Dummy1'], ['__test__Dummy', '__test__Dummy1'], '0', function(result) {
                expect(result.affectedRows).to.equal(1);
                done();
            });
        });
    });
    //removes test-players
    after(function(done) {
        pool.getConnection(function(err, connection) {
            connection.query("DELETE FROM " + usersTable + " WHERE name LIKE '\_\_test\_\_%';", function(err) { // jshint ignore:line
                if (err) throw err;
                done();
            });
        });
    });
});