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

app.use(bodyParser.json());

const port = process.env.PORT || "8080";

//MYSQL CONECTION 
let connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'root',
	database: 'hitmanDB'
});

connection.connect(function(err) {
  if (err) {
    return console.error('error: ' + err.message);
  }
});


/**
 * root GET 
 */
app.get("/", (req, res) => {
	/* const query = 'SELECT * FROM hitmans;'; 
	connection.query(query, function (error, results, fields) {
		// error will be an Error if one occurred during the query
		// results will contain the results of the query
		// fields will contain information about the returned results fields (if any)
		console.log(results);
		res.status(200).json(results);
	}); */
	console.log(process.env.SECRET)
	let token = getToken(req);
	console.log(token);
	res.send(token); 
});

/**
 *  POST /login  
 */
app.post("/login", (req, res) => {
	const email = req.body.email; 
	const password = req.body.password; 

	const query = `SELECT * FROM users WHERE email='${email}' AND password='${password}'`; 
	connection.query(query, function (error, results, fields) {
		if (error) {
			res.status(500).json(error); 
		} else if (results.length === 0) {
			res.status(404).json({errCode: "auth/user-not-found"})
		} else {
			let token = getToken(req);
			res.status(200).json({token, name: results[0].name, type: results[0].type}); 
		}
	});
});

app.listen(port, () => {
	console.log(`Listening to requests on http://localhost:${port}`);
});