import React, { Component } from "react";
import _ from "lodash";
import ApiService from "../../libs/ApiService";
import Autosuggest from "react-autosuggest";
import { throws } from "assert";
import BlockUi from "react-block-ui";
import Router from "next/router";
import ModalAlert, { BTN_ACTION_BACK, BTN_ACTION_OK } from "../modalAlert";
import { i18n, withTranslation } from "~/i18n";

const Api = new ApiService();

class createCreditNoteStepThree extends Component {
  constructor(props) {
    super(props);
    this.toggleBlocking = this.toggleBlocking.bind(this);
    this.state = {
      blocking: false,
      configuration: {},
      //CN
      creditNote: "",
      creditNoteDate: "",
      creditNoteReason: "",
      creditNoteFiles: [],
      otherFiles: [],
      creditNoteRequiredString: "",
      otherRequiredString: "",
      isCreditNoteRequired: false,
      isOtherRequired: false,
      creditNoteFilesFormat: "",
      otherFilesFormat: "",
      //Validation
      isCreditNoteDup: false,
      isWarningActive: false,
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      isTextOnly: true,
      buttonAlert: []
    };
  }

  toggleBlocking() {
    this.setState({ blocking: !this.state.blocking });
  }

  async componentDidMount() {
    this.toggleBlocking();
    if (this.props.mainState.stepThreeProp === undefined) {
      this.getConfiguration(this.props.mainState.stepOneProp.selectedInvoice);
    } else {
      await this.setState(
        {
          configuration: this.props.mainState.stepThreeProp.configuration,
          //CN
          creditNote: this.props.mainState.stepThreeProp.creditNote,
          creditNoteDate: this.props.mainState.stepThreeProp.creditNoteDate,
          creditNoteReason: this.props.mainState.stepThreeProp.creditNoteReason,
          creditNoteFiles: this.props.mainState.stepThreeProp.creditNoteFiles,
          otherFiles: this.props.mainState.stepThreeProp.otherFiles,
          creditNoteRequiredString: this.props.mainState.stepThreeProp
            .creditNoteRequiredString,
          otherRequiredString: this.props.mainState.stepThreeProp
            .otherRequiredString,
          isCreditNoteRequired: this.props.mainState.stepThreeProp
            .isCreditNoteRequired,
          isOtherRequired: this.props.mainState.stepThreeProp.isOtherRequired,
          creditNoteFilesFormat: this.props.mainState.stepThreeProp
            .creditNoteFilesFormat,
          otherFilesFormat: this.props.mainState.stepThreeProp.otherFilesFormat,
          //Validation
          isCreditNoteDup: this.props.mainState.stepThreeProp.isCreditNoteDup
        },
        () => {
          this.initCalendar("existed");
          this.resolveAllowToNext();
          this.toggleBlocking();
        }
      );
      console.log(this.props.mainState.stepThreeProp.creditNoteDate);
    }
  }

  initCalendar(existed) {
    console.log(this.state.configuration);
    var d = new Date();
    var todayDate =
      "" + d.getDate() + "/" + (d.getMonth() + 1) + "/" + (d.getFullYear() + 3);
    window
      .jQuery(".datepicker")
      .daterangepicker({
        singleDatePicker: true,
        showDropdowns: true,
        minDate: moment(
          this.state.configuration.minimumDocumentEffectiveDate
        ).format("DD/MM/YYYY"),
        maxDate: moment(
          this.state.configuration.maximumDocumentEffectiveDate
        ).format("DD/MM/YYYY"),
        locale: {
          format: "DD/MM/YYYY"
        }
      })
      .on("change", event => {
        this.handleInputChange(event);
      });
    window.jQuery(".datepicker").val("");
    if (existed !== undefined) {
      if (this.state.creditNoteDate != "") {
        window
          .jQuery("#cn_date")
          .data("daterangepicker")
          .setStartDate(this.state.creditNoteDate);
        window
          .jQuery("#cn_date")
          .data("daterangepicker")
          .setEndDate(this.state.creditNoteDate);
      }
    }
  }

