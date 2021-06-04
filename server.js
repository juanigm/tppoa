const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const schema = require('./graphql');
const app = express();

const server = new ApolloServer({
    schema,
});

const db = require('./dbConnect')
db.connect(function(e) {
    if(e) throw e;
    console.log('Estas conectado a la base de datos')
})

server.applyMiddleware({ app });

app.listen(4000, () => {
    console.log("server running on http://localhost:4000/graphql" + server.graphqlPath);
});