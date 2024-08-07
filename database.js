const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('banco.db');
const dbPcriado = new sqlite3.Database('bancoPcriado.db');
const dbVendas = new sqlite3.Database('vendas.db')


db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            code INTEGER NOT NULL,
            validade TEXT NOT NULL,
            item_value INTEGER NOT NULL
        )
    `);
});

dbPcriado.serialize(() => {
    dbPcriado.run(`
        CREATE TABLE IF NOT EXISTS inventoryPcriado (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_name TEXT NOT NULL,
            code INTEGER NOT NULL,
            item_value INTEGER NOT NULL
        )
    `);
});


dbVendas.serialize(() => {
    dbVendas.run(`
        CREATE TABLE IF NOT EXISTS days (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL UNIQUE
        )
    `);

    dbVendas.run(`
        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            day_id INTEGER,
            item_name TEXT,
            quantidade INTEGER,
            preco INTEGER,
            code INTEGER,
            FOREIGN KEY(day_id) REFERENCES days(id)
        )
    `);
  
});


function getItemsVendas() {
    return new Promise((resolve, reject) => {
        dbVendas.all("SELECT * FROM inventoryVendas", (err, rows) => {
            if (err) {
                reject(err);
            } else {
                // Converta a string JSON de volta para um array
                rows.forEach(row => {
                    row.vendidos = JSON.parse(row.vendidos);
                });
                resolve(rows);
            }
        });
    });
}

function getItemsVendasByDate(date) {
    return new Promise((resolve, reject) => {
        dbVendas.all("SELECT * FROM inventoryVendas WHERE date = ?", [date], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                console.log(rows)

                {/* 
                rows.forEach(row => {
                    row.vendidos = JSON.parse(row.vendidos);
                });
            */}


                resolve(rows);
            }
        });
    });
}

function addItemVendas(date, vendidos) {

    return new Promise((resolve, reject) => {

        const stmt = dbVendas.prepare("INSERT INTO inventoryVendas (date,vendidos) VALUES (?, ?)");
        stmt.run(date, vendidos, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });

        stmt.finalize();
    });
}





function addItem(item_name, quantity, code, validade, item_value) {

    return new Promise((resolve, reject) => {

        const stmt = db.prepare("INSERT INTO inventory (item_name, quantity,code,validade, item_value) VALUES (?, ?, ?, ?, ?)");
        stmt.run(item_name, quantity, code, validade, item_value, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
        stmt.finalize();
    });
}



function addDay(date) {
    return new Promise((resolve, reject) => {
        const stmt = dbVendas.prepare("INSERT INTO days (date) VALUES (?)");
        stmt.run(date, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
        stmt.finalize();
    });
}

function addDay(date) {
    return new Promise((resolve, reject) => {
        const stmt = dbVendas.prepare("INSERT INTO days (date) VALUES (?)");
        stmt.run(date, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
        stmt.finalize();
    });
}

function addVendas(date, item_name, code, quantidade, preco) {

    return new Promise((resolve, reject) => {
        // Verifica se o dia já existe, senão adiciona
    
        dbVendas.get("SELECT id FROM days WHERE date = ?", [date], (err, row) => {
            if (err) {
                return reject(err);
            }

            const dayIdPromise = row ? Promise.resolve(row.id) : addDay(date);

            dayIdPromise.then(dayId => {
                const stmt = dbVendas.prepare("INSERT INTO sales (day_id, item_name, code, quantidade, preco) VALUES (?, ?, ?, ?, ?)");
                stmt.run(dayId, item_name, code, quantidade, preco, function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
                stmt.finalize();
            }).catch(reject);
        });
    });
}

function removeVenda(date, code) {
    return new Promise((resolve, reject) => {
        const query = `
            DELETE FROM sales
            WHERE rowid = (
                SELECT sales.rowid
                FROM sales
                JOIN days ON sales.day_id = days.id
                WHERE days.date = ? AND sales.code = ?
                LIMIT 1
            )
        `;
        dbVendas.run(query, [date, code], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}






function addItemPcriado(item_name, code, item_value) {

    return new Promise((resolve, reject) => {
        const stmt = dbPcriado.prepare("INSERT INTO inventoryPcriado (item_name, code, item_value) VALUES (?, ?, ?)");
        stmt.run(item_name, code, item_value, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
        stmt.finalize();

    });
}

function getItemsPcriado() {
    return new Promise((resolve, reject) => {

        dbPcriado.all("SELECT * FROM inventoryPcriado", (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function getItems() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM inventory", (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

async function removeItem(code) {
    return new Promise((resolve, reject) => {
        db.get("SELECT quantity FROM inventory WHERE code = ?", [code], (err, row) => {
            if (err) {
                reject(err);
            } else if (row) {
                console.log(`Quantidade do item com código ${code}: ${row.quantity}`);
                db.run("DELETE FROM inventory WHERE code = ?", [code], function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            } else {
                console.log(`Item com código ${code} não encontrado.`);
                resolve(); // Resolve mesmo que o item não tenha sido encontrado, caso contrário, o Promise ficará pendente
            }
        });
    });
}

async function menosUmItem(code) {
    return new Promise((resolve, reject) => {
        db.get("SELECT quantity FROM inventory WHERE code = ?", [code], (err, row) => {
            if (err) {
                reject(err);
            } else if (row) {
                if (row.quantity > 0) {
                    console.log(`Quantidade do item com código ${code}: ${row.quantity}`);
                    const newQuantity = row.quantity - 1;
                    if (newQuantity === 0) {
                        db.get("DELETE FROM inventory WHERE code = ?", [code], (err) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve();
                            }

                        })
                    }
                    db.run("UPDATE inventory SET quantity = ? WHERE code = ?", [newQuantity, code], function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    console.log(`A quantidade do item de código ${code} é 0.`);
                    db.get("DELETE FROM inventory WHERE code = ?", [code], (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }

                    })
                    resolve(); // Resolve mesmo que a quantidade seja 0, pois não há nada a decrementar
                }
            } else {
                console.log(`Item com codigo ${code} não encontrado.`);
                resolve(); // Resolve mesmo que o item não tenha sido encontrado, caso contrário, o Promise ficará pendente
            }
        });
    });
}

async function removerItemVendido(code, vendido) {
    return new Promise((resolve, reject) => {
        db.get("SELECT quantity FROM inventory WHERE code = ?", [code], (err, row) => {
            if (err) {
                reject(err);
            } else if (row) {
                if (row.quantity > 0) {
                    console.log(`Quantidade do item com código ${code}: ${row.quantity}`);
                    const newQuantity = row.quantity - vendido;
                    if (newQuantity === 0) {
                        db.get("DELETE FROM inventory WHERE code = ?", [code], (err) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve();
                            }

                        })
                    }
                    db.run("UPDATE inventory SET quantity = ? WHERE code = ?", [newQuantity, code], function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    console.log(`A quantidade do item de código ${code} é 0.`);
                    db.get("DELETE FROM inventory WHERE code = ?", [code], (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }

                    })
                    resolve(); // Resolve mesmo que a quantidade seja 0, pois não há nada a decrementar
                }
            } else {
                console.log(`Item com codigo ${code} não encontrado.`);
                resolve(); // Resolve mesmo que o item não tenha sido encontrado, caso contrário, o Promise ficará pendente
            }
        });
    });
}

function getAllSales() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                days.date, 
                sales.item_name, 
                sales.quantidade, 
                sales.preco, 
                sales.code
            FROM sales
            JOIN days ON sales.day_id = days.id
        `;
        dbVendas.all(query, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}



