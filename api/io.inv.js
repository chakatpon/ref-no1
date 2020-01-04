const env = require("../b2p.config.json");
const apis = require("../libs/apiproxy");
const moment = require("moment");
const fs = require("fs");

const TIME_OUT = 600; // second
const TIME_DURATION = 1; // second
const domain =
  process.env.APP_DOMAIN || env.APP_DOMAIN || "http://localhost:3002";

const invoiceProcess = async (io, notification, username) => {
  // Queue Pools
  var poEditQueues = [];
  var grEditQueues = [];
  var poSubmitQueues = [];
  var grSubmitQueues = [];
  var poResubmitQueues = [];
  var grResubmitQueues = [];
  var threeWMDetailApprovalQueues = [];

  // IO - for Create Invoice
  const createInvoiceIO = io.of("/create-invoice").clients((error, clients) => {
    if (error) throw error;
  });

  createInvoiceIO.on("connection", socket => {
    // Socket for Create Invoice by PO

    socket.on("create-invoice-po", (data, aToken) => {
      // Submit Invoice PO

      // Preset variable
      var aToken = aToken;
      var endpoint = "/api/invoices";
      var url = `${domain}${endpoint}`;
      var timeout = TIME_OUT * 1000;
      var timeDuration = TIME_DURATION * 1000;

      // Data Buffering by Write to json file
      var path = require("path");
      var filename = `${data[0].externalId}.json`;
      var filepath = path.join(__dirname, "../tmp/payload/submit", filename);
      var dataWraper = { filepath, aToken };
      var json = JSON.stringify(data);

      fs.writeFile(filepath, json, "utf8", error => {
        if (error) throw error;
        console.log(`write ${filepath} : Complete.`);
      });

      poSubmitQueues.push(dataWraper);

      const submitByPO = () => {
        // Queue Processing
        if (poSubmitQueues.length > 0) {
          var inQueueData = poSubmitQueues.shift();
          var filepath = inQueueData.filepath;

          // Read file Post payload to API
          fs.readFile(filepath, "utf8", async (error, data) => {
            if (error) throw error;
            var payload = await JSON.parse(data);
            var response = await apis.iopost(inQueueData.aToken, url, timeout, {
              data: payload
            });

            if (response.error) {
              // Google Analytic Failed Event
              var GA_EVENT = {
                category: "Invoice",
                action: "Submit inv Ref.PO (Failed)",
                label: moment().format()
              };

              // Emit Failed Notification
              var failedMessage = `Submit Invoice by PO Failed. : ${response.error}`;
              notification.emit(
                username,
                failedMessage,
                "failed",
                "create-invoice-po",
                GA_EVENT
              );
            } else {
              // Google Analytic Success Event
              var GA_EVENT = {
                category: "Invoice",
                action: "Submit inv Ref.PO (Success)",
                label: moment().format(),
                value: payload[0].invoiceTotal
              };

              // Emit Sucess Notification
              var successMessage = "Submit Invoice by PO Success.";
              notification.emit(
                username,
                successMessage,
                "success",
                "create-invoice-po",
                GA_EVENT
              );
            }
          });

          // Remove file that already POST to API
          fs.unlink(filepath, error => {
            if (error) throw error;
            console.log(`Remove ${filepath} : Complete.`);
          });
        }
        setTimeout(() => {
          if (poSubmitQueues.length > 0) {
            submitByPO();
          }
        }, timeDuration);
      };
      submitByPO();
    });

    // Socket for Create Invoice by GR
    socket.on("create-invoice-gr", (data, aToken) => {
      // Submit Invoice GR
      var aToken = aToken;
      var endpoint = "/api/invoices";
      var url = `${domain}${endpoint}`;
      var timeout = TIME_OUT * 1000;
      var timeDuration = TIME_DURATION * 1000;

      // Data Buffering by Write to json file
      var path = require("path");
      var filename = `${data[0].externalId}.json`;
      var filepath = path.join(__dirname, "../tmp/payload/submit", filename);
      var dataWraper = { filepath, aToken };
      var json = JSON.stringify(data);

      fs.writeFile(filepath, json, "utf8", error => {
        if (error) throw error;
        console.log(`write ${filepath} : Complete.`);
      });
      grSubmitQueues.push(dataWraper);

      const submitByGR = () => {
        // Queue Processing
        if (grSubmitQueues.length > 0) {
          var inQueueData = grSubmitQueues.shift();
          var filepath = inQueueData.filepath;

          // Read file Post payload to API
          fs.readFile(filepath, "utf8", async (error, data) => {
            if (error) throw error;
            var payload = await JSON.parse(data);
            var response = await apis.iopost(inQueueData.aToken, url, timeout, {
              data: payload
            });

            if (response.error) {
              // Google Analytic Failed Event.

              var GA_EVENT = {
                category: "Invoice",
                action: "Submit inv Ref.GR (Failed)",
                label: moment().format()
              };

              // Emit Failed Notification.
              var failedMessage = `Submit Invoice by GR Failed. : ${error}`;
              notification.emit(
                username,
                failedMessage,
                "failed",
                "create-invoice-gr",
                GA_EVENT
              );
            } else {
              // Google Analytic Success Event
              var GA_EVENT = {
                category: "Invoice",
                action: "Submit inv Ref.GR (Success)",
                label: moment().format(),
                value: inQueueData.data[0].invoiceTotal
              };

              // Emit Success Notification.
              var successMessage = "Submit Invoice by GR Success.";
              notification.emit(
                username,
                successMessage,
                "success",
                "create-invoice-gr",
                GA_EVENT
              );
            }
          });
          // Remove file that already POST to API
          fs.unlink(filepath, error => {
            if (error) throw error;
            console.log(`Remove ${filepath} : Complete.`);
          });
        }
        setTimeout(() => {
          if (grSubmitQueues.length > 0) {
            submitByGR();
          }
        }, timeDuration);
      };
      submitByGR();
    });

    socket.on("disconnect", socket => {});
  });

  // IO - for Edit and Resubmit Invoice
  const editInvoiceIO = io.of("/edit-invoice").clients((error, clients) => {
    if (error) throw error;
  });
  editInvoiceIO.on("connection", socket => {
    // Edit Invoice by PO Socket.
    socket.on("edit-invoice-po", (data, aToken) => {
      var aToken = aToken;
      var endpoint = "/api/invoices/edit";
      var url = `${domain}${endpoint}`;
      var timeDuration = TIME_DURATION * 1000;

      // Data Buffering by Write to json file
      var path = require("path");
      var filename = `${data.externalId}.json`;
      var filepath = path.join(__dirname, "../tmp/payload/edit", filename);
      var dataWraper = { filepath, aToken };
      var json = JSON.stringify(data);

      fs.writeFile(filepath, json, "utf8", error => {
        if (error) throw error;
        console.log(`write ${filepath} : Complete.`);
      });
      poEditQueues.push(dataWraper);

      const editByPO = () => {
        // Queue Processing
        if (poEditQueues.length > 0) {
          var inQueueData = poEditQueues.shift();
          var filepath = inQueueData.filepath;

          // Read file Post payload to API
          fs.readFile(filepath, "utf8", async (error, data) => {
            if (error) throw error;
            var payload = await JSON.parse(data);
            var response = await apis.ioput(inQueueData.aToken, url, {
              data: payload
            });

            if (response.error) {
              // Google Analytic Failed Event

              var GA_EVENT = {
                category: "Invoice",
                action: "Edit inv Ref.PO (Failed)",
                label: moment().format()
              };

              // Emit Failed Notification
              var failedMessage = `Edit Invoice by PO Failed. : ${response.error}`;
              notification.emit(
                username,
                failedMessage,
                "failed",
                "edit-invoice-po",
                GA_EVENT
              );
            } else {
              // Google Analytic Success Event
              var GA_EVENT = {
                category: "Invoice",
                action: "Edit inv Ref.PO (Success)",
                label: moment().format()
              };

              // Emit Sucess Notification
              var successMessage = "Edit Invoice by PO Success.";
              notification.emit(
                username,
                successMessage,
                "success",
                "edit-invoice-po",
                GA_EVENT
              );
            }
          });
          // Remove file that already PUT to API
          fs.unlink(filepath, error => {
            if (error) throw error;
            console.log(`Remove ${filepath} : Complete.`);
          });
        }
        setTimeout(() => {
          if (poEditQueues.length > 0) {
            editByPO();
          }
        }, timeDuration);
      };
      editByPO();
    });

    // Edit Invoice by GR Socket.
    socket.on("edit-invoice-gr", (data, aToken) => {
      var aToken = aToken;
      var endpoint = "/api/invoices/edit";
      var url = `${domain}${endpoint}`;
      var timeDuration = TIME_DURATION * 1000;

      // Data Buffering by Write to json file
      var path = require("path");
      var filename = `${data.externalId}.json`;
      var filepath = path.join(__dirname, "../tmp/payload/edit", filename);
      var dataWraper = { filepath, aToken };
      var json = JSON.stringify(data);

      fs.writeFile(filepath, json, "utf8", error => {
        if (error) throw error;
        console.log(`write ${filepath} : Complete.`);
      });
      grEditQueues.push(dataWraper);

      const editByGR = () => {
        // Queue Processing
        if (grEditQueues.length > 0) {
          var inQueueData = grEditQueues.shift();
          var filepath = inQueueData.filepath;

          // Read file PUT payload to API
          fs.readFile(filepath, "utf8", async (error, data) => {
            if (error) throw error;
            var payload = await JSON.parse(data);
            var response = await apis.ioput(inQueueData.aToken, url, {
              data: payload
            });

            if (response.error) {
              // Google Analytic Failed Event

              var GA_EVENT = {
                category: "Invoice",
                action: "Edit inv Ref.GR (Failed)",
                label: moment().format()
              };

              // Emit Failed Notification
              var failedMessage = `Edit Invoice by GR Failed. : ${response.error}`;
              notification.emit(
                username,
                failedMessage,
                "failed",
                "edit-invoice-gr",
                GA_EVENT
              );
            } else {
              // Google Analytic Success Event
              var GA_EVENT = {
                category: "Invoice",
                action: "Edit inv Ref.GR (Success)",
                label: moment().format()
              };

              // Emit Sucess Notification
              var successMessage = "Edit Invoice by GR Success.";
              notification.emit(
                username,
                successMessage,
                "success",
                "edit-invoice-gr",
                GA_EVENT
              );
            }
          });
          // Remove file that already PUT to API
          fs.unlink(filepath, error => {
            if (error) throw error;
            console.log(`Remove ${filepath} : Complete.`);
          });
        }
        setTimeout(() => {
          if (grEditQueues.length > 0) {
            editByGR();
          }
        }, timeDuration);
      };
      editByGR();
    });

    // Resubmit Invoice by PO Socket.
    socket.on("resubmit-invoice-po", (data, aToken) => {
      var aToken = aToken;
      var endpoint = "/api/invoices";
      var url = `${domain}${endpoint}`;
      var timeDuration = TIME_DURATION * 1000;

      // Data Buffering by Write to json file
      var path = require("path");
      var filename = `${data.externalId}.json`;
      var filepath = path.join(__dirname, "../tmp/payload/resubmit", filename);
      var dataWraper = { filepath, aToken };
      var json = JSON.stringify(data);

      fs.writeFile(filepath, json, "utf8", error => {
        if (error) throw error;
        console.log(`write ${filepath} : Complete.`);
      });
      poResubmitQueues.push(dataWraper);

      const resubmitByPO = () => {
        // Queue Processing
        if (poResubmitQueues.length > 0) {
          var inQueueData = poResubmitQueues.shift();
          var filepath = inQueueData.filepath;

          // Read file PUT payload to API
          fs.readFile(filepath, "utf8", async (error, data) => {
            if (error) throw error;
            var payload = await JSON.parse(data);
            var response = await apis.ioput(inQueueData.aToken, url, {
              data: payload
            });

            if (response.error) {
              // Google Analytic Failed Event

              var GA_EVENT = {
                category: "Invoice",
                action: "Resubmit inv Ref.PO (Failed)",
                label: moment().format()
              };

              // Resubmit Failed Notification
              var failedMessage = `Resubmit Invoice by PO Failed. : ${response.error}`;
              notification.emit(
                username,
                failedMessage,
                "failed",
                "resubmit-invoice-po",
                GA_EVENT
              );
            } else {
              // Google Analytic Success Event
              var GA_EVENT = {
                category: "Invoice",
                action: "Resubmit inv Ref.PO (Success)",
                label: moment().format()
              };

              // Resubmit Sucess Notification
              var successMessage = "Resubmit Invoice by PO Success.";
              notification.emit(
                username,
                successMessage,
                "success",
                "resubmit-invoice-po",
                GA_EVENT
              );
            }
          });
          // Remove file that already PUT to API
          fs.unlink(filepath, error => {
            if (error) throw error;
            console.log(`Remove ${filepath} : Complete.`);
          });
        }
        setTimeout(() => {
          if (poResubmitQueues.length > 0) {
            resubmitByPO();
          }
        }, timeDuration);
      };
      resubmitByPO();
    });

    // Resubmit Invoice by GR Socket
    socket.on("resubmit-invoice-gr", (data, aToken) => {
      var aToken = aToken;
      var endpoint = "/api/invoices";
      var url = `${domain}${endpoint}`;
      var timeDuration = TIME_DURATION;

      // Data Buffering by Write to json file
      var path = require("path");
      var filename = `${data.externalId}.json`;
      var filepath = path.join(__dirname, "../tmp/payload/resubmit", filename);
      var dataWraper = { filepath, aToken };
      var json = JSON.stringify(data);

      fs.writeFile(filepath, json, "utf8", error => {
        if (error) throw error;
        console.log(`write ${filepath} : Complete.`);
      });
      grResubmitQueues.push(dataWraper);

      const resubmitByGR = () => {
        // Queue Processing
        if (grResubmitQueues.length > 0) {
          var inQueueData = grResubmitQueues.shift();
          var filepath = inQueueData.filepath;

          // Read file PUT payload to API
          fs.readFile(filepath, "utf8", async (error, data) => {
            if (error) throw error;
            var payload = await JSON.parse(data);
            var response = await apis.ioput(inQueueData.aToken, url, {
              data: payload
            });

            if (response.error) {
              // Google Analytic Failed Event

              var GA_EVENT = {
                category: "Invoice",
                action: "Resubmit inv Ref.GR (Failed)",
                label: moment().format()
              };

              // Resubmit Failed Notification
              var failedMessage = `Resubmit Invoice by GR Failed. : ${response.error}`;
              notification.emit(
                username,
                failedMessage,
                "failed",
                "resubmit-invoice-gr",
                GA_EVENT
              );
            } else {
              // Google Analytic Success Event
              var GA_EVENT = {
                category: "Invoice",
                action: "Resubmit inv Ref.GR (Success)",
                label: moment().format()
              };

              // Resubmit Sucess Notification
              var successMessage = "Resubmit Invoice by GR Success.";
              notification.emit(
                username,
                successMessage,
                "success",
                "resubmit-invoice-gr",
                GA_EVENT
              );
            }
          });
          // Remove file that already PUT to API
          fs.unlink(filepath, error => {
            if (error) throw error;
            console.log(`Remove ${filepath} : Complete.`);
          });
        }
        setTimeout(() => {
          if (grResubmitQueues.length.length > 0) {
            resubmitByGR();
          }
        }, timeDuration);
      };
    });

    socket.on("disconnect", socket => {});
  });
};

module.exports = (io, notification, username) => {
  return invoiceProcess(io, notification, username);
};
