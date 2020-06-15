const { conditionInRange, nameLike, numInRange, nearSphere, listContains, inRange } = require('../MongoHelpers')

const DEFAULT_PAGE_SIZE = 100
const MAX_PAGE_SIZE = 500

const areaFilterMap = {
    temp_avgs: conditionInRange,
    precip_avgs: conditionInRange,
    area_name: nameLike,
    elevation: numInRange,
    coords: nearSphere,
}

const routeFilterMap = {
    route_name: nameLike,
    types: listContains,
    rating: numInRange,
    length: inRange,
    pitches: numInRange,
    height: numInRange,
    grade: (_param, values) => numInRange(`grades.${values[0]}.sort_index`, values.slice(1))
}

/**
 * Paginate a MongoDB Cursor
 * 
 * @param {Cursor} cursor A MongoDB Cursor Object
 * @param {Number} page The page being requested
 * @param {Number} requestedPageSize The size of page being requested
 */
async function paginateCursor(cursor, page, requestedPageSize) {
    const pageSize = requestedPageSize ? Math.min(Number(requestedPageSize), MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE
    const offset = page > 0 ? ((page - 1) * pageSize) : 0

    const totalSize = await cursor.count()
    const documents = await cursor.skip(offset).limit(pageSize).toArray()

    return {
        maxPage: Math.ceil(totalSize / pageSize),
        documents
    }
}

module.exports = {
    areaFilterMap,
    paginateCursor,
    routeFilterMap
}