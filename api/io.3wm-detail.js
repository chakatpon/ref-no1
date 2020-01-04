const apis = require("../libs/apiproxy");
const moment = require("moment");
module.exports = function(io, notification, username) {
  var approveList = [];
  var inQueueProcess = false;

  threeway = io.of("/twmdetail").clients((error, clients) => {
    if (error) throw error;
  });
  threeway.once("connection", function(socket) {
    socket.emit("queue", approveList);
    socket.on("approve", function(accessToken, newObj) {
      let appendList = [];
      let has = approveList.filter(rr => {
        return rr.linearId == newObj.linearId;
      });

      if (has.length == 0) {
        newObj.status = "queue";
        newObj.accessToken = accessToken;
      }

      appendList.push(newObj);
      approveList = [...approveList, ...appendList];
      socket.emit("queue", approveList);
    });
  });
  async function processData() {
    let proc = [];
    try {
      if (approveList.length > 0) {
        proc = approveList[0];
        threeway.emit("queue", approveList);

        let request = {
          data: {
            linearId: proc.linearId,
            fileAttachments: proc.fileAttachments || []
          }
        };

        let endpoint = "";

        if (proc.type === "BuyerApprove" || proc.type === "BuyerClarify") {
          request = {
            ...request,
            ...{
              buyerApprovedRemark: proc.buyerApprovedRemark || "Buyer Approved"
            }
          };
          endpoint = "approve";
        } else {
          request = {
            ...request,
            ...{
              buyerRejectedRemark: proc.buyerRejectedRemark || "Buyer Rejected"
            }
          };
          endpoint = "reject";
        }

        const url = `${process.env.API_DOMAIN_URL_10004}/api/invoices/${endpoint}`;

        let resp = await apis.ioput(proc.accessToken, url, request);

        if (resp.statusCode == 200 || resp.statusCode == 201) {
          var GA_EVENT = {
            category: "Invoice",
            action: "3WM Approval (Success)",
            label: moment().format()
          };

          var successMessage = `Manual approval for invoice no. ${proc.externalId} has been completed.`;
          notification.emit(
            username,
            successMessage,
            "success",
            "3wm-detail-approval",
            GA_EVENT
          );

          threeway.emit("success", resp, proc);
        } else {
          var GA_EVENT = {
            category: "Invoice",
            action: "3WM Approval (Failed)",
            label: moment().format()
          };

          var failedMessage = `Manual approval for invoice no. ${proc.externalId} has been failed. : ${resp.error_message.message}`;
          notification.emit(
            username,
            failedMessage,
            "failed",
            "3wm-detail-approval",
            GA_EVENT
          );

          threeway.emit("error", resp, proc);
        }

        approveList.shift();
      }
    } catch (err) {
      console.log("socket err:::", err);
      threeway.emit(
        "error",
        err || err.error_message.message || err.message,
        proc
      );
      approveList.shift();
      console.log("approveList Error", approveList);
    }
    setTimeout(processData, 1000);
  }
  processData();
};
