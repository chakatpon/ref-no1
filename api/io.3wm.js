const axios = require("axios");
const apis = require("../libs/apiproxy");
module.exports = function(io, notification, username) {
  var approveList = [];
  var inQueueProcess = false;

  doa = io.of("/doa").clients((error, clients) => {
    if (error) throw error;
  });
  doa.on("connection", function(socket) {
    socket.emit("queue", approveList);
    socket.on("approve", function(accessToken, newList) {
      let appendList = [];
      newList.map(r => {
        let has = approveList.filter(rr => {
          return rr.linearId == r.linearId;
        });
        if (has.length == 0) {
          r.status = "queue";
          r.accessToken = accessToken;
          appendList = [...appendList, r];
        }
      });

      approveList = [...approveList, ...appendList];
      socket.emit("queue", approveList);
    });
  });
  async function processData() {
    let proc = [];
    try {
      if (
        approveList.filter(a => {
          return a.status == "queue";
        }).length > 0
      ) {
        if (inQueueProcess) {
          return;
        }
        inQueueProcess = true;
        approveList[0].status = "processing";
        proc = approveList[0];
        doa.emit("processing", proc);
        doa.emit("queue", approveList);

        const url = `${process.env.API_DOMAIN_URL_10004}/${
          !!proc.documentType && proc.documentType === "DEBIT_NOTE"
            ? "api/debitnotes/approve"
            : "api/invoices/approve"
        }`;
        let resp = await apis.ioput(proc.accessToken, url, {
          data: {
            linearId: proc.linearId,
            buyerApprovedRemark: proc.buyerApprovedRemark || "Bulk Approved",
            fileAttachments: proc.fileAttachments || [],
            items: proc.items || []
          }
        });

        if (resp.statusCode == 200 || resp.statusCode == 201) {
          doa.emit("success", resp, proc);
        } else {
          doa.emit("error", resp, proc);
        }

        approveList.splice(0, 1);
        doa.emit("queue", approveList);
        inQueueProcess = false;
      }
    } catch (err) {
      doa.emit(
        "error",
        err.response.data.message || err.error_message || err.message,
        proc
      );
      approveList.splice(0, 1);
      doa.emit("queue", approveList);
      inQueueProcess = false;
    }
    setTimeout(processData, 1000);
  }
  processData();
};
