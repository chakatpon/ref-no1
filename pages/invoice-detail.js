import React, { Component } from "react";
import Head from "next/head";
import Router from "next/router";
import _ from "lodash";
import moment from "moment";
import ReactDOM from "react-dom";
import { MobileView, BrowserView, isMobile } from "react-device-detect";
import handleError from "./handleError";
import Layout from "../components/Layout";
import withAuth from "../libs/withAuth";
import ApiService from "../libs/ApiService";
import ColumnList from "../libs/column";
import ColumnModalInvoice from "../components/column-modal-invoice";
import api from "../libs/api";
import BlockUi from "react-block-ui";
import ModalAlert, {
  BTN_ACTION_BACK,
  BTN_ACTION_CLOSE,
  BTN_ACTION_OK
} from "../components/modalAlert";
import ModalDropFile from "../components/modalDropFile";
import DayPicker from "react-day-picker";
import DayPickerInput from "react-day-picker/DayPickerInput";
import statusColor from "../configs/color.invoice.json";
import { i18n, withTranslation } from "~/i18n";
import mobileModel from "../columns/mobiles/invoice-item-list.json";
import GA from "~/libs/ga";
import MomentLocaleUtils, {
  formatDate,
  parseDate
} from "react-day-picker/moment";
import "../libs/mycools";
import {
  PageHeader,
  Collapse,
  CollapseItemText,
  CollapseItemExternalLink
} from "../components/page";
import statusColorMap from "../configs/color.invoice.json";
import { Config } from "aws-sdk";

var numeral = require("numeral");

const Api = new ApiService();
const lifecycleEdit = ["ISSUED", "PENDING_SELLER", "MISSING", "PARTIAL"];
const lifecycleCancel = ["ISSUED", "PENDING_SELLER"];
const lifecycleHold = [
  "ISSUED",
  "PARTIAL",
  "MISSING",
  "MATCHED",
  "UNMATCHED",
  "BASELINED",
  "PENDING_AUTHORITY",
  "PENDING_BUYER",
  "PARTIALLY_APPROVED",
  "APPROVED"
];
const lifecycleReviseDueDate = ["APPROVED", "UNMATCHED", "PENDING_BUYER"];
const lifecycleResubmit = ["APPROVED"];
const currentYear = new Date().getFullYear();
const fromMonth = new Date(currentYear, 0);
const toMonth = new Date(currentYear + 10, 11);
const FORMAT = "DD/MM/YYYY";

