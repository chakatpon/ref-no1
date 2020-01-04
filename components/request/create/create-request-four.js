import React, { Component } from "react";
import Router from "next/router";
import BlockUi from "react-block-ui";
import moment from "moment";
import _ from "lodash";

import CordaService from "../../../services/CordaService";
import {
  toBigNumber,
  setConfigPermissionToArray,
  getKeyElementField
} from "~/helpers/app";
import ModalCancelWarning from "../../ModalCancelWarning";
import ModalMessage from "../../common/SweetAlert";
import StepIndicator from "../../StepIndicator";
import SectionInfo from "../../SectionInfo";
import SectionTwoHeaderInfo from "../../SectionTwoHeaderInfo";
import SectionItemsInfo from "../../SectionItemsInfo";
import SectionCancelAndNext from "../../SectionCancelAndNext";
import {
  MODEL_VENDOR_INFO,
  MODEL_COMPANY_INFO
} from "../models/vendor-company-info-create-four";
import {
  MODEL_REQUEST_INFO,
  MODEL_REFERENCE_INFO
} from "../models/request-reference-info-create";
import {
  MODEL_DOCUMENT_INFO_ONE,
  MODEL_DOCUMENT_INFO_TWO
} from "../models/document-info-create";
import { COLUMN_REQUEST_ITEMS } from "../models/request-items-column";
import { REQUEST_ROUTES } from "../../../configs/routes.config";
import { REQUEST_ATTACHMENT_TYPE } from "../../../configs/attachmentType.config";
import {
  CREATE_FAILED,
  WANT_ACTION
} from "../../../configs/errorMessage.config";
import GA from "~/libs/ga";
import { withTranslation } from "~/i18n";

const CREATE_ERROR_MESSAGE_PATTERN = CREATE_FAILED.replace("%m", "request");
const CANCEL_CREATE_MESSAGE_PATTERN = `${WANT_ACTION} cancel this Request?`;
const lang = "request-create";
class CreateRequestStepFour extends Component {
  constructor(props) {
    super(props);
    this.cordaService = new CordaService();
    this.state = {
      isLoading: true,
      blocking: false,
      entryDate: moment(),
      requestHeader: {},
      requestItems: {},
      requestAttachment: [],
      subTotal: 0,
      vatTotal: 0,
      isReadyToSubmit: false,
      requestPermissions: []
    };
  }
  init = () => {
    this.prepareVendorAndCompanyInfoModel();
    this.prepareRequestAndReferenceInfoModel();
    this.prepareDocumentInfoModel();
    this.prepareRequestItemModel();

    this.prepareRequestAttachment();
    this.prepareHeaderDataForSubmitRequest();
    this.prepareItemDataForSubmitRequest();

    this.setState({
      isLoading: false
    });
  };

  getPermissionInput = () => {
    const { mainState } = this.props;
    const { stepOneProp = {} } = mainState;
    let permission = [];

    if (!_.isEmpty(stepOneProp.requestConfigPermission)) {
      permission = setConfigPermissionToArray(
        stepOneProp.requestConfigPermission
      );
    }
    this.setState({ requestPermissions: permission }, () => {
      this.init();
    });
  };

  handleToggleBlocking = () => {
    this.setState({ blocking: !this.state.blocking });
  };

  componentWillMount() {
    this.getPermissionInput();
  }

