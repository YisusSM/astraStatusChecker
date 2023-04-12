import express from 'express'
import { Server } from 'socket.io'
import router from './routes/index.js'

const app = express()

app.use(express.json())
app.use('/services', router)

const PORT = process.env.PORT || 3000

const server = app.listen(PORT, () => {
  console.log(`App listening port ${PORT}`)
})

const io = new Server(server, {
  cors: {
    origin: '*'
  }
})

app.locals.io = io
