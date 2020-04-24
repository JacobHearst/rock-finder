var MongoClient = require('mongodb').MongoClient
var conn

/**
 * will reuse connection if already created
 */
function connect(callback) {
    if (conn === undefined) {
        MongoClient.connect(process.env.MONGO_URI, { useUnifiedTopology: true }, function (err, db) {
            if (err) { return callback(err) }
            conn = db
            callback(null, db)
        })
    } else {
        callback(null, conn)
    }
}

module.exports = {
    connect
}
