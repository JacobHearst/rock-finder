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

async function searchRoutes(db, query) {
    const sortableFields = ['name', 'rating', 'length', 'pitches', 'height', 'grade', 'types']

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

    const docsCursor = db.collection(COLLECTION_NAME).find(filter, { sort })

    const totalSize = await docsCursor.count()
    const results = await docsCursor.skip(offset).limit(pageSize).toArray()

    return {
        maxPage: totalSize / pageSize,
        routes: results
    }
}

async function fetchFilters(db) {
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

    return db.collection(COLLECTION_NAME).aggregate(agg).toArray()
}

module.exports = {
    searchRoutes,
    fetchFilters
}
