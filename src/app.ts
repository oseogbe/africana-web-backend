import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import path from 'path'
import cookieParser from 'cookie-parser'
import 'dotenv/config'
import routes from '@/routes/v1'
import { CustomError } from 'typings'

require('dotenv').config()

const app: Express = express()
const PORT = process.env.PORT || 3000

const corsOptions: cors.CorsOptions = {
    origin: [
        'http://africanalifestyle.tv',
        'http://144.149.167.72.host.secureserver.net',
        'https://72.167.149.144',
        '102.220.97.130',
    ],
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
    allowedHeaders: ['Accept', 'Content-Type', 'Origin', 'X-Requested-With'],
    exposedHeaders: [],
    maxAge: 0,
    credentials: true,
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
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

app.listen(PORT, () => console.log(`Server running on port ${PORT}...`))