var switches = require('./switchInfo.json')
var eAPI = require('eapi')

for(var s in switches) {
    let thisSwitch = switches[s]
    console.log('Querying switch: ' + s)
    thisSwitch.ip = s
    thisSwitch.cmd = []
    thisSwitch.cmd.push('show interfaces')
    call(thisSwitch)
    .then(ints => {
        // THIS IS AN ARRAY WE MUST ITERATE OVER
        for (var int in ints) {
            for(let intName in ints[int].interfaces) {
                console.log(thisSwitch.ip + ' - ' + intName + ' - ' + ints[int].interfaces[intName].description)
            }
        }
    })
    .catch(err => {
        console.log(err)
    })
}


// CALL THE ARISTA API
function call (opts) {
    return new Promise (( resolve, reject ) => {
        var aSwitch = new eAPI({
            host: opts.ip,
            proto: 'https',
            port: 443,
            user: opts.username,
            pass: opts.password,
            strict: false
        })
        aSwitch.exec(opts.cmd, function(err, res) {
            if(err) { reject( err ) }
            else { resolve ( res ) }
        })
    })
}