  resolveAllowToNext() {
    if (
      this.state.creditNote === "" ||
      this.state.creditNoteDate === "" ||
      !this.resolveFilesRequiredUploaded() ||
      this.state.isCreditNoteDup ||
      this.state.creditNoteReason === ""
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

  resolveFilesRequiredUploaded() {
    let creditNoteUploaded = true;
    let otherUploaded = true;
    if (this.state.isCreditNoteRequired) {
      if (this.state.creditNoteFiles.length === 0) {
        creditNoteUploaded = false;
      }
    }

    if (this.state.isOtherRequired) {
      if (this.state.otherFiles.length === 0) {
        otherUploaded = false;
      }
    }

    return creditNoteUploaded && otherUploaded;
  }

  async handleInputChange(event) {
    console.log(event.target.value);
    this.setState({
      [event.target.name]: event.target.value
    });

    if (event.target.name === "creditNote") {
      this.handleKeyInToCheckDuplicateCreditNote(event.target.value);
    }

    await this.resolveAllowToNext();
  }

  handleKeyInToCheckDuplicateCreditNote(keyInCN) {
    let json = {
      externalId: keyInCN,
      vendorTaxNumber: this.props.mainState.stepOneProp.selectedInvoice
        .vendorTaxNumber
    };
    Api.postValidateCreditNote(json).then(res => {
      if (res.data) {
        this.setState({
          isCreditNoteDup: false
        });
      } else {
        this.setState({
          isCreditNoteDup: true
        });
      }
    });
  }

  handleDropFile(event, filetype) {
    event.preventDefault();
    let file = event.dataTransfer.items[0].getAsFile();
    this.addUploadFile(file, filetype);
    event.target.value = null;
  }

  onDragOver = event => {
    event.preventDefault();
  };

  handleSelectedFile = event => {
    let filetype = event.target.name;
    let files = event.target.files;
    this.addUploadFile(files[0], filetype);
    event.target.value = null;
  };

  addUploadFile(file, filetype) {
    if (this.isValidToUpload(file, filetype)) {
      const data = new FormData();
      data.append("file", file);
      file.data = data;
      if (filetype === "attach_cn_file") {
        let creditNoteFiles = this.state.creditNoteFiles;
        creditNoteFiles.push(file);
        let filtered = creditNoteFiles.filter(
          (thing, index, self) =>
            index ===
            self.findIndex(t => t.name === thing.name && t.size === thing.size)
        );
        this.setState({
          creditNoteFiles: filtered
        });
      } else if (filetype === "attach_other_file") {
        let otherFiles = this.state.otherFiles;
        otherFiles.push(file);
        let filtered = otherFiles.filter(
          (thing, index, self) =>
            index ===
            self.findIndex(t => t.name === thing.name && t.size === thing.size)
        );
        this.setState({
          otherFiles: filtered
        });
      }
      this.resolveAllowToNext();
    }
  }

  handleDeselectedFile(type, fileIndex) {
    let files = this.state[type];
    files.splice(fileIndex, 1);

    this.setState(
      {
        type: files
      },
      () => {
        this.resolveAllowToNext();
      }
    );
  }

  isValidToUpload(file, fileType) {
    let isNotExceeded = false;
    let isValidType = false;
    let isSizeNotExceeded = false;
    let filesConfig = this.state.configuration.attachmentConfiguration;
    if (fileType === "attach_cn_file") {
      let formats = this.state.creditNoteFilesFormat.split(",");
      formats.forEach(format => format.trim().toUpperCase());
      let ext = file.name.substring(
        file.name.lastIndexOf(".") + 1,
        file.name.length
      );

      if (
        this.state.creditNoteFiles.length < filesConfig[0].maximumNumberOfFiles
      ) {
        isNotExceeded = true;
      }

      if (formats.includes(ext.toUpperCase())) {
        isValidType = true;
      }

      if (file.size <= 3000000) {
        isSizeNotExceeded = true;
      }

      if (!isSizeNotExceeded) {
        this.setState({
          validationErrorMsg: "File size is larger than 3mb."
        });
        window.jQuery("#validationlWarning").modal("toggle");
      }

      if (isNotExceeded && isValidType && isSizeNotExceeded) {
        window.jQuery("#cn-label-format").css("color", "black");
        window.jQuery("#cn-label-count").css("color", "black");
        return true;
      } else {
        window.jQuery("#cn-label-format").css("color", "red");
        window.jQuery("#cn-label-count").css("color", "red");
        return false;
      }
    } else if (fileType === "attach_other_file") {
      let formats = this.state.otherFilesFormat.split(",");
      formats.forEach(format => format.trim().toUpperCase());
      let ext = file.name.substring(
        file.name.lastIndexOf(".") + 1,
        file.name.length
      );

      if (this.state.otherFiles.length < filesConfig[1].maximumNumberOfFiles) {
        isNotExceeded = true;
      }

      if (formats.includes(ext.toUpperCase())) {
        isValidType = true;
      }

      if (file.size <= 3000000) {
        isSizeNotExceeded = true;
      }

      if (!isSizeNotExceeded) {
        this.setState({
          validationErrorMsg: "File size is larger than 3mb."
        });
        window.jQuery("#validationlWarning").modal("toggle");
      }

      if (isNotExceeded && isValidType && isSizeNotExceeded) {
        window.jQuery("#other-label-format").css("color", "black");
        window.jQuery("#other-label-count").css("color", "black");
        return true;
      } else {
        window.jQuery("#other-label-format").css("color", "red");
        window.jQuery("#other-label-count").css("color", "red");
        return false;
      }
    }
  }

  async getConfiguration(invoice) {
    let selectedInvoice = invoice;
    let mainPOHeaderNumber = selectedInvoice.purchaseOrderHeaderNumber.split(
      "|"
    )[0];
    Api.getPOByPONumber(mainPOHeaderNumber)
      .then(res => {
        console.log(res);
        return res.data.find(po => {
          return po.purchaseOrderNumber === mainPOHeaderNumber;
        });
      })
      .then(po => {
        console.log(po);
        Api.getCreditNoteConfiguration(
          po.buyer.legalName,
          po.businessPlaceTaxNumber
        )
          .then(config => {
            console.log(config);
            this.setState({
              configuration: config
            });
          })
          .then(() => {
            this.initCalendar();
            this.resolveFileRequired();
            this.populateNumberRequiredFileString();
            this.toggleBlocking();
          });
      });
  }

  populateNumberRequiredFileString() {
    let config = this.state.configuration;
    console.log(config);
    let config1 = config.attachmentConfiguration[0];
    if (config1.maximumNumberOfFiles === config1.minimumNumberOfFiles) {
      this.setState({
        creditNoteRequiredString: config1.minimumNumberOfFiles
      });
    } else {
      this.setState({
        creditNoteRequiredString:
          config1.minimumNumberOfFiles + " - " + config1.maximumNumberOfFiles
      });
    }
    let config2 = config.attachmentConfiguration[1];
    if (config2.maximumNumberOfFiles === config2.minimumNumberOfFiles) {
      this.setState({
        otherRequiredString: config2.minimumNumberOfFiles
      });
    } else {
      this.setState({
        otherRequiredString:
          config2.minimumNumberOfFiles + " - " + config2.maximumNumberOfFiles
      });
    }
  }

  resolveFileRequired() {
    function checkRequired(minimum) {
      console.log(minimum);
      if (minimum > 0) {
        return true;
      } else return false;
    }
    let fileConfig = this.state.configuration.attachmentConfiguration;
    fileConfig.forEach(config => {
      if (config.attachmentType === "CreditNote") {
        let required = false;
        if (checkRequired(config.minimumNumberOfFiles)) {
          required = true;
        }
        this.setState({
          isCreditNoteRequired: required,
          creditNoteFilesFormat: config.fileType
        });
      } else if (config.attachmentType === "Others") {
        let required = false;
        if (checkRequired(config.minimumNumberOfFiles)) {
          required = true;
        }
        this.setState({
          isOtherRequired: required,
          otherFilesFormat: config.fileType
        });
      }
    });
  }

  sliceFileName(fileName) {
    let ext = fileName.lastIndexOf(".");
    let fileNameWithoutExt = fileName.substr(0, ext);
    if (fileNameWithoutExt.length > 15) {
      let charArray = [...fileNameWithoutExt];
      let newFileName =
        charArray[0] +
        charArray[1] +
        charArray[2] +
        charArray[3] +
        "...." +
        charArray[charArray.length - 4] +
        charArray[charArray.length - 3] +
        charArray[charArray.length - 2] +
        charArray[charArray.length - 1];

      return newFileName + fileName.substr(ext);
    } else return fileName;
  }

  ///// NEXT & BACK //////

  async handleNext() {
    await this.props.updateState(this.state);
    this.props.nextStep();
  }

  async handleBack() {
    await this.props.updateState(this.state);
    this.props.previousStep();
  }

  routeCancel() {
    Router.push("/credit-note");
  }

  render() {
    const { t } = this.props;
    return (
      <BlockUi tag="div" blocking={this.state.blocking}>
        <div>
          <div id="cn_create" class="step-3">
            <div id="step-indicator" class="col-12">
              <ul class="d-flex justify-content-center">
                <li class="flex-fill finished no-gradient">
                  <div class="indicator step-1 rounded-circle text-center finished">
                    <span class="number">1</span>
                    <i class="fa fa-check" />
                  </div>
                  <p class="text-center">{t("Select Invoice")}</p>
                </li>
                <li class="flex-fill finished">
                  <div class="indicator step-2 rounded-circle text-center">
                    <span class="number">2</span>
                    <i class="fa fa-check" />
                  </div>
                  <p class="text-center">{t("Credit Note Items")}</p>
                </li>
                <li class="flex-fill active">
                  <div class="indicator step-3 rounded-circle text-center">
                    <span class="number">3</span>
                    <i class="fa fa-check" />
                  </div>
                  <p class="text-center">{t("Insert Credit Note Details")}</p>
                </li>
                <li class="flex-fill">
                  <div class="indicator step-4 rounded-circle text-center">
                    <span class="number">4</span>
                    <i class="fa fa-check" />
                  </div>
                  <p class="text-center">{t("Summary")}</p>
                </li>
              </ul>
            </div>
            <div class="page__header col-12">
              <h3>
                {t("Please Insert Credit Note Details and Attach Files")}{" "}
              </h3>
            </div>
            <form
              id="cnCreateForm"
              name="cnCreateForm"
              method="post"
              enctype="multipart/form-data"
              action=""
              class="form col-12 px-0"
            >
              <div class="box col-12 d-flex flex-wrap">
                {/* <div class="col-12 pb-3">
                  <h3>Please Insert Credit Note Details and Attach Files </h3>
                </div> */}
                <div
                  id="detail-section"
                  class="col-3 border-right border-1px border-lightgrey"
                >
                  <h5>{t("Insert Details")}</h5>
                  <div class="form-group has-float-label">
                    <input
                      type="text"
                      name="creditNote"
                      onChange={event => this.handleInputChange(event)}
                      id="cn_no"
                      maxlength="30"
                      value={this.state.creditNote}
                      placeholder={t("Credit Note No")}
                      class="form-control border border-1px border-lightgrey"
                    />
                    <label for="cn_no">{t("Credit Note No")} *</label>
                  </div>
                  <div class="form-group remark">
                    {this.state.isCreditNoteDup ? (
                      <span class="message error">
                        {t("Invalid Credit Note No")}
                      </span>
                    ) : (
                      ""
                    )}
                  </div>
                  <div class="form-group has-float-label">
                    <input
                      type="text"
                      name="creditNoteDate"
                      onChange={event => this.handleInputChange(event)}
                      id="cn_date"
                      placeholder={t("Credit Note Date")}
                      class="form-control border border-1px border-lightgrey datepicker"
                    />
                    <label for="cn_date">{t("Credit Note Date")} *</label>
                  </div>
                  {/* <div class="form-group remark">
                  {
                    this.state.isWarningActive ?
                      <span class="message error">This field is required</span>
                      : ""
                  }
                </div> */}
                  <div class="form-group remark hide">
                    <span class="message error" />
                  </div>
                  <div class="form-group has-float-label">
                    <textarea
                      name="creditNoteReason"
                      onChange={event => this.handleInputChange(event)}
                      value={this.state.creditNoteReason}
                      id="cn_reason"
                      placeholder={t("Credit Note Reason")}
                      class="form-control border border-1px border-lightgrey"
                      rows="5"
                      style={{ resize: "none" }}
                    />
                    <label for="cn_reason">{t("Credit Note Reason")} *</label>
                  </div>
                  {/* <div class="form-group remark">
                  {
                    this.state.isWarningActive ?
                      <span class="message error">This field is required</span>
                      : ""
                  }
                </div> */}
                  <div class="form-group remark hide">
                    <span class="message error" />
                  </div>
                </div>
                <div id="upload-section" class="col-6">
                  <h5>
                    <small>{t("Maximum file upload size 3 MB per file")}</small>
                  </h5>
                  <div class="d-flex flex-wrap">
                    <div id="box-1" class="col-12">
                      <h5>
                        {t("Credit Note")}{" "}
                        {this.state.isCreditNoteRequired === true ? "*" : ""}
                      </h5>
                      <div
                        class="uploadArea custom-fileUpload"
                        onDrop={() =>
                          this.handleDropFile(event, "attach_cn_file")
                        }
                        onDragOver={this.onDragOver}
                      >
                        <p class="text-center">{t("Drag & Drop files here")}</p>
                        <p class="text-center">{t("or")}</p>
                        <div class="upload-btn-wrapper">
                          <button
                            type="button"
                            class="btn btn--transparent btnUpload"
                          >
                            {t("Browse Files")}
                          </button>
                          <input
                            type="file"
                            name="attach_cn_file"
                            onChange={this.handleSelectedFile}
                          />
                        </div>
                      </div>
                      <p class="small mb-0">
                        {t("File type")}: {this.state.creditNoteFilesFormat},{" "}
                        {t("Required")}: {this.state.creditNoteRequiredString}{" "}
                        {t("files")}
                      </p>
                    </div>
                    <div id="box-2" class="col-12 my-3">
                      <h5>
                        {t("Other Documents")}{" "}
                        {this.state.isOtherRequired === true ? "*" : ""}
                      </h5>
                      <div
                        class="uploadArea custom-fileUpload"
                        onDrop={() =>
                          this.handleDropFile(event, "attach_other_file")
                        }
                        onDragOver={this.onDragOver}
                      >
                        <p class="text-center">{t("Drag & Drop files here")}</p>
                        <p class="text-center">{t("or")}</p>
                        <div class="upload-btn-wrapper">
                          <button
                            type="button"
                            class="btn btn--transparent btnUpload"
                          >
                            {t("Browse Files")}
                          </button>
                          <input
                            type="file"
                            name="attach_other_file"
                            onChange={this.handleSelectedFile}
                          />
                        </div>
                      </div>
                      <p class="small mb-0">
                        {t("File type")}: {this.state.otherFilesFormat},{" "}
                        {t("Required")}: {this.state.otherRequiredString}{" "}
                        {t("files")}
                      </p>
                    </div>
                  </div>
                </div>

                <div id="uploaded-list-section" class="col-3">
                  <h5>{t("Uploaded Files")}</h5>
                  <div id="uploadedLists" class="bg-grey rounded">
                    <ul>
                      <li>
                        <h5 class="medium">{t("Credit Note")}</h5>
                        <div class="border-top border-bottom border-1px border-grey">
                          {_.map(
                            this.state.creditNoteFiles,
                            ({ name, size }, index) => (
                              <p class="form-inline">
                                <span>
                                  <i class="fa fa-file" aria-hidden="true" />
                                  {this.sliceFileName(name)}
                                </span>
                                <span class="text-right">
                                  {(size * 0.001).toFixed(2)}K
                                </span>
                                <a
                                  href="javascript:void(0);"
                                  onClick={() =>
                                    this.handleDeselectedFile(
                                      "creditNoteFiles",
                                      index
                                    )
                                  }
                                  class="btnRemove"
                                >
                                  <i class="fa fa-times" />
                                </a>
                              </p>
                            )
                          )}
                        </div>
                      </li>
                      <li>
                        <h5 class="medium">{t("Other Documents")}</h5>
                        <div class="border-top border-bottom border-1px border-grey">
                          {_.map(
                            this.state.otherFiles,
                            ({ name, size }, index) => (
                              <p class="form-inline">
                                <span>
                                  <i class="fa fa-file" aria-hidden="true" />
                                  {this.sliceFileName(name)}
                                </span>
                                <span class="text-right">
                                  {(size * 0.001).toFixed(2)}K
                                </span>
                                <a
                                  href="javascript:void(0);"
                                  onClick={() =>
                                    this.handleDeselectedFile(
                                      "otherFiles",
                                      index
                                    )
                                  }
                                  class="btnRemove"
                                >
                                  <i class="fa fa-times" />
                                </a>
                              </p>
                            )
                          )}
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-12 text-center">
                  <button
                    type="button"
                    name="btnCancel"
                    id="btnCancel"
                    class="btn btn--transparent btn-wide"
                    data-toggle="modal"
                    data-target="#cancelWarning"
                  >
                    {t("Cancel")}
                  </button>
                  <button
                    type="button"
                    name="btnBack"
                    id="btnBack"
                    onClick={() => this.handleBack()}
                    class="btn btn--transparent btn-wide"
                  >
                    <i class="fa fa-chevron-left" /> {t("Back")}
                  </button>
                  {this.state.isReadyToNext === true &&
                  this.state.invoiceNo !== "" &&
                  this.state.invoiceDate !== "" ? (
                    <button
                      type="button"
                      name="btnNext"
                      id="btnNext"
                      onClick={() => this.handleNext()}
                      class="btn btn-wide"
                    >
                      {t("Next")} <i class="fa fa-chevron-right" />
                    </button>
                  ) : (
                    <button
                      disabled
                      type="button"
                      name="btnNext"
                      id="btnNext"
                      class="btn btn-wide"
                    >
                      {t("Next")} <i class="fa fa-chevron-right" />
                    </button>
                  )}
                </div>
              </div>
              <div class="row">&nbsp;</div>
            </form>

            <div
              id="cancelWarning"
              class="modal hide fade"
              tabindex="-1"
              role="dialog"
              aria-labelledby="cancel"
              aria-hidden="true"
            >
              <div class="modal-dialog modal-sm" role="document">
                <div class="modal-content">
                  <div class="modal-header">
                    <h3 id="myModalLabel" style={{ margin: "auto" }}>
                      Cancel
                    </h3>
                  </div>
                  <div class="modal-body text-center">
                    <div className="text">Do you want to cancel this CN?</div>
                  </div>
                  <div class="modal-footer justify-content-center">
                    <button
                      type="button"
                      name="btnCloseModal"
                      id="btnCloseModal"
                      class="btn btn-wide"
                      data-dismiss="modal"
                      aria-hidden="true"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      name="btnCloseModal"
                      id="btnCloseModal"
                      class="btn btn--transparent btn-wide"
                      data-dismiss="modal"
                      aria-hidden="true"
                      onClick={() => this.routeCancel()}
                    >
                      Yes
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div id="smallScreenCover">
              <p class="text-center">
                <img src="/static/img/icon_expanded.png" alt="" />
              </p>
            </div>
          </div>
          {/* <p><a href="javascript:void(0);" data-toggle="modal" data-target="#alertBox">Click ME!</a></p> */}

          <div
            id="alertBox"
            class="modal hide fade"
            tabindex="-1"
            role="dialog"
            aria-labelledby="alertBox"
            aria-hidden="true"
          >
            <div class="modal-dialog modal-lg" role="document">
              <div class="modal-content">
                <div class="modal-header justify-content-center">
                  <h3 id="myModalLabel">Error</h3>
                </div>
                <div class="modal-body d-flex justify-content-center">
                  <p>
                    The system cannot get attachment configuration because error
                    message
                  </p>
                </div>
                <div class="modal-footer justify-content-center">
                  <button
                    type="button"
                    name="btnCloseModal"
                    id="btnCloseModal"
                    class="btn btn-wide"
                    data-dismiss="modal"
                    aria-hidden="true"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div
            id="validationlWarning"
            class="modal hide fade"
            tabindex="-1"
            role="dialog"
            aria-labelledby="cancel"
            aria-hidden="true"
          >
            <div class="modal-dialog modal-lg" role="document">
              <div class="modal-content">
                <div class="modal-header">
                  <h3 id="myModalLabel" style={{ margin: "auto" }}>
                    Validation Error
                  </h3>
                </div>
                <div class="modal-body d-flex" style={{ margin: "auto" }}>
                  {this.state.validationErrorMsg}
                </div>
                <div class="modal-footer justify-content-center">
                  <button
                    type="button"
                    name="btnCloseModal"
                    id="btnCloseModal"
                    class="btn btn--transparent btn-wide"
                    data-dismiss="modal"
                    aria-hidden="true"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ModalAlert
          title={this.state.alertModalAlertTitle}
          visible={this.state.isAlertModalVisible}
          button={this.state.buttonAlert}
          isTextOnly={this.state.isTextOnly}
        >
          {this.state.alertModalMsg}
        </ModalAlert>
      </BlockUi>
    );
  }
}
export default withTranslation(["credit-create"])(createCreditNoteStepThree);
