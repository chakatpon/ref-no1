const testProcess = async (io, notification, username) => {
  const tester = io.of("/tester").clients((error, clients) => {
    if (error) throw error;
  });

  tester.on("connection", socket => {
    socket.on("success", message => {
      setTimeout(() => {
        notification.emit(username, message, "success", "io-tester");
      }, 5000);
      // notification.emit(username, message, "success", "io-tester");
    });
    socket.on("failed", message => {
      setTimeout(() => {
        notification.emit(username, message, "failed", "io-tester");
      }, 6000);
      // notification.emit(username, message, "failed", "io-tester");
    });
    socket.on("disconnect", socket => {
      // socket.disconnect();
    });
  });
};

module.exports = (io, notification, username) => {
  testProcess(io, notification, username);
};
