import express, { Express, Request, Response, NextFunction } from 'express'
import * as https from 'https'
import * as fs from 'fs'
import cors from 'cors'
import * as path from 'path'
import cookieParser from 'cookie-parser'
import * as useragent from 'express-useragent'
import 'dotenv/config'
import routes from '@/routes/v1'
import { CustomError } from 'typings'

require('dotenv').config()

const app: Express = express()
const PORT = process.env.PORT || 443

app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.protocol === 'http') {
        res.redirect(301, `https://${req.headers.host}${req.originalUrl}`)
    } else {
        next()
    }
})

const corsOptions: cors.CorsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
    allowedHeaders: ['Accept', 'Content-Type', 'Origin', 'X-Requested-With'],
    exposedHeaders: [],
    maxAge: 0,
    credentials: false,
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(useragent.express())
app.use(cookieParser())
app.use(express.static(path.join(__dirname, '..', 'public')))

app.get('/ping', (req, res) => {
    res.send("pong")
})

app.use('/api/v1', routes)

app.use((err: CustomError, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500
    const message = err.message || 'Internal Server Error'
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message
    })
})

app.all('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: "resource not found"
    })
})

const privateKeyPath = '../../storage/cert/private.key'
const certificatePath = '../../storage/cert/7e06156776a249d.crt'

console.log(path.resolve(__dirname, privateKeyPath))

const server = https.createServer({
    key: fs.readFileSync(path.resolve(__dirname, privateKeyPath), 'utf-8'),
    cert: fs.readFileSync(path.resolve(__dirname, certificatePath), 'utf-8')
}, app)

server.listen(PORT, () => console.log(`Server running on port ${PORT}...`))