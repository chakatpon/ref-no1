import localStorage from "local-storage";
import store from "./store";
// const axios = require("./axios");
import axios from "axios";
var apiconfig = require("../configs/api.config.json");
export default class ApiService {
  constructor(domain) {
    this.domain =
      process.env.APP_DOMAIN || domain || apiconfig.APP_DOMAIN || "";
    this.getInvoiceTableSetting = this.getInvoiceTableSetting.bind(this);
  }
  getApi(endpoint) {
    return this.fetch(`${this.domain}${endpoint}`, {
      method: "get"
    }).then(res => {
      return Promise.resolve(res);
    });
  }
  getProfile() {
    if (localStorage.get("profile")) {
      return Promise.resolve(JSON.parse(localStorage.get("profile")));
    }
    return this.fetch(`${this.domain}/user`, {
      method: "get"
    }).then(res => {
      localStorage.set("profile", JSON.stringify(res));
      return Promise.resolve(res);
    });
  }
  checkUserAuthority() {
    return this.getProfile()
      .then(profile => {
        var authority = [];
        for (let x in profile.authorities) {
          var str_authorities = profile.authorities[x]["authority"];
          let t = str_authorities.toString().split(",");
          for (let y in t) {
            authority.push(t[y]);
          }
        }
        store.authority = authority;
        return Promise.resolve(authority);
      })
      .catch(res => {
        return Promise.resolve({});
      });
  }
  getInvoiceTableSetting() {
    return this.fetch(`${this.domain}/model/invoice-list`, {
      method: "get"
    }).then(res => {
      return Promise.resolve(res);
    });
  }
  saveInvoiceTableSetting(col) {
    return this.fetch(
      `${this.domain}/model/invoice-list?colSeq=${col.join()}`,
      {
        method: "post"
      }
    ).then(res => {
      return Promise.resolve(res);
    });
  }
  getInvoiceTableDataUrl() {
    return `${this.domain}/api/invoices`;
  }
  saveInvoiceTableSettingUrl() {
    return `${this.domain}/model/invoice-list`;
  }
  getInvoiceTableData(col, order, length) {
    return this.fetch(`${this.domain}/api/invoices`, {
      method: "get"
    }).then(res => {
      return Promise.resolve(res);
    });
  }
  getInvoiceDetail(invoiceID) {
    return this.fetch(`${this.domain}/api/invoices/` + invoiceID, {
      method: "get"
    }).then(res => {
      return Promise.resolve(res);
    });
  }

  getInvoiceByNumber(invoiceNumber) {
    return this.fetch(
      `${this.domain}/api/invoices?invoiceNumber=` + invoiceNumber,
      {
        method: "get"
      }
    ).then(res => {
      return Promise.resolve(res);
    });
  }

  getInvoiceByNumberWithItems(invoiceNumber) {
    return this.fetch(
      `${this.domain}/api/invoices?bypass=true&returnInvoiceItems=true`,
      {
        method: "get"
      }
    ).then(res => {
      return Promise.resolve(res);
    });
  }

  getGRTableSetting() {
    return this.fetch(`${this.domain}/model/gr-list`, {
      method: "get"
    }).then(res => {
      return Promise.resolve(res);
    });
  }
  getGRTableData() {
    return this.fetch(`${this.domain}/api/goodsreceivedheader/native`, {
      method: "get"
    }).then(res => {
      return Promise.resolve(res);
    });
  }
  getGRDetail(linearId) {
    return this.fetch(`${this.domain}/api/goodsreceivedheader/${linearId}`, {
      method: "get"
    }).then(res => {
      return Promise.resolve(res);
    });
  }
  getGRTableDataUrl() {
    return `${this.domain}/api/goodsreceivedheader/native`;
  }

  getGRConfiguration(legalname, companyTaxId, vendorTaxNumber) {
    return this.fetch(
      `${this
        .domain}/api/offledgers/configuration/goodsreceived?legalName=${legalname}&companyTaxId=${companyTaxId}&vendorTaxId=${vendorTaxNumber}`,
      {
        method: "get"
      }
    ).then(res => {
      return Promise.resolve(res);
    });
  }

  saveGRTableSettingUrl() {
    return `${this.domain}/model/gr-list`;
  }

  putEditGR(goodsreceivedObj) {
    return axios
      .put(`${this.domain}/api/goodsreceivedheader`, goodsreceivedObj)
      .then(res => {
        return Promise.resolve(res);
      });
  }

  getPOTableSetting() {
    return this.fetch(`${this.domain}/model/po-list`, {
      method: "get"
    }).then(res => {
      return Promise.resolve(res);
    });
  }
  getPOTableData() {
    return this.fetch(`${this.domain}/api/purchaseorders?bypass=true`, {
      method: "get"
    }).then(res => {
      return Promise.resolve(res);
    });
  }

