const axios = require("axios");
const ObjectsToCsv = require("objects-to-csv");
var json2xls = require("json2xls");
const apis = require("../libs/apiproxy");
const unmatchedCode = require("../configs/unmatchedCode.config.json");

module.exports = function(server, queryString) {
  server.get("/api/mapping/3wm/detail/new/:linearId", async (req, res) => {
    try {
      ////////////////////////////////
      // MOCKUP DATA START
      ////////////////////////////////

      ////////////////////////////////
      //   MOCKUP DATA END
      ////////////////////////////////
      console.log(
        `${process.env.API_DOMAIN_URL_10004}/api/invoices/${req.params.linearId}`
      );
      const resp = await apis.get(
        req,
        res,
        `${process.env.API_DOMAIN_URL_10004}/api/invoices/${req.params.linearId}`,
        {
          data: req.body
        },
        true
      );

      let rs = resp.rows[0] || false;

      const calBySystemData = await apis.get(
        req,
        res,
        `${process.env.API_DOMAIN_URL_10004}/api/invoices/calculate-total?linearId=${req.params.linearId}`,
        {
          data: req.body
        },
        true
      );

      ////////////////////////////////
      //   ACTION HISTORY START
      ////////////////////////////////
      const resActionHistory = await apis.get(
        req,
        res,
        `${process.env.API_DOMAIN_URL_8999}/standard/api/actionhistory?documentType=invoice&documentLinearId=${req.params.linearId}`,
        {
          data: req.body
        },
        true
      );
      const actionHistory = resActionHistory.map(itmActionHistory => {
        let actionName = "";
        switch (itmActionHistory.actionName) {
          case "TrilateralMatch":
            actionName = "3 Way Matching Result";
            break;
          case "BuyerApprove":
            actionName = "Manual Approval";
            break;
          case "BuyerReject":
            actionName = "Request to Resubmit";
            break;
          case "BuyerClarify":
            actionName = "Clarify";
            break;
          case "AuthorityPartialApprove":
            actionName = "Partial DOA Approval";
            break;
          case "AuthorityFinalApprove":
            actionName = "Final DOA Approval";
            break;
          case "AuthorityReject":
            actionName = "Request Clarification";
            break;
          case "AuthorityRejectToSeller":
            actionName = "Request to Resubmit";
            break;
          default:
            actionName = itmActionHistory.actionName;
            break;
        }
        let actionBy = "";
        switch (itmActionHistory.actionBy) {
          case "SYSTEM":
            actionBy = "3 Way Matching";
            break;
          default:
            actionBy = itmActionHistory.commonName || itmActionHistory.actionBy;
            break;
        }
        let attachmentFile = [];
        let file = itmActionHistory.attachments.map(f => {
          let obj = {
            name: f.attachmentName,
            href: `/download/${f.attachmentHash}/${f.attachmentName}?filename=${f.attachmentName}&owner=${f.owner}`
          };
          attachmentFile.push(obj);
        });
        return {
          ...itmActionHistory,
          actionName,
          actionBy,
          attachmentFile
        };
      });
      ////////////////////////////////
      //   ACTION HISTORY END
      ////////////////////////////////

      ////////////////////////////////
      //   MAIN DATA START
      ////////////////////////////////
      let data = {};
      ////////////////////////////////
      //   MAIN DATA END
      ////////////////////////////////

      ////////////////////////////////
      //   MAPPING DATA START
      ////////////////////////////////
      let indexing = [];
      let selectedData = [];
      let taxInvoiceAmount = 0;
      let subInvoiceAmount = 0;

      chkDup = item => {
        return indexing.filter((itm, j) => {
          return itm.purchaseItemLinearId === item.purchaseItemLinearId;
        });
      };
      if (!rs) {
        throw new Error("Couldn't get invoice items.");
      }
      rs.items = rs.items || [];
      let dt = await rs.items.map((item, i) => {
        let index = this.chkDup(item);

        if (index.length == 0) {
          let obj = {
            index: indexing.length,
            purchaseItemLinearId: item.purchaseItemLinearId,
            materialDescription: item.materialDescription
          };
          let key = item.purchaseItemLinearId;
          indexing = [...indexing, obj];
          selectedData = [...selectedData, [item]];
        } else {
          let key = item.purchaseItemLinearId;
          selectedData[index[0].index].push(item);
        }
      });

      data = {
        ...data,
        externalId: rs.externalId,
        entryDate: rs.invoiceCreatedDate,
        currency: rs.currency,
        status: rs.status,
        lifecycle: rs.lifecycle,
        matchingStatus: rs.matchingStatus,
        invoiceTotal: rs.invoiceTotal,
        totalPayable: rs.totalPayable,
        currency: rs.currency,
        amountMatching: {},
        vendor: [],
        company: [],
        paymentinfo: [],
        attachments: [],
        matchingItems: [],
        matchingDetail: [],
        isETaxInvoice: rs.isETaxInvoice,
        restrictedMap: rs.restrictedMap,
        disclosedMap: rs.disclosedMap,
        matchedCode: rs.matchedCode,
        unmatchedCode: rs.unmatchedCode || [],
        actionHistory: actionHistory,
        actionHistoryOriginal: resActionHistory
      };

      // const calTax = (amount, percentage) => {
      //   return parseFloat(
      //     (
      //       parseFloat(amount.toFixed(2)) *
      //       parseFloat((percentage / 100).toFixed(2))
      //     ).toFixed(2)
      //   );
      // };

      // rs.items.map(item => {
      //   taxInvoiceAmount =
      //     taxInvoiceAmount + +calTax(item.itemSubTotal, item.vatRate);
      //   subInvoiceAmount = subInvoiceAmount + item.itemSubTotal;
      // });

      const setTwoDemicalFloat = number => {
        return parseFloat(number.toFixed(2));
      };

      // let taxTotalSystemAmount = setTwoDemicalFloat(taxInvoiceAmount);
      let taxTotalInvoiceAmount = setTwoDemicalFloat(rs.vatTotal);
      let taxTotalDiffAmount =
        setTwoDemicalFloat(taxTotalInvoiceAmount) -
        setTwoDemicalFloat(calBySystemData.vatTotal);

      // let subTotalSystemAmount = setTwoDemicalFloat(subInvoiceAmount);
      let subTotalInvoiceAmount = setTwoDemicalFloat(rs.subTotal);
      let subTotalDiffAmount =
        setTwoDemicalFloat(subTotalInvoiceAmount) -
        setTwoDemicalFloat(calBySystemData.subTotal);

      // let totalAmountSystemAmount =
      //   setTwoDemicalFloat(taxInvoiceAmount) +
      //   setTwoDemicalFloat(subInvoiceAmount);
      let totalAmountInvoiceAmount =
        setTwoDemicalFloat(taxTotalInvoiceAmount) +
        setTwoDemicalFloat(subTotalInvoiceAmount);

      let totalAmountDiffAmount =
        setTwoDemicalFloat(taxTotalInvoiceAmount) -
        setTwoDemicalFloat(calBySystemData.vatTotal) +
        (setTwoDemicalFloat(subTotalInvoiceAmount) -
          setTwoDemicalFloat(calBySystemData.subTotal));
      data = {
        ...data,
        amountMatching: {
          taxTotal: {
            // systemAmount: taxTotalSystemAmount,
            systemAmount: calBySystemData.vatTotal,
            invoiceAmount: taxTotalInvoiceAmount,
            diffAmount: taxTotalDiffAmount
          },
          subTotal: {
            // systemAmount: calBySystemData.subTotal subTotalSystemAmount,
            systemAmount: calBySystemData.subTotal,
            invoiceAmount: subTotalInvoiceAmount,
            diffAmount: subTotalDiffAmount
          },
          totalAmount: {
            // systemAmount: calBySystemData.invoiceTotal totalAmountSystemAmount
            systemAmount: calBySystemData.invoiceTotal,
            invoiceAmount: totalAmountInvoiceAmount,
            diffAmount: totalAmountDiffAmount
          }
        }
      };

      data = {
        ...data,
        vendor: {
          vendorNumber: rs.vendorNumber,
          vendorBranchCode: rs.vendorBranchCode,
          vendorName: rs.vendorName,
          vendorTaxNumber: rs.vendorTaxNumber,
          vendorAddress: rs.vendorAddress,
          vendorTelephone: rs.vendorTelephone
        }
      };

      data = {
        ...data,
        company: {
          companyCode: rs.companyCode,
          companyName: rs.companyName,
          companyTaxNumber: rs.companyTaxNumber,
          companyBranch:
            rs.companyBranchName != ""
              ? `${rs.companyBranchCode} (${rs.companyBranchName})`
              : rs.companyBranchCode,
          companyBranchCode: rs.companyBranchCode,
          companyBranchName: rs.companyBranchName,
          companyAddress: rs.companyAddress,
          companyTelephone: rs.companyTelephone
        }
      };

      let sendToCMS = "";
      let sendToBank = "";
      if (
        rs.customisedFields.CMS === undefined ||
        rs.customisedFields.CMS === ""
      ) {
        sendToCMS = "No";
      } else {
        sendToCMS = "Yes";
      }
      if (
        rs.paymentItemLinearId === "" ||
        rs.paymentItemLinearId === undefined
      ) {
        sendToBank = "No";
      } else {
        sendToBank = "Yes";
      }
      rs.paymentDate = rs.paymentDate === undefined ? "" : rs.paymentDate;
      rs.dueDateLastEditedBy =
        rs.dueDateLastEditedBy === undefined ? "" : rs.dueDateLastEditedBy;
      rs.dueDateLastEditedDate =
        rs.dueDateLastEditedDate === undefined ? "" : rs.dueDateLastEditedDate;
      rs.dueDateLastEditedReason =
        rs.dueDateLastEditedReason === undefined
          ? ""
          : rs.dueDateLastEditedReason;

      let revisedDueDate = rs.dueDate == rs.initialDueDate ? "" : rs.dueDate;
      data = {
        ...data,
        paymentinfo: {
          invoiceDate: rs.invoiceDate,
          paymentDate: rs.paymentDate,
          paymentTermCode: rs.paymentTermCode,
          paymentTermDays: rs.paymentTermDays,
          paymentTermDesc: rs.paymentTermDesc,
          invoiceFinancing: rs.invoiceFinancing,
          unmatchedReason: rs.unmatchedReason,
          sendToCMS,
          sendToBank,
          dueDateLastEditedBy: rs.dueDateLastEditedBy,
          dueDateLastEditedDate: rs.dueDateLastEditedDate,
          dueDate: rs.dueDate,
          revisedDueDate: revisedDueDate,
          subTotal: rs.subTotal,
          vatTotal: rs.vatTotal,
          invoiceTotal: rs.invoiceTotal,
          totalPayable: rs.totalPayable,
          estimatedPayable: rs.estimatedPayable,
          retentionAmount: rs.retentionAmount,
          dueDateLastEditedReason: rs.dueDateLastEditedReason
        }
      };

      data = {
        ...data,
        attachments: {
          receiptNumber: rs.receiptNumber,
          fileAttachmentsTaxInvoice: rs.fileAttachments
            .filter(f => f.attachmentType == "TaxInvoice")
            .map(f => {
              return {
                name: f.attachmentName,
                href: `${process.env.APP_DOMAIN}/download/${f.attachmentHash}/${f.attachmentName}?filename=${f.attachmentName}&owner=${f.owner}`
              };
            }),
          fileAttachmentsDeliveryNote: rs.fileAttachments
            .filter(f => f.attachmentType == "DeliveryNote")
            .map(f => {
              return {
                name: f.attachmentName,
                href: `${process.env.APP_DOMAIN}/download/${f.attachmentHash}/${f.attachmentName}?filename=${f.attachmentName}&owner=${f.owner}`
              };
            }),
          fileAttachmentsReceipt: rs.fileAttachments
            .filter(f => f.attachmentType == "Receipt")
            .map(f => {
              return {
                name: f.attachmentName,
                href: `${process.env.APP_DOMAIN}/download/${f.attachmentHash}/${f.attachmentName}?filename=${f.attachmentName}&owner=${f.owner}`
              };
            }),
          fileAttachmentsOther: rs.fileAttachments
            .filter(f => ["Others"].includes(f.attachmentType))
            .map(f => {
              return {
                name: f.attachmentName,
                href: `${process.env.APP_DOMAIN}/download/${f.attachmentHash}/${f.attachmentName}?filename=${f.attachmentName}&owner=${f.owner}`
              };
            })
        }
      };

      let mapped = [];
      let itemProperties = {};
      mapped = selectedData.map((item, i) => {
        // unmatchedCode
        let unmatchedCode = [];
        item.map(item => {
          if (item.unmatchedCode) {
            item.unmatchedCode.map(item => {
              unmatchedCode.push(item);
            });
          }
        });
        unmatchedCode = unmatchedCode.filter((value, index, self) => {
          return self.indexOf(value) === index;
        });
        // unmatchedCode

        // let matchedStatus = "unmatched";
        let matchedStatusArr = [];
        let matchCodeIndex = {};
        item.map(itm => {
          if (Object.keys(matchCodeIndex).length === 0) {
            matchCodeIndex = itm.matchedCode;
          } else {
            for (var key in matchCodeIndex) {
              if (matchCodeIndex[key] === itm.matchedCode[key]) {
                if (itm.matchedCode[key] === "IN_TOLERANCE") {
                  matchCodeIndex[key] = "IN_TOLERANCE";
                } else if (itm.matchedCode[key] === "BYPASS") {
                  matchCodeIndex[key] = "BYPASS";
                }
              }
            }
          }

          if (
            (itm.unmatchedCode && itm.unmatchedCode.length === 0) ||
            !itm.unmatchedCode
          ) {
            for (var key in matchCodeIndex) {
              if (matchCodeIndex[key] === "IN_TOLERANCE") {
                matchedStatusArr.push("matchedWithThreshold");
              }
              matchedStatusArr.push("matched");
            }
          } else {
            matchedStatusArr.push("unmatched");
          }
        });

        let matchedStatus = "unmatched";
        if (!matchedStatusArr.includes("unmatched")) {
          if (!matchedStatusArr.includes("matchedWithThreshold")) {
            if (matchedStatusArr.includes("matched")) {
              matchedStatus = "matched";
            }
          } else {
            matchedStatus = "matchedWithThreshold";
          }
        }

        let unmatchedReason = item.map(itm => {
          return itm.unmatchedReason;
        });

        unmatchedReason = unmatchedReason.filter((value, index, self) => {
          return self.indexOf(value) === index;
        });

        // itemProperties
        itemProperties = {
          invoiceItemId: item.map((itm, j) => {
            return ("0000" + itm.externalId).slice(-3);
          }),
          materialDescription: item[0].purchaseItem.materialDescription,
          materialNumber: item[0].purchaseItem.materialNumber,
          unmatchedCode: unmatchedCode,
          unmatchedReason: unmatchedReason,
          matchedStatus: matchedStatus,
          matchedCode: matchCodeIndex
        };

        // itemProperties

        // GR

        let _grNo = [];
        let _grQuantity = [];
        let _grUnitPrice = [];
        let _grUnitDescription = [];
        let _grDate = [];
        let _grCurrency = [];
        let grItem = [];
        let invoiceItemLinearIdArr = [];
        let filtered = [];
        item.map(itm => {
          invoiceItemLinearIdArr.push(itm.linearId);

          itm.goodsReceivedItems.map((curr, i, arr) => {
            if (!_grNo.includes(curr.externalId)) {
              _grNo = [..._grNo, curr.externalId];
            }
          });

          itm.goodsReceivedItems.map((curr, i, arr) => {
            if (!_grUnitPrice.includes(curr.unitPrice)) {
              _grUnitPrice = [..._grQuantity, curr.unitPrice];
            }
          });

          itm.goodsReceivedItems.map((curr, i, arr) => {
            _grQuantity = [..._grQuantity, curr.quantity.initial];
          });

          itm.goodsReceivedItems.map((curr, i, arr) => {
            if (!_grUnitDescription.includes(curr.quantity.unit)) {
              _grUnitDescription = [..._grUnitDescription, curr.quantity.unit];
            }
          });

          itm.goodsReceivedItems.map((curr, i, arr) => {
            if (!_grCurrency.includes(curr.currency)) {
              _grCurrency = [..._grCurrency, curr.currency];
            }
          });

          itm.goodsReceivedItems.map((curr, i, arr) => {
            if (!_grDate.includes(curr.postingDate)) {
              _grDate = [..._grDate, curr.postingDate];
            }
          });

          itm.goodsReceivedItems.map(gr => {
            let obj = {
              grNumber: gr.goodsReceivedExternalId,
              grLinearId: gr.goodsReceivedLinearId,
              grItemNo: gr.externalId,
              originalGr: gr,
              grItemUnitPrice: gr.unitPrice,
              grItemQuantity: gr.quantity.initial,
              grItemUnitDescription: gr.quantity.unit,
              grItemDate: gr.postingDate,
              grItemAmount: "",
              grItemCurrency: gr.currency,
              grItemLinearId: gr.goodsReceivedLinearId,
              grItemLifecycle: gr.lifecycle
            };
            grItem.push(obj);
          });
        });

        if (_grDate && _grDate.length > 1) {
          _grDate = "Multiple Value";
        } else if (_grDate && _grDate.length == 1) {
          _grDate = _grDate[0];
        } else {
          _grDate = "";
        }

        if (_grNo && _grNo.length > 1) {
          _grNo = "Multiple Value";
        } else if (_grNo && _grNo.length == 1) {
          _grNo = _grNo[0];
        } else {
          _grNo = "";
        }

        if (_grUnitPrice && _grUnitPrice.length > 1) {
          _grUnitPrice = "Multiple Value";
        } else if (_grUnitPrice && _grUnitPrice.length == 1) {
          _grUnitPrice = _grUnitPrice[0];
        } else {
          _grUnitPrice = "";
        }

        if (_grUnitDescription && _grUnitDescription.length > 1) {
          _grUnitDescription = "Multiple Value";
        } else if (_grUnitDescription && _grUnitDescription.length == 1) {
          _grUnitDescription = _grUnitDescription[0];
        } else {
          _grUnitDescription = "";
        }

        if (_grQuantity && _grQuantity.length > 1) {
          _grQuantity = _grQuantity.reduce((sum, current) => sum + current, 0);
        } else if (_grQuantity && _grQuantity.length == 1) {
          _grQuantity = _grQuantity[0];
        } else {
          _grQuantity = "";
        }

        if (_grCurrency && _grCurrency.length > 1) {
          _grCurrency = "Multiple Value";
        } else if (_grCurrency && _grCurrency.length == 1) {
          _grCurrency = _grCurrency[0];
        } else {
          _grCurrency = "";
        }

        // invoice

        let _invNo = [];
        let _invQuantity = [];
        let _invUnitDescription = [];
        let _invDate = [];
        let _invUnitPrice = [];
        let _invAmount = [];
        let _invCurrency = [];
        let invItem = [];
        let invoiceItems = [];
        item.map(itm => {
          let obj = {
            invNumber: rs.externalId,
            invItemNo: ("0000" + itm.externalId).slice(-3),
            invUnitPrice: itm.unitPrice,
            invQuantity: itm.quantity.initial,
            invUnitDescription: itm.quantity.unit,
            invDate: rs.invoiceDate,
            invAmount: itm.quantity.initial * itm.unitPrice,
            invCurrency: itm.currency,
            invItemMatchedCondition: {
              unmatchedCode: itm.unmatchedCode,
              matchedCode: itm.matchedCode,
              unmatchedReason: itm.unmatchedReason
            }
          };
          invoiceItems.push(obj);
        });
        invoiceItems.map((curr, i, arr) => {
          if (!_invNo.includes(curr.invItemNo)) {
            _invNo = [..._invNo, curr.invItemNo];
          }
        });
        if (_invNo && _invNo.length > 1) {
          _invNo = "Multiple Value";
        } else if (_invNo && _invNo.length == 1) {
          _invNo = _invNo[0];
        } else {
          _invNo = "";
        }

        invoiceItems.map((curr, i, arr) => {
          if (!_invUnitPrice.includes(curr.invUnitPrice)) {
            _invUnitPrice = [..._invUnitPrice, curr.invUnitPrice];
          }
        });
        if (_invUnitPrice && _invUnitPrice.length > 1) {
          _invUnitPrice = "Multiple Value";
        } else if (_invUnitPrice && _invUnitPrice.length == 1) {
          _invUnitPrice = _invUnitPrice[0];
        } else {
          _invUnitPrice = "";
        }

        invoiceItems.map((curr, i, arr) => {
          _invQuantity = [..._invQuantity, curr.invQuantity];
        });
        if (_invQuantity && _invQuantity.length > 1) {
          _invQuantity = _invQuantity.reduce(
            (sum, current) => sum + current,
            0
          );
        } else if (_invQuantity && _invQuantity.length == 1) {
          _invQuantity = _invQuantity[0];
        } else {
          _invQuantity = "";
        }

        invoiceItems.map((curr, i, arr) => {
          if (!_invUnitDescription.includes(curr.invUnitDescription)) {
            _invUnitDescription = [
              ..._invUnitDescription,
              curr.invUnitDescription
            ];
          }
        });
        if (_invUnitDescription && _invUnitDescription.length > 1) {
          _invUnitDescription = "Multiple Value";
        } else if (_invUnitDescription && _invUnitDescription.length == 1) {
          _invUnitDescription = _invUnitDescription[0];
        } else {
          _invUnitDescription = "";
        }

        invoiceItems.map((curr, i, arr) => {
          if (!_invDate.includes(curr.invDate)) {
            _invDate = [..._invDate, curr.invDate];
          }
        });
        if (_invDate && _invDate.length > 1) {
          _invDate = "Multiple Value";
        } else if (_invDate && _invDate.length == 1) {
          _invDate = _invDate[0];
        } else {
          _invDate = "";
        }

        invoiceItems.map((curr, i, arr) => {
          if (!_invAmount.includes(curr.invAmount)) {
            _invAmount = [..._invAmount, curr.invAmount];
          }
        });
        if (_invAmount && _invAmount.length > 1) {
          _invAmount = "Multiple Value";
        } else if (_invAmount && _invAmount.length == 1) {
          _invAmount = _invAmount[0];
        } else {
          _invAmount = "";
        }

        invoiceItems.map((curr, i, arr) => {
          if (!_invCurrency.includes(curr.invCurrency)) {
            _invCurrency = [..._invCurrency, curr.invCurrency];
          }
        });
        if (_invCurrency && _invCurrency.length > 1) {
          _invCurrency = "Multiple Value";
        } else if (_invCurrency && _invCurrency.length == 1) {
          _invCurrency = _invCurrency[0];
        } else {
          _invCurrency = "";
        }
        invoiceItemLinearIdArr = invoiceItemLinearIdArr.filter(
          (thing, index, self) => index === self.findIndex(t => t === thing)
        );

        // invoice

        // GR
        return {
          linearId: item[0].linearId,
          itemProperties: itemProperties,
          purchaseOrderExternalId: item[0].purchaseOrderExternalId,
          purchaseItemLinearId: item[0].purchaseItemLinearId,
          purchaseItemExternalId: item[0].purchaseItemExternalId,
          materialDescription: item[0].purchaseItem.materialDescription,
          // unmatchedCode: item[0].unmatchedCode || [],
          // unmatchedReason: item[0].unmatchedReason,
          matchedCode: item[0].matchedCode,
          status: item[0].status,
          lifecycle: item[0].lifecycle,
          companyTaxNumber: rs.companyTaxNumber,
          purchaseItem: {
            poNumber: item[0].purchaseItem.poNumber,
            poItemNo: item[0].purchaseItem.poItemNo,
            poUnitPrice: item[0].purchaseItem.poItemUnitPrice,
            poQuantity: item[0].purchaseItem.quantity.initial,
            poUnitDescription: item[0].purchaseItem.quantity.unit,
            poDate: item[0].purchaseItem.expectedDeliveryDate,
            poLinearId: item[0].purchaseItem.purchaseOrderLinearId,
            poAmount:
              item[0].purchaseItem.poItemUnitPrice *
              item[0].purchaseItem.quantity.initial,
            poCurrency: item[0].purchaseItem.poItemUnitPriceCurrency
          },

          goodsReceivedItems: {
            grNo: _grNo,
            grUnitPrice: _grUnitPrice,
            grQuantity: _grQuantity,
            grUnitDescription: _grUnitDescription,
            grDate: _grDate,
            grAmount: "",
            grCurrency: _grCurrency,
            invoiceItemLinearIdArr,
            items: grItem
          },
          invoiceItems: {
            invNo: _invNo,
            invUnitPrice: _invUnitPrice,
            invQuantity: _invQuantity,
            invUnitDescription: _invUnitDescription,
            invDate: _invDate,
            invAmount: _invAmount,
            invCurrency: _invCurrency,
            items: invoiceItems
          }

          // invoiceItems: {
          //   invNumber: rs.externalId,
          //   invItemNo: "",
          //   invUnitPrice: item[0].unitPrice,
          //   invQuantity: item[0].quantity.initial,
          //   invUnitDescription: item[0].quantity.unit,
          //   invDate: "",
          //   invAmount: item[0].quantity.initial * item[0].unitPrice,
          //   invCurrency: item[0].currency
          // }
        };
      });
      data = { ...data, matchingDetail: mapped };

      ////////////////////////////////
      //   MAPPING DATA END
      ////////////////////////////////

      ////////////////////////////////
      //   SET DATA FOR RESPONSE
      ////////////////////////////////
      let json = {
        page: resp.page,
        pageSize: resp.pageSize,
        totalRecords: resp.totalRecords,
        data: {}
      };
      json = { ...json, data, original: rs };
      return res.json(json);
      ////////////////////////////////
      //   SET DATA FOR RESPONSE
      ////////////////////////////////
    } catch (error) {
      console.error("error", error);
      if (error.response) {
        res.status(error.response.status).json({
          statusCode: error.response.status,
          message: error.response.data
        });
      } else if (error.request) {
        res.status(500).json({
          statusCode: 500,
          message: error.request
        });
      } else {
        res.status(500).json({
          statusCode: 500,
          message: error.message
        });
      }
    }
  });
};
