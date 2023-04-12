import data from './MOCK_DATA.json' assert { type: "json" };
import Ajv from 'ajv'

const ajv = new Ajv()
ajv.addFormat('date-time', (value) => {
  return !isNaN(Date.parse(value))
})

const serviceMetaSchema = {
  type: 'object',
  properties: {
    date: {
      type: 'string',
      format: 'date-time'
    },
    reason: {
      type: 'string',
    },
    system_status: {
      type: 'string',
    },
    status: {
      type: 'string',
    },
    incident_number: {
      type: 'string',
    }
  },
  required: [
    'date',
    'reason',
    'system_status',
    'status',
    'incident_number'
  ]
}

const mp = new Map()
data.forEach(e => {
  mp.set(e.name, {...e})
})

export function getAllServices () {
  return mpToArray(mp).sort(serviceSort)
}

/**
 * establece el estado de un servicio
 * @param {*} id
 * @param {*} meta
 */
export function setServiceStatus (name, meta) {
  const value = mp.get(name)
  if (!value) {
    throw new Error('Service not found')
  }

  const valid = ajv.validate(serviceMetaSchema, meta)
  if (!valid) {
    throw new Error('Invalid schema')
  }

  value.history.unshift(meta)
  value.current_system_status = meta.system_status
  mp.set(name, value)
}

/**
 * Retorna todos los servicios por estatus y opcional grupo
 * @param {*} status
 * @param {*} group
 */
export function getServicesBySystemStatus (status, group) {
  const arr = group ? getServicesByGroup(group) : getAllServices()

  return arr.filter((e) => {
    return e.current_system_status === status
  })
}

/**
 * Retorna los servicios dado un grupo, ordenados por status
 */
export function getServicesByGroup (group) {
  const res = mpToArray(mp)

  return res.filter((e) => {
    return e.group === group
  }).sort(serviceSort)
}

/**
 * Retorna la cantidad de servicios afectados por grupo
 * ejem: {
 *  h1: {
      red: 0,
      yellow: 1,
      green: 20
 *  }
 * },
 * h2: {
      red: 2,
      yellow: 0,
      green: 10
 * }
 */
export function getGroupsInsights () {
  const res = {}

  for (let e of mp.values()) {
    const group = res[e.group]
    if (!group) {
      res[e.group] = {
        green: 0,
        yellow: 0,
        red: 0
      }
    }

    res[e.group][e.current_system_status]++
  }

  return res
}

/**
 * retorna la info de un servicio dado el nombre
 * @param {*} name
 */
export function getService (name) {
  if (!mp.has(name)) {
    throw new Error('Service not found')
  }

  const value = mp.get(name)
  return value
}

/**
 * Retorna un array
 * @param {*} mp
 * @returns
 */
function mpToArray (mp) {
  return Array.from(mp, ([name, value]) => ({...value}))
}

/**
 * Ordena el resultado (array) de servicios basados en la prioridad del system_status
 * @param {*} res
 */
  const PRIORITY = {
    'green': 2,
    'yellow': 1,
    'red': 0
  }

function serviceSort (a, b) {
  const statusA = a.current_system_status
  const statusB = b.current_system_status

  return PRIORITY[statusA] - PRIORITY[statusB]
}
