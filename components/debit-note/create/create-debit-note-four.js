import React, { Component } from "react";
import Router from "next/router";
import BlockUi from "react-block-ui";
import moment from "moment";
import _ from "lodash";

import CordaService from "../../../services/CordaService";
import StepIndicator from "../../StepIndicator";
import ModalCancelWarning from "../../ModalCancelWarning";
import ModalMessage from "../../common/SweetAlert";
import SectionCancelAndNext from "../../SectionCancelAndNext";
import SectionInfo from "../../SectionInfo";
import SectionTwoHeaderInfo from "../../SectionTwoHeaderInfo";
import SectionItemsInfo from "../../SectionItemsInfo";
import { DEBIT_ROUTES } from "../../../configs/routes.config";
import { DEBIT_ATTACHMENT_TYPE } from "../../../configs/attachmentType.config";
import { toBigNumber } from "~/helpers/app";
import { checkValidAmount } from "~/helpers/validate";
import {
  CREATE_FAILED,
  WANT_ACTION,
  AMOUNT_OVER_MAX_LENGTH
} from "../../../configs/errorMessage.config";
import {
  MODEL_VENDOR_INFO,
  MODEL_COMPANY_INFO
} from "../models/vendor-company-info";
import {
  MODEL_DEBIT_NOTE_INFO_ONE,
  MODEL_DEBIT_NOTE_INFO_TWO
} from "../models/debit-note-info-create";
import { COLUMN_DEBIT_NOTE_ITEMS } from "../models/debit-note-items-column";
import { parseDebitNoteAdjustmentType } from "../helper";
import {
  MODEL_ATTACHMENT_INFO_ONE,
  MODEL_ATTACHMENT_INFO_TWO
} from "../models/attachment-info-create";
import { withTranslation } from "~/i18n";
import GA from "~/libs/ga";

const CREATE_ERROR_MESSAGE_PATTERN = CREATE_FAILED.replace("%m", "debit note");
const CANCEL_CREATE_MESSAGE_PATTERN = `${WANT_ACTION} cancel this DN?`;
const lang = "debit-create";
class createDebitNoteStepFour extends Component {
  constructor(props) {
    super(props);
    this.cordaService = new CordaService();
    this.state = {
      blocking: false,
      entryDate: moment(),
      itemsSelected: [],
      vatRateList: [],
      vatRateListItem: [],
      debitNoteHeader: {},
      debitNoteItems: [],
      subTotal: 0,
      vatTotal: 0,
      isReadyToSubmit: false,
      fieldMaxLengthAmount: {}
    };
  }

  handleToggleBlocking = () => {
    this.setState({ blocking: !this.state.blocking });
  };

  async componentDidMount() {
    await this.prepareDebitNoteInfoModel();
    await this.getItemsSelected();

    const { mainState } = this.props;

    if (mainState.stepFourProp !== undefined) {
      this.handleToggleBlocking();
      this.setState(
        {
          ...mainState.stepFourProp,
          subVatItemChange: mainState.subVatItemChange,
          itemsSelected: this.state.itemsSelected,
          blocking: !mainState.stepFourProp.blocking
        },
        async () => {
          await this.calculatedSubTotalAndVatTotal();
          await this.handleToggleBlocking();
        }
      );
    } else {
      this.setState(
        {
          subVatItemChange: mainState.subVatItemChange
        },
        async () => {
          await this.calculatedSubTotalAndVatTotal();
        }
      );
    }

    await this.seperateItemsByVatRate();
    await this.prepareHeaderDataForSubmitDebitNote();
    await this.prepareItemDataForSubmitDebitNote();
  }

  prepareDebitNoteInfoModel = () => {
    const { fieldMaxLengthAmount } = this.state;
    MODEL_DEBIT_NOTE_INFO_TWO.fields.forEach(field => {
      if (field.key === "subTotal" || field.key === "vatTotal") {
        field.onBlur = e => this.handleInputChange(e);
      }
      if (_.has(field, "maxLength")) {
        fieldMaxLengthAmount[field.key] = {
          title: field.title,
          maxLength: field.maxLength
        };
      }
    });
    this.setState({ fieldMaxLengthAmount });
  };

  getItemsSelected = () => {
    const { invoiceItems, rowSelected } = this.props.mainState.stepTwoProp;
    const itemsSelected = [];

    rowSelected.forEach(rowIndex => {
      itemsSelected.push(invoiceItems[rowIndex - 1]);
    });

    this.setState({
      itemsSelected: itemsSelected
    });
  };

