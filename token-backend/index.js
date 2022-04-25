require('dotenv').config()

const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const cors = require('cors')
const multer = require('multer')
const PersonModel = require('./model/model')

const userdb = [
	{
		user: 'test-user@dummy.com',
		// password: 'test-password',
		password:
			'$2b$10$ohVG/Uo31OkYj6WsXF6PgOsEqayuPH.zSlJ1JTa0svBy.7FXf5r7a',
	},
]

const storage = multer.memoryStorage({
	destination: (req, file, callback) => {
		callback(null, '')
	},
})

const upload = multer({
	storage: storage,
	// limits: {
	// 	fieldSize: 1024 * 1024 * 2,
	// },
}).single('raw')

const uploadRaw = multer({
    storage: multer.memoryStorage()
}).array('raw')

const app = express()

app.use(express.json())
app.use(cors())

const errorHandler = (err, req, res, next) => {
	console.log(err.message)
}

app.use(errorHandler)

app.get('/', async (_, res) => {
	// console.log(await bcrypt.hash('test-password', 10))
	return res.status(200).send('<h1>Server Running!</h1>')
})

app.post('/register', async (req, res, next) => {
	// registration logic
	try {
		const { usr, pwd } = req.body
		const exists = userdb.find({ user: usr }) && true

		if (exists) {
			return res.status(400).send({
				message: 'User already exists, please login.',
			})
		}
		const encryptedPass = await bcrypt.hash(pwd, 10)

		const newUser = {
			user: usr,
			password: encryptedPass,
		}

		userdb.push(newUser)

		const token = jwt.sign({ usr }, process.env.TOKEN_SECRET, {
			expiresIn: '1d',
		})

		newUser.token = token

		return res.status(201).json(newUser)
	} catch (err) {
		next(err)
	}
})

app.post('/login', async (req, res, next) => {
	// login logic
	try {
		const { usr, pwd } = req.body

		// console.log('usr: ', usr, ', pass: ', pwd)

		if (!(usr && pwd)) {
			return res.status(400).send({ message: 'Input field(s) empty.' })
		}

		const user = userdb.find((o) => o.user === usr)

		if (user && (await bcrypt.compare(pwd, user.password))) {
			const token = jwt.sign({ usr }, process.env.TOKEN_SECRET_64, {
				expiresIn: '1d',
			})

			userDetails = {
				user: user.user,
				token: token,
			}

			// userDetails.token = token

			return res.status(201).json(userDetails)
		}
		return res.status(400).send({ message: 'Invalid Credentials.' })
	} catch (err) {
		next(err)
	}
})

const verifyToken = (req, res, next) => {
	const authHeader = req.headers['authorization']
	const token = authHeader && authHeader.split(' ')[1]

	if (token === null)
		return res.status(403).send({ message: 'User not logged in.' })

	try {
		const user = jwt.verify(token, process.env.TOKEN_SECRET_64)
		req.user = user
	} catch (err) {
		return res.status(401).send('Token expired or invalid.')
	}

	next()
}

app.put('/uploadEdited/:id/:type', (req, res, next) => {
	try {
		const id = req.params.id
		const type = req.params.type
		console.log('uploadEdited', type)
		upload(req, res, async (err) => {
			if (err) {
				next(err)
			} else {
				// const person = await PersonModel.findById(id)
				// console.log(req.file)
				if (type === 'identity') {
					const updatedPerson = {
						// ...person,
						documents: {
							// ...person?.documents,
							identity: {
								// ...person?.documents?.identity,
								data: req.file.buffer,
							},
						},
					}
					PersonModel.findByIdAndUpdate(id, updatedPerson, {
						new: true,
					}).then(() => {
						return res.status(200).send({message: `Updated ${type} data`})
					})
				}
			}
		})
	} catch (err) {
		next(err)
		return res.status(400).send(err.message)
	}
})

app.put('/uploadRaw/:id/:type', (req, res, next) => {
	try {
		const id = req.params.id
        const type = req.params.type
        console.log('uploadRaw', type)
		upload(req, res, async (err) => {
			if (err) {
				next(err)
			} else {
				// const person = await PersonModel.findById(id)
				// console.log(req.file)
                if (type === 'identity') {
                    console.log(req.file)
					const updatedPerson = {
						// ...person,
						documents: {
							// ...person?.documents,
							identity: {
								// ...person?.documents?.identity,
								raw: req.file.buffer,
								contentType: 'image/jpeg',
							},
						},
					}
					PersonModel.findByIdAndUpdate(id, updatedPerson, {
						new: true,
					}).then(() => {
						return res
							.status(200)
							.send({ message: `Updated ${type} raw` })
					})
				}
			}
		})
	} catch (err) {
		next(err)
		return res.status(400).send(err.message)
	}
})

app.get('/getRaw/:id/:type', (req, res, next) => {
    try {
        const id = req.params.id
        const type = req.params.type
        console.log('getRaw', type)
        if (type === 'identity') {
            PersonModel.findById(id).then(resp => {
                const identity = resp?.documents?.identity
                return res.status(200).send(identity)
            })
        }
	} catch (err) {
		next(err)
		return res.status(400).send(err.message)
	}
})

app.post('/createPerson', verifyToken, (req, res, next) => {
	// if (req.body === null) {
	//     const err = { message: 'Missing Body' }
	//     next(err)
	//     return res.status(400).send(err)
	// }
	try {
		console.log(req.body)
		const person = new PersonModel(req.body)
		person.save().then((item) => {
			// console.log(item)
			res.status(201).send(item)
		})
	} catch (err) {
		next(err)
		res.status(400).send(err)
	}
})

app.get('/getqr', verifyToken, () => {})

app.get('/checkValidity', verifyToken, (req, res) => {
	res.status(200).send({ message: 'Token Valid' })
})

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
	console.log(`Server running on port: ${PORT}`)
})
