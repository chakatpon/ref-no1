import React, { Component } from "react";
import _ from "lodash";
import ApiService from "../../libs/ApiService";
import Router from "next/router";
import BlockUi from "react-block-ui";

const Api = new ApiService();

class createInvoiceByPoStepThree extends Component {
  constructor(props) {
    super(props);
    this.state = {
      blocking: false,
      configuration: {},
      //Insert Details
      invoiceNo: "",
      invoiceDate: "",
      paymentTerm: "",
      dueDate: "",
      receiptNo: "",
      isPreferInvoiceFinancing: false,
      isInvoiceDup: false,
      //Upload Attachment
      taxInvoiceFiles: [],
      deliveryNoteFiles: [],
      receiptFiles: [],
      otherFiles: [],
      taxInvoiceRequiredString: "",
      deliveryNoteRequiredString: "",
      receiptRequiredString: "",
      otherRequiredString: "",
      isTaxInvoiceRequired: false,
      isDeliveryNoteRequired: false,
      isReceiptRequired: false,
      isOtherRequired: false,
      taxInvoiceFilesFormat: "",
      receiptFilesFormat: "",
      deliveryNoteFilesFormat: "",
      otherFilesFormat: "",
      //Validate
      isReadyToNext: false,
      validationErrorMsg: ""
    };
  }

  toggleBlocking() {
    this.setState({ blocking: !this.state.blocking });
  }

  async componentDidMount() {
    this.toggleBlocking();
    if (this.props.mainState.stepThreeProp === undefined) {
      await this.getConfiguration();
      await this.getCalculatedDueDate();
      this.initCalendar();
      this.toggleBlocking();
    } else {
      this.setState(
        {
          selectedPOItems: this.props.mainState.stepTwoProp.selectedPOItems,
          configuration: this.props.mainState.stepThreeProp.configuration,
          //Insert Details
          invoiceNo: this.props.mainState.stepThreeProp.invoiceNo,
          invoiceDate: this.props.mainState.stepThreeProp.invoiceDate,
          paymentTerm: this.props.mainState.stepThreeProp.paymentTerm,
          dueDate: this.props.mainState.stepThreeProp.dueDate,
          receiptNo: this.props.mainState.stepThreeProp.receiptNo,
          isPreferInvoiceFinancing: this.props.mainState.stepThreeProp
            .isPreferInvoiceFinancing,
          isInvoiceDup: this.props.mainState.stepThreeProp.isInvoiceDup,
          //Upload Attachment
          taxInvoiceFiles: this.props.mainState.stepThreeProp.taxInvoiceFiles,
          deliveryNoteFiles: this.props.mainState.stepThreeProp
            .deliveryNoteFiles,
          receiptFiles: this.props.mainState.stepThreeProp.receiptFiles,
          otherFiles: this.props.mainState.stepThreeProp.otherFiles,
          taxInvoiceRequiredString: this.props.mainState.stepThreeProp
            .taxInvoiceRequiredString,
          deliveryNoteRequiredString: this.props.mainState.stepThreeProp
            .deliveryNoteRequiredString,
          receiptRequiredString: this.props.mainState.stepThreeProp
            .receiptRequiredString,
          otherRequiredString: this.props.mainState.stepThreeProp
            .otherRequiredString,
          isTaxInvoiceRequired: this.props.mainState.stepThreeProp
            .isTaxInvoiceRequired,
          isDeliveryNoteRequired: this.props.mainState.stepThreeProp
            .isDeliveryNoteRequired,
          isReceiptRequired: this.props.mainState.stepThreeProp
            .isReceiptRequired,
          isOtherRequired: this.props.mainState.stepThreeProp.isOtherRequired,
          taxInvoiceFilesFormat: this.props.mainState.stepThreeProp
            .taxInvoiceFilesFormat,
          receiptFilesFormat: this.props.mainState.stepThreeProp
            .receiptFilesFormat,
          deliveryNoteFilesFormat: this.props.mainState.stepThreeProp
            .deliveryNoteFilesFormat,
          otherFilesFormat: this.props.mainState.stepThreeProp.otherFilesFormat,
          isReadyToNext: this.props.mainState.stepThreeProp.isReadyToNext
        },
        async () => {
          this.getConfiguration();
          await this.getCalculatedDueDate();
          this.initCalendar("existed");
          this.toggleBlocking();
        }
      );
    }
  }

