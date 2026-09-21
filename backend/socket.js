const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: '*', // Allow all for minimal demo
        methods: ['GET', 'POST']
      }
    });
    
    // Auth middleware
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
      } catch (err) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id} (User: ${socket.user.id})`);
      
      // Automatically join a room for this user to receive private notifications
      socket.join(`user_${socket.user.id}`);
      
      if (socket.user.role === 'admin' || socket.user.role === 'staff') {
        socket.join('admin_room');
        console.log(`Admin/Staff ${socket.user.id} joined admin_room`);
      }

      // Allow client to subscribe to specific station updates
      socket.on('subscribe_station', (stationId) => {
        socket.join(`station_${stationId}`);
        console.log(`User ${socket.user.id} subscribed to station_${stationId}`);
      });

      socket.on('unsubscribe_station', (stationId) => {
        socket.leave(`station_${stationId}`);
      });
      
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
