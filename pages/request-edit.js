import React, { Component } from "react";
import Router from "next/router";
import moment from "moment";
import _ from "lodash";

import withAuth from "../libs/withAuth";
import CordaService from "../services/CordaService";
import StandardService from "~/services/StandardService";
import Layout from "../components/Layout";
import BlockUi from "react-block-ui";
import TextAreaField from "../components/Fields/TextAreaField";
import SectionInfo from "../components/SectionInfo";
import SectionTwoHeaderInfo from "../components/SectionTwoHeaderInfo";
import SectionCancelAndNext from "../components/SectionCancelAndNext";
import DocumentItemTableEdit from "../components/document-item-edit/DocumentItemTableEdit";
import {
  REQUEST_HEADER_INFO,
  REQUEST_ITEM_INFO
} from "../components/request/models/request-info-edit";
import { REQUEST_ROUTES } from "../configs/routes.config";
import {
  toBigNumber,
  getKeyElementField,
  setValueDefault,
  isValueEmpty
} from "~/helpers/app";
import {
  SYSTEM_FAILED,
  EDIT_FAILED,
  CONFIG_NOT_FOUND
} from "../configs/errorMessage.config";
import ModalMessage from "~/components/common/SweetAlert";
import { REQUEST_ATTACHMENT_TYPE } from "../configs/attachmentType.config";
import { REFERENCE_TYPE } from "../components/request/config";
import statusColor from "../configs/color.rq.json";
import { withTranslation } from "~/i18n";
import GA from "~/libs/ga";

