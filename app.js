const express = require('express')
const path = require('path')
const dbpath = path.join(__dirname, 'todoApplication.db')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const format = require('date-fns/format')
const isValid = require('date-fns/isValid')
const app = express()
app.use(express.json())

let db = null

const initializeDbAnsServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server Running at http:/localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: '${e.message}'`)
    process.exit(1)
  }
}
initializeDbAnsServer()

const checkqueries = (request, response, next) => {
  const {search_q, priority, category, date, status} = request.query
  const {todoId} = request.params
  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const categoryresult = categoryArray.includes(category)
    console.log(category)
    if (categoryresult === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const statusresult = statusArray.includes(status)
    if (statusresult === true) {
      request.status = status
      console.log(status)
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'LOW', 'MEDIUM']
    const priorityresult = priorityArray.includes(priority)
    if (priorityresult === true) {
      request.priority = priority
      console.log(priority)
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (date !== undefined) {
    try {
      const formatDate = format(new Date(date), 'yyyy-MM-dd')
      console.log(formatDate)
      const parseddate = new Date(formatDate)
      const isValidDate = isValid(parseddate)
      console.log(parseddate)
      console.log(isValidDate)
      if (isValidDate === true) {
        request.date = formatDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
    }
  }
  request.todoId = todoId
  request.search_q = search_q
  next()
}

const checkbody = async (request, response, next) => {
  const {id, todo, priority, category, dueDate, status} = request.body
  const {todoId} = request.params
  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const categoryresult = categoryArray.includes(category)
    if (categoryresult === true) {
      request.category = category
      console.log(category)
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const statusresult = statusArray.includes(status)
    if (statusresult === true) {
      request.status = status
      console.log(status)
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'LOW', 'MEDIUM']
    const priorityresult = priorityArray.includes(priority)
    if (priorityresult === true) {
      request.priority = priority
      console.log(priority)
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }
  if (dueDate !== undefined) {
    try {
      const formatDate = format(new Date(dueDate), 'yyyy-MM-dd')
      console.log(formatDate)
      const parseddate = new Date(formatDate)
      const isValidDate = isValid(parseddate)
      console.log(parseddate)
      console.log(isValidDate)
      if (isValidDate === true) {
        request.dueDate = formatDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
    }
  }
  request.id = id
  request.todo = todo
  request.todoId = todoId

  next()
}

app.get('/todos/', checkqueries, async (request, response) => {
  const {search_q = '', priority = '', status = '', category = ''} = request
  const query = `
    select 
    id, todo,  priority, status, category, due_date as dueDate
    from todo
    where todo like '%${search_q}%'
    and priority like'%${priority}%'
    and status like'%${status}%'
    and category like '%${category}%';
    `
  try {
    const result = await db.all(query)
    response.send(result)
  } catch (e) {
    console.log(`DB Error: '${e.message}'`)
  }
})

app.get('/todos/:todoId/', checkqueries, async (request, response) => {
  const {todoId} = request.params
  const query = `
    select 
    id, todo, priority, status, category, due_date as dueDate
    from todo
    where id=${todoId}`
  const result = await db.get(query)
  response.send(result)
})

app.get('/agenda/', checkqueries, async (request, response) => {
  const {date} = request
  const query = `
    select 
    id, todo,   priority, status,  category, due_date as dueDate
    from todo
    where 
    due_date='${date}'
    `
  const result = await db.all(query)

  if (result === undefined) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    response.send(result)
  }
})

app.post('/todos/', checkbody, async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request
  const query = `
    insert into todo (id, todo, priority, status, category, due_date)
    values(${id}, '${todo}', '${priority}', '${status}', '${category}', '${dueDate}')`
  const result = await db.run(query)
  console.log(result)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', checkbody, async (request, response) => {
  const {todo, priority, status, category, dueDate} = request
  const {todoId} = request.params
  let updatequery = null

  switch (true) {
    case status !== undefined:
      updatequery = `
            update 
            todo
            set
            status='${status}'
            where
            id=${todoId}`
      await db.run(updatequery)
      response.send('Status Updated')
      break

    case priority !== undefined:
      updatequery = `
            update 
            todo
            set
            priority='${priority}'
            where
            id=${todoId}`
      await db.run(updatequery)
      response.send('Priority Updated')
      break

    case todo !== undefined:
      updatequery = `
            update 
            todo
            set
            todo='${todo}'
            where
            id=${todoId}`
      await db.run(updatequery)
      response.send('Todo Updated')
      break

    case category !== undefined:
      updatequery = `
            update 
            todo
            set
            category='${category}'
            where
            id=${todoId}`
      await db.run(updatequery)
      response.send('Category Updated')
      break

    case dueDate !== undefined:
      updatequery = `
            update 
            todo
            set
            due_date='${dueDate}'
            where
            id=${todoId}`
      await db.run(updatequery)
      response.send('Due Date Updated')
      break
  }
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const query = `
        delete from todo
        where
        id=${todoId}`
  await db.run(query)
  response.send('Todo Deleted')
})

module.exports = app
