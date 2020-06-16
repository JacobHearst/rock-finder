const _ = require('lodash')

/** @param {Array} values range to check against */
const inRange = (fieldName, values) => ({ [fieldName]: { $gte: values[0], $lte: values[1] } })

/** @param {Array} values range to check against */
const numInRange = (fieldName, values) => inRange(fieldName, [Number(values[0]), Number(values[1])])

/** @param {Array} values Parameter value */
const listContains = (fieldName, values) => ({ [fieldName]: { $elemMatch: { $in: values } } })

/** @param {string} fieldName Name of the field to check */
const exists = (fieldName) => ({ [fieldName]: { $exists: true } })

const like = (fieldName, regex) => ({ [fieldName]: { $regex: `.*${regex}.*`, $options: 'i' }})

const nameLike = (_fieldName, regex) => like('name', regex)

const valueIn = (fieldName, values) => ({[fieldName]: { $in: values }})

/**
 * Generate a filter to determine if a given area has temps/precip in the given range
 * for the given month
 * 
 * @param {string} fieldName Name of the field to check, should be either temp_avgs or precip_avgs
 * @param {string[]} values The values to check ordered as follows: [month, min, max]
 */
const conditionInRange = (fieldName, values) => (
    {
        [`${fieldName}.${values[0]}.avg_low`]: { $gte: Number(values[1]) },
        [`${fieldName}.${values[0]}.avg_high`]: { $lte: Number(values[2]) }
    }
)

/**
 * Create a MongoDB nearSphere query
 *
 * @param {string} fieldName The name of the GeoPoint field
 * @param {string[]} values The coordinates of the point to query
 */
const nearSphere = (fieldName, values) => {
    const numVals = values.map(x => Number(x))
    const nearSphere = {
        $nearSphere: {
            $geometry: {
                type: "Point",
                coordinates: numVals.slice(0, 2)
            }
        }
    }

    // Add min and max distance if passed
    if (numVals.length > 2) nearSphere.$nearSphere.$minDistance = numVals[2]
    else if (numVals.length > 3) nearSphere.$nearSphere.$maxDistance = numVals[3]

    return { [fieldName]: nearSphere}
}

/**
 * Generate a MongoDB find filter from a map containing field names as keys with functions to generate
 * MongoDB filters attached to them
 * 
 * @param {Object} filterMap A map containing the functions to generate the filters
 * @param {querystring} query The Query String attached to the request
 * 
 * @returns A MongoDB query object
 */
function filterFromMap(filterMap, query) {
    const filter = {}
    for (let param in filterMap) {
        if (query[param]) {
            const values = query[param].split(',')
            Object.assign(filter, filterMap[param](param, values))
        }
    }

    return filter
}

/**
 * Build a MongoDB sort object
 *
 * @param {string[]} sortableFields An array of the sortable fields
 * @param {querystring} query The query string attached to the request
 * @param {string} defaultSortParam The default param to sort by
 * @param {number} defaultSortOrder The default order to sort by
 * 
 * @returns {{sort, newFilters}} An object containing the sort object and an object of new filters
 */
function buildSort(sortableFields, query, defaultSortParam, defaultSortOrder) {
    const sortFilters = {}
    const sort = {}
    sortableFields.forEach((param) => {
        const sortParam = `${param}Sort`
        if (query[sortParam]) {
            sort[param] = Number(query[sortParam])
            sortFilters[param] = exists(param)
        }
    })

    if (_.isEmpty(sort)) {
        sort[defaultSortParam] = defaultSortOrder
    }

    return { sort, sortFilters }
}

module.exports = {
    buildSort,
    conditionInRange,
    exists,
    filterFromMap,
    inRange,
    like,
    listContains,
    nameLike,
    nearSphere,
    numInRange,
    valueIn,
}
