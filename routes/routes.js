const express = require('express')
const router = express.Router()
const { getRoutes, getFilters } = require('../controllers/RoutesController')

router.get('/', getRoutes)
router.get('/filters', getFilters)

module.exports = router
