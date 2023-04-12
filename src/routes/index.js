import { Router } from 'express'
import { setServiceStatus, getGroupsInsights, getAllServices, getServicesBySystemStatus, getServicesByGroup, getService } from '../db/mock.js'

const router = new Router()

router.get('/', (req, res) => {
  const data = getAllServices()
  res.status(200).send(data)
})

router.get('/name/:name', (req, res) => {
  const data = getService(req.params.name)
  res.status(200).send(data)
})

router.get('/status/:status/:group?', (req, res) => {
  const data = getServicesBySystemStatus(req.params.status, req.params.group)
  res.status(200).send(data)
})

router.get('/group/:group', (req, res) => {
  const data = getServicesByGroup(req.params.group)
  res.status(200).send(data)
})

router.get('/groupInsights', (req, res) => {
  const data = getGroupsInsights()
  res.status(200).send(data)
})

router.post('/status/:name', (req, res) => {
  const name = req.params.name
  setServiceStatus(name, req.body)

  const data = getService(name)
  req.app.locals.io.emit('service:update', data)

  res.sendStatus(201)
})
export default router
