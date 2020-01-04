import React, { Component } from "react";
import Router from "next/router";
import _ from "lodash";
import moment from "moment";
import Layout from "../components/Layout";
import withAuth from "../libs/withAuth";
import CordaService from "../services/CordaService";
import StandardService from "../services/StandardService";
import "../libs/mycools";
import statusColor from "../configs/color.dn.json";
import Fields from "~/components/Fields";
import ModalDropFile from "../components/modalDropFile";
import { PageHeader, Collapse } from "../components/page";
import BlockUi from "react-block-ui";
import ModalAlert from "../components/modalAlert";
import SectionTwoHeaderInfo from "../components/SectionTwoHeaderInfo";
import SectionInfo from "~/components/SectionInfo";
import { DEBIT_AUTH, DOA_AUTH } from "../configs/authorise.config";
import { DEBIT_ROUTES } from "../configs/routes.config";
import { DEBIT_ATTACHMENT_TYPE } from "../configs/attachmentType.config";
import { i18n, withTranslation } from "~/i18n";
import {
  APPROVE_FAILED,
  REJECT_FAILED,
  CANCEL_FAILED,
  REVISE_PAYMENT_DUE_DATE_FAILED
} from "../configs/errorMessage.config";
import {
  MODEL_VENDOR_INFO,
  MODEL_COMPANY_INFO
} from "../components/debit-note/models/vendor-company-info";
import {
  MODEL_DEBIT_NOTE_DETAIL_ONE,
  MODEL_DEBIT_NOTE_DETAIL_TWO
} from "~/components/debit-note/models/debit-note-detail-info";
import {
  MODEL_ATTACHMENT_INFO_ONE,
  MODEL_ATTACHMENT_INFO_TWO
} from "../components/debit-note/models/attachment-info-detail";
import { MODEL_ATTACHMENT } from "../components/debit-note/models/attachment";
import CreditNoteSettled from "~/containers/CreditNoteSettled";
import { mapActionHistory } from "../helpers/app";
import { parseDebitNoteAdjustmentType } from "../components/debit-note/helper";
// import mobileModel from "../columns/mobiles/cn-item-list.json";
import GA from "~/libs/ga";

const FORMAT = "DD/MM/YYYY";
const lifecycleCancel = ["ISSUED", "PENDING_SELLER"];
const lifecycleEdit = ["ISSUED", "PENDING_SELLER"];
const lifecycleApproveAndRejectFromDN = ["ISSUED", "PENDING_BUYER"];
const lifecycleApproveAndRejectFromDOA = [
  "PENDING_AUTHORITY",
  "PARTIALLY_APPROVED"
];
const lifecycleReviseDueDate = ["ISSUED"];

class DebitNoteDetail extends Component {
  constructor(props) {
    super(props);

    this.cordaService = new CordaService();
    this.standardService = new StandardService();

    this.cancelDebitNote = this.cancelDebitNote.bind(this);
    this.handleApproveModal = this.handleApproveModal.bind(this);
    this.handleCancelModal = this.handleCancelModal.bind(this);
    this.handleRejectModal = this.handleRejectModal.bind(this);
    this.onCancelApproveModal = this.onCancelApproveModal.bind(this);
    this.onCancelRejectModal = this.onCancelRejectModal.bind(this);

    this.handleDismissBtnModal = this.handleDismissBtnModal.bind(this);
    this.handleDismissBtnRejectModal = this.handleDismissBtnRejectModal.bind(
      this
    );
    this.handleDismissBtnApproveModal = this.handleDismissBtnApproveModal.bind(
      this
    );
    const { url = {}, permisions } = this.props;
    const { query = {} } = url;
    const { linearId, page_pre = "" } = query;

    this.state = {
      blocking: false,
      linearId: linearId,
      page_pre: page_pre,
      detailItems: {},
      taxRateList: [],
      actionHistory: [],
      UserAuthority: permisions,
      // Alert Modal
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      isTextOnly: true,
      buttonAlert: [],

      isApproveModalVisible: false,
      approveRejectRemark: "",

      isToggleRevisePaymentDueDateModal: false,
      revisePaymentDueDateModalTitle: "",
      reviseDateIsRequiredFlag: false,
      reviseReasonIsRequiredFlag: false,
      revisedDueDateReason: "",

      selectedDate: "",
      disabledDate: {},

      configFileApprove: {},
      configFileReject: {},
      approveFile: [],
      rejectFile: [],

      isAllowEdit: false,
      isAllowApproveReject: false,
      isAllowCancel: false,
      isAllowReviseDueDate: false,

      attachmentDebitNote: [],
      attachmentOthers: [],

      configHolidays: [],
      configBefore: "",
      configAfter: "",

      isRejectModalVisible: false,
      isApproveModalVisible: false,
      isActionHistorySectionBlock: true,
      isAllowActionHistory: false,
      disabledDays: {}
      // moblieColumnListItem: mobileModel.table.columns
    };
  }

  async componentDidMount() {
    this.prepareAttachmentModel();

    await this.permissionPage();
    await this.fetchData();
  }

  handleToggleBlocking = () => {
    this.setState({ blocking: !this.state.blocking });
  };

  prepareAttachmentModel = () => {
    MODEL_ATTACHMENT.forEach(model => {
      model.attachments.forEach(attachment => {
        attachment.download = true;
      });
    });
  };

  routeToDNList() {
    Router.push(DEBIT_ROUTES.LIST);
  }

