'use strict'
var prism = require('nutanix_prism')
const creds = {
    username:'user',
    password:'Password'
}

module.exports.getHosts = function(thisCluster) {
    return new Promise ((resolve, reject) => {
        thisCluster.children = []
        let opts = {
            creds: creds,
            ip: thisCluster.externalIP
        }
        prism.host.get(opts)
        .then(hosts => {
            getHostNetwork(hosts.entities, thisCluster)
            .then(resolve)
            .catch(reject)
        })
        .catch(reject)
    })
}

function getHostNetwork(hosts, thisCluster) {
    return new Promise ((resolve, reject) => {
        let hostCounter = 0
        let hostLength = hosts.length
        for (var host in hosts) {
            let thisHost = hosts[host]
            let thisChildIndex = thisCluster.children.push({
                name: thisHost.hypervisorAddress,
                children: []
            }) - 1
            let opts = {
                creds: creds,
                ip: thisCluster.externalIP,
                serviceVMId: thisHost.serviceVMId
            }
            prism.host.nics(opts)
            .then(hostNics => {
                for (var nic in hostNics) {
                    let mac = hostNics[nic].macAddress.toLowerCase()
                    thisCluster.children[thisChildIndex].children.push({
                        name: thisCluster.name + ' - ' + thisHost.hypervisorAddress + ' - ' + hostNics[nic].name,
                        macAddress: mac
                    })
                }
                if(checkDone()) {
                    resolve(thisCluster)
                }
            })
            .catch(err => {
                if(checkDone()) {
                    console.log('ERROR while getting host nics: ' + externalIP + ' with err: ' + err)
                    reject('ERROR while getting host nics: ' + externalIP + ' with err: ' + err)
                }
            })
        }
        function checkDone() {
            hostCounter++
            if(hostCounter == hostLength) { return true }
            else { return false }
        }
    })
}
