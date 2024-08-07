"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Importação separada do Express e tipos Request e Response
var express = require("express");
var app = express.default();
var port = 3000;
app.get('/', function (req, res) {
    console.log('oi');
    res.send('Hello World!');
});
app.listen(port, function () {
    console.log("Server is running at http://localhost:".concat(port));
});
