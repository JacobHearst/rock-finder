/**
 * Compare two numbers and return the lesser of the two
 * @param {Number} a First number to compare
 * @param {Number} b Second number to compare
 */
const min = (a, b) => b < a ? b : a

/**
 * Calculate the page size for a paginated endpoint
 * 
 * @param {Number} requested Requested page size
 * @param {Number} max Maximum allowed page size
 * @param {Number} defaultSize Default page size
 */
const calculatePageSize = (requested, max, defaultSize) => requested ? min(Number(requested), max) : defaultSize

/**
 * Calculate the index offset for a paginated endpoint
 * 
 * @param {Number} pageSize Size of pages
 * @param {Number} pageNumber Page number requested
 */
const calculateOffset = (pageSize, pageNumber) => pageNumber > 0 ? ((pageNumber - 1) * pageSize) : 0

/** @param {Array} values range to check against */
const inRange = (fieldName, values) => ({ [fieldName]: { $gte: values[0], $lte: values[1] } })

/** @param {Array} values range to check against */
const numInRange = (fieldName, values) => inRange(fieldName, [Number(values[0]), Number(values[1])])

/** @param {Array} values Parameter value */
const listContains = (fieldName, values) => ({ [fieldName]: { $elemMatch: { $in: values } } })

/** @param {string} fieldName Name of the field to check */
const exists = (fieldName) => ({ [fieldName]: { $exists: true } })

const like = (fieldName, regex) => ({ [fieldName]: `/${regex}/` })

/**
 * Generate a filter to determine if a given area has temps/precip in the given range
 * for the given month
 * 
 * @param {string} fieldName Name of the field to check, should be either temp_avgs or precip_avgs
 * @param {string[]} values The values to check ordered as follows: [month, min, max]
 */
const conditionInRange = (fieldName, values) => (
    {
        [fieldName]: {
            $elemMatch: {
                month: Number(values[0]),
                avg_low: { $gte: Number(values[1]) },
                avg_high: { $lte: Number(values[2]) } }
        }
    }
)

/**
 * Create a MongoDB nearSphere query
 *
 * @param {string} fieldName The name of the GeoPoint field
 * @param {float[]} coordinates The coordinates of the point to query
 * @param {float} minDistance [OPTIONAL] The minimum distance from the point
 * @param {float} maxDistance [OPTIONAL] The maximum distance from the point
 */
const nearSphere = (fieldName, coordinates, minDistance = undefined, maxDistance = undefined) => (
    {
        [fieldName]: {
            $nearSphere: {
                type: "Point",
                coordinates
            },
            $minDistance: minDistance,
            $maxDistance: maxDistance
        }
    }
)

module.exports = {
    calculateOffset,
    calculatePageSize,
    conditionInRange,
    exists,
    inRange,
    like,
    listContains,
    min,
    nearSphere,
    numInRange
}
