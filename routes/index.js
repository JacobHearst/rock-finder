const express = require('express')
const router = express.Router()
const { getRoutes, getFilters, getGrades, getNameAutocomplete } = require('../controllers/RouteController')
const { getAreas } = require('../controllers/AreaController')

router.get('/routes', getRoutes)
router.get('/routes/names/:name', getNameAutocomplete)
router.get('/routes/filters', getFilters)
router.get('/routes/grades', getGrades)

router.get('/areas', getAreas)

module.exports = router