  componentDidMount() {
    const { mainState } = this.props;

    if (mainState.stepFourProp !== undefined) {
      this.handleToggleBlocking();
      this.setState(
        {
          ...mainState.stepFourProp,
          subVatItemChange: mainState.subVatItemChange,
          blocking: !mainState.stepFourProp.blocking
        },
        () => {
          this.calculatedSubTotalAndVatTotal();
          this.handleToggleBlocking();
        }
      );
    } else {
      this.setState(
        {
          subVatItemChange: mainState.subVatItemChange
        },
        () => {
          this.calculatedSubTotalAndVatTotal();
        }
      );
    }

    this.resolveAllowToSubmit();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.subTotal !== this.state.subTotal ||
      prevState.vatTotal !== this.state.vatTotal
    ) {
      this.prepareHeaderDataForSubmitRequest();
      this.resolveAllowToSubmit();
    }
  }

  prepareVendorAndCompanyInfoModel = () => {
    const { stepOneProp } = this.props.mainState;
    const headerLevel = "HEADER";
    const formModels = [];

    MODEL_VENDOR_INFO.fields.forEach(field => {
      if (field.key === "vendorBranchCodeId") {
        field.condition = stepOneProp.vendorBranchCodeIdDisplay ? true : false;
        field.defaultValue = stepOneProp.vendorBranchCodeIdDisplay || "-";
      }

      this.setDisplayField(field, headerLevel);
      formModels.push(field);
    });

    MODEL_COMPANY_INFO.fields.forEach(field => {
      if (field.key === "companyBranchCodeId") {
        field.condition = stepOneProp.companyBranchCodeIdDisplay ? true : false;
        field.defaultValue = stepOneProp.companyBranchCodeIdDisplay || "-";
      }

      this.setDisplayField(field, headerLevel);
      formModels.push(field);
    });
  };

  prepareRequestAndReferenceInfoModel = () => {
    const headerLevel = "HEADER";

    MODEL_REQUEST_INFO.fields.forEach(field => {
      this.setDisplayField(field, headerLevel);
    });

    MODEL_REFERENCE_INFO.fields.forEach(field => {
      this.setDisplayField(field, headerLevel);
    });
  };

  prepareDocumentInfoModel = () => {
    const headerLevel = "HEADER";

    MODEL_DOCUMENT_INFO_ONE.fields.forEach(field => {
      this.setDisplayField(field, headerLevel);
    });

    MODEL_DOCUMENT_INFO_TWO.fields.forEach(field => {
      this.setDisplayField(field, headerLevel);

      if (field.key === "subTotal" || field.key === "vatTotal") {
        field.onBlur = e => this.handleInputChange(e);
      }
    });
  };
  prepareRequestItemModel = () => {
    const headerLevel = "ITEM";

    COLUMN_REQUEST_ITEMS.forEach(field => {
      this.setDisplayField(field, headerLevel);
    });
  };

  prepareRequestAttachment = () => {
    const { OTHERS } = REQUEST_ATTACHMENT_TYPE;
    const { stepThreeProp } = this.props.mainState;
    const requestAttachments = [];
    let attachments = [];

    for (let key in REQUEST_ATTACHMENT_TYPE) {
      const attachmentType = REQUEST_ATTACHMENT_TYPE[key];

      if (attachmentType === OTHERS) {
        attachments = attachments.concat(
          stepThreeProp[`${attachmentType}Attachments`]
        );
      }
    }

    for (let i = 0; i < attachments.length; i++) {
      requestAttachments.push({
        attachmentName: attachments[i].name,
        ...attachments[i]
      });
    }

    this.setState({
      requestAttachment: requestAttachments
    });
  };

  setDisplayField = (field, level) => {
    const { requestPermissions } = this.state;
    const permissions = _.has(requestPermissions, level)
      ? requestPermissions[level]
      : [];
    const keyElement = getKeyElementField(field);
    if (_.has(permissions, keyElement)) {
      const { required, editable, displayName } = permissions[keyElement];

      if (keyElement === "subTotal" || keyElement === "vatTotal") {
        field.required = required;
        field.canEdit = editable;
      } else {
        field.required = false;
      }

      field.placeholder = displayName;
      field.title = displayName;
      field.header = displayName;
    }
  };

  calculatedSubTotalAndVatTotal = () => {
    const { requestItems } = this.props.mainState.stepTwoProp;
    const { subVatItemChange } = this.state;

    if (!subVatItemChange) return;

    let subTotal = 0;
    let vatTotal = 0;

    requestItems.forEach(item => {
      subTotal = toBigNumber(subTotal)
        .plus(toBigNumber(item.subTotal))
        .toNumber();
      vatTotal = this.calculatedItemsVatTotal();
    });

    this.setState({
      subTotal: subTotal,
      vatTotal: vatTotal
    });
  };

  calculatedItemsVatTotal = () => {
    const { requestItems } = this.props.mainState.stepTwoProp;
    let vatTotal = 0;
    let vatSumMapping = {};

    requestItems.forEach(item => {
      if (_.has(vatSumMapping, item.vatRate)) {
        vatSumMapping[item.vatRate] = toBigNumber(vatSumMapping[item.vatRate])
          .plus(toBigNumber(item.subTotal))
          .toNumber();
      } else {
        vatSumMapping[item.vatRate] = toBigNumber(item.subTotal).toNumber();
      }
    });

    _.forOwn(vatSumMapping, (value, key) => {
      vatTotal = toBigNumber(vatTotal)
        .plus(toBigNumber(this.calculatedVat(value, key)))
        .toNumber();
    });

    return vatTotal;
  };

  calculatedVat = (amount, percentage) =>
    toBigNumber(amount)
      .multipliedBy(toBigNumber(percentage).dividedBy(100))
      .toFixed(2);

  prepareHeaderDataForSubmitRequest = () => {
    const { stepOneProp, stepTwoProp, stepThreeProp } = this.props.mainState;
    const { entryDate, requestAttachment } = this.state;
    const { requestItems } = stepTwoProp;

    const subTotal = toBigNumber(this.state.subTotal).toNumber();
    const vatTotal = toBigNumber(this.state.vatTotal).toNumber();
    const total = toBigNumber(subTotal)
      .plus(vatTotal)
      .toNumber();

    const requestHeader = {
      buyer: this.checkValue(stepOneProp.buyer),
      seller: this.checkValue(stepOneProp.seller),
      bank: this.checkValue(stepOneProp.bank),
      issuedDate: moment(entryDate).format("DD/MM/YYYY"),
      vendorNumber: this.checkValue(stepOneProp.vendorNumber),
      vendorBranchCode: this.checkValue(stepOneProp.vendorBranchCode),
      vendorBranchName: this.checkValue(stepOneProp.vendorBranchName),
      vendorName: this.checkValue(stepOneProp.vendorName),
      vendorTaxNumber: this.checkValue(stepOneProp.vendorTaxNumber),
      vendorAddress: this.checkValue(stepOneProp.vendorAddress),
      vendorTelephone: this.checkValue(stepOneProp.vendorTelephone),
      companyCode: this.checkValue(stepOneProp.companyCode),
      companyName: this.checkValue(stepOneProp.companyName),
      companyTaxNumber: this.checkValue(stepOneProp.companyTaxNumber),
      companyBranchCode: this.checkValue(stepOneProp.companyBranchCode),
      companyBranchName: this.checkValue(stepOneProp.companyBranchName),
      companyAddress: this.checkValue(stepOneProp.companyAddress),
      companyTelephone: this.checkValue(stepOneProp.companyTelephone),
      externalId: "",
      subTotal: subTotal,
      vatTotal: vatTotal,
      total: total,
      currency: this.checkValue(
        stepOneProp.currency,
        requestItems[0]["currency"]
      ),
      referenceField1: this.checkValue(stepThreeProp.referenceField1),
      referenceField2: this.checkValue(stepThreeProp.referenceField2),
      referenceField3: this.checkValue(stepThreeProp.referenceField3),
      referenceField4: this.checkValue(stepThreeProp.referenceField4),
      referenceField5: this.checkValue(stepThreeProp.referenceField5),
      type: this.checkValue(stepOneProp.type),
      typeDisplay: this.checkValue(stepOneProp.typeDisplay), // Have no in request model
      subType: this.checkValue(stepOneProp.subType),
      subTypeDisplay: this.checkValue(stepOneProp.subTypeDisplay), // Have no in request model
      referenceType: this.checkValue(stepOneProp.referenceType),
      referenceTypeDisplay: this.checkValue(stepOneProp.referenceTypeDisplay), // Have no in request model
      referenceNumber: this.checkValue(stepOneProp.referenceNumber),
      requestReason: this.checkValue(stepOneProp.requestReason),
      paymentDueDate: this.checkValue(stepThreeProp.paymentDueDate),
      requestAttachment: requestAttachment,
      status: "ISSUED"
    };

    if (requestHeader.referenceType !== "OTHERS") {
      requestHeader.referenceLinearId = this.checkValue(
        stepOneProp.referenceLinearId
      );
    }

    this.setState({
      requestHeader: requestHeader
    });
  };

  prepareItemDataForSubmitRequest = () => {
    const { requestItems } = this.props.mainState.stepTwoProp;

    this.setState({
      requestItems: requestItems
    });
  };

  checkValue = (value, defaultValue = null) => {
    return value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "-"
      ? value
      : defaultValue;
  };

  uploadAttachmentAndSubmitRequest = async (isSendToSeller = false) => {
    this.handleToggleBlocking();

    const requestAttachmentResults = [];
    let uploadAttachmentError = false;

    for (let i = 0; i < this.state.requestAttachment.length; i++) {
      const handleFileUploadResponse = await this.uploadAttachment(
        this.state.requestAttachment[i].data
      );
      const { status, message, data } = handleFileUploadResponse;

      if (status) {
        const requestAttachment = data;
        const requestAttachmentHash = requestAttachment.attachmentHash;

        requestAttachmentResults.push({
          attachmentHash: requestAttachmentHash,
          attachmentName: this.state.requestAttachment[i].attachmentName,
          attachmentType: this.state.requestAttachment[i].attachmentType
        });

        uploadAttachmentError = false;
      } else {
        uploadAttachmentError = true;

        this.handleToggleBlocking();

        ModalMessage({
          title: "Error",
          message: `${CREATE_ERROR_MESSAGE_PATTERN} ${message}`,
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
    }

    if (!uploadAttachmentError) {
      const body = this.state.requestHeader;

      body["requestAttachment"] = requestAttachmentResults;
      body["requestItems"] = this.state.requestItems;

      this.submitRequest(body, isSendToSeller);
    }
  };

  uploadAttachment = async attachment =>
    await this.cordaService.callApi({
      group: "file",
      action: "handleFileUpload",
      body: attachment
    });

  submitRequest = async (body, isSendToSeller) => {
    const requestParams = { isSendToSeller: isSendToSeller };
    const { status, message } = await this.cordaService.callApi({
      group: "request",
      action: "issueRequest",
      body: body,
      requestParams: requestParams
    });

    this.handleToggleBlocking();

    if (status) {
      GA.event({
        category: "Request",
        action: "Submit Request (Success)",
        label: `Request | ${body.externalId} | ${moment().format()}`,
        value: body.subTotal
      });

      this.routeToList();
    } else {
      ModalMessage({
        title: "Error",
        message: `${CREATE_ERROR_MESSAGE_PATTERN} ${message}`,
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
        action: "Submit Request (Failed)",
        label: `Request | ${body.externalId} | ${moment().format()}`
      });
    }
  };

  renderRowsTableForRequestItem = items => {
    if (!items || items.length <= 0) {
      return (
        <tr>
          <td colSpan="8" className="text-center">
            No Item Found
          </td>
        </tr>
      );
    }

    return _.map(items, (item, index) => {
      return (
        <tr key={item.externalId + index}>
          <td>{this.checkValue(item.externalId, "-")}</td>
          <td>{this.checkValue(item.description, "-")}</td>
          <td>
            {this.formatPriceNumber(
              this.checkValue(item.quantity.initial, "0")
            )}
          </td>
          <td>{this.checkValue(item.unitDescription, "-")}</td>
          <td>
            {this.formatPriceNumber(this.checkValue(item.unitPrice, "0"))}
          </td>
          <td>{this.formatPriceNumber(this.checkValue(item.subTotal, "0"))}</td>
          <td>{this.formatPriceNumber(this.checkValue(item.vatTotal, "0"))}</td>
          <td>{this.checkValue(item.currency, "-")}</td>
          <td>{this.checkValue(item.site, "-")}</td>
        </tr>
      );
    });
  };

  formatPriceNumber = amount =>
    Intl.NumberFormat("th-TH", {
      useGrouping: true,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(amount);

  handleInputChange = event => {
    if (event.target.name === "subTotal" || event.target.name === "vatTotal") {
      this.setState({
        [event.target.name]: event.target.value,
        subVatItemChange: false
      });
    } else {
      this.setState({
        [event.target.name]: event.target.value
      });
    }
  };

  handleClickSaveButton = () => {
    ModalMessage({
      title: "Save",
      message: `${WANT_ACTION} save Request?`,
      buttons: [
        {
          label: "No",
          attribute: {
            className: "btn btn--transparent btn-wide",
            onClick: () => {}
          }
        },
        {
          label: "Yes",
          attribute: {
            onClick: () => this.uploadAttachmentAndSubmitRequest()
          }
        }
      ]
    });
  };

  handleClickSendRequestButton = () => {
    ModalMessage({
      title: "Send Request",
      message: `${WANT_ACTION} send Request?`,
      buttons: [
        {
          label: "No",
          attribute: {
            className: "btn btn--transparent btn-wide",
            onClick: () => {}
          }
        },
        {
          label: "Yes",
          attribute: {
            onClick: () => this.uploadAttachmentAndSubmitRequest(true)
          }
        }
      ]
    });
  };

  handleClickBackButton = () => {
    this.props.updateState(this.state);
    this.props.previousStep();
  };

  resolveAllowToSubmit() {
    if (
      this.state.subTotal === "" ||
      this.state.vatTotal === "" ||
      this.state.subTotal == "0"
    ) {
      this.setState({
        isReadyToSubmit: false
      });
    } else {
      this.setState({
        isReadyToSubmit: true
      });
    }
  }

  routeToList = () => {
    Router.push(REQUEST_ROUTES.LIST);
  };

  render() {
    const {
      blocking,
      entryDate,
      requestHeader,
      requestItems,
      isReadyToSubmit
    } = this.state;
    const { mainState, contentStep, t } = this.props;

    console.log("MODEL_DOCUMENT_INFO_TWO", MODEL_DOCUMENT_INFO_TWO);

    return (
      <BlockUi tag="div" blocking={blocking}>
        <div id="cn_create" className="step-4">
          <StepIndicator
            activeStep={mainState.currentStep}
            contentStep={contentStep}
            lang={lang}
          />
          <form
            id="cnCreateForm"
            name="cnCreateForm"
            method="post"
            encType="multipart/form-data"
            action=""
            className="form col-12 px-0"
          >
            <section id="invoice_detail_page" className="box box--width-header">
              <div className="box__header">
                <div className="justify-content-between align-items-center">
                  <div className="col-4">
                    {" "}
                    {t("Entry Date")} :{" "}
                    <strong>{moment(entryDate).format("DD/MM/YYYY")}</strong>
                  </div>
                </div>
              </div>
              <div className="box__inner">
                <SectionTwoHeaderInfo
                  id="vendorInfo"
                  datas={requestHeader}
                  modelOne={MODEL_VENDOR_INFO}
                  modelTwo={MODEL_COMPANY_INFO}
                />
                <SectionTwoHeaderInfo
                  id="vendorInfo"
                  datas={requestHeader}
                  modelOne={MODEL_REQUEST_INFO}
                  modelTwo={MODEL_REFERENCE_INFO}
                />
                <SectionInfo
                  id="paymentInfo"
                  datas={requestHeader}
                  header="Document Information"
                  modelOne={MODEL_DOCUMENT_INFO_ONE}
                  modelTwo={MODEL_DOCUMENT_INFO_TWO}
                />
              </div>
            </section>
            <section
              id="invoice_detail_page_2"
              className="box box--width-header"
            >
              <SectionItemsInfo
                id="vat"
                model={COLUMN_REQUEST_ITEMS}
                datas={requestItems}
                renderRowsTable={this.renderRowsTableForRequestItem}
                header="Items Information"
                classTable="table-3"
                lang={lang}
              />
            </section>
            <SectionCancelAndNext
              handleClickBackButton={this.handleClickBackButton}
              handleClickSubmitButton={this.handleClickSendRequestButton}
              disabled={isReadyToSubmit}
              backButton={true}
              submitButton={true}
              submitText="Send Request"
              customButtons={[
                {
                  disabled: isReadyToSubmit,
                  className: "btn btn--transparent btn-wide",
                  text: "Save",
                  onClick: this.handleClickSaveButton
                }
              ]}
              lang={lang}
            />
          </form>
          <ModalCancelWarning
            onClick={this.routeToList}
            message={CANCEL_CREATE_MESSAGE_PATTERN}
          />
        </div>
      </BlockUi>
    );
  }
}

export default withTranslation(["request-create"])(CreateRequestStepFour);
