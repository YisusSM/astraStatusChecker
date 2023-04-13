import { Router } from 'express'
import {
  setServiceStatus,
  getGroupsInsights,
  getAllServices,
  getServicesBySystemStatus,
  getServicesByGroup,
  getService,
  getDateHistory
} from '../db/mock.js'

const router = new Router()

router.get('/', (req, res) => {
  console.log('Getting all services')
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

router.get('/incidentHistory', (req, res) => {
  const data = getDateHistory()
  res.status(200).send(data)
})

router.post('/status/:name', (req, res) => {
  const name = req.params.name
  setServiceStatus(name, req.body)

  const serviceInfo = getService(name)
  req.app.locals.io.emit('service:update', {
    service: serviceInfo
  })

  res.sendStatus(201)
})

export default router
