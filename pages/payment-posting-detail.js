import React, { Component } from "react";
import Router from "next/router";
import _ from "lodash";
import moment from "moment";
import Layout from "../components/Layout";
import withAuth from "../libs/withAuth";
import ApiService from "../libs/ApiService";
import api from "../libs/api";
import "../libs/mycools";
import ListDetail from "../components/ListDetail";
import BlockUi from "react-block-ui";
import ModalAlert, { BTN_ACTION_BACK } from "../components/modalAlert";
import statusColor from "../configs/color.paymentposting.json";
import handleError from "./handleError";
import { i18n, withTranslation } from "~/i18n";
import {
  PageHeader,
  Collapse,
  CollapseItemText,
  CollapseItemLink,
  CollapseItemDatatable,
  CollapseItemRevised,
  CollapseNoExpandWithButton
} from "../components/page";
import GA from "~/libs/ga";

const paymentPostingStatusSuccessLifecycle = [
  "POSTING_SETTLED",
  "POSTING_CLEARED"
];
const paymentPostingStatusFailedLifecycle = ["POSTING_DECLINED"];
const paymentClearingStatusLifecycle = ["POSTING_CLEARED"];
const scbPaymentStatusSuccessLifecycle = [
  "PAID",
  "POSTING_SETTLED",
  "POSTING_DECLINED",
  "POSTING_CLEARED"
];
const scbPaymentStatusFailedLifecycle = ["DECLINED"];

