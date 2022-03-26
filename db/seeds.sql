INSERT INTO department (name)
VALUES ("Tech"),
        ("Developer"),
        ("Marketing"),
        ("Production"),
        ("Writer");

SELECT * FROM department;

INSERT INTO role (title, salary, department_id)
VALUES ("CEO", 200000, 1),
        ("Lead Designer", 175000, 1),
        ("Programs Director", 175000, 1),
        ("Marketing Director", 175000, 2),
        ("Accountant", 150000, 2),
        ("Marketing Manager", 100000, 3),
        ("HR Manager", 100000, 3),
        ("Hiring Manager", 100000, 4),
        ("Programs Associate", 100000, 4),
        ("Sales", 125000, 5),
        ("Lawyer", 190000, 5);

SELECT * FROM role;

INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ("Nat", "Bat", 9, NULL),
    ("Roy", "Kuni", 3, NULL),
    ("Jim", "Jones", 1, 2),
    ("Al", "Pacino", 5, NULL),
    ("Frank", "Gore", 4, 4),
    ("Lebron", "James", 10, NULL),
    ("Lionel", "Messi", 11, 6);


SELECT * FROM employee;