  getAllPO() {
    return this.fetch(`${this.domain}/api/purchaseorders?bypass=true`, {
      method: "get"
    }).then(res => {
      return Promise.resolve(res);
    });
  }

  getMorePODataByCompany(
    vendorTaxId,
    businessPlaceTaxNumber,
    companyBranchCode,
    paymentTermDays
  ) {
    return this.fetch(
      `${this
        .domain}/api/purchaseorders?bypass=true&vendorTaxNumber=${vendorTaxId}&businessPlaceTaxNumber=${businessPlaceTaxNumber}&companyBranchCode=${companyBranchCode}&paymentTermDays=${paymentTermDays}`,
      {
        method: "get"
      }
    ).then(res => {
      return Promise.resolve(res);
    });
  }

  getPOTableDataUrl() {
    return `${this.domain}/api/purchaseorders`;
  }
  savePOTableSettingUrl() {
    return `${this.domain}/model/po-list`;
  }

  getPOByPONumber(poNumber) {
    return this.fetch(
      `${this
        .domain}/api/purchaseorders?bypass=true&purchaseOrderNumber=${poNumber}`,
      {
        method: "get"
      }
    ).then(res => {
      return Promise.resolve(res);
    });
  }
  getPOItemsByPOId(poID) {
    return this.fetch(
      `${this
        .domain}/api/purchaseitems?bypass=true&purchaseOrderLinearId=${poID}`,
      {
        method: "get"
      }
    ).then(res => {
      return Promise.resolve(res);
    });
  }
  getPODetail(linearId) {
    return this.fetch(`${this.domain}/api/purchaseorders/${linearId}`, {
      method: "get"
    }).then(res => {
      return Promise.resolve(res);
    });
  }
  getPODetailItemColumnByPOId() {
    return this.fetch(`${this.domain}/model/po-item`, {
      method: "get"
    }).then(res => {
      return Promise.resolve(res);
    });
  }
  getGRItemsByPoNumber(poNumber) {
    return this.fetch(
      `${this
        .domain}/api/goodsreceived?movementClass=NORMAL&siblingLinearId=IS_NULL&statuses=ISSUED&filterReverse=true&purchaseOrderExternalId=${poNumber}`,
      {
        method: "get"
      }
    ).then(res => {
      return Promise.resolve(res);
    });
  }

  getCNTableSetting() {
    return this.fetch(`${this.domain}/model/cn-list`, {
      method: "get"
    }).then(res => {
      return Promise.resolve(res);
    });
  }
  searchCNTableData(linearId) {
    return this.fetch(
      `${this.domain}/api/creditnotes?invoiceLinearId=${linearId}`,
      {
        method: "get"
      }
    ).then(res => {
      return Promise.resolve(res);
    });
  }
  getCNTableData() {
    return this.fetch(`${this.domain}/api/creditnotes`, {
      method: "get"
    }).then(res => {
      return Promise.resolve(res);
    });
  }
  getCNTableDataUrl() {
    return `${this.domain}/api/creditnotes`;
  }
  saveCNTableSettingUrl() {
    return `${this.domain}/model/cn-list`;
  }

  getCNDetail(linearId) {
    return this.fetch(`${this.domain}/api/creditnotes/${linearId}`, {
      method: "get"
    }).then(res => {
      return Promise.resolve(res);
    });
  }

  getDNDetail(linearId) {
    return this.fetch(`${this.domain}/api/debitnotes/${linearId}`, {
      method: "get"
    }).then(res => {
      return Promise.resolve(res);
    });
  }

  getInvoiceAttachment(hash) {
    return this.fetch(`${this.domain}/api/files/download/${hash}`, {
      method: "get"
    }).then(res => {
      return Promise.resolve(res);
    });
  }

  postUploadFile(file) {
    return this.upload(`${this.domain}/api/files/multiple-upload`, {
      method: "post",
      body: file
    }).then(res => {
      return Promise.resolve(res);
    });
  }

  postInvoiceUpload(file, vendor, isAttachment) {
    return this.upload(
      `${this
        .domain}/api/invoices/upload?vendor=${vendor}&isAttachment=${isAttachment}`,
      {
        method: "post",
        body: file
      }
    ).then(res => {
      return Promise.resolve(res);
    });
  }

  putRevisedInvoiceDueDate(linearId, revisedDueDate, reason) {
    return this.fetch(
      `${this
        .domain}/api/invoices/duedates?linearId=${linearId}&revisedDueDate=${revisedDueDate}&revisedDueDateReason=${reason}`,
      {
        method: "put"
      }
    ).then(res => {
      return Promise.resolve(res);
    });
  }

