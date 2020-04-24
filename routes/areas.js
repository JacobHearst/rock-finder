const express = require('express')
const router = express.Router()
const { iterInRange, inRange, exists, calculateOffset, calculatePageSize } = require('../util')
const { uri, database } = require('../db-config')
const MongoClient = require('mongodb').MongoClient

const COLLECTION_NAME = 'area'

const DEFAULT_SORT_PARAM = 'name'
const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 100

const filterMap = {
    elevation: inRange,
    months: inRange,
    temp: iterInRange,
    precip: iterInRange,
    season: iterInRange,
}

const sortableFields = ['name', 'elevation']

const client = new MongoClient(uri, { useUnifiedTopology: true })
client.connect((err, client) => {
    if (err) {
        console.error(err)
        return
    }

    let collection = client.db(database).collection(COLLECTION_NAME)

    router.get('/search', ({ query }, res) => {
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
        
        const projection = { _id: 1, link: 1, parent_id: 1, name: 1, elevation: 1 }

        collection.find(filter, { sort, projection }).skip(offset).limit(pageSize).toArray((err, docs) => {
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
        collection.findOne({ _id: Number(req.params.id) })
            .then((route) => route ? res.send(route) : res.sendStatus(404))
            .catch((reason) => console.error(`ERROR: ${reason}`))
    })
})

module.exports = router