function YearMonthForm({ date, localeUtils, onChange }) {
  const months = localeUtils.getMonths();

  const years = [];
  for (let i = fromMonth.getFullYear(); i <= toMonth.getFullYear(); i += 1) {
    years.push(i);
  }

  const handleChange = function handleChange(e) {
    const { year, month } = e.target.form;
    onChange(new Date(year.value, month.value));
  };

  return (
    <form className="DayPicker-Caption">
      <select name="month" onChange={handleChange} value={date.getMonth()}>
        {months.map((month, i) => (
          <option key={month} value={i}>
            {month}
          </option>
        ))}
      </select>
      <select name="year" onChange={handleChange} value={date.getFullYear()}>
        {years.map(year => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </form>
  );
}

class invoiceDetail extends Component {
  constructor(props) {
    super(props);
    this.api = new ApiService();
    this.apis = new api(this.props.domain).group("invoice");
    this.apiPayment = new api(this.props.domain).group("payment-posting");
    this.columnList = new ColumnList();
    this.columnListItm = new ColumnList();
    this.handleConfirmCancelInvoice = this.handleConfirmCancelInvoice.bind(
      this
    );
    this.handleDismissBtnModal = this.handleDismissBtnModal.bind(this);
    this.routeToInvoiceList = this.routeToInvoiceList.bind(this);
    this.submitHold = this.submitHold.bind(this);
    this.submitUnhold = this.submitUnhold.bind(this);

    this.state = {
      taxRateList: [],
      UserAuthority: [],
      linearId: props.url.query.linearId,
      invoiceNumber: "",
      invoiceDetailData: {},
      innerPurchaseItem: {},
      innerAccounting: {},
      buyer: {},
      configuration: {},
      creditNoteRefer: [],
      creditNoteReferCount: 0,
      creditNoteSettled: [],
      creditNoteSettledItemLength: 0,
      attachmentTaxInvoice: [],
      attachmentReceipt: [],
      attachmentDeliveryNote: [],
      attachmentOther: [],
      purchaseItems: [],
      taxThreePercentItems: [],
      taxSevenPercentItems: [],
      taxThreePanelDisplay: true,
      taxSevenPanelDisplay: true,
      isAllowCancel: false,
      isAllowEdit: false,
      isAllowHold: false,
      isAllowUnhold: false,
      isAllowResubmit: false,
      isAllowCreateCN: false,
      isAllowReviseDueDate: false,
      isAllowInvoiceFinancing: false,
      revisedDueDateReason: "",
      breadcrumbs: [],
      columnList: [],
      errCaseMsg: "",
      blockSection1: true,
      blockSection2: true,
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      isTextOnly: true,
      buttonAlert: [],
      creditNoteReferFlag: false,
      revisePaymentDueDateModalTitle: "",
      isToggleRevisePaymentDueDateModal: false,
      buttonRevisePaymentDueDateModal: [],
      HoldModalTitle: "",
      isToggleHoldModal: false,
      buttonHoldModal: [],
      unHoldModalTitle: "",
      isToggleUnHoldModal: false,
      buttonUnHoldModal: [],
      lastHeldRemark: "",
      holdIsRequiredFlag: false,
      isAlertHoldModalVisible: false,
      lastUnheldRemark: "",
      isAlertUnholdModalVisible: false,
      isResubmitModalVisible: false,
      showPage: true,
      buttonResultAlert: [
        {
          label: "Close",
          attribute: {
            className: "btn btn-wide",
            onClick: this.toggleResultModal
          }
        }
      ],
      resubmitReasonText: "",
      resubmitFile: [],
      resultTitle: "",
      resultMsg: "",
      resultSucess: false,
      isResultVisible: false,
      remarkMsg: "",
      remarkPanel: false,
      onHoldStatus: false,
      lastHeldRemarkDisplay: "",
      configFileResubmit: {},
      selectedDate: "",
      reviseDateIsRequiredFlag: false,
      reviseReasonIsRequiredFlag: false,
      configHolidays: [],
      configBefore: "",
      configAfter: "",
      month: fromMonth,
      disabledDate: {},
      resultLoading: false,
      lifecycleInvoiceFinancing: [],
      paymentDueDateRange: {},
      customerReferenceNumber: "",
      columnListItem: [],
      moblieColumnListItem: mobileModel.table.columns
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
    const { linearId, ref, purchaseOrderNumber } = this.props.url.query;

    if (ref && ref.split(",")[0] == "po") {
      let breadcrumb = [];
      breadcrumb.push({ title: "Purchase Order", url: "/purchase-order" });
      breadcrumb.push({
        title: `PO No. ${purchaseOrderNumber}`,
        url: `/purchase-order-detail?linearId=${ref.split(",")[1]}`
      });
      breadcrumb.push({
        title: `Invoice Lists`,
        active: true
      });
      this.state.title = `Invoice No. INV-26019991 ${linearId}`;
      this.state.showSearchbox = false;
    }
  }

  componentWillMount() {
    this.permissionPage();
    this.setPermission();
  }

  async componentDidMount() {
    const { t } = this.props;
    const columnDisplayText = t("Column Display");
    const exportText = t("Export");

    $(document).ready(() => {
      makePopover(columnDisplayText, exportText);
    });
    await this.fetchData();
    this.getCreditNoteRefer();
    this.getModel();
    this.getPaymentDetailData();
    await this.getConfig();
    this.resolvePermission();
    this.setObjFileAttachmentsForComponent();
    this.setRemarkPanel();
    this.extractPurchaseItemByTaxRate();
    // this.taxItemPanelDisplayHandler();
    // await this.checkCreditNoteRefer();
    if (this.props.user.organisationUnit == "BUYER") {
      await this.getPaymentDueDateRange();
      this.getConfigHoliday();
    }
    if (this.state.invoiceDetailData.taggedCreditNotes) {
      if (this.state.invoiceDetailData.taggedCreditNotes.length > 0) {
        this.setSettledCreditNote();
      }
    }
    this.toggleBlockSection1();
    this.toggleBlockSection2();
  }

  permissionPage = () => {
    const { permisions } = this.props;
    if (!permisions.includes("Invoice-Detail")) {
      Router.push("/dashboard");
    }
  };

  setPermission = () => {
    const { permisions } = this.props;
    this.setState({
      UserAuthority: permisions
    });
  };

  getModel = async () => {
    try {
      const { t } = this.props;
      const itemInformationModel = await this.apis.call("itemInformationModel");
      if (itemInformationModel.table) {
        for (let i in itemInformationModel.table.columns) {
          itemInformationModel.table.columns[i].searchKey =
            itemInformationModel.table.columns[i].header;
          itemInformationModel.table.columns[i].header = await t(
            itemInformationModel.table.columns[i].header.replace(
              /[|&;$%@"<>()+,.-]/g,
              ""
            )
          );
        }
        const columnListItem = itemInformationModel.table.columns;
        this.setState({
          columnListItem
        });
      }
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal, "BTN_BACK");
      this.setState({
        ...response
      });
    }
  };

  fetchData = async () => {
    try {
      const res = await this.apis.call("detail", {
        linearId: this.state.linearId,
        role: this.props.user.organisationUnit
      });
      if (res.rows.length === 0) {
        const message = [
          "Sorry, you cannot get detail of this invoice.",
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
        return Promise.reject();
      } else {
        await this.setState({
          invoiceDetailData: res.rows[0],
          innerPurchaseItem: res.rows[0].items[0].purchaseItem,
          innerAccounting: res.rows[0].accounting,
          buyer: res.rows[0].buyer,
          purchaseItems: res.rows[0].items,
          invoiceNumber: res.rows[0].externalId
        });
      }
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal, "BTN_BACK");
      this.setState({
        ...response
      });
    }
  };

  getPaymentDetailData = async () => {
    try {
      const { invoiceDetailData } = this.state;
      if (
        invoiceDetailData.paymentItemLinearId &&
        this.props.user.organisationUnit != "SELLER" &&
        this.props.permisions.includes("MONITOR-Payment-Detail")
      ) {
        const res = await this.apiPayment.call("detail", {
          linearId: invoiceDetailData.paymentItemLinearId
        });

        this.setState({
          customerReferenceNumber: res.data[0].customerReference
        });
      }
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }
  };

  async getConfig() {
    try {
      const { buyer, invoiceDetailData } = this.state;
      const config = await this.apis.call("invoiceConfig", {
        legalName: buyer.legalName,
        companyTaxId: invoiceDetailData.companyTaxNumber,
        vendorTaxId: invoiceDetailData.vendorTaxNumber
      });
      if (!config && !config.attachmentConfiguration) {
        const message = [
          "The necessary configuration is not found.",
          <br />,
          "CONFIG_OPTION:  INVOICE_ATTACHMENT",
          <br />,
          "Please contact your administrator for assistance."
        ];
        const response = handleError(
          message,
          this.handleDismissBtnModal,
          "BTN_BACK"
        );
        this.setState({
          ...response
        });
      } else {
        const configFileResubmit = config.attachmentConfiguration.filter(
          configFile => configFile.attachmentType === "BuyerReject"
        )[0];
        this.setState({
          configuration: config,
          configFileResubmit
        });
      }
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }
  }

  async getCreditNoteRefer() {
    try {
      const { linearId } = this.state;
      let res = await this.apis.call("creditNoteReferToInvoice", {
        invoiceLinearId: linearId,
        bypass: true,
        role: this.props.user.organisationUnit
      });

      this.setState({
        creditNoteRefer: res.data,
        creditNoteReferCount: res.data.length
      });
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }
  }

  async getConfigHoliday() {
    try {
      const { invoiceDetailData } = this.state;
      let legalName = "";
      let dateFormat = moment().format("YYYY-MM-DDTHH:mm:ss.000") + "Z";
      if (invoiceDetailData) {
        if (invoiceDetailData.bank) {
          legalName = invoiceDetailData.bank.legalName;
        } else {
          let response = await this.apis.call("bankLegalName");
          legalName = response[0].value;
        }
      }

      let res = await this.apis.call("configHoliday", {
        party: legalName,
        dateFrom: dateFormat
      });

      this.setConfigHoliday(res.holidays);
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }
  }

  setConfigHoliday(holidays) {
    const { invoiceDetailData, paymentDueDateRange } = this.state;
    let now = moment().format();
    let initialDueDate = invoiceDetailData.initialDueDate;
    let before = moment(paymentDueDateRange.dateFrom).toDate();
    let after = moment(paymentDueDateRange.dateTo).toDate();

    let date = [];
    date = holidays.map(h => {
      let t = new Date(h * 1000);
      let d = t.getDate();
      let m = t.getMonth();
      let y = t.getFullYear();
      return new Date(y, m, d);
    });

    let data = {
      after,
      before
    };
    date = [...date, data];

    this.setState({
      configHolidays: date,
      configBefore: before,
      configAfter: after,
      disabledDate: date
    });
  }

  setSettledCreditNote = () => {
    let url = "";
    this.state.invoiceDetailData.taggedCreditNotes.map(item => {
      url = url + "&linearIds=" + item.linearId;
    });
    this.getSettledCreditNote(url);
  };

  getSettledCreditNote = async url => {
    try {
      const res = await this.apis.call("settledCreditNote", { url: url });
      this.setState({
        creditNoteSettledItemLength: res.data.length,
        creditNoteSettled: res.data
      });
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }
  };

  getPaymentDueDateRange = async () => {
    const { companyTaxNumber, initialDueDate } = this.state.invoiceDetailData;
    const payload = {
      linearId: this.props.url.query.linearId,
      companyTaxId: companyTaxNumber,
      initialDueDate: moment(initialDueDate).format("DD/MM/YYYY")
    };
    try {
      const res = await this.apis.call("paymentDueDateRange", payload);
      this.setState({
        paymentDueDateRange: res.data
      });
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }
  };

  resolvePermission() {
    let isAllowCancel = false;
    let isAllowEdit = false;
    let isAllowHold = false;
    let isAllowUnhold = false;
    let isAllowResubmit = false;
    let isAllowCreateCN = false;
    let isAllowReviseDueDate = false;
    let isAllowInvoiceFinancing = false;

    const { attachmentConfiguration } = this.state.configuration;
    if (attachmentConfiguration) {
      let allLifeCycle = attachmentConfiguration.reduce(
        (newArray, fileConfig) => {
          if (fileConfig.allowedLifecycle) {
            return [...newArray, ...fileConfig.allowedLifecycle];
          } else {
            return [...newArray];
          }
        },
        []
      );
      const unionLifeCycle = new Set(allLifeCycle);
      allLifeCycle = [...unionLifeCycle];
      allLifeCycle = allLifeCycle.concat(lifecycleEdit);

      if (
        allLifeCycle.includes(this.state.invoiceDetailData.lifecycle) &&
        this.state.UserAuthority.includes("Invoice-Edit") &&
        this.props.user.organisationUnit == "SELLER"
      ) {
        if (
          (this.state.invoiceDetailData &&
            this.state.invoiceDetailData.isETaxInvoice === undefined) ||
          this.state.invoiceDetailData.isETaxInvoice === false
        ) {
          isAllowEdit = true;
        }
      }
    }
    if (lifecycleCancel.includes(this.state.invoiceDetailData.lifecycle)) {
      if (this.state.UserAuthority.includes("Invoice-Cancel")) {
        if (this.props.user.organisationUnit == "SELLER") {
          if (
            this.state.invoiceDetailData &&
            (this.state.invoiceDetailData.isETaxInvoice === undefined ||
              this.state.invoiceDetailData.isETaxInvoice === false)
          ) {
            isAllowCancel = true;
          }
        }
      }
    }
    // if (lifecycleEdit.includes(this.state.invoiceDetailData.lifecycle)) {
    //   if (this.state.UserAuthority.includes("Invoice-Edit")) {
    //     if (this.props.user.organisationUnit == "SELLER") {
    //       if (
    //         (this.state.invoiceDetailData &&
    //           this.state.invoiceDetailData.isETaxInvoice === undefined) ||
    //         this.state.invoiceDetailData.isETaxInvoice === false
    //       ) {
    //         isAllowEdit = true;
    //       }
    //     }
    //   }
    // }
    if (lifecycleHold.includes(this.state.invoiceDetailData.lifecycle)) {
      if (this.state.UserAuthority.includes("Invoice-Hold")) {
        if (this.props.user.organisationUnit == "BUYER") {
          if (
            this.state.invoiceDetailData.isOnHold !== undefined &&
            this.state.invoiceDetailData.isOnHold !== true
          ) {
            isAllowHold = true;
          }
        }
      }
    }
    if (this.state.invoiceDetailData.lifecycle !== "CANCELLED") {
      if (this.state.UserAuthority.includes("Invoice-Unhold")) {
        if (this.props.user.organisationUnit == "BUYER") {
          if (
            this.state.invoiceDetailData.isOnHold !== undefined &&
            this.state.invoiceDetailData.isOnHold === true
          ) {
            isAllowUnhold = true;
          }
        }
      }
    }

    if (this.state.UserAuthority.includes("CN-Create")) {
      if (this.props.user.organisationUnit == "SELLER") {
        isAllowCreateCN = true;
      }
    }

    if (
      lifecycleReviseDueDate.includes(this.state.invoiceDetailData.lifecycle)
    ) {
      if (
        this.state.UserAuthority.includes("Invoice-Edit-PaymentDueDate") &&
        this.state.invoiceDetailData.invoiceFinancing === "N" &&
        !this.state.invoiceDetailData.dueDateIsLocked
      ) {
        if (this.props.user.organisationUnit == "BUYER") {
          isAllowReviseDueDate = true;
        }
      }
    }
    if (
      this.state.configuration &&
      this.state.configuration.allowedLifeCycleToEditInvoiceFinancing
    ) {
      if (
        this.state.configuration.allowedLifeCycleToEditInvoiceFinancing.includes(
          this.state.invoiceDetailData.lifecycle
        )
      ) {
        if (
          this.state.UserAuthority.includes("Invoice-Edit-InvoiceFinancing")
        ) {
          if (this.props.user.organisationUnit == "SELLER") {
            isAllowInvoiceFinancing = true;
          }
        }
      }
    }

    if (lifecycleResubmit.includes(this.state.invoiceDetailData.lifecycle)) {
      if (this.state.UserAuthority.includes("Invoice-Reject-After-DOA")) {
        if (this.props.user.organisationUnit == "BUYER") {
          isAllowResubmit = true;
        }
      }
    }

    this.setState({
      isAllowCancel: isAllowCancel,
      isAllowEdit: isAllowEdit,
      isAllowHold: isAllowHold,
      isAllowUnhold: isAllowUnhold,
      isAllowResubmit: isAllowResubmit,
      isAllowCreateCN: isAllowCreateCN,
      isAllowReviseDueDate: isAllowReviseDueDate,
      isAllowInvoiceFinancing: isAllowInvoiceFinancing
    });
  }

  handleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  extractPurchaseItemByTaxRate() {
    let purchaseItem = this.state.purchaseItems;
    let taxRateList = [];
    let taxRateListItem = {};

    purchaseItem.forEach(item => {
      if (item.withholdingTaxPercent === 0) {
        item.withholdingTaxPercent = "0.00";
      }
      if (!item.withholdingTaxCode) {
        item.withholdingTaxCode = "-";
      }
      if (taxRateList.includes(item.vatRate) == false) {
        taxRateList.push(item.vatRate);
        taxRateListItem[`tax${item.vatRate}`] = [];
      }
      taxRateListItem[`tax${item.vatRate}`] = [
        ...taxRateListItem[`tax${item.vatRate}`],
        item
      ];
    });
    this.setState({
      taxRateList,
      taxRateListItem
    });
  }

  setRemarkPanel = () => {
    const { invoiceDetailData } = this.state;
    if (invoiceDetailData.lifecycle === "PENDING_SELLER") {
      if (
        invoiceDetailData.buyerRejectedRemark !== undefined &&
        invoiceDetailData.buyerRejectedRemark !== "" &&
        invoiceDetailData.previousAuthority !== undefined &&
        invoiceDetailData.previousAuthority.remark !== ""
      ) {
        if (
          invoiceDetailData.buyerRejectedDate >
          invoiceDetailData.previousAuthority.approvedDate
        ) {
          this.setState({
            remarkMsg: invoiceDetailData.buyerRejectedRemark,
            remarkPanel: true
          });
        } else {
          this.setState({
            remarkMsg: invoiceDetailData.previousAuthority.remark,
            remarkPanel: true
          });
        }
      } else if (
        invoiceDetailData.buyerRejectedRemark !== undefined &&
        invoiceDetailData.buyerRejectedRemark !== ""
      ) {
        this.setState({
          remarkMsg: invoiceDetailData.buyerRejectedRemark,
          remarkPanel: true
        });
      } else if (
        invoiceDetailData.previousAuthority.remark !== undefined &&
        invoiceDetailData.previousAuthority.remark !== ""
      ) {
        this.setState({
          remarkMsg: invoiceDetailData.previousAuthority.remark,
          remarkPanel: true
        });
      }
    }

    if (
      this.props.user.organisationUnit === "BUYER" &&
      invoiceDetailData.isOnHold !== undefined &&
      invoiceDetailData.isOnHold === true
    ) {
      this.setState({
        remarkPanel: true,
        onHoldStatus: true,
        lastHeldRemarkDisplay: invoiceDetailData.lastHeldRemark
      });
    }
  };

  checkCreditNoteRefer() {
    let creditNoteReferFlag = true;
    let creditNoteReferChecked = [];
    creditNoteReferChecked = this.state.invoiceDetailData.items.filter(
      item =>
        item.creditNoteAdjustedSubtotal !== 0 ||
        item.creditNoteQuantity.initial !== 0 ||
        item.debitNoteAdjustedSubTotal !== 0
    );
    if (creditNoteReferChecked.length > 0) {
      creditNoteReferFlag = false;
    }
    return creditNoteReferFlag;
  }

  handleCancelInvoiceBtn = async () => {
    this.toggleBlockSection1();
    this.toggleBlockSection2();
    const flag = await this.checkCreditNoteRefer();
    this.toggleBlockSection1();
    this.toggleBlockSection2();
    if (flag) {
      this.setState({
        isAlertModalVisible: true,
        alertModalAlertTitle: "Cancel Invoice",
        isTextOnly: true,
        alertModalMsg: [
          "Do you want to cancel this invoice?",
          <br />,
          <span class="red">
            Warning: Invoice Number cannot reuse when you cancel this invoice.
          </span>
        ],
        buttonAlert: [
          {
            label: "No",
            attribute: {
              className: "btn btn--transparent btn-wide",
              onClick: this.handleDismissBtnModal
            }
          },
          {
            label: "Yes",
            attribute: {
              className: "btn btn-wide",
              onClick: this.handleConfirmCancelInvoice
            }
          }
        ]
      });
    } else {
      this.setState({
        isAlertModalVisible: true,
        alertModalAlertTitle: "Cancel Invoice",
        isTextOnly: true,
        alertModalMsg: [
          "Not allow editing/resubmitting an invoice.",
          <br />,
          "Since there is an active credit note or debit note refers to this invoice."
        ],
        buttonAlert: [
          {
            label: "Close",
            attribute: {
              className: "btn btn--transparent btn-wide",
              onClick: this.handleDismissBtnModal
            }
          }
        ]
      });
    }
  };

  handleDismissBtnModal() {
    this.setState({
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      buttonAlert: []
    });
  }

  async handleConfirmCancelInvoice() {
    let cancelObj = {
      linearId: this.state.linearId,
      cancelledRemark: "Wrong information"
    };
    try {
      GA.event({
        category: "Invoice",
        action: "Cancel invoice (Request)",
        label: `Invoice | ${this.state.invoiceNumber} | ${moment().format()}`
      });

      this.toggleBlockSection1();
      this.toggleBlockSection2();
      this.setState({
        isAlertModalVisible: false
      });
      const res = await this.apis.call(
        "cancel",
        {},
        {
          method: "put",
          data: cancelObj
        }
      );
      this.setState({
        alertModalAlertTitle: "",
        alertModalMsg: "",
        buttonAlert: []
      });

      GA.event({
        category: "Invoice",
        action: "Cancel invoice (Success)",
        label: `Invoice | ${this.state.invoiceNumber} | ${moment().format()}`
      });

      this.routeToInvoiceList();
    } catch (err) {
      GA.event({
        category: "Invoice",
        action: "Cancel invoice (Failed)",
        label: `Invoice | ${this.state.invoiceNumber} | ${moment().format()}`
      });

      this.toggleBlockSection1();
      this.toggleBlockSection2();
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }
  }

  onResubmitReasonChange = e => {
    this.setState({
      resubmitReasonText: e.target.value
    });
  };

  onResubmitFileChange = files => {
    this.setState({
      resubmitFile: files
    });
  };
  toggleResubmitModal = async () => {
    this.toggleBlockSection1();
    this.toggleBlockSection2();
    const flag = await this.checkCreditNoteRefer();
    this.toggleBlockSection1();
    this.toggleBlockSection2();
    if (flag) {
      this.setState({
        isResubmitModalVisible: !this.state.isResubmitModalVisible
      });
    } else {
      this.setState({
        isAlertModalVisible: true,
        alertModalAlertTitle: "Request to resubmit",
        isTextOnly: true,
        alertModalMsg: [
          "Not allow editing/resubmitting an invoice.",
          <br />,
          "Since there is an active credit note or debit note refers to this invoice."
        ],
        buttonAlert: [
          {
            label: "Close",
            attribute: {
              className: "btn btn--transparent btn-wide",
              onClick: this.handleDismissBtnModal
            }
          }
        ]
      });
    }
  };
  toggleResultModal = () => {
    this.setState({
      isResultVisible: !this.state.isResultVisible
    });
  };

  onResubmit = async () => {
    const prepareData = {
      apiName: "requestInvoiceResubmit",
      files: this.state.resubmitFile,
      reason: this.state.resubmitReasonText,
      headOfMessage: "Request to resubmit",
      title: "Request to resubmit",
      type: "BuyerResubmit"
    };
    await this.sendData(prepareData);
  };

  uploadFile = async files => {
    try {
      const uploadPromise = files.map(file => {
        const data = new FormData();
        data.append("file", file);
        return Api.postUploadFile(data);
      });
      const result = await Promise.all(uploadPromise);
      return result.map(uploadedFile => uploadedFile[0]);
    } catch (e) {
      return false;
    }
  };

  sendData = async ({ apiName, files, reason, headOfMessage, title, type }) => {
    try {
      if (type === "BuyerResubmit") {
        GA.event({
          category: "Invoice",
          action: "Reject invoice (Request)",
          label: `Invoice | ${this.state.invoiceNumber} | ${moment().format()}`
        });
      }

      this.toggleBlockSection1();
      this.toggleBlockSection2();
      this.setState({
        resultLoading: true
      });
      this.toggleResultModal();
      const uploadedFileList = await this.uploadFile(files);
      const newFileAttachments = uploadedFileList.map(uploadedFile => ({
        ...uploadedFile,
        attachmentType: type
      }));
      let ReqObj = {
        method: "put",
        data: {
          linearId: this.state.invoiceDetailData.linearId,
          buyerRejectedRemark: reason,
          fileAttachments: [...newFileAttachments],
          attachmentType: type
        }
      };
      const res = await this.apis.call(apiName, {}, ReqObj);
      this.setState({
        resultTitle: title,
        resultMsg: `${headOfMessage} for invoice no. ${this.state.invoiceDetailData.externalId} completed.`,
        resultLoading: false,
        resultSucess: true
      });

      if (type === "BuyerResubmit") {
        GA.event({
          category: "Invoice",
          action: "Reject invoice (Success)",
          label: `Invoice | ${this.state.invoiceNumber} | ${moment().format()}`
        });
      }

      await this.fetchData();
      this.getCreditNoteRefer();
      this.getModel();
      this.getPaymentDetailData();
      await this.getConfig();
      this.resolvePermission();
      this.setObjFileAttachmentsForComponent();
      this.setRemarkPanel();
      this.extractPurchaseItemByTaxRate();
      if (this.props.user.organisationUnit == "BUYER") {
        await this.getPaymentDueDateRange();
        this.getConfigHoliday();
      }
      if (this.state.invoiceDetailData.taggedCreditNotes) {
        if (this.state.invoiceDetailData.taggedCreditNotes.length > 0) {
          this.setSettledCreditNote();
        }
      }
      this.toggleBlockSection1();
      this.toggleBlockSection2();
    } catch (e) {
      console.error(e);

      if (title === "Request to resubmit") {
        GA.event({
          category: "Invoice",
          action: "Reject invoice (Failed)",
          label: `Invoice | ${this.state.invoiceNumber} | ${moment().format()}`
        });
      }

      if (e.response && e.response.data && e.response.data.message) {
        this.toggleBlockSection1();
        this.toggleBlockSection2();
        this.setState({
          resultTitle: title,
          resultMsg: `${headOfMessage} for invoice no. ${this.state.invoiceDetailData.externalId} failed.`,
          errorMessage: e.response.data.message,
          resultSucess: false,
          resultLoading: false,
          buttonResultAlert: [
            {
              label: "Close",
              attribute: {
                className: "btn btn--transparent btn-wide",
                onClick: this.handleDismissResultModal
              }
            }
          ]
        });
      }
    }
  };

  handleDismissResultModal = () => {
    this.setState({
      isResultVisible: false
    });
  };

  getCalItemsSubTotal(items) {
    let subTotal = 0;
    items.forEach(item => {
      subTotal = subTotal + +item.itemSubTotal;
    });
    return subTotal;
  }

  routeToEditMode = async () => {
    this.toggleBlockSection1();
    this.toggleBlockSection2();
    const flag = await this.checkCreditNoteRefer();
    this.toggleBlockSection1();
    this.toggleBlockSection2();
    if (flag) {
      Router.push("/invoice-edit?linearId=" + this.state.linearId);
    } else {
      this.setState({
        isAlertModalVisible: true,
        alertModalAlertTitle: "Request to resubmit",
        isTextOnly: true,
        alertModalMsg: [
          "Not allow editing/resubmitting an invoice.",
          <br />,
          "Since there is an active credit note or debit note refers to this invoice."
        ],
        buttonAlert: [
          {
            label: "Close",
            attribute: {
              className: "btn btn--transparent btn-wide",
              onClick: this.handleDismissBtnModal
            }
          }
        ]
      });
    }
  };
  routeToInvoiceList() {
    Router.push("/invoice");
  }

  routeToGetFile(hash) {
    Api.getInvoiceAttachment(hash)
      .then(res => res.downloadPath)
      .then(path => {
        let newPath = path.replace(/:([0-9]+)/, "");
        Router.push(newPath);
      });
  }

  generateRowTableForCreditNoteSettled(creditnoteSettled) {
    const { t } = this.props;
    if (this.state.creditNoteSettledItemLength > 0) {
      return _.map(
        creditnoteSettled,
        (
          {
            externalId,
            linearId,
            adjustmentType,
            reason,
            creditNoteDate,
            total,
            status,
            currency,
            invoiceExternalId,
            invoiceLinearId
          },
          index
        ) => (
          <React.Fragment key={index}>
            <tr>
              <td>{index + 1}</td>
              <td>
                {externalId && linearId ? (
                  <a
                    href={`/credit-note-detail?linearId=${linearId}&ref=inv,${invoiceLinearId}&invoiceNumber=${invoiceExternalId}`}
                    data-href={`/credit-note-detail?linearId=${linearId}&ref=inv,${invoiceLinearId}&invoiceNumber=${invoiceExternalId}`}
                    className="link list-link"
                  >
                    {externalId}
                  </a>
                ) : (
                  externalId
                )}
              </td>
              <td>
                {adjustmentType
                  ? adjustmentType === "Goods Return"
                    ? "Quantity Adjustment"
                    : adjustmentType
                  : "-"}
              </td>
              <td>{reason ? reason : "-"}</td>
              <td>
                {creditNoteDate
                  ? moment(creditNoteDate)
                      .format("DD/MM/YYYY")
                      .toString()
                  : "-"}
              </td>
              <td>{total ? this.formatCurrency(total, 2) : "-"}</td>
              <td>
                {this.state.invoiceDetailData
                  ? this.state.invoiceDetailData.taggedCreditNotes.map(itm => {
                      if (linearId === itm.linearId) {
                        return this.formatCurrency(itm.knockedAmount, 2);
                      }
                    })
                  : "-"}
              </td>
              <td>{status ? status : "-"}</td>
              <td>{currency ? currency : "-"}</td>
            </tr>
          </React.Fragment>
        )
      );
    } else {
      return (
        <tr>
          <td colSpan="9" className="text-center">
            {t("No Item Found")}
          </td>
        </tr>
      );
    }
  }

  generateRowTableForCreditNoteSettledMobile(creditnoteSettled) {
    const { t } = this.props;
    if (this.state.creditNoteSettledItemLength > 0) {
      return _.map(
        creditnoteSettled,
        (
          {
            externalId,
            linearId,
            adjustmentType,
            reason,
            creditNoteDate,
            total,
            status,
            currency,
            invoiceExternalId,
            invoiceLinearId
          },
          index
        ) => (
          <React.Fragment key={index}>
            <tr>
              <td>
                {externalId && linearId ? (
                  <a
                    href={`/credit-note-detail?linearId=${linearId}&ref=inv,${invoiceLinearId}&invoiceNumber=${invoiceExternalId}`}
                    data-href={`/credit-note-detail?linearId=${linearId}&ref=inv,${invoiceLinearId}&invoiceNumber=${invoiceExternalId}`}
                    className="link list-link"
                  >
                    {externalId}
                  </a>
                ) : (
                  externalId
                )}
              </td>
              <td>
                {adjustmentType
                  ? adjustmentType === "Goods Return"
                    ? "Quantity Adjustment"
                    : adjustmentType
                  : "-"}
              </td>
              <td>{status ? status : "-"}</td>
              <td className="control">
                <a
                  href={`#cnSettle-detail-${index}`}
                  data-toggle="collapse"
                  role="button"
                  aria-expanded="false"
                  area-controls={`#cnSettle-detail-${index}`}
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
              id={`cnSettle-detail-${index}`}
              className="collapse multi-collapse"
            >
              <td colSpan="4">
                <div className="d-flex flex-wrap w-100">
                  <div className="col-6 px-0 text-right">CN Reason: </div>
                  <div className="col-6 text-left">{reason ? reason : "-"}</div>
                  <div className="col-6 px-0 pt-3 text-right">CN Date: </div>
                  <div className="col-6 pt-3 text-left">
                    {creditNoteDate
                      ? moment(creditNoteDate)
                          .format("DD/MM/YYYY")
                          .toString()
                      : "-"}
                  </div>
                  <div className="col-6 px-0 pt-3 text-right">
                    CN Amount (Inc. VAT):{" "}
                  </div>
                  <div className="col-6 pt-3 text-left">
                    {total ? this.formatCurrency(total, 2) : "-"}
                  </div>
                  <div className="col-6 px-0 pt-3 text-right">Settle Value</div>
                  <div className="col-6 pt-3 text-left">
                    {this.state.invoiceDetailData
                      ? this.state.invoiceDetailData.taggedCreditNotes.map(
                          itm => {
                            if (linearId === itm.linearId) {
                              return this.formatCurrency(itm.knockedAmount, 2);
                            }
                          }
                        )
                      : "-"}
                  </div>
                  <div className="col-6 px-0 py-3 text-right">Currency: </div>
                  <div className="col-6 py-3 text-left">
                    {currency ? currency : "-"}
                  </div>
                </div>
              </td>
            </tr>
          </React.Fragment>
        )
      );
    } else {
      return (
        <tr>
          <td colSpan="4" className="text-center">
            {t("No Item Found")}
          </td>
        </tr>
      );
    }
  }

  filterSubTotalCurrency = columnListItem => {
    return columnListItem.filter(
      column =>
        !(column.field === "itemSubTotal" || column.field === "currency")
    );
  };

  generateRowTableForTax(taxItems) {
    const { t } = this.props;
    let missingFiled = [];
    let { columnListItem } = this.state;
    columnListItem = this.filterSubTotalCurrency(columnListItem);
    columnListItem = columnListItem.filter(column => !column.hidden);
    if (taxItems.length > 0) {
      const tableBody = taxItems.map(taxItem => {
        const row = columnListItem.map(column => {
          const fieldItem = column.field.split(".");
          // console.log("fieldItem : ", fieldItem);
          let getItemFromField = fieldItem.reduce((acc, cur) => {
            // console.log("acc : ", acc);
            // console.log("cur : ", cur);
            if (Array.isArray(acc[cur])) {
              return acc[cur].length ? acc[cur][0] : {};
            }
            if (!acc[cur] && acc[0] && acc[0][cur]) {
              return acc[0][cur];
            }
            return acc[cur];
          }, taxItem);
          if (!getItemFromField) {
            missingFiled.push(column.field);
          }
          if (column.type === "number") {
            let fm = column.pattern || "#,###.00";
            getItemFromField = numeral(getItemFromField).format(fm);
          } else if (
            column.type == "date" ||
            column.templateName == "dueDate"
          ) {
            // column.pattern = column.pattern.toUpperCase().replace("HH:", "hh:");
            let old = getItemFromField;
            if (old == "" || old == "-") {
              getItemFromField = old;
              //return;
            } else {
              if (getItemFromField) {
                getItemFromField = moment(getItemFromField)
                  .tz("Asia/Bangkok")
                  .format(col.pattern);
              }

              //return;
            }
          }
          return (
            <td className="td-invoice">
              {getItemFromField || getItemFromField !== undefined
                ? getItemFromField
                : ""}
            </td>
          );
        });
        return <tr className="tr-invoice">{row}</tr>;
      });

      return tableBody;
    } else {
      return (
        <div>
          <center>{t("No Item Found")}</center>
        </div>
      );
    }
  }

  generateMobileMoreInfomationForTax(taxItems) {
    const { t } = this.props;
    let missingFiled = [];
    let { moblieColumnListItem } = this.state;

    moblieColumnListItem = moblieColumnListItem.filter(
      column => !column.hidden
    );
    if (taxItems.length > 0) {
      const tableBody = taxItems.map((taxItem, taxItemId) => {
        const row = moblieColumnListItem.slice(0, 2).map((column, i) => {
          const fieldItem = column.field.split(".");

          let getItemFromField = fieldItem.reduce((acc, cur) => {
            // console.log("acc : ", acc);
            // console.log("cur : ", cur);
            if (Array.isArray(acc[cur])) {
              return acc[cur].length ? acc[cur][0] : {};
            }
            if (!acc[cur] && acc[0] && acc[0][cur]) {
              return acc[0][cur];
            }
            return acc[cur];
          }, taxItem);
          if (!getItemFromField) {
            missingFiled.push(column.field);
          }
          if (column.type === "number") {
            let fm = column.pattern || "#,###.00";
            getItemFromField = numeral(getItemFromField).format(fm);
          } else if (
            column.type == "date" ||
            column.templateName == "dueDate"
          ) {
            // column.pattern = column.pattern.toUpperCase().replace("HH:", "hh:");
            let old = getItemFromField;
            if (old == "" || old == "-") {
              getItemFromField = old;
              //return;
            } else {
              if (getItemFromField) {
                getItemFromField = moment(getItemFromField)
                  .tz("Asia/Bangkok")
                  .format(col.pattern);
              }

              //return;
            }
          }
          if (i == 1) {
            return (
              <React.Fragment>
                <td className="text-center td-invoice-mobile">
                  {getItemFromField || getItemFromField !== undefined
                    ? getItemFromField
                    : ""}
                </td>
                <td>
                  <a
                    href={`#tax-detail-${taxItemId}`}
                    data-toggle="collapse"
                    role="button"
                    aria-expanded="false"
                    area-controls={`#tax-detail-${taxItemId}`}
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
              </React.Fragment>
            );
          } else {
            return (
              <td className="text-center td-invoice-mobile">
                {getItemFromField || getItemFromField !== undefined
                  ? getItemFromField
                  : ""}
              </td>
            );
          }
        });

        const moreInfo = moblieColumnListItem
          .slice(2, moblieColumnListItem.length)
          .map((column, i) => {
            const fieldItem = column.field.split(".");

            let getItemFromField = fieldItem.reduce((acc, cur) => {
              // console.log("acc : ", acc);
              // console.log("cur : ", cur);
              if (Array.isArray(acc[cur])) {
                return acc[cur].length ? acc[cur][0] : {};
              }
              if (!acc[cur] && acc[0] && acc[0][cur]) {
                return acc[0][cur];
              }
              return acc[cur];
            }, taxItem);
            if (!getItemFromField) {
              missingFiled.push(column.field);
            }
            if (column.type === "number") {
              let fm = column.pattern || "#,###.00";
              getItemFromField = numeral(getItemFromField).format(fm);
            } else if (
              column.type == "date" ||
              column.templateName == "dueDate"
            ) {
              let old = getItemFromField;
              if (old == "" || old == "-") {
                getItemFromField = old;
              } else {
                if (getItemFromField) {
                  getItemFromField = moment(getItemFromField)
                    .tz("Asia/Bangkok")
                    .format(col.pattern);
                }
              }
            }
            return (
              <React.Fragment>
                <div className="col-6 px-0 pb-3 text-right  more-info-header-mobile">
                  <span className="bold">
                    {t(column.header)}
                    {":"}
                  </span>
                </div>
                <div className="col-6 pb-3 text-left word-wrap more-info-value-mobile">
                  {getItemFromField || getItemFromField !== undefined
                    ? getItemFromField
                    : ""}
                </div>
              </React.Fragment>
            );
          });

        const moreRow = (
          <td colSpan="3">
            <div className="d-flex flex-wrap w-100">{moreInfo}</div>
          </td>
        );

        // return <div className="d-flex flex-wrap w-100">{row}</div>;
        return (
          <React.Fragment>
            <tr className="tr-invoice">{row}</tr>
            <tr
              id={`tax-detail-${taxItemId}`}
              className="collapse multi-collapse"
            >
              {moreRow}
            </tr>
          </React.Fragment>
        );
      });

      return tableBody;
    } else {
      return (
        <div className="d-flex flex-wrap w-100">
          <center>{t("No Item Found")}</center>
        </div>
      );
    }
  }

  renderCloneTable = taxItems => {
    const getRealHeight = () => {
      setTimeout(() => {
        const realTr = $(".tr-invoice");
        const cloneTr = $(".tr-invoice-clone");
        for (let index = 0; index < realTr.length; index++) {
          const height = $(realTr[index]).height();
          $(cloneTr[index]).height(height);
        }
      }, 1000);
    };
    getRealHeight();

    if (taxItems.length > 0) {
      return _.map(taxItems, ({ itemSubTotal, currency }, index) => (
        <tr className="tr-invoice-clone" key={index}>
          {
            <td className="td-invoice-clone text-right">
              {itemSubTotal ? this.formatCurrency(itemSubTotal, 2) : "-"}
            </td>
          }
          {<td className="td-invoice-clone">{currency ? currency : "-"}</td>}
        </tr>
      ));
    } else {
      return (
        <div>
          <center>{t("No Item Found")}</center>
        </div>
      );
    }
  };

  setObjFileAttachmentsForComponent() {
    let attachmentTaxInvoice = [];
    let attachmentReceipt = [];
    let attachmentDeliveryNote = [];
    let attachmentOther = [];
    if ("fileAttachments" in this.state.invoiceDetailData) {
      if (this.state.invoiceDetailData.fileAttachments.length > 0) {
        this.state.invoiceDetailData.fileAttachments.map(f => {
          const dt = {
            name: f.attachmentName,
            href: `/download/${f.attachmentHash}/${f.attachmentName}?filename=${f.attachmentName}&owner=${f.owner}`
          };
          if (f.attachmentType === "TaxInvoice") {
            attachmentTaxInvoice.push(dt);
          } else if (f.attachmentType === "Receipt") {
            attachmentReceipt.push(dt);
          } else if (f.attachmentType === "DeliveryNote") {
            attachmentDeliveryNote.push(dt);
          } else if (
            f.attachmentType === "Others" ||
            f.attachmentType === "Other"
          ) {
            attachmentOther.push(dt);
          }
        });
        this.setState({
          attachmentTaxInvoice: attachmentTaxInvoice,
          attachmentReceipt: attachmentReceipt,
          attachmentDeliveryNote: attachmentDeliveryNote,
          attachmentOther: attachmentOther
        });
      }
    }
  }

  handleHoldButton = () => {
    this.setState({
      holdModalTitle: "Hold Reason",
      isToggleHoldModal: true,
      buttonHoldModal: [
        {
          label: "Cancel",
          attribute: {
            className: "btn btn--transparent btn-wide",
            onClick: this.handleDismissHoldModal
          }
        },

        {
          label: "Submit",
          attribute: {
            className: "btn btn-wide",
            onClick: this.submitHold
          }
        }
      ]
    });
  };

  handleUnholdButton = () => {
    this.setState({
      unholdModalTitle: "Unhold Reason",
      isToggleUnholdModal: true,
      buttonUnholdModal: [
        {
          label: "Cancel",
          attribute: {
            className: "btn btn--transparent btn-wide",
            onClick: this.handleDismissUnholdModal
          }
        },

        {
          label: "Submit",
          attribute: {
            className: "btn btn-wide",
            onClick: this.submitUnhold
          }
        }
      ]
    });
  };

  handleDismissHoldModal = () => {
    this.setState({
      isToggleHoldModal: false,
      lastHeldRemark: "",
      holdIsRequiredFlag: false
    });
  };

  handleDismissUnholdModal = () => {
    this.setState({
      isToggleUnholdModal: false
    });
  };

  holdReasonOnchange = e => {
    if (e.target.value.length != 0) {
      this.setState({
        lastHeldRemark: e.target.value,
        holdIsRequiredFlag: false
      });
    } else {
      this.setState({
        lastHeldRemark: "",
        holdIsRequiredFlag: true
      });
    }
  };

  unholdReasonOnchange = e => {
    this.setState({
      lastUnheldRemark: e.target.value
    });
  };

  async submitHold() {
    if (this.state.lastHeldRemark !== "") {
      GA.event({
        category: "Invoice",
        action: "Hold invoice (Request)",
        label: `Invoice | ${this.state.invoiceNumber} | ${moment().format()}`
      });

      let holdObj = {
        linearId: this.state.linearId,
        lastHeldRemark: this.state.lastHeldRemark
      };
      try {
        this.toggleBlockSection1();
        this.toggleBlockSection2();
        this.setState({
          isToggleHoldModal: false
        });
        await this.apis.call("hold", {}, { method: "put", data: holdObj });

        GA.event({
          category: "Invoice",
          action: "Hold invoice (Success)",
          label: `Invoice | ${this.state.invoiceNumber} | ${moment().format()}`
        });

        location.reload();
      } catch (err) {
        GA.event({
          category: "Invoice",
          action: "Hold invoice (Failed)",
          label: `Invoice | ${this.state.invoiceNumber} | ${moment().format()}`
        });

        this.toggleBlockSection1();
        this.toggleBlockSection2();
        this.setState({
          lastHeldRemark: "",
          holdIsRequiredFlag: false,
          isToggleHoldModal: false
        });
        const response = handleError(err, this.handleDismissBtnModal);
        this.setState({
          ...response
        });
      }
    } else {
      this.setState({
        holdIsRequiredFlag: true
      });
    }
  }

  async submitUnhold() {
    let unholdObj = {
      linearId: this.state.linearId,
      lastUnheldRemark: this.state.lastUnheldRemark
    };

    GA.event({
      category: "Invoice",
      action: "Unhold invoice (Request)",
      label: `Invoice | ${this.state.invoiceNumber} | ${moment().format()}`
    });

    try {
      this.toggleBlockSection1();
      this.toggleBlockSection2();
      this.setState({
        isToggleUnholdModal: false
      });
      await this.apis.call("unhold", {}, { method: "put", data: unholdObj });

      GA.event({
        category: "Invoice",
        action: "Unhold invoice (Success)",
        label: `Invoice | ${this.state.invoiceNumber} | ${moment().format()}`
      });

      location.reload();
    } catch (err) {
      GA.event({
        category: "Invoice",
        action: "Unhold invoice (Failed)",
        label: `Invoice | ${this.state.invoiceNumber} | ${moment().format()}`
      });

      this.toggleBlockSection1();
      this.toggleBlockSection2();
      this.setState({
        lastUnheldRemark: "",
        isToggleUnholdModal: false
      });
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }
  }
  toggleRevisePaymentDueDateModal = () => {
    this.setState({
      isToggleRevisePaymentDueDateModal: true,
      revisePaymentDueDateModalTitle: "Revised Payment Due Date",
      buttonRevisePaymentDueDateModal: [
        {
          label: "Cancel",
          attribute: {
            className: "btn btn--transparent btn-wide",
            onClick: this.handleDismissRevisePaymentDueDateModal
          }
        },

        {
          label: "Revise",
          attribute: {
            className: "btn btn-wide",
            onClick: this.saveRevisePaymentDueDate
          }
        }
      ]
    });
  };
  saveRevisePaymentDueDate = async () => {
    if (
      this.state.selectedDate === "" ||
      this.state.revisedDueDateReason === ""
    ) {
      if (
        this.state.selectedDate === "" &&
        this.state.revisedDueDateReason === ""
      ) {
        this.setState({
          reviseDateIsRequiredFlag: true,
          reviseReasonIsRequiredFlag: true
        });
      } else if (this.state.selectedDate === "") {
        this.setState({
          reviseDateIsRequiredFlag: true
        });
      } else if (this.state.revisedDueDateReason === "") {
        this.setState({
          reviseReasonIsRequiredFlag: true
        });
      }
    } else {
      try {
        GA.event({
          category: "Invoice",
          action: "Revised invoice due date (Request)",
          label: `Invoice | ${this.state.invoiceNumber} | ${moment().format()}`
        });

        this.toggleBlockSection1();
        this.toggleBlockSection2();
        this.setState({
          isToggleRevisePaymentDueDateModal: false
        });
        let obj = {
          linearId: this.state.linearId,
          revisedDueDate: moment(this.state.selectedDate).format("DD/MM/YYYY"),
          revisedDueDateReason: this.state.revisedDueDateReason
        };

        await this.apis.call("reviseDueDate", obj, { method: "put" });

        GA.event({
          category: "Invoice",
          action: "Revised invoice due date (Success)",
          label: `Invoice | ${this.state.invoiceNumber} | ${moment().format()}`
        });

        await this.fetchData();

        this.setState({
          selectedDate: "",
          revisedDueDateReason: ""
        });
        this.toggleBlockSection1();
        this.toggleBlockSection2();
      } catch (err) {
        console.error(err);

        GA.event({
          category: "Invoice",
          action: "Revised invoice due date (Failed)",
          label: `Invoice | ${this.state.invoiceNumber} | ${moment().format()}`
        });

        this.toggleBlockSection1();
        this.toggleBlockSection2();
        this.setState({
          selectedDate: "",
          revisedDueDateReason: ""
        });
        const response = handleError(err, this.handleDismissBtnModal);
        this.setState({
          ...response
        });
        // if (
        //   error.response &&
        //   error.response.data &&
        //   error.response.data.message
        // ) {
        //   alertModalMsg = [error.response.data.message];
        // }

        // this.setState({
        //   selectedDate: "",
        //   revisedDueDateReason: "",
        //   isAlertModalVisible: true,
        //   isTextOnly: true,
        //   alertModalAlertTitle: "Error!",
        //   alertModalMsg,
        //   buttonAlert: [
        //     {
        //       label: "Close",
        //       attribute: {
        //         className: "btn btn--transparent btn-wide",
        //         onClick: this.handleDismissBtnModal
        //       }
        //     }
        //   ]
        // });
      }
    }
  };

  handleDismissRevisePaymentDueDateModal = () => {
    $("#revisePaymentDueDateLabel").removeClass("action-label-input");
    this.setState({
      isToggleRevisePaymentDueDateModal: false,
      selectedDate: "",
      revisedDueDateReason: "",
      reviseDateIsRequiredFlag: false,
      reviseReasonIsRequiredFlag: false
    });
  };

  revisedDueDateReasonOnChange = e => {
    if (e.target.value.length != 0) {
      this.setState({
        revisedDueDateReason: e.target.value,
        reviseReasonIsRequiredFlag: false
      });
    } else {
      this.setState({
        revisedDueDateReason: "",
        reviseReasonIsRequiredFlag: true
      });
    }
  };

  handleResiveDateChange = async date => {
    $("#revisePaymentDueDateLabel").addClass("action-label-input");
    await this.setState({ selectedDate: date });

    if (this.state.selectedDate === "") {
      this.setState({
        reviseDateIsRequiredFlag: true
      });
    } else {
      this.setState({
        reviseDateIsRequiredFlag: false
      });
    }
  };

  handleInvoiceFinancingRadioSubmit = async () => {
    let invoiceFinancing = "";
    if (this.state.invoiceDetailData.invoiceFinancing === "Y") {
      invoiceFinancing = "N";
    } else {
      invoiceFinancing = "Y";
    }

    this.saveInvoiceFinancing(invoiceFinancing);
  };

  saveInvoiceFinancing = async invoiceFinancing => {
    this.toggleBlockSection1();
    this.toggleBlockSection2();
    try {
      await this.setState({
        invoiceDetailData: {
          ...this.state.invoiceDetailData,
          invoiceFinancing: invoiceFinancing
        }
      });
      let data = {
        linearId: this.state.invoiceDetailData.linearId,
        invoiceFinancing: this.state.invoiceDetailData.invoiceFinancing
      };
      const res = await this.apis.call(
        "invoiceFinancing",
        {},
        { method: "put", data: data }
      );
      this.toggleBlockSection1();
      this.toggleBlockSection2();
    } catch (err) {
      console.error("Error Log! cannot save invoice financing");
      if (this.state.invoiceDetailData.invoiceFinancing === "Y") {
        await this.setState({
          invoiceDetailData: {
            ...this.state.invoiceDetailData,
            invoiceFinancing: "N"
          }
        });
      } else {
        await this.setState({
          invoiceDetailData: {
            ...this.state.invoiceDetailData,
            invoiceFinancing: "Y"
          }
        });
      }
      this.toggleBlockSection1();
      this.toggleBlockSection2();
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }
  };

  calTax(amount, percentage) {
    return parseFloat(
      (
        parseFloat(amount.toFixed(2)) *
        parseFloat((percentage / 100).toFixed(2))
      ).toFixed(2)
    );
  }

  formatCurrency(amount, digit) {
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      maximumFractionDigits: digit,
      minimumFractionDigits: digit
    }).format(amount);
  }

  onSave = async columnListItem => {
    try {
      let colSeq = columnListItem
        .filter(column => !column.hidden)
        .map(column => column.searchKey)
        .join(",");
      colSeq = colSeq + ",Sub Total,Currency";
      colSeq = colSeq.replace(/\%/g, "%25");
      const saveItemInformationModel = await this.apis.call(
        "saveItemInformationModel",
        { colSeq },
        { method: "POST" }
      );
      this.setState({
        columnListItem
      });
      await this.getModel();
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }
  };

  toggleBlockSection1 = () => {
    this.setState({
      blockSection1: !this.state.blockSection1
    });
  };
  toggleBlockSection2 = () => {
    this.setState({
      blockSection2: !this.state.blockSection2
    });
  };

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

  alert = (title, message, button = BTN_ACTION_BACK) => {
    this.setState({
      alertModalAlertTitle: title,
      isAlertModalVisible: true,
      buttonAlert: button,
      isTextOnly: true,
      alertModalMsg: message
    });
  };

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
    const {
      invoiceNumber,
      invoiceDetailData,
      isAllowCancel,
      isAllowEdit,
      isAllowHold,
      isAllowUnhold,
      isAllowResubmit,
      isAllowCreateCN,
      creditNoteReferCount,
      configuration,
      isAllowReviseDueDate,
      attachmentTaxInvoice,
      attachmentReceipt,
      attachmentDeliveryNote,
      attachmentOther,
      errCaseMsg,
      isAllowInvoiceFinancing,
      isAlertModalVisible,
      alertModalAlertTitle,
      alertModalMsg,
      isTextOnly,
      buttonAlert,
      holdModalTitle,
      isToggleHoldModal,
      buttonHoldModal,
      unholdModalTitle,
      isToggleUnholdModal,
      buttonUnholdModal,
      lastHeldRemark,
      lastUnheldRemark,
      holdIsRequiredFlag,
      isResubmitModalVisible,
      rejectReasonText,
      rejectFile,
      clarifyReasonText,
      clarifyFile,
      resultTitle,
      resultMsg,
      isResultVisible,
      buttonResultAlert,
      resultSucess,
      errorMessage,
      remarkMsg,
      remarkPanel,
      onHoldStatus,
      lastHeldRemarkDisplay,
      configFileResubmit,
      selectedDate,
      revisePaymentDueDateModalTitle,
      isToggleRevisePaymentDueDateModal,
      buttonRevisePaymentDueDateModal,
      revisedDueDateReason,
      reviseDateIsRequiredFlag,
      reviseReasonIsRequiredFlag,
      configHolidays,
      configBefore,
      configAfter,
      creditNoteSettled,
      disabledDate,
      resultLoading
    } = this.state;

    const {
      customisedFields,
      paymentItemLinearId
    } = this.state.invoiceDetailData;
    let { ref: urlRef, ref, purchaseOrderNumber } = this.props.url.query;
    if (typeof urlRef == "object") {
    } else if (typeof urlRef == "string") {
      urlRef = [urlRef];
    }
    let breadcrumbs = [];
    let breadcrumbsGroup = [];
    if (urlRef !== "undefined") {
      if (urlRef && urlRef.length > 0) {
        urlRef.map(b => {
          let r = b.split(",");
          switch (r[0]) {
            case "cn":
              if (!breadcrumbsGroup.includes(r[0])) {
                breadcrumbs.push({ title: "Credit Note", url: "/credit-note" });
                breadcrumbsGroup.push(r[0]);
              }
              breadcrumbs.push({
                title: `Credit Note Detail ${r[2] || ""}`,
                url: `/credit-note-detail?linearId=${r[1]}`
              });
              break;
            case "liv":
              if (!breadcrumbsGroup.includes(r[0])) {
                breadcrumbs.push({
                  title: t("LIV Posting Result"),
                  url: "/liv-posting-result?filter=invoice"
                });
                breadcrumbsGroup.push(r[0]);
              }
              break;
            case "iv":
              if (!breadcrumbsGroup.includes(r[0])) {
                breadcrumbs.push({ title: "Invoice", url: "/invoice" });
                breadcrumbsGroup.push(r[0]);
              }
              breadcrumbs.push({
                title: `PO Detail ${r[2] || ""}`,
                url: `/invoice-detail?linearId=${r[1]}`
              });
              break;
            case "podetail":
              if (!breadcrumbsGroup.includes(r[0])) {
                breadcrumbs.push({
                  title: "Purchase Order",
                  url: "/purchase-order"
                });
                breadcrumbsGroup.push(r[0]);
              }
              breadcrumbs.push({
                title: `PO No.  ${purchaseOrderNumber || ""}`,
                url: `/purchase-order-detail?linearId=${r[1]}`
              });
              break;
            case "po":
              if (!breadcrumbsGroup.includes(r[0])) {
                breadcrumbs.push({
                  title: "Purchase Order",
                  url: "/purchase-order"
                });
                breadcrumbsGroup.push(r[0]);
              }
              breadcrumbs.push({
                title: `PO No.  ${purchaseOrderNumber || ""}`,
                url: `/purchase-order-detail?linearId=${r[1]}`
              });
              breadcrumbs.push({
                title: `Invoice Lists of Purchase Order No. ${purchaseOrderNumber}`,
                url: `/invoice?ref=${ref}&purchaseOrderNumber=${purchaseOrderNumber}`
              });
              break;
            case "gr":
              if (!breadcrumbsGroup.includes(r[0])) {
                breadcrumbs.push({
                  title: "Goods Receipt",
                  url: "/good-receives"
                });
                breadcrumbsGroup.push(r[0]);
              }
              breadcrumbs.push({
                title: `Invoice No. of Goods Receipt No. ${r[2] || ""}`,
                url: `/good-receives-detail?linearId=${r[1]}`
              });
              break;
            case "dn":
              if (!breadcrumbsGroup.includes(r[0])) {
                breadcrumbs.push({ title: "Debit Note", url: "/debit-note" });
                breadcrumbsGroup.push(r[0]);
              }
              breadcrumbs.push({
                title: `Debit Note Detail ${r[2] || ""}`,
                url: `/debit-note-detail?linearId=${r[1]}`
              });
              break;
          }
        });
        breadcrumbs.push({
          title: `${t("Invoice No")} ${invoiceNumber}`,
          active: true
        });
      } else {
        breadcrumbs = [
          { title: t("Invoice"), url: "/invoice" },
          {
            title: [t("Invoice No"), ` ${invoiceNumber ? invoiceNumber : "-"}`],
            active: true
          }
        ];
      }
    }
    return (
      <div>
        <Layout {...this.props}>
          <Head>
            <title>{[t("Invoice No"), ` ${invoiceNumber}`]}</title>
          </Head>
          <PageHeader
            title={`${t("Invoice No")} ${invoiceNumber ? invoiceNumber : "-"}`}
            breadcrumbs={breadcrumbs}
            {...this.props}
          />

          <BlockUi tag="div" blocking={this.state.blockSection1}>
            <div
              id="mobilePageNav"
              className="col-12 px-0 bg-lightgray-3 p-3 d-flex d-lg-none"
            >
              <a href="/invoice">
                <strong className="purple">
                  <i className="fa fa-chevron-left" /> {t("Invoice")}
                </strong>
              </a>
            </div>
            <section id="invoice_detail_page" className="box box--width-header">
              <div className="box__header">
                <div className="row justify-content-between align-items-center mb-2">
                  <div className="col-4">
                    {""}
                    {t("Entry Date")} : {""}
                    {invoiceDetailData.invoiceCreatedDate
                      ? moment(invoiceDetailData.invoiceCreatedDate).format(
                          "DD/MM/YYYY"
                        )
                      : "-"}
                  </div>
                  <div className="text-right">
                    {" "}
                    {t("Invoice Status")} :{" "}
                    <strong
                      style={{
                        color: statusColor[invoiceDetailData.status],
                        marginRight: "15px"
                      }}
                    >
                      {onHoldStatus
                        ? `${invoiceDetailData.status} (On Hold)`
                        : invoiceDetailData.status}
                    </strong>
                    {isAllowCancel ? (
                      <button
                        name="btnCancel"
                        className="btn btn--transparent mr-2 d-none d-md-inline-block d-lg-inline-block d-xl-inline-block"
                        onClick={this.handleCancelInvoiceBtn}
                      >
                        {t("Cancel Invoice")}
                      </button>
                    ) : (
                      ""
                    )}
                    {isAllowEdit ? (
                      <button
                        name="btnEdit"
                        className="btn btn--transparent mr-2 d-none d-md-inline-block d-lg-inline-block d-xl-inline-block"
                        onClick={() => this.routeToEditMode()}
                      >
                        {t("Edit Invoice")}
                      </button>
                    ) : (
                      ""
                    )}
                    {isAllowHold ? (
                      <button
                        name="btnHold"
                        className="btn btn--transparent btn-wide mr-2 d-none d-md-inline-block d-lg-inline-block d-xl-inline-block"
                        onClick={() => this.handleHoldButton()}
                      >
                        Hold
                      </button>
                    ) : (
                      ""
                    )}
                    {isAllowUnhold ? (
                      <button
                        name="btnUnhold"
                        className="btn btn-wide mr-2 d-none d-md-inline-block d-lg-inline-block d-xl-inline-block"
                        onClick={() => this.handleUnholdButton()}
                      >
                        Unhold
                      </button>
                    ) : (
                      ""
                    )}
                    {isAllowResubmit ? (
                      <button
                        name="btnRequestToResubmit"
                        className="btn btn--transparent btn-wide mr-2 d-none d-md-inline-block d-lg-inline-block d-xl-inline-block"
                        onClick={this.toggleResubmitModal}
                      >
                        Request to resubmit
                      </button>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              </div>
              <div className="box__inner" hidden={!remarkPanel}>
                <div className="row box danger-panel mb-0 mb-lg-3">
                  <div className="col-12" hidden={remarkMsg === ""}>
                    <span className="text-bold">
                      {t("Request to resubmit")}:
                    </span>
                    <span>&nbsp;{remarkMsg}</span>
                  </div>
                  <div className="col-12" hidden={lastHeldRemarkDisplay === ""}>
                    <span className="text-bold">{t("Hold Reason")}:</span>
                    <span>&nbsp;{lastHeldRemarkDisplay}</span>
                  </div>
                </div>
              </div>
              <div className="box__inner">
                {/* Desktop Version - Start */}
                <Collapse
                  key="vendorInfo-d"
                  id="vendorInfo-d"
                  expanded="true"
                  collapseHeader={[t("Vendor"), t("Company")]}
                  className="d-none d-lg-flex flex-wrap"
                >
                  <div className="col-12 d-flex flex-wrap">
                    <div className="col-12 col-lg-6">
                      <CollapseItemText
                        t={t}
                        label={t("Code")}
                        colLabel="5"
                        value={invoiceDetailData.vendorNumber}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Name")}
                        colLabel="5"
                        value={invoiceDetailData.vendorName}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Tax ID")}
                        colLabel="5"
                        value={invoiceDetailData.vendorTaxNumber}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Branch")}
                        colLabel="5"
                        value={`${invoiceDetailData.vendorBranchCode || "-"}
                        ${
                          invoiceDetailData.vendorBranchName
                            ? `(${invoiceDetailData.vendorBranchName})`
                            : ""
                        }`}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Address")}
                        colLabel="5"
                        value={invoiceDetailData.vendorAddress}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Tel")}
                        colLabel="5"
                        value={invoiceDetailData.vendorTelephone}
                      />
                    </div>
                    <div className="col-12 col-lg-6">
                      <CollapseItemText
                        t={t}
                        label={t("Code")}
                        colLabel="5"
                        value={invoiceDetailData.companyCode}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Name")}
                        colLabel="5"
                        value={invoiceDetailData.companyName}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Tax ID")}
                        colLabel="5"
                        value={invoiceDetailData.companyTaxNumber}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Branch")}
                        colLabel="5"
                        value={`${invoiceDetailData.companyBranchCode || "-"}
                        ${
                          invoiceDetailData.companyBranchName
                            ? `(${invoiceDetailData.companyBranchName})`
                            : ""
                        }`}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Address")}
                        colLabel="5"
                        value={invoiceDetailData.companyAddress}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Tel")}
                        colLabel="5"
                        value={invoiceDetailData.companyTelephone}
                      />
                    </div>
                  </div>
                </Collapse>
                {/* Desktop Version - End */}

                {/* Mobile Version - Start */}
                <Collapse
                  key="vendorInfo-m"
                  id="vendorInfo-m"
                  expanded="true"
                  collapseHeader={[t("Vendor")]}
                  className="d-flex d-lg-none flex-wrap"
                >
                  <div className="row">
                    <div className="col-12">
                      <CollapseItemText
                        t={t}
                        label={t("Code")}
                        value={invoiceDetailData.vendorNumber}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Name")}
                        value={invoiceDetailData.vendorName}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Tax ID")}
                        value={invoiceDetailData.vendorTaxNumber}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Branch")}
                        value={`${invoiceDetailData.vendorBranchCode || "-"}
                        ${
                          invoiceDetailData.vendorBranchName
                            ? `(${invoiceDetailData.vendorBranchName})`
                            : ""
                        }`}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Address")}
                        value={invoiceDetailData.vendorAddress}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Tel")}
                        value={invoiceDetailData.vendorTelephone}
                      />
                    </div>
                  </div>
                </Collapse>

                <Collapse
                  key="companyInfo"
                  id="companyInfo"
                  expanded="true"
                  collapseHeader={[t("Company")]}
                  className="d-flex d-lg-none flex-wrap"
                >
                  <div className="row">
                    <div className="col-12">
                      <CollapseItemText
                        t={t}
                        label={t("Code")}
                        value={invoiceDetailData.companyCode}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Name")}
                        value={invoiceDetailData.companyName}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Tax ID")}
                        value={invoiceDetailData.companyTaxNumber}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Branch")}
                        value={`${invoiceDetailData.companyBranchCode || "-"}
                        ${
                          invoiceDetailData.companyBranchName
                            ? `(${invoiceDetailData.companyBranchName})`
                            : ""
                        }`}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Address")}
                        value={invoiceDetailData.companyAddress}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Tel")}
                        value={invoiceDetailData.companyTelephone}
                      />
                    </div>
                  </div>
                </Collapse>
                {/* Mobile Version - End */}

                <Collapse
                  id="paymentInfo"
                  key="paymentInfo"
                  expanded="true"
                  collapseHeader={[t("Payment Information")]}
                >
                  <div className="col-12 d-flex flex-wrap">
                    <div className="col-12 col-lg-6">
                      <CollapseItemText
                        t={t}
                        label={t("Invoice Date")}
                        colLabel="5"
                        value={moment(invoiceDetailData.invoiceDate).format(
                          "DD/MM/YYYY"
                        )}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Payment Term Description")}
                        colLabel="5"
                        value={invoiceDetailData.paymentTermDesc}
                      />
                      {this.props.permisions.includes(
                        "MONITOR-Payment-Detail"
                      ) &&
                        this.props.user.organisationUnit != "SELLER" && (
                          <CollapseItemExternalLink
                            label={t("Customer Reference Number")}
                            value={this.state.customerReferenceNumber || "-"}
                            colLabel="5"
                            href={
                              "payment-posting-detail?linearId=" +
                              paymentItemLinearId
                            }
                          />
                        )}
                      <CollapseItemText
                        t={t}
                        label={t("Payment Date")}
                        colLabel="5"
                        value={
                          invoiceDetailData.paymentDate &&
                          invoiceDetailData.paymentDate !== ""
                            ? moment(invoiceDetailData.paymentDate).format(
                                "DD/MM/YYYY"
                              )
                            : ""
                        }
                      />
                      {configuration.invoiceFinancingIsAllowed === true &&
                      isAllowInvoiceFinancing ? (
                        <div className="col-12 d-flex flex-wrap">
                          <p className="col-5 text-right">
                            {t("Invoice Financing")} :
                          </p>
                          <div className="col-7 d-inline-flex form-group">
                            <div className="custom-control custom-radio">
                              <input
                                data-toggle="modal"
                                data-target="#confirmInvoiceFinancing"
                                type="radio"
                                className="custom-control-input invoice_financing"
                                name="invoice_financing"
                                id="invoice_financing_y"
                                value="Y"
                                checked={
                                  invoiceDetailData.invoiceFinancing === "Y"
                                }
                                disabled={
                                  invoiceDetailData.invoiceFinancing === "Y"
                                    ? "disabled"
                                    : ""
                                }
                              />
                              <label
                                className="custom-control-label"
                                for="invoice_financing_y"
                              >
                                {" "}
                                Yes
                              </label>
                            </div>
                            <div className="custom-control custom-radio">
                              <input
                                data-toggle="modal"
                                data-target="#confirmInvoiceFinancing"
                                type="radio"
                                className="custom-control-input invoice_financing"
                                name="invoice_financing"
                                id="invoice_financing_n"
                                value="N"
                                checked={
                                  invoiceDetailData.invoiceFinancing === "N"
                                }
                                disabled={
                                  invoiceDetailData.invoiceFinancing === "N"
                                    ? "disabled"
                                    : ""
                                }
                              />
                              <label
                                className="custom-control-label"
                                for="invoice_financing_n"
                              >
                                {" "}
                                No
                              </label>
                            </div>
                          </div>
                        </div>
                      ) : this.state.invoiceDetailData.invoiceFinancing ==
                        "Y" ? (
                        <CollapseItemText
                          t={t}
                          label={t("Invoice Financing")}
                          colLabel="5"
                          value="Yes"
                        />
                      ) : (
                        <CollapseItemText
                          t={t}
                          label={t("Invoice Financing")}
                          colLabel="5"
                          value="No"
                        />
                      )}

                      <CollapseItemText
                        t={t}
                        label={t("e-TAX")}
                        colLabel="5"
                        value={
                          invoiceDetailData.isETaxInvoice
                            ? invoiceDetailData.isETaxInvoice === true
                              ? "Yes"
                              : "No"
                            : "No"
                        }
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Send to CMS")}
                        colLabel="5"
                        value={
                          customisedFields && customisedFields.CMS
                            ? "Yes"
                            : "No"
                        }
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Send to Bank")}
                        colLabel="5"
                        value={paymentItemLinearId ? "Yes" : "No"}
                      />
                    </div>
                    <div className="col-12 col-lg-6">
                      <CollapseItemText
                        t={t}
                        label={t("Sub Total")}
                        colLabel="5"
                        value={`${this.formatCurrency(
                          invoiceDetailData.subTotal,
                          2
                        )} ${invoiceDetailData.currency}`}
                        viewtype="currency"
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Tax Total")}
                        colLabel="5"
                        value={`${this.formatCurrency(
                          invoiceDetailData.vatTotal,
                          2
                        )} ${invoiceDetailData.currency}`}
                        viewtype="currency"
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Invoice Amount")}
                        colLabel="5"
                        value={`${this.formatCurrency(
                          invoiceDetailData.invoiceTotal,
                          2
                        )} ${invoiceDetailData.currency}`}
                        viewtype="currency"
                      />
                      <CollapseItemText
                        t={t}
                        label={t("WHT Pre-calculated amount")}
                        colLabel="5"
                        value={`${this.formatCurrency(
                          invoiceDetailData.withholdingTaxTotal,
                          2
                        )} ${invoiceDetailData.currency}`}
                        viewtype="currency"
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Retention Amount")}
                        colLabel="5"
                        value={`${this.formatCurrency(
                          invoiceDetailData.retentionAmount,
                          2
                        )} ${invoiceDetailData.currency}`}
                        viewtype="currency"
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Estimated Invoice Payable Amount")}
                        colLabel="5"
                        value={`${this.formatCurrency(
                          invoiceDetailData.estimatedPayable,
                          2
                        )} ${invoiceDetailData.currency}`}
                        viewtype="currency"
                      />

                      <br />
                      <CollapseItemText
                        t={t}
                        label={t("Due Date")}
                        colLabel="5"
                        value={moment(invoiceDetailData.initialDueDate).format(
                          "DD/MM/YYYY"
                        )}
                      />
                      <div className="row">
                        <p className="col-5 text-right px-0">
                          {t("Revised Payment Due Date")} :
                        </p>
                        <p className="col-7">
                          {isAllowReviseDueDate ? (
                            invoiceDetailData.initialDueDate ==
                            invoiceDetailData.dueDate ? (
                              <span>
                                - &nbsp;
                                <a
                                  href="javascript:;"
                                  onClick={this.toggleRevisePaymentDueDateModal}
                                >
                                  <svg
                                    width="19px"
                                    height="20px"
                                    viewBox="0 0 19 20"
                                    version="1.1"
                                    xmlns="http://www.w3.org/2000/svg"
                                    xmlnsXlink="http://www.w3.org/1999/xlink"
                                  >
                                    <g
                                      id="Invoice"
                                      stroke="none"
                                      strokeWidth={1}
                                      fill="none"
                                      fillRule="evenodd"
                                    >
                                      <g
                                        id="02_Invoice_Detail_Default"
                                        transform="translate(-1064.000000, -584.000000)"
                                        fill="#AF3694"
                                      >
                                        <g
                                          id="02_payment_information"
                                          transform="translate(166.000000, 480.000000)"
                                        >
                                          <g
                                            id="tb_revised_payment_due_date"
                                            transform="translate(801.000000, 102.000000)"
                                          >
                                            <path
                                              d="M106,19.9404 L112.07,13.8794 L114.12,15.8794 L108.06,22.0004 L106,22.0004 L106,19.9404 Z M115.7,14.3494 L114.7,15.3494 L112.65,13.3504 L113.65,12.3504 C113.85,12.1404 114.19,12.1294 114.42,12.3504 L115.7,13.6294 C115.89,13.8304 115.89,14.1504 115.7,14.3494 Z M113,4.0004 L112,4.0004 L112,2.0004 L110,2.0004 L110,4.0004 L102,4.0004 L102,2.0004 L100,2.0004 L100,4.0004 L99,4.0004 C97.896,4.0004 97,4.8954 97,6.0004 L97,20.0004 C97,21.1044 97.896,22.0004 99,22.0004 L104,22.0004 L104,20.0004 L99,20.0004 L99,9.0004 L113,9.0004 L113,10.0004 L115,10.0004 L115,6.0004 C115,4.8954 114.104,4.0004 113,4.0004 Z"
                                              id="Fill-1"
                                            />
                                          </g>
                                        </g>
                                      </g>
                                    </g>
                                  </svg>
                                </a>
                              </span>
                            ) : (
                              <a
                                href="javascript:;"
                                onClick={this.toggleRevisePaymentDueDateModal}
                              >
                                {moment(
                                  this.state.invoiceDetailData.dueDate
                                ).format("DD/MM/YYYY")}{" "}
                                &nbsp;
                                <svg
                                  width="19px"
                                  height="20px"
                                  viewBox="0 0 19 20"
                                  version="1.1"
                                  xmlns="http://www.w3.org/2000/svg"
                                  xmlnsXlink="http://www.w3.org/1999/xlink"
                                >
                                  <g
                                    id="Invoice"
                                    stroke="none"
                                    strokeWidth={1}
                                    fill="none"
                                    fillRule="evenodd"
                                  >
                                    <g
                                      id="02_Invoice_Detail_Default"
                                      transform="translate(-1064.000000, -584.000000)"
                                      fill="#AF3694"
                                    >
                                      <g
                                        id="02_payment_information"
                                        transform="translate(166.000000, 480.000000)"
                                      >
                                        <g
                                          id="tb_revised_payment_due_date"
                                          transform="translate(801.000000, 102.000000)"
                                        >
                                          <path
                                            d="M106,19.9404 L112.07,13.8794 L114.12,15.8794 L108.06,22.0004 L106,22.0004 L106,19.9404 Z M115.7,14.3494 L114.7,15.3494 L112.65,13.3504 L113.65,12.3504 C113.85,12.1404 114.19,12.1294 114.42,12.3504 L115.7,13.6294 C115.89,13.8304 115.89,14.1504 115.7,14.3494 Z M113,4.0004 L112,4.0004 L112,2.0004 L110,2.0004 L110,4.0004 L102,4.0004 L102,2.0004 L100,2.0004 L100,4.0004 L99,4.0004 C97.896,4.0004 97,4.8954 97,6.0004 L97,20.0004 C97,21.1044 97.896,22.0004 99,22.0004 L104,22.0004 L104,20.0004 L99,20.0004 L99,9.0004 L113,9.0004 L113,10.0004 L115,10.0004 L115,6.0004 C115,4.8954 114.104,4.0004 113,4.0004 Z"
                                            id="Fill-1"
                                          />
                                        </g>
                                      </g>
                                    </g>
                                  </g>
                                </svg>
                              </a>
                            )
                          ) : invoiceDetailData.initialDueDate ==
                            invoiceDetailData.dueDate ? (
                            <span>-</span>
                          ) : (
                            moment(this.state.invoiceDetailData.dueDate).format(
                              "DD/MM/YYYY"
                            )
                          )}
                        </p>
                      </div>
                      <CollapseItemText
                        t={t}
                        label={t("Last Edited By")}
                        colLabel="5"
                        value={invoiceDetailData.dueDateLastEditedBy}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Last Edited Date")}
                        colLabel="5"
                        value={moment(
                          invoiceDetailData.lastMatchUpdatedDate
                        ).format("DD/MM/YYYY")}
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Last Edited Reason")}
                        colLabel="5"
                        value={invoiceDetailData.dueDateLastEditedReason}
                      />
                    </div>
                  </div>
                </Collapse>
                <Collapse
                  id="creditNoteLists"
                  key="creditNoteLists"
                  expanded="false"
                  collapseHeader={[
                    [
                      t("Credit Note Refer to this Invoice"),

                      ` ( ${creditNoteReferCount} ${
                        creditNoteReferCount > 1 ? t("Items") : t("Item")
                      } )`
                    ]
                  ]}
                >
                  {/* Desktop Version - Start */}
                  <div className="table_warpper d-none d-lg-inline-block">
                    <table className="table table-1 dataTable">
                      <thead>
                        <tr>
                          <th>{t("No")}</th>
                          <th>
                            {t("CN No1")}
                            <br /> {t("CN No2")}
                          </th>
                          <th>
                            {t("Type of CN1")}
                            <br /> {t("Type of CN2")}
                          </th>
                          <th>
                            {t("CN Reason1")}
                            <br /> {t("CN Reason2")}
                          </th>
                          <th>
                            {t("CN Date1")}
                            <br /> {t("CN Date2")}
                          </th>
                          <th>
                            {t("CN Amount (inc VAT)1")}
                            <br /> {t("CN Amount (inc VAT)2")}
                          </th>
                          <th>
                            {t("CN Status1")}
                            <br /> {t("CN Status2")}
                          </th>
                          <th>{t("Currency")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {creditNoteReferCount > 0 ? (
                          this.state.creditNoteRefer.map((item, index) => {
                            return (
                              <tr key={index}>
                                <td>{index + 1}</td>
                                <td>
                                  {item.externalId && item.linearId ? (
                                    <a
                                      href={`/credit-note-detail?linearId=${item.linearId}&ref=inv,${item.invoiceLinearId}&invoiceNumber=${item.invoiceExternalId}`}
                                      data-href={`/credit-note-detail?linearId=${item.linearId}&ref=inv,${item.invoiceLinearId}&invoiceNumber=${item.invoiceExternalId}`}
                                      className="link list-link"
                                    >
                                      {item.externalId}
                                    </a>
                                  ) : (
                                    item.externalId
                                  )}
                                </td>
                                <td>
                                  {item.adjustmentType
                                    ? item.adjustmentType === "Goods Return"
                                      ? "Quantity Adjustment"
                                      : item.adjustmentType
                                    : "-"}
                                </td>
                                <td>{item.reason ? item.reason : "-"}</td>
                                <td>
                                  {item.creditNoteDate
                                    ? moment(item.creditNoteDate)
                                        .format("DD/MM/YYYY")
                                        .toString()
                                    : "-"}
                                </td>
                                <td>
                                  {item.total
                                    ? parseFloat(item.total).toFixed(2)
                                    : "-"}
                                </td>
                                <td>{item.status ? item.status : "-"}</td>
                                <td>{item.currency ? item.currency : "-"}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="9" className="text-center">
                              {t("No Item Found")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot hidden={!isAllowCreateCN}>
                        <tr>
                          <td colSpan="9" className="border-bottom">
                            <p className="mb-0 text-center">
                              <a
                                href="/create-credit-note"
                                id="btnAddCN"
                                className="purple d-flex self-align-center justify-content-center"
                              >
                                <i className="fa fa-plus-circle" />{" "}
                                {t("Create CN")}{" "}
                              </a>
                            </p>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  {/* Desktop Version - End */}

                  {/* Mobile Version - Start */}
                  <div className="d-inline-block d-lg-none">
                    <table className="table dataTable mobile_dataTable">
                      <thead>
                        <tr>
                          <th className="text-center">{t("CN No")}</th>
                          <th className="text-center">{t("Type of CN")}</th>
                          <th className="text-center">{t("CN Status")}</th>
                          <th className="text-center control">{t("More")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {creditNoteReferCount > 0 ? (
                          this.state.creditNoteRefer.map((item, index) => {
                            return (
                              <React.Fragment key={index}>
                                <tr>
                                  <td>
                                    {item.externalId && item.linearId ? (
                                      <a
                                        href={`/credit-note-detail?linearId=${item.linearId}&ref=inv,${item.invoiceLinearId}&invoiceNumber=${item.invoiceExternalId}`}
                                        data-href={`/credit-note-detail?linearId=${item.linearId}&ref=inv,${item.invoiceLinearId}&invoiceNumber=${item.invoiceExternalId}`}
                                        className="link list-link"
                                      >
                                        {item.externalId}
                                      </a>
                                    ) : (
                                      item.externalId
                                    )}
                                  </td>
                                  <td>
                                    {item.adjustmentType
                                      ? item.adjustmentType === "Goods Return"
                                        ? "Quantity Adjustment"
                                        : item.adjustmentType
                                      : "-"}
                                  </td>
                                  <td>{item.status ? item.status : "-"}</td>
                                  <td className="control">
                                    <a
                                      href={`#cn-detail-${index}`}
                                      data-toggle="collapse"
                                      role="button"
                                      aria-expanded="false"
                                      area-controls={`#cn-detail-${index}`}
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
                                  id={`cn-detail-${index}`}
                                  className="collapse multi-collapse"
                                >
                                  <td colSpan="4">
                                    <div className="d-flex flex-wrap w-100">
                                      <div className="col-6 px-0 text-right">
                                        CN Reason:{" "}
                                      </div>
                                      <div className="col-6 text-left">
                                        {item.reason ? item.reason : "-"}
                                      </div>
                                      <div className="col-6 px-0 pt-3 text-right">
                                        CN Date:{" "}
                                      </div>
                                      <div className="col-6 pt-3 text-left">
                                        {item.creditNoteDate
                                          ? moment(item.creditNoteDate)
                                              .format("DD/MM/YYYY")
                                              .toString()
                                          : "-"}
                                      </div>
                                      <div className="col-6 px-0 pt-3 text-right">
                                        CN Amount (Inc. VAT):{" "}
                                      </div>
                                      <div className="col-6 pt-3 text-left">
                                        {item.total
                                          ? parseFloat(item.total).toFixed(2)
                                          : "-"}
                                      </div>
                                      <div className="col-6 px-0 py-3 text-right">
                                        Currency:{" "}
                                      </div>
                                      <div className="col-6 py-3 text-left">
                                        {item.currency ? item.currency : "-"}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </React.Fragment>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center">
                              {t("No Item Found")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile Version - End */}
                </Collapse>
                <Collapse
                  id="creditnoteSettled"
                  key="creditnoteSettled"
                  expanded="false"
                  collapseHeader={[
                    [
                      t("Credit Note Settled to this Invoice"),
                      ` ( ${this.state.creditNoteSettledItemLength} ${
                        this.state.creditNoteSettledItemLength > 1
                          ? t("Items")
                          : t("Item")
                      } )`
                    ]
                  ]}
                >
                  {/* Desktop Version - Start */}
                  <div className="table_warpper d-none d-lg-inline-block">
                    <table className="table table-1 dataTable">
                      <thead>
                        <tr>
                          <th>{t("No")}</th>
                          <th>
                            {t("CN No1")}
                            <br /> {t("CN No2")}
                          </th>
                          <th>
                            {t("Type of CN1")}
                            <br /> {t("Type of CN2")}
                          </th>
                          <th>
                            {t("CN Reason1")}
                            <br /> {t("CN Reason2")}
                          </th>
                          <th>
                            {t("CN Date1")}
                            <br /> {t("CN Date2")}
                          </th>
                          <th>
                            {t("CN Amount (inc VAT)1")}
                            <br /> {t("CN Amount (inc VAT)2")}
                          </th>
                          <th>{t("Settle Value")}</th>
                          <th>
                            {t("CN Status1")}
                            <br /> {t("CN Status2")}
                          </th>
                          <th>{t("Currency")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.generateRowTableForCreditNoteSettled(
                          creditNoteSettled
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Desktop Version - End */}

                  {/* Mobile Version - Start */}
                  <div className="d-inline-block d-lg-none">
                    <table className="table dataTable mobile_dataTable">
                      <thead>
                        <tr>
                          <th className="text-center">{t("CN No")}</th>
                          <th className="text-center">{t("Type of CN")}</th>
                          <th className="text-center">{t("CN Status")}</th>
                          <th className="text-center control">{t("More")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.generateRowTableForCreditNoteSettledMobile(
                          creditNoteSettled
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile Version - End */}
                </Collapse>
                <Collapse
                  id="attachmentLists"
                  key="attachmentLists"
                  expanded="false"
                  collapseHeader={[t("Attachments")]}
                >
                  <div className="row">
                    <div className="col-12 col-lg-6">
                      <CollapseItemExternalLink
                        key="attachmentTaxInvoice"
                        label={t("Attach Tax Invoice")}
                        colLabel="5"
                        value={
                          attachmentTaxInvoice.length > 0
                            ? attachmentTaxInvoice
                            : "-"
                        }
                      />
                      <CollapseItemText
                        t={t}
                        label={t("Receipt No")}
                        colLabel="5"
                        value={invoiceDetailData.receiptNumber}
                      />
                    </div>
                    <div className="col-12 col-lg-6">
                      <CollapseItemExternalLink
                        label={t("Attach Delivery Note")}
                        colLabel="5"
                        key="attachmentDeliveryNote"
                        value={
                          attachmentDeliveryNote.length > 0
                            ? attachmentDeliveryNote
                            : "-"
                        }
                      />
                      <CollapseItemExternalLink
                        label={t("Attach Receipt")}
                        colLabel="5"
                        key="attachmentReceipt"
                        value={
                          attachmentReceipt.length > 0 ? attachmentReceipt : "-"
                        }
                      />
                      <CollapseItemExternalLink
                        label={t("Attach Other Documents")}
                        colLabel="5"
                        key="attachmentOther"
                        value={
                          attachmentOther.length > 0 ? attachmentOther : "-"
                        }
                      />
                    </div>
                  </div>
                </Collapse>
              </div>
            </section>
          </BlockUi>
          <BlockUi tag="div" blocking={this.state.blockSection2}>
            <section
              id="invoice_detail_page_2"
              className="box box--width-header"
            >
              <div className="box__header">
                <div className="row justify-content-between align-items-center">
                  <div className="col">
                    <h3 className="mb-0">{t("Items Information")}</h3>
                  </div>
                  <button
                    className="btn btn--transparent mr-3 d-none d-lg-inline-block"
                    data-toggle="modal"
                    data-target="#itemInvoice"
                  >
                    {t("Column Display")}
                  </button>
                </div>
              </div>
              {this.state.taxRateList &&
                this.state.taxRateList.map((vatRate, index) => {
                  return (
                    <div className="box__inner" key={index}>
                      <Collapse
                        id={`tax${vatRate}`}
                        expanded="true"
                        collapseHeader={[`${t("TAX")} ${vatRate}%`]}
                      >
                        {/* Desktop Version - Start */}
                        <div className="d-none d-lg-inline-block">
                          <div className="table-group-item-invoice">
                            <div className="table-invoice-left border-left-table-invoice">
                              <div className="table-responsive overflow-y-hidden">
                                <table className="table table-3 dataTable">
                                  <thead>
                                    <tr>
                                      {this.filterSubTotalCurrency(
                                        this.state.columnListItem
                                      )

                                        .filter(column => !column.hidden)
                                        .map((column, index) => {
                                          return (
                                            <th
                                              className="th-invoice"
                                              key={index}
                                            >
                                              {t(column.header)}
                                            </th>
                                          );
                                        })}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {this.generateRowTableForTax(
                                      this.state.taxRateListItem[
                                        `tax${vatRate}`
                                      ]
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                            <div className="table-invoice-right border-left-table-invoice">
                              <div className="table-responsive">
                                <table className="table table-3 dataTable">
                                  <thead>
                                    <tr>
                                      <th className="th-invoice-right">
                                        {t("Sub Total")}
                                      </th>
                                      <th className="th-invoice-right">
                                        {t("Currency")}
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {this.renderCloneTable(
                                      this.state.taxRateListItem[
                                        `tax${vatRate}`
                                      ]
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                          <div className="table-group-item-invoice">
                            <div className="table-invoice-left">
                              <div className="table-responsive">
                                <table className="table table-invoice-summary">
                                  <tbody>
                                    <tr className="non-br-table-invoice-summary">
                                      <td className="text-right">
                                        {t("Sub Total")} {t("Exclude VAT")}
                                      </td>
                                    </tr>
                                    <tr className="non-br-table-invoice-summary">
                                      <td className="text-right">
                                        {t("Tax Total")} ({vatRate}%)
                                      </td>
                                    </tr>
                                    <tr className="non-br-table-invoice-summary">
                                      <td className="text-right">
                                        {t("Invoice Amount")}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                            <div className="table-invoice-right">
                              <div className="table-responsive">
                                <table className="table table-invoice-summary">
                                  <tbody>
                                    <tr className="non-br-table-invoice-summary">
                                      <td className="text-right invoice-summary-right-currency">
                                        <span className="font-bold">
                                          {this.formatCurrency(
                                            this.getCalItemsSubTotal(
                                              this.state.taxRateListItem[
                                                `tax${vatRate}`
                                              ],
                                              2
                                            ),
                                            2
                                          )}
                                        </span>
                                      </td>
                                      <td className="invoice-summary-right-currency">
                                        {invoiceDetailData.currency}
                                      </td>
                                    </tr>
                                    <tr className="non-br-table-invoice-summary">
                                      <td className="text-right invoice-summary-right-currency">
                                        <span className="font-bold">
                                          {this.formatCurrency(
                                            this.calTax(
                                              this.getCalItemsSubTotal(
                                                this.state.taxRateListItem[
                                                  `tax${vatRate}`
                                                ],
                                                2
                                              ),
                                              vatRate
                                            ),
                                            2
                                          )}
                                        </span>
                                      </td>
                                      <td className="invoice-summary-right-currency">
                                        {invoiceDetailData.currency}
                                      </td>
                                    </tr>
                                    <tr className="non-br-table-invoice-summary">
                                      <td className="text-right invoice-summary-right-currency">
                                        <span className="font-bold">
                                          {this.formatCurrency(
                                            this.getCalItemsSubTotal(
                                              this.state.taxRateListItem[
                                                `tax${vatRate}`
                                              ]
                                            ) +
                                              +this.calTax(
                                                this.getCalItemsSubTotal(
                                                  this.state.taxRateListItem[
                                                    `tax${vatRate}`
                                                  ]
                                                ),
                                                vatRate
                                              ),
                                            2,
                                            2
                                          )}
                                        </span>
                                      </td>
                                      <td className="invoice-summary-right-currency">
                                        {invoiceDetailData.currency}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Desktop Version - End */}

                        {/* Mobile Version - Start */}
                        <div className="d-inline-block d-lg-none">
                          <table className="table dataTable mobile_dataTable">
                            <thead>
                              <tr>
                                <th className="text-center th-invoice-mobile">
                                  {t(
                                    this.filterSubTotalCurrency(
                                      this.state.moblieColumnListItem
                                    ).filter(column => !column.hidden)[0].header
                                  )}
                                </th>
                                <th className="text-center th-invoice-mobile">
                                  {t(
                                    this.filterSubTotalCurrency(
                                      this.state.moblieColumnListItem
                                    ).filter(column => !column.hidden)[1].header
                                  )}
                                </th>
                                <th className="text-center th-invoice-mobile">
                                  {t("More")}
                                </th>

                                {/* <th className="text-center">PO No.</th>
                                <th className="text-center">
                                  PO Item
                                  <br />
                                  No.
                                </th>
                                <th className="text-center">More</th> */}
                              </tr>
                            </thead>
                            <tbody>
                              {/* Loop here - Start */}

                              {this.generateMobileMoreInfomationForTax(
                                this.state.taxRateListItem[`tax${vatRate}`]
                              )}

                              {/* Loop here - End */}
                            </tbody>
                          </table>

                          {/* Summary Section - Start */}
                          <div className="d-flex flex-wrap w-100 border-top">
                            <div className="col-12 px-0 pt-3 d-flex flex-wrap">
                              <div className="col-6 text-right px-0">
                                {t("Sub Total")}
                                {t("Exclude VAT")}
                              </div>
                              <div className="col-4 text-right pl-0 pr-1">
                                <span className="bold">
                                  {this.formatCurrency(
                                    this.getCalItemsSubTotal(
                                      this.state.taxRateListItem[
                                        `tax${vatRate}`
                                      ],
                                      2
                                    ),
                                    2
                                  )}
                                </span>
                              </div>
                              <div className="col-2 text-right pl-1">
                                {invoiceDetailData.currency}
                              </div>
                            </div>
                            <div className="col-12 px-0 pt-3 d-flex flex-wrap">
                              <div className="col-6 text-right px-0">
                                {t("TAX Total")} ({vatRate}%)
                              </div>
                              <div className="col-4 text-right pl-0 pr-1">
                                <span className="bold">
                                  {this.formatCurrency(
                                    this.calTax(
                                      this.getCalItemsSubTotal(
                                        this.state.taxRateListItem[
                                          `tax${vatRate}`
                                        ],
                                        2
                                      ),
                                      vatRate
                                    ),
                                    2
                                  )}
                                </span>
                              </div>
                              <div className="col-2 text-right pl-1">
                                {invoiceDetailData.currency}
                              </div>
                            </div>
                            <div className="col-12 px-0 py-3 d-flex flex-wrap">
                              <div className="col-6 text-right px-0">
                                {t("Invoice Amount")}
                              </div>
                              <div className="col-4 text-right pl-0 pr-1">
                                <span className="bold">
                                  {this.formatCurrency(
                                    this.getCalItemsSubTotal(
                                      this.state.taxRateListItem[
                                        `tax${vatRate}`
                                      ]
                                    ) +
                                      +this.calTax(
                                        this.getCalItemsSubTotal(
                                          this.state.taxRateListItem[
                                            `tax${vatRate}`
                                          ]
                                        ),
                                        vatRate
                                      ),
                                    2,
                                    2
                                  )}
                                </span>
                              </div>
                              <div className="col-2 text-right pl-1">
                                {invoiceDetailData.currency}
                              </div>
                            </div>
                          </div>
                          {/* Summary Section - End */}
                        </div>
                        {/* Mobile Version - End */}
                      </Collapse>
                    </div>
                  );
                })}

              <div
                id="reviseDueDate"
                className="modal hide fade"
                tabindex="-1"
                role="dialog"
                aria-labelledby="addPO"
                aria-hidden="true"
              >
                <div className="modal-dialog modal-lg" role="document">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h3 id="myModalLabel">Revised Payment Due Date</h3>
                    </div>
                    <div className="modal-body d-flex">
                      <div className="col-12">
                        <div className="form-label-group">
                          <input
                            type="text"
                            id="revised_due_date"
                            className="form-control datepicker2"
                            placeholder="Revised Payment Due Date"
                          />
                          <label htmlFor="revised_due_date">
                            Revised Payment Due Date
                          </label>
                        </div>
                      </div>

                      <div className="form-label-group">
                        <textarea
                          className="form-control"
                          id="revisedDueDateReason"
                          placeholder="Reason"
                        />
                        <label htmlFor="revisedDueDateReason">Reason</label>
                      </div>
                    </div>
                    <div className="modal-footer justify-content-center">
                      <button
                        type="button"
                        name="btnCloseModal"
                        id="btnCloseModal"
                        className="btn btn--transparent btn-wide"
                        data-dismiss="modal"
                        aria-hidden="true"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        name="btnReviseDueDate"
                        id="btnReviseDueDate"
                        className="btn btn--transparent btn-purple btn-wide"
                        data-dismiss="modal"
                        onClick={() => this.handleReviseInvoiceDueDate()}
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div
                id="confirmInvoiceFinancing"
                className="modal hide fade"
                tabindex="-1"
                role="dialog"
                aria-labelledby="addPO"
                aria-hidden="true"
              >
                <div className="modal-dialog" role="document">
                  <div className="modal-content">
                    <div
                      className="modal-header text-center"
                      style={{
                        display: "block"
                      }}
                    >
                      <h3 id="myModalLabel">Invoice Financing</h3>
                    </div>
                    <div className="modal-body text-center">
                      <div className="text">
                        <span>
                          {invoiceDetailData.invoiceFinancing !== "Y"
                            ? "Do you prefer invoice financing?"
                            : "Do you want to cancel invoice financing?"}
                        </span>
                      </div>
                    </div>
                    <div className="modal-footer justify-content-center">
                      <button
                        type="button"
                        name="btnCloseModal"
                        id="btnCloseModal"
                        className={`btn ${
                          invoiceDetailData.invoiceFinancing === "Y"
                            ? "btn--transparent"
                            : ""
                        } btn-wide`}
                        data-dismiss="modal"
                        aria-hidden="true"
                      >
                        No
                      </button>
                      <button
                        type="button"
                        name="btnConfirmIF"
                        id="btnConfirmIF"
                        className={`btn ${
                          invoiceDetailData.invoiceFinancing === "Y"
                            ? ""
                            : "btn--transparent"
                        } btn-wide`}
                        data-dismiss="modal"
                        onClick={this.handleInvoiceFinancingRadioSubmit}
                      >
                        Yes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </BlockUi>

          <ColumnModalInvoice
            title="Column List"
            modalId="itemInvoice"
            columnList={this.filterSubTotalCurrency(this.state.columnListItem)}
            cancelAction={this.cancelAction}
            onSave={this.onSave}
          />
          <ModalAlert
            title={alertModalAlertTitle}
            visible={isAlertModalVisible}
            button={buttonAlert}
            isTextOnly={isTextOnly}
          >
            {alertModalMsg}
          </ModalAlert>
          <ModalAlert
            title={revisePaymentDueDateModalTitle}
            visible={isToggleRevisePaymentDueDateModal}
            button={buttonRevisePaymentDueDateModal}
          >
            <div className="col-12">
              <div className="form-group custom-width-100">
                <DayPickerInput
                  formatDate={formatDate}
                  parseDate={parseDate}
                  format={FORMAT}
                  placeholder="Revise Payment Due Date"
                  id="revisePaymentDueDate"
                  onDayChange={this.handleResiveDateChange}
                  inputProps={{
                    className: `form-control ${
                      !reviseDateIsRequiredFlag ? "" : "required"
                    }`
                  }}
                  value={selectedDate}
                  dayPickerProps={{
                    disabledDays: disabledDate
                  }}
                />

                <span
                  className="text-danger"
                  hidden={!reviseDateIsRequiredFlag}
                >
                  This field is required
                </span>
              </div>
            </div>
            <div className="col-12">
              <div className="form-group">
                <div className="form-label-group">
                  <textarea
                    name="revisedDueDateReason"
                    id="revisedDueDateReason"
                    cols="30"
                    rows="5"
                    className={`form-control ${
                      !reviseReasonIsRequiredFlag ? "" : "required"
                    }`}
                    placeholder="Reason"
                    onChange={this.revisedDueDateReasonOnChange}
                    value={revisedDueDateReason}
                  />
                  <span
                    className="text-danger"
                    hidden={!reviseReasonIsRequiredFlag}
                  >
                    This field is required
                  </span>
                </div>
              </div>
            </div>
          </ModalAlert>
          <ModalAlert
            title={holdModalTitle}
            visible={isToggleHoldModal}
            button={buttonHoldModal}
          >
            <textarea
              name="holdReason"
              id="holdReason"
              cols="30"
              rows="5"
              className={`form-control ${
                !holdIsRequiredFlag ? "" : "required"
              }`}
              Reason
              placeholder="Reason"
              onChange={this.holdReasonOnchange}
              value={lastHeldRemark}
            />
            <span className="text-danger" hidden={!holdIsRequiredFlag}>
              This field is required
            </span>
          </ModalAlert>
          <ModalAlert
            title={unholdModalTitle}
            visible={isToggleUnholdModal}
            button={buttonUnholdModal}
          >
            <textarea
              name="unholdReason"
              id="unholdReason"
              cols="30"
              rows="5"
              className="form-control"
              Reason
              placeholder="Reason"
              onChange={this.unholdReasonOnchange}
              value={lastUnheldRemark}
            />
          </ModalAlert>
          <ModalDropFile
            title={"Request to resubmit"}
            isVisible={isResubmitModalVisible}
            onFileChange={this.onResubmitFileChange}
            onReasonChange={this.onResubmitReasonChange}
            isReasonRequire={true}
            onCancelButton={this.toggleResubmitModal}
            onSubmitButton={this.onResubmit}
            configFile={configFileResubmit}
          />
          <ModalAlert
            title={resultTitle}
            visible={isResultVisible}
            isTextOnly={true}
            button={resultLoading ? [] : buttonResultAlert}
          >
            <div className="text-center">
              {resultLoading ? (
                <div>
                  {" "}
                  Processing <i className="fa fa-spinner fa-spin" />
                </div>
              ) : (
                <React.Fragment>
                  <i
                    className={`fa ${
                      resultSucess
                        ? "fa-check-circle"
                        : "fa-exclamation-triangle"
                    }`}
                    style={{ color: "rgb(175, 54, 148)", fontSize: "100px" }}
                  />
                  <div>{resultMsg}</div>
                  <div>{errorMessage && errorMessage.toString()}</div>
                </React.Fragment>
              )}
            </div>
          </ModalAlert>
        </Layout>
      </div>
    );
  }
}
export default withAuth(
  withTranslation(["invoice-detail", "detail", "common", "menu"])(invoiceDetail)
);