const amountField = ["subTotal", "vatTotal", "total", "withholdingTaxAmount"];
const filesField = ["requestAttachment", "documentAttachment"];
const lang = "request-edit";
class RequestEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      blocking: false,
      header: "",
      linearId: null,
      request: {},
      requestItems: [],
      headerInfoModel: REQUEST_HEADER_INFO,
      requestItemModel: REQUEST_ITEM_INFO,
      editedHeaderSubTotal: false,
      isDataValid: false,
      isDocumentNumberValid: false,
      itemAmountValid: false
    };
  }

  cordaService = new CordaService();
  standardService = new StandardService();
  layout = React.createRef();

  componentDidMount() {
    this.handleToggleBlocking();

    this.setState({
      linearId: this.props.url.query.linearId
    });

    this.getRequestDetails(this.props.url.query.linearId);
  }

  handleToggleBlocking = () => {
    this.setState({ blocking: !this.state.blocking });
  };

  //----- GET CONFIGURATIONS -------------------------------------------------
  getEditMode(lifecycle) {
    let header;
    switch (lifecycle) {
      case "PENDING_SELLER":
        header = "Response to Request";
        break;
      case "PENDING_BUYER":
        header = "Edit Mode";
        break;
      case "ISSUED":
        header = "Edit Mode";
        break;
      default:
        header = "";
    }
    this.setState({ header });
  }

  async getConfigurations(requestModel) {
    const { user } = this.props;
    this.getEditMode(requestModel.lifecycle);
    let attachmentConfig = await this.getRequestAttachmentConfigurations(
      requestModel
    );
    let options = await this.getRequestConfigurationFromSubtype(requestModel);

    let action = requestModel.lifecycle;
    if (requestModel.lifecycle === "PENDING_BUYER")
      action += requestModel.agreementFlag ? "_ACCEPT" : "_DECLINE";
    else if (requestModel.lifecycle === "PENDING_SELLER")
      action += requestModel.agreementFlag ? "_ACCEPT" : "_DECLINE";
    let permission = await this.getRequestPermissionFromSubtype(
      requestModel,
      action
    );
    let taxList =
      user.organisationUnit === "BUYER"
        ? await this.getTaxCodeConfiguration(requestModel)
        : [];
    if (!attachmentConfig || !options || !permission || !taxList) return;
    this.prepareRequestItems(
      requestModel.requestItems,
      taxList,
      permission.filter(p => p.level === "ITEM")
    );
    const resultRequest = this.setEditableField(permission);

    return { attachmentConfig, options, resultRequest };
  }

  setDisplayField = (field, permissions) => {
    const keyElement = getKeyElementField(field);
    const permission = _.find(permissions, {
      field: keyElement
    });
    if (permission) {
      const { displayName } = permission;

      field.placeholder = displayName;
      field.title = displayName;
      field.header = displayName;
      field.name = displayName;
    }
  };

  prepareRequestItems(requestItems, taxList, permission) {
    let { requestItemModel } = this.state;
    let requestItemEditable = permission.some(p => p.editable);

    if (
      !requestItemEditable &&
      requestItemModel &&
      requestItemModel.length > 0 &&
      requestItemModel[requestItemModel.length - 1]["selector"] === "delete"
    ) {
      requestItemModel.splice(-1, 1);
    }

    requestItemModel.forEach(field => {
      this.setDisplayField(field, permission);
    });

    requestItems.forEach((r, index) => {
      r = setValueDefault(r, permission);

      let quantityInitial =
        r.quantity && r.quantity.initial ? r.quantity.initial : 0.0;
      let quantityUnit = r.quantity && r.quantity.unit ? r.quantity.unit : "";

      if (
        r.quantityInitial !== undefined &&
        r.quantityInitial !== null &&
        r.quantityInitial !== ""
      ) {
        quantityInitial = r.quantityInitial;
      }

      if (
        r.quantityUnit !== undefined &&
        r.quantityUnit !== null &&
        r.quantityUnit !== ""
      ) {
        quantityUnit = r.quantityUnit;
      }

      permission.forEach(p => {
        r[`${p.field}Editable`] = p.editable;
        r[`${p.field}Required`] = p.required;
        r[`${requestItemEditable}`] = requestItemEditable;
      });

      if (_.isEmpty(taxList)) {
        r.vatCodeEditable = false;
      }

      r.vatCodeOptions = taxList;
      r.vatCodeDisplay = this.setVatCodeDisplay(taxList, r);
      r.quantityUnit = quantityUnit;
      r.quantityInitial = quantityInitial;
      r.onChange = event => this.updateItems(index, event);
      r.onBlur = event => this.updateItems(index, event);
      r.onClick = event => this.deleteItems(index, event);
    });

    this.setState(
      {
        requestItems: _.orderBy(requestItems),
        requestItemEditable,
        requestItemModel,
        blocking: false,
        permission
      },
      () => {
        this.recalculateHeaderSubtotal();
        this.validateFields();
      }
    );
  }

  async getTaxCodeConfiguration(requestModel) {
    let taxList = [];

    const { status, message, data } = await this.standardService.callApi({
      group: "Tax",
      action: "list",
      requestParams: {
        companyTaxId: requestModel.companyTaxNumber,
        taxType: "VAT"
      }
    });

    if (!status) {
      const errorMessagePattern = CONFIG_NOT_FOUND.replace("%m", "Vat code");
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
      return null;
    }
    if (_.has(data, "rows") && !_.isEmpty(data.rows)) {
      taxList = _.orderBy(
        data.rows.map(Item => {
          return {
            value: Item.pk.taxCode,
            percentage:
              Item.taxRate !== undefined &&
              Item.taxRate !== null &&
              Item.taxRate !== ""
                ? parseInt(Item.taxRate)
                : "",
            display: `${Item.pk.taxCode} ${
              Item.taxRate !== undefined &&
              Item.taxRate !== null &&
              Item.taxRate !== ""
                ? `(${parseInt(Item.taxRate)}%)`
                : ""
            }`
          };
        }),
        "percentage",
        "asc"
      );
    }

    this.setState({ taxList });
    return taxList;
  }

  async getRequestAttachmentConfigurations(requestModel) {
    const requestParams = {
      legalName: requestModel.buyer.legalName,
      companyTaxId: requestModel.companyTaxNumber,
      counterPartyTaxId: requestModel.vendorTaxNumber
    };
    const { status, message, data } = await this.cordaService.callApi({
      group: "offledgers",
      action: "getConfigurationForRequest",
      requestParams: requestParams
    });
    if (!status) {
      const errorMessagePattern = CONFIG_NOT_FOUND.replace("%m", "Attachment");
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
      return null;
    }
    this.setState({ attachmentConfigurations: data });
    return data;
  }

  async getRequestConfigurationFromSubtype(requestModel) {
    const requestParams = {
      party: requestModel.buyer.legalName,
      companyTaxId: requestModel.companyTaxNumber,
      type: requestModel.type,
      subtype: requestModel.subType
    };
    const { status, message, data } = await this.cordaService.callApi({
      group: "offledgers",
      action: "getRequestConfigurationBySubtype",
      requestParams: requestParams
    });
    if (!status) {
      const errorMessagePattern = CONFIG_NOT_FOUND.replace(
        "%m",
        "Document type"
      );
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
      return null;
    }
    let options = [];
    data.documentType.forEach(dt => {
      options.push({ ...dt, value: dt.documentType, display: dt.documentType });
    });
    this.setState({
      documentTypeConfigurations: data
    });
    return options;
  }

  async getRequestPermissionFromSubtype(requestModel, action) {
    const requestParams = {
      party: requestModel.buyer.legalName,
      companyTaxId: requestModel.companyTaxNumber,
      type: requestModel.type,
      subtype: requestModel.subType,
      action: action
    };
    const { status, message, data } = await this.cordaService.callApi({
      group: "offledgers",
      action: "getRequestPermission",
      requestParams: requestParams
    });
    if (!status) {
      const errorMessagePattern = CONFIG_NOT_FOUND.replace("%m", "Permission");
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
      return null;
    }
    this.setState({ permissionConfigurations: data });
    //this.setEditableField(data);
    return data;
  }

  setEditableField(fieldConfigs) {
    let { headerInfoModel, request } = this.state;
    for (var key in headerInfoModel) {
      headerInfoModel[key].fields.forEach(field => {
        let config = fieldConfigs.find(
          c => c.level === "HEADER" && c.field === field.key
        );
        if (config) {
          if (
            config.defaultValue &&
            config.editable &&
            (request[field.key] == undefined || request[field.key] == "")
          ) {
            request[field.key] = config.defaultValue;
          }
          field.disabled =
            amountField.includes(field.key) &&
            this.state.requestItems.length <= 0;
          field.title = config.displayName;
          field.required = config.required;
          field.canEdit = config.editable;
          field.onChange =
            config.editable && !amountField.includes(field.key)
              ? this.handleInputChange
              : null;
          field.onBlur =
            config.editable && amountField.includes(field.key)
              ? this.handleInputChange
              : null;
        }
        if (filesField.includes(field.key)) {
          field.onRemove = this.onFilesRemoved;
          field.onFileAdded = this.onFileAdded;
        }
      });
    }
    this.setState({ headerInfoModel });
    return request;
  }

  //----- GET REQUEST DETAILS -------------------------------------------------
  getRequestDetails = async linearId => {
    const pathParams = { linearId: linearId };
    const { status, message, data } = await this.cordaService.callApi({
      group: "request",
      action: "getRequestDetail",
      pathParams: pathParams
    });
    if (status) {
      if (data.rows.length == 0) {
        ModalMessage({
          title: "Error",
          message: "Request Not Found.",
          buttons: [
            {
              label: "OK",
              attribute: {
                onClick: e => this.routeCancel(e)
              }
            }
          ]
        });
        return;
      }

      const requestConfigByTaxId = await this.getRequestConfigurationByTaxId(
        data.rows[0].companyTaxNumber,
        data.rows[0].buyer.legalName
      );
      const { type, subType, referenceType } = data.rows[0];
      const typeSelected = requestConfigByTaxId.find(
        config => config.type === type
      );
      const { purchaseOrder, invoice, others } = REFERENCE_TYPE;
      const referenceTypeSelected =
        referenceType === purchaseOrder.value
          ? purchaseOrder
          : referenceType === invoice.value
          ? invoice
          : others;

      let subTypeSelected = [];

      if (typeSelected !== undefined && typeSelected !== null) {
        subTypeSelected = typeSelected.subType.find(
          item => item.value === subType
        );
      }

      let request = {
        ...data.rows[0],
        vendorBranchCodeDisplay: `${data.rows[0].vendorBranchCode} ${
          data.rows[0].vendorBranchName
            ? `(${data.rows[0].vendorBranchName})`
            : ""
        }`,
        companyBranchCodeDisplay: `${data.rows[0].companyBranchCode} ${
          data.rows[0].companyBranchName
            ? `(${data.rows[0].companyBranchName})`
            : ""
        }`,
        typeDisplay:
          typeSelected && typeSelected.typeDisplayName
            ? typeSelected.typeDisplayName
            : type,
        subTypeDisplay:
          subTypeSelected && subTypeSelected.subtypeDisplayName
            ? subTypeSelected.subtypeDisplayName
            : subType,
        referenceTypeDisplay: referenceTypeSelected.display,
        documentDate: data.rows[0].documentDate
          ? moment(data.rows[0].documentDate).format("DD/MM/YYYY")
          : data.rows[0].documentDate,
        paymentDueDate: data.rows[0].paymentDueDate
          ? moment(data.rows[0].paymentDueDate).format("DD/MM/YYYY")
          : data.rows[0].paymentDueDate,
        agreementFlag:
          data.rows[0].lifecycle === "PENDING_SELLER"
            ? data.rows[0].agreementFlag || data.rows[0].agreementFlag === false
              ? data.rows[0].agreementFlag
              : true
            : data.rows[0].agreementFlag
      };

      const configs = await this.getConfigurations(request);
      if (!configs) return;
      request = { ...request, ...configs.resultRequest };

      this.setState(
        {
          request: { ...request, configs, documentTypeOptions: configs.options }
        },
        () => {
          this.validateFields();
          this.setConfigAttachmentField();
        }
      );
    } else {
      const errorMessagePattern = SYSTEM_FAILED.replace("%m", "find request");
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

  setVatCodeDisplay = (taxList, item) => {
    const vatSelect = taxList.find(tax => tax.value === item.vatCode);

    return vatSelect !== undefined
      ? vatSelect.display
      : item.vatCode !== undefined &&
        item.vatCode !== null &&
        item.vatCode !== ""
      ? `${item.vatCode} ${
          item.vatRate !== undefined &&
          item.vatRate !== null &&
          item.vatRate !== ""
            ? `(${parseInt(item.vatRate)}%)`
            : ""
        }`
      : "-";
  };

  getRequestConfigurationByTaxId = async (companyTaxNumber, party) => {
    const requestParams = {
      companyTaxId: companyTaxNumber,
      party: party
    };

    const { status, message, data } = await this.cordaService.callApi({
      group: "offledgers",
      action: "getRequestConfigurationByTaxId",
      requestParams: requestParams
    });

    if (!status) {
      const errorMessagePattern = SYSTEM_FAILED.replace(
        "%m",
        "get request configuration by tax id"
      );

      ModalMessage({
        title: "Error",
        message: `${errorMessagePattern} ${message}`,
        buttons: [
          {
            label: "OK",
            attribute: {
              onClick: () => {}
            }
          }
        ]
      });

      return [];
    }

    return data;
  };

  setConfigAttachmentField = () => {
    const { request } = this.state;
    const { attachmentConfig } = request.configs;
    const attachmentConfiguration = attachmentConfig.attachmentConfiguration[0];

    filesField.forEach(field => {
      request[`${field}Format`] = attachmentConfiguration.fileType;
      request[`${field}RequiredTooltip`] =
        attachmentConfiguration.minimumNumberOfFiles ===
        attachmentConfiguration.maximumNumberOfFiles
          ? attachmentConfiguration.minimumNumberOfFiles
          : `${attachmentConfiguration.minimumNumberOfFiles} - ${attachmentConfiguration.maximumNumberOfFiles}`;

      this.setState({
        request
      });
    });
  };

  //----- SAVE AND SUBMIT ---------------------------------------------------
  prepareDataToSubmit = async () => {
    const { request, requestItems, overrideDocumentType } = this.state;
    let result = request;
    if (overrideDocumentType) {
      result.documentType = request.documentTypeOverride;
    }
    const allRequestAttachment = request.requestAttachment;
    const allDocumentAttachment = request.documentAttachment;
    const requestAttachmentNoHash = allRequestAttachment.filter(
      a => !a.attachmentHash
    );
    const requestAttachmentWithHash = allRequestAttachment.filter(
      a => a.attachmentHash
    );
    let uploadedRequestAttachment = await this.uploadAttachment(
      requestAttachmentNoHash
    );

    const documentAttachmentNoHash = allDocumentAttachment.filter(
      a => !a.attachmentHash
    );
    const documentAttachmentWithHash = allDocumentAttachment.filter(
      a => a.attachmentHash
    );
    let uploadedDocumentAttachment = await this.uploadAttachment(
      documentAttachmentNoHash
    );
    const requestAttachment = [
      ...requestAttachmentWithHash,
      ...uploadedRequestAttachment
    ];
    const documentAttachment = [
      ...documentAttachmentWithHash,
      ...uploadedDocumentAttachment
    ];

    requestItems.forEach(i => {
      i.quantity = {
        initial: toBigNumber(i.quantityInitial).toNumber(),
        consumed: 0,
        unit: i.quantityUnit,
        remaining: toBigNumber(i.quantityInitial).toNumber()
      };
      i.unitDescription = i.quantityUnit;
    });

    result.requestAttachment = requestAttachment;
    result.documentAttachment = documentAttachment;
    result.requestItems = requestItems;
    return result;
  };

  async uploadAttachment(attachments) {
    let result = [];
    for (let i = 0; i < attachments.length; i++) {
      const { status, message, data } = await this.cordaService.callApi({
        group: "file",
        action: "handleMultipleFileUpload",
        body: attachments[i].data
      });
      if (status) {
        result.push({
          ...data[0],
          attachmentType: attachments[i].attachmentType
        });
      }
    }
    return result;
  }

  submit = async send => {
    this.handleToggleBlocking();

    const body = await this.prepareDataToSubmit();
    const requestParams = { isAutoSendRequest: send };
    const { status, message, data } = await this.cordaService.callApi({
      group: "request",
      action: "editRequests",
      requestParams: requestParams,
      body: body
    });

    this.handleToggleBlocking();

    if (status) {
      GA.event({
        category: "Request",
        action: "Edit Request (Success)",
        label: `Request | ${body.externalId} | ${moment().format()}`,
        value: body.subTotal
      });

      this.routeCancel();
    } else {
      const errorMessagePattern = EDIT_FAILED.replace("%m", "request");
      ModalMessage({
        title: "Error",
        message: `${errorMessagePattern} ${message}`,
        buttons: [
          {
            label: "OK",
            attribute: {
              onClick: () => {}
            }
          }
        ]
      });

      GA.event({
        category: "Request",
        action: "Edit Request (Failed)",
        label: `Request | ${body.externalId} | ${moment().format()}`
      });
    }
  };

  //----- OTHER METHODS -----------------------------------------------------
  async validateFields() {
    const { request, requestItems, permissionConfigurations } = this.state;

    let requiredFieldsValid = true;
    const checkRequireDocumentNumber = this.state.permissionConfigurations.find(
      p => p.field == "documentNumber"
    );

    let isDocumentNumberValid = true;

    if (
      checkRequireDocumentNumber &&
      !checkRequireDocumentNumber.required &&
      (!request.documentNumber || request.documentNumber.trim() == "")
    ) {
      isDocumentNumberValid = true;

      this.setState({
        request: {
          ...this.state.request,
          [`documentNumber-invalid`]: false,
          [`documentNumber-message`]: "Document number already exists."
        }
      });
    } else if (request.documentNumber && request.documentNumber.trim() != "") {
      const body = {
        type: request.type,
        documentNumber: request.documentNumber.trim(),
        vendorTaxNumber: request.vendorTaxNumber
      };

      const checkUniquenessRequest = await this.cordaService.callApi({
        group: "request",
        action: "checkUniquenessRequest",
        body: body
      });

      isDocumentNumberValid = checkUniquenessRequest.data;

      this.setState({
        request: {
          ...this.state.request,
          [`documentNumber-invalid`]: !checkUniquenessRequest.data,
          [`documentNumber-message`]: "Document number already exists."
        }
      });
    }

    _.forEach(
      _.filter(permissionConfigurations, {
        level: "HEADER",
        required: true
      }),

      p => {
        let hasNoItem =
          amountField.includes(p.field) && !this.state.requestItems.length;

        requiredFieldsValid =
          (requiredFieldsValid && !isValueEmpty(request[p.field], true)) ||
          hasNoItem;
      }
    );

    const requiredItemRequest = this.validateItemRequest(
      permissionConfigurations,
      requestItems
    );

    // validate seller agreed remark
    if (_.has(request, "agreementFlag") && request.agreementFlag === false) {
      requiredFieldsValid =
        requiredFieldsValid && !isValueEmpty(request["agreedRemark"]);
    }

    let itemAmountValid = requestItems.some(
      i => toBigNumber(i.subTotal).toNumber() > 0
    );
    let headerTotal = request.total;
    let headerSubTotal = request.subTotal;
    let headerVatTotal = request.vatTotal;
    let headerTotalValid =
      toBigNumber(headerTotal).toNumber() ===
      toBigNumber(headerSubTotal)
        .plus(toBigNumber(headerVatTotal))
        .toNumber();

    let isDataValid =
      requiredFieldsValid &&
      requiredItemRequest &&
      headerTotalValid &&
      isDocumentNumberValid;

    this.setState({ isDataValid, itemAmountValid });
  }

  validateItemRequest = (permissionConfigurations, requestItems) => {
    let requiredFieldsValid = true;

    _.forEach(
      _.filter(permissionConfigurations, {
        level: "ITEM",
        required: true
      }),
      p => {
        if (!requiredFieldsValid) return;

        _.forEach(requestItems, item => {
          requiredFieldsValid =
            requiredFieldsValid &&
            this.checkValueFieldByPermission(item, p.field);
        });
      }
    );

    return requiredFieldsValid;
  };

  checkValueFieldByPermission = (item, permissionField) => {
    if (permissionField === "quantity") {
      return (
        _.has(item, "quantityInitial") &&
        !isValueEmpty(item.quantityInitial, true)
      );
    }

    if (permissionField === "unit") {
      return (
        _.has(item, "quantityUnit") && !isValueEmpty(item.quantityUnit, true)
      );
    }

    return (
      _.has(item, permissionField) && !isValueEmpty(item[permissionField], true)
    );
  };

  handleAgreementFlagChange = event => {
    const { request } = this.state;
    request.agreementFlag = event.target.value === "Y";
    this.setState({ request }, () => {
      this.validateFields();
    });
  };

  handleInputChange = async event => {
    let { headerInfoModel, documentTypeConfigurations } = this.state;
    let name = event.target.name;
    let value = event.target.value;
    let fieldEdited = "field-edited";
    var { overrideDocumentType } = this.state;

    if (name === "documentType") {
      const optionFieldName = "documentTypeOverride";
      let configFound = documentTypeConfigurations.documentType.find(
        t => t.documentType == value
      );
      if (configFound && configFound.textfield) {
        overrideDocumentType = true;
        let modelIndex =
          headerInfoModel.MODEL_DOCUMENT_INFO_LEFT.fields.findIndex(
            item => item.key === "documentType"
          ) + 1;
        let fieldAdded = headerInfoModel.MODEL_DOCUMENT_INFO_LEFT.fields.findIndex(
          item => item.key === optionFieldName
        );
        if (fieldAdded < 0) {
          headerInfoModel.MODEL_DOCUMENT_INFO_LEFT.fields.splice(
            modelIndex,
            0,
            {
              key: optionFieldName,
              type: "text",
              canEdit: true,
              onChange: this.handleInputChange,
              classInput: "col-7",
              message: "Please specify document type"
            }
          );
        }
      } else {
        overrideDocumentType = false;
        let fieldAdded = headerInfoModel.MODEL_DOCUMENT_INFO_LEFT.fields.findIndex(
          item => item.key === optionFieldName
        );
        if (fieldAdded >= 0)
          headerInfoModel.MODEL_DOCUMENT_INFO_LEFT.fields.splice(fieldAdded, 1);
      }
    }

    let total = name === "total" ? value : this.state.request.total;

    if (name === "subTotal" || name === "vatTotal") {
      value = toBigNumber(value).toNumber();
      total = this.recalculateHeaderTotal(name, value);
    }

    this.setState(
      {
        request: {
          ...this.state.request,
          [`${name}`]: value,
          [`${name}-className`]: fieldEdited,
          [`${name}-edited`]: true,
          total
        },
        overrideDocumentType,
        headerInfoModel
      },
      () => this.validateFields()
    );
  };

  recalculateHeaderTotal(name, value) {
    const { request } = this.state;
    this.setState({ editedHeaderSubTotal: true });
    if (name == "subTotal")
      return toBigNumber(request.vatTotal)
        .plus(toBigNumber(value))
        .toNumber();
    else if (name == "vatTotal")
      return toBigNumber(request.subTotal)
        .plus(toBigNumber(value))
        .toNumber();
  }

  addItem() {
    let { requestItems } = this.state;
    let data = !_.isEmpty(requestItems) ? requestItems : [];

    data.push(this.getDataDefault(data));

    this.prepareRequestItems(
      data,
      this.state.taxList,
      this.state.permissionConfigurations.filter(p => p.level === "ITEM")
    );
  }

  getDataDefault(data) {
    const highestExternalId = Math.max.apply(
      Math,
      data.map(o => +o.externalId)
    );
    let externalId = !_.isEmpty(data) ? `${+highestExternalId + 1}` : "1";
    let index = externalId - 1;
    return {
      externalId: externalId,
      description: undefined,
      quantityInitial: undefined,
      unitDescription: undefined,
      unitPrice: undefined,
      vatCodeOptions: this.state.taxList,
      vatCode: undefined,
      subTotal: undefined,
      currency: this.state.request.currency.toUpperCase(),
      onBlur: event => this.updateItems(index, event),
      onChange: event => this.updateItems(index, event),
      onClick: event => this.deleteItems(index, event)
    };
  }

  updateItems = (index, event) => {
    const { requestItems } = this.state;

    requestItems[index][event.target.name] = event.target.value;

    if (event.target.name === "currency") {
      requestItems[index][event.target.name] = event.target.value.toUpperCase();
    }

    if (
      (event.target.name === "subTotal" || event.target.name === "vatCode") &&
      !this.state.editedHeaderSubTotal
    ) {
      if (event.target.name === "subTotal") {
        requestItems[index].subTotal = toBigNumber(
          event.target.value
        ).toNumber();
      }

      if (event.target.name === "vatCode") {
        const vatCode = event.target.value;

        const taxSelect = _.find(this.state.taxList, {
          value: vatCode
        });

        const vatRate = _.has(taxSelect, "percentage")
          ? taxSelect.percentage
          : null;

        requestItems[index].vatRate = vatRate;
        requestItems[index].vatCodeDisplay = _.has(taxSelect, "display")
          ? taxSelect.display
          : null;
      }

      requestItems[index].vatTotal = toBigNumber(requestItems[index].subTotal)
        .multipliedBy(toBigNumber(requestItems[index].vatRate).dividedBy(100))
        .toNumber();

      requestItems[index].total = toBigNumber(requestItems[index].subTotal)
        .plus(toBigNumber(requestItems[index].vatTotal))
        .toNumber();

      this.recalculateHeaderSubtotal();
    }

    this.setState({ requestItems }, () => {
      this.validateFields();
    });
  };

  recalculateHeaderSubtotal = () => {
    const { request, requestItems } = this.state;
    let subTotal = requestItems.reduce((acc, curr) => {
      return toBigNumber(acc)
        .plus(toBigNumber(curr.subTotal))
        .toNumber();
    }, 0);
    let vatTotal = requestItems.reduce((acc, curr) => {
      return toBigNumber(acc)
        .plus(
          toBigNumber(curr.subTotal).multipliedBy(
            toBigNumber(curr.vatRate).dividedBy(100)
          )
        )
        .toNumber();
    }, 0);

    subTotal = toBigNumber(subTotal).toNumber();
    vatTotal = subTotal > 0 ? toBigNumber(vatTotal).toNumber() : 0;

    const total = toBigNumber(subTotal)
      .plus(toBigNumber(vatTotal))
      .toNumber();

    let withholdingTaxAmount =
      request && request.withholdingTaxAmount
        ? request.withholdingTaxAmount
        : 0;

    withholdingTaxAmount = subTotal > 0 ? withholdingTaxAmount : 0;

    this.setState({
      request: {
        ...this.state.request,
        subTotal,
        vatTotal,
        total,
        withholdingTaxAmount
      }
    });
  };

  deleteItems = async (index, externalId) => {
    if (!_.isEmpty(this.state.requestItems)) {
      let data = _.remove(this.state.requestItems, function(e, i) {
        return e.externalId != externalId;
      });
      if (_.isEmpty(data)) {
        data = [this.getDataDefault(data)];
      }
      this.prepareRequestItems(
        data,
        this.state.taxList,
        this.state.permissionConfigurations.filter(p => p.level === "ITEM")
      );
    }
  };

  routeCancel() {
    Router.push(REQUEST_ROUTES.LIST);
  }

  onFilesRemoved = (attactmentFieldName, index) => {
    let newAttachedList = this.state.request[attactmentFieldName];
    newAttachedList.splice(index, 1);
    this.setState(
      {
        request: {
          ...this.state.request,
          [attactmentFieldName]: newAttachedList
        }
      },
      () => this.validateFields()
    );
  };

  onFileAdded = event => {
    const attachmentFieldName = event.target.name;
    const attachment = event.target.files[0];

    this.handleUploadAttachment(attachment, attachmentFieldName);

    event.target.value = null;
  };

  handleUploadAttachment(attachment, attachmentFieldName) {
    const isValidAttachmentCondition = this.isValidAttachmentCondition(
      attachment,
      attachmentFieldName
    );

    if (isValidAttachmentCondition) {
      const data = new FormData();
      data.append("file", attachment);
      attachment.data = data;
      attachment.attachmentName = attachment.name;
      attachment.attachmentType = REQUEST_ATTACHMENT_TYPE.OTHERS;
      const attachments = this.state.request[attachmentFieldName];
      attachments.push(attachment);
      this.setState(
        {
          request: { ...this.state.request, [attachmentFieldName]: attachments }
        },
        () => this.validateFields()
      );
    }
  }

  isValidAttachmentCondition = (attachment, attachmentFieldName) => {
    let valid = false;
    const attachmentConfigurations = this.state.attachmentConfigurations
      .attachmentConfiguration[0];
    const ext = attachment.name.substring(
      attachment.name.lastIndexOf(".") + 1,
      attachment.name.length
    );

    let isAttachmentNotExceeded =
      this.state.request[attachmentFieldName].length <
      attachmentConfigurations.maximumNumberOfFiles;
    attachmentConfigurations.minimumNumberOfFiles;
    let isValidAttachmentType = attachmentConfigurations.fileType
      .split(",")
      .map(format => format.trim().toUpperCase())
      .includes(ext.trim().toUpperCase());
    let isAttachmentSizeNotExceeded = attachment.size <= 3000000;
    if (!isAttachmentSizeNotExceeded) {
      ModalMessage({
        title: "Validation Error",
        message: "File size is larger than 3 MB."
      });
    }

    const isAttachmentValid =
      isAttachmentNotExceeded &&
      isValidAttachmentType &&
      isAttachmentSizeNotExceeded;
    this.setState({ [`${attachmentFieldName}Valid`]: isAttachmentValid });

    return isAttachmentValid;
  };

  getSubmitTextButton = request => {
    const sendText = "Send Request";
    const confirmText = "Confirm Request";
    let text = "";

    switch (true) {
      case request.lifecycle === "ISSUED":
        text = sendText;
        break;
      case (request.lifecycle === "PENDING_BUYER" ||
        request.lifecycle === "PENDING_SELLER") &&
        request.agreementFlag === true:
        text = confirmText;
        break;
      case (request.lifecycle === "PENDING_BUYER" ||
        request.lifecycle === "PENDING_SELLER") &&
        request.agreementFlag === false:
        text = sendText;
        break;
    }

    return text;
  };

  handleClickBackButton = request => {
    Router.push(`${REQUEST_ROUTES.DETAIL}?linearId=${request.linearId}`);
  };

  //----- RENDER ------------------------------------------------------------
  render() {
    const { t } = this.props;
    let {
      blocking,
      header,
      headerInfoModel,
      request,
      requestItems,
      requestItemEditable,
      isDataValid,
      permission
    } = this.state;

    return (
      <div>
        <Layout hideNavBar={true} ref={this.layout} {...this.props}>
          <BlockUi tag="div" blocking={blocking}>
            <div className="page__header col-12">
              <h2 className="text-center">{t(header)}</h2>
            </div>
            <div id="invoice_detail_edit_page" className="row rq_edit">
              <div className="form-group form-inline col-12 mb-3">
                <label className="control-label h3 font-bold">
                  {`${t("Request No")}: ` + (request ? request.externalId : ``)}
                </label>
              </div>
              <section className="box box--width-header col-12">
                <div className="box__header">
                  <div className="row justify-content-between align-items-center mb-2">
                    <div className="col">
                      {t("Entry Date")} :{" "}
                      <strong>
                        {moment(request.issuedDate).format("DD/MM/YYYY")}
                      </strong>
                    </div>
                    <div className="col text-right">
                      {t("Status")} :{" "}
                      <strong
                        style={{
                          color: statusColor[request.status],
                          marginRight: "15px"
                        }}
                      >
                        {request.status}
                      </strong>
                    </div>
                  </div>
                  <SectionTwoHeaderInfo
                    id="vendor-company-info"
                    datas={request}
                    modelOne={headerInfoModel.MODEL_VENDOR_INFO}
                    modelTwo={headerInfoModel.MODEL_COMPANY_INFO}
                  />
                  <SectionTwoHeaderInfo
                    id="request-info"
                    datas={request}
                    modelOne={headerInfoModel.MODEL_REQUEST_INFO}
                    modelTwo={headerInfoModel.MODEL_REFERENCE}
                  />
                  {permission && _.get(request, "configs", false) && (
                    <SectionInfo
                      id="document-info"
                      datas={request}
                      header="Document Information"
                      modelOne={headerInfoModel.MODEL_DOCUMENT_INFO_LEFT}
                      modelTwo={headerInfoModel.MODEL_DOCUMENT_INFO_RIGHT}
                    />
                  )}
                  {permission && (
                    <DocumentItemTableEdit
                      tableHeader={
                        <h4
                          style={{ margin: "10px 0 15px -9px" }}
                          className="gray-1"
                        >
                          {t("Request Items")}
                        </h4>
                      }
                      columns={this.state.requestItemModel}
                      data={requestItems}
                      footer={
                        requestItemEditable && (
                          <div className="text-center footer-create-request">
                            <a
                              href="javasctip:void(0)"
                              className="purple center"
                              onClick={e => this.addItem(e)}
                            >
                              <i className="fa fa-plus-circle" />{" "}
                              <span>{t("Add Item")}</span>
                            </a>
                          </div>
                        )
                      }
                      lang={lang}
                    />
                  )}
                  {/*  */}
                  <ResponseSection
                    id="SellerResponse"
                    header="Seller Agreement"
                    hidden={request.lifecycle !== "PENDING_SELLER"}
                    componentLeft={sellerResponse(
                      request,
                      this.handleAgreementFlagChange,
                      this.handleInputChange,
                      this.props.t
                    )}
                    t={t}
                  />
                  <ResponseSection
                    id="BuyerResponse"
                    header="Remark"
                    hidden={request.lifecycle !== "PENDING_BUYER"}
                    componentLeft={
                      <TextAreaField
                        field={{
                          placeholder: "Add Remark",
                          key: "clarifiedRemark",
                          type: "textArea",
                          canEdit: true,
                          onChange: this.handleInputChange
                        }}
                        datas={request}
                        lang={lang}
                      />
                    }
                    t={t}
                  />
                  <SectionCancelAndNext
                    backButton
                    submitButton
                    submitText={this.getSubmitTextButton(request)}
                    handleClickSubmitButton={() => this.submit(true)}
                    handleClickBackButton={() =>
                      this.handleClickBackButton(request)
                    }
                    disabled={
                      isDataValid &&
                      this.state.itemAmountValid &&
                      this.state.request.subTotal > 0
                    }
                    customButtons={[
                      {
                        disabled: isDataValid,
                        className: "btn btn--transparent btn-wide",
                        text: "Save",
                        onClick: () => this.submit(false)
                      }
                    ]}
                    lang={lang}
                  />
                </div>
              </section>
            </div>
            <CancelWarning onConfirmed={this.routeCancel} />
          </BlockUi>
        </Layout>
      </div>
    );
  }
}

export default withAuth(withTranslation(["request-edit"])(RequestEdit));

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
          Do you want to cancel editing this request?
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

const ResponseSection = ({
  id,
  classColumnWidth = "w-100",
  hidden,
  header,
  componentLeft,
  componentRight,
  t
}) =>
  hidden ? null : (
    <div className="d-flex flex-wrap box">
      <a area-controls={id} className={`d-flex ${classColumnWidth} btnToggle`}>
        <div className="col-6">
          <h3 className="border-bottom gray-1">{t(header)}</h3>
        </div>
        <div className="col-6" />
      </a>
      <div
        id={id}
        className={`collapse multi-collapse ${classColumnWidth} show`}
      >
        <div className="card card-body noborder">
          <div className="row col-12">
            <div className="col-6">{componentLeft ? componentLeft : null}</div>
            <div className="col-6">
              {componentRight ? componentRight : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

const sellerResponse = (
  request,
  handleAgreementFlagChange,
  handleInputChange,
  t
) => [
  <div
    className="custom-control custom-radio"
    key="seller_accept"
    style={{ margin: "auto" }}
  >
    <input
      id="seller_accept"
      type="radio"
      value="Y"
      className="custom-control-input"
      checked={request.agreementFlag}
      onChange={handleAgreementFlagChange}
    />
    <label className="custom-control-label" htmlFor="seller_accept">
      {t("I have read all information and agree with this request")}
    </label>
  </div>,
  <div
    className="custom-control custom-radio"
    key="seller_decline"
    style={{ margin: "auto" }}
  >
    <input
      id="seller_decline"
      type="radio"
      value="N"
      className="custom-control-input"
      checked={!request.agreementFlag}
      onChange={handleAgreementFlagChange}
    />
    <label className="custom-control-label" htmlFor="seller_decline">
      {t("I disagree with this request")}
    </label>
  </div>,
  <TextAreaField
    key="agreedRemark"
    field={{
      placeholder: "Reason",
      key: "agreedRemark",
      type: "textArea",
      canEdit: true,
      disabled: request.agreementFlag,
      onChange: handleInputChange
    }}
    datas={request}
  />
];
