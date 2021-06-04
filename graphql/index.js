const { makeExecutableSchema } = require('graphql-tools');
const productos = [];

const typeDefs = `

type TablaPrueba{
    id: Int
}

type Producto{

    id: Int
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

type Canje{

    id: ID
    ProductoID: ID
    ClienteID: ID
    TotalCompra: Float
}

type Categoria{
    nombre: String
    descripcion: String
    productos: [Producto]
}

type Query{

    clientesPorDNI(DNI: ID): [Cliente]
    clientes: [Cliente]
    canjes: [Canje]
    productos: [Producto]
    productosPorCat(Categoria: String): [Producto]
}

type Mutation{
    crearCategoria(nombre: String, descripcion: String): Categoria
    addProducto(precio: Float, marca: String, descripcion: String, categoria: Int): Producto
    addTabla: TablaPrueba
}

`; 

const resolvers = {

    /*addProducto: (data) => {
        const p={'id': counter, 'precio': data.precio, 'marca': data.marca, 'descripcion': data.descripcion, 'categoria': data.categoria};
        productos.push(p);
        counter++;
        return p;
    }
*/
    Query: {
        async productos(_, args) {
            
            console.log(productos);
            return await productos;
        },
    },

    Mutation: {
        async addProducto(_, { precio, marca, descripcion, categoria }) {
            let newProducto = {
                id:0,
                precio,
                marca,
                descripcion,
                categoria
            };
            //return await models.producto.create( {precio, marca, descripcion, categoria} )
            return await productos.push(newProducto);
        },
        async addTabla(root, {models}){
            return await models.tablaPrueba.create
        }  
    },

}

// const queryDB = (req, sql, args) => new Promise((resolve, reject) => {
//     req.mysqlDb.query(sql, args, (err, rows) => {
//         if (err)
//             return reject(err);
//         rows.changedRows || rows.affectedRows || rows.insertId ? resolve(true) : resolve(rows);
//     });
// });

// var root = {
//   getUsers: (args, req) => queryDB(req, "select * from users").then(data => data),
//   getUserInfo: (args, req) => queryDB(req, "select * from users where id = ?", [args.id]).then(data => data[0])
// }; 

const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
});

module.exports = schema;