require("console");
module.exports = {
	playingArray: [],
	subRequests: [],

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

	addSubRequest: function(KAGNameToSub){
		this.subRequests.push({
                KAGName: KAGNameToSub,
                team: this.getPlayerTeam(KAGNameToSub)
            });
	},

	makeSub: function(KAGNameOfPlayerToSubIn){
		if(subsArray!=undefined && subsArray.length>0){
			if(subRequests[0].team==blue){
				for (var i = 0; i <playersArray.blueTeam.length; i++) {
					if(playersArray.blueTeam[i]=== subRequests[0].KAGName){
						playingArray.blueTeam.splice(i, 1);
						playingArray.blueTeam.push(KAGNameOfPlayerToSubIn);
						return true;
					}
				}
			}else if(subRequests[0].team==red){
				for (var i = 0; i <playersArray.redTeam.length; i++) {
					if(playersArray.redTeam[i]=== subRequests[0].KAGName){
						playingArray.redTeam.splice(i, 1);
						playingArray.redTeam.push(KAGNameOfPlayerToSubIn);
						return true;
					}
				}
			}else{
				console.log("An error occured getting the team of the player to be subbed");
			}
		}
		return false;
	}
}
