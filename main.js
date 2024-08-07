const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const appExpress = express();

// Importa funções do módulo de banco de dados
const {
    addItem,
    getItems,
    removeItem,
    addItemPcriado,
    getItemsPcriado,
    removeItemPcriado,
    searchInDatabases,
    addItemVendas,
    menosUmItem,
    maisUmItem,
    removerItemVendido,
    retornarItemVendido,
    getItemsVendas,
    getItemsVendasByDate,
    getSalesByDate,
    getAllSales,
    removeVenda,
    addVendas   
} = require('./database');

// Função para criar a janela principal do Electron
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1600,
        height: 1200,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));




}





// Evento para criar a janela quando o aplicativo estiver pronto
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Manipuladores IPC para comunicação entre o processo principal e o processo de renderização
ipcMain.handle('add-item', async (_event, item_name, quantity, code, validate, value) => {
    await addItem(item_name, quantity, code, validate, value);
});

ipcMain.handle('addItemVendas', async (_event, date, vendidos) => {
    await addItemVendas(date, vendidos);
});

ipcMain.handle('add-item-CProduto', async (_event, item_name, code, value) => {
    await addItemPcriado(item_name, code, value);
});

ipcMain.handle('get-item-CProduto', async () => {
    return await getItemsPcriado();
});

ipcMain.handle('get-items', async () => {
    return await getItems();
});

ipcMain.handle('get-itemsVendas', async () => {
    return await getItemsVendas();
});

ipcMain.handle('remove-item', async (_event, code) => {
    await removeItem(code);
});

ipcMain.handle('remove-item-CProduto', async (_event, code) => {
    await removeItemPcriado(code);
});

ipcMain.handle('searchItems', async (_event, searchTerm, option) => {
    const searchResults = await searchInDatabases(searchTerm, option);
    return searchResults;
});


ipcMain.handle('addVendas',async(_event,date, item_name,code,quantidade,preco)=>{

   await addVendas(date, item_name,code,quantidade,preco)

})

ipcMain.handle('menosUmItem', async (_event, code) => {
    await menosUmItem(code);
});

ipcMain.handle('removerItemVendido', async (_event, code, vendido) => {
    await removerItemVendido(code, vendido);
});

ipcMain.handle('retornarItemVendido', async (_event, code, vendido) => {
    await retornarItemVendido(code, vendido);
});

ipcMain.handle('maisUmItem', async (_event, code) => {
    await maisUmItem(code);
});
ipcMain.handle('getItemsVendasByDate',async (_event,date)=>{
    await getItemsVendasByDate(date)
})

ipcMain.handle('getSalesByDate', async (event, date) => {
    try {
        return await getSalesByDate(date).then(data => {
            console.log(`Vendas em ${date}`, data);
        }).catch(err => {
            console.error('Erro ao obter vendas por data:', err);
        });
    } catch (err) {
        console.error('Erro ao obter vendas por data:', err);
        return [];
    }
});




ipcMain.handle('removeVenda', async (event, date, code) => {
    try {
        await removeVenda(date, code);
        return { success: true };
    } catch (error) {
        console.error("Erro ao remover venda:", error);
        return { success: false, error: error.message };
    }
});



ipcMain.handle('buscarTodasVendas', async (event,date) => {
    try {
        return await getAllSales(date);
    } catch (err) {
        console.error('Erro ao obter todas as vendas:', err);
        return [];
    }
});

// Configuração do servidor Express
appExpress.use(express.json()); // Adiciona o middleware para parsing de JSON

appExpress.get('/items', async (req, res) => {
    try {
        const resposta = await getItems();
        res.status(200).send({ message: resposta });
    } catch (error) {
        res.status(500).send({ error: 'Erro ao obter itens' });
    }
});

// Inicia o servidor Express na porta 3000
appExpress.listen(3000, () => {
    console.log('Servidor Express rodando na porta 3000');
});
