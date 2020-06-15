const { conditionInRange, like, numInRange, calculateOffset, calculatePageSize, nearSphere } = require('../util')

const filterMap = {
    temp_avgs: conditionInRange,
    precip_avgs: conditionInRange,
    name: like,
    elevation: numInRange,
    coords: nearSphere
}

const COLLECTION_NAME = 'area'
const DEFAULT_PAGE_SIZE = 100
const MAX_PAGE_SIZE = 500

async function searchAreas(db, query) {
    const pageSize = calculatePageSize(query.pageSize, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE)
    const offset = calculateOffset(pageSize, Number(query.page))

    const filter = {}
    for (let param in filterMap) {
        if (query[param]) {
            const values = query[param].split(',')
            Object.assign(filter, filterMap[param](param, values))
        }
    }

    const docsCursor = db.collection(COLLECTION_NAME).find(filter)

    const totalSize = await docsCursor.count()
    const results = await docsCursor.skip(offset).limit(pageSize).toArray()

    return {
        maxPage: Math.ceil(totalSize / pageSize),
        areas: results
    }
}

module.exports = {
    searchAreas
}
