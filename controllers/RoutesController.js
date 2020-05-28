const { searchRoutes, fetchFilters } = require('../services/RoutesService')

async function getRoutes(req, res, next) {
    const { app: { locals: { db } }, query } = req
    
    try {
        const results = await searchRoutes(db, query)
        if (results.routes.length === 0) {
            res.sendStatus(404)
        } else {
            res.send(results)
        }
    } catch (e) {
        console.log(e)
        res.sendStatus(500) && next(e)
    }
}

async function getFilters(req, res, next) {
    const { app: { locals: { db } } } = req

    try {
        const filters = await fetchFilters(db)

        res.send(filters)
    } catch (e) {
        console.log(e)
        res.sendStatus(500) && next(e)
    }
}

module.exports = {
    getRoutes,
    getFilters
}
