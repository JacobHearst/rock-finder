const express = require('express')
const router = express.Router()
const _ = require('lodash')

const COLLECTION_NAME = 'route'

router.get('/:gradeSystem', ({ params: { gradeSystem }, app: { locals: { db } } }, res) => {
    if (!gradeSystem) {
        res.status(400).send('Missing required param: gradeSystem')
        return
    }

    const gradePath = `grades.${gradeSystem}`
    const aggregation = [
        {
            '$group': {
                '_id': 'yds',
                'grades': {
                    '$addToSet': {
                        'grade': `$${gradePath}.grade`,
                        'sort_index': `$${gradePath}.sort_index`
                    }
                }
            }
        }, {
            '$unwind': {
                'path': '$grades'
            }
        }, {
            '$project': {
                '_id': false,
                'grade': '$grades.grade',
                'sort_index': '$grades.sort_index'
            }
        }, {
            '$match': {
                'grade': {
                    '$exists': true
                }
            }
        }, {
            '$sort': {
                'sort_index': 1
            }
        }, {
            // TODO: Make this step configurable
            '$match': {
                'grade': {
                    '$regex': '(5\\.(?:1\\d(?:[\\w\\/])+)|(?:5.\\d[+-]?$)|3rd|4th|Easy 5th)' // Eliminate the 5.xx-, 5.xx+, 5.xx grades
                }
            }
        }
    ]

    db.db(process.env.MONGO_DB_NAME)
        .collection(COLLECTION_NAME)
        .aggregate(aggregation)
        .toArray((err, docs) => {
            if (err) {
                res.status(500).send(err)
            } else if (docs.length === 0) {
                res.status(404)
            } else {
                res.send(docs)
            }
        })
})

router.get('/', ({ app: { locals: { db } } }, res) => {
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
        }
    ]

    db.db(process.env.MONGO_DB_NAME)
        .collection(COLLECTION_NAME)
        .aggregate(agg)
        .toArray((err, docs) => {
            if (err) {
                res.status(500).send(err)
            } else if (docs.length === 0) {
                res.status(404)
            } else {
                delete docs[0]._id
                const response = {}
                for (let gradeSystem in docs[0]) {
                    const sorted = _.orderBy(docs[0][gradeSystem], ['sort_index'])
                    response[gradeSystem] = _.filter(sorted, (value) => !_.isEmpty(value))
                }

                res.send(response)
            }
        })
})

module.exports = router
