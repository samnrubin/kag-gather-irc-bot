require("console");
module.exports = {
        tempLinkData: [],
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

        connectedArray: [],

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

        playerIsPlaying: function(kagName){
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

	isPlayerBeingSubbed: function(KAGName){
		if(!this.subRequests) return -1;
		for(var i=0;i<this.subRequests.length;i++){
			if(this.subRequests[i].KAGNameToSub==KAGName) return i;
		}
		return -1;
	},

	makeSub: function(KAGNameOfPlayerToSubIn){
		if(this.subRequests!=undefined && this.subRequests.length>0){
console.log("this.subRequests[0].team: "+this.subRequests[0].team);

			var playerIndex=-1;			//check if player trying to sub in for themself
			if(!this.subRequests) return -1;
			for(var i=0;i<this.subRequests.length;i++){
				if(this.subRequests[i].KAGNameToSub==KAGName){
					playerIndex = i;
					break;
				}
			}
			if(playerIndex!=-1){			//if player is subbing back in for themself, just delete the sub request
				var playerTeam=this.subRequests[playerIndex].team
				this.subRequests.splice(playerIndex, 1);
				return playerTeam;
			}

			if(this.subRequests[0].team=="blue"){
				for (var i = 0; i <this.playingArray.blueTeam.length; i++) { 
console.log("checking playing array blue: "+i+" : "+this.playingArray.blueTeam[i]);
					if(this.playingArray.blueTeam[i]=== this.subRequests[0].KAGName){
						this.playingArray.blueTeam.splice(i, 1);
						this.playingArray.blueTeam.push(KAGNameOfPlayerToSubIn);
						this.subRequests.splice(0,1);
						return "blue";
					}
				}
			}else if(this.subRequests[0].team=="red"){
				for (var i = 0; i <this.playingArray.redTeam.length; i++) {
console.log("checking playing array red : "+i+" : "+this.playingArray.redTeam[i]);
					if(this.playingArray.redTeam[i]=== this.subRequests[0].KAGName){
						this.playingArray.redTeam.splice(i, 1);
						this.playingArray.redTeam.push(KAGNameOfPlayerToSubIn);
						this.subRequests.splice(0,1);
						return "red";
					}
				}
			}else{
				console.log("An error occured getting the team of the player to be subbed");
			}
		}
		return -1;
	},

	addSubVote: function(kagNamePlayerToSub, kagNamePlayerRequestingSub){
		if(this.playerIsPlaying(kagNamePlayerToSub))return "this player isn't playing";
		if(this.subVotes && this.subVotes.length>0){
			for(var i=0;i<this.subVotes.length;i++){
				if(this.subVotes[i].kagNamePlayerToSub=kagNamePlayerToSub){
					//check player hasnt already voted for a sub
					for(var j=0;j<this.subVotes[i].kagNamesPlayersRequestingSub.length;j++){
						if(this.subVotes[i].kagNamesPlayersRequestingSub[i]==kagNamePlayerRequestingSub){
							return ": you have already requested a sub for this player";
						}
					}

					this.subVotes[i].kagNamesPlayersRequestingSub.push(kagNamePlayerRequestingSub);
					console.log("sub vote added for: "+kagNamePlayerToSub+" by: "+kagNamePlayerRequestingSub);
					if(this.subVotes[i].kagNamesPlayersRequestingSub.length>=this.subVotesRequired){
						this.addSubRequest(kagNamePlayerToSub);
						this.subVotes.splice(i,1);
                                                return "A sub position is now available to replace "+kagNamePlayerToSub;
					} else {
						return ": your vote to sub "+kagNamePlayerToSub+" was counted ["+this.subVotes[i].kagNamesPlayersRequestingSub.length+"/"+this.subVotesRequired+"]";
                                        }
				}
			}
		}
		//reaches here if no existing requests for that player
		this.subVotes.push({
			kagNamePlayerToSub: kagNamePlayerToSub,
			kagNamesPlayersRequestingSub: [kagNamePlayerRequestingSub]
		});
		return ": your vote to sub "+kagnamePlayerToSub+" was counted ["+this.subVotes[0].kagNamesPlayersRequestingSub.length+"/"+this.subVotesRequired+"]";

	},


	isPlaying: false,
	playingServer: null,



	endMatch: function(){

		this.playingServer = null;
		this.isPlaying = false;
		this.playingArray= { 
			blueTeam: [],
			redTeam: []
		}
		this.subRequests= []
		this.subVotes= [{
			kagNamePlayerToSub: "",
			kagNamesPlayersRequestingSub: []
		}]
		return;
	}
}