  getInvoiceConfiguration(legalname, companyTaxId, vendorTaxId) {
    return this.fetch(
      `${this
        .domain}/api/offledgers/configuration/invoice?legalName=${legalname}&companyTaxId=${companyTaxId}&vendorTaxId=${vendorTaxId}`,
      {
        method: "get"
      }
    ).then(res => {
      return Promise.resolve(res);
    });
  }

  getCreditNoteConfiguration(legalname, companyTaxNumber, vendorTaxNumber) {
    return this.fetch(
      `${this
        .domain}/api/offledgers/configuration/creditnote?legalName=${legalname}&companyTaxId=${companyTaxNumber}&vendorTaxId=${vendorTaxNumber}`,
      {
        method: "get"
      }
    ).then(res => {
      return Promise.resolve(res);
    });
  }

  getCalculateddDueDate(
    legalname,
    companyTaxId,
    dueDate,
    bankRequired,
    calendarKey
  ) {
    return this.fetch(
      `${this
        .domain}api/offledgers/next/workingday?party=${legalname}&dueDate=${dueDate}&companyTaxNumber=${companyTaxId}&isBankRequired=${bankRequired}&calendarKey=${calendarKey}`,
      {
        method: "get"
      }
    ).then(res => {
      return Promise.resolve(res);
    });
  }

  getVendorBranchCode(legalName, taxId) {
    return this.fetch(
      `${this
        .domain}/api/offledgers/company/branch?legalName=${legalName}&taxId=${taxId}`,
      {
        method: "get"
      }
    ).then(res => {
      return Promise.resolve(res);
    });
  }

  getCustomTracking() {
    return this.fetch(`${this.domain}/custom-tracking`, {
      method: "get"
    }).then(res => {
      return Promise.resolve(res);
    });
  }

  postCreateInvoice(invoiceObject) {
    return axios
      .post(`${this.domain}/api/invoices`, invoiceObject)
      .then(res => {
        return Promise.resolve(res);
      });
  }

  postCreateCreditNote(cnObject) {
    return axios.post(`${this.domain}/api/creditnotes`, cnObject).then(res => {
      return Promise.resolve(res);
    });
  }

  postValidateInvoice(validateBody) {
    return axios
      .post(`${this.domain}/api/invoices/validate/uniqueness`, validateBody)
      .then(res => {
        return Promise.resolve(res);
      });
  }

  postValidateCreditNote(validateBody) {
    return axios
      .post(`${this.domain}/api/creditnotes/validate/uniqueness`, validateBody)
      .then(res => {
        return Promise.resolve(res);
      });
  }

  putEditInvoice(invoiceObject) {
    return axios
      .put(`${this.domain}/api/invoices/edit`, invoiceObject)
      .then(res => {
        return Promise.resolve(res);
      });
  }

  putResubmitInvoice(invoiceObject) {
    return axios.put(`${this.domain}/api/invoices`, invoiceObject).then(res => {
      return Promise.resolve(res);
    });
  }

  putEditFileInvoice(invoiceObject) {
    return axios
      .put(`${this.domain}/api/invoices/attachments/edit`, invoiceObject)
      .then(res => {
        return Promise.resolve(res);
      });
  }

  putEditCreditNote(cnObject) {
    return axios
      .put(`${this.domain}/api/creditnotes/edit`, cnObject)
      .then(res => {
        return Promise.resolve(res);
      });
  }

  putResubmitCreditNote(cnObject) {
    return axios.put(`${this.domain}/api/creditnotes`, cnObject).then(res => {
      return Promise.resolve(res);
    });
  }

  getToken() {
    // Retrieves the user token from localStorage

    return localStorage.get("id_token");
  }

  _checkStatus(response) {
    // raises an error in case response status is not a success
    if (response.status >= 200 && response.status < 300) {
      return response;
    } else {
      if (typeof response === "object") {
        throw response;
      }
      throw JSON.parse(response);
    }
  }

  fetch(url, options) {
    // performs api calls sending the required authentication headers
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "Bearer " + this.getToken()
    };

    return axios({
      url,
      headers,
      ...options
    }).then(res => res.data);
  }

  upload(url, options, header) {
    // performs api calls sending the required authentication headers
    const headers = {
      ...header,
      Authorization: "Bearer " + this.getToken()
    };

    return fetch(url, {
      headers,
      ...options
    })
      .then(this._checkStatus)
      .then(response => response.json());
  }
  saveReviseInvoiceExternalId = (linearId, invoiceExternalId) => {
    return this.fetch(`${this.domain}/api/goodsreceivedheader`, {
      method: "put",
      data: JSON.stringify({ linearId, invoiceExternalId })
    });
  };
  getUploadInvoiceMonitoringList = options => {
    return this.fetch(`${this.domain}/standard/api/invoices/upload`, {
      method: "get",
      data: JSON.stringify(options)
    });
  };
}
