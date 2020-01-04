import React, { Component } from "react";
import Router from "next/router";
import BlockUi from "react-block-ui";
import _ from "lodash";

import CordaService from "../../../services/CordaService";
import StepIndicator from "../../StepIndicator";
import ColumnField from "../../ColumnField";
import SectionUploadAttachment from "../../SectionUploadAttachment";
import ModalCancelWarning from "../../ModalCancelWarning";
import ModalMessage from "../../common/SweetAlert";
import SectionCancelAndNext from "../../SectionCancelAndNext";
import { DEBIT_ROUTES } from "../../../configs/routes.config";
import { DEBIT_ATTACHMENT_TYPE } from "../../../configs/attachmentType.config";
import {
  SYSTEM_FAILED,
  WANT_ACTION
} from "../../../configs/errorMessage.config";
import { MODEL_DN_DETAIL } from "../models/debit-note-detail-create";
import { MODEL_ATTACHMENT } from "../models/attachment";
import { withTranslation } from "~/i18n";

const CANCEL_CREATE_MESSAGE_PATTERN = `${WANT_ACTION} cancel this DN?`;
const { DEBIT_NOTE, RECEIPT, OTHERS } = DEBIT_ATTACHMENT_TYPE;
const lang = "debit-create";

class createDebitNoteStepThree extends Component {
  constructor(props) {
    super(props);
    this.cordaService = new CordaService();
    this.state = {
      blocking: false,
      configuration: {},
      isDebitNoteNumberDuplicate: false,
      isWarningActive: false,
      debitNoteNumber: "",
      debitNoteDate: "",
      debitNoteDueDate: "",
      debitNoteReceiptNumber: "",
      debitNoteReason: "",
      [`${DEBIT_NOTE}Attachments`]: [],
      [`is${DEBIT_NOTE}AttachmentRequired`]: false,
      [`${DEBIT_NOTE}AttachmentRequiredTooltip`]: "",
      [`${DEBIT_NOTE}AttachmentFormats`]: "",
      [`${RECEIPT}Attachments`]: [],
      [`is${RECEIPT}AttachmentRequired`]: false,
      [`${RECEIPT}AttachmentRequiredTooltip`]: "",
      [`${RECEIPT}AttachmentFormats`]: "",
      [`${OTHERS}Attachments`]: [],
      [`is${OTHERS}AttachmentRequired`]: false,
      [`${OTHERS}AttachmentRequiredTooltip`]: "",
      [`${OTHERS}AttachmentFormats`]: ""
    };
  }

  handleToggleBlocking = () => {
    this.setState({ blocking: !this.state.blocking });
  };

  componentWillMount() {
    if (this.props.mainState.stepThreeProp === undefined) {
      this.setConfiguration(
        this.props.mainState.stepOneProp.configuration.response
      );
    }
  }

