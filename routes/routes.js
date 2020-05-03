const express = require('express')
const router = express.Router()
const { listContains, inRange, exists, calculatePageSize, calculateOffset, like } = require('../util')

const COLLECTION_NAME = 'route'

const DEFAULT_SORT_PARAM = 'rating'
const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 100

const filterMap = {
    name: like,
    types: listContains,
    rating: inRange,
    length: inRange,
    pitches: inRange,
    height: inRange,
    elevation: inRange,
    grades: (_param, values) => inRange(`grades.${values[0]}.sort_index`, values.slice(1))
}

const sortableFields = ['name', 'rating', 'length', 'pitches', 'height', 'elevation', 'grades']

router.get('/search', ({ app: { locals: { db } }, query }, res) => {
    const pageSize = calculatePageSize(query.pageSize, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE)
    const offset = calculateOffset(pageSize, Number(query.pageNumber))

    const filter = {}
    for (let param in filterMap) {
        if (query[param]) {
            const values = query[param].split(',')
            Object.assign(filter, filterMap[param](param, values))
        }
    }

    const sort = {}
    for (let i in sortableFields) {
        const param = sortableFields[i]
        const sortParam = `${param}Sort`
        if (query[sortParam]) {
            sort[param] = Number(query[sortParam])
            Object.assign(filter, exists(param))
        }
    }

    if (Object.keys(sort).length < 1) {
        sort[DEFAULT_SORT_PARAM] = 1
    }

    db.db(process.env.MONGO_DB_NAME)
        .collection(COLLECTION_NAME)
        .find(filter, { sort })
        .skip(offset)
        .limit(pageSize)
        .toArray((err, docs) => {
            if (err) {
                res.status(500).send(err)
            } else if (docs.length === 0) {
                res.status(404)
            } else {
                res.send(docs)
            }
        })
})

router.get('/:id', ({ params, app: { locals: { db } } }, res) => {
    db.db(process.env.MONGO_DB_NAME).collection(COLLECTION_NAME).findOne({ _id: Number(params.id) })
        .then((route) => res.send(route))
        .catch((reason) => console.error(`ERROR: ${reason}`))
})

module.exports = router
