const mysql = require('mysql2')
const conection = mysql.createConnection({ 
    host: 'localhost',
    user: 'tppoa',
    password: 'Ignacio321'
 });

module.exports = conection;