'use strict'
var fs = require('fs')

module.exports = function (masterCollection) {
    // FIND SWITCH WITH MOST NEIGHBORS AND ASSUME CORE AND SECOND MOST BE SECOND CORE
    let switches = masterCollection.switches
    let mostNeighbors = 0
    let core = ''
    let secondCore = ''
    for (var s in switches) {
        if(switches[s].neighbors.length > mostNeighbors) {
            mostNeighbors = switches[s].neighbors.length
            secondCore = core
            core = switches[s].name
        }
    }

    // CREATE CORE OBJECTS THAT WE WILL MAP EVERYTHING TO
    let coreSwitches = [{
            name: core,
            children: [],
            neighbors: [],
            ip: '',
            macs: []
        },{
            name: secondCore,
            children: [],
            neighbors: [],
            ip: '',
            macs: []
        }
    ]

    // POPULATE THE CORE OBJECTS WITH FIRST LEVEL ITEMS
    for (var cidx in coreSwitches) {
        for (sidx in switches) {
            if (switches[sidx].name == coreSwitches[cidx].name) {
                console.log('match')
                coreSwitches[cidx].neighbors = switches[sidx].neighbors
                coreSwitches[cidx].ip = switches[sidx].ip
                coreSwitches[cidx].macs = switches[sidx].macs
            }
        }
    }

    // ITERATE CLUSTERS AND HOSTS TO FIND THEIR CONNECTED SWITCH
    let clusters = masterCollection.clusters
    for (var cidx in clusters) {
        let hosts = clusters[cidx].children
        for (var hidx in hosts) {
            let nics = hosts[hidx].children
            for (var nidx in nics) {
                for (var sidx in switches) {
                    let macTable = switches[sidx].macs
                    for (var midx in macTable) {
                        if (nics[nidx].macAddress == macTable[midx].name) {
                            switches[sidx].children.push({
                                name: nics[nidx].name,
                                macAddress: nics[nidx].macAddress,
                                neighborPort: macTable[midx].interface,
                                clusterName: clusters[cidx].name
                            })
                        }
                    }
                }
            }
        }
    }

    // ADD SWITCHES TO CORE BASED UPON LLDP NEIGHBOR
    for (var sidx in switches) {
        let thisSwitchName = switches[sidx].name
        for (var cidx in coreSwitches) {
            if (coreSwitches[cidx].name.indexOf(thisSwitchName) < 0) {
                let thisSwitch = switches[sidx]
                for (var nidx in thisSwitch.neighbors) {
                    if (coreSwitches[cidx].name == thisSwitch.neighbors[nidx].name) {
                        coreSwitches[cidx].children.push({
                            name: thisSwitch.name,
                            ip: thisSwitch.ip,
                            children: thisSwitch.children,
                            neighborPort: thisSwitch.neighbors[nidx].neighborPort,
                            localPort: thisSwitch.neighbors[nidx].localPort
                        })
                    }
                }
            }
        }
    }

    // FINISH UP
    writeJson(coreSwitches)
}

function writeJson(coreSwitches) {
    for (var ind in coreSwitches) {
        let jsonToWrite = JSON.stringify(coreSwitches[ind])
        let thisIndex = ind
        fs.writeFile('./static/switch' + thisIndex + '.json', jsonToWrite, 'utf8', function (err) {
            if (err) { console.log(err) }
            else { console.log('Switch ' +thisIndex + ' was saved!') }
        })
    }
}
