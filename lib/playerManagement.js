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
		if(this.subsRequests!=undefined && this.subsRequests.length>0){
			if(this.subRequests[0].team==blue){
				for (var i = 0; i <this.playingArray.blueTeam.length; i++) {
					if(this.playingArray.blueTeam[i]=== this.subRequests[0].KAGName){
						this.playingArray.blueTeam.splice(i, 1);
						this.playingArray.blueTeam.push(KAGNameOfPlayerToSubIn);
						return true;
					}
				}
			}else if(this.subRequests[0].team==red){
				for (var i = 0; i <this.playingArray.redTeam.length; i++) {
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
	}
}
