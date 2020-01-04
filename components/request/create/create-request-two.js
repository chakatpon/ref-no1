import React, { Component } from "react";
import Router from "next/router";
import BlockUi from "react-block-ui";
import _ from "lodash";

import ModalMessage from "~/components/common/SweetAlert";
import ColumnList from "~/libs/column";
import { REQUEST_ROUTES } from "~/configs/routes.config";
import SectionCancelAndNext from "~/components/SectionCancelAndNext";
import ModalCancelWarning from "~/components/ModalCancelWarning";
import StepIndicator from "~/components/StepIndicator";
import DocumentItemTableEdit from "~/components/document-item-edit/DocumentItemTableEdit";
import RequestHelper from "~/components/request/helper";
import { REFERENCE_TYPE } from "~/components/request/config";
import { MODEL_REQUEST_ITEM_COLUMN } from "~/components/request/models/request-item-column";
import StandardService from "~/services/StandardService";
import {
  setConfigPermissionToArray,
  setValueDefault,
  isValueEmpty
} from "~/helpers/app";
import { CONFIG_NOT_FOUND } from "~/configs/errorMessage.config";
import { withTranslation } from "~/i18n";

const lang = "request-create";

class CreateRequestStepTwo extends Component {
  constructor(props) {
    super(props);
    this.standardService = new StandardService();
    this.columnList = new ColumnList();
    this.requestHelper = new RequestHelper();

    const { mainState = {} } = this.props;
    const { stepOneProp = {} } = mainState;
    this.state = {
      isLoading: true,
      isReadyToNext: false,
      blocking: true,
      selectedRows: [],
      clearSelectedRows: true,
      stepOneProp: {},
      requestItems: [],
      tax: [],
      dataRow: [],
      linearId: _.has(stepOneProp, "referenceLinearId")
        ? stepOneProp.referenceLinearId
        : "",
      requestPermissions: [],
      modelRequestItemColumn: MODEL_REQUEST_ITEM_COLUMN
    };
  }

  init = () => {
    this.setDisplayAndRequiredFieldForAllModel();
    this.setState({
      isLoading: false
    });
  };

  async componentWillMount() {
    this.getPermissionInput();

    let datas = [this.createDataRow()];
    const { mainState = {} } = this.props;
    const { purchaseOrder, invoice, others } = REFERENCE_TYPE;
    const { stepOneProp = {}, stepTwoProp = {} } = mainState;

    if (
      !_.isEmpty(stepTwoProp.requestItems) &&
      (_.has(stepOneProp, "referenceLinearId") &&
        _.has(stepTwoProp, "linearId") &&
        stepOneProp.referenceLinearId === stepTwoProp.linearId)
    ) {
      datas = stepTwoProp.requestItems;
    } else if (
      _.has(stepOneProp, "subTypeSelected") &&
      _.has(stepOneProp.subTypeSelected, "autoPopulatedItem") &&
      stepOneProp.subTypeSelected.autoPopulatedItem === true &&
      _.has(stepOneProp, "referenceDocumentSelected")
    ) {
      switch (stepOneProp.referenceType) {
        case purchaseOrder.value:
          if (
            _.has(stepOneProp.referenceDocumentSelected, "purchaseItems") &&
            !_.isEmpty(stepOneProp.referenceDocumentSelected.purchaseItems)
          ) {
            datas = stepOneProp.referenceDocumentSelected.purchaseItems;
          }
          break;
        case invoice.value:
          if (
            _.has(stepOneProp.referenceDocumentSelected, "items") &&
            !_.isEmpty(stepOneProp.referenceDocumentSelected.items)
          ) {
            datas = stepOneProp.referenceDocumentSelected.items;
          }
          break;
        default:
          break;
      }
    }

    this.setState({ tax: await this.getRequestConfigurationTaxCode() });
    this.setDataFormat(datas);
  }

  componentDidMount() {
    const { mainState } = this.props;

    this.setState({
      subVatItemChange: mainState.subVatItemChange
    });
  }

