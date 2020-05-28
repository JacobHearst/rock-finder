const express = require('express')
const router = express.Router()
const { getRoutes, getFilters, getGrades } = require('../controllers/RouteController')

router.get('/', getRoutes)
router.get('/filters', getFilters)
router.get('/grades', getGrades)

module.exports = router
