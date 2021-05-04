var Client = require('ssh2').Client

module.exports.command = function (sshOptions, callback) {
    var prompts = [
        {prompt: 'Password: ', echo: false},
        {prompt: 'password: ', echo: false}
    ]
    var conn = new Client()
    conn.on('ready', function() {
        conn.shell(function(err, stream) {
            if (err) {
                console.log('ERROR ' + sshOptions.message + ' failed with message: ' + err)
                callback(err)
                conn.end()
            }
            else {
                let allData = ''
                for(var cmd in sshOptions.command) {
                    stream.write(sshOptions.command[cmd] + '\n')
                }
                stream.end('exit\n')
                stream.on('close', function(code, signal) {
                    callback(null, null, allData)
                    conn.end()
                })
                .on('data', function(data) {
                    allData += data
                    callback(null, data, null)
                })
                .stderr.on('data', function(err) {
                    console.log('ERROR ' + sshOptions.message + ' failed with message: ' + err)
                    callback(err)
                    conn.end()
                })
            }
        })
    })
    .on('keyboard-interactive', function(name, instructions, instructionsLang, prompts, finish) {
        finish([sshOptions.password])
    })
    .on('ERROR ', function(err) {
        console.log('ERROR ' + sshOptions.message + ' failed with message: ' + err)
        callback(err)
        conn.end()
    })
    .connect({
        host: sshOptions.ip,
        port: 22,
        username: sshOptions.username,
        password: sshOptions.password,
        readyTimeout: 999999,
        tryKeyboard: true
    })
}