  getRequestConfigurationTaxCode = async () => {
    const { mainState } = this.props;
    let taxList = [];
    const { status, message, data } = await this.standardService.callApi({
      group: "Tax",
      action: "list",
      requestParams: {
        companyTaxId: mainState.stepOneProp.companyTaxNumber,
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

    return taxList;
  };

  setDataFormat(datas) {
    const { tax, requestPermissions } = this.state;
    const { mainState = {} } = this.props;
    const { stepOneProp = {} } = mainState;

    const permissions = _.has(requestPermissions, "ITEM")
      ? requestPermissions["ITEM"]
      : [];
    const dataRow = [];
    const requestItems = [];
    _.forEach(datas, (row, index) => {
      // Set value default
      row = setValueDefault(row, permissions);

      let vatCode = _.has(row, "vatCode")
        ? row.vatCode
        : _.has(row, "taxCode")
        ? row.taxCode
        : null;

      const taxSelect = _.find(tax, {
        value: vatCode
      });

      let vatRate = _.has(taxSelect, "percentage")
        ? taxSelect.percentage
        : vatCode === ""
        ? 0
        : null;

      vatCode =
        vatCode === undefined || vatCode === null ? tax[0]["value"] : vatCode;
      row.vatCode = vatCode;

      vatRate =
        vatRate === undefined || vatRate === null
          ? tax[0]["percentage"]
          : vatRate;
      row.vatRate = vatRate;

      row.vatCodeDisplay = _.has(taxSelect, "display")
        ? taxSelect.display
        : null;

      row.vatCodeOptions = tax;

      const request = this.requestHelper.SetFormatDataStepTwo(
        row,
        stepOneProp,
        index
      );

      const currency = _.has(request, "currency")
        ? request.currency !== undefined &&
          request.currency !== null &&
          request.currency !== ""
          ? request.currency.toUpperCase()
          : ""
        : undefined;

      row.currency = currency;
      row.number = index + 1;
      row.externalId = _.has(request, "externalId")
        ? request.externalId
        : index + 1;
      row.description = _.has(request, "description")
        ? request.description
        : undefined;
      row.quantity = _.has(request, "quantity.initial")
        ? request.quantity.initial
        : undefined;
      row.unitDescription = _.has(request, "unitDescription")
        ? request.unitDescription
        : undefined;
      row.unit = _.has(request, "unitDescription")
        ? request.unitDescription
        : undefined;
      row.unitPrice = _.has(request, "unitPrice")
        ? request.unitPrice
        : undefined;
      row.subTotal = _.has(request, "subTotal") ? request.subTotal : undefined;
      row.site = _.has(request, "site") ? request.site : undefined;
      row.onChange = event => this.updateItems(index, event);
      row.onBlur = event => this.updateItems(index, event);
      row.onClick = event => this.deleteItems(index);
      row.permission = permissions;

      dataRow.push(row);
      requestItems.push(request);
    });

    this.setState(
      {
        dataRow: _.orderBy(dataRow),
        requestItems: requestItems,
        blocking: false
      },
      () => this.resolveAllowToNext()
    );
  }

  getPermissionInput = () => {
    const { mainState } = this.props;
    const { stepOneProp = {} } = mainState;
    let permissions = [];

    if (!_.isEmpty(stepOneProp.requestConfigPermission)) {
      permissions = setConfigPermissionToArray(
        stepOneProp.requestConfigPermission
      );
    }
    this.setState({ requestPermissions: permissions }, () => {
      this.init();
    });
  };

  setDisplayAndRequiredFieldForAllModel = () => {
    const { requestPermissions, modelRequestItemColumn } = this.state;

    const permissions = _.has(requestPermissions, "ITEM")
      ? requestPermissions["ITEM"]
      : [];

    if (!_.isEmpty(permissions)) {
      modelRequestItemColumn.map(field => {
        if (_.has(permissions, `${field.selector}`)) {
          const { displayName, required } = permissions[field.selector];

          field.required = required;
          field.placeholder = displayName;
          field.name = displayName;
        }
        return field;
      });
    }
    this.setState({ modelRequestItemColumn });
  };

  resolveAllowToNext = () => {
    const { dataRow, requestPermissions } = this.state;

    if (!_.isEmpty(dataRow)) {
      const validationFail = [];
      const permissions = _.has(requestPermissions, "ITEM")
        ? requestPermissions["ITEM"]
        : [];
      _.forEach(dataRow, (value, key) => {
        const fail = this.checkPermissionError(value, permissions);
        if (!_.isEmpty(fail)) {
          validationFail.push(fail);
        }
      });
      if (!_.isEmpty(permissions) && _.isEmpty(validationFail)) {
        this.setState({
          isReadyToNext: true
        });
      } else {
        this.setState({
          isReadyToNext: false
        });
      }
    }
  };

  checkPermissionError = (value, permission) => {
    const validationFail = [];
    _.forEach(value, function(val, field) {
      if (
        _.has(permission, `${field}.required`) &&
        permission[field]["required"] === true
      ) {
        if (isValueEmpty(val)) {
          validationFail.push({ [field]: val });
        }
      }
    });

    return validationFail;
  };

  createDataRow() {
    let number = !_.isEmpty(this.state.dataRow)
      ? this.state.requestItems.length + 1
      : 1;

    return {
      number: number,
      externalId: number,
      description: undefined,
      quantity: undefined,
      unitDescription: undefined,
      unit: undefined,
      unitPrice: undefined,
      vatCodeOptions: this.state.tax,
      vatCode: undefined,
      subTotal: undefined,
      currency: undefined,
      site: undefined
    };
  }

  addItem() {
    const { dataRow } = this.state;
    let data = !_.isEmpty(dataRow) ? dataRow : [];
    data.push(this.createDataRow());

    // set format data
    this.setDataFormat(data);
  }

  deleteItems = index => {
    const { dataRow } = this.state;
    if (!_.isEmpty(dataRow)) {
      let data = _.remove(dataRow, function(e, i) {
        return i != index;
      });
      if (_.isEmpty(data)) {
        data = [this.createDataRow()];
      }
      // set format data
      this.setDataFormat(data);
      this.setState({ subVatItemChange: true });
    }
  };

  updateItems = (index, event) => {
    const { dataRow } = this.state;
    let fieldAmount = ["quantity", "unitPrice", "subTotal"];

    const dataState = _.update(
      dataRow,
      index + "." + event.target.name,
      function(n) {
        if (_.includes(fieldAmount, event.target.name)) {
          return event.target.number;
        } else {
          return event.target.value;
        }
      }
    );

    this.setState({ subVatItemChange: true }, () => {
      // set format data
      this.setDataFormat(dataState);
    });
  };

  handleClickNextButton = () => {
    this.props.updateState(this.state);
    this.props.nextStep();
  };

  handleClickBackButton = () => {
    this.props.updateState(this.state);
    this.props.previousStep();
  };

  routeCancel = () => {
    Router.push(REQUEST_ROUTES.LIST);
  };

  render() {
    const { blocking, modelRequestItemColumn, isLoading } = this.state;
    const { mainState, contentStep, t } = this.props;

    return (
      <BlockUi tag="div" blocking={blocking}>
        <div id="cn_create" className="step-2">
          <StepIndicator
            activeStep={mainState.currentStep}
            contentStep={contentStep}
            lang={lang}
          />
          <div className="col-12">
            <div className="page__header col-12">
              <h2>{t("Please Add Request Items")}</h2>
            </div>
            {/* Item Section */}
            {isLoading === false && (
              <DocumentItemTableEdit
                tableHeader={false}
                columns={modelRequestItemColumn}
                data={this.state.dataRow}
                selectedRows={this.state.selectedRows}
                clearSelectedRows={this.state.clearSelectedRows}
                footer={
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
                }
                lang={lang}
              />
            )}
          </div>
          <SectionCancelAndNext
            handleClickNextButton={this.handleClickNextButton}
            handleClickBackButton={this.handleClickBackButton}
            disabled={this.state.isReadyToNext}
            nextButton={true}
            backButton={true}
            lang={lang}
          />
        </div>
        <ModalCancelWarning
          onClick={this.routeCancel}
          message="Do you want to cancel this Request?"
        />
      </BlockUi>
    );
  }
}

export default withTranslation(["request-create"])(CreateRequestStepTwo);
