const express = require('express')
const router = express.Router()
const { listContains, inRange, exists, calculatePageSize, calculateOffset } = require('../util')
const MongoClient = require('mongodb').MongoClient

const COLLECTION_NAME = 'route'

const DEFAULT_SORT_PARAM = 'name'
const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 100

const filterMap = {
    types: listContains,
    length: inRange,
    pitches: inRange,
    height: inRange,
    rating: inRange,
    elevation: inRange,
    grades: (_param, values) => inRange(`grades.${values[0]}.sort_index`, values.slice(1))
}

const sortableFields = ['name', 'types', 'rating', 'length', 'pitches', 'height', 'grades']

const client = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true })
client.connect((err, client) => {
    if (err) {
        console.error(err)
        return
    }

    let collection = client.db(process.env.MONGO_DB_NAME).collection(COLLECTION_NAME)

    router.get('/search', ({ query }, res) => {
        res.set('Access-Control-Allow-Origin', 'localhost:3000')

        const pageSize = calculatePageSize(query.pageSize, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE)
        const offset = calculateOffset(pageSize, Number(query.pageNumber))

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

        if (Object.keys(sort).length < 1) {
            sort[DEFAULT_SORT_PARAM] = 1
        }

        collection.find(filter, { sort }).skip(offset).limit(pageSize).toArray((err, docs) => {
            if (err) {
                res.status(500).send(err)
            } else if (docs.length === 0) {
                res.status(404)
            } else {
                res.send(docs)
            }
        })
    })

    router.get('/:id', (req, res) => {
        collection.findOne({ _id: Number(req.params.id)})
            .then((route) => res.send(route))
            .catch((reason) => console.error(`ERROR: ${reason}`))
    })
})

module.exports = router