class PaymentPostingDetail extends Component {
  constructor(props) {
    super(props);

    this.api = new ApiService();
    this.apis = new api().group("payment-posting");
    this.state = {
      title: "Payment Posting Detail",
      breadcrumb: [],
      _this: this,
      blocking: true,
      data: {},
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      buttonAlert: [],
      paymentPostingStatus: "",
      paymentClearingStatus: "",
      scbPaymentStatus: "",
      documentArray: [],
      paymentAmount: 0
    };
    this.BTN_CLOSE = [
      {
        label: "Close",
        attribute: {
          className: "btn btn--transparent btn-wide",
          onClick: this.handleDismissBtnModal
        }
      }
    ];
  }
  componentDidUnMount() {
    $this.state = [];
  }
  async componentDidMount() {
    const { permisions } = this.props;
    if (!permisions.includes("MONITOR-Payment-Detail")) {
      Router.push("/payment-posting");
      return;
    }

    if (
      this.props.url.query.linearId == undefined ||
      this.props.url.query.linearId == ""
    ) {
      Router.push("/payment-posting");
      return;
    }
    try {
      const res = await this.apis.call("detail", {
        linearId: this.props.url.query.linearId
      });

      if (res.data.length == 0) {
        const message = [
          "Sorry, you cannot get detail of this payment posting.",
          <br />,
          "Please contact your administrator."
        ];
        const response = handleError(
          message,
          this.handleDismissBtnModal,
          "BTN_BACK"
        );
        this.setState({
          ...response
        });
        return;
      }

      this.setState({
        data: res.data[0],
        blocking: false
      });
      await this.resolvePermission();
      await this.setInvoiceCreditNoteItems();
      await this.setPaymentAmount();
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal, "BTN_BACK");
      this.setState({
        ...response
      });
    }
  }

  resolvePermission = () => {
    let paymentPostingStatus = "";
    let paymentClearingStatus = "";
    let scbPaymentStatus = "";

    if (
      paymentPostingStatusSuccessLifecycle.includes(this.state.data.lifecycle)
    ) {
      paymentPostingStatus = "Success";
    } else if (
      paymentPostingStatusFailedLifecycle.includes(this.state.data.lifecycle)
    ) {
      paymentPostingStatus = "Failed";
    }

    if (paymentClearingStatusLifecycle.includes(this.state.data.lifecycle)) {
      paymentClearingStatus = "Cleared";
    }

    if (scbPaymentStatusSuccessLifecycle.includes(this.state.data.lifecycle)) {
      scbPaymentStatus = "Success";
    } else if (
      scbPaymentStatusFailedLifecycle.includes(this.state.data.lifecycle)
    ) {
      scbPaymentStatus = "Failed";
    }

    this.setState({
      paymentPostingStatus: paymentPostingStatus,
      paymentClearingStatus: paymentClearingStatus,
      scbPaymentStatus: scbPaymentStatus
    });
  };

  setInvoiceCreditNoteItems = () => {
    let documentArray = [];
    if (this.state.data.invoiceModel.length > 0) {
      this.state.data.invoiceModel.map(item => {
        let obj = {
          LIVDocumentNo: item.customisedFields
            ? item.customisedFields.LIV
              ? item.customisedFields.LIV.LIVDocumentNo || "-"
              : "-"
            : "-",
          accountingDocumentNumber: item.customisedFields
            ? item.customisedFields.LIV
              ? item.customisedFields.LIV.accountingDocumentNumber || "-"
              : "-"
            : "-",
          fiscalYear: item.customisedFields
            ? item.customisedFields.LIV
              ? item.customisedFields.LIV.fiscalYear || "-"
              : "-"
            : "-",
          externalId: item.externalId || "-",
          docType: "Invoice",
          docDate: item.invoiceDate || "-",
          paymentTermDay: item.paymentTermDays || "-",
          originalDueDate: item.initialDueDate || "-",
          finalDOA: item.approvedDate || "-",
          subTotal: item.subTotal || 0,
          taxAmount: item.vatTotal || 0,
          totalAmount: item.invoiceTotal || 0,
          retentionAmount: item.retentionAmount || 0
        };

        documentArray.push(obj);
      });
    }
    if (this.state.data.creditNoteModel.length > 0) {
      this.state.data.creditNoteModel.map(item => {
        let obj = {
          LIVDocumentNo: item.customisedFields
            ? item.customisedFields.LIV
              ? item.customisedFields.LIV.LIVDocumentNo || "-"
              : "-"
            : "-",
          accountingDocumentNumber: item.customisedFields
            ? item.customisedFields.LIV
              ? item.customisedFields.LIV.accountingDocumentNumber || "-"
              : "-"
            : "-",
          fiscalYear: item.customisedFields
            ? item.customisedFields.LIV
              ? item.customisedFields.LIV.fiscalYear || "-"
              : "-"
            : "-",
          externalId: item.externalId || "-",
          docType: "Credit Note",
          docDate: item.creditNoteDate || "-",
          paymentTermDay: "-",
          originalDueDate: "-",
          finalDOA: "-",
          subTotal: item.subTotal || 0,
          taxAmount: item.vatTotal || 0,
          totalAmount: item.total || 0,
          retentionAmount: 0
        };

        documentArray.push(obj);
      });
    }
    if (this.state.data.debitNoteModel.length > 0) {
      this.state.data.debitNoteModel.map(item => {
        let obj = {
          LIVDocumentNo: item.customisedFields
            ? item.customisedFields.LIV
              ? item.customisedFields.LIV.LIVDocumentNo || "-"
              : "-"
            : "-",
          accountingDocumentNumber: item.customisedFields
            ? item.customisedFields.LIV
              ? item.customisedFields.LIV.accountingDocumentNumber || "-"
              : "-"
            : "-",
          fiscalYear: item.customisedFields
            ? item.customisedFields.LIV
              ? item.customisedFields.LIV.fiscalYear || "-"
              : "-"
            : "-",
          externalId: item.externalId || "-",
          docType: "Debit Note",
          docDate: item.debitNoteDate || "-",
          paymentTermDay: item.paymentTermDays || "-",
          originalDueDate: item.initialDueDate || "-",
          finalDOA: item.approvedDate || "-",
          subTotal: item.subTotal || 0,
          taxAmount: item.vatTotal || 0,
          totalAmount: item.total || 0,
          retentionAmount: 0
        };

        documentArray.push(obj);
      });
    }

    this.setState({
      documentArray: documentArray
    });
  };

  setPaymentAmount = () => {
    let totalWhtAmount = 0;
    if (this.state.data.withholdingTax) {
      totalWhtAmount = this.state.data.withholdingTax.totalWhtAmount;
    }

    let paymentAmount = this.state.data.paymentAmount + totalWhtAmount;

    this.setState({
      paymentAmount
    });
  };

  routeToPaymentPostingList = () => {
    Router.push("/payment-posting");
  };

  handleDismissBtnModal = () => {
    this.setState({
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      buttonAlert: []
    });
  };

  calculateActualPaymentAmount = data => {
    if (data.paymentAmount != "") {
      if (data.paymentSystem == "BAHTNET" && data.feeChargeTo == "BUYER") {
        return data.paymentAmount + data.paymentFee;
      } else {
        return data.paymentAmount;
      }
    } else {
      return (data.paymentAmount = 0);
    }
  };

  formatCurrencyDigit = (amount, digit) => {
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      minimumFractionDigits: digit,
      maximumFractionDigits: digit
    }).format(amount);
  };

  handleDismissBtnModal() {
    this.setState({
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      buttonAlert: []
    });
  }
  // handleTimeoutModal = data => {
  //   this.alert(
  //     "Error !",
  //     [
  //       "Service temporarily unavailable. Please try again later.",
  //       <br />,
  //       "ไม่สามารถเชื่อมต่อกับระบบได้ในขณะนี้ กรุณาทำรายการใหม่อีกครั้ง",
  //       <hr />,
  //       <p class="text-left px-4">
  //         <strong>Status Code:</strong> {data.statusCode || err.code}
  //       </p>,
  //       <p class="text-left px-4">
  //         <strong>Error Message:</strong> {data.message || "-"}
  //       </p>
  //     ],
  //     this.BTN_CLOSE
  //   );
  // };

  // handleUnexpectedModal(data) {
  //   this.alert(
  //     "Error !",
  //     [
  //       "An unexpected error has occurred. Please try again later.",
  //       <br />,
  //       "เกิดปัญหาบางอย่างที่ระบบ กรุณาทำรายการใหม่อีกครั้ง",
  //       <hr />,
  //       <p class="text-left px-4">
  //         <strong>Status Code:</strong> {data.statusCode || "-"}
  //       </p>,
  //       <p class="text-left px-4">
  //         <strong>Error Message:</strong> {data.message || "-"}
  //       </p>
  //     ],
  //     data.button
  //   );
  // }

  // handleSystemErrorModal(data) {
  //   this.alert("Error !", data.message, data.button || this.BTN_ACTION_BACK);
  // }

  // alert = (title, message, button = BTN_ACTION_BACK) => {
  //   this.setState({
  //     alertModalAlertTitle: title,
  //     isAlertModalVisible: true,
  //     buttonAlert: button,
  //     isTextOnly: true,
  //     alertModalMsg: message
  //   });
  // };

  // resolveError(err) {
  //   console.log(err);
  //   let data = {};
  //   if (err.response) {
  //     data = err.response.data;
  //   } else {
  //     data = {
  //       statusCode: 999,
  //       message: err.message || "-",
  //       button: err.button || this.BTN_ACTION_BACK
  //     };
  //   }
  //   if (
  //     err.code == "ECONNABORTED" ||
  //     data.statusCode == 503 ||
  //     data.statusCode == 504
  //   ) {
  //     // error timeout case
  //     this.handleTimeoutModal(data);
  //   } else if (
  //     data.statusCode == 400 ||
  //     data.statusCode == 500 ||
  //     data.statusCode == 999
  //   ) {
  //     // Unexpected Error case
  //     this.handleUnexpectedModal(data);
  //   } else {
  //     Router.push({ pathname: "/unexpected-error", query: data });
  //   }
  // }

  render() {
    const { t } = this.props;
    const comeFrom = _.get(this.props,'url.query.comeFrom', 'Payment Posting Result')
    const comeFromUrl = _.get(this.props,'url.query.comeFromUrl', '/payment-posting')
    let breadcrumbs = [
      { title: t(comeFrom), url: comeFromUrl },
      {
        title: `${t("Customer Ref No")} ${
          this.state.data ? this.state.data.customerReference : "-"
        }`,
        active: true
      }
    ];

    const {
      data,
      blocking,
      alertModalAlertTitle,
      isAlertModalVisible,
      buttonAlert,
      isTextOnly,
      alertModalMsg,
      paymentPostingStatus,
      paymentClearingStatus,
      scbPaymentStatus,
      documentArray,
      paymentAmount
    } = this.state;
    return (
      <Layout {...this.props}>
        <PageHeader
          title={`${t("Customer Ref No")}: ${data.customerReference || "-"}`}
          breadcrumbs={breadcrumbs}
          {...this.props}
        />
        <BlockUi tag="div" blocking={blocking}>
          <div
            id="mobilePageNav"
            className="col-12 px-0 bg-lightgray-3 p-3 d-flex d-lg-none"
          >
            <a href="/payment-posting">
              <strong className="purple">
                <i className="fa fa-chevron-left" /> {t("Payment Posting")}
              </strong>
            </a>
          </div>
          <section
            id="invoice_detail_page"
            className="goodReceiveDetailPage box box--width-header pb-0 pb-lg-3"
          >
            <div className="box__header">
              <div className="row justify-content-between align-items-center mb-2">
                <div className="col-4 pl-0 pl-lg-3">
                  {""}
                  {t("Entry Date")} : {""}
                  {data.entryDate
                    ? moment(data.entryDate).format("DD/MM/YYYY")
                    : "-"}
                </div>
                <div className="col-8 text-right pr-0">
                  {" "}
                  {t("SCB Payment Status")} :{" "}
                  <strong
                    style={{
                      color: statusColor[scbPaymentStatus],
                      "margin-right": "15px"
                    }}
                  >
                    {scbPaymentStatus || "-"}
                  </strong>
                </div>
              </div>
            </div>
            <div className="box__inner">
              {/* Desktop Version - Start */}
              <Collapse
                id="vendorInfo"
                expanded="true"
                collapseHeader={[t("Vendor"), t("Company")]}
                className="d-none d-lg-flex flex-wrap"
              >
                <div className="row">
                  <div className="col-6">
                    <CollapseItemText
                      t={t}
                      label={t("Code")}
                      value={data.vendorNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Name")}
                      value={data.vendorName}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tax ID")}
                      value={data.vendorTaxNumber}
                    />
                  </div>
                  <div className="col-6">
                    <CollapseItemText
                      t={t}
                      label={t("Code")}
                      value={data.companyCode}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Name")}
                      value={data.companyName}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tax ID")}
                      value={data.companyTaxNumber}
                    />
                  </div>
                </div>
              </Collapse>
              {/* Desktop Version - End */}

              {/* Mobile Version - Start */}
              <Collapse
                id="vendorInfo"
                expanded="true"
                collapseHeader={[t("Vendor")]}
                className="d-flex d-lg-none flex-wrap"
              >
                <div className="d-flex flex-wrap w-100">
                  <div className="col-12">
                    <CollapseItemText
                      t={t}
                      label={t("Code")}
                      value={data.vendorNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Name")}
                      value={data.vendorName}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tax ID")}
                      value={data.vendorTaxNumber}
                    />
                  </div>
                </div>
              </Collapse>
              <Collapse
                id="companyInfo"
                expanded="true"
                collapseHeader={[t("Company")]}
                className="d-flex d-lg-none flex-wrap"
              >
                <div className="d-flex flex-wrap w-100">
                  <div className="col-12">
                    <CollapseItemText
                      t={t}
                      label={t("Code")}
                      value={data.companyCode}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Name")}
                      value={data.companyName}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Tax ID")}
                      value={data.companyTaxNumber}
                    />
                  </div>
                </div>
              </Collapse>
              {/* Mobile Version - End */}

              <Collapse
                id="paymentDetails"
                expanded="true"
                collapseHeader={[t("Payment Details")]}
              >
                <div className="d-flex flex-wrap">
                  <div className="col-12 col-lg-6">
                    <CollapseItemText
                      t={t}
                      label={t("Transaction Type")}
                      colLabel="6"
                      value={data.paymentSystem}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Payment Value Date")}
                      colLabel="6"
                      value={
                        data.paymentItemDate
                          ? moment(data.paymentItemDate).format("DD/MM/YYYY")
                          : ""
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Company Bank Account No")}
                      colLabel="6"
                      value={data.buyerBankAccountNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Vendor Bank Name")}
                      colLabel="6"
                      value={data.sellerBankName}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Vendor Bank Account No")}
                      colLabel="6"
                      value={data.sellerBankAccountNumber}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Vendor Bank Branch")}
                      colLabel="6"
                      value={data.sellerBankBranchCode}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Send to SCB Date")}
                      colLabel="6"
                      value={
                        data.lastGeneratedDate
                          ? moment(data.lastGeneratedDate).format("DD/MM/YYYY")
                          : ""
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label={t("SCB Payment Status")}
                      colLabel="6"
                      value={scbPaymentStatus}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("SCB Result Date")}
                      colLabel="6"
                      value={
                        data.settlementProcessedDate
                          ? moment(data.settlementProcessedDate).format(
                              "DD/MM/YYYY"
                            )
                          : ""
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label={t("SCB Payment Reason")}
                      colLabel="6"
                      value={data.settledMessage}
                    />
                  </div>
                  <div className="col-12 col-lg-6">
                    <CollapseItemText
                      t={t}
                      label={t("Initial Payment Amount")}
                      colLabel="6"
                      value={`${this.formatCurrencyDigit(
                        data.paymentAmount,
                        2
                      )} ${data.currency}`}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Withholding Tax Amount")}
                      colLabel="6"
                      value={
                        data.withholdingTax
                          ? data.withholdingTax.totalWhtAmount
                            ? this.formatCurrencyDigit(
                                data.withholdingTax.totalWhtAmount,
                                2
                              )
                            : this.formatCurrencyDigit(0,2)
                          : this.formatCurrencyDigit(0,2)
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label={t("BAHTNET Fee")}
                      colLabel="6"
                      value={`${this.formatCurrencyDigit(data.paymentFee, 2)} ${
                        data.currency
                      }`}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Actual Payment Amount")}
                      colLabel="6"
                      value={`${this.formatCurrencyDigit(
                        this.calculateActualPaymentAmount(data),
                        2
                      )} ${data.currency}`}
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Payment Posting Date")}
                      colLabel="6"
                      value={
                        data.lastPostedDate
                          ? moment(data.lastPostedDate).format("DD/MM/YYYY")
                          : ""
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Payment Posting Status")}
                      colLabel="6"
                      value={
                        data.postingStatus === "SUCCESS" ||
                        data.postingStatus === "FAILED"
                          ? data.postingStatus === "SUCCESS"
                            ? "Success"
                            : "Failed"
                          : ""
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label={t("FI Doc No")}
                      colLabel="6"
                      value={
                        data.customisedFields
                          ? data.customisedFields.paymentRes
                            ? data.customisedFields.paymentRes
                                .AccountingDocumentNumber
                            : ""
                          : ""
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label={t("FI Doc Year")}
                      colLabel="6"
                      value={
                        data.customisedFields
                          ? data.customisedFields.paymentRes
                            ? data.customisedFields.paymentRes
                                .FiscalYearOfPaymentDoc
                            : ""
                          : ""
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Payment Posting Reason")}
                      colLabel="6"
                      value={
                        data.customisedFields
                          ? data.customisedFields.paymentRes
                            ? data.customisedFields.paymentRes.MessageText
                            : ""
                          : ""
                      }
                    />
                    <CollapseItemText
                      t={t}
                      label={t("Payment Clearing Status")}
                      colLabel="6"
                      value={data.clearingStatus === "SUCCESS" ? "Cleared" : ""}
                    />
                  </div>
                </div>
              </Collapse>
              <Collapse
                id="withholdingTax"
                expanded="true"
                collapseHeader={[t("Withholding Tax")]}
              >
                {/* Desktop Version - Start */}
                <div className="table_wrapper d-none d-lg-inline-block">
                  <div className="table-responsive">
                    <table className="table table-3 dataTable">
                      <thead>
                        <tr>
                          <th>Form Type</th>
                          <th>
                            Income
                            <br /> Type
                          </th>
                          <th>Income Description</th>
                          <th>
                            WHT
                            <br /> Code
                          </th>
                          <th>
                            WHT
                            <br /> Rate
                          </th>
                          <th>
                            WHT
                            <br /> Base
                          </th>
                          <th>WHT Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.withholdingTax &&
                        data.withholdingTax.withholdingTaxItem ? (
                          data.withholdingTax.withholdingTaxItem.length > 0 ? (
                            data.withholdingTax.withholdingTaxItem.map(item => {
                              return (
                                <tr>
                                  <td>
                                    {data.withholdingTax.whtFormType || "-"}
                                  </td>
                                  <td>{item.whtIncomeType || "-"}</td>
                                  <td>
                                    {item.whtIncomeTypeDescription || "-"}
                                  </td>
                                  <td>{item.whtCode || "-"}</td>
                                  <td>{item.whtRate || "-"}</td>
                                  <td>
                                    {this.formatCurrencyDigit(
                                      item.incomeTypeAmount,
                                      2
                                    ) || "-"}
                                  </td>
                                  <td>
                                    {this.formatCurrencyDigit(
                                      item.whtAmount,
                                      2
                                    ) || "-"}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="7" className="text-center">
                                No Item Found
                              </td>
                            </tr>
                          )
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center">
                              No Item Found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Desktop Version - End */}

                {/* Mobile Version - Start */}
                <div className="table_wrapper d-inline-block d-lg-none">
                  <div className="table-responsive">
                    <table className="table table-3 dataTable">
                      <thead>
                        <tr>
                          <th>{t("Form Type")}</th>
                          <th>{t("Income Type")}</th>
                          <th>{t("More")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.withholdingTax &&
                        data.withholdingTax.withholdingTaxItem ? (
                          data.withholdingTax.withholdingTaxItem.length > 0 ? (
                            data.withholdingTax.withholdingTaxItem.map(
                              (item, index) => {
                                return (
                                  <React.Fragment>
                                    <tr>
                                      <td>
                                        {data.withholdingTax.whtFormType || "-"}
                                      </td>
                                      <td>{item.whtIncomeType || "-"}</td>
                                      <td>
                                        <a
                                          href={`#withholding-detail-${index}`}
                                          data-toggle="collapse"
                                          role="button"
                                          aria-expanded="false"
                                          area-controls={`#withholding-detail-${index}`}
                                          className="d-flex w-100 purple btnTableToggle"
                                        >
                                          <strong className="textOnHide">
                                            <i className="fa fa-ellipsis-h purple mx-auto" />
                                          </strong>
                                          <strong className="textOnShow">
                                            <i className="fa fa-times purple mx-auto" />
                                          </strong>
                                        </a>
                                      </td>
                                    </tr>
                                    <tr
                                      id={`actionHistory-detail-${index}`}
                                      className="collapse multi-collapse"
                                    >
                                      <td colSpan="3">
                                        <div className="d-flex flex-wrap w-100">
                                          <div className="col-6 px-0 text-right">
                                            {t("Income Description")}:{" "}
                                          </div>
                                          <div className="col-6 text-left">
                                            {data.withholdingTax.whtFormType ||
                                              "-"}
                                          </div>
                                          <div className="col-6 px-0 text-right">
                                            {t("WHT Code")}
                                          </div>
                                          <div className="col-6 text-left">
                                            {item.whtCode || "-"}
                                          </div>
                                          <div className="col-6 px-0 text-right">
                                            {t("WHT Rate")}
                                          </div>
                                          <div className="col-6 text-left">
                                            {item.whtRate || "-"}
                                          </div>
                                          <div className="col-6 px-0 text-right">
                                            {t("WHT Base")}
                                          </div>
                                          <div className="col-6 text-left">
                                            {this.formatCurrencyDigit(
                                              item.incomeTypeAmount,
                                              2
                                            ) || "-"}
                                          </div>
                                          <div className="col-6 px-0 text-right">
                                            {t("WHT Amount")}
                                          </div>
                                          <div className="col-6 text-left">
                                            {this.formatCurrencyDigit(
                                              item.whtAmount,
                                              2
                                            ) || "-"}
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  </React.Fragment>
                                );
                              }
                            )
                          ) : (
                            <tr>
                              <td colSpan="3" className="text-center">
                                {t("No Item Found")}
                              </td>
                            </tr>
                          )
                        ) : (
                          <tr>
                            <td colSpan="3" className="text-center">
                              {t("No Item Found")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Mobile Version - End */}
              </Collapse>
            </div>
          </section>
          <section
            id="invoice_detail_page"
            className="goodReceiveDetailPage box box--width-header pb-0 pb-lg-3"
          >
            <div className="box__header d-none d-lg-inline-block">
              <div className="row justify-content-between align-items-center mb-2">
                <div className="col-4" />
              </div>
            </div>
            <div className="box__inner">
              <Collapse
                id="invoiceCNList"
                expanded="true"
                collapseHeader={[t("Document List")]}
              >
                {/* Desktop version - Start */}
                <div className="table_wrapper d-none d-lg-inline-block">
                  <div className="table-responsive">
                    <table className="table table-3 dataTable">
                      <thead>
                        <tr>
                          <th>
                            {t("LIV Doc No1")}
                            <br /> {t("LIV Doc No2")}
                          </th>
                          <th>
                            {t("LIV Doc Year1")}
                            <br />
                            {t("LIV Doc Year2")}
                          </th>
                          <th>
                            {t("Document No1")}
                            <br /> {t("Document No2")}
                          </th>
                          <th>
                            {t("Document Type1")}
                            <br /> {t("Document Type2")}
                          </th>
                          <th>{t("Document Date")}</th>
                          <th>
                            {t("Payment Term1")}
                            <br />
                            {t("Payment Term2")}
                          </th>
                          <th>
                            {t("Original Due Date1")}
                            <br />
                            {t("Original Due Date2")}
                          </th>
                          <th>
                            {t("Final DOA Approve Date1")}
                            <br />
                            {t("Final DOA Approve Date2")}
                          </th>
                          <th>{t("Sub Total")}</th>
                          <th>{t("Tax Amount")}</th>
                          <th>{t("Total Amount")}</th>
                          <th>
                            {t("Retention Amount1")}
                            <br />
                            {t("Retention Amount2")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {documentArray ? (
                          documentArray.map(item => {
                            return (
                              <tr>
                                <td>{item.accountingDocumentNumber || "-"}</td>
                                <td>{item.fiscalYear}</td>
                                <td>{item.externalId}</td>
                                <td>{item.docType}</td>
                                <td>
                                  {moment(item.docDate).format("DD/MM/YYYY")}
                                </td>
                                <td>{item.paymentTermDay}</td>
                                <td>
                                  {item.originalDueDate != "-"
                                    ? moment(item.originalDueDate).format(
                                        "DD/MM/YYYY"
                                      )
                                    : "-"}
                                </td>
                                <td>
                                  {item.finalDOA != "-"
                                    ? moment(item.finalDOA).format("DD/MM/YYYY")
                                    : "-"}
                                </td>
                                <td>
                                  {this.formatCurrencyDigit(item.subTotal, 2)}
                                </td>
                                <td>
                                  {this.formatCurrencyDigit(item.taxAmount, 2)}
                                </td>
                                <td>
                                  {this.formatCurrencyDigit(
                                    item.totalAmount,
                                    2
                                  )}
                                </td>
                                <td>
                                  {this.formatCurrencyDigit(
                                    item.retentionAmount,
                                    2
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center">
                              No Item Found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Desktop Version - End */}

                {/* Mobile Version - Start */}
                <div className="table_wrapper d-inline-block d-lg-none">
                  <div className="table-responsive">
                    <table className="table table-3 dataTable">
                      <thead>
                        <tr>
                          <th>{t("LIV Doc No")}</th>
                          <th>{t("LIV Doc Year")}</th>
                          <th>{t("More")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documentArray ? (
                          documentArray.map((item, index) => {
                            return (
                              <React.Fragment>
                                <tr>
                                  <td>
                                    {item.accountingDocumentNumber || "-"}
                                  </td>
                                  <td>{item.fiscalYear}</td>
                                  <td>
                                    <a
                                      href={`#documentList-detail-${index}`}
                                      data-toggle="collapse"
                                      role="button"
                                      aria-expanded="false"
                                      area-controls={`#documentList-detail-${index}`}
                                      className="d-flex w-100 purple btnTableToggle"
                                    >
                                      <strong className="textOnHide">
                                        <i className="fa fa-ellipsis-h purple mx-auto" />
                                      </strong>
                                      <strong className="textOnShow">
                                        <i className="fa fa-times purple mx-auto" />
                                      </strong>
                                    </a>
                                  </td>
                                </tr>
                                <tr
                                  id={`documentList-detail-${index}`}
                                  className="collapse multi-collapse"
                                >
                                  <td colSpan="3">
                                    <div className="d-flex flex-wrap w-100">
                                      <div className="col-6 px-0 text-right">
                                        {t("Document No")}:{" "}
                                      </div>
                                      <div className="col-6 text-left">
                                        {item.externalId}
                                      </div>
                                      <div className="col-6 px-0 text-right">
                                        {t("Document Type")}
                                      </div>
                                      <div className="col-6 text-left">
                                        {item.docType}
                                      </div>
                                      <div className="col-6 px-0 text-right">
                                        {t("Document Date")}
                                      </div>
                                      <div className="col-6 text-left">
                                        {moment(item.docDate).format(
                                          "DD/MM/YYYY"
                                        )}
                                      </div>
                                      <div className="col-6 px-0 text-right">
                                        {t("Payment Term")}
                                      </div>
                                      <div className="col-6 text-left">
                                        {item.paymentTermDay}
                                      </div>
                                      <div className="col-6 px-0 text-right">
                                        {t("Original Due Date")}
                                      </div>
                                      <div className="col-6 text-left">
                                        {item.originalDueDate != "-"
                                          ? moment(item.originalDueDate).format(
                                              "DD/MM/YYYY"
                                            )
                                          : "-"}
                                      </div>
                                      <div className="col-6 px-0 text-right">
                                        {t("Final DOA Approve Date")}
                                      </div>
                                      <div className="col-6 text-left">
                                        {item.finalDOA != "-"
                                          ? moment(item.finalDOA).format(
                                              "DD/MM/YYYY"
                                            )
                                          : "-"}
                                      </div>
                                      <div className="col-6 px-0 text-right">
                                        {t("Sub Total")}
                                      </div>
                                      <div className="col-6 text-left">
                                        {this.formatCurrencyDigit(
                                          item.subTotal,
                                          2
                                        )}
                                      </div>
                                      <div className="col-6 px-0 text-right">
                                        {t("Tax Amount")}
                                      </div>
                                      <div className="col-6 text-left">
                                        {this.formatCurrencyDigit(
                                          item.taxAmount,
                                          2
                                        )}
                                      </div>
                                      <div className="col-6 px-0 text-right">
                                        {t("Total Amount")}
                                      </div>
                                      <div className="col-6 text-left">
                                        {this.formatCurrencyDigit(
                                          item.totalAmount,
                                          2
                                        )}
                                      </div>
                                      <div className="col-6 px-0 text-right">
                                        {t("Retention Amount")}
                                      </div>
                                      <div className="col-6 text-left">
                                        {this.formatCurrencyDigit(
                                          item.retentionAmount,
                                          2
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </React.Fragment>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center">
                              {t("No Item Found")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Mobile Version - End */}
              </Collapse>
            </div>
          </section>
        </BlockUi>
        <ModalAlert
          title={alertModalAlertTitle}
          visible={isAlertModalVisible}
          button={buttonAlert}
          isTextOnly={isTextOnly}
        >
          {alertModalMsg}
        </ModalAlert>
      </Layout>
    );
  }
}
export default withAuth(
  withTranslation(["payment-posting-detail", "detail", "menu"])(PaymentPostingDetail)
);
