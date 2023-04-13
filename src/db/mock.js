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
  mp.set(e.name, e)
})

// Mapa de padre -> array de hijos
const children = new Map()
data.forEach(e => {
  const parents = e.parents

  for (let p of parents) {
    const value = children.get(p)
    if (!value) {
      children.set(p, [e.name])
    }

    else {
      value.push(e.name)
      children.set(p, value)
    }
  }
})

const dateHistory = new Map()
data.forEach(e => {
  if (!e.history || e.history.length === 0) {
    return
  }

  e.history.forEach((h) => {
    const key = h.date.toLocaleDateString()
    const value = mp.get(key)

    if (!value) {
      mp.set(key, [{
        service: e,
        ...h
      }])
    }

    else {
      value.push({
        service: e,
        ...h
      })
      mp.set(key, value)
    }
  })
})

export function getAllServices () {
  const res = mpToArray(mp).sort(groupSort)
  return res.sort(serviceSort)
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

  if (value.current_system_status === meta.system_status) {
    console.warn('Servicio con el mismo status')
    return
  }

  const mxStatus = getPredominantState(name)
  if (mxStatus < PRIORITY[meta.system_status]) {
    console.warn("Can't change service status until all of his parents have the same status")
    return
  }

  // xd
  meta.date = new Date().toISOString()

  value.history.unshift(meta)
  value.current_system_status = meta.system_status
  mp.set(name, value)

  saveDateHistory(name, meta)
  dfs(name, {
    reason: `Dependency ${name} - ${meta.reason}`,
    date: meta.date,
    system_status: meta.system_status,
    status: meta.status,
    incident_number: meta.incident_number
  })
}

function saveDateHistory (name, meta) {
  const date = new Date(meta.date)
  const key = date.toLocaleDateString()
  const value = dateHistory.get(key)

  if (!value) {
    dateHistory.set(key, [{
        service: name,
        ...meta
      }])
  }

  else {
    value.push({
      service: name,
      ...meta
    })
    dateHistory.set(key, value)
  }
}

/**
 * Aplicamos un dfs a todos los servicios hijo del parent
 * Si parent cambio a rojo, todos sus hijos cambiaran a rojo y los hijos de sus hijos
 * @param {*} parent
 * @param {*} status
 */
function dfs (parent, meta) {
  if (!children.has(parent)) {
    return
  }

  const queue = children.get(parent).slice()
  const visited = new Set()
  visited.add(parent)

  while (queue.length > 0) {
    const current = queue.shift()
    const mxStatus = getPredominantState(current)
    const curr = mp.get(current)

    if (curr.current_system_status === meta.system_status || mxStatus < PRIORITY[meta.system_status]) {
      continue
    }

    curr.current_system_status = meta.system_status
    curr.history.unshift(meta)
    visited.add(current)
    saveDateHistory(parent, meta)

    const nextChildren = children.get(current)
    if (!nextChildren) {
      continue
    }
    for (let c of nextChildren) {
      if (visited.has(c)) {
        continue
      }

      queue.push(c)
    }
  }
}

export function getDateHistory () {
  const res = []
  for (let k of dateHistory.keys()) {
    const obj = {
      date: k,
      history: []
    }

    const value = dateHistory.get(k)
    value.forEach(e => {
      obj.history.unshift(e)
    })

    obj.history.sort((a, b) => {
      return new Date(b.date) - new Date(a.date)
    })

    res.push(obj)
  }

  return res
}

/**
 * Retorna el estado del servicio dado sus dependencias
 * Si alguna de sus dependencias esta en rojo, el estado del servicio sera rojo
 * @param {*} serviceName
 */
function getPredominantState (serviceName) {
  const service = mp.get(serviceName)
  if (!service) {
    throw new Error('Service not found')
  }

  const parents = service.parents
  let ans = PRIORITY.green
  for (let p of parents) {
    const parent = mp.get(p)
    const status = parent.current_system_status

    if (status === 'red') {
      return PRIORITY.red
    }

    ans = Math.min(ans, PRIORITY[status])
  }

  return ans
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
  let res = mpToArray(mp)

  res = res.filter((e) => {
    return e.group === group
  })

  res.sort(nameSort)
  return res.sort(serviceSort)
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

  return Object.keys(res).map((e) => {
    return {
      group: e,
      insights: {
        ...res[e]
      }
    }
  }).sort((a, b) => {
    const insightsA = a.insights
    const insightsB = b.insights

    const valA = (insightsA.yellow * -1) + (insightsA.red * -2)
    const valB = (insightsB.yellow * -1) + (insightsB.red * -2)

    return valA - valB
  })
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
  return Array.from(mp, ([name, value]) => (value))
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

function groupSort (a, b) {
  return ('' + a.group).localeCompare(b.group)
}

function nameSort (a, b) {
    return ('' + a.name).localeCompare(b.name)
}
