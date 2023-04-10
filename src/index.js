const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Configuración de bodyParser para analizar solicitudes con cuerpo JSON
app.use(bodyParser.json());

// Definición de una matriz de servicios y su estado inicial
let services = [
  { name: 'Servicio 1', status: 'operativo' },
  { name: 'Servicio 2', status: 'inoperativo' },
  { name: 'Servicio 3', status: 'en mantenimiento' }
];

// Ruta para obtener el estado actual de todos los servicios
app.get('/services', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Ruta para actualizar el estado de un servicio en particular
app.put('/services/:name', (req, res) => {
  const { name } = req.params;
  const { status } = req.body;

  // Buscar el servicio por nombre y actualizar su estado
  for (let i = 0; i < services.length; i++) {
    if (services[i].name === name) {
      services[i].status = status;

      // Emitir el estado actualizado a través de WebSockets
      io.emit('service-update', services);

      break;
    }
  }

  // Enviar respuesta con el servicio actualizado
  res.json({ message: `El estado de ${name} se actualizó a ${status}` });
});

// Iniciar el servidor en el puerto 3000
http.listen(3000, () => {
  console.log('Servidor iniciado en el puerto 3000');
});

// Conexión de WebSockets
io.on('connection', (socket) => {
  console.log('Un usuario se ha conectado');

  // Enviar el estado actual de los servicios cuando un usuario se conecta
  socket.emit('service-update', services);
});
