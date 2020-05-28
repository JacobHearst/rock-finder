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
            $group: {
                _id: null,
                length: { $addToSet: '$length' },
                pitches_min: { $min: '$pitches' },
                pitches_max: { $max: '$pitches' },
                height_min: { $min: '$height' },
                height_max: { $max: '$height' },
            }
        }, {
            $project: {
                _id: false
            }
        }
    ]

    const { length, pitches_min, pitches_max, height_min, height_max } = 
        await db.collection(COLLECTION_NAME).aggregate(agg).toArray()

    return {
        length: { labels: length },
        pitches: { min: pitches_min, max: pitches_max },
        height: { min: height_min, max: height_max }
    }
}

async function fetchGrades(db) {
    const agg = [
        {
            '$group': {
                '_id': 'grades',
                'yds': {
                    '$addToSet': {
                        'grade': '$grades.yds.grade',
                        'sort_index': '$grades.yds.sort_index'
                    }
                },
                'hueco': {
                    '$addToSet': {
                        'grade': '$grades.hueco.grade',
                        'sort_index': '$grades.hueco.sort_index'
                    }
                },
                'ice': {
                    '$addToSet': {
                        'grade': '$grades.ice.grade',
                        'sort_index': '$grades.ice.sort_index'
                    }
                },
                'mixed': {
                    '$addToSet': {
                        'grade': '$grades.mixed.grade',
                        'sort_index': '$grades.mixed.sort_index'
                    }
                },
                'aid': {
                    '$addToSet': {
                        'grade': '$grades.aid.grade',
                        'sort_index': '$grades.aid.sort_index'
                    }
                },
                'danger': {
                    '$addToSet': {
                        'grade': '$grades.danger.grade',
                        'sort_index': '$grades.danger.sort_index'
                    }
                },
                'snow': {
                    '$addToSet': {
                        'grade': '$grades.snow.grade',
                        'sort_index': '$grades.snow.sort_index'
                    }
                }
            }
        }, {
            '$project': { '_id': false }
        }
    ]

    const grades = await db.collection(COLLECTION_NAME).aggregate(agg).toArray()

    const response = {}
    for (let gradeSystem in grades[0]) {
        const sorted = _.orderBy(grades[0][gradeSystem], ['sort_index'])
        response[gradeSystem] = _.filter(sorted, (value) => !_.isEmpty(value))
    }

    return response
}

module.exports = {
    searchRoutes,
    fetchFilters,
    fetchGrades
}
