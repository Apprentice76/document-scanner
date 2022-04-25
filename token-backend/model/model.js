const mongoose = require('mongoose')

const mongo_url = process.env.MONGO_URL

// console.log(mongo_url)

mongoose
	.connect(mongo_url)
	.then(() => {
		console.log('db connected')
	})
	.catch((err) => {
		console.log(err.message)
	})

const personSchema = new mongoose.Schema({
	name: String,
	age: Number,
	documents: {
		identity: {
			name: String,
			raw: Buffer,
			data: Buffer,
			contentType: String,
		},
		address: {
			name: String,
			raw: Buffer,
			data: Buffer,
			contentType: String,
		},
		dob: {
			name: String,
			raw: Buffer,
			data: Buffer,
			contentType: String,
		},
		relationship: {
			name: String,
			raw: Buffer,
			data: Buffer,
			contentType: String,
		},
	},
})

personSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.__v
    }
})

const PersonModel = mongoose.model('person', personSchema)

module.exports = PersonModel
