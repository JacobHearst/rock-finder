const { searchAreas } = require('../services/AreaService')

async function getAreas(req, res, next) {
    const { app: { locals: { db } }, query } = req

    try {
        const results = await searchAreas(db, query)
        if (results.length === 0) {
            res.sendStatus(404)
        } else {
            res.send(results)
        }
    } catch (e) {
        console.log(e)
        res.sendStatus(500) && next(e)
    }
}

module.exports = {
    getAreas
}
