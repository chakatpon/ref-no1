import React, { Component } from "react";
import Router from "next/router";
import moment from "moment";
import { has, forEach, uniq, findIndex, isEmpty, get } from "lodash";
import withAuth from "../libs/withAuth";
import CordaService from "../services/CordaService";
import Layout from "../components/Layout";
import BlockUi from "react-block-ui";
import SectionInfo from "../components/SectionInfo";
import SectionTwoHeaderInfo from "../components/SectionTwoHeaderInfo";
import {
  MODEL_VENDOR_INFO,
  MODEL_COMPANY_INFO
} from "../components/debit-note/models/vendor-company-info-edit";
import {
  MODEL_DEBIT_NOTE_INFO_EDIT_ONE,
  MODEL_DEBIT_NOTE_INFO_EDIT_TWO
} from "../components/debit-note/models/debit-note-info-edit";
import {
  MODEL_ATTACHMENT_INFO_ONE,
  MODEL_ATTACHMENT_INFO_TWO
} from "../components/debit-note/models/attachment-info-edit";
import { DEBIT_NOTE_ITEMS_EDIT } from "../components/debit-note/models/debit-note-item-edit";
import { DEBIT_ATTACHMENT_TYPE } from "../configs/attachmentType.config";
import {
  SYSTEM_FAILED,
  EDIT_FAILED,
  AMOUNT_OVER_MAX_LENGTH
} from "../configs/errorMessage.config";
import { DEBIT_AUTH } from "../configs/authorise.config";
import { DEBIT_ROUTES } from "../configs/routes.config";
import SectionCancelAndNext from "../components/SectionCancelAndNext";
import statusColor from "../configs/color.dn.json";
import DocumentItemTableEdit from "../components/document-item-edit/DocumentItemTableEdit";
import ModalWarning from "../components/ModalWarning";
import AutoCompleteField from "../components/Fields/AutoCompleteField";
import { toBigNumber } from "~/helpers/app";
import { checkValidAmount } from "~/helpers/validate";
import ModalMessage from "~/components/common/SweetAlert";
import { parseDebitNoteAdjustmentType } from "../components/debit-note/helper";
import GA from "~/libs/ga";

const fieldsAllowedToEdit = [
  "vendorBranchCodeId",
  "debitNoteDate",
  "dueDate",
  "subTotal",
  "vatTotal",
  "reason"
];
const amountField = ["subTotal", "vatTotal", "total"];
const dateFieldsAllowEdit = ["debitNoteDate", "dueDate"];
const SEARCH_INVOICE_LIFECYCLE = [
  "Verifying",
  "Submitted",
  "Partial GR",
  "Missing GR",
  "Missing DoA List",
  "Pending Manual Approval",
  "Pending Clarification",
  "Pending DoA Approval",
  "Waiting Payment Due Date",
  "Paid",
  "Payment Failed"
];
const { DEBIT_NOTE, RECEIPT, OTHERS } = DEBIT_ATTACHMENT_TYPE;
const attachementTypeAllowUpdate = [DEBIT_NOTE, RECEIPT, OTHERS];
const EDIT_ERROR_MESSAGE_PATTERN = EDIT_FAILED.replace("%m", "debit note");
const ALLOW_REVISE_DUE_DATE_LIFECYCLE = ["ISSUED"];
const lang = "debit-edit";

class DebitNoteEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      linearId: "",
      blocking: false,
      debitNote: {},
      initialDebitNoteNumber: "",
      isDebitDuplicated: false,
      debitNoteItems: [],
      referenceInvoice: {},
      referenceInvoiceItems: [],
      newReferenceInvoice: {},
      newReferenceInvoiceItems: [],
      selectedRows: [],
      validationErrorMessage: "",
      warningHeader: "",
      closeModal: null,
      debitNoteConfiguration: null,
      isLoading: false,
      changeInvoiceOptions: [],
      invoiceInput: null,
      clearSelectedRows: false,
      validDetail: false,
      UserAuthority: this.props.permisions,
      fieldMaxLengthAmount: {}
    };
  }

  cordaService = new CordaService();
  layout = React.createRef();

  componentWillMount() {
    this.handleToggleBlocking();
    this.prepareVendorInfoModel();
    this.prepareDebitNoteInfoModel();
    this.prepareDebitNoteItemEdit();
    this.prepareAttachmentInfoModel();
  }

  componentDidMount() {
    this.setState({
      linearId: this.props.url.query.linearId
    });

    this.getDebitNoteDetail(this.props.url.query.linearId);
  }

  prepareAttachmentInfoModel = () => {
    MODEL_ATTACHMENT_INFO_ONE.fields.forEach(field => {
      if (field.type === "files") {
        field.canEdit = true;
        field.onFileAdded = this.onFilesAdded;
        field.onRemove = this.onFilesRemoved;
      }
    });

    MODEL_ATTACHMENT_INFO_TWO.fields.forEach(field => {
      if (field.type === "files") {
        field.canEdit = true;
        field.onFileAdded = this.onFilesAdded;
        field.onRemove = this.onFilesRemoved;
      }
    });
  };

  async getDebitNoteConfiguration(debitNoteData) {
    const requestParams = {
      legalName:
        has(debitNoteData, "buyer") && has(debitNoteData.buyer, "legalName")
          ? debitNoteData.buyer.legalName
          : "",
      companyTaxId: has(debitNoteData, "companyTaxNumber")
        ? debitNoteData.companyTaxNumber
        : "",
      counterPartyTaxId: has(debitNoteData, "vendorTaxNumber")
        ? debitNoteData.vendorTaxNumber
        : ""
    };

    const { status, message, data } = await this.cordaService.callApi({
      group: "offledgers",
      action: "getConfigurationForDebitNote",
      requestParams: requestParams
    });

    let debitConfigResponse = {};

    if (
      status &&
      "attachmentConfiguration" in data &&
      data.attachmentConfiguration.length > 0
    ) {
      this.setState({
        debitNoteConfiguration: data
      });

      data.attachmentConfiguration.forEach(config => {
        const files = [];

        debitNoteData.fileAttachments.forEach(file => {
          if (file.attachmentType === config.attachmentType) files.push(file);
        });

        debitConfigResponse[`${config.attachmentType}Attachment`] = files;
        debitConfigResponse[`${config.attachmentType}AttachmentRequired`] =
          config.minimumNumberOfFiles > 0;
        debitConfigResponse[
          `${config.attachmentType}AttachmentRequiredTooltip`
        ] =
          config.minimumNumberOfFiles === config.maximumNumberOfFiles
            ? config.minimumNumberOfFiles
            : `${config.minimumNumberOfFiles} - ${config.maximumNumberOfFiles}`;
        debitConfigResponse[`${config.attachmentType}AttachmentFormat`] =
          config.fileType;
        debitConfigResponse[`${config.attachmentType}AttachmentAllowAction`] =
          config.allowedAction;
      });
    } else {
      const errorMessagePattern = SYSTEM_FAILED.replace(
        "%m",
        "get attachment configuration"
      );
      ModalMessage({
        title: "Error",
        message: `${errorMessagePattern} ${
          message ? message : "attachment configuration not found."
        }`,
        buttons: [
          {
            label: "OK",
            attribute: {
              onClick: e => this.routeCancel(e)
            }
          }
        ]
      });

      debitConfigResponse = {
        [`${DEBIT_NOTE}Attachment`]: [],
        [`is${DEBIT_NOTE}AttachmentRequired`]: false,
        [`${DEBIT_NOTE}AttachmentRequiredTooltip`]: "",
        [`${DEBIT_NOTE}AttachmentFormat`]: "",
        [`${DEBIT_NOTE}AttachmentAllowAction`]: [],
        [`${RECEIPT}Attachment`]: [],
        [`is${RECEIPT}AttachmentRequired`]: false,
        [`${RECEIPT}AttachmentRequiredTooltip`]: "",
        [`${RECEIPT}AttachmentFormat`]: "",
        [`${RECEIPT}AttachmentAllowAction`]: [],
        [`${OTHERS}Attachment`]: [],
        [`is${OTHERS}AttachmentRequired`]: false,
        [`${OTHERS}AttachmentRequiredTooltip`]: "",
        [`${OTHERS}AttachmentFormat`]: "",
        [`${OTHERS}AttachmentAllowAction`]: []
      };
    }

    return debitConfigResponse;
  }

  validateFields() {
    const {
      debitNote,
      selectedRows,
      isDebitDuplicated,
      fieldMaxLengthAmount
    } = this.state;

    const hasValidNumber = debitNote.externalId != "" && !isDebitDuplicated;
    const hasValidAmount =
      toBigNumber(debitNote.subTotal).toNumber() > 0 &&
      toBigNumber(debitNote.vatTotal).toNumber() > 0 &&
      debitNote.reason != "";
    const hasValidItems =
      selectedRows.length > 0 &&
      selectedRows.every(
        item => toBigNumber(item.adjustedAmount).toNumber() > 0
      );
    const hasValidAttachments = this.validateAttachments();

    let arrayValue = [debitNote, ...selectedRows];
    let hasValidAmountByItem = true;

    forEach(arrayValue, value => {
      const { status, rule } = checkValidAmount(value, fieldMaxLengthAmount);
      if (status === false) {
        hasValidAmountByItem = false;
        ModalMessage({
          title: "Error",
          message: AMOUNT_OVER_MAX_LENGTH.replace("%f", rule.title).replace(
            "%l",
            rule.maxLength
          ),
          buttons: [
            {
              label: "OK"
            }
          ]
        });
      }
    });

    const validDetail =
      hasValidNumber &&
      hasValidAmount &&
      hasValidItems &&
      hasValidAttachments &&
      hasValidAmountByItem;
    this.setState({ validDetail });
  }

  validateAttachments() {
    const { debitNote, debitNoteConfiguration } = this.state;
    const isValid =
      has(debitNoteConfiguration, "attachmentConfiguration") &&
      debitNoteConfiguration.attachmentConfiguration.every(config => {
        const allAttachmentSize = [
          ...debitNote[`${config.attachmentType}Attachment`]
        ].length;

        return (
          allAttachmentSize <= config.maximumNumberOfFiles &&
          allAttachmentSize >= config.minimumNumberOfFiles
        );
      });

    return isValid;
  }

  getDebitNoteDetail = async linearId => {
    const { UserAuthority } = this.state;
    const { user } = this.props;
    const pathParams = { linearId: linearId };
    const { status, message, data } = await this.cordaService.callApi({
      group: "debit",
      action: "getDebitNote",
      pathParams: pathParams
    });

    if (status && data.rows.length > 0) {
      const debitNoteData = data.rows ? data.rows[0] : data;
      const debitConfiguration = await this.getDebitNoteConfiguration(
        debitNoteData
      );
      const debitNote = {
        ...debitNoteData,
        adjustmentTypeDisplay: parseDebitNoteAdjustmentType(
          debitNoteData.adjustmentType
        ),
        subTotal: has(debitNoteData, "subTotal")
          ? this.formatPriceNumber(debitNoteData.subTotal)
          : 0,
        vatTotal: has(debitNoteData, "vatTotal")
          ? this.formatPriceNumber(debitNoteData.vatTotal)
          : 0,
        total: has(debitNoteData, "total")
          ? this.formatPriceNumber(debitNoteData.total)
          : 0,
        totalPayable: has(debitNoteData, "totalPayable")
          ? this.formatPriceNumber(debitNoteData.totalPayable)
          : 0,
        dueDate: has(debitNoteData, "dueDate")
          ? moment(debitNoteData.dueDate).format("DD/MM/YYYY")
          : null,
        initialDueDate: has(debitNoteData, "initialDueDate")
          ? moment(debitNoteData.initialDueDate).format("DD/MM/YYYY")
          : null,
        debitNoteDate: has(debitNoteData, "debitNoteDate")
          ? moment(debitNoteData.debitNoteDate).format("DD/MM/YYYY")
          : null,
        lastEditedDate: has(debitNoteData, "lastEditedDate")
          ? moment(debitNoteData.lastEditedDate).format("DD/MM/YYYY")
          : null,
        receiptDate: has(debitNoteData, "receiptDate")
          ? moment(debitNoteData.receiptDate).format("DD/MM/YYYY")
          : null,
        ...debitConfiguration
      };

      MODEL_DEBIT_NOTE_INFO_EDIT_TWO.fields.forEach(field => {
        dateFieldsAllowEdit.forEach(id => {
          if (field.key == id) {
            switch (id) {
              case "debitNoteDate":
                field.canEdit = true;
                field.minDate = moment(
                  this.state.debitNoteConfiguration.minimumDocumentEffectiveDate
                );
                field.maxDate = moment(
                  this.state.debitNoteConfiguration.maximumDocumentEffectiveDate
                );
                break;
              case "dueDate":
                if (
                  ALLOW_REVISE_DUE_DATE_LIFECYCLE.includes(
                    debitNoteData.lifecycle
                  ) &&
                  UserAuthority.includes(DEBIT_AUTH.REVISE_DUE_DATE) &&
                  user.organisationUnit === "BUYER"
                ) {
                  field.canEdit = true;
                  field.minDate = moment(debitNoteData.dueDate);
                  field.maxDate = null;
                } else {
                  field.canEdit = false;
                }
                break;
            }
          }
        });
      });

      this.setState(
        {
          debitNote: debitNote,
          initialDebitNoteNumber: debitNoteData.externalId,
          debitNoteNumber: debitNoteData.externalId,
          debitNoteItems: debitNoteData.debitNoteItems
        },
        async () => {
          await this.setOptionsForFieldVendorBranch();
          await this.getReferenceInvoiceDetail(debitNoteData);
          this.handleToggleBlocking();
        }
      );
    } else {
      const errorMessagePattern = SYSTEM_FAILED.replace("%m", "get debit note");
      ModalMessage({
        title: "Error",
        message: `${errorMessagePattern} ${message}`,
        buttons: [
          {
            label: "OK",
            attribute: {
              onClick: e => this.routeCancel(e)
            }
          }
        ]
      });
    }
  };

  setOptionsForFieldVendorBranch = async () => {
    const { debitNote } = this.state;
    const {
      invoiceLinearId,
      vendorTaxNumber,
      vendorBranchCode,
      vendorBranchName,
      seller
    } = debitNote;
    const id = "0";
    const vendorBranchCodePurchaseOrder = [
      {
        branchCode: vendorBranchCode,
        name: vendorBranchName,
        id: id
      }
    ];

    let vendorBranchCodeId = id;
    let vendorBranchCodeIdOptions = [];
    let vendorBranchCodePurchaseOrderSelected = null;
    let vendorBranchCodeIdDisplay = `${vendorBranchCode}${
      vendorBranchName ? ` (${vendorBranchName})` : ""
    } (PO)`;

    // is invoice linearId empty
    switch (isEmpty(invoiceLinearId)) {
      case true:
        vendorBranchCodeIdOptions = [
          {
            value: vendorBranchCodeId,
            display: vendorBranchCodeIdDisplay
          }
        ];

        // Prepare vendor branch name and vendor address from po
        debitNote.vendorNamePO = vendorBranchName;
        debitNote.vendorAddressPO = get(debitNote, "vendorAddress", "");
        break;

      case false:
        const invoiceResponse = await this.getInvoice({
          linearId: invoiceLinearId
        });
        if (
          invoiceResponse.status &&
          has(invoiceResponse, "data.rows.0.purchaseOrderHeaderNumber")
        ) {
          const purchaseOrderHeaderNumbers = this.extractPurchaseOrderHeaderNumber(
            invoiceResponse.data.rows[0]["purchaseOrderHeaderNumber"]
          );

          // Query po
          const purchaseOrdersResponse = await this.getPurchaseOrders({
            purchaseOrderNumber: purchaseOrderHeaderNumbers[0]
          });

          if (purchaseOrdersResponse.status) {
            const purchaseOrdersData = purchaseOrdersResponse.data.rows;

            // Prepare options data for vendor branch from po
            vendorBranchCodeIdOptions = purchaseOrdersData.map(
              ({ vendorBranchCode, vendorBranchName }) => {
                return {
                  value: id,
                  display: `${vendorBranchCode}${
                    vendorBranchName ? ` (${vendorBranchName})` : ""
                  } (PO)`
                };
              }
            );

            // Prepare vendor branch name and vendor address from po
            debitNote.vendorNamePO = purchaseOrdersData[0].vendorBranchName;
            debitNote.vendorAddressPO = `
                ${purchaseOrdersData[0].vendorAddress1 || ""}
                ${purchaseOrdersData[0].vendorDistrict || ""}
                ${purchaseOrdersData[0].vendorCity || ""}
                ${purchaseOrdersData[0].vendorPostalCode || ""}
              `;

            // Compare old data with data from po and set vendorBranchCodeIdDisplay if data is compatible
            vendorBranchCodePurchaseOrderSelected = purchaseOrdersData.find(
              po =>
                po.vendorBranchCode === vendorBranchCode &&
                po.vendorBranchName === vendorBranchName
            );

            if (vendorBranchCodePurchaseOrderSelected) {
              vendorBranchCodeIdDisplay = `${
                vendorBranchCodePurchaseOrderSelected.vendorBranchCode
              }${
                vendorBranchCodePurchaseOrderSelected.vendorBranchName
                  ? ` (${vendorBranchCodePurchaseOrderSelected.vendorBranchName})`
                  : ""
              } (PO)`;
            }
          }
        }
        break;
    }

    // Query and check select vendor branch from Master
    const companyBranchResponse = await this.cordaService.callApi({
      group: "offledgers",
      action: "getCompanyBranch",
      requestParams: {
        taxId: vendorTaxNumber,
        legalName: seller.legalName
      }
    });

    if (companyBranchResponse.status) {
      // Prepare options data for vendor branch from master
      const vendorBranchCodeMasterOptions = companyBranchResponse.data.map(
        ({ id, branchCode, name }) => {
          return {
            value: `${id}`,
            display: `${branchCode}${name ? ` (${name})` : ""}`
          };
        }
      );

      if (!isEmpty(vendorBranchCodeMasterOptions)) {
        vendorBranchCodeIdOptions = vendorBranchCodeIdOptions.concat(
          vendorBranchCodeMasterOptions
        );
      }
      // Compare old data with data from master and set vendorBranchCodeIdDisplay if data is compatible
      const vendorBranchCodeMasterSelected = companyBranchResponse.data.find(
        companyBranch =>
          companyBranch.branchCode === vendorBranchCode &&
          companyBranch.name === vendorBranchName
      );

      if (
        !vendorBranchCodePurchaseOrderSelected &&
        vendorBranchCodeMasterSelected
      ) {
        vendorBranchCodeId = vendorBranchCodeMasterSelected.id;
        vendorBranchCodeIdDisplay = `${
          vendorBranchCodeMasterSelected.branchCode
        }${
          vendorBranchCodeMasterSelected.name
            ? ` (${vendorBranchCodeMasterSelected.name})`
            : ""
        }`;
      }
    } else {
      MODEL_VENDOR_INFO.fields.forEach(field => {
        if (field.key === "vendorBranchCodeId") {
          field.message = "Only Vendor Branch from PO is available.";
        }
      });
    }

    debitNote.vendorBranches = companyBranchResponse.data.concat(
      vendorBranchCodePurchaseOrder
    );

    debitNote.vendorBranchCodeId = vendorBranchCodeId;
    debitNote.vendorBranchCodeIdDisplay = vendorBranchCodeIdDisplay;
    debitNote.vendorBranchCodeIdOptions = vendorBranchCodeIdOptions;

    this.setState({
      debitNote
    });
  };

  extractPurchaseOrderHeaderNumber = purchaseOrderHeaderNumber => {
    const purchaseOrderHeaderNumbers = purchaseOrderHeaderNumber.split("|");

    return uniq(purchaseOrderHeaderNumbers);
  };

  setVendorAddress = async () => {
    const { debitNote } = this.state;

    // Set vendor address from po
    if (debitNote.vendorBranchCodeIdDisplay.includes("(PO)")) {
      debitNote.vendorBranchName = debitNote.vendorNamePO;
      debitNote.vendorAddress = debitNote.vendorAddressPO;

      this.setState({
        debitNote
      });

      return;
    }

    // Set vendor address from master
    const { vendorBranches, vendorBranchCode } = debitNote;
    const vendorBranchCodeSelected = vendorBranches.find(
      ({ branchCode }) => branchCode === vendorBranchCode
    );

    const vendorAddress = `
      ${
        vendorBranchCodeSelected && vendorBranchCodeSelected.address
          ? vendorBranchCodeSelected.address
          : ""
      }
      ${
        vendorBranchCodeSelected && vendorBranchCodeSelected.district
          ? vendorBranchCodeSelected.district
          : ""
      }
      ${
        vendorBranchCodeSelected && vendorBranchCodeSelected.city
          ? vendorBranchCodeSelected.city
          : ""
      }
      ${
        vendorBranchCodeSelected && vendorBranchCodeSelected.postalCode
          ? vendorBranchCodeSelected.postalCode
          : ""
      }
    `;

    debitNote.vendorBranchName =
      vendorBranchCodeSelected && vendorBranchCodeSelected.name
        ? vendorBranchCodeSelected.name
        : "";
    debitNote.vendorAddress = vendorAddress;

    this.setState({
      debitNote
    });
  };

  getInvoice = async params => {
    return await this.cordaService.callApi({
      group: "invoice",
      action: "getInvoice",
      pathParams: params
    });
  };

  getPurchaseOrders = async params => {
    return await this.cordaService.callApi({
      group: "purchaseOrder",
      action: "getPurchaseOrders",
      requestParams: params
    });
  };

  isValidAttachmentCondition = (attachment, attachmentType) => {
    let valid = false;

    switch (attachmentType) {
      case DEBIT_NOTE:
        valid = this.handleValidateAttachmentConditionForUpload(
          attachment,
          DEBIT_NOTE
        );
        break;
      case RECEIPT:
        valid = this.handleValidateAttachmentConditionForUpload(
          attachment,
          RECEIPT
        );
        break;
      case OTHERS:
        valid = this.handleValidateAttachmentConditionForUpload(
          attachment,
          OTHERS
        );
        break;
    }

    return valid;
  };

  handleValidateAttachmentConditionForUpload = (attachment, attachmentType) => {
    const attachmentConfiguration = this.state.debitNoteConfiguration.attachmentConfiguration.find(
      config => config.attachmentType === attachmentType
    );
    const attachmentFormats = this.state.debitNote[
      `${attachmentType}AttachmentFormat`
    ].split(",");
    const attachments = [
      ...this.state.debitNote[`${attachmentType}Attachment`]
    ];
    const ext = attachment.name.substring(
      attachment.name.lastIndexOf(".") + 1,
      attachment.name.length
    );
    let isAttachmentNotExceeded = false;
    let isValidAttachmentType = false;
    let isAttachmentSizeNotExceeded = false;

    if (attachments.length < attachmentConfiguration.maximumNumberOfFiles) {
      isAttachmentNotExceeded = true;
    }

    attachmentFormats.forEach(format => format.trim().toUpperCase());
    if (attachmentFormats.includes(ext.toUpperCase())) {
      isValidAttachmentType = true;
    }

    if (attachment.size <= 3000000) {
      isAttachmentSizeNotExceeded = true;
    }

    if (!isAttachmentSizeNotExceeded) {
      ModalMessage({
        title: "Validation Error",
        message: "File size is larger than 3mb."
      });
    }

    if (
      isAttachmentNotExceeded &&
      isValidAttachmentType &&
      isAttachmentSizeNotExceeded
    ) {
      window
        .jQuery(`#${attachmentType}Attachment-label-format`)
        .css("color", "black");
      window
        .jQuery(`#${attachmentType}Attachment-label-count`)
        .css("color", "black");

      return true;
    } else {
      window
        .jQuery(`#${attachmentType}Attachment-label-format`)
        .css("color", "red");
      window
        .jQuery(`#${attachmentType}Attachment-label-count`)
        .css("color", "red");

      return false;
    }
  };

  async getReferenceInvoiceDetail(debitNoteData) {
    const { invoiceLinearId } = debitNoteData;

    if (!isEmpty(invoiceLinearId)) {
      const { status, message, data } = await this.cordaService.callApi({
        group: "invoice",
        action: "getInvoice",
        pathParams: { linearId: invoiceLinearId }
      });

      const invoice = data.rows ? data.rows[0] : data;
      if (status && !isEmpty(invoice)) {
        const invoiceItemLinearIds = [];
        const adjustedAmounts = {};

        debitNoteData.debitNoteItems.forEach(item => {
          invoiceItemLinearIds.push(item.invoiceItemLinearId);
          adjustedAmounts[item.invoiceItemLinearId] = item.subTotal;
        });

        const invoiceItems = invoice.items.map((invoiceItem, index) => {
          invoiceItem.adjustedAmount = 0;

          if (invoiceItemLinearIds.includes(invoiceItem.linearId)) {
            invoiceItem.adjustedAmount = adjustedAmounts[invoiceItem.linearId];

            const selectedItems = this.state.selectedRows;

            selectedItems.push(invoiceItem);

            this.setState({
              selectedRows: selectedItems
            });
          }

          invoiceItem.selected = invoiceItemLinearIds.includes(
            invoiceItem.linearId
          );

          DEBIT_NOTE_ITEMS_EDIT.forEach(field => {
            if (field.type === "amount") {
              invoiceItem[`${field.selector}`] = this.formatPriceNumber(
                invoiceItem[`${field.selector}`]
              );
            }
          });
          invoiceItem.onChange = event => this.updateItems(index, event);
          invoiceItem.onBlur = event => this.updateItems(index, event);

          return invoiceItem;
        });

        this.setState(
          {
            referenceInvoice: invoice,
            referenceInvoiceItems: invoiceItems
          },
          () => this.validateFields()
        );
      } else {
        const errorMessagePattern = SYSTEM_FAILED.replace(
          "%m",
          "get invoice detail"
        );
        ModalMessage({
          title: "Error",
          message: `${errorMessagePattern} ${message}`
        });
      }
    }
  }

  updateItems(index, event) {
    let value =
      event.target.name === "adjustedAmount"
        ? toBigNumber(event.target.value).toNumber()
        : event.target.value;

    let fieldEdited =
      value <= this.formatPriceNumber(0) ? "field-invalid" : "field-edited";
    var invoiceItems = this.state.referenceInvoiceItems;
    if (event.target.name === "adjustedAmount") {
      invoiceItems[index].vatTotal =
        (invoiceItems[index].adjustedAmount * invoiceItems[index].vatRate) /
        100;
    }
    invoiceItems[index][event.target.name] = value;
    invoiceItems[index].className = fieldEdited;

    this.setState({ referenceInvoiceItems: invoiceItems }, () =>
      this.validateFields()
    );
    this.recalculateSubTotalAndVatTotal();
  }

  recalculateSubTotalAndVatTotal() {
    if (
      this.state.debitNote[`subTotal-edited`] ||
      this.state.debitNote[`vatTotal-edited`]
    ) {
      return;
    }

    let selectedItems = this.state.referenceInvoiceItems.filter(
      item => item.selected
    );
    let subTotal = this.formatPriceNumber(
      selectedItems.reduce((sum, item) => {
        return toBigNumber(sum)
          .plus(toBigNumber(item.adjustedAmount))
          .toNumber();
      }, 0)
    );
    let vatTotal = this.formatPriceNumber(
      selectedItems.reduce((sum, item) => {
        return toBigNumber(sum)
          .plus(
            toBigNumber(this.calculatedVat(item.adjustedAmount, item.vatRate))
          )
          .toNumber();
      }, 0)
    );

    this.setState(
      {
        debitNote: {
          ...this.state.debitNote,
          subTotal: subTotal,
          vatTotal: vatTotal
        }
      },
      () => this.setTotalAndVatTotal()
    );
  }

  calculatedVat = (amount, percentage) =>
    toBigNumber(amount)
      .multipliedBy(toBigNumber(percentage).dividedBy(100))
      .toFixed(2);

  prepareVendorInfoModel = () => {
    MODEL_VENDOR_INFO.fields.forEach(field => {
      if (fieldsAllowedToEdit.includes(field.key)) {
        if (has(field, "onChange")) {
          field.onChange = e => this.handleInputChange(e);
        }

        if (has(field, "onBlur")) {
          field.onBlur = e => this.handleInputChange(e);
        }
      }
    });
  };

  prepareDebitNoteInfoModel = () => {
    const { fieldMaxLengthAmount } = this.state;
    MODEL_DEBIT_NOTE_INFO_EDIT_TWO.fields.forEach(field => {
      if (fieldsAllowedToEdit.includes(field.key)) {
        if (has(field, "onChange")) {
          field.onChange = e => this.handleInputChange(e);
        }

        if (has(field, "onBlur")) {
          field.onBlur = e => this.handleInputChange(e);
        }
      }
      if (has(field, "maxLength")) {
        fieldMaxLengthAmount[field.key] = {
          title: field.title,
          decimal: field.format.decimal,
          maxLength: field.maxLength
        };
      }
    });
    this.setState({ fieldMaxLengthAmount });
  };

  prepareDebitNoteItemEdit = () => {
    const { fieldMaxLengthAmount } = this.state;
    DEBIT_NOTE_ITEMS_EDIT.forEach(field => {
      if (has(field, "maxLength")) {
        fieldMaxLengthAmount[field.selector] = {
          title: "Adjusted Amount",
          decimal: field.format.decimal,
          maxLength: field.maxLength
        };
      }
    });
    this.setState({ fieldMaxLengthAmount });
  };
  formatPriceNumber = amount =>
    Intl.NumberFormat("th-TH", {
      useGrouping: true,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(amount);

  handleInputChange = event => {
    const { debitNote } = this.state;
    let value = event.target.value;

    if (has(debitNote, event.target.name)) {
      if (
        (event.target.name === "subTotal" ||
          event.target.name === "vatTotal") &&
        toBigNumber(value).toNumber() ===
          toBigNumber(debitNote[event.target.name]).toNumber()
      ) {
        return;
      }

      if (
        event.target.name === "subTotal" ||
        event.target.name === "vatTotal"
      ) {
        value = toBigNumber(value).toNumber();
      }

      let fieldEdited = "field-edited";
      if (amountField.includes(event.target.name)) {
        value = this.formatPriceNumber(value);
        if (value <= this.formatPriceNumber(0)) fieldEdited = "field-invalid";
      }

      if (event.target.name === "vendorBranchCodeId") {
        const vendorBranchCodeSelected = debitNote.vendorBranches.find(
          ({ id }) => `${id}` === value
        );

        this.setState(
          {
            debitNote: {
              ...this.state.debitNote,
              vendorBranchCode: vendorBranchCodeSelected
                ? vendorBranchCodeSelected.branchCode
                : "",
              vendorBranchCodeId: value,
              vendorBranchCodeIdDisplay:
                event.target.options[event.target.selectedIndex].text,
              "vendorBranchCodeId-className": fieldEdited,
              "vendorBranchCodeId-edited": true,
              "vendorAddress-className": fieldEdited,
              "vendorAddress-edited": true
            }
          },
          () => this.setVendorAddress()
        );
      } else {
        this.setState(
          {
            debitNote: {
              ...this.state.debitNote,
              [event.target.name]: value,
              [`${event.target.name}-className`]: fieldEdited,
              [`${event.target.name}-edited`]: true
            }
          },
          () => this.setTotalAndVatTotal()
        );
      }

      if (event.target.name === "externalId") {
        this.checkDebitDuplication(event.target.value);
      }
    }
  };
  setTotalAndVatTotal = () => {
    let { debitNote } = this.state;

    debitNote.vatTotal = has(debitNote, "vatTotal")
      ? toBigNumber(debitNote.vatTotal).toNumber()
      : 0;
    debitNote.subTotal = has(debitNote, "subTotal")
      ? toBigNumber(debitNote.subTotal).toNumber()
      : 0;
    const total = toBigNumber(debitNote.vatTotal)
      .plus(debitNote.subTotal)
      .toNumber();

    debitNote.total = total;
    debitNote.totalPayable = total;
    this.setState({ debitNote: debitNote }, () => this.validateFields());
  };

  async checkDebitDuplication(value) {
    const body = {
      externalId: value,
      vendorTaxNumber: this.state.debitNote.vendorTaxNumber
    };

    const { status, message, data } = await this.cordaService.callApi({
      group: "debit",
      action: "checkUniquenessDebitNote",
      body: body
    });

    if (!status) {
      const errorMessagePattern = SYSTEM_FAILED.replace(
        "%m",
        "check uniqueness debit note"
      );
      ModalMessage({
        title: "Error",
        message: `${errorMessagePattern} ${message}`
      });
      return;
    }

    this.setState(
      {
        isDebitDuplicated:
          data || value === this.state.initialDebitNoteNumber ? false : true
      },
      () => this.validateFields()
    );
  }

  routeCancel = e => {
    Router.push(DEBIT_ROUTES.LIST);
  };

  handleTableUpdate(event) {
    var { referenceInvoiceItems } = this.state;
    let selectedRows = event.selectedRows;
    let selectedRowsLinearIds = selectedRows.map(row => row.linearId);
    referenceInvoiceItems.forEach(
      item => (item.selected = selectedRowsLinearIds.includes(item.linearId))
    );
    this.setState({ referenceInvoiceItems, selectedRows });
    this.recalculateSubTotalAndVatTotal();
  }

  onFilesAdded = event => {
    const fieldName = event.target.name;
    const attachment = event.target.files[0];
    let attachmentType = "";

    switch (true) {
      case fieldName.includes(DEBIT_NOTE):
        attachmentType = DEBIT_NOTE;
        break;
      case fieldName.includes(RECEIPT):
        attachmentType = RECEIPT;
        break;
      case fieldName.includes(OTHERS):
        attachmentType = OTHERS;
        break;
    }

    this.handleUploadAttachment(attachment, attachmentType);

    event.target.value = null;
  };

  handleUploadAttachment(attachment, attachmentType) {
    const isValidAttachmentCondition = this.isValidAttachmentCondition(
      attachment,
      attachmentType
    );

    if (isValidAttachmentCondition) {
      const data = new FormData();

      data.append("file", attachment);
      attachment.data = data;
      attachment.attachmentType = attachmentType;
      switch (attachmentType) {
        case DEBIT_NOTE:
          this.handleSetAttachmentForUpload(attachment, DEBIT_NOTE);
          break;
        case RECEIPT:
          this.handleSetAttachmentForUpload(attachment, RECEIPT);
          break;
        case OTHERS:
          this.handleSetAttachmentForUpload(attachment, OTHERS);
          break;
      }
    }
  }

  handleSetAttachmentForUpload = (attachment, attachmentType) => {
    const attachments = this.state.debitNote[`${attachmentType}Attachment`];

    attachments.push(attachment);

    this.setState(
      {
        [`${attachmentType}Attachment`]: attachments
      },
      () => {
        this.validateFields();
      }
    );
  };

  onFilesRemoved = (attactmentType, index) => {
    let newAttachedList = this.state.debitNote[attactmentType];
    newAttachedList.splice(index, 1);
    this.setState(
      {
        debitNote: {
          ...this.state.debitNote,
          [attactmentType]: newAttachedList
        }
      },
      () => this.validateFields()
    );
  };

  closeModal = () => {
    window.jQuery("#configWarning").modal("toggle");
  };

  submit = async () => {
    this.handleToggleBlocking();

    const newDebitNote = this.state.debitNote;
    const newDebitNoteItems = this.state.referenceInvoiceItems.filter(
      item => item.selected
    );

    newDebitNoteItems.forEach((item, index) => {
      item.debitNoteLinearId = newDebitNote.linearId;
      item.invoiceItemExternalId = item.externalId;
      item.invoiceItemLinearId = item.linearId;
      item.externalId = index + 1;
      item.adjustedAmount = toBigNumber(item.adjustedAmount).toNumber();
      item.itemSubTotal = toBigNumber(item.itemSubTotal).toNumber();
      item.subTotal = toBigNumber(item.adjustedAmount).toNumber();
      item.vatTotal = this.calculatedVat(item.adjustedAmount, item.vatRate);
    });

    GA.event({
      category: "Debit Note",
      action: "Edit DN (Request)",
      label: `Debit Note | ${newDebitNote.externalId} | ${moment().format()}`
    });

    let fileAttachments = await this.uploadAttachmentAndSubmitDebitNote();

    if (fileAttachments === null) return;

    for (let key in DEBIT_ATTACHMENT_TYPE) {
      const attachmentType = DEBIT_ATTACHMENT_TYPE[key];
      if (this.state.debitNote[`${attachmentType}Attachment`]) {
        fileAttachments = fileAttachments.concat(
          this.state.debitNote[`${attachmentType}Attachment`]
        );
      }
    }

    newDebitNote.subTotal = toBigNumber(newDebitNote.subTotal).toNumber();
    newDebitNote.vatTotal = toBigNumber(newDebitNote.vatTotal).toNumber();
    newDebitNote.total = toBigNumber(newDebitNote.total).toNumber();
    newDebitNote.totalPayable = toBigNumber(
      newDebitNote.totalPayable
    ).toNumber();
    newDebitNote.debitNoteItems = newDebitNoteItems;

    fileAttachments = fileAttachments.filter(
      item =>
        attachementTypeAllowUpdate.includes(item.attachmentType) &&
        item.attachmentHash
    );

    newDebitNote.fileAttachments = fileAttachments;

    const { status, message } = await this.cordaService.callApi({
      group: "debit",
      action: "editDebitNote",
      body: newDebitNote
    });

    if (!status) {
      ModalMessage({
        title: "Error",
        message: `${EDIT_ERROR_MESSAGE_PATTERN} ${message}`
      });

      this.handleToggleBlocking();

      GA.event({
        category: "Debit Note",
        action: "Edit DN (Failed)",
        label: `Debit Note | ${newDebitNote.externalId} | ${moment().format()}`
      });

      return;
    }

    GA.event({
      category: "Debit Note",
      action: "Edit DN (Success)",
      label: `Debit Note | ${newDebitNote.externalId} | ${moment().format()}`,
      value: newDebitNote.subTotal
    });

    this.handleToggleBlocking();
    this.routeCancel();
  };

  handleToggleBlocking = () => {
    this.setState({ blocking: !this.state.blocking });
  };

  uploadAttachmentAndSubmitDebitNote = async () => {
    const fileAttachments = [];
    let attachments = [];
    let uploadAttachmentError = false;

    for (let key in DEBIT_ATTACHMENT_TYPE) {
      const attachmentType = DEBIT_ATTACHMENT_TYPE[key];

      if (this.state.debitNote[`${attachmentType}Attachment`]) {
        attachments = attachments.concat(
          this.state.debitNote[`${attachmentType}Attachment`]
        );
      }
    }

    for (let i = 0; i < attachments.length; i++) {
      if (attachments[i].attachmentHash) {
        continue;
      }

      const { status, message, data } = await this.uploadAttachment(
        attachments[i].data
      );

      if (status) {
        const attachment = data;
        const attachmentHash = attachment.attachmentHash;

        fileAttachments.push({
          attachmentHash: attachmentHash,
          attachmentName: attachments[i].name,
          attachmentType: attachments[i].attachmentType
        });

        uploadAttachmentError = false;
      } else {
        uploadAttachmentError = true;

        this.handleToggleBlocking();
        ModalMessage({
          title: "Error",
          message: `${EDIT_ERROR_MESSAGE_PATTERN} ${message}`
        });
      }
    }

    if (!uploadAttachmentError) return fileAttachments;
    else return null;
  };

  uploadAttachment = async attachment =>
    await this.cordaService.callApi({
      group: "file",
      action: "handleFileUpload",
      body: attachment
    });

  toggleChangeRefInvoiceClicked = () =>
    window.jQuery("#confirmChangeInvoiceNo").modal("toggle");

  confirmChangeInvoiceRef = () => {
    window.jQuery("#confirmChangeInvoiceNo").modal("toggle");
    window.jQuery("#changeInvoiceNumber").modal("toggle");
  };

  cancelSelectInvoiceRef = () => {
    window.jQuery("#changeInvoiceNumber").modal("toggle");

    this.setState({
      isLoading: false,
      changeInvoiceOptions: [],
      clearSelectedRows: false
    });
  };

  confirmSelectInvoiceRef = () => {
    window.jQuery("#changeInvoiceNumber").modal("toggle");

    const debitNote = this.state.debitNote;

    debitNote.invoiceLinearId = this.state.newReferenceInvoice.linearId;
    debitNote.invoiceExternalId = this.state.newReferenceInvoice.externalId;
    debitNote.companyCode = this.state.newReferenceInvoice.companyCode;
    debitNote.companyName = this.state.newReferenceInvoice.companyName;
    debitNote.companyTaxNumber = this.state.newReferenceInvoice.companyTaxNumber;
    debitNote.companyBranchCode = this.state.newReferenceInvoice.companyBranchCode;
    debitNote.companyAddress = this.state.newReferenceInvoice.companyAddress;
    debitNote.companyTelephone = this.state.newReferenceInvoice.companyTelephone;

    this.setState(
      {
        debitNote: debitNote,
        referenceInvoice: this.state.newReferenceInvoice,
        referenceInvoiceItems: this.state.newReferenceInvoiceItems,
        selectedRows: [],
        clearSelectedRows: true
      },
      () => this.validateFields()
    );
  };

  handleSearchInvoice = async query => {
    if (query.trim() !== "") {
      const requestParams = {
        returnInvoiceItems: true,
        statuses: SEARCH_INVOICE_LIFECYCLE,
        invoiceNumber: query,
        vendorCode: this.state.debitNote.vendorNumber
      };

      this.setState({ isLoading: true });

      const invoiceResponse = await this.cordaService.callApi({
        group: "invoice",
        action: "getInvoices",
        requestParams: requestParams
      });

      const { status } = invoiceResponse;

      if (status) {
        const datas = invoiceResponse.data.rows
          ? invoiceResponse.data.rows
          : invoiceResponse.data;

        const index = findIndex(
          datas,
          data => data.externalId === this.state.referenceInvoice.externalId
        );

        if (index !== -1) {
          datas.splice(index, 1);
        }

        this.setState({
          isLoading: false,
          changeInvoiceOptions: datas
        });
      }
    }
  };

  handleInvoiceAutoCompleteChange = selectedInvoice => {
    if (selectedInvoice !== undefined) {
      this.setState(
        {
          invoiceInput: selectedInvoice.externalId
        },
        () => this.handleSelectInvoice(selectedInvoice)
      );
    }
  };

  handleSelectInvoice = selectedInvoice => {
    let invoiceItems = [];
    selectedInvoice.items.forEach((item, index) =>
      invoiceItems.push({
        ...item,
        itemSubTotal: this.formatPriceNumber(
          toBigNumber(item.itemSubTotal).toNumber()
        ),
        adjustedAmount: this.formatPriceNumber(0),
        onChange: event => this.updateItems(index, event),
        onBlur: event => this.updateItems(index, event)
      })
    );
    this.setState({
      newReferenceInvoice: selectedInvoice,
      newReferenceInvoiceItems: invoiceItems
    });
  };

  render() {
    const dnFoundStyle = { width: "auto", color: "#AF3694" };
    const dnNotFoundStyle = { width: "auto" };
    const { isDebitDuplicated } = this.state;

    return (
      <div>
        <Layout hideNavBar={true} ref={this.layout} {...this.props}>
          <BlockUi tag="div" blocking={this.state.blocking}>
            <div className="page__header col-12">
              <h2 className="text-center">Edit Mode</h2>
            </div>
            <div id="invoice_detail_edit_page" className="row cn_edit">
              <div id="editForm" name="editForm" className="form col-12">
                <div className="form-group form-inline col-12 mb-3">
                  <label className="control-label h3 font-bold">DN No.:</label>
                  <input
                    type="text"
                    name="externalId"
                    style={isDebitDuplicated ? dnNotFoundStyle : dnFoundStyle}
                    value={this.state.debitNote.externalId || ""}
                    maxLength="16"
                    onChange={event => this.handleInputChange(event)}
                    className="form-control"
                  />
                  <label
                    style={{
                      color: "red",
                      ["marginLeft"]: "10px"
                    }}
                    hidden={!isDebitDuplicated}
                  >
                    Debit note number is duplicated, please enter another
                    number.
                  </label>
                </div>
                <section className="box box--width-header col-12">
                  <div className="box__header">
                    <div className="row justify-content-between align-items-center mb-2">
                      <div className="col">
                        Entry Date :{" "}
                        <strong>
                          {moment(
                            this.state.debitNote.debitNoteCreatedDate
                          ).format("DD/MM/YYYY")}
                        </strong>
                      </div>
                      <div className="col text-right">
                        Status :{" "}
                        <strong
                          style={{
                            color: statusColor[this.state.debitNote.status],
                            marginRight: "15px"
                          }}
                        >
                          {this.state.debitNote.status}
                        </strong>
                      </div>
                    </div>
                    <SectionTwoHeaderInfo
                      id="vendor-company-info"
                      datas={this.state.debitNote}
                      modelOne={MODEL_VENDOR_INFO}
                      modelTwo={MODEL_COMPANY_INFO}
                    />
                    <SectionInfo
                      id="header-info"
                      datas={this.state.debitNote}
                      header="Debit Note Information"
                      modelOne={MODEL_DEBIT_NOTE_INFO_EDIT_ONE}
                      modelTwo={MODEL_DEBIT_NOTE_INFO_EDIT_TWO}
                    />
                    <SectionInfo
                      id="attachment-info"
                      datas={this.state.debitNote}
                      header="Attachments"
                      modelOne={MODEL_ATTACHMENT_INFO_ONE}
                      modelTwo={MODEL_ATTACHMENT_INFO_TWO}
                    />
                  </div>
                </section>
                <section>
                  <div>
                    {/* Item Section */}
                    <DocumentItemTableEdit
                      tableHeader={tableHeader({
                        externalId: this.state.referenceInvoice.externalId,
                        selectedRows: this.state.selectedRows.length,
                        onClicked: this.toggleChangeRefInvoiceClicked
                      })}
                      columns={DEBIT_NOTE_ITEMS_EDIT}
                      data={this.state.referenceInvoiceItems}
                      onTableUpdate={e => this.handleTableUpdate(e)}
                      selectableRows={true}
                      selectedRows={this.state.selectedRows}
                      clearSelectedRows={this.state.clearSelectedRows}
                      defaultSortField={"externalId"}
                    />
                    {/* Bottom */}
                    <SectionCancelAndNext
                      submitButton={true}
                      submitText="Resubmit"
                      handleClickSubmitButton={this.submit}
                      disabled={this.state.validDetail}
                      lang={lang}
                    />
                  </div>
                </section>
              </div>
            </div>
            <ModalWarning
              onClick={this.state.closeModal}
              label={this.state.warningHeader}
              message={this.state.validationErrorMessage}
            />
            <ConfirmChangeInvoiceNo
              number={this.state.referenceInvoice.externalId}
              onCancel={this.toggleChangeRefInvoiceClicked}
              onConfirmed={this.confirmChangeInvoiceRef}
            />
            <ChangeInvoiceNumber
              onCancel={this.cancelSelectInvoiceRef}
              onConfirmed={this.confirmSelectInvoiceRef}
              isLoading={this.state.isLoading}
              handleInvoiceAutoCompleteChange={
                this.handleInvoiceAutoCompleteChange
              }
              handleSearchInvoice={this.handleSearchInvoice}
              invoiceInput={this.state.invoiceInput}
              options={this.state.changeInvoiceOptions}
            />
            <CancelWarning onConfirmed={this.routeCancel} />
          </BlockUi>
        </Layout>
      </div>
    );
  }
}

export default withAuth(DebitNoteEdit);

const tableHeader = ({ externalId, selectedRows, onClicked }) => (
  <div className="col-12 row justify-content-between">
    <div className="col text-left table-title-component">
      <h5>
        {`Select Item: Invoice Ref. No. ${externalId} (${selectedRows} Items)`}
      </h5>
    </div>
    <div className="col text-right table-title-component">
      <button
        type="button"
        className="btn btn--transparent"
        onClick={onClicked}
      >
        Change Invoice Ref. No.
      </button>
    </div>
  </div>
);

const ConfirmChangeInvoiceNo = ({ number, onCancel, onConfirmed }) => (
  <div
    id="confirmChangeInvoiceNo"
    className="modal hide fade"
    tabIndex="-1"
    role="dialog"
    aria-labelledby="cancel"
    aria-hidden="true"
  >
    <div className="modal-dialog modal-sm" role="document">
      <div className="modal-content">
        <div className="modal-header d-flex justify-content-center">
          <h3 id="myModalLabel">Change Invoice Ref. No.</h3>
        </div>
        <div className="modal-body text-center">
          To change invoice Ref. No. the system has to remove all existing item
          from {number}
          <br />
          <br />
          Do you want to continue changing invoice Ref. No.?
        </div>
        <div className="modal-footer justify-content-center">
          <button
            type="button"
            name="btnCloseModal"
            id="btnCloseModal"
            className="btn btn-wide"
            data-dismiss="modal"
            aria-hidden="true"
            onClick={() => onCancel()}
          >
            No
          </button>
          <button
            type="button"
            name="btnCloseModal"
            id="btnCloseModal"
            className="btn btn--transparent btn-wide"
            data-dismiss="modal"
            aria-hidden="true"
            onClick={() => onConfirmed()}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  </div>
);

const ChangeInvoiceNumber = ({
  onCancel,
  onConfirmed,
  options,
  isLoading,
  handleInvoiceAutoCompleteChange,
  handleSearchInvoice,
  invoiceInput
}) => (
  <div
    id="changeInvoiceNumber"
    className="modal hide fade"
    tabIndex="-1"
    role="dialog"
    aria-labelledby="cancel"
    aria-hidden="true"
  >
    <div className="modal-dialog modal-sm" role="document">
      <div className="modal-content">
        <div className="modal-header d-flex justify-content-center">
          <h3 id="myModalLabel">Please Select New Invoice Ref.</h3>
        </div>
        <div className="modal-body text-center">
          <AutoCompleteField
            inputProps={{
              id: `invoiceNumber`,
              name: `invoiceNumber`,
              className: `input-search`,
              title: `Invoice No.`
            }}
            placeholder="Invoice No."
            labelKey="externalId"
            minLength={3}
            isLoading={isLoading}
            options={options}
            inputValue={invoiceInput}
            handleAutoCompleteChange={handleInvoiceAutoCompleteChange}
            handleSearch={handleSearchInvoice}
          />
        </div>
        <div className="modal-footer justify-content-center">
          <button
            type="button"
            name="btnCloseModal"
            id="btnCloseModal"
            className="btn btn-wide"
            data-dismiss="modal"
            aria-hidden="true"
            onClick={() => onCancel()}
          >
            Cancel
          </button>
          <button
            type="button"
            name="btnCloseModal"
            id="btnCloseModal"
            className="btn btn--transparent btn-wide"
            data-dismiss="modal"
            aria-hidden="true"
            onClick={() => onConfirmed()}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  </div>
);

const CancelWarning = ({ onConfirmed }) => (
  <div
    id="cancelWarning"
    className="modal hide fade"
    tabIndex="-1"
    role="dialog"
    aria-labelledby="cancel"
    aria-hidden="true"
  >
    <div className="modal-dialog modal-sm" role="document">
      <div className="modal-content">
        <div className="modal-header d-flex justify-content-center">
          <h3 id="myModalLabel">Cancel</h3>
        </div>
        <div className="modal-body text-center">
          Do you want to cancel editing this debit note?
        </div>
        <div className="modal-footer justify-content-center">
          <button
            type="button"
            name="btnCloseModal"
            id="btnCloseModal"
            className="btn btn-wide"
            data-dismiss="modal"
            aria-hidden="true"
          >
            No
          </button>
          <button
            type="button"
            name="btnCloseModal"
            id="btnCloseModal"
            className="btn btn--transparent btn-wide"
            data-dismiss="modal"
            aria-hidden="true"
            onClick={() => onConfirmed()}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  </div>
);