  initCalendar(existed) {
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
        this.setState(
          {
            [event.target.name]: window.jQuery("#" + event.target.id).val()
          },
          () => this.resolveAllowToNext()
        );
      });

    if (this.state.invoiceDate === "") {
      window.jQuery(".datepicker").val("");
    } else {
      if (existed !== undefined) {
        window
          .jQuery("#invoice_date")
          .data("daterangepicker")
          .setStartDate(this.state.invoiceDate);
        window
          .jQuery("#invoice_date")
          .data("daterangepicker")
          .setEndDate(this.state.invoiceDate);
      }
    }
  }

  resolveAllowToNext() {
    if (
      this.state.invoiceNo === "" ||
      this.state.invoiceDate === "" ||
      !this.resolveFilesRequiredUploaded() ||
      this.state.isInvoiceDup
    ) {
      this.setState({
        isReadyToNext: false
      });
    } else {
      this.setState({
        isReadyToNext: true
      });
    }
  }

  resolveFilesRequiredUploaded() {
    let taxUploaded = true;
    let deliveryUploaded = true;
    let receiptUploaded = true;
    let otherUploaded = true;
    if (this.state.isTaxInvoiceRequired) {
      if (this.state.taxInvoiceFiles.length === 0) {
        taxUploaded = false;
      }
    }
    if (this.state.isDeliveryNoteRequired) {
      if (this.state.deliveryNoteFiles.length === 0) {
        deliveryUploaded = false;
      }
    }
    if (this.state.isReceiptRequired) {
      if (this.state.receiptFiles.length === 0) {
        receiptUploaded = false;
      }
    }
    if (this.state.isOtherRequired) {
      if (this.state.otherFiles.length === 0) {
        otherUploaded = false;
      }
    }

    return taxUploaded && deliveryUploaded && receiptUploaded && otherUploaded;
  }

  async getConfiguration() {
    let legalName = this.props.mainState.stepOneProp.selectedPO.buyer.legalName;
    let businessPlaceTaxNumber = this.props.mainState.stepOneProp.selectedPO
      .businessPlaceTaxNumber;
    let vendorTaxNumber = this.props.mainState.stepOneProp.selectedPO
      .vendorTaxNumber;
    this.setState({
      paymentTerm: this.props.mainState.stepOneProp.selectedPO
        .paymentTermDescription
    });
    await Api.getInvoiceConfiguration(
      legalName,
      businessPlaceTaxNumber,
      vendorTaxNumber
    )
      .then(res => {
        this.setState({
          configuration: res
        });
      })
      .then(() => {
        this.resolveFileRequired();
      });
    this.populateNumberRequiredFileString();
  }

  async getCalculatedDueDate() {
    let paymentTermDays = this.props.mainState.stepOneProp.selectedPO
      .paymentTermDays;
    let calDueDate = moment().add(paymentTermDays, "days");
    let legalName = this.props.mainState.stepOneProp.selectedPO.buyer.legalName;
    let businessPlaceTaxNumber = this.props.mainState.stepOneProp.selectedPO
      .businessPlaceTaxNumber;
    let calendarKey = this.props.mainState.stepTwoProp.selectedPOItems[
      this.props.mainState.stepTwoProp.populatedPO[0].poNumber
    ]["item"][0].calendarKey;
    Api.getCalculateddDueDate(
      legalName,
      businessPlaceTaxNumber,
      moment(calDueDate).format("DD/MM/YYYY"),
      true,
      calendarKey
    ).then(res => {
      this.setState({
        dueDate: moment(res.nextWorkingDay).format("DD/MM/YYYY")
      });
    });
  }

  async handleInputChange(event) {
    console.log(event);
    this.setState({
      [event.target.name]: event.target.value
    });

    if (event.target.name === "invoiceNo") {
      this.handleKeyInToCheckDuplicateInvoice(event.target.value);
    }

    await this.resolveAllowToNext();
  }

  handleKeyInToCheckDuplicateInvoice(keyInInvoice) {
    let json = {
      externalId: keyInInvoice,
      vendorTaxNumber: this.props.mainState.stepOneProp.selectedPO
        .vendorTaxNumber
    };
    Api.postValidateInvoice(json)
      .then(res => {
        if (res.data) {
          this.setState({
            isInvoiceDup: false
          });
        } else {
          this.setState({
            isInvoiceDup: true
          });
        }
      })
      .then(() => {
        this.resolveAllowToNext();
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
      let data = new FormData();
      data.append("file", file);
      file.data = data;
      if (filetype === "attach_tax_invoice_file") {
        let taxInvoiceFiles = this.state.taxInvoiceFiles;
        taxInvoiceFiles.push(file);
        this.setState({
          taxInvoiceFiles: taxInvoiceFiles
        });
      } else if (filetype === "attach_receipt") {
        let receiptFiles = this.state.receiptFiles;
        receiptFiles.push(file);
        this.setState({
          receiptFiles: receiptFiles
        });
      } else if (filetype === "attach_delivery_file") {
        let deliveryNoteFiles = this.state.deliveryNoteFiles;
        deliveryNoteFiles.push(file);
        this.setState({
          deliveryNoteFiles: deliveryNoteFiles
        });
      } else if (filetype === "attach_other_file") {
        let otherFiles = this.state.otherFiles;
        otherFiles.push(file);
        this.setState({
          otherFiles: otherFiles
        });
      }
      this.resolveAllowToNext();
    }
    event.target.value = null;
  }

  isValidToUpload(file, fileType) {
    if (file !== undefined) {
      let isNotExceeded = false;
      let isValidType = false;
      let isSizeNotExceeded = false;
      let filesConfig = this.state.configuration.attachmentConfiguration;
      if (fileType === "attach_tax_invoice_file") {
        let formats = this.state.taxInvoiceFilesFormat.split(",");
        formats.forEach(format => format.trim().toUpperCase());
        let ext = file.name.substring(
          file.name.lastIndexOf(".") + 1,
          file.name.length
        );

        if (
          this.state.taxInvoiceFiles.length <
          filesConfig[0].maximumNumberOfFiles
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
          window.jQuery("#tax-label-format").css("color", "black");
          window.jQuery("#tax-label-count").css("color", "black");
          return true;
        } else {
          window.jQuery("#tax-label-format").css("color", "red");
          window.jQuery("#tax-label-count").css("color", "red");
          return false;
        }
      } else if (fileType === "attach_receipt") {
        let formats = this.state.receiptFilesFormat.split(",");
        formats.forEach(format => format.trim().toUpperCase());
        let ext = file.name.substring(
          file.name.lastIndexOf(".") + 1,
          file.name.length
        );

        if (
          this.state.receiptFiles.length < filesConfig[1].maximumNumberOfFiles
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
          window.jQuery("#receipt-label-format").css("color", "black");
          window.jQuery("#receipt-label-count").css("color", "black");
          return true;
        } else {
          window.jQuery("#receipt-label-format").css("color", "red");
          window.jQuery("#receipt-label-count").css("color", "red");
          return false;
        }
      } else if (fileType === "attach_delivery_file") {
        let formats = this.state.deliveryNoteFilesFormat.split(",");
        formats.forEach(format => format.trim().toUpperCase());
        let ext = file.name.substring(
          file.name.lastIndexOf(".") + 1,
          file.name.length
        );

        if (
          this.state.deliveryNoteFiles.length <
          filesConfig[2].maximumNumberOfFiles
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
          window.jQuery("#receipt-label-format").css("color", "black");
          window.jQuery("#receipt-label-count").css("color", "black");
          return true;
        } else {
          window.jQuery("#delivery-label-format").css("color", "red");
          window.jQuery("#delivery-label-count").css("color", "red");
          return false;
        }
      } else if (fileType === "attach_other_file") {
        let formats = this.state.otherFilesFormat.split(",");
        formats.forEach(format => format.trim().toUpperCase());
        let ext = file.name.substring(
          file.name.lastIndexOf(".") + 1,
          file.name.length
        );

        if (
          this.state.otherFiles.length < filesConfig[3].maximumNumberOfFiles
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
          window.jQuery("#receipt-label-format").css("color", "black");
          window.jQuery("#receipt-label-count").css("color", "black");
          return true;
        } else {
          window.jQuery("#other-label-format").css("color", "red");
          window.jQuery("#other-label-count").css("color", "red");
          return false;
        }
      }
    }
  }

  preferInvoiceFinancing() {
    this.setState({
      isPreferInvoiceFinancing: true
    });
  }

  notPreferInvoiceFinancing() {
    this.setState({
      isPreferInvoiceFinancing: false
    });
  }

  populateNumberRequiredFileString() {
    let config = this.state.configuration;
    let config1 = config.attachmentConfiguration.filter(
      config => config.attachmentType === "TaxInvoice"
    );
    config1 = config1.length ? config1[0] : {};
    if (config1.maximumNumberOfFiles === config1.minimumNumberOfFiles) {
      this.setState({
        taxInvoiceRequiredString: config1.minimumNumberOfFiles
      });
    } else {
      this.setState({
        taxInvoiceRequiredString:
          config1.minimumNumberOfFiles + " - " + config1.maximumNumberOfFiles
      });
    }
    let config2 = config.attachmentConfiguration.filter(
      config => config.attachmentType === "Receipt"
    );
    config2 = config2.length ? config2[0] : {};
    if (config2.maximumNumberOfFiles === config2.minimumNumberOfFiles) {
      this.setState({
        receiptRequiredString: config2.minimumNumberOfFiles
      });
    } else {
      this.setState({
        receiptRequiredString:
          config2.minimumNumberOfFiles + " - " + config2.maximumNumberOfFiles
      });
    }
    let config3 = config.attachmentConfiguration.filter(
      config => config.attachmentType === "DeliveryNote"
    );
    config3 = config3.length ? config3[0] : {};
    if (config3.maximumNumberOfFiles === config3.minimumNumberOfFiles) {
      this.setState({
        deliveryNoteRequiredString: config3.minimumNumberOfFiles
      });
    } else {
      this.setState({
        deliveryNoteRequiredString:
          config3.minimumNumberOfFiles + " - " + config3.maximumNumberOfFiles
      });
    }
    let config4 = config.attachmentConfiguration.filter(
      config => config.attachmentType === "TaxInvoice"
    );
    config4 = config4.length ? config4[0] : {};
    if (config4.maximumNumberOfFiles === config4.minimumNumberOfFiles) {
      this.setState({
        otherRequiredString: config4.minimumNumberOfFiles
      });
    } else {
      this.setState({
        otherRequiredString:
          config4.minimumNumberOfFiles + " - " + config4.maximumNumberOfFiles
      });
    }
  }

  resolveFileRequired() {
    function checkRequired(minimum) {
      if (minimum > 0) {
        return true;
      } else return false;
    }
    let fileConfig = this.state.configuration.attachmentConfiguration;
    fileConfig.forEach(config => {
      if (config.attachmentType === "TaxInvoice") {
        let required = false;
        if (checkRequired(config.minimumNumberOfFiles)) {
          required = true;
        }
        this.setState({
          isTaxInvoiceRequired: required,
          taxInvoiceFilesFormat: config.fileType
        });
      } else if (config.attachmentType === "Receipt") {
        let required = false;
        if (checkRequired(config.minimumNumberOfFiles)) {
          required = true;
        }
        this.setState({
          isReceiptRequired: required,
          receiptFilesFormat: config.fileType
        });
      } else if (config.attachmentType === "DeliveryNote") {
        let required = false;
        if (checkRequired(config.minimumNumberOfFiles)) {
          required = true;
        }
        this.setState({
          isDeliveryNoteRequired: required,
          deliveryNoteFilesFormat: config.fileType
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
    Router.push("/invoice");
  }

  render() {
    const invoiceFinancingActive = "btn btn-wide checkbox-btn";
    const invoiceFinancingInactive =
      "btn btn--transparent btn-wide checkbox-btn";
    return (
      <BlockUi tag="div" blocking={this.state.blocking}>
        <div>
          <div id="invoice_create" class="row">
            <div id="step-indicator" className="col-12">
              <ul className="d-flex justify-content-center">
                <li className="flex-fill finished">
                  <div className="indicator step-1 rounded-circle text-center">
                    <span className="number">1</span>
                    <i className="fa fa-check" />
                  </div>
                  <p className="text-center">Select Type of Invoice</p>
                </li>
                <li className="flex-fill finished">
                  <div className="indicator step-2 rounded-circle text-center">
                    <span className="number">2</span>
                    <i className="fa fa-check" />
                  </div>
                  <p className="text-center">Select Items</p>
                </li>
                <li className="flex-fill active">
                  <div className="indicator step-3 rounded-circle text-center">
                    <span className="number">3</span>
                    <i className="fa fa-check" />
                  </div>
                  <p className="text-center">Insert Invoice Details</p>
                </li>
                <li className="flex-fill">
                  <div className="indicator step-4 rounded-circle text-center">
                    <span className="number">4</span>
                    <i className="fa fa-check" />
                  </div>
                  <p className="text-center">Summary</p>
                </li>
              </ul>
            </div>
            <div class="page__header col-12">
              <h3> Please Insert Invoice Details and Attched File </h3>
              {/* <a
                href="https://support.b2p.in"
                id="btnHelp"
                target="_blank"
                data-toggle="tooltip"
                data-placement="bottom"
                title="Help!"
              >
                <i class="fa fa-question-circle" />
              </a> */}
            </div>
            <form
              id="editForm"
              name="editForm"
              method="post"
              enctype="multipart/form-data"
              action=""
              class="form col-12"
            >
              <div class="box box--width-header col-12">
                <div class="box__inner d-flex">
                  <div
                    id="detail-section"
                    class="col-3 border-right border-1px border-lightgrey"
                  >
                    <h5>Insert Details</h5>
                    <div class="form-group has-float-label">
                      <input
                        type="text"
                        name="invoiceNo"
                        onChange={event => this.handleInputChange(event)}
                        id="invoice_no"
                        maxlength="30"
                        value={this.state.invoiceNo}
                        placeholder="Invoice No *"
                        class="form-control border border-1px border-lightgrey"
                      />
                      <label for="invoice_no">Invoice No *</label>
                    </div>
                    <div class="form-group remark">
                      {this.state.isInvoiceDup === true ? (
                        <span class="message error">Invalid Invoice No</span>
                      ) : (
                        ""
                      )}
                    </div>
                    <div class="form-group has-float-label">
                      <input
                        type="text"
                        name="invoiceDate"
                        onChange={() => this.handleInputChange(event)}
                        id="invoice_date"
                        placeholder="Invoice Date *"
                        class="form-control border border-1px border-lightgrey datepicker"
                      />
                      <label for="invoice_date">Invoice Date *</label>
                    </div>
                    <div class="form-group remark hide">
                      <span class="message error" />
                    </div>
                    <div class="form-group has-float-label">
                      <input
                        disabled
                        type="text"
                        name="paymentTerm"
                        onChange={event => this.handleInputChange(event)}
                        id="invoice_payment_term"
                        placeholder="Payment Term"
                        value={this.state.paymentTerm}
                        class="form-control border border-1px border-lightgrey"
                      />
                      <label for="invoice_payment_term">Payment Term</label>
                    </div>
                    <div class="form-group remark hide">
                      <span class="message error" />
                    </div>
                    <div class="form-group has-float-label">
                      <input
                        disabled
                        type="text"
                        name="dueDate"
                        onChange={event => this.handleInputChange(event)}
                        id="invoice_due_date"
                        value={this.state.dueDate}
                        placeholder="Expected Due Date"
                        class="form-control border border-1px border-lightgrey datepicker"
                      />
                      <label for="invoice_due_date">Expected Due Date</label>
                    </div>
                    <div class="form-group remark hide">
                      <span class="message error" />
                    </div>
                    <div class="form-group has-float-label">
                      <input
                        type="text"
                        name="receiptNo"
                        onChange={event => this.handleInputChange(event)}
                        id="receipt_no"
                        value={this.state.receiptNo}
                        placeholder="Receipt No"
                        class="form-control border border-1px border-lightgrey"
                      />
                      <label for="receipt_no">Receipt No</label>
                    </div>
                    <div class="form-group remark hide">
                      <span class="message error" />
                    </div>
                    {this.state.configuration.invoiceFinancingIsAllowed ===
                    true ? (
                      <div class="form-group">
                        <label class="form-label medium">
                          Do you prefer Invoice financing?
                        </label>
                        <div class="d-flex">
                          <div
                            class={
                              this.state.isPreferInvoiceFinancing === true
                                ? invoiceFinancingActive
                                : invoiceFinancingInactive
                            }
                          >
                            <div class="custom-control custom-radio">
                              <input
                                onClick={() => this.preferInvoiceFinancing()}
                                type="radio"
                                class="custom-control-input"
                                name="invoice_financing"
                                id="invoice_financing_y"
                                value="Y"
                                checked={this.state.isPreferInvoiceFinancing}
                              />
                              <label
                                class="custom-control-label"
                                for="invoice_financing_y"
                              >
                                {" "}
                                Yes
                              </label>
                            </div>
                          </div>
                          <div
                            class={
                              this.state.isPreferInvoiceFinancing === false
                                ? invoiceFinancingActive
                                : invoiceFinancingInactive
                            }
                          >
                            <div class="custom-control custom-radio">
                              <input
                                onClick={() => this.notPreferInvoiceFinancing()}
                                type="radio"
                                class="custom-control-input"
                                name="invoice_financing"
                                id="invoice_financing_n"
                                value="N"
                                checked={!this.state.isPreferInvoiceFinancing}
                              />
                              <label
                                class="custom-control-label"
                                for="invoice_financing_n"
                              >
                                {" "}
                                No
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      ""
                    )}
                  </div>
                  <div id="upload-section" class="col-6">
                    <h5 id="file-label-size">
                      <small>Maximum file upload size 3 MB per file.</small>
                    </h5>
                    <div class="d-flex">
                      <div id="box-1" class="col-6">
                        <h5>
                          Tax Invoice
                          {this.state.isTaxInvoiceRequired === true ? "*" : ""}
                        </h5>
                        <div
                          class="uploadArea custom-fileUpload"
                          onDrop={() =>
                            this.handleDropFile(
                              event,
                              "attach_tax_invoice_file"
                            )
                          }
                          onDragOver={this.onDragOver}
                        >
                          <p class="text-center">Drag &amp; Drop files here</p>
                          <p class="text-center">or</p>
                          <div class="upload-btn-wrapper">
                            <button
                              type="button"
                              class="btn btn--transparent btnUpload"
                            >
                              Browse Files
                            </button>
                            <input
                              type="file"
                              name="attach_tax_invoice_file"
                              onChange={this.handleSelectedFile}
                            />
                          </div>
                        </div>
                        <p id="tax-label-format" class="small mb-0">
                          File type: {this.state.taxInvoiceFilesFormat}
                        </p>
                        <p
                          id="tax-label-count"
                          class="small mb-0 countUploadedFile"
                        >
                          Number of Files:{" "}
                          <span class="number">
                            {this.state.taxInvoiceRequiredString}
                          </span>
                        </p>
                      </div>
                      <div id="box-2" class="col-6">
                        <h5>
                          Receipt
                          {this.state.isReceiptRequired === true ? "*" : ""}
                        </h5>
                        <div
                          class="uploadArea custom-fileUpload"
                          onDrop={() =>
                            this.handleDropFile(event, "attach_receipt")
                          }
                          onDragOver={this.onDragOver}
                        >
                          <p class="text-center">Drag &amp; Drop files here</p>
                          <p class="text-center">or</p>
                          <div class="upload-btn-wrapper">
                            <button
                              type="button"
                              class="btn btn--transparent btnUpload"
                            >
                              Browse Files
                            </button>
                            <input
                              type="file"
                              name="attach_receipt"
                              onChange={this.handleSelectedFile}
                            />
                          </div>
                        </div>
                        <p id="receipt-label-format" class="small mb-0">
                          File type: {this.state.receiptFilesFormat}
                        </p>
                        <p
                          id="receipt-label-count"
                          class="small mb-0 countUploadedFile"
                        >
                          Number of Files:{" "}
                          <span class="number">
                            {this.state.receiptRequiredString}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div class="d-flex">
                      <div id="box-3" class="col-6">
                        <h5>
                          Delivery Note
                          {this.state.isDeliveryNoteRequired === true
                            ? "*"
                            : ""}
                        </h5>
                        <div
                          class="uploadArea custom-fileUpload"
                          onDrop={() =>
                            this.handleDropFile(event, "attach_delivery_file")
                          }
                          onDragOver={this.onDragOver}
                        >
                          <p class="text-center">Drag &amp; Drop files here</p>
                          <p class="text-center">or</p>
                          <div class="upload-btn-wrapper">
                            <button
                              type="button"
                              class="btn btn--transparent btnUpload"
                            >
                              Browse Files
                            </button>
                            <input
                              type="file"
                              name="attach_delivery_file"
                              onChange={this.handleSelectedFile}
                            />
                          </div>
                        </div>
                        <p id="delivery-label-format" class="small mb-0">
                          File type: {this.state.deliveryNoteFilesFormat}
                        </p>
                        <p
                          id="delivery-label-count"
                          class="small mb-0 countUploadedFile"
                        >
                          Number of Files:{" "}
                          <span class="number">
                            {this.state.deliveryNoteRequiredString}
                          </span>
                        </p>
                      </div>
                      <div id="box-4" class="col-6">
                        <h5>
                          Other Documents
                          {this.state.isOtherRequired === true ? "*" : ""}
                        </h5>
                        <div
                          class="uploadArea custom-fileUpload"
                          onDrop={() =>
                            this.handleDropFile(event, "attach_other_file")
                          }
                          onDragOver={this.onDragOver}
                        >
                          <p class="text-center">Drag &amp; Drop files here</p>
                          <p class="text-center">or</p>
                          <div class="upload-btn-wrapper">
                            <button
                              type="button"
                              class="btn btn--transparent btnUpload"
                            >
                              Browse Files
                            </button>
                            <input
                              type="file"
                              name="attach_other_file"
                              onChange={this.handleSelectedFile}
                            />
                          </div>
                        </div>
                        <p id="other-label-format" class="small mb-0">
                          File type: {this.state.otherFilesFormat}
                        </p>
                        <p
                          id="other-label-count"
                          class="small mb-0 countUploadedFile"
                        >
                          Number of Files:{" "}
                          <span class="number">
                            {this.state.otherRequiredString}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div id="uploaded-list-section" class="col-3">
                    <h5>Uploaded Files</h5>
                    <div id="uploadedLists" class="bg-grey rounded">
                      <ul>
                        <li>
                          <h5 class="medium">Tax Invoice</h5>
                          <div class="border-top border-bottom border-1px border-grey">
                            {_.map(
                              this.state.taxInvoiceFiles,
                              ({ name, size }, index) => (
                                <p class="form-inline">
                                  <span>
                                    <i class="fa fa-file" aria-hidden="true" />
                                    {this.sliceFileName(name)}
                                  </span>
                                  <span class="text-right">
                                    {(size * 0.001).toFixed(2)}K
                                  </span>
                                  <a href="#" class="btnRemove">
                                    <i
                                      onClick={() =>
                                        this.handleDeselectedFile(
                                          "taxInvoiceFiles",
                                          index
                                        )
                                      }
                                      class="fa fa-times"
                                    />
                                  </a>
                                </p>
                              )
                            )}
                          </div>
                        </li>
                        <li>
                          <h5 class="medium">Delivery Note</h5>
                          <div class="border-top border-bottom border-1px border-grey">
                            {_.map(
                              this.state.deliveryNoteFiles,
                              ({ name, size }, index) => (
                                <p class="form-inline">
                                  <span>
                                    <i class="fa fa-file" aria-hidden="true" />{" "}
                                    {this.sliceFileName(name)}
                                  </span>
                                  <span class="text-right">
                                    {(size * 0.001).toFixed(2)}K
                                  </span>
                                  <a href="#" class="btnRemove">
                                    <i
                                      onClick={() =>
                                        this.handleDeselectedFile(
                                          "deliveryNoteFiles",
                                          index
                                        )
                                      }
                                      class="fa fa-times"
                                    />
                                  </a>
                                </p>
                              )
                            )}
                          </div>
                        </li>
                        <li>
                          <h5 class="medium">Receipt</h5>
                          <div class="border-top border-bottom border-1px border-grey">
                            {_.map(
                              this.state.receiptFiles,
                              ({ name, size }, index) => (
                                <p class="form-inline">
                                  <span>
                                    <i class="fa fa-file" aria-hidden="true" />{" "}
                                    {this.sliceFileName(name)}
                                  </span>
                                  <span class="text-right">
                                    {(size / 1000).toFixed(2)}K
                                  </span>
                                  <a href="#" class="btnRemove">
                                    <i
                                      onClick={() =>
                                        this.handleDeselectedFile(
                                          "receiptFiles",
                                          index
                                        )
                                      }
                                      class="fa fa-times"
                                    />
                                  </a>
                                </p>
                              )
                            )}
                          </div>
                        </li>
                        <li>
                          <h5 class="medium">Other Documents</h5>
                          <div class="border-top border-bottom border-1px border-grey">
                            {_.map(
                              this.state.otherFiles,
                              ({ name, size }, index) => (
                                <p class="form-inline">
                                  <span>
                                    <i class="fa fa-file" aria-hidden="true" />{" "}
                                    {this.sliceFileName(name)}
                                  </span>
                                  <span class="text-right">
                                    {(size * 0.001).toFixed(2)}K
                                  </span>
                                  <a href="#" class="btnRemove">
                                    <i
                                      onClick={() =>
                                        this.handleDeselectedFile(
                                          "otherFiles",
                                          index
                                        )
                                      }
                                      class="fa fa-times"
                                    />
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
                    Cancel
                  </button>
                  <button
                    type="button"
                    name="btnBack"
                    id="btnBack"
                    onClick={() => this.handleBack()}
                    class="btn btn--transparent btn-wide"
                  >
                    <i class="fa fa-chevron-left" /> Back
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
                      Next <i class="fa fa-chevron-right" />
                    </button>
                  ) : (
                    <button
                      disabled
                      type="button"
                      name="btnNext"
                      id="btnNext"
                      class="btn btn-wide"
                    >
                      Next <i class="fa fa-chevron-right" />
                    </button>
                  )}
                  {/* <button type="button" name="btnNext" id="btnNext" onClick={() => this.handleNext()} class="btn btn-purple" >Next <i class="fa fa-chevron-right"></i></button> */}
                </div>
              </div>
              <div class="row">&nbsp;</div>
            </form>
            <div id="smallScreenCover">
              <p class="text-center">
                <img src="img/icon_expanded.png" alt="" />
              </p>
            </div>
          </div>
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
                <div class="modal-body d-flex col-12 justify-content-center">
                  <div className="text">
                    Do you want to cancel this invoice?
                  </div>
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
      </BlockUi>
    );
  }
}

export default createInvoiceByPoStepThree;
