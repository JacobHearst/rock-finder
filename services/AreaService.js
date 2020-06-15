const { filterFromMap, exists } = require('../MongoHelpers')
const { paginateCursor, areaFilterMap } = require('./shared')

const COLLECTION_NAME = 'area'

async function searchAreas(db, query) {
    const filter = filterFromMap(areaFilterMap, query)

    const docsCursor = db.collection(COLLECTION_NAME).find(filter)

    return paginateCursor(docsCursor, Number(query.page), Number(query.pageSize))
}

async function aggregateAreaIds(db, matching) {
    // Since we'll be looking for the lowest level areas,
    // we can automatically exclude root nodes
    Object.assign(matching, exists('ancestors'))
    const agg = [
        { $match: matching },
        {
            $unwind: { path: '$ancestors' }
        },
        {
            $group: {
                _id: null,
                ids: { $addToSet: '$_id' },
                parent_ids: { $addToSet: '$ancestors' }
            }
        },
    ]

    const results = await db.collection(COLLECTION_NAME).aggregate(agg).toArray()
    
    // Create an array of ids not listed as parent_ids
    return results[0].ids.filter((id) => !results[0].parent_ids.includes(id))
}

module.exports = {
    searchAreas,
    aggregateAreaIds
}
