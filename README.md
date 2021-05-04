# Create a map of network topologies (as long as they all have the same user/pass).
Last I knew this was working if you change the mysql db password in db.js and admin password for arista's and dell switches (in networkUtil.js)
const creds = {
    username:'UserPass',
    password:'AdminPass'
}
And hopefully you can at least partially populate switchInfo.json (with the core switches IP) and it will likely find the rest of the discovery of TOR's.
