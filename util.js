/**
 * Compare two numbers and return the lesser of the two
 * @param {Number} a First number to compare
 * @param {Number} b Second number to compare
 */
function min(a, b) { return a < b ? a : b }

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
const inRange = (field_name, values) => ({ [field_name]: { $gte: values[0], $lte: values[1] } })

/** @param {Array} values range to check against */
const numInRange = (field_name, values) => inRange(field_name, [Number(values[0]), Number(values[1])])

/** @param {Array} values range to check against */
const iterInRange = (field_name, values) => ({ [field_name]: { $elemMatch: { $gte: Number(values[0]), $lte: Number(values[1]) } } })

/** @param {Array} values Parameter value */
const listContains = (field_name, values) => ({ [field_name]: { $elemMatch: { $in: values } } })

/** @param {string} field_name Name of the field to check */
const exists = (field_name) => ({ [field_name]: { $exists: true } })

const like = (field_name, regex) => ({ [field_name]: `/${regex}/` })

module.exports = {
    inRange,
    numInRange,
    iterInRange,
    listContains,
    exists,
    min,
    calculatePageSize,
    calculateOffset,
    like
}