  componentDidMount() {
    this.prepareDebitNoteDetailModel();

    if (this.props.mainState.stepThreeProp !== undefined) {
      this.handleToggleBlocking();
      this.setState(
        {
          ...this.props.mainState.stepThreeProp,
          blocking: !this.props.mainState.stepThreeProp.blocking,
          isInvoiceChange: false
        },
        () => {
          this.initConfigCalendar("debitNoteDate", this.state.configuration);
          this.initConfigCalendar("debitNoteDueDate", this.state.configuration);
          this.resolveAllowToNext();
          this.handleToggleBlocking();
        }
      );
    } else {
      this.setState({
        isInvoiceChange: false
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.isDebitNoteNumberDuplicate !==
      this.state.isDebitNoteNumberDuplicate
    ) {
      this.prepareDebitNoteDetailModel();
    }
  }

  prepareDebitNoteDetailModel = () => {
    MODEL_DN_DETAIL.fields.forEach(field => {
      if (field.key === "debitNoteNumber") {
        field.condition = this.state.isDebitNoteNumberDuplicate;
      } else {
        field.condition = true;
      }

      field.onChange = e => this.handleInputChange(e);
    });
  };

  setConfiguration = configuration => {
    this.initConfigCalendar("debitNoteDate", configuration);
    this.initConfigCalendar("debitNoteDueDate", configuration);
    this.initAtttachmentConfiguration(configuration);

    this.setState({
      configuration: configuration
    });
  };

  initConfigCalendar = (key, configuration) => {
    const dateField = MODEL_DN_DETAIL.fields.find(field => field.key === key);
    let minDate = "";
    let maxDate = "";

    switch (key) {
      case "debitNoteDate":
        minDate = configuration.minimumDocumentEffectiveDate;
        maxDate = configuration.maximumDocumentEffectiveDate;
        break;
      case "debitNoteDueDate":
        minDate = moment();
        maxDate = null;
        break;
    }

    dateField.minDate = minDate;
    dateField.maxDate = maxDate;
  };

  initAtttachmentConfiguration = configuration => {
    const attachmentConfiguration = configuration.attachmentConfiguration;

    attachmentConfiguration.forEach(config => {
      switch (config.attachmentType) {
        case DEBIT_NOTE:
          this.setAtttachmentConfiguration(config, DEBIT_NOTE);
          break;
        case RECEIPT:
          this.setAtttachmentConfiguration(config, RECEIPT);
          break;
        case OTHERS:
          this.setAtttachmentConfiguration(config, OTHERS);
          break;
      }
    });
  };

  setAtttachmentConfiguration = (config, attachmentType) => {
    const { minimumNumberOfFiles, maximumNumberOfFiles, fileType } = config;
    const requiredAttachmentFieldName = `is${attachmentType}AttachmentRequired`;
    const requiredAttachmentTooltipFieldName = `${attachmentType}AttachmentRequiredTooltip`;
    const attachmentFormatFieldName = `${attachmentType}AttachmentFormats`;
    const state = {};

    state[requiredAttachmentFieldName] = minimumNumberOfFiles > 0;
    state[requiredAttachmentTooltipFieldName] =
      minimumNumberOfFiles === maximumNumberOfFiles
        ? minimumNumberOfFiles
        : `${minimumNumberOfFiles} - ${maximumNumberOfFiles}`;
    state[attachmentFormatFieldName] = fileType;

    this.setState(state);
  };

  handleInputChange = async event => {
    this.setState(
      {
        [event.target.name]: event.target.value
      },
      () => {
        this.resolveAllowToNext();
      }
    );

    if (event.target.name === "debitNoteNumber") {
      const isDebitNoteNumberDuplicate = await this.checkDuplicateDebitNoteNumber(
        event.target.value
      );

      this.setState(
        {
          isDebitNoteNumberDuplicate: isDebitNoteNumberDuplicate
        },
        () => {
          this.resolveAllowToNext();
        }
      );
    }
  };

  checkDuplicateDebitNoteNumber = async debitNoteNumber => {
    const body = {
      externalId: debitNoteNumber,
      vendorTaxNumber: this.props.mainState.stepOneProp.selectedInvoice
        .vendorTaxNumber
    };

    const checkUniquenessDebitNoteResponse = await this.cordaService.callApi({
      group: "debit",
      action: "checkUniquenessDebitNote",
      body: body
    });

    const { status, data, message } = checkUniquenessDebitNoteResponse;

    if (status) {
      return !data;
    } else {
      const errorMessagePattern = SYSTEM_FAILED.replace(
        "%m",
        "check uniqueness debit note"
      );

      this.setState({
        isReadyToNext: false
      });

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
    }
  };

  resolveAllowToNext() {
    if (
      this.state.debitNoteNumber === "" ||
      (this.state.debitNoteDate === "" ||
        this.state.debitNoteDate.includes("Invalid date")) ||
      (this.state.debitNoteDueDate === "" ||
        this.state.debitNoteDueDate.includes("Invalid date")) ||
      this.state.debitNoteReason === "" ||
      this.state.isDebitNoteNumberDuplicate ||
      !this.isValidAttachment()
    ) {
      this.setState({
        isReadyToNext: false,
        isWarningActive: true
      });
    } else {
      this.setState({
        isReadyToNext: true,
        isWarningActive: false
      });
    }
  }

  isValidAttachment() {
    let isDebitNoteAttachmentValid = true;
    let isReceiptAttachmentValid = true;
    let isOthersAttachmentValid = true;

    if (this.state[`is${DEBIT_NOTE}AttachmentRequired`]) {
      if (this.state[[`${DEBIT_NOTE}Attachments`]].length === 0) {
        isDebitNoteAttachmentValid = false;
      }
    }

    if (this.state[`is${RECEIPT}AttachmentRequired`]) {
      if (this.state[[`${RECEIPT}Attachments`]].length === 0) {
        isReceiptAttachmentValid = false;
      }
    }

    if (this.state[`is${OTHERS}AttachmentRequired`]) {
      if (this.state[[`${OTHERS}Attachments`]].length === 0) {
        isOthersAttachmentValid = false;
      }
    }

    return (
      isDebitNoteAttachmentValid &&
      isReceiptAttachmentValid &&
      isOthersAttachmentValid
    );
  }

  handleDropAttachment = (event, attachmentType) => {
    event.preventDefault();

    const attachment = event.dataTransfer.items[0].getAsFile();

    this.handleUploadAttachment(attachment, attachmentType);

    event.target.value = null;
  };

  handleDragAttachmentOver = event => {
    event.preventDefault();
  };

  handleSelectedAttachment = event => {
    const attachmentType = event.target.name;
    const attachment = event.target.files[0];

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

      this.resolveAllowToNext();
    }
  }

  handleSetAttachmentForUpload = (attachment, attachmentType) => {
    const attachments = this.state[`${attachmentType}Attachments`];

    attachments.push(attachment);

    this.setState({
      [`${attachmentType}Attachments`]: attachments
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
    const attachmentConfiguration = this.state.configuration.attachmentConfiguration.find(
      config => config.attachmentType === attachmentType
    );
    const attachmentFormats = this.state[
      `${attachmentType}AttachmentFormats`
    ].split(",");
    const attachments = this.state[`${attachmentType}Attachments`];
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
        title: "Error",
        message: "File size is larger than 3mb.",
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

    if (
      isAttachmentNotExceeded &&
      isValidAttachmentType &&
      isAttachmentSizeNotExceeded
    ) {
      window.jQuery(`#${attachmentType}-label-format`).css("color", "black");
      window.jQuery(`#${attachmentType}-label-count`).css("color", "black");

      return true;
    } else {
      window.jQuery(`#${attachmentType}-label-format`).css("color", "red");
      window.jQuery(`#${attachmentType}-label-count`).css("color", "red");

      return false;
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

  handleDeselectedAttachment = (attachmentType, attachmentIndex) => {
    const attachments = this.state[`${attachmentType}Attachments`];

    attachments.splice(attachmentIndex, 1);

    this.setState(
      {
        [`${attachmentType}Attachments`]: attachments
      },
      () => {
        this.resolveAllowToNext();
      }
    );
  };

  handleClickNextButton = () => {
    this.props.updateState(this.state);
    this.props.nextStep();
  };

  handleClickBackButton = () => {
    this.props.updateState(this.state);
    this.props.previousStep();
  };

  routeCancel() {
    Router.push(DEBIT_ROUTES.LIST);
  }

  render() {
    const { blocking, isReadyToNext } = this.state;
    const { mainState, contentStep, t } = this.props;

    return (
      <BlockUi tag="div" blocking={blocking}>
        <div id="cn_create" className="step-3">
          <StepIndicator
            activeStep={mainState.currentStep}
            contentStep={contentStep}
            lang={lang}
          />
          <div className="page__header col-12">
            <h2>{t("Please Insert Debit Note Details and Attach Files")}</h2>
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
                model={MODEL_DN_DETAIL}
                lang={lang}
              />
              <SectionUploadAttachment
                uploadId="upload-section"
                uploadListSectionId="uploaded-list-section"
                uploadListId="uploadedLists"
                state={this.state}
                model={MODEL_ATTACHMENT}
                handleDropAttachment={this.handleDropAttachment}
                handleDragAttachmentOver={this.handleDragAttachmentOver}
                handleSelectedAttachment={this.handleSelectedAttachment}
                handleSliceAttachmentName={this.handleSliceAttachmentName}
                handleDeselectedAttachment={this.handleDeselectedAttachment}
                lang={lang}
              />
            </div>
            <SectionCancelAndNext
              handleClickBackButton={this.handleClickBackButton}
              handleClickNextButton={this.handleClickNextButton}
              disabled={isReadyToNext}
              backButton={true}
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
export default withTranslation(["debit-create"])(createDebitNoteStepThree);
