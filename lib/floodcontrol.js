var floodControl = [];
module.exports.userIsFlooding = userIsFlooding;

function userIsFlooding(account, command) {
    for (var i = 0; i < floodControl.length; i++) {
        if (floodControl[i].account === account) {
            if (floodControl[i].lastCommand === command) {
                floodControl[i].count++;

                setTimeout(function() {
                    if(floodControl[i].count>1)
                        floodControl.count--;
                }, 5000);

            } else {
                floodControl[i].count = 1;
            }
            floodControl[i].lastCommand = command;
            if (floodControl[i].count >= 3) {
                return true;
            }
        }
    }
    floodControl.push({
        account: account,
        lastCommand: '',
        count: 1
    });
    return false;
}