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

    ClientID: ID
    Nombre: String
    Apellido: String
    Documento: Int
    mail: String
    password: String
    Puntos: Int
}


type Categoria{
    categoriaID: Int
    nombre: String
    descripcion: String
}

scalar Date

type Canje{
  canjeID: Int
  clientID: Int
  fecha: Date
  totalPuntos: Int
}

type canjeproducto{
  canjeID: Int
  productID: Int
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
    login(mail: String, password: String): [Cliente],
    canjes: [Canje],
    getUsers: [User],
    getUserInfo(id: Int) : User
  }

  type Mutation {
    addProducto(precio: Float, marca: String, descripcion: String, categoria: Int): Boolean
    addCategoria(nombre: String, descripcion: String): Categoria
    addCliente(Nombre: String, Apellido: String, Documento: Int, mail: String, password: String, Puntos: Int): Boolean
    addCanje(clientID: Int, fecha: Date, totalPuntos: Int, token: String, productos: [Producto]): [Canje]
    addCanjeProducto(canjeID: Int, productID: Int): [canjeproducto]
    updateUserInfo(id: Int, name: String, email: String, job_title: String) : Boolean
    createUser(name: String, email: String, job_title: String) : Boolean
    deleteUser(id: Int) : Boolean
  }
`);

const queryDB = (req, sql, args) => new Promise((resolve, reject) => {
    req.mysqlDb.query(sql, args, (err, rows) => {
        if (err)
            return reject(err);
        //console.log(rows);
        if(rows.insertId){
          resolve(rows.insertId)
        }else{
          resolve(rows)
        }
        //rows.changedRows || rows.affectedRows || rows.insertId ? resolve(rows) : resolve(rows);
    });
});

function generarToken(){
  return Math.random().toString(36).substr(2);

}

function validarToken(req, token){
  queryDB(req, "select * from token where token = '" + token + "' and vigente = 1 ")
  .then((data) => {
    console.log("data en funcion: ", data);
    if(data.length > 0){
      console.log("Entre al if");
      return true;
    }else{
      console.log("Entre al else");
      return false;
    }
  })

}

const root = {

  //QUERYS

  productos: (args, req) => queryDB(req, "select * from producto").then((data) => {console.log("Productos: ", data); return data;}),
  clientes: (args, req) => queryDB(req, "select * from cliente").then((data) => {console.log("Clientes", data); return data;}),
  categorias: (args, req) => queryDB(req, "select * from categoria").then((data) => {console.log("Categorias: ", data); return data;}),
  canjes: (args, req) => queryDB(req, "select * from canje").then((data) => {console.log("Canjes: ", data); return data;}),

  //MUTATIONS

  login: (args, req) => {
    queryDB(req, "select * from cliente where mail = ? and password = ?", [args.mail, args.password])
    .then((data) => {
      if(data.length > 0){
       let token = generarToken();
       console.log("Token", token);
       queryDB(req, "insert into token values('', " + data[0].ClientID + ", 1, '" + token + "')").then((data) => {console.log("Data Token: ", data); return data;});
       console.log("Login data: ", data);
       const productos = queryDB(req, "select * from producto").then((data) => {console.log("productos data: ", data); return data;})
        
       return data;
      } else{
        console.log("array vacio, data vacia");
      }
     //Else, devolver error
      
     })
  },
  addProducto: (args, req) => queryDB(req, "insert into producto SET ?", args).then((data) => {console.log(data); return data;}),
  addCliente: (args, req) => queryDB(req, "insert into cliente SET ?", args).then((data) => {console.log(data); return data;}),
  addCategoria: (args, req) => {
    queryDB(req, "insert into categoria SET ?", args)
    //.then(data => data);
    .then((data) => {
      const cat = JSON.parse(JSON.stringify(data));
      return cat.insertId;
    }).then((res) => {
      queryDB(req, "select * from categoria where categoriaID = " + cat.insertId)

      .then((data) => {

        //const result = Object.values(JSON.parse(JSON.stringify(data[0])));
        //console.log('result', result);
        console.log('data', JSON.parse(JSON.stringify(data)));
        console.log('data[0]', JSON.parse(JSON.stringify(data[0])));
        const result = JSON.parse(JSON.stringify(data[0]));
        return {result};

        //console.log('data[0][0]: ', data[0][0]);
        //return data[0][0];
      })

    })
  },
  addCanje: (args, req) => {
    //console.log("argumentos: ", args)

    
    /*const tokenValido = validarToken(req, args.token);
    if(!tokenValido){
      console.log("token invalido")
      return "Token invalido";
    }*/

    delete args["token"];
    queryDB(req, "insert into canje SET ?", args)
    .then((data) => {
      if(data){
       console.log("Add Canje: ", data);
       //const cliente = queryDB(req, "update cliente SET puntos = 1 where ClientID = ?", args.clientID)
       const canjes = queryDB(req, "select * from canje")
       .then((data) => {
         console.log("Canje data: ", data); 
         return data;
        });
       return canjes;
      } else{
        console.log("array vacio, data vacia", data);
      }
     //Else, devolver error
    }).catch(e => {
      console.log(e);
    })
  },
  addCanjeProducto: (args, req) => queryDB(req, "insert into canjeproducto SET ?", args)
  .then((data) => {
    console.log(data);
     return data;
  })
  //const puntos = queryDB(req, "insert into canjeproducto SET ?", args)

  

  /*getUsers: (args, req) => queryDB(req, "select * from users").then(data => data),
  getUserInfo: (args, req) => queryDB(req, "select * from users where id = ?", [args.id]).then(data => data[0]),
  updateUserInfo: (args, req) => queryDB(req, "update users SET ? where id = ?", [args, args.id]).then(data => data),
  createUser: (args, req) => queryDB(req, "insert into users SET ?", args).then(data => data),
  deleteUser: (args, req) => queryDB(req, "delete from users where id = ?", [args.id]).then(data => data)*/
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