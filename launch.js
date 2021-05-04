'use strict'

var switches = require('./switchInfo.json')
var cluster = require('./clusterUtil.js')
var network = require('./networkUtil.js')
var aggregate = require('./aggregatorUtil.js')
var express = require('express')
var app = express()
var db = require('./dbSetup.js')()
var args = process.argv
const totalSwitches = Object.keys(switches).length
var totalClusters = 0
var switchesDone = 0
var clustersDone = 0
var masterCollection = {clusters:[], switches: []}
var noDC = true

// SETUP WEBSERVER & EXPRESS
app.use(express.static('static'))
app.set('etag', false)
console.log('Express App Setup.')
var http = require('http')
http.createServer(app).listen(8888)
console.log('HTTP Server Setup on Port: 8888.')


// GET THE DATACENTER THAT USER CARES ABOUT
for(var a in args) {
    if (args[a].indexOf('datacenterName') >= 0) {
        let thisArg = args[a].split('=')
        console.log('Getting information for datacenter ' + thisArg[1])
        noDC = false
        getClusterData(thisArg[1])
    }
}
if(noDC) { process.exit() }

// SQL QUERY PROMISE
function q (query) {
    return new Promise ((resolve, reject) => {
        db.query(query, function (err, rows) {
            if( err ) { reject(err) }
            else { resolve(rows) }
        })
    })
}

// GET LIST OF ALL CLUSTERS
function getClusterData (datacenter) {
    let query = 'SELECT cluster.externalIP,cluster.clusterID,cluster.name ' +
        'FROM cluster LEFT OUTER JOIN equipmentGroup ON cluster.groupUUID=equipmentGroup.uuid ' +
        'LEFT OUTER JOIN datacenter ON datacenter.uuid=equipmentGroup.datacenterUUID ' +
        'WHERE datacenter.name="' + datacenter + '"'
    q(query)
    .then(clusters => {
        totalClusters = clusters.length
        for(var c in clusters) {
            let thisCluster = clusters[c]
            cluster.getHosts(thisCluster)
            .then(newClusterData => {
                masterCollection.clusters.push(newClusterData)
                if (done(null,true)) {
                    aggregate(masterCollection)
                }
            })
            .catch(err => {
                console.log('Failed to query cluster: ' + thisCluster + ' with err: ' + err)
                if (done(null, true)) {
                    aggregate(masterCollection)
                }
            })
        }
    })
    .catch(err => {
        console.log('ERROR querying db: ' + err)
        process.exit()
    })
}

// GET ALL THE SWITCH HOSTNAME / NEIGHBORS / MAC ADDRESS TABLES
for(var s in switches) {
    let thisSwitch = s
    console.log('Querying switch: ' + thisSwitch)
    network.getMacAddrs(thisSwitch,switches[thisSwitch])
    .then(macTable => {
        // GOT MACS NOW LETS GET NEIGHBORS
        network.getNeighbors(thisSwitch,switches[thisSwitch])
        .then(neighbors => {
            // GOT NEIGHBORS NOW LETS GET HOSTNAME
            network.getHostName(thisSwitch,switches[thisSwitch])
            .then(hostname => {
                masterCollection.switches.push({
                    name: hostname,
                    ip: thisSwitch,
                    macs: macTable,
                    neighbors: neighbors,
                    children: []
                })
                if (done(true)) {
                    aggregate(masterCollection)
                }
            })
            .catch(err => {
                console.log(err)
                if (done(true)) {
                    aggregate(masterCollection)
                }
            })
        })
        .catch(err => {
            console.log(err)
            if (done(true)) {
                aggregate(masterCollection)
            }
        })
    })
    .catch(err => {
        if (done(true)) {
            aggregate(masterCollection)
        }
    })
}

// CHECK IF ALL SWITCHES HAVE GOTTEN MAC ADDRESSES AND NEIGHBORS
function done (switchIncrease, clusterIncrease) {
    if(switchIncrease) { switchesDone++ ; console.log('switchIncrease')}
    if(clusterIncrease) { clustersDone++ }
    let total = totalClusters + totalSwitches
    let completed = clustersDone + switchesDone
    console.log(completed + ' queries completed out of ' + total + '.')
    if (switchesDone == totalSwitches && clustersDone == totalClusters) {
        return true
    }
    else { return false }
}