function getSalesByDate(date) {
    return new Promise((resolve, reject) => {
        // item_name, code, quantidade, preco
        const query = `
            SELECT  sales.item_name, sales.code, sales.quantidade, sales.preco
            FROM sales
            JOIN days ON sales.day_id = days.id
            WHERE days.date = ?
        `;
        if(!date){
            reject(err)
        }else{

            dbVendas.all(query, [date], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });

        }
    
    });
}



function addDay(date) {
    return new Promise((resolve, reject) => {
        const stmt = dbVendas.prepare("INSERT INTO days (date) VALUES (?)");
        stmt.run(date, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
        stmt.finalize();
    });
}




async function retornarItemVendido(code, vendido) {
    return new Promise((resolve, reject) => {
        db.get("SELECT quantity FROM inventory WHERE code = ?", [code], (err, row) => {
            if (err) {
                return reject(err);
            }

            if (row) {
                const newQuantity = row.quantity + vendido;
                db.run("UPDATE inventory SET quantity = ? WHERE code = ?", [newQuantity, code], function (err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            } else {
                console.log(`Item com codigo ${code} nao encontrado.`);
                resolve(); // Resolve mesmo que o item não tenha sido encontrado, caso contrário, o Promise ficará pendente
            }
        });
    });
}


async function maisUmItem(code) {
    return new Promise((resolve, reject) => {
        db.get("SELECT quantity FROM inventory WHERE code = ?", [code], (err, row) => {
            if (err) {
                reject(err);
            } else if (row) {
                if (row.quantity > 0) {
                    console.log(`Quantidade do item com código ${code}: ${row.quantity}`);
                    const newQuantity = row.quantity + 1;

                    db.run("UPDATE inventory SET quantity = ? WHERE code = ?", [newQuantity, code], function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    console.log(`Ocorreu um erro aqui neste item de codigo :${code}`);

                    reject(err); // Resolve mesmo que a quantidade seja 0, pois não há nada a decrementar
                }
            } else {
                console.log(`Item com codigo ${code} não encontrado.`);
                resolve(); // Resolve mesmo que o item não tenha sido encontrado, caso contrário, o Promise ficará pendente
            }
        });
    });
}



async function removeItemPcriado(code) {
    return new Promise((resolve, reject) => {
        dbPcriado.get("SELECT item_name FROM inventoryPcriado WHERE code = ?", [code], (err, row) => {
            if (err) {
                reject(err);
            } else if (row) {

                dbPcriado.run("DELETE FROM inventoryPcriado WHERE code = ?", [code], function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            } else {
                console.log(`Item com código ${code} não encontrado.`);
                resolve(); // Resolve mesmo que o item não tenha sido encontrado, caso contrário, o Promise ficará pendente
            }
        });
    });
}



function searchInDatabases(searchTerm, option) {
    const query1 = `SELECT * FROM inventory WHERE ${option} LIKE ?`;
    const query2 = `SELECT * FROM inventoryPcriado WHERE ${option} LIKE ?`;

    return new Promise((resolve, reject) => {
        let results = [];

        db.all(query1, [`%${searchTerm}%`], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                results = results.concat(rows);

                dbPcriado.all(query2, [`%${searchTerm}%`], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        results = results.concat(rows);
                        resolve(results);
                    }
                });
            }
        });
    });
}


module.exports = {
    addItem,
    getItems,
    removeItem,
    addItemPcriado,
    getItemsPcriado,
    removeItemPcriado,
    searchInDatabases,
    addItemVendas,
    getItemsVendas,
    menosUmItem,
    maisUmItem,
    removerItemVendido,
    addVendas,
    retornarItemVendido,
    getItemsVendasByDate,
    getAllSales,
    getSalesByDate,
    removeVenda
};

