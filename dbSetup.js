var mysql = require('mysql')

module.exports = () => {
    var connection = mysql.createPool({
        host     : 'localhost',
        user     : 'root',
        password : 'Password',
        database : 'ex:equipment',
        supportBigNumbers : true
    })
    // Connect to the database
    connection.getConnection(err => {
        if (err) {
            console.log('Failed to setup Database:' + err)
            process.exit()
        }
        else { console.log('DB Setup Success.') }
    })
    return connection
}
