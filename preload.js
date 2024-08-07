const { contextBridge, ipcRenderer } = require('electron');

// Funções que interagem com o banco de dados
contextBridge.exposeInMainWorld('api', {
  addItem: (item_name, quantity, code, validate, value) => ipcRenderer.invoke('add-item', item_name, quantity, code, validate, value),
  addItemVendas: (date, vendidos) => ipcRenderer.invoke('addItemVendas', date, vendidos),
  getItemsVendas: () => ipcRenderer.invoke('get-itemsVendas'),
  getItems: () => ipcRenderer.invoke('get-items'),
  getItemsPcriado: () => ipcRenderer.invoke("get-item-CProduto"),
  addItemPcriado: (item_name, code, value) => ipcRenderer.invoke("add-item-CProduto", item_name, code, value),
  removeItem: (code) => ipcRenderer.invoke('remove-item', code),
  removeItemPcriado: (code) => ipcRenderer.invoke("remove-item-CProduto", code),
  searchItems: (searchTerm, option) => ipcRenderer.invoke('searchItems', searchTerm, option),
  menosUmItem: (code) => ipcRenderer.invoke("menosUmItem", code),
  maisUmItem: (code) => ipcRenderer.invoke("maisUmItem", code),
  removerItemVendido: (code, vendido) => ipcRenderer.invoke("removerItemVendido", code, vendido),
  retornarItemVendido: (code, vendido) => ipcRenderer.invoke("retornarItemVendido", code, vendido),
  getItemsVendasByDate: (date) => ipcRenderer.invoke('getItemsVendasByDate', date),
  buscarTodasVendas: (date) => ipcRenderer.invoke('buscarTodasVendas',date),
  addVendas: (date, item_name, code,quantidade, preco) => ipcRenderer.invoke("addVendas", date, item_name, code,quantidade, preco ),
  getSalesByDate:(date)=> ipcRenderer.invoke("getSalesByDate",date),
  removeVenda:(date,code)=>ipcRenderer.invoke('removeVenda',date,code)

});




window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})