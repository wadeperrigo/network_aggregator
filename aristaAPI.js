'use strict'
/* 
    en
    config t
    management api http-commands
    protocol https
    no shut
    show management api http-commands
*/


var eAPI = require('eapi')

// ARISTA VLAN
module.exports.vlan = opts => {
    opts.url = 'https://' + opts.ip + ':443'
    opts.cmd = ['show vlan']
    return call(opts)
}
// ARISTA LLDP
module.exports.lldp = {
    neighbors: opts => {
        return new Promise (( resolve, reject ) => {
            opts.url = 'https://' + opts.ip + ':443'
            opts.cmd = ['show lldp neighbors']
            call(opts)
            .then(neighborsResult => {
                let ethernetList = []
                let neighborsArray = neighborsResult[0].lldpNeighbors
                for (var neigh in neighborsArray) {
                    ethernetList.push(neighborsArray[neigh].port)
                }
                if (ethernetList.length) {
                    opts.interfaces = ethernetList
                    interfacesList(opts)
                    .then(neighborInterfaces => {
                        let neighbs = []
                        for (var neigh in neighborsArray) {
                            neighbs.push({
                                name: (neighborsArray[neigh].neighborDevice).toLowerCase(),
                                neighborPort: neighborsArray[neigh].neighborPort,
                                localPort: neighborsArray[neigh].port,
                                macAddress: neighborInterfaces[neighborsArray[neigh].port].macAddress
                            })
                        }
                        resolve(neighbs)
                    })
                    .catch(reject)
                }
            })
            .catch(reject)
        })
    }
}

// ARISTA HOST NAME
module.exports.hostname = {
    get: opts => {
        return new Promise (( resolve, reject ) => {
            opts.url = 'https://' + opts.ip + ':443'
            opts.cmd = ['show hostname']
            call(opts)
            .then(hname => {
                resolve((hname[0].hostname).toLowerCase())
            })
            .catch(reject)
        })
    }
}

// ARISTA MAC ADDRESS TABLE
module.exports.mac = {
    addressTable: opts => {
        return new Promise (( resolve, reject ) => {
            opts.url = 'https://' + opts.ip + ':443'
            opts.cmd = ['show mac address-table']
            call(opts)
            .then(macsResult => {
                let macs = []
                let unicastTable = macsResult[0].unicastTable.tableEntries
                for(var mac in unicastTable) {
                    if ( unicastTable[mac].interface.indexOf('hannel') < 0 ) {
                        macs.push({
                            name: unicastTable[mac].macAddress,
                            interface: unicastTable[mac].interface
                        })
                    }
                }
                resolve(macs)
            })
            .catch(reject)
        })
    }
}

// ARISTA INTERFACES
function interfacesList (opts) {
    return new Promise (( resolve, reject ) => {
        opts.url = 'https://' + opts.ip + ':443'
        opts.cmd = []
        for(var int in opts.interfaces) {
            opts.cmd.push('show interfaces ' + opts.interfaces[int])
        }
        call(opts)
        .then(ints => {
            let intList = {}
            // THIS IS AN ARRAY WE MUST ITERATE OVER
            for (var int in ints) {
                // THEN WE MUST ITERATE THE ORIGINAL LIST OF ETHERNET PORTS
                for (var i in opts.interfaces) {
                    // CHECK TO SEE IF THE INTERFACE EXISTS IN THIS LOOP
                    if (opts.interfaces[i] in ints[int].interfaces) {
                        intList[opts.interfaces[i]] = { macAddress: ints[int].interfaces[opts.interfaces[i]].burnedInAddress }
                    }
                }
            }
            resolve(intList)
        })
        .catch(reject)
    })
}
module.exports.interfaces = {
    list: opts => {
        interfacesList(opts)
    }
}

// ARISTA TRUNKS
module.exports.trunk = {
    get: opts => {
        opts.url = 'https://' + opts.ip + ':443'
        opts.cmd = ['show interfaces trunk']
        return call(opts)
    }
}

// CALL THE ARISTA API
function call (opts) {
    return new Promise (( resolve, reject ) => {
        var aSwitch = new eAPI({
            host: opts.ip,
            proto: 'https',
            port: 443,
            user: opts.creds.username,
            pass: opts.creds.password,
            strict: false
        })
        aSwitch.exec(opts.cmd, function(err, res) {
            if(err) { reject( err ) }
            else { resolve ( res ) }
        })
    })
}
