const mysql = require("mysql2");
const inquirer = require("inquirer");

require("console.table");
require("dotenv").config();

const mysqlConnect = mysql.createConnection({
  host: "localhost",
  port: process.env.PORT || 3306,
  user: "root",
  dialect: "mysql",
  password: process.env.DB_PASSWORD,
  database: "employee_DB",
});

mysqlConnect.connect((err) => {
  if (err) throw err;
  console.log(`connected as id ${mysqlConnect.threadId}\n`);

  startPrompt();
});

function startPrompt() {
  const startQuestion = [
    {
      type: "list",
      name: "action",
      message: "Select an action from the list below.",
      loop: false,
      choices: [
        "View All Employees",
        "View All Roles",
        "View All Departments",
        "View Employees by Manager",
        "Add Employee",
        "Add Role",
        "Update Employee Role",
        "Update Employee Manager",
        "Delete an Employee",
        "Exit",
      ],
    },
  ];

  inquirer
    .prompt(startQuestion)
    .then((response) => {
      switch (response.action) {
        case "View All Employees":
          viewAll("employees");
          break;
        case "View All Roles":
          viewAll("roles");
          break;
        case "View All Departments":
          viewAll("departments");
          break;
        case "View Employees by Manager":
          viewEmployeeByManager();
          break;
        case "Add Employee":
          addEmployee();
          break;
        case "Add Department":
          addDepartment();
          break;
        case "Add Role":
          addRole();
          break;
        case "Update Employee Role":
          updateEmployeeRole();
          break;
        case "Update Employee Manager":
          updateManager();
          break;
        case "Delete an Employee":
          deleteEmployee();
          break;
        default:
        case "OK.":
          mysqlConnect.end();
      }
    })
    .catch((err) => {
      console.error(err);
    });
}

const viewAll = (table) => {
  let query;

  if (table === "departments") {
    console.log("DEPARTMENTS\n");
    query = `SELECT * FROM DEPARTMENT`;
  } else if (table === "roles") {
    console.log("ROLES\n");
    query = `SELECT * FROM ROLE`;
  } else {
    console.log("EMPLOYEES\n");
    query = `SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department, r.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager
          FROM employee e
          LEFT JOIN role r
            ON e.role_id = r.id
          LEFT JOIN department d
          ON d.id = r.department_id
          LEFT JOIN employee m
            ON m.id = e.manager_id`;
  }

  mysqlConnect.query(query, (err, res) => {
    if (err) throw err;
    console.table(res);

    startPrompt();
  });
};

const viewEmployeeByManager = () => {
  mysqlConnect.query("SELECT * FROM EMPLOYEE", (err, emplRes) => {
    if (err) throw err;

    const employeeChoice = [
      {
        name: "NULL",
        value: 0,
      },
    ];

    emplRes.forEach(({ first_name, last_name, id }) => {
      employeeChoice.push({
        name: first_name + " " + last_name,
        value: id,
      });
    });

    let questions = [
      {
        type: "list",
        name: "manager_id",
        choices: employeeChoice,
        message: "Which manager's team?",
      },
    ];

    inquirer
      .prompt(questions)
      .then((response) => {
        let manager_id, query;
        if (response.manager_id) {
          query = `SELECT E.id AS id, E.first_name AS first_name, E.last_name AS last_name, 
                R.title AS role, D.name AS department, CONCAT(M.first_name, " ", M.last_name) AS manager
                FROM EMPLOYEE AS E LEFT JOIN ROLE AS R ON E.role_id = R.id
                LEFT JOIN DEPARTMENT AS D ON R.department_id = D.id
                LEFT JOIN EMPLOYEE AS M ON E.manager_id = M.id
                WHERE E.manager_id = ?;`;
        } else {
          manager_id = null;
          query = `SELECT E.id AS id, E.first_name AS first_name, E.last_name AS last_name, 
                R.title AS role, D.name AS department, CONCAT(M.first_name, " ", M.last_name) AS manager
                FROM EMPLOYEE AS E LEFT JOIN ROLE AS R ON E.role_id = R.id
                LEFT JOIN DEPARTMENT AS D ON R.department_id = D.id
                LEFT JOIN EMPLOYEE AS M ON E.manager_id = M.id
                WHERE E.manager_id is null;`;
        }

        mysqlConnect.query(query, [response.manager_id], (err, res) => {
          if (err) throw err;
          if (res != "") {
            console.table(res);
          } else {
            console.log("This employee is not a manager.");
          }

          startPrompt();
        });
      })
      .catch((err) => {
        console.error(err);
      });
  });
};

