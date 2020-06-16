const { filterFromMap, buildSort, valueIn, like } = require('../MongoHelpers')
const { paginateCursor, routeFilterMap, areaFilterMap } = require('./shared')
const { aggregateAreaIds } = require('./AreaService')
const _ = require('lodash')

const COLLECTION_NAME = 'route'

const sortableFields = ['name', 'rating', 'length', 'pitches', 'height', 'grade', 'types']
const DEFAULT_SORT_PARAM = 'rating'
const DEFAULT_SORT_ORDER = -1

async function searchRoutes(db, query) {
    const { sort, sortFilters } = buildSort(sortableFields, query, DEFAULT_SORT_PARAM, DEFAULT_SORT_ORDER)
    const filter = Object.assign(filterFromMap(routeFilterMap, query), sortFilters)

    const areaFilters = filterFromMap(areaFilterMap, query)
    if (!_.isEmpty(areaFilters)) {
        const areaIds = await aggregateAreaIds(db, areaFilters)
        Object.assign(filter, valueIn('ancestors', areaIds))
    }

    const docsCursor = db.collection(COLLECTION_NAME).find(filter, { sort })

    return paginateCursor(docsCursor, Number(query.page), Number(query.pageSize))
}

async function autocompleteRouteNames(db, query) {
    const filter = routeFilterMap.route_name('name', query.name)
    console.log(filter)
    const documents = await db.collection(COLLECTION_NAME).find(filter, { sort: { name: 1}}).limit(10).toArray()

    return { documents }
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

    const results = await db.collection(COLLECTION_NAME).aggregate(agg).toArray()
    const { length, pitches_min, pitches_max, height_min, height_max } = results[0]

    return {
        length: { labels: length.sort() },
        pitches: { min: pitches_min, max: pitches_max },
        height: { min: height_min, max: height_max }
    }
}

async function fetchGrades(db) {
    const agg = [
        {
            $group: {
                _id: 'grades',
                yds: {
                    $addToSet: {
                        grade: '$grades.yds.grade',
                        sort_index: '$grades.yds.sort_index'
                    }
                },
                hueco: {
                    $addToSet: {
                        grade: '$grades.hueco.grade',
                        sort_index: '$grades.hueco.sort_index'
                    }
                },
                ice: {
                    $addToSet: {
                        grade: '$grades.ice.grade',
                        sort_index: '$grades.ice.sort_index'
                    }
                },
                mixed: {
                    $addToSet: {
                        grade: '$grades.mixed.grade',
                        sort_index: '$grades.mixed.sort_index'
                    }
                },
                aid: {
                    $addToSet: {
                        grade: '$grades.aid.grade',
                        sort_index: '$grades.aid.sort_index'
                    }
                },
                danger: {
                    $addToSet: {
                        grade: '$grades.danger.grade',
                        sort_index: '$grades.danger.sort_index'
                    }
                },
                snow: {
                    $addToSet: {
                        grade: '$grades.snow.grade',
                        sort_index: '$grades.snow.sort_index'
                    }
                }
            }
        }, {
            $project: { _id: false }
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
    autocompleteRouteNames,
    fetchFilters,
    fetchGrades,
    searchRoutes,
}
