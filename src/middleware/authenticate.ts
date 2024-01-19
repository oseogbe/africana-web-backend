import { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'

// Extend the Request interface to include the 'user' property
declare global {
    namespace Express {
        interface Request {
            user?: string
        }
    }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization']
    if (!authHeader) return res.sendStatus(401)
    // Bearer token
    const token = authHeader?.split(' ')[1]
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
    if (!accessTokenSecret) {
        throw new Error('Access token is not defined')
    }
    jwt.verify(token, accessTokenSecret, (err, decoded) => {
        if (err) return res.sendStatus(403)
        // Cast decoded to JwtPayload to resolve the 'Property 'email' does not exist' error
        const jwtPayload = decoded as JwtPayload;
        req.user = jwtPayload?.email
        next()
    })
}

// export const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
//     if(req.user.role === 'admin') {
//         next()
//     }
//     res.sendStatus(403)
// }