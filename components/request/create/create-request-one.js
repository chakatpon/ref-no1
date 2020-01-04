import React, { Component, Fragment } from "react";
import Router from "next/router";
import BlockUi from "react-block-ui";
import _ from "lodash";

import CordaService from "../../../services/CordaService";
import ColumnList from "../../../libs/column";
import StepIndicator from "../../StepIndicator";
import ColumnField from "../../ColumnField";
import LazyLoadDataTable from "../../DataTables/LazyLoadDataTable";
import HeaderWithAction from "../../HeaderWithAction";
import SectionTwoHeaderInfo from "../../SectionTwoHeaderInfo";
import ModalMessage from "../../common/SweetAlert";
import ModalCancelWarning from "../../ModalCancelWarning";
import SectionCancelAndNext from "../../SectionCancelAndNext";
import { MODEL_SELECT_REQUEST_REFERENCE } from "../models/select-request-reference-create";
import { PO_COLUMN } from "../models/po-column";
import { INV_COLUMN } from "../models/inv-column";
import {
  MODEL_VENDOR_INFO,
  MODEL_COMPANY_INFO
} from "../models/vendor-company-info-create-one";
import { REFERENCE_TYPE } from "../config";
import { REQUEST_ROUTES } from "../../../configs/routes.config";
import {
  SYSTEM_FAILED,
  WANT_ACTION,
  CONFIG_NOT_FOUND
} from "../../../configs/errorMessage.config";
import { withTranslation } from "~/i18n";

const CANCEL_CREATE_MESSAGE_PATTERN = `${WANT_ACTION} cancel this Request?`;
const MODEL_HEADER_WITH_ACTION = {
  fields: [
    {
      id: "reference_number",
      title: "",
      key: "referenceNumber",
      placeholder: "Reference Number",
      type: "text",
      canEdit: true,
      onChange: null
    }
  ],
  lang: "request-create"
};
const lang = "request-create";

class CreateRequestStepOne extends Component {
  constructor(props) {
    super(props);
    this.cordaService = new CordaService();
    this.columnList = new ColumnList();
    this.state = {
      blocking: false,
      menukey: "rq",
      dataTableUrl: "",
      columnList: [],
      model: [],
      readyForRenderTable: false,
      readyForRenderDocumentInfo: false,
      companies: [],
      vendors: [],
      companySelected: {},
      requestConfigByTaxId: [],
      requestConfigPermission: [],
      comNameOptions: [],
      typeOptions: [],
      subTypeOptions: [],
      referenceTypeOptions: [],
      vendorBranchCodeIdOptions: [],
      companyBranchCodeIdOptions: [],
      referenceDocumentSelected: null,
      referenceLinearId: null,
      referenceNumber: null,
      comName: null,
      type: null,
      subType: null,
      referenceType: null,
      subtypeDescription: null,
      isReadyToNext: false,
      configuration: {
        status: false,
        response: null
      },
      vendorNumberIsValid: null,
      formModels: []
    };
  }

  async componentDidMount() {
    this.handleToggleBlocking();
    this.prepareSelectRequestReferenceModel();
    this.prepareVendorCompanyModel();
    this.prepareForRenderTable();
    this.prepareForRenderReferenceNumberField();

    if (this.props.mainState.stepOneProp !== undefined) {
      this.setState(
        {
          ...this.props.mainState.stepOneProp,
          blocking: !this.props.mainState.stepOneProp.blocking
        },
        () => this.handleToggleBlocking()
      );
    } else {
      const companies = await this.getCompany();
      const vendors = await this.getVendor();

      if (companies.length === 0) return;

      const companyNameOptions = companies.map(({ taxId, name1 }) => {
        return {
          value: taxId,
          display: name1
        };
      });

      this.setState(
        {
          companies: companies,
          vendors: vendors,
          comNameOptions: companyNameOptions
        },
        () => this.handleToggleBlocking()
      );
    }
  }

  handleToggleBlocking = () => {
    this.setState({ blocking: !this.state.blocking });
  };

  prepareSelectRequestReferenceModel = () => {
    const { formModels } = this.state;
    MODEL_SELECT_REQUEST_REFERENCE.fields.forEach(field => {
      field.onChange = e => this.handleInputChange(e);
      formModels.push(field);
    });
    this.setState({ formModels });
  };

  prepareVendorCompanyModel = () => {
    const { formModels } = this.state;
    MODEL_VENDOR_INFO.fields.forEach(field => {
      if (field.key === "vendorNumber") {
        field.handleSearch = e => this.validateVendorCode(e);
        field.handleAutoCompleteChange = e =>
          this.handleVendorCodeAutoCompleteChange(e);
      } else {
        field.onChange = e => this.handleInputChange(e);
      }
      formModels.push(field);
    });

    MODEL_COMPANY_INFO.fields.forEach(field => {
      field.onChange = e => this.handleInputChange(e);
      formModels.push(field);
    });
    this.setState({ formModels });
  };

  prepareForRenderTable = async (modelColumn = null) => {
    const { t } = this.props;
    const model = modelColumn ? modelColumn : PO_COLUMN;
    const columns = this.columnList.initColumns(model);

    columns.map(async column => {
      column.searchKey = column.title;
      column.title = await t(column.title.replace(/[.]/g, ""));
    });

    console.log("columns", columns);

    this.setState({
      columnList: columns,
      model: model
    });
  };

