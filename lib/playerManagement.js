require("console");
module.exports = {
	playingArray: {	
		blueTeam: [],
		redTeam: []
	},
	subRequests: [],
	subVotes: [{
		kagNamePlayerToSub: "",
		kagNamesPlayersRequestingSub: []
	}],
	subVotesRequired: 3,

	isPlaying: false,
	playingServer: null,

	getPlayerTeam: function(kagName){
                var team = "";
                for (var i = 0; i < this.playingArray.blueTeam.length; i++) {
                    if (this.playingArray.blueTeam[i] === kagName) {
                        return "blue";
                    }
                }
                for (var j = 0; j < this.playingArray.redTeam.length; j++) {
                    if (this.playingArray.redTeam[j] === kagName) {
                        return "red";
                    }
                }

        },

        isPlayerPlaying: function(kagName){
        	for (var i = 0; i <this.playingArray.blueTeam.length; i++) { 
			if(this.playingArray.blueTeam[i] == kagName){
				return true;
			}
		}
		for (var i = 0; i <this.playingArray.redTeam.length; i++) {
			if(this.playingArray.redTeam[i] == kagName){
				return true;
			}
		}
		return false;
        },

	addSubRequest: function(KAGNameToSub){
		this.subRequests.push({
	                KAGName: KAGNameToSub,
	                team: this.getPlayerTeam(KAGNameToSub)
            	});
		console.log("Sub Request added for " + KAGNameToSub);
	},

	makeSub: function(KAGNameOfPlayerToSubIn){
		if(this.subRequests!=undefined && this.subRequests.length>0){
console.log("this.subRequests[0].team: "+this.subRequests[0].team);
			if(this.subRequests[0].team=="blue"){
				for (var i = 0; i <this.playingArray.blueTeam.length; i++) { 
console.log("checking playing array blue: "+i+" : "+this.playingArray.blueTeam[i]);
					if(this.playingArray.blueTeam[i]=== this.subRequests[0].KAGName){
						this.playingArray.blueTeam.splice(i, 1);
						this.playingArray.blueTeam.push(KAGNameOfPlayerToSubIn);
						return true;
					}
				}
			}else if(this.subRequests[0].team=="red"){
				for (var i = 0; i <this.playingArray.redTeam.length; i++) {
console.log("checking playing array red : "+i+" : "+this.playingArray.redTeam[i]);
					if(this.playingArray.redTeam[i]=== this.subRequests[0].KAGName){
						this.playingArray.redTeam.splice(i, 1);
						this.playingArray.redTeam.push(KAGNameOfPlayerToSubIn);
						return true;
					}
				}
			}else{
				console.log("An error occured getting the team of the player to be subbed");
			}
		}
		return false;
	},

	addSubVote: function(kagNamePlayerToSub, kagNamePlayerRequestingSub){
		if(isPlayerPlaying(kagNamePlayerToSub))return "this player isn't playing";
		if(subVotes && subVotes.length>0){
			for(var i=0;i<subVotes.length;i++){
				if(subVotes[i].kagNamePlayerToSub=kagNamePlayerToSub){
					//check player hasnt already voted for a sub
					for(var j=0;j<this.subVotes[i].kagNamePlayersRequestingSub.length;j++){
						if(this.subVotes[i].kagNamePlayersRequestingSub[i]==kagNamePlayerRequestingSub){
							return "you have already requested sub";
						}
					}

					this.subVotes[i].kagNamePlayersRequestingSub.push(kagNamePlayerRequestingSub);
					if(this.subVotes[i].kagNamePlayersRequestingSub.length>=subRequestsRequired){
						addSubRequest(kagNamePlayerToSub);
						this.subVotes[i].splice(i,1);
					}
					console.log("sub request added for: "+kagNamePlayerToSub+" by: "+kagNamePlayerRequestingSub);
					return "sub request added ["+this.subVotes[i].kagNamePlayersRequestingSub.length+"/"+subVotesRequired+"]";
				}
			}
		}
		//reaches here if no existing requests for that player
		this.subVotes.push({
			kagNamePlayerToSub: kagNamePlayerToSub,
			kagNamesPlayersRequestingSub: []
		});
		return "sub request added ["+this.subVotes[i].kagNamePlayersRequestingSub.length+"/"+subVotesRequired+"]";

	}
}
