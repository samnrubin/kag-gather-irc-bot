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
var expect = require("chai").expect;
var links = require("../lib/links.js")({
    pool: pool,
    usersTable: config.mysql.usersTable
});
describe('Links Control', function() {
    describe('#addIRCRequest', function() {
        it('should add a irc request to the object', function() {
            var result = links.addIRCRequest('DummyAuth', 'DummyUser')
            expect(result).to.not.equal('already-requested');
        });
    });
    describe('#addKAGRequest', function() {
        it('should add a kag request to the object', function() {
            var result = links.addKAGRequest('DummyAuth1', 'DummyUser1');
            expect(result).to.not.equal('already-requested');
        });
    });
    describe('#validateIRCRequest', function() {
        it('should return if the irc request is complete', function() {
            links.addKAGRequest('DummyAuthRequest', 'DummyNameRequest');
            var goodRequest = links.validateIRCRequest('DummyAuthRequest', 'DummyNameRequest');
            var badRequest = links.validateIRCRequest('RandonAuth', 'RandonName');
            expect(goodRequest).to.be.true;
            expect(badRequest).to.be.false;
        });
    });
    describe('#validateKAGRequest', function() {
        it('should return if the kag request is complete', function() {
            links.addIRCRequest('DummyAuthRequestKAG', 'DummyNameRequestKAG');
            var goodRequest = links.validateKAGRequest('DummyAuthRequestKAG', 'DummyNameRequestKAG');
            var badRequest = links.validateKAGRequest('RandonAuthKAG', 'RandonNameKAG');
            expect(goodRequest).to.be.true;
            expect(badRequest).to.be.false;
        });
    });
    describe('#requestLink', function() {
        it('should make a kag link request', function(done) {
            links.requestLink('requestLinkDummyAuth', 'requestLinkDummyUserName', function(result) {
                expect(result.inserted).to.be.false;
                expect(result.message).to.equal('Now go to the IRC channel and type !link <kagusername> <authname>');
                done();
            });
        });
    });
    describe('#requestIRCLink', function() {
        it('should make a irc link request', function(done) {
            links.requestIRCLink('requestLinkDummyAuthIRC', 'requestLinkDummyUserNameIRC', function(result) {
                expect(result.status).to.equal('kag-request-missing');
                done();
            });
        });
    });
});