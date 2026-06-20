import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import materialRoutes from './routes/materials.js'
import uploadRoutes from './routes/upload.js'
import tradeRoutes from './routes/trades.js'
import wantedRoutes from './routes/wanted.js'
import workRoutes from './routes/works.js'
import shopRoutes from './routes/shops.js'
import messageRoutes from './routes/messages.js'
import userRoutes from './routes/users.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/materials', materialRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/trades', tradeRoutes)
app.use('/api/wanted', wantedRoutes)
app.use('/api/works', workRoutes)
app.use('/api/shops', shopRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/users', userRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
