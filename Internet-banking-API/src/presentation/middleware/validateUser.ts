import { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { UserModel } from '../../domain/models'
import { SECRET, UserRole } from '../../utils/constants'

interface ValidateUser {
  username: string
  email: string
}

interface IAuth {
  authorization: string
}

const services = UserModel
export const userValidation = async (req: Request, res: Response, next: NextFunction): Promise<Response | any> => {
  const { username, email }: ValidateUser = req.body
  const regexInvalidUserName = /[a-zA-Z0-9]/g
  const regexInvalidEmail = /\S+@\S+\.\S+/

  if (!regexInvalidUserName.test(username) && req.method === 'POST') {
    return res.status(400).json({ error: 'Username is invalid' })
  }

  if (!regexInvalidEmail.test(email) && req.method === 'POST') {
    return res.status(400).json({ error: 'Email is invalid' })
  }

  if ((username === undefined || email === undefined) && req.method === 'POST') {
    return res.status(400).json({
      status: 400,
      message: 'The property username or email is required'
    })
  }
  const { authorization } = req.headers
  if (authorization === undefined && req.method === 'POST') {
    const userByUsername = await services.findOne({ username }).exec()
    if (userByUsername?.username === username) {
      return res
        .status(400)
        .json({ status: 400, message: 'Username already in use' })
    }

    const userByEmail = await services.findOne({ email }).exec()
    if (userByEmail?.email === email) {
      return res
        .status(400)
        .json({ status: 400, message: 'Email already in use' })
    }
  }
  if (authorization !== undefined && req.method === 'PUT') {
    const payload = jwtValid({ authorization })
    if (payload.message) return res.status(401).json({ error: payload.message })
    const userByUsername = await services.findOne({ username }).exec()

    if (userByUsername !== null && userByUsername.username !== payload.sub) {
      if (userByUsername?.username === username) {
        return res
          .status(400)
          .json({ status: 400, message: 'Username already in use' })
      }
    }

    const userByEmail = await services.findOne({ email }).exec()
    if (userByEmail !== null && userByEmail.email !== payload.email) {
      if (userByEmail?.email === email) {
        return res
          .status(400)
          .json({ status: 400, message: 'Email already in use' })
      }
    }
  }

  return next()
}

export const ownerValidation = async (req: Request, res: Response, next: NextFunction): Promise<Response | any> => {
  const authorization = req.headers.authorization
  if (authorization === undefined) return res.status(401).json({ error: 'Access denied, you need to login' })

  const { owner } = req.params

  try {
    const payload = jwtValid({ authorization })

    if (payload.message) return res.status(401).json({ error: payload.message })

    const user = await services.findById(payload.uid)

    console.log(user)
    console.log(`are the same: ${user?._id.toString() === owner}`)
    if (user?._id.toString() !== owner) {
      return res.status(403).json({
        status: 403,
        message: 'The user is not the owner of the resource'
      })
    }
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).send('Internal server error')
    }
    return res.status(401).send('Unauthorized')
  }
  return next()
}

export const adminValidation = async (req: Request, res: Response, next: NextFunction): Promise<Response | any> => {
  const { authorization } = req.headers
  try {
    if (authorization === undefined) return res.status(401).json({ error: 'Access denied, you need to login' })
    const payload = jwtValid({ authorization })
    if (payload.message) {
      return res.status(401).json({ error: payload.message })
    }
    if (payload.role !== UserRole.ADMIN) {
      return res.status(401).json({
        status: 401,
        message: 'Access denied, you need to login'
      })
    }
  } catch (error) {
    if (error instanceof Error) {
      console.log(error)
      return next(error)
    }
    return res.status(403).send('Unauthorized')
  }
  return next()
}

export const authValidation = async (req: Request, res: Response, next: NextFunction): Promise<Response | any> => {
  const { authorization } = req.headers

  try {
    if (authorization === undefined) {
      return res.status(401).json({ error: 'Access denied, you need to authenticate' })
    }

    const payload = jwtValid({ authorization })
    if (payload.message) {
      return res.status(401).json({ error: payload.message })
    }
  } catch (error) {
    if (error instanceof Error) {
      return next(error)
    }
    return res.status(401).send('Unauthorized')
  }
  return next()
}

export const senderValidation = async (req: Request, res: Response, next: NextFunction): Promise<Response | any> => {
  const { sender } = req.params
  const { authorization } = req.headers
  const senderBody = req.body.sender
  const users = await services.find().exec()
  try {
    if (authorization === undefined) return res.status(401).json({ error: 'Access denied, you need to login' })

    if (users.some(user => user._id === sender || user._id === senderBody)) {
      return res.status(400).json({ error: 'Sender is invalid' })
    }

    const payload = jwtValid({ authorization })
    if (payload.message) {
      return res.status(401).json({ error: payload.message })
    }
  } catch (error) {
    if (error instanceof Error) {
      return next(error)
    }
    return res.status(401).send('Unauthorized')
  }
  return next()
}

const jwtValid = ({ authorization }: IAuth): JwtPayload => {
  const token = authorization.split(' ')[1]
  const payload = jwt.verify(token, SECRET) as JwtPayload

  if (authorization?.split(' ')[0] !== 'Bearer') {
    payload.message = 'Access denied, use an authorization token'
    return payload
  }

  if (token === undefined) {
    payload.message = 'Access denied, you need to login'
    return payload
  }
  return payload
}