  formatCurrency(amount, digit) {
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      minimumFractionDigits: digit,
      maximumFractionDigits: digit
    }).format(amount);
  }

  formatQty(amount, digit) {
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      minimumFractionDigits: digit,
      maximumFractionDigits: digit
    }).format(amount);
  }

  onApproveReasonChange = e => {
    this.setState({
      approveReasonText: e.target.value
    });
  };

  onRejectReasonChange = e => {
    this.setState({
      rejectReasonText: e.target.value
    });
  };

  onCancelApproveModal() {
    this.setState({
      isApproveModalVisible: false
    });
  }

  onCancelRejectModal() {
    this.setState({
      isRejectModalVisible: false
    });
  }

  handleEditBtnClick() {
    Router.push(`/debit-note-edit?linearId=${this.state.detailItems.linearId}`);
  }

  handleApproveModal() {
    this.setState({
      isApproveModalVisible: true
    });
  }

  handleRejectModal() {
    this.setState({
      isRejectModalVisible: true
    });
  }

  handleCancelModal() {
    this.setState({
      isAlertModalVisible: true,
      alertModalAlertTitle: "Cancel Debit Note",
      alertModalMsg: [
        "Do you want to cancel this debit note?",
        <br />,
        <span class="red">
          Warning: Debit Note Number cannot reuse when you cancel this debit
          note.
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
            onClick: this.cancelDebitNote
          }
        }
      ]
    });
  }

  async uploadFile(files, type) {
    const attachments = [];

    for (let i = 0; i < files.length; i++) {
      const data = new FormData();

      data.append("file", files[i]);

      const fileUploadResponse = await this.cordaService.callApi({
        group: "file",
        action: "handleFileUpload",
        body: data
      });

      const { status } = fileUploadResponse;

      if (status) {
        attachments.push(fileUploadResponse.data);
      } else {
        return false;
      }
    }

    return attachments.map(attachment => ({
      ...attachment,
      attachmentType: type
    }));
  }

  onReject = async () => {
    const { rejectFile, detailItems, rejectReasonText } = this.state;
    const body = {
      linearId: detailItems.linearId,
      remark: rejectReasonText
    };

    GA.event({
      category: "Debit Note",
      action: "Reject DN (Request)",
      label: `Debit Note | ${
        this.state.detailItems.externalId
      } | ${moment().format()}`
    });

    this.setState({
      blocking: true,
      isAlertModalVisible: false
    });

    if (rejectFile.length > 0) {
      const uploadedFileList = await this.uploadFile(
        rejectFile,
        DEBIT_ATTACHMENT_TYPE.BuyerApprove
      );

      if (uploadedFileList && uploadedFileList.length > 0) {
        body.fileAttachments = uploadedFileList;
      }
    }

    const { status, message } = await this.cordaService.callApi({
      group: "debit",
      action: "rejectDebitNote",
      body: body
    });

    if (status) {
      GA.event({
        category: "Debit Note",
        action: "Reject DN (Success)",
        label: `Debit Note | ${
          this.state.detailItems.externalId
        } | ${moment().format()}`
      });

      Router.push(DEBIT_ROUTES.LIST);
    } else {
      const errorMessagePattern = REJECT_FAILED.replace("%m", "debit note");

      this.handleErrorModal(`${errorMessagePattern} ${message}`);

      this.setState({
        rejectFile: []
      });

      GA.event({
        category: "Debit Note",
        action: "Reject DN (Failed)",
        label: `Debit Note | ${
          this.state.detailItems.externalId
        } | ${moment().format()}`
      });
    }
  };

  onApprove = async () => {
    const { approveFile, detailItems, approveReasonText } = this.state;
    const body = {
      linearId: detailItems.linearId,
      remark: approveReasonText
    };

    GA.event({
      category: "Debit Note",
      action: "Approve DN (Request)",
      label: `Debit Note | ${
        this.state.detailItems.externalId
      } | ${moment().format()}`
    });

    this.setState({
      blocking: true,
      isAlertModalVisible: false
    });

    if (approveFile.length > 0) {
      const uploadedFileList = await this.uploadFile(
        approveFile,
        DEBIT_ATTACHMENT_TYPE.BuyerApprove
      );

      if (uploadedFileList && uploadedFileList.length > 0) {
        body.fileAttachments = uploadedFileList;
      }
    }

    const { status, message } = await this.cordaService.callApi({
      group: "debit",
      action: "approveDebitNote",
      body: body
    });

    if (status) {
      GA.event({
        category: "Debit Note",
        action: "Approve DN (Success)",
        label: `Debit Note | ${
          this.state.detailItems.externalId
        } | ${moment().format()}`
      });

      Router.push(DEBIT_ROUTES.LIST);
    } else {
      const errorMessagePattern = APPROVE_FAILED.replace("%m", "debit note");

      this.handleErrorModal(`${errorMessagePattern} ${message}`);

      this.setState({
        approveFile: []
      });

      GA.event({
        category: "Debit Note",
        action: "Approve DN (Failed)",
        label: `Debit Note | ${
          this.state.detailItems.externalId
        } | ${moment().format()}`
      });
    }
  };

  setObjFileAttachmentsForComponent() {
    const { DEBIT_NOTE, RECEIPT, OTHERS } = DEBIT_ATTACHMENT_TYPE;
    const { fileAttachments } = this.state;
    const attachmentDebitNote = [];
    const attachmentReceipt = [];
    const attachmentOthers = [];

    if (!_.isEmpty(fileAttachments) && fileAttachments.length > 0) {
      fileAttachments.forEach(attachment => {
        const obj = {
          name: attachment.attachmentName,
          hash: attachment.attachmentHash,
          owner: attachment.owner
        };

        switch (attachment.attachmentType) {
          case DEBIT_NOTE:
            attachmentDebitNote.push(obj);
            break;
          case RECEIPT:
            attachmentReceipt.push(obj);
            break;
          case OTHERS:
            attachmentOthers.push(obj);
            break;
        }
      });

      this.setState({
        attachmentDebitNote,
        attachmentReceipt,
        attachmentOthers
      });
    }
  }

  getActionHistory = async debitNoteData => {
    const requestParams = {
      documentType: "debitnote",
      documentLinearId: debitNoteData.linearId
    };

    const { status, data } = await this.standardService.callApi({
      group: "actionHistory",
      action: "getActionHistory",
      requestParams: requestParams
    });

    if (status) {
      this.setState({
        actionHistory: data,
        isActionHistorySectionBlock: false
      });
    } else {
      this.setState({
        isActionHistorySectionBlock: true
      });
    }
  };

  onApproveFileChange = files => {
    this.setState({
      approveFile: files
    });
  };
  onRejectFileChange = files => {
    this.setState({
      rejectFile: files
    });
  };

  async cancelDebitNote() {
    const { detailItems } = this.state;
    const body = {
      linearId: detailItems.linearId,
      cancelledRemark: "Cancel"
    };

    GA.event({
      category: "Debit Note",
      action: "Cancel DN (Request)",
      label: `Debit Note | ${
        this.state.detailItems.externalId
      } | ${moment().format()}`
    });

    this.setState({
      blocking: true,
      isAlertModalVisible: false
    });

    const { status, message } = await this.cordaService.callApi({
      group: "debit",
      action: "cancelDebitNote",
      body: body
    });

    if (status) {
      GA.event({
        category: "Debit Note",
        action: "Cancel DN (Success)",
        label: `Debit Note | ${
          this.state.detailItems.externalId
        } | ${moment().format()}`
      });

      Router.push(DEBIT_ROUTES.LIST);
    } else {
      const errorMessagePattern = CANCEL_FAILED.replace("%m", "debit note");

      this.handleErrorModal(`${errorMessagePattern} ${message}`);

      GA.event({
        category: "Debit Note",
        action: "Cancel DN (Failed)",
        label: `Debit Note | ${
          this.state.detailItems.externalId
        } | ${moment().format()}`
      });
    }

    this.setState({ cancelRemark: "" });
  }

  handleErrorModal(errorMsg) {
    this.setState({
      blocking: false,
      isAlertModalVisible: true,
      alertModalAlertTitle: "Error!",
      isTextOnly: true,
      alertModalMsg: [errorMsg, <br />, "Please contact your administrator."],
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

  handleDismissBtnApproveModal() {
    this.setState({
      isApproveModalVisible: false,
      alertApproveModalAlertTitle: "",
      isTextOnly: false,
      buttonAlertApprove: [],
      approveRejectRemark: ""
    });
  }

  handleResiveDateChange = value => {
    const selectedDate = value || "";

    $("#revisePaymentDueDateLabel").addClass("action-label-input");

    this.setState(
      {
        selectedDate: selectedDate,
        reviseDateIsRequiredFlag: selectedDate === ""
      },
      () => {
        document.getElementBy;
      }
    );
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
        // reviseDateIsRequiredFlag: true,
        reviseReasonIsRequiredFlag: true
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

  handleDismissBtnRejectModal() {
    this.setState({
      isAlertRejectModalVisible: false,
      rejectRemark: "",
      rejectTextareaIsRequired: false
    });
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
      this.setState({
        isToggleRevisePaymentDueDateModal: false,
        blockSection1: true,
        blockSection2: true
      });

      const requestParams = {
        linearId: this.state.detailItems.linearId,
        revisedDueDate: moment(this.state.selectedDate).format("DD/MM/YYYY"),
        revisedDueDateReason: this.state.revisedDueDateReason
      };

      const { status, message } = await this.cordaService.callApi({
        group: "debit",
        action: "editDueDate",
        requestParams: requestParams
      });

      if (status) {
        this.fetchData();

        this.setState({
          selectedDate: "",
          revisedDueDateReason: ""
        });
      } else {
        const errorMessagePattern = REVISE_PAYMENT_DUE_DATE_FAILED.replace(
          "%m",
          "debit note"
        );
        const alertModalMsg = [
          `${errorMessagePattern} ${message}`,
          <br />,
          "Please contact your administrator."
        ];

        this.setState({
          selectedDate: "",
          revisedDueDateReason: "",
          blockSection1: false,
          blockSection2: false,
          isAlertModalVisible: true,
          isTextOnly: true,
          alertModalAlertTitle: "Error!",
          alertModalMsg,
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
    }
  };

  getCalItemsSubTotal(items) {
    let subTotal = 0;
    items.forEach(item => {
      subTotal = subTotal + +item.subTotal;
    });
    return subTotal;
  }

  calTax(amount, percentage) {
    return (amount * (percentage / 100)).toFixed(2);
  }

  permissionPage = () => {
    const { permisions } = this.props;
    const { page_pre } = this.state;
    let name_auth = "";

    if (page_pre == "doa") {
      name_auth = DOA_AUTH.VIEW_DETAIL;
    } else {
      name_auth = DEBIT_AUTH.VIEW_DETAIL;
    }

    if (!permisions.includes(name_auth)) {
      Router.push("/dashboard");
    }
  };

  getAvailableDueDate = async (linearId, companyTaxId, initialDueDate) => {
    const requestParams = {
      linearId: linearId,
      companyTaxId: companyTaxId,
      initialDueDate: initialDueDate
    };

    return await this.standardService.callApi({
      group: "debitNote",
      action: "getAvailableRevisedDueDate",
      requestParams: requestParams
    });
  };

  fetchData = async () => {
    this.handleToggleBlocking();

    const { user, url } = this.props;
    const { linearId, page_pre = "", UserAuthority } = this.state;
    const permisions_view_detail =
      page_pre === "doa" ? DOA_AUTH.APPROVE : DEBIT_AUTH.APPROVE;
    const lifecycle_approve_reject =
      page_pre === "doa"
        ? lifecycleApproveAndRejectFromDOA
        : lifecycleApproveAndRejectFromDN;
    const attachmentTypeApprove =
      page_pre === "doa" ? "DOAApprove" : "BuyerApprove";
    const attachmentTypeReject =
      page_pre === "doa" ? "DOAReject" : "BuyerReject";
    const pathParams = {
      linearId: linearId
    };
    const requestParams = {
      role: user.organisationUnit
    };

    const { status, data, message } = await this.cordaService.callApi({
      group: "debit",
      action: "getDebitNote",
      pathParams: pathParams,
      requestParams: requestParams
    });

    if (status && !_.isEmpty(data.rows)) {
      const detail = !_.isEmpty(data.rows) ? data.rows[0] : data;

      if (
        user.organisationUnit === "SELLER" &&
        UserAuthority.includes(DEBIT_AUTH.CANCEL) &&
        lifecycleCancel.includes(detail.lifecycle) &&
        !detail.isETaxDebitNote
      ) {
        this.setState({ isAllowCancel: true });
      }

      if (
        lifecycleReviseDueDate.includes(detail.lifecycle) &&
        UserAuthority.includes(DEBIT_AUTH.REVISE_DUE_DATE) &&
        !detail.dueDateIsLocked &&
        user.organisationUnit == "BUYER"
      ) {
        const { companyTaxNumber, initialDueDate, linearId } = detail;
        let holidays = [];
        let availableDueDate = {};
        let disabledDays = [];

        const bankLegalNameResponse = await this.cordaService.callApi({
          group: "offledgers",
          action: "getConfigurationByName",
          requestParams: {
            configOption: "BANK_LEGAL_NAME"
          }
        });

        if (bankLegalNameResponse.status) {
          const holidayResponse = await this.cordaService.callApi({
            group: "offledgers",
            action: "getHolidayFromDate",
            requestParams: {
              party: bankLegalNameResponse.data[0]["value"],
              dateFrom: moment().format("YYYY-MM-DDTHH:mm:ss.000") + "Z"
            }
          });

          if (holidayResponse.status) {
            holidays = holidayResponse.data.holidays;
          }
        }

        if (companyTaxNumber && initialDueDate && linearId) {
          const availableDueDateResponse = await this.getAvailableDueDate(
            linearId,
            companyTaxNumber,
            initialDueDate
          );

          if (availableDueDateResponse.status) {
            availableDueDate = {
              before: moment(availableDueDateResponse.data.dateFrom).toDate(),
              after: moment(availableDueDateResponse.data.dateTo).toDate()
            };
          }
        }

        const formatHolidays = holidays.map(holiday => {
          const t = new Date(holiday * 1000);
          const d = t.getDate();
          const m = t.getMonth();
          const y = t.getFullYear();

          return new Date(y, m, d);
        });

        disabledDays = [...formatHolidays, availableDueDate];

        this.setState({
          isAllowReviseDueDate: true,
          disabledDays: disabledDays
        });
      }

      if (
        user.organisationUnit === "BUYER" &&
        UserAuthority.includes(permisions_view_detail) &&
        lifecycle_approve_reject.includes(detail.lifecycle)
      ) {
        this.setState({ isAllowApproveReject: true });
      }

      if (user.organisationUnit === "BUYER") {
        await this.getActionHistory(detail);

        this.setState({ isAllowActionHistory: true });
      }

      if (
        user.organisationUnit === "SELLER" &&
        UserAuthority.includes(DEBIT_AUTH.EDIT) &&
        lifecycleEdit.includes(detail.lifecycle)
      ) {
        this.setState({ isAllowEdit: true });
      }

      const requestParams = {
        legalName: detail.buyer.legalName,
        companyTaxId: detail.companyTaxNumber,
        counterPartyTaxId: detail.vendorTaxNumber
      };

      const configurationResponse = await this.cordaService.callApi({
        group: "offledgers",
        action: "getConfigurationForDebitNote",
        requestParams: requestParams
      });

      if (configurationResponse.status) {
        const config = configurationResponse.data;

        const configFileApprove = config.attachmentConfiguration.filter(
          configFile => configFile.attachmentType === attachmentTypeApprove
        )[0];

        const configFileReject = config.attachmentConfiguration.filter(
          configFile => configFile.attachmentType === attachmentTypeReject
        )[0];

        this.setState({
          configFileApprove,
          configFileReject
        });
      }

      this.setState(
        {
          detailItems: detail,
          items: detail.debitNoteItems,
          fileAttachments: detail.fileAttachments
        },
        () => {
          this.handleToggleBlocking();
          this.extractDebitNoteItemByTaxRate();
          this.setObjFileAttachmentsForComponent();
        }
      );
    } else {
      this.handleErrorModal(message);
    }
  };

  extractDebitNoteItemByTaxRate() {
    const debitNoteItem = this.state.items;
    const taxRateList = [];
    const taxRateListItem = {};

    !_.isEmpty(debitNoteItem) &&
      debitNoteItem.forEach(item => {
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

  generateRowTableForTax(taxItems) {
    if (taxItems.length > 0) {
      return _.map(
        taxItems,
        ({
          externalId,
          invoiceItemExternalId,
          materialDescription,
          materialGroup,
          purchaseOrderExternalId,
          purchaseItem,
          invoiceItems,
          subTotal,
          currency,
          site,
          withholdingTaxRate
        }) => (
          <tr>
            {/* DN Item No. */}
            {externalId ? <td>{externalId}</td> : <td>-</td>}
            {/* Invoice Item No. */}
            {invoiceItemExternalId ? (
              <td>{invoiceItemExternalId}</td>
            ) : (
              <td>-</td>
            )}
            {/* Material Description */}
            {materialDescription ? <td>{materialDescription}</td> : <td>-</td>}
            {/* Material Group */}
            {materialGroup ? <td>{materialGroup}</td> : <td>-</td>}
            {/* PO No. */}
            {purchaseOrderExternalId ? (
              <td>{purchaseOrderExternalId}</td>
            ) : purchaseItem && purchaseItem.poNumber ? (
              <td>{purchaseItem.poNumber}</td>
            ) : (
              <td>-</td>
            )}
            {/* Invoice Amount */}
            {invoiceItems &&
            invoiceItems.length > 0 &&
            invoiceItems[0].itemSubTotal ? (
              <td>{this.formatCurrency(invoiceItems[0].itemSubTotal, 2)}</td>
            ) : (
              <td>{this.formatCurrency(0, 2)}</td>
            )}
            {/* DN Amount */}
            {subTotal ? (
              <td>{this.formatCurrency(subTotal, 2)}</td>
            ) : (
              <td>-</td>
            )}
            {/* Currency */}
            {currency ? <td>{currency}</td> : <td>-</td>}
            {/* Site */}
            {site ? <td>{site}</td> : <td>-</td>}
            {/* WHT Rate */}
            {withholdingTaxRate ? <td>{withholdingTaxRate} %</td> : <td>-</td>}
          </tr>
        )
      );
    } else {
      return (
        <div>
          <center>No Item Found</center>
        </div>
      );
    }
  }

  generateRowMobileTableForTax(taxItems) {
    if (taxItems.length > 0) {
      return _.map(
        taxItems,
        (
          {
            externalId,
            invoiceItemExternalId,
            materialDescription,
            materialGroup,
            purchaseOrderExternalId,
            purchaseItem,
            invoiceItems,
            subTotal,
            currency,
            site,
            withholdingTaxRate
          },
          index
        ) => (
          <React.Fragment>
            <tr>
              <td>{externalId ? externalId : "-"}</td>
              <td>{materialDescription ? materialDescription : "-"}</td>
              <td>
                <a
                  href={`#itemInfo-${index}`}
                  data-toggle="collapse"
                  role="button"
                  aria-expanded="false"
                  area-controls={`#itemInfo-0`}
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
            <tr id={`itemInfo-${index}`} className="collapse multi-collapse">
              <td colSpan="3">
                <div className="d-flex flex-wrap w-100">
                  <div className="col-6 px-0 text-right">Invoice Item No.:</div>
                  <div className="col-6 text-left uppercase word-wrap">
                    {invoiceItemExternalId ? invoiceItemExternalId : "-"}
                  </div>
                  <div className="col-6 px-0 pt-3 text-right">PO No.:</div>
                  <div className="col-6 pt-3 text-left">
                    {purchaseOrderExternalId
                      ? purchaseOrderExternalId
                      : purchaseItem && purchaseItem.poNumber
                      ? purchaseItem.poNumber
                      : "-"}
                  </div>
                  <div className="col-6 px-0 pt-3 text-right">
                    Invoice Amount:
                  </div>
                  <div className="col-6 pt-3 text-left">
                    {invoiceItems &&
                    invoiceItems.length > 0 &&
                    invoiceItems[0].itemSubTotal
                      ? this.formatCurrency(invoiceItems[0].itemSubTotal, 2)
                      : this.formatCurrency(0, 2)}
                  </div>

                  <div className="col-6 px-0 pt-3 text-right">Site:</div>
                  <div className="col-6 pt-3 text-left">
                    {site ? site : "-"}
                  </div>

                  <div className="col-6 px-0 pt-3 text-right">WHT Rate:</div>
                  <div className="col-6 pt-3 text-left">
                    {withholdingTaxRate ? `${withholdingTaxRate}%` : "-"}
                  </div>

                  <div className="col-6 px-0 pt-3 text-right">DN Amount:</div>
                  <div className="col-6 pt-3 text-left">
                    {subTotal ? this.formatCurrency(subTotal, 2) : "-"}
                  </div>
                  <div className="col-6 px-0 pt-3 text-right">Currency:</div>
                  <div className="col-6 pt-3 text-left">
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
        <div>
          <center>No Item Found</center>
        </div>
      );
    }
  }

  generateRowTableForTaxSummary(vatRate) {
    const { t } = this.props;
    const { detailItems } = this.state;

    return (
      <tfoot>
        <tr>
          <td colSpan="7" className="text-right">
            {t("Sub Total (Exclude VAT)")}
          </td>
          <td className="font-bold">
            {this.formatCurrency(
              this.getCalItemsSubTotal(
                this.state.taxRateListItem[`tax${vatRate}`]
              ),
              2
            )}
          </td>
          <td>{detailItems.currency}</td>
        </tr>
        <tr>
          <td colSpan="7" className="text-right">
            {t("TAX Total")} ({vatRate}%)
          </td>
          <td className="font-bold">
            {this.formatCurrency(
              this.calTax(
                this.getCalItemsSubTotal(
                  this.state.taxRateListItem[`tax${vatRate}`]
                ),
                vatRate
              ),
              2
            )}
          </td>
          <td>{detailItems.currency}</td>
        </tr>
        <tr>
          <td colSpan="7" className="text-right">
            {t("Item Amount (Inc TAX)")}
          </td>
          <td className="font-bold">
            {this.formatCurrency(
              this.getCalItemsSubTotal(
                this.state.taxRateListItem[`tax${vatRate}`]
              ) +
                +this.calTax(
                  this.getCalItemsSubTotal(
                    this.state.taxRateListItem[`tax${vatRate}`]
                  ),
                  vatRate
                ),
              2
            )}
          </td>
          <td>{detailItems.currency}</td>
        </tr>
      </tfoot>
    );
  }

  generateRowMobileTableForTaxSummary(vatRate) {
    const { detailItems } = this.state;

    return (
      <div className="d-flex flex-wrap w-100 border-top">
        <div className="col-12 px-0 pt-3 d-flex flex-wrap">
          <div className="col-6 text-right px-0">Sub Total (Exclude VAT)</div>
          <div className="col-4 text-right pl-0 pr-1">
            <span className="bold">
              {this.formatCurrency(
                this.getCalItemsSubTotal(
                  this.state.taxRateListItem[`tax${vatRate}`]
                ),
                2
              )}
            </span>
          </div>
          <div className="col-2 text-right pl-1">{detailItems.currency}</div>
        </div>
        <div className="col-12 px-0 pt-3 d-flex flex-wrap">
          <div className="col-6 text-right px-0">TAX Total ({vatRate}%)</div>
          <div className="col-4 text-right pl-0 pr-1">
            <span className="bold">
              {this.formatCurrency(
                this.calTax(
                  this.getCalItemsSubTotal(
                    this.state.taxRateListItem[`tax${vatRate}`]
                  ),
                  vatRate
                ),
                2
              )}
            </span>
          </div>
          <div className="col-2 text-right pl-1">{detailItems.currency}</div>
        </div>
        <div className="col-12 px-0 py-3 d-flex flex-wrap">
          <div className="col-6 text-right px-0">Item Amount (inc. TAX)</div>
          <div className="col-4 text-right pl-0 pr-1">
            <span className="bold">
              {this.formatCurrency(
                this.getCalItemsSubTotal(
                  this.state.taxRateListItem[`tax${vatRate}`]
                ) +
                  +this.calTax(
                    this.getCalItemsSubTotal(
                      this.state.taxRateListItem[`tax${vatRate}`]
                    ),
                    vatRate
                  ),
                2
              )}
            </span>
          </div>
          <div className="col-2 text-right pl-1">{detailItems.currency}</div>
        </div>
      </div>
    );
  }

  renderActionHistoryTable() {
    const { t } = this.props;
    const actionHistory = mapActionHistory(this.state.actionHistory);

    return (
      <section id="invoice_detail_page" className="box box--width-header">
        <div className="box__inner">
          <Collapse
            id="actionHistory"
            expanded="true"
            collapseHeader={[t("Action History")]}
          >
            {/* Desktop Version - Start */}
            <div className="table_wrapper d-none d-lg-inline-block">
              <div className="table-responsive">
                <table className="table table-3 dataTable">
                  <thead>
                    <tr>
                      <th>{t("Action")}</th>
                      <th>{t("Date/Time")}</th>
                      <th>{t("Modified by")}</th>
                      <th>{t("Reason")}</th>
                      <th>{t("Attach File")}</th>
                    </tr>
                  </thead>

                  <tbody>
                    {actionHistory.length > 0 ? (
                      actionHistory
                        .sort(
                          (a, b) =>
                            moment(b.actionDate).unix() -
                            moment(a.actionDate).unix()
                        )
                        .map(i => {
                          return (
                            <tr>
                              <td>{i.actionName}</td>
                              <td>
                                {moment(i.actionDate).format(
                                  "DD/MM/YYYY HH:mm:ss"
                                )}
                              </td>
                              <td>{i.commomName || i.actionBy}</td>
                              <td>{i.remark}</td>
                              <td>
                                {i.attachments.map(att => (
                                  <div>
                                    {att.attachmentName}&nbsp;
                                    <a
                                      href={`download/${att.attachmentHash}/${att.attachmentName}?filename=${att.attachmentName}&owner=${att.owner}`}
                                      className="purple font-bold underline"
                                    >
                                      Download
                                    </a>
                                  </div>
                                ))}
                              </td>
                            </tr>
                          );
                        })
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center">
                          {this.state.isActionHistorySectionBlock
                            ? "Cannot retrieve Action History for this debit note "
                            : "No Item Found"}
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
                <table className="table table-3 dataTable mobile_dataTable">
                  <thead>
                    <tr>
                      <th>{t("Action")}</th>
                      <th>{t("Date/Time")}</th>
                      <th>{t("More")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actionHistory.length > 0 ? (
                      actionHistory
                        .sort(
                          (a, b) =>
                            moment(b.actionDate).unix() -
                            moment(a.actionDate).unix()
                        )
                        .map((i, index) => {
                          return (
                            <React.Fragment>
                              <tr>
                                <td>{i.actionName}</td>
                                <td>
                                  {moment(i.actionDate).format(
                                    "DD/MM/YYYY HH:mm:ss"
                                  )}
                                </td>
                                <td>
                                  <a
                                    href={`#actionHistory-detail-${index}`}
                                    data-toggle="collapse"
                                    role="button"
                                    aria-expanded="false"
                                    area-controls={`#actionHistory-detail-${index}`}
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
                                      {t("Modified by")}:{" "}
                                    </div>
                                    <div className="col-6 text-left">
                                      {i.commomName || i.actionBy}
                                    </div>
                                    <div className="col-6 px-0 py-3 text-right">
                                      {t("Reason")}:{" "}
                                    </div>
                                    <div className="col-6 py-3 text-left">
                                      {i.remark}
                                    </div>
                                    <div className="col-6 px-0 text-right">
                                      {t("Attach File")}:{" "}
                                    </div>
                                    <div className="col-6 text-left">
                                      {i.attachments.map(att => (
                                        <div>
                                          {att.attachmentName}&nbsp;
                                          <a
                                            href={`download/${att.attachmentHash}/${att.attachmentName}?filename=${att.attachmentName}&owner=${att.owner}`}
                                            className="purple font-bold underline"
                                          >
                                            Download
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        })
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center">
                          {this.state.isActionHistorySectionBlock
                            ? "Cannot retrieve Action History for this debit note "
                            : "No Item Found"}
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
    );
  }

  renderItemInformation() {
    const { t } = this.props;
    const { taxRateList } = this.state;

    return (
      taxRateList &&
      taxRateList.map(vatRate => {
        return (
          <div className="box__inner">
            <Collapse
              id={`tax${vatRate}`}
              expanded="true"
              collapseHeader={[`${t("TAX")} ${vatRate}%`]}
            >
              {/* Desktop Version - Start */}
              <div className="table_wrapper d-none d-lg-inline-block">
                <div className="table-responsive">
                  <table className="table table-3 dataTable">
                    <thead>
                      <tr>
                        <th>
                          {t("DN Item No1")}
                          <br />
                          {t("DN Item No2")}
                        </th>
                        <th>
                          {t("Invoice Item No1")}
                          <br />
                          {t("Invoice Item No2")}
                        </th>
                        <th>{t("Material Description")}</th>
                        <th>{t("Material Group")}</th>
                        <th>
                          {t("PO No1")}
                          <br />
                          {t("PO No2")}
                        </th>
                        <th>
                          {t("Invoice Amount1")}
                          <br />
                          {t("Invoice Amount2")}
                        </th>
                        <th>
                          {t("DN Amount1")}
                          <br />
                          {t("DN Amount2")}
                        </th>
                        <th>{t("Currency")}</th>
                        <th>{t("Site")}</th>
                        <th>{t("WHT Rate")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {this.generateRowTableForTax(
                        this.state.taxRateListItem[`tax${vatRate}`]
                      )}
                    </tbody>
                    {this.generateRowTableForTaxSummary(vatRate)}
                  </table>
                </div>
              </div>
              {/* Desktop Version - End */}

              {/* Mobile Version - Start */}
              <div className="table_wrapper d-inline-block d-lg-none">
                <div className="table-responsive">
                  <table className="table table-3 dataTable mobile_dataTable">
                    <thead>
                      <tr>
                        <th>DN Item No.</th>
                        <th>Material Description</th>
                        <th>More</th>
                      </tr>
                    </thead>
                    <tbody>
                      {this.generateRowMobileTableForTax(
                        this.state.taxRateListItem[`tax${vatRate}`]
                      )}
                    </tbody>
                  </table>
                  {this.generateRowMobileTableForTaxSummary(vatRate)}
                </div>
              </div>
              {/* Mobile Version - End */}
            </Collapse>
          </div>
        );
      })
    );
  }

  getFormatData = () => {
    const {
      detailItems,
      attachmentDebitNote,
      attachmentReceipt,
      attachmentOthers,
      isAllowReviseDueDate
    } = this.state;

    return {
      invoiceRef: {
        title: detailItems.requestExternalId
          ? "-"
          : detailItems.invoiceExternalId,
        href: `invoice-detail?linearId=${detailItems.invoiceLinearId}&ref=dn,${detailItems.linearId},${detailItems.externalId}`
      },
      purchaseRequestNumber: {
        title: detailItems.purchaseRequestNumber,
        href: `invoice-detail?linearId=${""}&ref=dn,${
          detailItems.linearId
        },${""}`
      },
      requestExternalId: {
        title: detailItems.requestExternalId,
        href: `request-detail?linearId=${detailItems.requestLinearId}`
      },
      adjustmentType: detailItems.adjustmentType,
      adjustmentTypeDisplay: parseDebitNoteAdjustmentType(
        detailItems.adjustmentType
      ),
      paymentDate: detailItems.paymentDate
        ? moment(detailItems.paymentDate)
            .format("DD/MM/YYYY")
            .toString()
        : "-",
      sendToCMS:
        detailItems.customisedFields && detailItems.customisedFields.CMS
          ? "Yes"
          : "No",
      sendToBank:
        detailItems.paymentItemLinearId !== undefined &&
        detailItems.paymentItemLinearId !== null &&
        detailItems.paymentItemLinearId !== "null"
          ? "Yes"
          : "No",
      lastEditedBy: detailItems.lastEditedBy ? detailItems.lastEditedBy : "-",
      lastEditedDate: detailItems.lastEditedDate
        ? moment(detailItems.lastEditedDate)
            .format("DD/MM/YYYY")
            .toString()
        : "-",
      DebitNoteAttachment:
        attachmentDebitNote && attachmentDebitNote.length > 0
          ? attachmentDebitNote
          : [],
      receiptNumber: detailItems.receiptNumber
        ? detailItems.receiptNumber
        : "-",
      ReceiptAttachment:
        attachmentReceipt && attachmentReceipt.length > 0
          ? attachmentReceipt
          : [],
      OthersAttachment:
        attachmentOthers && attachmentOthers.length > 0 ? attachmentOthers : [],
      debitNoteDate: detailItems.debitNoteDate
        ? moment(detailItems.debitNoteDate)
            .format("DD/MM/YYYY")
            .toString()
        : "-",
      initialDueDate: detailItems.initialDueDate
        ? moment(detailItems.initialDueDate)
            .format("DD/MM/YYYY")
            .toString()
        : "-",
      revisedPaymentDueDate: isAllowReviseDueDate
        ? moment(detailItems.dueDate).format("DD/MM/YYYY")
        : detailItems.initialDueDate !== detailItems.dueDate
        ? moment(detailItems.dueDate).format("DD/MM/YYYY")
        : "-",
      subTotal: detailItems.subTotal
        ? `${this.formatCurrency(detailItems.subTotal, 2)} ${
            detailItems.currency
          }`
        : `${this.formatCurrency(0, 2)} ${detailItems.currency}`,
      vatTotal: detailItems.vatTotal
        ? `${this.formatCurrency(detailItems.vatTotal, 2)} ${
            detailItems.currency
          }`
        : `${this.formatCurrency(0, 2)} ${detailItems.currency}`,
      totalAmount: detailItems.total
        ? `${this.formatCurrency(detailItems.total, 2)} ${detailItems.currency}`
        : `${this.formatCurrency(0, 2)} ${detailItems.currency}`,
      totalPayable: detailItems.totalPayable
        ? `${this.formatCurrency(detailItems.totalPayable, 2)} ${
            detailItems.currency
          }`
        : `${this.formatCurrency(0, 2)} ${detailItems.currency}`,
      reason: detailItems.reason ? detailItems.reason : "-",
      receiptDate: detailItems.receiptDate
        ? moment(detailItems.receiptDate)
            .format("DD/MM/YYYY")
            .toString()
        : "-",
      dueDateLastEditedBy: detailItems.dueDateLastEditedBy
        ? detailItems.dueDateLastEditedBy
        : "-",
      dueDateLastEditedDate: detailItems.dueDateLastEditedDate
        ? moment(detailItems.dueDateLastEditedDate)
            .format("DD/MM/YYYY")
            .toString()
        : "-",
      dueDateLastEditedReason: detailItems.dueDateLastEditedReason
        ? detailItems.dueDateLastEditedReason
        : "-"
    };
  };

  setModelDebitNoteDetailTwo = () => {
    let model = MODEL_DEBIT_NOTE_DETAIL_TWO;
    if (_.has(model, "fields") && !_.isEmpty(model.fields)) {
      model.fields.map(value => {
        if (
          value.key == "revisedPaymentDueDate" &&
          this.state.isAllowReviseDueDate
        ) {
          value.canEdit = true;
          value.onClick = this.toggleRevisePaymentDueDateModal;
        }
        return value;
      });
    }
    return model;
  };

  render() {
    const { t } = this.props;
    let { ref: urlRef, page_pre = "" } = this.props.url.query;

    if (typeof urlRef == "object") {
    } else if (typeof urlRef == "string") {
      urlRef = [urlRef];
    }

    let breadcrumbs = [];
    let breadcrumbsGroup = [];

    if (urlRef !== "undefined") {
      if (page_pre === "doa") {
        breadcrumbs = [
          { title: t("Waiting DOA Approval"), url: "/waiting-doa-approval" },
          {
            title: `${t("Debit Note No")} ${
              !!this.state.detailItems.externalId
                ? this.state.detailItems.externalId
                : ""
            }`,
            active: true
          }
        ];
      } else {
        if (urlRef && urlRef.length > 0) {
          urlRef.map(b => {
            let r = b.split(",");
            switch (r[0]) {
              case "liv":
                if (!breadcrumbsGroup.includes(r[0])) {
                  breadcrumbs.push({
                    title: t("LIV Posting Result"),
                    url: "/liv-posting-result?filter=debitNote"
                  });
                  breadcrumbsGroup.push(r[0]);
                }
                break;
            }
          });

          breadcrumbs.push({
            title: `${t("Debit Note No")} ${this.state.detailItems.externalId}`,
            active: true
          });
        } else {
          breadcrumbs = [
            { title: t("Debit Note"), url: DEBIT_ROUTES.LIST },
            {
              title: `${t("Debit Note No")} ${
                !!this.state.detailItems.externalId
                  ? this.state.detailItems.externalId
                  : ""
              }`,
              active: true
            }
          ];
        }
      }
    }

    const {
      detailItems,
      alertModalAlertTitle,
      isAlertModalVisible,
      buttonAlert,

      configFileApprove,
      configFileReject,
      isApproveModalVisible,
      isRejectModalVisible,

      revisePaymentDueDateModalTitle,
      isToggleRevisePaymentDueDateModal,
      buttonRevisePaymentDueDateModal,

      reviseDateIsRequiredFlag,
      reviseReasonIsRequiredFlag,

      revisedDueDateReason,

      selectedDate,
      disabledDate,

      isTextOnly,
      alertModalMsg,
      isAllowApproveReject,
      isAllowEdit,
      isAllowCancel,

      configHolidays,
      configBefore,
      configAfter,
      revisePaymentDueDateIsValid,
      disabledDays
    } = this.state;

    return (
      <Layout {...this.props}>
        <PageHeader
          title={`${t("Debit Note No")} ${
            !!detailItems.externalId ? detailItems.externalId : ""
          }`}
          breadcrumbs={breadcrumbs}
          {...this.props}
        />
        <BlockUi tag="div" blocking={this.state.blocking}>
          <div
            id="mobilePageNav"
            className="col-12 px-0 bg-lightgray-3 p-3 d-flex d-lg-none"
          >
            <a href="/debit-note">
              <strong className="purple">
                <i className="fa fa-chevron-left" /> {t("Debit Note")}
              </strong>
            </a>
          </div>
          <section id="invoice_detail_page" className="box box--width-header">
            <div className="box__header">
              <div className="row justify-content-between align-items-center mb-2">
                <div className="col-4 pl-0 pl-lg-3">
                  {""}
                  {t("Entry Date")} : {""}
                  {moment(detailItems.debitNoteCreatedDate).format(
                    "DD/MM/YYYY"
                  )}
                </div>
                <div className="col-8 text-right pr-0 pr-lg-3">
                  {t("Status")} :{" "}
                  <strong
                    style={{
                      color: statusColor[detailItems.status],
                      marginRight: "15px"
                    }}
                  >
                    {detailItems.status}
                  </strong>
                  <div className="d-none d-md-inline-block d-lg-inline-block d-xl-inline-block">
                    <button
                      name="btnCancel"
                      className="btn btn--transparent btn-wide mr-2"
                      hidden={!isAllowCancel}
                      onClick={this.handleCancelModal}
                    >
                      Cancel DN
                    </button>
                    <button
                      name="btnEdit"
                      className="btn btn-wide mr-2"
                      hidden={!isAllowEdit}
                      onClick={() => this.handleEditBtnClick()}
                    >
                      Edit DN
                    </button>
                    <button
                      name="btnReject"
                      className="btn btn--transparent btn-wide mr-2"
                      hidden={!isAllowApproveReject}
                      onClick={this.handleRejectModal}
                    >
                      Reject
                    </button>
                    <button
                      name="btnApprove"
                      className="btn btn-wide mr-2"
                      hidden={!isAllowApproveReject}
                      onClick={this.handleApproveModal}
                    >
                      Approve
                    </button>
                  </div>
                </div>
                <div
                  className={`col-12 px-0 ${
                    !isAllowApproveReject && !isAllowCancel && !isAllowEdit
                      ? "d-none"
                      : "d-none d-lg-none"
                  } text-left`}
                >
                  <button
                    name="btnCancel"
                    className="btn btn--transparent btn-wide mr-2"
                    hidden={!isAllowCancel}
                    onClick={this.handleCancelModal}
                  >
                    Cancel DN
                  </button>
                  <button
                    name="btnEdit"
                    className="btn btn-wide mr-2"
                    hidden={!isAllowEdit}
                    onClick={() => this.handleEditBtnClick()}
                  >
                    Edit DN
                  </button>
                  <button
                    name="btnReject"
                    className="btn btn--transparent btn-wide mr-2"
                    hidden={!isAllowApproveReject}
                    onClick={this.handleRejectModal}
                  >
                    Reject
                  </button>
                  <button
                    name="btnApprove"
                    className="btn btn-wide mr-2"
                    hidden={!isAllowApproveReject}
                    onClick={this.handleApproveModal}
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
            <div className="box__inner pt-0 pt-lg-3">
              <SectionTwoHeaderInfo
                id="vendorInfo"
                id2="companyInfo"
                datas={detailItems}
                modelOne={MODEL_VENDOR_INFO}
                modelTwo={MODEL_COMPANY_INFO}
                className="d-none d-lg-flex flex-wrap"
              />
              <SectionInfo
                id="paymentInfo"
                datas={this.getFormatData()}
                header="Debit Note Information"
                modelOne={MODEL_DEBIT_NOTE_DETAIL_ONE}
                modelTwo={this.setModelDebitNoteDetailTwo()}
              />
              <SectionInfo
                id="attachmentInfo"
                datas={this.getFormatData()}
                header="Attachments"
                modelOne={MODEL_ATTACHMENT_INFO_ONE}
                modelTwo={MODEL_ATTACHMENT_INFO_TWO}
              />
              <CreditNoteSettled
                {...this.props}
                taggedCreditNotes={detailItems.taggedCreditNotes}
              />
            </div>
          </section>
          <section
            //TODO UPDATE THIS ID CSS!
            id="invoice_detail_page"
            className="box box--width-header"
            // hidden={this.state.taxRateList.length === 0}
          >
            <div className="box__header pb-0 pb-lg-3">
              <div className="row justify-content-between align-items-center mb-0 mb-lg-2">
                <div className="col">
                  <h3 className="mb-0 mb-lg-2">{t("Items Information")}</h3>
                </div>
              </div>
            </div>
            {this.renderItemInformation()}
          </section>

          <BlockUi hidden={!this.state.isAllowActionHistory}>
            <section id="invoice_detail_page" className="box box--width-header">
              <div className="box__header pb-0 pb-lg-3">
                <div className="row justify-content-between align-items-center mb-0 mb-lg-2">
                  <div className="col">
                    <h3 className="mb-0 mb-lg-2">{t("Action History")}</h3>
                  </div>
                </div>
              </div>
              {this.renderActionHistoryTable()}
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

          <ModalAlert
            title={revisePaymentDueDateModalTitle}
            visible={isToggleRevisePaymentDueDateModal}
            button={buttonRevisePaymentDueDateModal}
          >
            <div className="col-12">
              <div className="form-group custom-width-100">
                <Fields
                  model={{ lang: "debit-detail" }}
                  inputProps={{
                    type: "dayPicker",
                    key: "revisePaymentDueDate",
                    onChange: this.handleResiveDateChange,
                    canEdit: true,
                    classInput: `col-12`,
                    validation: true,
                    columnField: true,
                    placeholder: "Revised Payment Due Date",
                    messageError: "This field is required or invalid.",
                    disabledDays: disabledDays
                  }}
                  datas={{
                    revisePaymentDueDateIsValid: !reviseDateIsRequiredFlag,
                    revisePaymentDueDate: selectedDate
                  }}
                />
              </div>
            </div>
            <div className="col-12">
              <div className="form-group">
                <div className="form-label-group col-12">
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

          <ModalDropFile
            title={"Reject Reason"}
            isVisible={isRejectModalVisible}
            onFileChange={this.onRejectFileChange}
            onReasonChange={this.onRejectReasonChange}
            isReasonRequire={true}
            onCancelButton={this.onCancelRejectModal}
            onSubmitButton={this.onReject}
            configFile={configFileReject}
          />

          <ModalDropFile
            title={"Approve Reason"}
            isVisible={isApproveModalVisible}
            onFileChange={this.onApproveFileChange}
            onReasonChange={this.onApproveReasonChange}
            isReasonRequire={false}
            onCancelButton={this.onCancelApproveModal}
            onSubmitButton={this.onApprove}
            configFile={configFileApprove}
          />
        </BlockUi>
      </Layout>
    );
  }
}

export default withAuth(
  withTranslation(["debit-detail", "detail"])(DebitNoteDetail)
);