  seperateItemsByVatRate = () => {
    const { itemsSelected } = this.state;
    const vatRateList = [];
    const vatRateListItem = {};

    itemsSelected.forEach(item => {
      if (!vatRateList.includes(item.vatRate)) {
        vatRateList.push(item.vatRate);
        vatRateListItem[item.vatRate] = [];
      }

      vatRateListItem[item.vatRate] = [...vatRateListItem[item.vatRate], item];
    });

    this.setState({
      vatRateList,
      vatRateListItem
    });
  };

  calculatedSubTotalAndVatTotal = () => {
    const { itemsSelected, subVatItemChange } = this.state;

    if (!subVatItemChange) return;

    let subTotal = 0;
    let vatTotal = 0;

    itemsSelected.forEach(item => {
      subTotal = toBigNumber(subTotal)
        .plus(toBigNumber(item.debitNoteAdjustedSubTotal))
        .toNumber();
      vatTotal = this.calculatedItemsVatTotal();
    });

    this.setState({
      subTotal: subTotal,
      vatTotal: vatTotal
    });
  };

  calculatedItemsVatTotal = () => {
    const { itemsSelected } = this.state;
    let vatTotal = 0;
    let vatSumMapping = {};

    itemsSelected.forEach(item => {
      if (_.has(vatSumMapping, item.vatRate)) {
        vatSumMapping[item.vatRate] = toBigNumber(vatSumMapping[item.vatRate])
          .plus(toBigNumber(item.debitNoteAdjustedSubTotal))
          .toNumber();
      } else {
        vatSumMapping[item.vatRate] = toBigNumber(
          item.debitNoteAdjustedSubTotal
        ).toNumber();
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

  prepareHeaderDataForSubmitDebitNote = () => {
    const { stepOneProp, stepThreeProp } = this.props.mainState;
    const { selectedInvoice } = stepOneProp;

    const subTotal = toBigNumber(this.state.subTotal).toNumber();
    const vatTotal = toBigNumber(this.state.vatTotal).toNumber();
    const total = toBigNumber(subTotal)
      .plus(vatTotal)
      .toNumber();

    const debitNoteHeader = {
      vendorNumber: selectedInvoice.vendorNumber,
      vendorBranchCode: selectedInvoice.vendorBranchCode,
      vendorBranchName: selectedInvoice.vendorBranchName,
      vendorName: selectedInvoice.vendorName,
      vendorTaxNumber: selectedInvoice.vendorTaxNumber,
      vendorAddress: selectedInvoice.vendorAddress,
      vendorTelephone: selectedInvoice.vendorTelephone,
      companyCode: selectedInvoice.companyCode,
      companyName: selectedInvoice.companyName,
      companyTaxNumber: selectedInvoice.companyTaxNumber,
      companyBranchCode: selectedInvoice.companyBranchCode,
      companyBranchName: selectedInvoice.companyBranchName,
      companyAddress: selectedInvoice.companyAddress,
      companyTelephone: selectedInvoice.companyTelephone,
      externalId: stepThreeProp.debitNoteNumber,
      invoiceLinearId: selectedInvoice.linearId,
      invoiceExternalId: selectedInvoice.externalId,
      debitNoteDate: stepThreeProp.debitNoteDate,
      paymentTermCode: selectedInvoice.paymentTermCode,
      paymentTermDesc: selectedInvoice.paymentTermDesc,
      paymentTermDays: selectedInvoice.paymentTermDays,
      dueDate: stepThreeProp.debitNoteDueDate,
      subTotal: subTotal,
      vatTotal: vatTotal,
      total: total,
      currency: selectedInvoice.currency,
      receiptNumber: stepThreeProp.debitNoteReceiptNumber,
      reason: stepThreeProp.debitNoteReason,
      adjustmentType: "PRICE",
      adjustmentTypeDisplay: parseDebitNoteAdjustmentType("PRICE")
    };

    this.setState(
      {
        debitNoteHeader: debitNoteHeader
      },
      () => {
        this.resolveAllowToSubmit();
      }
    );
  };

  prepareItemDataForSubmitDebitNote = () => {
    const debitNoteItems = [];

    this.state.itemsSelected.forEach((item, index) => {
      const subTotal = toBigNumber(item.debitNoteAdjustedSubTotal).toNumber();
      const vatToal = toBigNumber(
        this.calculatedVat(item.debitNoteAdjustedSubTotal, item.vatRate)
      ).toNumber();
      const total = toBigNumber(subTotal)
        .plus(vatToal)
        .toNumber();

      debitNoteItems.push({
        externalId: "" + (index + 1),
        invoiceItemLinearId: item.linearId,
        invoiceItemExternalId: item.externalId,
        purchaseOrderExternalId: item.purchaseOrderExternalId,
        purchaseItemLinearId: item.purchaseItemLinearId,
        purchaseItemExternalId: item.purchaseItemExternalId,
        materialDescription: item.materialDescription,
        quantity: item.quantity,
        currency: item.currency,
        unitPrice: item.unitPrice,
        subTotal: subTotal,
        withholdingTaxRate: item.withholdingTaxRate,
        vatCode: item.vatCode,
        vatRate: item.vatRate,
        vatTotal: vatToal,
        total: total,
        customisedFields: item.customisedFields,
        customisedFieldsUpdatedDate: item.customisedFieldsUpdatedDate,
        purchaseItem: item.purchaseItem,
        site: item.site,
        siteDescription: item.siteDescription,
        unitDescription: item.unitDescription
      });
    });

    this.setState(
      {
        debitNoteItems: debitNoteItems
      },
      () => {
        this.resolveAllowToSubmit();
      }
    );
  };

  uploadAttachmentAndSubmitDebitNote = async () => {
    const { DEBIT_NOTE, RECEIPT, OTHERS } = DEBIT_ATTACHMENT_TYPE;
    const { stepThreeProp } = this.props.mainState;
    const fileAttachments = [];
    let attachments = [];
    let uploadAttachmentError = false;

    for (let key in DEBIT_ATTACHMENT_TYPE) {
      const attachmentType = DEBIT_ATTACHMENT_TYPE[key];

      if (
        attachmentType === DEBIT_NOTE ||
        attachmentType === RECEIPT ||
        attachmentType === OTHERS
      ) {
        attachments = attachments.concat(
          stepThreeProp[`${attachmentType}Attachments`]
        );
      }
    }

    for (let i = 0; i < attachments.length; i++) {
      const handleFileUploadResponse = await this.uploadAttachment(
        attachments[i].data
      );
      const { status, message, data } = handleFileUploadResponse;

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
      const body = this.state.debitNoteHeader;

      body["fileAttachments"] = fileAttachments;
      body["debitNoteItems"] = this.state.debitNoteItems;

      this.submitDebitNote(body);
    }
  };

  uploadAttachment = async attachment =>
    await this.cordaService.callApi({
      group: "file",
      action: "handleFileUpload",
      body: attachment
    });

  renderRowsTableForDebitNoteItem = items => {
    if (!items || items.length <= 0) {
      return (
        <tr>
          <td colSpan="9" className="text-center">
            No Item Found
          </td>
        </tr>
      );
    }

    return _.map(items, (item, index) => {
      const { debitNoteItems } = this.state;
      const debitNoteItemFound = debitNoteItems.find(
        debitNoteItem => debitNoteItem.invoiceItemLinearId === item.linearId
      );

      return (
        <tr key={item.externalId + index}>
          <td>
            {debitNoteItemFound
              ? debitNoteItemFound.externalId
              : `${index + 1}`}
          </td>
          <td>
            {_.has(item, "externalId") && item.externalId !== ""
              ? item.externalId
              : "-"}
          </td>
          <td>
            {_.has(item, "materialDescription") &&
            item.materialDescription !== ""
              ? item.materialDescription
              : "-"}
          </td>
          <td>
            {_.has(item, "purchaseOrderExternalId") &&
            item.purchaseOrderExternalId !== ""
              ? item.purchaseOrderExternalId
              : "-"}
          </td>
          <td>
            {_.has(item, "itemSubTotal") && item.itemSubTotal !== ""
              ? this.formatPriceNumber(item.itemSubTotal)
              : "-"}
          </td>
          <td>
            {_.has(item, "debitNoteAdjustedSubTotal") &&
            item.debitNoteAdjustedSubTotal !== ""
              ? this.formatPriceNumber(item.debitNoteAdjustedSubTotal)
              : "-"}
          </td>
          <td>
            {_.has(item, "currency") && item.currency !== ""
              ? item.currency
              : "-"}
          </td>
          <td>{_.has(item, "site") && item.site !== "" ? item.site : "-"}</td>
          <td>
            {_.has(item, "withholdingTaxRate") && item.withholdingTaxRate !== ""
              ? `${item.withholdingTaxRate}%`
              : "-"}
          </td>
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
      this.setState(
        {
          [event.target.name]: event.target.value,
          subVatItemChange: false
        },
        () => {
          this.prepareHeaderDataForSubmitDebitNote();
        }
      );
    } else {
      this.setState(
        {
          [event.target.name]: event.target.value
        },
        () => {
          this.prepareHeaderDataForSubmitDebitNote();
        }
      );
    }
  };

  handleSliceAttachmentName(attachmentName) {
    const ext = attachmentName.lastIndexOf(".");
    const attachmentNameWithoutExt = attachmentName.substr(0, ext);

    if (attachmentNameWithoutExt.length > 15) {
      const charArray = [...attachmentNameWithoutExt];
      const newattachmentName =
        charArray[0] +
        charArray[1] +
        charArray[2] +
        charArray[3] +
        "...." +
        charArray[charArray.length - 4] +
        charArray[charArray.length - 3] +
        charArray[charArray.length - 2] +
        charArray[charArray.length - 1];

      return newattachmentName + attachmentName.substr(ext);
    } else {
      return attachmentName;
    }
  }

  handleClickSubmitButton = () => {
    this.handleToggleBlocking();

    this.uploadAttachmentAndSubmitDebitNote();
  };

  submitDebitNote = async body => {
    GA.event({
      category: "Debit Note",
      action: "DN Submit (Request)",
      label: `Debit Note | ${body.externalId} | ${moment().format()}`
      // value: body.subTotal
    });

    const issueDebitNoteResponse = await this.cordaService.callApi({
      group: "debit",
      action: "issueDebitNote",
      body: body
    });

    const { status, message } = issueDebitNoteResponse;

    if (status) {
      this.handleToggleBlocking();

      GA.event({
        category: "Debit Note",
        action: "DN Submit (Success)",
        label: `Debit Note | ${body.externalId} | ${moment().format()}`,
        value: body.subTotal
      });

      this.routeToList();
    } else {
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

      GA.event({
        category: "Debit Note",
        action: "DN Submit (Failed)",
        label: `Debit Note | ${body.externalId} | ${moment().format()}`
      });
    }
  };

  handleClickBackButton = () => {
    this.props.updateState(this.state);
    this.props.previousStep();
  };

  resolveAllowToSubmit() {
    const { fieldMaxLengthAmount, debitNoteHeader } = this.state;

    const { status, rule } = checkValidAmount(
      debitNoteHeader,
      fieldMaxLengthAmount
    );

    if (status === false) {
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
    if (
      this.state.subTotal === "" ||
      this.state.vatTotal === "" ||
      this.state.subTotal == "0" ||
      status === false
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
    Router.push(DEBIT_ROUTES.LIST);
  };

  render() {
    const {
      blocking,
      debitNoteHeader,
      vatRateList,
      vatRateListItem,
      isReadyToSubmit
    } = this.state;
    const { mainState, contentStep, t } = this.props;
    const { stepOneProp, stepThreeProp, currentStep } = mainState;

    return (
      <BlockUi tag="div" blocking={blocking}>
        <div id="cn_create" className="step-4">
          <StepIndicator
            activeStep={currentStep}
            contentStep={contentStep}
            lang={lang}
          />
          <div className="page__header col-12">
            <h2>
              {t("Debit Note No")} : {stepThreeProp.debitNoteNumber}
            </h2>
          </div>
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
                    <strong>
                      {moment(this.state.entryDate).format("DD/MM/YYYY")}
                    </strong>
                  </div>
                </div>
              </div>
              <div className="box__inner">
                <SectionTwoHeaderInfo
                  id="vendorInfo"
                  datas={stepOneProp.selectedInvoice}
                  modelOne={MODEL_VENDOR_INFO}
                  modelTwo={MODEL_COMPANY_INFO}
                />
                <SectionInfo
                  id="paymentInfo"
                  datas={debitNoteHeader}
                  header="Debit Note Information"
                  modelOne={MODEL_DEBIT_NOTE_INFO_ONE}
                  modelTwo={MODEL_DEBIT_NOTE_INFO_TWO}
                />
                <SectionInfo
                  id="attachmentInfo"
                  datas={stepThreeProp}
                  header="Attachments"
                  modelOne={MODEL_ATTACHMENT_INFO_ONE}
                  modelTwo={MODEL_ATTACHMENT_INFO_TWO}
                />
              </div>
            </section>
            <section
              id="invoice_detail_page_2"
              className="box box--width-header"
            >
              <SectionItemsInfo
                id="vat"
                model={COLUMN_DEBIT_NOTE_ITEMS}
                tableListIndex={vatRateList}
                datas={vatRateListItem}
                renderRowsTable={this.renderRowsTableForDebitNoteItem}
                header="Items Information"
                childHeaderFirst="TAX"
                childHeaderLast="%"
                classTable="table-3"
                moreTable={true}
                lang={lang}
              />
            </section>
            <SectionCancelAndNext
              handleClickBackButton={this.handleClickBackButton}
              handleClickSubmitButton={this.handleClickSubmitButton}
              disabled={isReadyToSubmit}
              backButton={true}
              submitButton={true}
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
export default withTranslation(["debit-create"])(createDebitNoteStepFour);
