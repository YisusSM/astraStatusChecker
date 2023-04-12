import express from 'express'
import { Server } from 'socket.io'
import router from './routes/index.js'
import cors from 'cors'

const app = express()

app.use(cors())
app.use(express.json())
app.use('/services', router)

const PORT = process.env.PORT || 3001

const server = app.listen(PORT, () => {
  console.log(`App listening port ${PORT}`)
})

const io = new Server(server, {
  cors: {
    origin: '*'
  }
})

io.on('connection', (socket) => {
  console.log('A client has connected')
})

app.locals.io = io
