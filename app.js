/*
1|Learn Node JS|HIGH|IN PROGRESS|LEARNING|2021-04-04
2|Buy a Car|MEDIUM|TO DO|HOME|2020-09-22
3|Clean the garden|LOW|TO DO|HOME|2021-02-22
4|Fix the bug|MEDIUM|DONE|WORK|2021-01-12
5|Submit the report|LOW|TO DO|WORK|2021-04-02 */

const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server running at http://localhost:3001/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const outputResponse = (dbObj) => {
  return {
    id: dbObj.id,
    todo: dbObj.todo,
    priority: dbObj.priority,
    status: dbObj.status,
    category: dbObj.category,
    dueDate: dbObj.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    //scenario.3
    /*...priority and status.....*/
    case hasPriorityAndStatusProperties(request.query):
      if (priority == "HIGH" || priority == "MEDIUM" || priority == "LOW") {
        if (status == "TO DO" || status == "IN PROGRESS" || status == "DONE") {
          getTodoQuery = `SELECT *FROM todo
                WHERE status='${status}' AND priority='${priority}';`;
          dataResp = await db.all(getTodoQuery);
          response.send(dataResp.map((each) => outputResponse(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //Scenario.5
    /*.....category and status....*/
    case hasCategoryAndStatus(request.query):
      if (category == "WORK" || category == "HOME" || category == "LEARNING") {
        if (status == "TO DO" || status == "IN PROGRESS" || status == "DONE") {
          getTodoQuery = `SELECT *FROM todo
                WHERE  category ='${category}' AND status= '${status}';`;
          dataResp = await db.all(getTodoQuery);
          response.send(dataResp.map((each) => outputResponse(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //Scenario.7
    /*..Category and Priority..  */
    case hasCategoryAndPriority(request.query):
      if (category == "WORK" || category == "HOME" || category == "LEARNING") {
        if (priority == "HIGH" || priority == "MEDIUM" || priority == "LOW") {
          getTodoQuery = `SELECT *FROM todo
                WHERE  category ='${category}' AND priority= '${priority}';`;
          dataResp = await db.all(getTodoQuery);
          response.send(dataResp.map((each) => outputResponse(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //Scenario.2
    /*...has only priority...*/
    case hasPriorityProperty(request.query):
      if (priority == "HIGH" || priority == "MEDIUM" || priority == "LOW") {
        getTodoQuery = `SELECT* FROM todo WHERE priority= '${priority}';`;
        dataResp = await db.all(getTodoQuery);
        response.send(dataResp.map((each) => outputResponse(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //Scenario.1
    /*...has only status...*/
    case hasStatusProperty(request.query):
      if (status == "TO DO" || status == "IN PROGRESS" || status == "DONE") {
        getTodoQuery = `SELECT* FROM todo WHERE status= '${status}';`;
        dataResp = await db.all(getTodoQuery);
        response.send(dataResp.map((each) => outputResponse(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    //Scenario.4
    /*...has only search...*/
    case hasSearchProperty(request.query):
      getTodoQuery = `SELECT* FROM todo WHERE todo LIKE '%${search_q}%';`;
      dataResp = await db.all(getTodoQuery);
      response.send(dataResp.map((each) => outputResponse(each)));

      break;
    //Scenario.6
    /*...has only category..*/
    case hasCategoryProperty(request.query):
      if (category == "WORK" || category == "HOME" || category == "LEARNING") {
        getTodoQuery = `SELECT *FROM todo
                WHERE  category ='${category}';`;
        dataResp = await db.all(getTodoQuery);
        response.send(dataResp.map((each) => outputResponse(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //default all todos
    default:
      getTodoQuery = `SELECT *FROM todo;`;
      dataResp = await db.all(getTodoQuery);
      response.send(dataResp.map((each) => outputResponse(each)));
  }
});

//2.specific todo based on todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoQuery = `SELECT *FROM todo 
                        WHERE id= ${todoId};`;
  const todoResp = await db.get(todoQuery);
  response.send(outputResponse(todoResp));
});

//3.List of todos with specific due date
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(isMatch(date, "yyyy-MM-dd"));
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    const requestQuery = `SELECT *FROM todo WHERE due_date='${newDate}';`;
    const dateResp = await db.all(requestQuery);
    response.send(dateResp.map((each) => outputResponse(each)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//4.Create a todo in todo table
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority == "HIGH" || priority == "MEDIUM" || priority == "LOW") {
    if (status == "TO DO" || status == "IN PROGRESS" || status == "DONE") {
      if (category == "WORK" || category == "HOME" || category == "LEARNING") {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `INSERT INTO 
                        todo(id, todo,category, priority,status,due_date)
                        VALUES(${id}, '${todo}','${category}', '${priority}', '${status}','${postNewDueDate}');`;
          await db.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//5.Update details of specific todo
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  const prevTodoQuery = `SELECT *FROM todo 
                        WHERE id= ${todoId};`;
  const prevTodoResp = await db.get(prevTodoQuery);
  const {
    todo = prevTodoResp.todo,
    priority = prevTodoResp.priority,
    status = prevTodoResp.status,
    category = prevTodoResp.category,
    dueDate = prevTodoResp.dueDate,
  } = request.body;

  switch (true) {
    //update status
    case requestBody.status !== undefined:
      if (status == "TO DO" || status == "IN PROGRESS" || status == "DONE") {
        updateQuery = `UPDATE todo 
                            SET
                        todo='${todo}',
                        priority='${priority}',
                        status='${status}',
                        priority='${priority}',
                        category= '${category}',
                        due_date='${dueDate}'
                        WHERE id= ${todoId};`;
        await db.run(updateQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    //Update priority
    case requestBody.priority !== undefined:
      if (priority == "HIGH" || priority == "MEDIUM" || priority == "LOW") {
        updateQuery = `UPDATE todo 
                            SET
                        todo='${todo}',
                        priority='${priority}',
                        status='${status}',
                        priority='${priority}',
                        category= '${category}',
                        due_date='${dueDate}'
                        WHERE id= ${todoId};`;
        await db.run(updateQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //Update todo
    case requestBody.todo !== undefined:
      updateQuery = `UPDATE todo 
                            SET
                        todo='${todo}',
                        priority='${priority}',
                        status='${status}',
                        priority='${priority}',
                        category= '${category}',
                        due_date='${dueDate}'
                        WHERE id= ${todoId};`;
      await db.run(updateQuery);
      response.send("Todo Updated");
      break;

    //Update Category
    case requestBody.category !== undefined:
      if (category == "WORK" || category == "HOME" || category == "LEARNING") {
        updateQuery = `UPDATE todo 
                            SET
                        todo='${todo}',
                        priority='${priority}',
                        status='${status}',
                        priority='${priority}',
                        category= '${category}',
                        due_date='${dueDate}'
                        WHERE id= ${todoId};`;
        await db.run(updateQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //Update dueDate
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateQuery = `UPDATE todo 
                            SET
                        todo='${todo}',
                        priority='${priority}',
                        status='${status}',
                        priority='${priority}',
                        category= '${category}',
                        due_date='${newDueDate}'
                        WHERE id= ${todoId};`;
        await db.run(updateQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

//6.Deletes todo from todo table
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const delQuery = `DELETE FROM todo 
                        WHERE id=${todoId};`;
  await db.run(delQuery);
  response.send("Todo Deleted");
});

module.exports = app;
