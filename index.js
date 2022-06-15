const express = require('express')
const Schema = require('validate')
const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectId

const app = express()
const port = 3000

const url = "mongodb://root:password@localhost:27017"

const getDb = async () => {
    let connection = {}
    connection = await MongoClient.connect(url, {ignoreUndefined: true})
    return connection.db('robot-store')
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

const dataMiddleware = (req, res, next) => {
    res.locals.data = {
        title: req.body.title,
        price: req.body.price,
        image: req.body.image,
        category_id: req.body.category_id,
        category: req.body.category,
        character_id: req.body.character_id,
        character: req.body.character,
        description: req.body.description,
        image2: req.body.image2,
        image3: req.body.image3
    }
    next()
}

const productValidator = new Schema({
    title : {
        type : String,
        length : {min : 5, max : 255}
    },
    price : {
        type : Number,
        size : {min: 0}
    },
    image : {
        type : String
    },
    category_id : {
        type : Number,
        size : {min : 1, max : 4}
    },
    category : {
        type : String,
        enum : ['Aprons', 'Baseball Hats', 'Mugs', 'T-shirts']
    },
    character_id : {
        type : Number,
        size : {min : 1, max : 4}
    },
    character : {
        type : String,
        enum : ['Fred', 'Dolores', 'Bubbles', 'Rex', 'Harold']
    },
    description : {
        type : String
    },
    image2 : {
        type : String
    },
    image3 : {
        type : String
    }
})

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(dbMiddleware)


app.get('/api/products', async (req, res) => {
    const category = req.query.category
    const character = req.query.character

    let conditions = []
    if (category){
        conditions.push({category})
    }
    if (character){
        conditions.push({character})
    }

    let final_condition = (conditions.length > 0) ? {$and: conditions} : {};

    const products = await res.locals.connection.collection('products').find(final_condition).project({_id: true, title: true, price: true, image: true}).toArray()

    res.status(200).json({
        status: 200,
        message: 'Data retrieved successfully',
        data: products
    })
})

app.get('/api/products/:id', async (req, res) => {
    let _id
    try {
        _id = ObjectId(req.params.userId)
    } catch(err) {
        res.status(400).json({
            "status": 400,
            "message": "Invalid ID",
            "data": null
        })}

    const product = await res.locals.connection.collection('products').find({_id}).toArray()

    if(product.id) {
        res.status(200).json({
            "status": 200,
            "message": "Products retrieved successfully!",
            "data": product
        })
    } else {
        res.status(400).json({
            "status": 400,
            "message": "Invalid ID",
            "data": null
        })
    }
})

app.post('/api/products', dataMiddleware, async (req, res) => {
    const errors = productValidator.validate(res.locals.data)

    if(errors.length > 0) {
        let message = ''
        errors.forEach(error => {
            message += error.message + ' '
        })
        return res.status(400).json({
            status: 400,
            message: message,
            data: null
        })
    }

    const result = await res.locals.connection.collection('products').insertOne(res.locals.data)

    if(result.insertedId) {
        res.status(200).json({
            status: 200,
            message: 'Document added successfully',
            data: "id: " + result.insertedId
        })
    } else {
        res.status(400).json({
            status: 400,
            message: 'Failed to add document',
            data: null
        })
    }
})

app.put('/api/products/:id', dataMiddleware, async (req, res) => {
    const _id = ObjectId(req.params.id)

    const errors = productValidator.validate(res.locals.data)

    if(errors.length > 0) {
        let message = ''
        errors.forEach(error => {
            message += error.message + ' '
        })
        return res.status(400).json({
            status: 400,
            message: message,
            data: null
        })
    }

    const result = await res.locals.connection.collection('products').updateOne({_id}, {$set: res.locals.data})

    if(result.modifiedCount === 0) {
        res.status(400).json({
            status: 400,
            message: 'Update failed',
            data: null
        })
    } else {
        res.status(200).json({
            status: 200,
            message: 'Updated successfully',
            data: null
        })
    }
})

app.delete('/api/products/:id', async (req, res) => {
    const _id = ObjectId(req.params.id)

    const result = await res.locals.connection.collection('products').deleteOne({_id})

    if(result.deletedCount === 0) {
        res.status(400).json({
            status: 400,
            message: 'Delete failed',
            data: null
        })
    } else {
        res.status(200).json({
            status: 200,
            message: 'Deleted successfully',
            data: null
        })
    }
})

app.get('/api/categories', async (req, res) => {
    const categories = await res.locals.connection.collection('categories').find({}).project({name: true}).toArray()

    res.status(200).json({
        status: 200,
        message: 'Data retrieved successfully',
        data: categories
    })
})

app.get('/api/characters', async (req, res) => {
    const characters = await res.locals.connection.collection('characters').find({}).project({name: true}).toArray()

    res.status(200).json({
        status: 200,
        message: 'Data retrieved successfully',
        data: characters
    })
})

app.get('/api/basket/:userId', async (req, res) => {
    let userId
    try {
        userId = ObjectId(req.params.userId)
    } catch(err) {
        res.status(400).json({
            "status": 400,
            "message": "Invalid ID",
            "data": null
    })}

    const basket = await res.locals.connection.collection('baskets').findOne({userId}).toArray()

    if(basket.id) {
        res.status(200).json({
            "status": 200,
            "message": "Basket retrieved successfully!",
            "data": basket
        })
    } else {
        res.status(400).json({
            "status": 400,
            "message": "Invalid ID",
            "data": null
        })
    }
})

app.put('/api/clearWaste', async (req, res) => {
    const result = await res.locals.connection.collection('products').updateMany({}, {$unset: {category_id: "", character_id: ""}})

    if(result.modifiedCount === 0) {
        res.status(400).json({
            status: 400,
            message: 'Update failed',
            data: null
        })
    } else {
        res.status(200).json({
            status: 200,
            message: 'Updated successfully',
            data: null
        })
    }
})

app.listen(port)
