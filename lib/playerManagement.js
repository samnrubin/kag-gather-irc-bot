require("console");
module.exports = {
	playingArray: {	
		blueTeam: [],
		redTeam: []
	},
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
	}
}
