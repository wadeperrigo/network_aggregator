'use strict'
//var ssh = require('./sshUtil.js')
var dell = require('./dellAPI.js')
var arista = require('./aristaAPI.js')
const creds = {
    username:'UserPass',
    password:'AdminPass'
}

module.exports.getMacAddrs = (ip, info) => {
    let opts = {
        creds: creds,
        ip: ip
    }
    switch (info.switchType){
        case 'arista':
            return arista.mac.addressTable(opts)
        case 'dell':
            return dell.mac.addressTabe(opts)
    }
}

module.exports.getNeighbors = (ip, info) => {
    let opts = {
        creds: creds,
        ip: ip
    }
    switch (info.switchType){
        case 'arista':
            return arista.lldp.neighbors(opts)
        case 'dell':
            return dell.lldp.neighbors(opts)
    }
}

module.exports.getHostName = (ip, info) => {
    let opts = {
        creds: creds,
        ip: ip
    }
    switch (info.switchType){
        case 'arista':
            return arista.hostname.get(opts)
        case 'dell':
            return dell.hostname.get(opts)
    }
}
