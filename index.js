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
    token: String
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

type loginResponse{
  cliente: Cliente
  productos: [Producto]
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
    canjes: [Canje],
    getUsers: [User],
    getUserInfo(id: Int) : User
  }

  type Mutation {
    addProducto(precio: Float, marca: String, descripcion: String, categoria: Int): Boolean
    addCategoria(nombre: String, descripcion: String): Categoria
    addCliente(Nombre: String, Apellido: String, Documento: Int, mail: String, password: String, Puntos: Int): Boolean
    addCanje(token: String, productos: [Int]): [Canje]
    login(mail: String, password: String): loginResponse
    logout(token: String): Boolean
    addCanjeProducto(canjeID: Int, productID: Int): [canjeproducto]
    updateUserInfo(id: Int, name: String, email: String, job_title: String) : Boolean
    createUser(name: String, email: String, job_title: String) : Boolean
    deleteUser(id: Int) : Boolean
  }
`);

const queryDB = (req, sql, args) => new Promise((resolve, reject) => {
    req.mysqlDb.query(sql, args, (err, rows) => {
      console.log("sql", sql);
      console.log("ARGSSGSG: ", args);
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

async function validarToken(req, token){
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

  login: async (args, req) => {
    let user = await queryDB(req, "select * from cliente where mail = ? and password = ?", [args.mail, args.password])
        .then((data) => {
          console.log("Cliente data: ", data);
          if(data.length > 0) return data[0];
        });
    console.log("user", user);
    if(user){
      let token = generarToken();
      console.log("Token", token);

      queryDB(req, "insert into token values('', " + user.ClientID + ", 1, '" + token + "')")
      .then((data) => {
        console.log("New Token: id ", data); 
      }).catch((e) => console.log(e));

      user.token = token;
      let productos = await queryDB(req, "select * from producto")
        .then((data) => {
          let res = [];
          data.forEach(p => {
            res.push({...p});
          })
          console.log("RES: ", res); 
          return res;
        })
      const r = {cliente: user, productos: productos};
      console.log("R: ", r);
      return r;
    }else{
      console.log("Error");
      return false;
    }
  },

  logout: (args, req) => {
    queryDB(req, "DELETE FROM token WHERE clientID = (SELECT clientID FROM token WHERE token = ?)", args.token)
    .then((data) => {
      console.log("Canjes: ", data); 
      return data;
    })
    return true;  
  },

  addProducto: (args, req) =>{
   queryDB(req, "insert into producto SET ?", args)
   .then((data) => {
     console.log(data); 
     return data;
    })
  },

  addCliente: (args, req) =>{
   queryDB(req, "insert into cliente SET ?", args)
   .then((data) => {
     console.log(data); 
     return data;
    })
  },

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

   addCanje: async (args, req) => {
    //console.log("argumentos: ", args)

    /*const tokenValido = await validarToken(req, args.token);
    if(!tokenValido){
      console.log("token invalido")
      return "Token invalido";
    }
    delete args["token"];*/

    const clienteID = await queryDB(req, "select clientID from token where token = ?", args.token)
    .then((data) => {
      const c = {...data[0]};
      console.log("ID del cliente", c.clientID); 
      return c.clientID;
    })

    if(clienteID){
      const puntosCliente = await queryDB(req, "select Puntos from cliente where ClientID = ?", clienteID)
      .then((data) => {
        const p = {...data[0]};
        console.log("Puntos del cliente", p.Puntos); 
        return p.Puntos;
      })

      console.log("args", args.productos)
      const puntosProductos = await queryDB(req, "select sum(Precio) AS puntosTotales from producto where ProductID in ('" + args.productos.join("','") + "')")
      .then((data) => {
        const p = {...data[0]};
        console.log(p.puntosTotales);
        return p.puntosTotales;

      })
      if(puntosCliente > puntosProductos){
        const nuevoCanje = await queryDB(req, "insert into canje values ('', ?, ?, ?)", [clienteID, new Date().toISOString().slice(0, 10).replace('T', ' '), puntosProductos])
        .then((data) => {
          console.log("New canje data: ", data);
          return data; 
        })

        /*
        let values = []
        //args.productos.forEach( p => values.push("'" + nuevoCanje + "','" + p + "'"))
        args.productos.forEach( p => values.push("'" + nuevoCanje + "','" + p + "'"))
        console.log("VALUES: ", values);
        queryDB(req, "INSERT INTO canjeproducto VALUES (?)", values)
        .then((data) => {
          console.log("New canjeProducto: ", data);
          return data; 
        })
        */

      }else{

      }
    }

    
  },

    addCanjeProducto: (args, req) =>{
      queryDB(req, "insert into canjeproducto SET ?", args) 
      .then((data) => {
        console.log(data);
        return data;
    })
  },

};

//CONEXION BASE DE DATOS

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

//SERVIDOR

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

app.listen(4000);

console.log('Running a GraphQL API server at localhost:4000/graphql');