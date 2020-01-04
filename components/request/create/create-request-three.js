import React, { Component, Fragment } from "react";
import Router from "next/router";
import _ from "lodash";
import BlockUi from "react-block-ui";
import StepIndicator from "../../StepIndicator";
import ColumnField from "../../ColumnField";
import SectionUploadAttachment from "../../SectionUploadAttachment";
import { MODEL_REQUEST_DETAIL } from "~/components/request/models/create-request-detail";
import { MODEL_ATTACHMENT } from "~/components/request/models/attachment";
import ModalCancelWarning from "~/components/ModalCancelWarning";
import SectionCancelAndNext from "~/components/SectionCancelAndNext";
import HeaderInsertAndAttachFile from "../../HeaderInsertAndAttachFile";
import ModalMessage from "~/components/common/SweetAlert";
import { REQUEST_ATTACHMENT_TYPE } from "~/configs/attachmentType.config";
import { REQUEST_ROUTES } from "~/configs/routes.config";
const { OTHERS } = REQUEST_ATTACHMENT_TYPE;
const lang = "request-create";
import { setConfigPermissionToArray } from "~/helpers/app";
import { withTranslation } from "react-i18next";
class CreateRequestStepThree extends Component {
  constructor(props) {
    super(props);
    const { mainState, contentStep } = this.props;
    this.state = {
      isLoading: true,
      isReadyToNext: false,
      blocking: false,
      mainState: mainState,
      contentStep: contentStep,
      configuration: {},
      [`${OTHERS}Attachments`]: [],
      [`is${OTHERS}AttachmentRequired`]: false,
      [`${OTHERS}AttachmentRequiredTooltip`]: "",
      [`${OTHERS}AttachmentFormats`]: "",
      requestPermissions: [],
      modelRequestDetail: MODEL_REQUEST_DETAIL
    };
  }

  init = () => {
    this.customModelRequestDetail();
    this.setState({
      isLoading: false
    });
  };

