const express = require('express')
const router = express.Router()
const { listContains, inRange, numInRange, exists, calculatePageSize, calculateOffset, like } = require('../util')
const _ = require('lodash')

const COLLECTION_NAME = 'route'

const DEFAULT_SORT_PARAM = 'rating'
const DEFAULT_SORT_ORDER = -1
const DEFAULT_PAGE_SIZE = 100
const MAX_PAGE_SIZE = 500

const filterMap = {
    name: like,
    types: listContains,
    rating: numInRange,
    length: inRange,
    pitches: numInRange,
    height: numInRange,
    grade: (_param, values) => numInRange(`grades.${values[0]}.sort_index`, values.slice(1))
}

const sortableFields = ['name', 'rating', 'length', 'pitches', 'height', 'grade', 'types']

router.get('/search', ({ app: { locals: { db } }, query }, res) => {
    const pageSize = calculatePageSize(query.pageSize, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE)
    const offset = calculateOffset(pageSize, Number(query.page))

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

    if (_.isEmpty(sort)) {
        sort[DEFAULT_SORT_PARAM] = DEFAULT_SORT_ORDER
    }

    const docsCursor = db.collection(COLLECTION_NAME)
        .find(filter, { sort })

    docsCursor.count().then((totalSize) => {
        docsCursor.skip(offset)
            .limit(pageSize)
            .toArray((err, routes) => {
                if (err) {
                    res.status(500).send(err)
                } else if (routes.length === 0) {
                    res.status(404)
                } else {
                    res.send({
                        maxPage: Math.ceil(totalSize / pageSize),
                        routes
                    })
                }
            })
    })
})

router.get('/filters', ({app: { locals: { db } } }, res) => {
    const agg = [
        {
            '$group': {
                '_id': null,
                'length': {
                    '$addToSet': '$length'
                },
                'pitches': {
                    '$addToSet': '$pitches'
                },
                'height': {
                    '$addToSet': '$height'
                },
                'rating': {
                    '$addToSet': '$rating'
                }
            }
        }, {
            '$project': {
                '_id': false
            }
        }
    ]

    db.collection(COLLECTION_NAME)
        .aggregate(agg)
        .toArray((err, docs) => {
            if (err) {
                res.status(500).send(err)
            } else if (docs.length === 0) {
                res.status(404)
            } else {
                const doc = docs[0]

                const response = {}
                for (let filter in doc) {
                    // Define a sort function for numbers
                    const sortFunc = !isNaN(doc[filter][0])
                        ? (a, b) => a - b
                        : undefined

                    const sorted = doc[filter].sort(sortFunc)
                    response[filter] = _.filter(sorted, (value) => !_.isEmpty(value) || !isNaN(value))
                }

                res.send(response)
            }
        })
})

router.get('/:id', ({ params, app: { locals: { db } } }, res) => {
    db.collection(COLLECTION_NAME)
        .findOne({ _id: Number(params.id) })
        .then((route) => res.send(route))
        .catch((reason) => console.error(`ERROR: ${reason}`))
})

module.exports = router
