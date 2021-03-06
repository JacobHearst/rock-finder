const { searchRoutes, autocompleteRouteNames, fetchFilters, fetchGrades } = require('../services/RouteService')

async function getRoutes(req, res, next) {
    const { app: { locals: { db } }, query } = req
    
    try {
        const results = await searchRoutes(db, query)
        if (results.documents.length === 0) {
            res.sendStatus(404)
        } else {
            res.send(results)
        }
    } catch (e) {
        console.log(e)
        res.sendStatus(500) && next(e)
    }
}

async function getNameAutocomplete(req, res, next) {
    const { app: { locals: { db } }, params } = req

    try {
        const results = await autocompleteRouteNames(db, params)
        if (results.documents.length === 0) {
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

async function getGrades(req, res, next) {
    const { app: { locals: { db } } } = req

    try {
        const grades = await fetchGrades(db)

        res.send(grades)
    } catch (e) {
        console.log(e)
        res.sendStatus(500) && next(e)
    }
}

module.exports = {
    getFilters,
    getGrades,
    getNameAutocomplete,
    getRoutes,
}
