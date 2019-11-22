const express = require("express");
const app = express();
require('dotenv').config();
const path = require("path");

let mysql = require('mysql');
const getToken = require("./utils/functions"); 
const bodyParser = require('body-parser');
const cors = require('cors'); 
app.use(cors());
let middleware = require('./middlewares/middleware');
const jwt = require('jsonwebtoken');

app.use(bodyParser.json());

const port = process.env.PORT || "8080";

//MYSQL CONECTION 
let connection = mysql.createConnection({
	host: process.env.HOST,
	user: process.env.USER,
	password: process.env.PASSWORD,
	database: process.env.DATABASE
});

connection.connect(function(err) {
  if (err) {
    return console.error('error: ' + err.message);
  }
});

/**
 *  POST /login  
 */
app.post("/login", (req, res) => {
	const email = req.body.email; 
	const password = req.body.password; 
	const query = `
		SELECT users.name, users.type, users.id as idHitman 
		FROM users
		WHERE users.email='${email}' AND users.password='${password}'`; 
	
	connection.query(query, function (error, results, fields) {
		if (error) {
			res.status(500).json(error); 
		} else if (results.length === 0) {
			res.status(404).json({errCode: "auth/user-not-found"})
		} else {
			let token = getToken(req);
			let data = results[0]; 
			res.status(200).json({token, name: data.name, type: data.type, idHitman: data.idHitman}); 
		}
	});
});

/**
 *  POST /checkToken  
 */
app.post("/checkToken", (req, res) => {
	const token = req.body.token; 
	jwt.verify(token, process.env.SECRET, (err, decoded) => {
		if (err) 
			res.json({valid: false})
		else 
			res.json({valid: true})
	})
	
});

/**
 *  GET /assignments/id 
 */
app.get("/assignments/:id", middleware.checkToken, (req, res) => {
	const id = req.params.id; 

	const query = `
		SELECT assignments.id, assignments.descripction, assignmentStatus.statusName as status
		FROM assignments 
		INNER JOIN assignmentStatus ON assignments.assignmentStatus=assignmentStatus.id
		WHERE assignments.hitmanId=${id} 
	`; 
	connection.query(query, function (error, results) {
		if (error) {
			console.log(error);
			res.status(500).json(error); 
		} else {
			res.status(200).json(results); 
		}
	});
});

/**
 *  PUT /assignment/status 
 */
app.put("/assignment/status", middleware.checkToken, (req, res) => {
	const idAssignment = req.body.idAssignment; 
	const status = req.body.status; 

	const query_status = `SELECT id FROM assignmentStatus WHERE statusName='${status}';`; 
	connection.query(query_status, function (error, results) {
		if (error) {
			res.status(500).json(error); 
		} else {
			const query_update = `			
				UPDATE assignments SET assignmentStatus=${results[0].id} WHERE id=${idAssignment};
			`; 
			connection.query(query_update, function (error, results) {
				if (error) {
					res.status(500).json(error); 
				} else {
					res.status(201).json({}); 
				}
			})
		}
	});
	
});

/**
 *  GET /givenAssignments/:id  
 */
app.get("/givenAssignments/:id", middleware.checkToken, (req, res) => {
	const bossId = req.params.id; 

	const query = `	
		SELECT assignments.id, hitmans.idUser, assignments.descripction, assignments.assignmentStatus, 
		assignmentStatus.statusName as status, users.name as name
		FROM hitmans
		INNER JOIN assignments ON assignments.hitmanId=hitmans.idUser
		INNER JOIN assignmentStatus ON assignmentStatus.id=assignments.assignmentStatus
		INNER JOIN users ON hitmans.idUser=users.id
		WHERE hitmans.bossId=${bossId}; 
	`; 

	connection.query(query, function (error, results) {
		if (error) {
			res.status(500).json(error); 
		} else {
			res.status(200).json(results); 
		}
	});
	
});

/**
 *  GET /hitmans/:bossId
 */
app.get("/hitmans/:bossId", middleware.checkToken, (req, res) => {
	const bossId = req.params.bossId; 

	const query = `	
		SELECT users.id as hitmanId, hitmans.descripction, hitmansStatus.statusName as status, users.name
		FROM hitmans
		INNER JOIN hitmansStatus ON hitmansStatus.id=hitmans.statusId
		INNER JOIN users ON users.id=hitmans.idUser
		WHERE hitmans.bossId=${bossId};
	`; 

	connection.query(query, function (error, results) {
		if (error) {
			res.status(500).json(error); 
		} else {
			res.status(200).json(results); 
		}
	});
	
});

/**
 * All hitmans
 *  GET /hitmans/
 */
app.get("/hitmans/", middleware.checkToken, (req, res) => {
	const query = `	
		SELECT hitmans.id, hitmans.descripction, hitmansStatus.statusName as status, users.name
		FROM hitmans
		INNER JOIN users ON users.id=hitmans.idUser
		INNER JOIN hitmansStatus ON hitmans.statusId=hitmansStatus.id;`; 

	connection.query(query, function (error, results) {
		if (error) {
			res.status(500).json(error); 
		} else {
			res.status(200).json(results); 
		}
	});
	
});

/**
 * All bosses
 *  GET /bosses/
 */
app.get("/bosses/", middleware.checkToken, (req, res) => {
	const query = `SELECT * FROM users WHERE type='boss';`; 

	connection.query(query, function (error, results) {
		if (error) {
			res.status(500).json(error); 
		} else {
			res.status(200).json(results); 
		}
	});
	
});


/**
 * Add Asignment
 *  POST /addAssignment/
 */
app.post("/addAssignment/", middleware.checkToken, (req, res) => {

	const hitmanId = req.body.idHitman;
	const descripction = req.body.description;

	const query = `
		INSERT INTO assignments (descripction, assignmentStatus, hitmanId)
		VALUES ('${descripction}', 1, ${hitmanId});`; 

	connection.query(query, function (error, results) {
		if (error) {
			res.status(500).json(error); 
		} else {
			res.status(201).json({}); 
		}
	});
	
});


app.listen(port, () => {
	console.log(`Listening to requests on http://localhost:${port}`);
});