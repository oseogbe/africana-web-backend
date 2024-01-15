import * as fs from 'fs';
import * as path from 'path';
import * as  winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

const { combine, timestamp, printf } = winston.format

const logsDir = path.join(process.cwd(), 'storage', 'logs')
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const fileRotateTransport: DailyRotateFile = new DailyRotateFile({
    filename: path.join(logsDir, 'africana-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxFiles: '30d'
})

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        timestamp({
            format: 'YYYY-MM-DD hh:mm:ss.SSS A',
        }),
        printf((info) => `[${info.timestamp}] ${info.level}: ${info.stack}`)
    ),
    transports: [fileRotateTransport]
})