const addEmployee = () => {
  mysqlConnect.query("SELECT * FROM EMPLOYEE", (err, employeeRes) => {
    if (err) throw err;

    const employeeChoice = [
      {
        name: "NULL",
        value: 0,
      },
    ];

    employeeRes.forEach(({ first_name, last_name, id }) => {
      employeeChoice.push({
        name: first_name + " " + last_name,
        value: id,
      });
    });

    mysqlConnect.query("SELECT * FROM ROLE", (err, roleRes) => {
      if (err) throw err;

      const roleChoice = [];
      roleRes.forEach(({ title, id }) => {
        roleChoice.push({
          name: title,
          value: id,
        });
      });

      let questions = [
        {
          type: "input",
          name: "first_name",
          message: "First name: ",
        },
        {
          type: "input",
          name: "last_name",
          message: "Last name: ",
        },
        {
          type: "list",
          name: "role_id",
          choices: roleChoice,
          message: "Select Employee Role.",
        },
        {
          type: "list",
          name: "manager_id",
          choices: employeeChoice,
          message: "Select employee manager.",
        },
      ];

      inquirer
        .prompt(questions)
        .then((response) => {
          const query = `INSERT INTO EMPLOYEE (first_name, last_name, role_id, manager_id) VALUES (?)`;

          let manager_id = response.manager_id !== 0 ? response.manager_id : null;

          mysqlConnect.query(query, [[response.first_name, response.last_name, response.role_id, manager_id]], (err, res) => {
            if (err) throw err;
            console.log(`${response.first_name} ${response.last_name} with id: ${res.insertId}, has been created.`);
            startPrompt();
          });
        })
        .catch((err) => {
          console.error(err);
        });
    });
  });
};

const addRole = () => {
  const departments = [];

  mysqlConnect.query("SELECT * FROM DEPARTMENT", (err, res) => {
    if (err) throw err;

    res.forEach((dep) => {
      let qObj = {
        name: dep.name,
        value: dep.id,
      };
      departments.push(qObj);
    });

    let questions = [
      {
        type: "input",
        name: "title",
        message: "Enter the new role title: ",
      },

      {
        type: "list",
        name: "department",
        choices: departments,
        message: "Select the new role department.",
      },
    ];

    inquirer
      .prompt(questions)
      .then((response) => {
        const query = `INSERT INTO ROLE (title, salary, department_id) VALUES (?)`;
        mysqlConnect.query(query, [[response.title, response.salary, response.department]], (err, res) => {
          if (err) throw err;
          console.log(`${response.title}, ${res.insertId} created`);
          startPrompt();
        });
      })
      .catch((err) => {
        console.error(err);
      });
  });
};

const updateEmployeeRole = () => {
  mysqlConnect.query("SELECT * FROM EMPLOYEE", (err, emplRes) => {
    if (err) throw err;

    const employeeChoice = [];
    emplRes.forEach(({ first_name, last_name, id }) => {
      employeeChoice.push({
        name: first_name + " " + last_name,
        value: id,
      });
    });

    mysqlConnect.query("SELECT * FROM ROLE", (err, rolRes) => {
      if (err) throw err;

      const roleChoice = [];
      rolRes.forEach(({ title, id }) => {
        roleChoice.push({
          name: title,
          value: id,
        });
      });

      let questions = [
        {
          type: "list",
          name: "id",
          choices: employeeChoice,
          message: "Select employee to update role.",
        },
        {
          type: "list",
          name: "role_id",
          choices: roleChoice,
          message: "Select new role for employee.",
        },
      ];

      inquirer
        .prompt(questions)
        .then((response) => {
          const query = `UPDATE EMPLOYEE SET ? WHERE ?? = ?;`;
          mysqlConnect.query(query, [{ role_id: response.role_id }, "id", response.id], (err) => {
            if (err) throw err;

            console.log("Updated employee role.");
            startPrompt();
          });
        })
        .catch((err) => {
          console.error(err);
        });
    });
  });
};

const updateManager = () => {
  mysqlConnect.query("SELECT * FROM EMPLOYEE", (err, emplRes) => {
    if (err) throw err;

    const employeeChoice = [];
    emplRes.forEach(({ first_name, last_name, id }) => {
      employeeChoice.push({
        name: first_name + " " + last_name,
        value: id,
      });
    });

    const managerChoice = [
      {
        name: "NULL",
        value: 0,
      },
    ];

    emplRes.forEach(({ first_name, last_name, id }) => {
      managerChoice.push({
        name: first_name + " " + last_name,
        value: id,
      });
    });

    let questions = [
      {
        type: "list",
        name: "id",
        choices: employeeChoice,
        message: "Select employee to update.",
      },
      {
        type: "list",
        name: "manager_id",
        choices: managerChoice,
        message: "Select new manager for employee.",
      },
    ];

    inquirer
      .prompt(questions)
      .then((response) => {
        const query = `UPDATE EMPLOYEE SET ? WHERE id = ?;`;
        let manager_id = response.manager_id !== 0 ? response.manager_id : null;
        mysqlConnect.query(query, [{ manager_id: manager_id }, response.id], (err, res) => {
          if (err) throw err;

          console.log("Updated manager for employee.");
          startPrompt();
        });
      })
      .catch((err) => {
        console.error(err);
      });
  });
};

const deleteEmployee = () => {
  mysqlConnect.query("SELECT * FROM EMPLOYEE", (err, res) => {
    if (err) throw err;

    const employeeChoice = [];
    res.forEach(({ first_name, last_name, id }) => {
      employeeChoice.push({
        name: first_name + " " + last_name,
        value: id,
      });
    });

    let questions = [
      {
        type: "list",
        name: "id",
        choices: employeeChoice,
        message: "Select employee to delete.",
      },
    ];

    inquirer
      .prompt(questions)
      .then((response) => {
        const query = `DELETE FROM EMPLOYEE WHERE id = ?`;
        mysqlConnect.query(query, [response.id], (err, res) => {
          if (err) throw err;
          console.log(`${res.affectedRows} has been deleted.`);
          startPrompt();
        });
      })
      .catch((err) => {
        console.error(err);
      });
  });
};