  async componentDidMount() {
    this.getPermissionInput();

    if (this.props.mainState.stepThreeProp === undefined) {
      const { mainState } = this.props;
      const { stepOneProp } = mainState;
      let configuration = {};

      if (
        _.has(stepOneProp, "configuration") &&
        _.has(stepOneProp.configuration, "response") &&
        !_.isEmpty(stepOneProp.configuration.response)
      ) {
        configuration = stepOneProp.configuration.response;
      }

      await this.setConfiguration(configuration);
      await this.resolveAllowToNext();
    } else {
      this.setState(
        {
          ...this.props.mainState.stepThreeProp
        },
        () => {
          this.resolveAllowToNext();
        }
      );
    }
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

  setConfiguration = configuration => {
    this.initAtttachmentConfiguration(configuration);
    this.setState({
      configuration: configuration
    });
  };

  initAtttachmentConfiguration = ({ attachmentConfiguration = [] }) => {
    attachmentConfiguration.forEach(config => {
      switch (config.attachmentType) {
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

  handleInputChange = event => {
    this.setState(
      {
        [event.target.name]: event.target.value
      },
      () => {
        this.resolveAllowToNext();
      }
    );
  };

  customModelRequestDetail = () => {
    let { modelRequestDetail } = this.state;
    let data = {};

    modelRequestDetail.forEach((models, index) => {
      if (!_.isEmpty(models.fields)) {
        const {
          model,
          dataState
        } = this.setHandleFieldAndDisplayNameAndValueDefault(models.fields);

        modelRequestDetail[index]["fields"] = model;
        data = { ...data, ...dataState };
      }
    });

    this.setState({ modelRequestDetail, ...data });
  };

  setHandleFieldAndDisplayNameAndValueDefault = model => {
    let dataState = {};

    if (!_.isEmpty(model)) {
      const { requestPermissions } = this.state;
      const level = "HEADER";
      const permissions = _.has(requestPermissions, level)
        ? requestPermissions[level]
        : [];

      let formModels = [];

      model = model.map(field => {
        // set handle field
        if (_.has(field, "onChange")) {
          field.onChange = e => this.handleInputChange(e);
        }

        // set display by config permission
        field = this.setDisplayField(field, permissions);
        formModels.push(field);

        return field;
      });

      dataState = this.setValueDefault(formModels, this.state, permissions);
    }

    return {
      model: model,
      dataState: dataState
    };
  };

  setDisplayField = (field, permissions) => {
    if (_.has(permissions, field.key)) {
      const { displayName, required } = permissions[field.key];

      field.required = required;
      field.placeholder = displayName;
      field.title = displayName;
    }
    if (field.type === "date") {
      const { minDate, maxDate } = this.initConfigCalendar(field.key);
      field.minDate = minDate;
      field.maxDate = maxDate;
    }

    return field;
  };

  initConfigCalendar = key => {
    let minDate = "";
    let maxDate = "";
    switch (key) {
      case "paymentDueDate":
        minDate = moment();
        maxDate = null;
        break;
    }
    return { minDate: minDate, maxDate: maxDate };
  };

  setValueDefault = (formModels, data, permissions) => {
    let dataState = {};
    if (!_.isEmpty(formModels) && !_.isEmpty(permissions)) {
      formModels.forEach(model => {
        if (
          _.has(permissions, `${model.key}.defaultValue`) &&
          (!_.has(data, model.key) ||
            _.isUndefined(data[model.key]) ||
            _.isNaN(data[model.key]) ||
            _.isNull(data[model.key]))
        ) {
          dataState[model.key] = permissions[model.key]["defaultValue"];
        }
      });
    }

    return dataState;
  };

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

  handleUploadAttachment = (attachment, attachmentType) => {
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
        case OTHERS:
          this.handleSetAttachmentForUpload(attachment, OTHERS);
          break;
      }

      this.resolveAllowToNext();
    }
  };

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
    const { configuration } = this.state;
    const attachmentConfiguration =
      _.has(configuration, "attachmentConfiguration") &&
      configuration.attachmentConfiguration.find(
        config => config.attachmentType === attachmentType
      );
    const attachmentFormats =
      _.has(this.state, `${attachmentType}AttachmentFormats`) &&
      !_.isEmpty(this.state[`${attachmentType}AttachmentFormats`])
        ? this.state[`${attachmentType}AttachmentFormats`].split(",")
        : [];

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
        closeOnClickOutside: false,
        message: <div>File size is larger than 3mb.</div>
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
  resolveAllowToNext = () => {
    if (!this.isValidAttachment()) {
      this.setState({
        isReadyToNext: false
      });
    } else {
      this.setState({
        isReadyToNext: true
      });
    }
  };
  isValidAttachment() {
    let isOthersAttachmentValid = true;

    if (this.state[`is${OTHERS}AttachmentRequired`]) {
      if (this.state[[`${OTHERS}Attachments`]].length === 0) {
        isOthersAttachmentValid = false;
      }
    }

    return isOthersAttachmentValid;
  }
  routeCancel = () => {
    Router.push(REQUEST_ROUTES.LIST);
  };
  render() {
    const {
      isLoading,
      blocking,
      mainState,
      contentStep,
      modelRequestDetail
    } = this.state;
    const { t } = this.props;

    return (
      <BlockUi tag="div" blocking={blocking}>
        <div id="cn_create" className="step-1">
          <StepIndicator
            activeStep={mainState.currentStep}
            contentStep={contentStep}
            lang={lang}
          />
          <div className="page__header col-12">
            <h2>{t("Request Details")}</h2>
          </div>
          {isLoading === false && (
            <form
              id="createStep3"
              name="createStep3"
              method="post"
              encType="multipart/form-data"
              action=""
              className="form col-12 px-0"
            >
              <div className="box col-12 d-flex flex-wrap">
                <HeaderInsertAndAttachFile
                  title={t(`Please Insert Reference and Attach File`)}
                  lang={lang}
                />
                <ColumnField
                  id="detail-section"
                  datas={this.state}
                  model={modelRequestDetail}
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
                handleClickNextButton={this.handleClickNextButton}
                handleClickBackButton={this.handleClickBackButton}
                disabled={this.state.isReadyToNext}
                nextButton={true}
                backButton={true}
                lang={lang}
              />
            </form>
          )}
        </div>
        <ModalCancelWarning
          onClick={this.routeCancel}
          message="Do you want to cancel this Request?"
        />
      </BlockUi>
    );
  }
}
export default withTranslation(["request-create"])(CreateRequestStepThree);
