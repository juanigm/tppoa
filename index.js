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
    Precio: Float
    Marca: String
    Descripcion: String
    categoria: Categoria
}

type Cliente{

    id: ID
    nombre: String
    apellido: String
    documento: Int
    mail: String
    password: String
    puntos: Int
    productosComprados: [Producto]
}


type Categoria{
    categoriaID: Int
    nombre: String
    descripcion: String
}

type Canje{

  id: ID
  ProductoID: Int
  ClienteID: Int
  TotalCompra: Float
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
    categorias: [Categoria],
    getUsers: [User],
    getUserInfo(id: Int) : User
  }

  type Mutation {
    addProducto(precio: Float, marca: String, descripcion: String, categoria: Int): Boolean
    addCategoria(nombre: String, descripcion: String): Boolean
    addCliente(nombre: String, apellido: String, documento: Int, mail: String, puntos: Int): Categoria
    login(mail: String, password: String): Boolean
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
        rows.changedRows || rows.affectedRows || rows.insertId ? resolve(rows) : resolve(rows);
    });
});

const root = {
  productos: (args, req) => queryDB(req, "select * from producto").then(data => data),
  addProducto: (args, req) => queryDB(req, "insert into producto SET ?", args).then((data) => {console.log(data); return data;}),
  clientes: (args, req) => queryDB(req, "select * from cliente").then(data => data),
  addCliente: (args, req) => queryDB(req, "insert into cliente SET ?", args).then((data) => {console.log(data); return data;}),
  login: (args, req) => queryDB(req, "select from cliente SET ? where mail = ? && contraseña = ?", [args.mail, args.contraseña]).then((data) => {console.log(data); return data;}),
  categorias: (args, req) => queryDB(req, "select * from categorias").then(data => data),

  addCategoria: (args, req) => {
    queryDB(req, "insert into categoria SET ?", args)
    .then((data) => {
      const cat = JSON.parse(JSON.stringify(data));
      console.log('data1: ', cat);
      queryDB(req, "select * from categoria where categoriaID = " + cat.insertId)
      .then((data) => {
        //const result = Object.values(JSON.parse(JSON.stringify(data[0])));
        //console.log('result', result);
        console.log('data', JSON.parse(JSON.stringify(data)));
        console.log('data[0]', JSON.parse(JSON.stringify(data[0])));
        const result = JSON.parse(JSON.stringify(data[0]));
        return result;

        //console.log('data[0][0]: ', data[0][0]);
        //return data[0][0];
      })
    })
  },

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