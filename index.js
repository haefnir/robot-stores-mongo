const express = require('express')
const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectId

const app = express()
const port = 3000

const url = "mongodb://root:password@localhost:27017"

const getDb = async () => {
    let connection = {}
    connection = await MongoClient.connect(url)
    return connection.db('robot-store').collection('products')
}

const dbMiddleware = async (req, res, next) => {
    let connection = null
    try {
        connection = await getDb()
    } catch(err) {
        return res.status(500).json({
            status: 500,
            message: 'Internal server error (none of your business)',
            data: null
        })
    }
    res.locals.connection = connection
    next()
}

app.use(dbMiddleware)
app.use(express.json())
app.use(express.urlencoded({extended: true}))
