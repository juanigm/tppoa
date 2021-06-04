const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mysql = require('mysql');
const cors = require('cors')

const app = express();
app.use(cors())

const schema = buildSchema(`

type Producto{

    ProductID: Int
    precio: Float
    marca: String
    descripcion: String
    categoria: String
}

type Cliente{

    id: ID
    nombre: String
    apellido: String
    documento: Int
    puntos: Int
    productosComprados: [Producto]
}

type User {
    id: String
    name: String
    job_title: String
    email: String
  }

  type Query {
    productos: [Producto],
    clientes: [Cliente],
    getUsers: [User],
    getUserInfo(id: Int) : User
  }
  type Mutation {
    addProducto(precio: Float, marca: String, descripcion: String, categoria: Int): Boolean
    updateUserInfo(id: Int, name: String, email: String, job_title: String) : Boolean
    createUser(name: String, email: String, job_title: String) : Boolean
    deleteUser(id: Int) : Boolean
  }
`);

const queryDB = (req, sql, args) => new Promise((resolve, reject) => {
    req.mysqlDb.query(sql, args, (err, rows) => {
        if (err)
            return reject(err);
        console.log(rows);
        rows.changedRows || rows.affectedRows || rows.insertId ? resolve(true) : resolve(rows);
    });
});

const root = {
  productos: (args, req) => queryDB(req, "select * from producto").then(data => data),
  addProducto: (args, req) => queryDB(req, "insert into producto SET ?", args).then((data) => {console.log(data); return data;}),
  clientes: (args, req) => queryDB(req, "select * from cliente").then(data => data),
  getUsers: (args, req) => queryDB(req, "select * from users").then(data => data),
  getUserInfo: (args, req) => queryDB(req, "select * from users where id = ?", [args.id]).then(data => data[0]),
  updateUserInfo: (args, req) => queryDB(req, "update users SET ? where id = ?", [args, args.id]).then(data => data),
  createUser: (args, req) => queryDB(req, "insert into users SET ?", args).then(data => data),
  deleteUser: (args, req) => queryDB(req, "delete from users where id = ?", [args.id]).then(data => data)
};

app.use((req, res, next) => {
  req.mysqlDb = mysql.createConnection({
    host     : 'localhost',
    user     : 'tppoa',
    password : 'Ignacio321',
    database : 'tp_poa'
  });
  req.mysqlDb.connect();
  next();
});

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

app.listen(4000);

console.log('Running a GraphQL API server at localhost:4000/graphql');