  prepareForRenderReferenceNumberField = (requestPermissions = null) => {
    MODEL_HEADER_WITH_ACTION.fields.forEach(field => {
      if (requestPermissions) {
        const level = "HEADER";

        this.setDisplayAndRequiredField(requestPermissions, field, level);
      }

      field.onChange = e => this.handleInputChange(e);
    });
  };

  getVendor = async () => {
    const { status, message, data } = await this.cordaService.callApi({
      group: "offledgers",
      action: "getVendor"
    });

    if (!status) {
      const errorMessagePattern = SYSTEM_FAILED.replace("%m", "get vendor");

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

  getVendorFromState = vendorNumber => {
    const { vendors } = this.state;
    const results = [];

    if (!_.isEmpty(vendors)) {
      vendors.forEach(vendor => {
        if (vendor.code.includes(vendorNumber)) {
          results.push(vendor);
        }
      });
    }

    return results;
  };

  getCompany = async () => {
    const { status, message, data } = await this.cordaService.callApi({
      group: "offledgers",
      action: "getCompany"
    });

    if (!status) {
      const errorMessagePattern = SYSTEM_FAILED.replace("%m", "get company");

      ModalMessage({
        title: "Error",
        message: `${errorMessagePattern} ${message}`,
        buttons: [
          {
            label: "OK",
            attribute: {
              onClick: () => this.routeCancel()
            }
          }
        ]
      });

      return [];
    }

    return data;
  };

  getRequestConfigurationByTaxId = async () => {
    const requestParams = {
      companyTaxId: this.state.companyTaxNumber
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

  getRequestConfigurationBySubType = async () => {
    const { type, subType, companyTaxNumber } = this.state;
    const requestParams = {
      type: type,
      subtype: subType,
      companyTaxId: companyTaxNumber
    };

    const { status, message, data } = await this.cordaService.callApi({
      group: "offledgers",
      action: "getRequestConfigurationBySubtype",
      requestParams: requestParams
    });

    if (!status) {
      const errorMessagePattern = SYSTEM_FAILED.replace(
        "%m",
        "get request configuration by sub type"
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

  getRequestPermission = async () => {
    this.handleToggleBlocking();

    const { type, subType, companyTaxNumber } = this.state;
    const requestParams = {
      type: type,
      subtype: subType,
      companyTaxId: companyTaxNumber,
      action: "ISSUED"
    };

    const { status, message, data } = await this.cordaService.callApi({
      group: "offledgers",
      action: "getRequestPermission",
      requestParams: requestParams
    });

    this.handleToggleBlocking();

    if (!status) {
      const errorMessagePattern = SYSTEM_FAILED.replace(
        "%m",
        "get request permission"
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

  getConfiguration = async () => {
    const { companyTaxNumber, vendorTaxNumber } = this.state;
    const { legalName } = this.props.mainProps.user;
    const requestParams = {
      legalName: legalName,
      companyTaxId: companyTaxNumber,
      counterPartyTaxId: vendorTaxNumber
    };

    const { status, data, message } = await this.cordaService.callApi({
      group: "offledgers",
      action: "getConfigurationForRequest",
      requestParams: requestParams
    });

    if (
      status &&
      "attachmentConfiguration" in data &&
      data.attachmentConfiguration.length > 0
    ) {
      return {
        configuration: {
          status: status,
          response: data
        },
        buyer: this.props.mainProps.user
      };
    } else {
      const errorMessagePattern = SYSTEM_FAILED.replace(
        "%m",
        "get attachment configuration"
      );

      let errorMessageReason = message;

      if (
        status &&
        "attachmentConfiguration" in data &&
        data.attachmentConfiguration.length === 0
      ) {
        errorMessageReason = CONFIG_NOT_FOUND.replace("%m", "attachment");
      }

      ModalMessage({
        title: "Error",
        message: `${errorMessagePattern} ${errorMessageReason}`,
        buttons: [
          {
            label: "OK",
            attribute: {
              onClick: () => {}
            }
          }
        ]
      });
    }
  };

  getParty = legalName => {
    const party = {
      legalName: legalName,
      organisation: "",
      organisationUnit: ""
    };

    const splitLegalName = legalName.split(",");

    splitLegalName.forEach(item => {
      if (item.includes("O=")) {
        party.organisation = item.split("=")[1];
      } else if (item.includes("OU=")) {
        party.organisationUnit = item.split("=")[1];
      }
    });

    return party;
  };

  getPurchaseOrder = async linearId => {
    this.handleToggleBlocking();

    const pathParams = {
      linearId: linearId
    };

    const { status, data, message } = await this.cordaService.callApi({
      group: "purchaseOrder",
      action: "getPurchaseOrder",
      pathParams: pathParams
    });

    this.handleToggleBlocking();

    if (!status) {
      const errorMessagePattern = SYSTEM_FAILED.replace(
        "%m",
        "get purchase order"
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

    return data.rows ? data.rows[0] : data;
  };

  getInvoice = async linearId => {
    this.handleToggleBlocking();

    const pathParams = {
      linearId: linearId
    };

    const { status, data, message } = await this.cordaService.callApi({
      group: "invoice",
      action: "getInvoice",
      pathParams: pathParams
    });

    this.handleToggleBlocking();

    if (!status) {
      const errorMessagePattern = SYSTEM_FAILED.replace("%m", "get invoice");

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

    return data.rows ? data.rows[0] : data;
  };

  setOptionsForFieldType = async () => {
    const requestConfigByTaxId = await this.getRequestConfigurationByTaxId();
    const typeOptions = requestConfigByTaxId.map(
      ({ type, typeDisplayName }) => {
        return {
          value: type,
          display: typeDisplayName || type
        };
      }
    );

    this.setState({
      requestConfigByTaxId: requestConfigByTaxId,
      typeOptions: typeOptions
    });
  };

  setOptionsForFieldSubType = () => {
    const { requestConfigByTaxId, type } = this.state;
    const typeSelected = requestConfigByTaxId.find(
      config => config.type === type
    );
    const subTypeOptions = typeSelected.subType.map(
      ({ value, subtypeDisplayName }) => {
        return {
          value: value,
          display: subtypeDisplayName || value
        };
      }
    );

    this.setState({
      typeSelected: typeSelected,
      typeDisplay: typeSelected.typeDisplayName,
      subTypeOptions: subTypeOptions
    });
  };

  setOptionsForFieldReferenceType = async () => {
    const requestConfigBySubType = await this.getRequestConfigurationBySubType();
    const referenceTypeOptions = [];

    for (let key in requestConfigBySubType) {
      if (
        (key === "purchaseOrder" || key === "invoice" || key === "others") &&
        requestConfigBySubType[key]
      ) {
        referenceTypeOptions.push({
          value: REFERENCE_TYPE[key]["value"],
          display: REFERENCE_TYPE[key]["display"]
        });
      }
    }

    this.setState({
      requestConfigBySubType: requestConfigBySubType,
      referenceTypeOptions: referenceTypeOptions
    });
  };

  setOptionsForFieldVendorBranch = async ({ code, taxId, legalName }) => {
    const { purchaseOrder, invoice, others } = REFERENCE_TYPE;
    const { referenceType, referenceDocumentSelected } = this.state;
    const vendorBranchCodeIdOptions = [];
    const requestParams = {
      companyCode: code,
      taxId: taxId,
      legalName: legalName
    };
    const id = "0";

    const { status, data, message } = await this.cordaService.callApi({
      group: "offledgers",
      action: "getCompanyBranch",
      requestParams: requestParams
    });

    if (!status) {
      const errorMessagePattern = SYSTEM_FAILED.replace(
        "%m",
        "get vendor branch"
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

    let vendorBranchReferenceDocument = [];

    if (referenceType !== others.value) {
      const { vendorBranchCode, vendorBranchName } = referenceDocumentSelected;
      const vendorBranchCodeReferenceDocumentOptions = {
        value: id,
        display: `${vendorBranchCode}${
          vendorBranchName ? ` (${vendorBranchName})` : ""
        } (${
          referenceType === purchaseOrder.value
            ? purchaseOrder.display
            : invoice.display
        })`
      };

      vendorBranchReferenceDocument.push({
        branchCode: vendorBranchCode,
        name: vendorBranchName,
        id: id
      });

      vendorBranchCodeIdOptions.push(vendorBranchCodeReferenceDocumentOptions);
    }

    const vendorBranchCodeMasterOptions = data.map(
      ({ id, branchCode, name }) => {
        return {
          value: `${id}`,
          display: `${branchCode}${name ? ` (${name})` : ""}`
        };
      }
    );

    vendorBranchCodeIdOptions.push(...vendorBranchCodeMasterOptions);

    if (vendorBranchCodeIdOptions.length > 0) {
      this.setEnableFieldForVendorInfo("vendorBranchCodeId");
    }

    this.setState(
      {
        vendorBranchCode:
          referenceType === others.value
            ? ""
            : referenceDocumentSelected.vendorBranchCode,
        vendorBranchCodeId: referenceType === others.value ? "" : id,
        vendorBranchCodeIdDisplay:
          referenceType === others.value
            ? ""
            : `${referenceDocumentSelected.vendorBranchCode}${
                referenceDocumentSelected.vendorBranchName
                  ? ` (${referenceDocumentSelected.vendorBranchName})`
                  : ""
              } (${
                referenceType === purchaseOrder.value
                  ? purchaseOrder.display
                  : invoice.display
              })`,
        vendorBranches: data.concat(vendorBranchReferenceDocument),
        vendorBranchCodeIdOptions: vendorBranchCodeIdOptions
      },
      () => {
        this.setVendorAddress();
      }
    );
  };

  setOptionsForFieldCompanyBranch = async ({ code, taxId, legalName }) => {
    const { purchaseOrder, invoice, others } = REFERENCE_TYPE;
    const { referenceType, referenceDocumentSelected } = this.state;
    const companyBranchCodeIdOptions = [];
    const requestParams = {
      companyCode: code,
      taxId: taxId,
      legalName: legalName
    };
    const id = "0";

    const { status, data, message } = await this.cordaService.callApi({
      group: "offledgers",
      action: "getCompanyBranch",
      requestParams: requestParams
    });

    if (!status) {
      const errorMessagePattern = SYSTEM_FAILED.replace(
        "%m",
        "get company branch"
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

    let companyBranchReferenceDocument = [];

    if (referenceType !== others.value) {
      const {
        companyBranchCode,
        companyBranchName
      } = referenceDocumentSelected;
      const companyBranchCodeReferenceDocumentOptions = {
        value: id,
        display: `${companyBranchCode}${
          companyBranchName ? ` (${companyBranchName})` : ""
        } (${
          referenceType === purchaseOrder.value
            ? purchaseOrder.display
            : invoice.display
        })`
      };

      companyBranchReferenceDocument.push({
        branchCode: companyBranchCode,
        name: companyBranchName,
        id: id
      });

      companyBranchCodeIdOptions.push(
        companyBranchCodeReferenceDocumentOptions
      );
    }

    const companyBranchCodeMasterOptions = data.map(
      ({ id, branchCode, name }) => {
        return {
          value: `${id}`,
          display: `${branchCode}${name ? ` (${name})` : ""}`
        };
      }
    );

    companyBranchCodeIdOptions.push(...companyBranchCodeMasterOptions);

    if (companyBranchCodeIdOptions.length > 0) {
      this.setEnableFieldForCompanyInfo("companyBranchCodeId");
    }

    this.setState(
      {
        companyBranchCode:
          referenceType === others.value
            ? data[0]["branchCode"]
            : referenceDocumentSelected.companyBranchCode,
        companyBranchCodeId:
          referenceType === others.value ? data[0]["id"] : id,
        companyBranchCodeIdDisplay:
          referenceType === others.value
            ? `${data[0]["branchCode"]}${
                data[0]["name"] ? ` (${data[0]["name"]})` : ""
              }`
            : `${referenceDocumentSelected.companyBranchCode}${
                referenceDocumentSelected.companyBranchName
                  ? ` (${referenceDocumentSelected.companyBranchName})`
                  : ""
              } (${
                referenceType === purchaseOrder.value
                  ? purchaseOrder.display
                  : invoice.display
              })`,
        companyBranches: data.concat(companyBranchReferenceDocument),
        companyBranchCodeIdOptions: companyBranchCodeIdOptions
      },
      () => {
        this.setCompanyAddress();
      }
    );
  };

  setEnableFieldForColumnField = key => {
    MODEL_SELECT_REQUEST_REFERENCE.fields.find(
      field => field.key === key
    ).disabled = false;
  };

  setDisableFieldForColumnField = key => {
    MODEL_SELECT_REQUEST_REFERENCE.fields.find(
      field => field.key === key
    ).disabled = true;
  };

  setEnableFieldForVendorInfo = key => {
    MODEL_VENDOR_INFO.fields.find(field => field.key === key).disabled = false;
  };

  setDisableFieldForVendorInfo = key => {
    MODEL_VENDOR_INFO.fields.find(field => field.key === key).disabled = true;
  };

  setEnableFieldForCompanyInfo = key => {
    MODEL_COMPANY_INFO.fields.find(field => field.key === key).disabled = false;
  };

  setDisableFieldForCompanyInfo = key => {
    MODEL_COMPANY_INFO.fields.find(field => field.key === key).disabled = true;
  };

  setDisplayAndRequiredField = (requestPermissions, field, level) => {
    const permissionField = requestPermissions.find(
      permission => permission.field === field.key && permission.level === level
    );

    if (permissionField) {
      const { displayName, required, defaultValue } = permissionField;

      field.required = required;
      field.placeholder = displayName;
      field.title = displayName;
      field.defaultValue = defaultValue;
    }
  };

  setDisplayAndRequiredFieldForAllModel = async () => {
    const requestPermissions = await this.getRequestPermission();

    MODEL_VENDOR_INFO.fields.forEach(field => {
      const level = "HEADER";

      this.setDisplayAndRequiredField(requestPermissions, field, level);
    });

    MODEL_COMPANY_INFO.fields.forEach(field => {
      const level = "HEADER";

      this.setDisplayAndRequiredField(requestPermissions, field, level);
    });

    MODEL_SELECT_REQUEST_REFERENCE.fields.forEach(field => {
      const level = "HEADER";

      this.setDisplayAndRequiredField(requestPermissions, field, level);
    });

    this.prepareForRenderReferenceNumberField(requestPermissions);

    this.setValueDefaultByConfig(this.state, requestPermissions);
    this.setState({
      requestConfigPermission: requestPermissions
    });
  };

  setValueDefaultByConfig = (data, requestPermissions) => {
    const { formModels } = this.state;
    let dataState = {};
    formModels.forEach(model => {
      const permission = _.find(requestPermissions, {
        level: "HEADER",
        field: model.key
      });
      if (
        permission &&
        _.has(permission, "defaultValue") &&
        (!_.has(data, permission.field) ||
          _.isUndefined(data[permission.field]) ||
          _.isNaN(data[permission.field]) ||
          _.isNull(data[permission.field]))
      ) {
        dataState[permission.field] = permission.defaultValue;
      }
    });
    if (!_.isEmpty(dataState)) {
      this.setState({ ...data, ...dataState });
    }
  };

  setReadyForRenderTable = () => {
    const { purchaseOrder, invoice } = REFERENCE_TYPE;
    const { referenceType } = this.state;
    let readyForRenderTable = false;

    if (referenceType === purchaseOrder.value) {
      this.prepareForRenderTable(PO_COLUMN);

      readyForRenderTable = true;
    } else if (referenceType === invoice.value) {
      this.prepareForRenderTable(INV_COLUMN);

      readyForRenderTable = true;
    }

    this.setState({
      readyForRenderTable: readyForRenderTable
    });
  };

  setReadyForRenderDocumentInfo = () => {
    const { purchaseOrder, invoice, others } = REFERENCE_TYPE;
    const { referenceType, referenceDocumentSelected } = this.state;
    const { legalName } = this.props.mainProps.user;
    const readyForRenderDocumentInfo =
      (referenceDocumentSelected &&
        (referenceType === purchaseOrder.value ||
          referenceType === invoice.value)) ||
      referenceType === others.value;

    if (readyForRenderDocumentInfo && referenceType === others.value) {
      const { code, taxId, name1 } = this.state.companySelected;
      const company = {
        code: code,
        taxId: taxId,
        legalName: legalName
      };

      this.setEnableFieldForVendorInfo("vendorNumber");
      this.setDisableFieldForVendorInfo("vendorBranchCodeId");
      this.setOptionsForFieldCompanyBranch(company);
      this.setState({
        companyName: name1
      });
    } else if (
      readyForRenderDocumentInfo &&
      (referenceType === purchaseOrder.value || referenceType === invoice.value)
    ) {
      const {
        vendorNumber,
        companyCode,
        businessPlaceTaxNumber,
        companyTaxNumber
      } = referenceDocumentSelected;

      const vendor = this.getVendorFromState(vendorNumber)[0];
      const company = {
        code: companyCode,
        taxId:
          referenceType === purchaseOrder.value
            ? businessPlaceTaxNumber
            : companyTaxNumber,
        legalName: legalName
      };

      this.setOptionsForFieldVendorBranch(vendor);
      this.setOptionsForFieldCompanyBranch(company);
      this.setVendorAndCompanyInfoForReferenceDocumentSelected();
    }

    this.setState({
      readyForRenderDocumentInfo: readyForRenderDocumentInfo
    });
  };

  setVendorAddress = () => {
    const { purchaseOrder, invoice } = REFERENCE_TYPE;
    const {
      vendorBranches = [],
      vendorBranchCodeId,
      vendorBranchCodeIdDisplay,
      referenceType,
      referenceDocumentSelected
    } = this.state;
    const document =
      referenceType === purchaseOrder.value
        ? purchaseOrder.display
        : invoice.display;

    if (
      vendorBranchCodeIdDisplay &&
      vendorBranchCodeIdDisplay.includes(`(${document})`)
    ) {
      const {
        vendorAddress,
        vendorAddress1,
        vendorDistrict,
        vendorCity,
        vendorPostalCode
      } = referenceDocumentSelected;

      const vendorAddressReferenceDocument = `
        ${vendorAddress || vendorAddress1 || ""}
        ${vendorDistrict || ""}
        ${vendorCity || ""}
        ${vendorPostalCode || ""}
      `;

      this.setState({
        vendorBranchName: referenceDocumentSelected.vendorBranchName,
        vendorAddress: vendorAddressReferenceDocument
      });

      return;
    }

    const vendorBranchCodeSelected = vendorBranches.find(
      ({ id }) => `${id}` === vendorBranchCodeId
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

    this.setState({
      vendorBranchName:
        vendorBranchCodeSelected && vendorBranchCodeSelected.name
          ? vendorBranchCodeSelected.name
          : "",
      vendorAddress: vendorAddress
    });
  };

  setCompanyAddress = () => {
    const { purchaseOrder, invoice } = REFERENCE_TYPE;
    const {
      companyBranches = [],
      companyBranchCodeId,
      companyBranchCodeIdDisplay,
      referenceType,
      referenceDocumentSelected
    } = this.state;
    const document =
      referenceType === purchaseOrder.value
        ? purchaseOrder.display
        : invoice.display;

    if (
      companyBranchCodeIdDisplay &&
      companyBranchCodeIdDisplay.includes(`(${document})`)
    ) {
      const {
        companyAddress,
        businessPlaceAddress1,
        businessPlaceDistrict,
        businessPlaceCity,
        businessPlacePostalCode
      } = referenceDocumentSelected;

      const companyAddressReferenceDocument = `
        ${companyAddress || businessPlaceAddress1 || ""}
        ${businessPlaceDistrict || ""}
        ${businessPlaceCity || ""}
        ${businessPlacePostalCode || ""}
      `;

      this.setState({
        companyBranchName: referenceDocumentSelected.companyBranchName,
        companyAddress: companyAddressReferenceDocument
      });

      return;
    }

    const companyBranchCodeSelected = companyBranches.find(
      ({ id }) => `${id}` === companyBranchCodeId
    );

    const companyAddress = `
      ${
        companyBranchCodeSelected && companyBranchCodeSelected.address
          ? companyBranchCodeSelected.address
          : ""
      }
      ${
        companyBranchCodeSelected && companyBranchCodeSelected.district
          ? companyBranchCodeSelected.district
          : ""
      }
      ${
        companyBranchCodeSelected && companyBranchCodeSelected.city
          ? companyBranchCodeSelected.city
          : ""
      }
      ${
        companyBranchCodeSelected && companyBranchCodeSelected.postalCode
          ? companyBranchCodeSelected.postalCode
          : ""
      }
    `;

    this.setState({
      companyBranchName:
        companyBranchCodeSelected && companyBranchCodeSelected.name
          ? companyBranchCodeSelected.name
          : "",
      companyAddress: companyAddress
    });
  };

  setVendorAndCompanyInfoForReferenceDocumentSelected = () => {
    const { purchaseOrder } = REFERENCE_TYPE;
    const { referenceType, referenceDocumentSelected } = this.state;
    const {
      linearId,
      vendorNumber,
      vendorName,
      vendorTaxNumber,
      vendorBranchCode,
      vendorBranchName,
      vendorTelephone,
      vendorAddress,
      vendorAddress1,
      vendorDistrict,
      vendorCity,
      vendorPostalCode,
      companyCode,
      companyName,
      companyBranchCode,
      companyBranchName,
      currency,
      companyAddress,
      businessPlaceAddress1,
      businessPlaceDistrict,
      businessPlaceCity,
      businessPlacePostalCode
    } = referenceDocumentSelected;

    const vendorAddressReferenceDocument = `
        ${vendorAddress || vendorAddress1 || ""}
        ${vendorDistrict || ""}
        ${vendorCity || ""}
        ${vendorPostalCode || ""}
      `;
    const companyAddressReferenceDocument = `
        ${companyAddress || businessPlaceAddress1 || ""}
        ${businessPlaceDistrict || ""}
        ${businessPlaceCity || ""}
        ${businessPlacePostalCode || ""}
      `;

    this.setState(
      {
        referenceLinearId: linearId,
        referenceNumber:
          referenceType === purchaseOrder.value
            ? referenceDocumentSelected.purchaseOrderNumber
            : referenceDocumentSelected.externalId,
        vendorNumber: vendorNumber,
        vendorName: vendorName,
        vendorTaxNumber: vendorTaxNumber,
        vendorBranchCode: vendorBranchCode,
        vendorBranchName: vendorBranchName,
        vendorBranchCodeIdDisplay: `${vendorBranchCode}${
          vendorBranchName ? ` (${vendorBranchName})` : ""
        }`,
        vendorAddress: vendorAddressReferenceDocument,
        vendorTelephone: vendorTelephone,
        companyCode: companyCode,
        companyName: companyName,
        companyTaxNumber:
          referenceType === purchaseOrder.value
            ? referenceDocumentSelected.businessPlaceTaxNumber
            : referenceDocumentSelected.companyTaxNumber,
        companyBranchCode: companyBranchCode,
        companyBranchName: companyBranchName,
        companyBranchCodeIdDisplay: `${companyBranchCode}${
          companyBranchName ? ` (${companyBranchName})` : ""
        }`,
        companyAddress: companyAddressReferenceDocument,
        companyTelephone:
          referenceType === purchaseOrder.value
            ? referenceDocumentSelected.businessPlaceTelephone
            : referenceDocumentSelected.companyTelephone,
        currency: currency,
        buyer: referenceDocumentSelected.buyer,
        seller: referenceDocumentSelected.seller
      },
      () => {
        this.resolveAllowToNext();
      }
    );
  };

  validateVendorCode = vendorNumber => {
    this.setState({
      vendorNumberIsLoading: true
    });

    const vendor = this.getVendorFromState(vendorNumber);

    if (vendor.length > 0) {
      this.setState({
        vendorNumberOptions: vendor,
        vendorNumberIsValid: false,
        vendorNumberIsLoading: false
      });
    } else {
      this.setState({
        vendorNumberIsValid: false,
        vendorNumberIsLoading: false
      });
    }
  };

  handleVendorCodeAutoCompleteChange = vendorSelected => {
    if (vendorSelected !== undefined) {
      const { code, name, taxId, legalName } = vendorSelected;
      const seller = this.getParty(legalName);

      this.setOptionsForFieldVendorBranch(vendorSelected);

      this.setState(
        {
          vendorNumber: code,
          vendorName: name,
          vendorTaxNumber: taxId,
          vendorBranchCode: "",
          vendorNumberIsValid: true,
          seller: seller
        },
        () => {
          this.resolveAllowToNext();
        }
      );
    } else {
      this.setDisableFieldForVendorInfo("vendorBranchCodeId");

      this.setState(
        {
          vendorName: "",
          vendorTaxNumber: "",
          vendorBranchCode: "",
          vendorAddress: "-",
          vendorBranchCodeIdOptions: []
        },
        () => {
          this.resolveAllowToNext();
        }
      );
    }
  };

  handleReferenceDocumentSelected = async value => {
    const { purchaseOrder, invoice } = REFERENCE_TYPE;
    const { referenceType } = this.state;
    let referenceDocumentSelected = null;

    if (referenceType === purchaseOrder.value) {
      referenceDocumentSelected = await this.getPurchaseOrder(value);
    } else if (referenceType === invoice.value) {
      referenceDocumentSelected = await this.getInvoice(value);
    }

    this.setState(
      {
        referenceDocumentSelected: referenceDocumentSelected,
        readyForRenderTable: false
      },
      () => {
        this.setReadyForRenderDocumentInfo();
      }
    );
  };

  handleReferenceDocumentSelectedChange = () => {
    this.setState(
      {
        ...this.objectForResetState()
      },
      () => {
        this.setReadyForRenderTable();
        this.resolveAllowToNext();
      }
    );
  };

  objectForResetState = () => {
    return {
      companyName: null,
      companyBranchCode: null,
      companyAddress: null,
      companyTelephone: null,
      companyBranchCodeIdOptions: [],
      vendorNumber: null,
      vendorName: null,
      vendorTaxNumber: null,
      vendorBranchCode: null,
      vendorAddress: null,
      vendorTelephone: null,
      vendorBranchCodeIdOptions: [],
      documentNumber: null,
      referenceLinearId: null,
      referenceNumber: null,
      referenceDocumentSelected: null,
      readyForRenderTable: false,
      readyForRenderDocumentInfo: false,
      requestReason: null
    };
  };

  afterFieldCompanyChange = () => {
    this.setDisableFieldForColumnField("type");

    if (this.state.comName !== "") {
      this.setEnableFieldForColumnField("type");
    }

    this.setDisableFieldForColumnField("subType");
    this.setDisableFieldForColumnField("referenceType");
    this.setReadyForRenderTable();
    this.setReadyForRenderDocumentInfo();
    this.setOptionsForFieldType();
    this.resolveAllowToNext();
  };

  afterFieldTypeChnage = () => {
    this.setDisableFieldForColumnField("subType");

    if (this.state.type !== "") {
      this.setEnableFieldForColumnField("subType");
      this.setOptionsForFieldSubType();
    }

    this.setDisableFieldForColumnField("referenceType");
    this.setReadyForRenderTable();
    this.setReadyForRenderDocumentInfo();
    this.resolveAllowToNext();
  };

  afterFieldSubTypeChange = () => {
    this.setDisableFieldForColumnField("referenceType");

    if (this.state.subType !== "") {
      this.setDisplayAndRequiredFieldForAllModel();
      this.setEnableFieldForColumnField("referenceType");
      this.setOptionsForFieldReferenceType();
    }

    this.setReadyForRenderTable();
    this.setReadyForRenderDocumentInfo();
    this.resolveAllowToNext();
  };

  afterFieldReferenceTypeChange = () => {
    this.setReadyForRenderTable();
    this.setReadyForRenderDocumentInfo();
    this.resolveAllowToNext();
  };

  afterFieldVendorBranchCodeChange = () => {
    this.setVendorAddress();
    this.resolveAllowToNext();
  };

  afterFieldCompanyBranchCodeChange = () => {
    this.setCompanyAddress();
    this.resolveAllowToNext();
  };

  handleInputChange = event => {
    switch (event.target.name) {
      case "comName":
        const { companies } = this.state;
        const companySelected = companies.find(
          company => company.taxId === event.target.value
        );

        this.setState(
          {
            [event.target.name]: companySelected ? companySelected.taxId : "",
            [`${event.target.name}Display`]: companySelected
              ? companySelected.name1
              : "",
            companyTaxNumber: event.target.value,
            companySelected: companySelected ? companySelected : {},
            companyCode: companySelected ? companySelected.code : "",
            type: "",
            subType: "",
            referenceType: "",
            subtypeDescription: "",
            ...this.objectForResetState()
          },
          () => {
            this.afterFieldCompanyChange();
          }
        );
        break;
      case "type":
        this.setState(
          {
            [event.target.name]: event.target.value,
            subType: "",
            referenceType: "",
            subtypeDescription: "",
            ...this.objectForResetState()
          },
          () => {
            this.afterFieldTypeChnage();
          }
        );
        break;
      case "subType":
        const { typeSelected } = this.state;
        const subTypeSelected = typeSelected.subType.find(
          item => item.value === event.target.value
        );

        this.setState(
          {
            [event.target.name]: event.target.value,
            subTypeSelected: subTypeSelected ? subTypeSelected : {},
            subTypeDisplay: subTypeSelected
              ? subTypeSelected.subtypeDisplayName
              : "",
            subtypeDescription: subTypeSelected
              ? `Sub Type Description ${subTypeSelected.subtypeDescription}`
              : "",
            referenceType: "",
            ...this.objectForResetState()
          },
          () => {
            this.afterFieldSubTypeChange();
          }
        );
        break;
      case "referenceType":
        const { requestReason } = this.state;
        const { purchaseOrder, invoice, others } = REFERENCE_TYPE;
        const referenceTypeSelected =
          event.target.value === purchaseOrder.value
            ? purchaseOrder
            : event.target.value === invoice.value
            ? invoice
            : others;

        this.setState(
          {
            [event.target.name]: event.target.value,
            referenceTypeDisplay: referenceTypeSelected
              ? referenceTypeSelected.display
              : "",
            dataTableUrl:
              event.target.value === purchaseOrder.value
                ? this.cordaService.getUrl({
                    group: "purchaseOrder",
                    action: "getPurchaseOrders"
                  })
                : event.target.value === invoice.value
                ? this.cordaService.getUrl({
                    group: "invoice",
                    action: "getInvoices"
                  })
                : "",
            ...this.objectForResetState(),
            requestReason: requestReason
          },
          () => {
            this.afterFieldReferenceTypeChange();
          }
        );
        break;
      case "vendorBranchCodeId":
        const { vendorBranches } = this.state;
        const vendorBranchCodeSelected = vendorBranches.find(
          ({ id }) => `${id}` === event.target.value
        );

        this.setState(
          {
            [event.target.name]: event.target.value,
            vendorBranchCode: vendorBranchCodeSelected
              ? vendorBranchCodeSelected.branchCode
              : "",
            vendorBranchCodeIdDisplay:
              event.target.options[event.target.selectedIndex].text
          },
          () => {
            this.afterFieldVendorBranchCodeChange();
          }
        );
        break;
      case "companyBranchCodeId":
        this.setState(
          {
            [event.target.name]: event.target.value,
            companyBranchCode: event.target.value,
            companyBranchCodeIdDisplay:
              event.target.options[event.target.selectedIndex].text
          },
          () => {
            this.afterFieldCompanyBranchCodeChange();
          }
        );
        break;
      default:
        this.setState(
          {
            [event.target.name]: event.target.value
          },
          () => {
            this.resolveAllowToNext();
          }
        );
    }
  };

  checkFieldForAllowedClickNextButton = fields => {
    const { requestConfigPermission } = this.state;

    return fields.map(field => {
      const permissionField = requestConfigPermission.find(
        permission => permission.field === field
      );

      if (permissionField && permissionField.required) {
        if (!this.state[field]) {
          return false;
        }
      }
    });
  };

  resolveAllowToNext = async () => {
    const fieldList = ["requestReason", "referenceNumber"];
    const checkAllowedClickNextButton = this.checkFieldForAllowedClickNextButton(
      fieldList
    );
    const { vendorTaxNumber, vendorBranchCode, companyBranchCode } = this.state;

    if (vendorTaxNumber === undefined || vendorTaxNumber === null) {
      this.setState({
        isReadyToNext: false
      });

      return;
    }

    const { configuration, buyer } = await this.getConfiguration();

    if (configuration.status === false) {
      this.setState({
        isReadyToNext: false
      });

      return;
    }

    if (
      !checkAllowedClickNextButton.includes(false) &&
      vendorBranchCode &&
      companyBranchCode
    ) {
      this.setState({
        isReadyToNext: true,
        configuration: configuration,
        buyer: buyer
      });
    } else {
      this.setState({
        isReadyToNext: false,
        configuration: configuration,
        buyer: buyer
      });
    }
  };

  handleClickNextButton = () => {
    this.props.updateState(this.state);
    this.props.nextStep();
  };

  routeCancel = () => {
    Router.push(REQUEST_ROUTES.LIST);
  };

  render() {
    const {
      blocking,
      isReadyToNext,
      referenceType,
      referenceNumber,
      readyForRenderTable,
      readyForRenderDocumentInfo
    } = this.state;
    const { mainState, contentStep, t } = this.props;
    const { purchaseOrder, others } = REFERENCE_TYPE;

    return (
      <BlockUi tag="div" blocking={blocking}>
        <div id="cn_create" className="step-1">
          <StepIndicator
            activeStep={mainState.currentStep}
            contentStep={contentStep}
            lang={lang}
          />
          <div className="page__header col-12">
            <h2>{t("Please Select Reference No and Insert Details")}</h2>
          </div>
          <form
            id="cnCreateForm"
            name="cnCreateForm"
            method="post"
            encType="multipart/form-data"
            action=""
            className="form col-12 px-0"
          >
            <div className="box col-12 d-flex flex-wrap">
              <ColumnField
                id="detail-section"
                datas={this.state}
                model={MODEL_SELECT_REQUEST_REFERENCE}
                lang={lang}
              />
              <div className="col-9">
                {readyForRenderTable ? (
                  <LazyLoadDataTable
                    {...this.props}
                    {...this.state}
                    showSearchbox={true}
                    searchParams={{
                      page: 1,
                      pageSize: 10,
                      [referenceType === purchaseOrder.value
                        ? "businessPlaceTaxNumber"
                        : "companyTaxNumber"]: this.state.companyTaxNumber
                    }}
                    actionColumn={true}
                    actionType="radio"
                    actionField="action"
                    actionFieldUnique="linearId"
                    actionFieldValue="linearId"
                    actionEvent={this.handleReferenceDocumentSelected}
                    apiService={this.cordaService}
                    lang={lang}
                  />
                ) : null}
                {readyForRenderDocumentInfo ? (
                  <Fragment>
                    {referenceType === others.value ? (
                      <HeaderWithAction
                        title={`${t("Reference No")}.:`}
                        field={true}
                        datas={this.state}
                        model={MODEL_HEADER_WITH_ACTION}
                        lang={lang}
                      />
                    ) : (
                      <HeaderWithAction
                        title={`${t(
                          referenceType === purchaseOrder.value
                            ? "PO No"
                            : "Invoice No"
                        )}.: ${referenceNumber}`}
                        actionTitle={`< ${t(
                          `Change ${`${
                            referenceType === purchaseOrder.value
                              ? "PO"
                              : "Invoice"
                          } Ref No`}`
                        )}`}
                        onClick={() =>
                          this.handleReferenceDocumentSelectedChange()
                        }
                      />
                    )}
                    <SectionTwoHeaderInfo
                      id="vendorInfo"
                      datas={this.state}
                      collapse={false}
                      modelOne={MODEL_VENDOR_INFO}
                      modelTwo={MODEL_COMPANY_INFO}
                    />
                  </Fragment>
                ) : null}
              </div>
            </div>
            <SectionCancelAndNext
              handleClickNextButton={this.handleClickNextButton}
              disabled={isReadyToNext}
              nextButton={true}
              lang={lang}
            />
          </form>
          <ModalCancelWarning
            onClick={this.routeCancel}
            message={CANCEL_CREATE_MESSAGE_PATTERN}
          />
        </div>
      </BlockUi>
    );
  }
}

export default withTranslation(["request-create"])(CreateRequestStepOne);
