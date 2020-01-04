import React, { Component } from "react";
import "daterangepicker";
import api from "../../../libs/api";
import moment from "moment";
import handleError from "../../../pages/handleError";
import ModalAlert, {
  BTN_ACTION_BACK,
  BTN_ACTION_CLOSE,
  BTN_ACTION_OK
} from "../../modalAlert";
import { i18n, withTranslation } from "~/i18n";
import CordaService from "../../../services/CordaService";
const invoiceFinancingActive = "btn btn-wide checkbox-btn";
const invoiceFinancingInactive = "btn btn--transparent btn-wide checkbox-btn";

import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";
import dynamic from "next/dynamic";
import followMeConfig from "../../../follow-me.json";
import { CREATE_INVOICE_STEP3 } from "../../../configs/followMe/createInvoiceStep";

const Tour = dynamic(() => import("~/components/custom-reactour"), {
  ssr: false
});
const accentColor = "#af3694";

class CreateStep3 extends Component {
  constructor(props) {
    super(props);
    this.cordaService = new CordaService();
    this.state = {
      currentActiveItems: 0,
      stepOneProp: {
        selectedItems: [],
        settings: {
          INVOICE_CONFIG: {
            invoiceFinancingIsAllowed: false,
            attachmentConfiguration: []
          }
        }
      },
      stepThreeProp: {
        paymentTerm: "",
        invoiceNo: "",
        invoiceDate: "",
        dueDate: "",
        receiptNo: "",
        taxInvoiceFiles: [],
        deliveryNoteFiles: [],
        receiptFiles: [],
        otherFiles: [],
        isPreferInvoiceFinancing: false
      },
      invoiceNumberFromGR: [],
      isInvoiceDuplicate: true,
      dueDate: "",

      flag: {
        taxInvoiceFileRequired: false,
        receiptFileRequired: false,
        deliveryNoteFileRequired: false,
        otherFileRequired: false
      },
      alertContent: {
        alertModalAlertTitle: "",
        isAlertModalVisible: false,
        buttonAlert: [],
        isTextOnly: true,
        alertModalMsg: ""
      },
      paymentDueDate: ""
    };
    this.BTN_CLOSE = [
      {
        label: "Close",
        attribute: {
          className: "btn btn--transparent btn-wide",
          onClick: this.handleDismissBtnModal
        }
      }
    ];
    this.apis = new api().group("createInvoice");
    this.apisGR = new api().group("gr");
  }

  componentWillMount() {
    this.setState({
      steps: CREATE_INVOICE_STEP3
    });
  }

  async componentDidMount() {
    let { stepOneProp, stepTwoProp, stepThreeProp } = this.props.mainstate;
    const tourFlag = false;
    if (!stepOneProp.settings.INVOICE_CONFIG.invoiceFinancingIsAllowed) {
      let NO_FINACING_STEP3 = CREATE_INVOICE_STEP3;
      NO_FINACING_STEP3.splice(3, 1);
      this.setState({
        steps: NO_FINACING_STEP3
      });
    }
    let invoiceNumberFromGR = [];
    stepTwoProp.forEach(item => {
      item.forEach(selectedGR => {
        if (selectedGR.invoiceExternalId)
          invoiceNumberFromGR.push(selectedGR.invoiceExternalId);
      });
    });
    invoiceNumberFromGR = [...new Set(invoiceNumberFromGR)];
    this.setState({
      paymentDueDate: stepThreeProp.paymentDueDate,
      invoiceNumberFromGR: invoiceNumberFromGR
    });

    await this.setState(this.props.mainstate);
    this.setStepThreeProp(
      "paymentTerm",
      stepOneProp.selectedItems[0].paymentTermDescription
    );

    this.setStepThreeProp(
      "taxInvoiceFiles",
      stepThreeProp.taxInvoiceFiles || []
    );
    this.setStepThreeProp(
      "deliveryNoteFiles",
      stepThreeProp.deliveryNoteFiles || []
    );
    this.setStepThreeProp("receiptFiles", stepThreeProp.receiptFiles || []);
    this.setStepThreeProp("otherFiles", stepThreeProp.otherFiles || []);
    if (invoiceNumberFromGR.length > 0) {
      this.setStepThreeProp(
        "invoiceNo",
        invoiceNumberFromGR.toString().substring(0, 30)
      );
    }

    this.setStepThreeProp("isPreferInvoiceFinancing", false);
    this.initDatePicker();
    //this.getCalculatedDueDate();

    // $(".datepicker").on("change", e => {
    //   if (e.target.id == "invoice_date") {
    //     this.setStepThreeProp("invoiceDate", e.target.value);
    //   }
    // });
    $("#invoice_no").val(stepThreeProp.invoiceNo || "");

    this.setStepThreeProp("invoiceDate", stepThreeProp.invoiceDate || "");

    let { attachmentConfiguration } = stepOneProp.settings.INVOICE_CONFIG;
    let fileConfigs = {
      taxInvoiceFiles: attachmentConfiguration.filter(r => {
        return r.attachmentType == "TaxInvoice";
      })[0],
      receiptFiles: attachmentConfiguration.filter(r => {
        return r.attachmentType == "Receipt";
      })[0],
      deliveryNoteFiles: attachmentConfiguration.filter(r => {
        return r.attachmentType == "DeliveryNote";
      })[0],
      otherFiles: attachmentConfiguration.filter(r => {
        return r.attachmentType == "Others";
      })[0]
    };
    let fileFlags = this.state.flag;
    for (let tcfg in fileConfigs) {
      let name = tcfg.substr(0, tcfg.length - 1);
      if (fileConfigs[tcfg].minimumNumberOfFiles > 0) {
        fileFlags[`${name}Required`] = true;
        // /taxInvoiceFileRequired = true;
      } else {
        fileFlags[`${name}Required`] = false;
      }
      let existsFiles = stepThreeProp[tcfg];
    }

    this.setState({ fileConfigs, flag: fileFlags });
    setTimeout(() => {
      if (followMeConfig.createInvoice.enableStep3) {
        // this.openTour();
      }
    }, 500);
  }

  queryPaymentDueDate = async val => {
    let { stepOneProp, stepTwoProp, stepThreeProp } = this.props.mainstate;
    let grItemList = [];
    let poLinearIdList = [];

    let obj = {
      category: "NORMAL",
      invoiceDate: val
      // poLinearIds: uniquePOLinearIds,
      //grLinearIds: null
    };

    stepTwoProp.forEach(i => {
      i.forEach(j => {
        if (j.goodsReceivedLinearId) {
          grItemList.push(j.goodsReceivedLinearId);
        }
      });
    });
    let uniqueGRLinearIds = [...new Set(grItemList)];
    // create invoice by GR
    if (uniqueGRLinearIds.length > 0) {
      obj.grLinearIds = uniqueGRLinearIds.toString();
      stepTwoProp.forEach(i => {
        i.forEach(j => {
          poLinearIdList.push(j.purchaseItem.purchaseOrderLinearId);
        });
      });
    } else {
      //create invoice by PO
      stepTwoProp.forEach(i => {
        i.forEach(j => {
          poLinearIdList.push(j.purchaseOrderLinearId);
        });
      });
    }
    let uniquePOLinearIds = [...new Set(poLinearIdList)];
    obj.poLinearIds = uniquePOLinearIds.toString();

    try {
      const res = await this.cordaService.callApi({
        group: "invoice",
        action: "queryDueDate",
        requestParams: obj
      });

      let dt = new Date(res.data.dueDate);
      let dd = dt.getDate();
      let mm = dt.getMonth() + 1;
      let yyyy = dt.getFullYear();
      if (dd < 10) {
        dd = "0" + dd;
      }
      if (mm < 10) {
        mm = "0" + mm;
      }

      let paymentDueDate = dd + "/" + mm + "/" + yyyy;
      this.setStepThreeProp("paymentDueDate", paymentDueDate);
      this.setState({
        paymentDueDate: paymentDueDate
      });
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }
  };

  setStepThreeProp = (key, val) => {
    if (key === "invoiceNo") {
      this.handleKeyInToCheckDuplicateInvoice(val);
    }
    this.setState({
      stepThreeProp: { ...this.state.stepThreeProp, [key]: val }
    });

    // await this.resolveAllowToNext();
  };

  handleKeyInToCheckDuplicateInvoice = async val => {
    let obj = {
      externalId: val,
      vendorTaxNumber: this.props.mainstate.stepOneProp.searchConfig
        .vendorTaxNumber
    };

    try {
      const res = await this.apis.call("checkDupInvoice", {}, { data: obj });
      this.setState({
        isInvoiceDuplicate: res
      });
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
      this.setState({
        isInvoiceDuplicate: false
      });
    }
  };

  initDatePicker() {
    let d = new Date();
    let todayDate =
      "" + d.getDate() + "/" + (d.getMonth() + 1) + "/" + (d.getFullYear() + 3);
    let { stepOneProp, stepTwoProp, stepThreeProp } = this.props.mainstate;
    let { INVOICE_CONFIG } = stepOneProp.settings;

    $(function() {
      let datePickerOpts = {
        singleDatePicker: true,
        showDropdowns: true,
        locale: {
          format: "DD/MM/YYYY"
        }
      };
      if (INVOICE_CONFIG.minimumDocumentEffectiveDate) {
        datePickerOpts = {
          ...datePickerOpts,
          minDate: moment(INVOICE_CONFIG.minimumDocumentEffectiveDate).format(
            "DD/MM/YYYY"
          )
        };
      }
      if (INVOICE_CONFIG.maximumDocumentEffectiveDate) {
        datePickerOpts = {
          ...datePickerOpts,
          maxDate: moment(INVOICE_CONFIG.maximumDocumentEffectiveDate).format(
            "DD/MM/YYYY"
          )
        };
      }
      $(".datepicker")
        .daterangepicker(datePickerOpts)
        .val(stepThreeProp.invoiceDate || "")
        .on("change", e => {
          $("#invoice_date").val(e.target.value);
        });
    });
  }

  resolveTypeOfFiles = attachType => {
    if (this.state.fileConfigs == undefined) {
      return "invalid type of file";
    }
    let cfg = this.state.fileConfigs[attachType];
    if (cfg == undefined) {
      return "invalid type of file";
    }
    return cfg.fileType;
  };
  resolveNumberOfFiles = attachType => {
    if (this.state.fileConfigs == undefined) {
      return "invalid type of number of file";
    }
    let cfg = this.state.fileConfigs[attachType];
    if (cfg == undefined) {
      return "invalid type of number of file";
    }
    let numberOfFile;
    if (cfg.minimumNumberOfFiles !== cfg.maximumNumberOfFiles) {
      numberOfFile = `${cfg.minimumNumberOfFiles} - ${cfg.maximumNumberOfFiles}`;
    } else {
      numberOfFile = cfg.minimumNumberOfFiles;
    }
    return numberOfFile;
  };
  resolveNumberOfFile = attachType => {
    const { INVOICE_CONFIG } = this.state.stepOneProp.settings;
    let numberOfFile = "";
    let ArrPosition = 0;
    if (INVOICE_CONFIG.attachmentConfiguration.length > 0) {
      switch (attachType) {
        case "taxInvoice":
          ArrPosition = 0;
          break;
        case "receipt":
          ArrPosition = 1;
          break;
        case "deliveryNote":
          ArrPosition = 2;
          break;
        case "others":
          ArrPosition = 3;
          break;

        default:
          ArrPosition = 99;
          break;
      }
      if (ArrPosition !== 99) {
        if (
          INVOICE_CONFIG.attachmentConfiguration[ArrPosition]
            .minimumNumberOfFiles !==
          INVOICE_CONFIG.attachmentConfiguration[ArrPosition]
            .maximumNumberOfFiles
        ) {
          numberOfFile = `${INVOICE_CONFIG.attachmentConfiguration[ArrPosition].minimumNumberOfFiles} - ${INVOICE_CONFIG.attachmentConfiguration[ArrPosition].maximumNumberOfFiles}`;
        } else {
          numberOfFile =
            INVOICE_CONFIG.attachmentConfiguration[ArrPosition]
              .minimumNumberOfFiles;
        }
      } else {
        return "invalid type of number of file";
      }

      return numberOfFile;
    }
  };

  resolveAllowToNext() {
    const { stepThreeProp } = this.state;
    if (stepThreeProp.taxInvoiceFiles) {
    }
  }

  preferInvoiceFinancing(isPreferInvoiceFinancing) {
    this.setStepThreeProp("isPreferInvoiceFinancing", isPreferInvoiceFinancing);
  }

  // DRAG DROP FILE METHOD
  handleDropFile = (event, filetype) => {
    event.preventDefault();
    let file = event.dataTransfer.items[0].getAsFile();
    this.addUploadFile(file, filetype);
    event.target.value = null;
  };

  onDragOver = event => {
    event.preventDefault();
  };

  handleSelectedFile = event => {
    let filetype = event.target.name;
    let files = event.target.files;
    let reader = new FileReader();
    reader.onload = e => {
      var img = document.createElement("img");
      img.onload = () => {
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        var MAX_WIDTH = 300;
        var MAX_HEIGHT = 300;
        var width = img.width;
        var height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        var dataurl = canvas.toDataURL("image/jpeg", 0.1);
        this.setState({ previewSrc: dataurl });
      };
      img.src = e.target.result;
    };

    const compressImg = reader.readAsDataURL(files[0]);
    this.addUploadFile(files[0], filetype);
    event.target.value = null;
  };

  sliceFileName = fileName => {
    if (!fileName) {
      return;
    }
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
  };

  handleDeselectedFile = (type, fileIndex) => {
    let files = this.state.stepThreeProp[type];
    files.splice(fileIndex, 1);

    this.setState(
      {
        type: files
      },
      () => {
        // this.resolveAllowToNext();
      }
    );
  };

  addUploadFile(file, filetype) {
    if (this.isValidToUpload(file, filetype)) {
      let data = new FormData();
      data.append("file", file);
      file.data = data;
      if (filetype === "attach_tax_invoice_file") {
        let taxInvoiceFiles = this.state.stepThreeProp.taxInvoiceFiles;
        taxInvoiceFiles.push(file);
        this.setStepThreeProp("taxInvoiceFiles", taxInvoiceFiles);
      } else if (filetype === "attach_receipt") {
        let receiptFiles = this.state.stepThreeProp.receiptFiles;
        receiptFiles.push(file);
        this.setStepThreeProp("receiptFiles", receiptFiles);
      } else if (filetype === "attach_delivery_file") {
        let deliveryNoteFiles = this.state.stepThreeProp.deliveryNoteFiles;
        deliveryNoteFiles.push(file);
        this.setStepThreeProp("deliveryNoteFiles", deliveryNoteFiles);
      } else if (filetype === "attach_other_file") {
        let otherFiles = this.state.stepThreeProp.otherFiles;
        otherFiles.push(file);
        this.setStepThreeProp("otherFiles", otherFiles);
      }
      //   this.resolveAllowToNext();
    }
    event.target.value = null;
  }
  handdleButtonNext = stepThreeProp => {
    let validate = true;
    for (let t in this.state.fileConfigs) {
      let f = this.state.stepThreeProp[t];
      let cfg = this.state.fileConfigs[t];

      if (
        f != undefined &&
        cfg != undefined &&
        cfg.minimumNumberOfFiles &&
        cfg.minimumNumberOfFiles
      ) {
        if (f.length < cfg.minimumNumberOfFiles) {
          validate = false;
        }
        if (f.length > cfg.maximumNumberOfFiles) {
          validate = false;
        }
        //return validate = true;
      }
    }
    if (stepThreeProp.invoiceDate == "") {
      validate = false;
    }
    if (stepThreeProp.invoiceNo == "" || stepThreeProp.invoiceNo == undefined) {
      validate = false;
    }
    // if (stepThreeProp.dueDate == "") {
    //   validate = false;
    // }
    if (this.state.isInvoiceDuplicate == false) {
      validate = false;
    }
    return validate;
  };
  isValidToUpload(file, fileType) {
    let { stepOneProp, stepThreeProp } = this.state;
    let { attachmentConfiguration } = stepOneProp.settings.INVOICE_CONFIG;
    if (file !== undefined) {
      let isNotExceeded = false;
      let isValidType = false;
      let isSizeNotExceeded = false;
      let filesConfig = attachmentConfiguration;
      if (fileType === "attach_tax_invoice_file") {
        let formats = attachmentConfiguration[0].fileType.split(",");
        formats.forEach(format => format.trim().toUpperCase());
        let ext = file.name.substring(
          file.name.lastIndexOf(".") + 1,
          file.name.length
        );

        if (
          stepThreeProp.taxInvoiceFiles.length <
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
            ...this.state.alertContent,
            alertModalAlertTitle: "Error Configuration",
            isAlertModalVisible: true,
            buttonAlert: [
              {
                label: "Close",
                attribute: {
                  className: "btn btn--transparent btn-wide",
                  onClick: this.handleDismissBtnModal
                }
              }
            ],
            isTextOnly: true,
            alertModalMsg: "File size is larger than 3mb."
          });
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
        let formats = attachmentConfiguration[1].fileType.split(",");
        formats.forEach(format => format.trim().toUpperCase());
        let ext = file.name.substring(
          file.name.lastIndexOf(".") + 1,
          file.name.length
        );

        if (
          stepThreeProp.receiptFiles.length <
          filesConfig[1].maximumNumberOfFiles
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
            ...this.state.alertContent,
            alertModalAlertTitle: "Error Configuration",
            isAlertModalVisible: true,
            buttonAlert: [
              {
                label: "Close",
                attribute: {
                  className: "btn btn--transparent btn-wide",
                  onClick: this.handleDismissBtnModal
                }
              }
            ],
            isTextOnly: true,
            alertModalMsg: "File size is larger than 3mb."
          });
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
        let formats = attachmentConfiguration[2].fileType.split(",");
        formats.forEach(format => format.trim().toUpperCase());
        let ext = file.name.substring(
          file.name.lastIndexOf(".") + 1,
          file.name.length
        );

        if (
          stepThreeProp.deliveryNoteFiles.length <
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
            ...this.state.alertContent,
            alertModalAlertTitle: "Error Configuration",
            isAlertModalVisible: true,
            buttonAlert: [
              {
                label: "Close",
                attribute: {
                  className: "btn btn--transparent btn-wide",
                  onClick: this.handleDismissBtnModal
                }
              }
            ],
            isTextOnly: true,
            alertModalMsg: "File size is larger than 3mb."
          });
        }

        if (isNotExceeded && isValidType && isSizeNotExceeded) {
          window.jQuery("#delivery-label-format").css("color", "black");
          window.jQuery("#delivery-label-count").css("color", "black");
          return true;
        } else {
          window.jQuery("#delivery-label-format").css("color", "red");
          window.jQuery("#delivery-label-count").css("color", "red");
          return false;
        }
      } else if (fileType === "attach_other_file") {
        let formats = attachmentConfiguration[3].fileType.split(",");
        formats.forEach(format => format.trim().toUpperCase());
        let ext = file.name.substring(
          file.name.lastIndexOf(".") + 1,
          file.name.length
        );

        if (
          stepThreeProp.otherFiles.length < filesConfig[3].maximumNumberOfFiles
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
          this.setState({
            ...this.state.alertContent,
            alertModalAlertTitle: "Error Configuration",
            isAlertModalVisible: true,
            buttonAlert: [
              {
                label: "Close",
                attribute: {
                  className: "btn btn--transparent btn-wide",
                  onClick: this.handleDismissBtnModal
                }
              }
            ],
            isTextOnly: true,
            alertModalMsg: "File size is larger than 3mb."
          });
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
  }

  handleDismissBtnModal = () => {
    this.setState({
      ...this.state.alertContent,
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      buttonAlert: []
    });
  };

  handleTimeoutModal = data => {
    this.alert(
      "Error !",
      [
        "Service temporarily unavailable. Please try again later.",
        <br />,
        "ไม่สามารถเชื่อมต่อกับระบบได้ในขณะนี้ กรุณาทำรายการใหม่อีกครั้ง",
        <hr />,
        <p class="text-left px-4">
          <strong>Status Code:</strong> {data.statusCode || err.code}
        </p>,
        <p class="text-left px-4">
          <strong>Error Message:</strong> {data.message || "-"}
        </p>
      ],
      this.BTN_CLOSE
    );
  };

  handleUnexpectedModal(data) {
    this.alert(
      "Error !",
      [
        "An unexpected error has occurred. Please try again later.",
        <br />,
        "เกิดปัญหาบางอย่างที่ระบบ กรุณาทำรายการใหม่อีกครั้ง",
        <hr />,
        <p class="text-left px-4">
          <strong>Status Code:</strong> {data.statusCode || "-"}
        </p>,
        <p class="text-left px-4">
          <strong>Error Message:</strong> {data.message || "-"}
        </p>
      ],
      this.BTN_CLOSE
    );
  }

  //   NEXT STEP
  nextStep = async () => {
    this.props.setMainState({ stepThreeProp: this.state.stepThreeProp });
    await this.enableBody($(".reactour__helper--is-open")[0]);
    this.props.nextStep();
  };

  openTour = () => {
    this.setState({ isTourOpen: true });
  };

  closeTour = () => {
    this.setState({ isTourOpen: false });
    this.enableBody($(".reactour__helper--is-open")[0]);
    this.props.closeTour();
  };

  disableBody = target => disableBodyScroll(target);
  enableBody = target => enableBodyScroll(target);

  renderTour() {
    return (
      <Tour
        steps={this.state.steps}
        closeWithMask={false}
        disableKeyboardNavigation={!followMeConfig.devVersion}
        disableInteraction={false}
        shadowClass="tour-shadow"
        showMaskNumber={true}
        showNumber={false}
        showCustomCloseButton={true}
        showButtons={false}
        showNavigation={false}
        showDVPanel={true}
        enableArrow={true}
        isOpen={this.props.openTour && this.props.appenv.ENABLE_TOUR}
        rounded={5}
        accentColor={accentColor}
        onRequestClose={this.closeTour}
        onAfterOpen={this.disableBody}
        onBeforeClose={this.enableBody}
        scrollDuration={500}
        updateDelay={300}
      />
    );
  }

  render() {
    const { t } = this.props;
    let {
      stepOneProp,
      stepTwoProp,
      stepThreeProp,
      dueDate,
      isInvoiceDuplicate,
      flag,
      paymentDueDate,
      alertContent
    } = this.state;
    let { INVOICE_CONFIG } = stepOneProp.settings;
    return (
      <div>
        {/* Start #invoice_create - Start */}
        {this.renderTour()}
        <div id="invoice_create" className="row">
          <div className="page__header col-12">
            <h2>{t("Please Insert Invoice Details")}</h2>
          </div>
          <div id="editForm" name="editForm" className="form col-12">
            <div className="box box--width-header col-12">
              <div className="box__header">
                <div className="justify-content-between align-items-center">
                  <h3>
                    {" "}
                    {t("Please Insert Invoice Details and Attached File")}{" "}
                    <small>{t("Maximum file upload size 3 MB per file")}</small>
                  </h3>
                </div>
              </div>
              {/* box__header */}
              <div className="box__inner d-flex">
                {/* Left Panel - Start */}
                <div
                  id="detail-section"
                  className="col-3 border-right border-1px border-lightgrey"
                >
                  <h5>{t("Insert Details")}</h5>
                  <div className="form-group has-float-label">
                    <input
                      type="text"
                      name="invoice_no"
                      id="invoice_no"
                      maxlength="30"
                      placeholder="Invoice No *"
                      value={
                        stepThreeProp.invoiceNo
                          ? stepThreeProp.invoiceNo
                          : this.state.invoiceNumberFromGR
                              .toString()
                              .substring(0, 30)
                      }
                      className="form-control border border-1px border-lightgrey"
                      autoComplete={false}
                      onChange={e => {
                        this.setState({
                          invoiceNumberFromGR: e.target.value
                        });
                        this.setStepThreeProp("invoiceNo", e.target.value);
                      }}
                    />
                    <label htmlFor="invoice_no">{t("Invoice No")} *</label>
                  </div>
                  <div class="form-group remark">
                    {!isInvoiceDuplicate ? (
                      <span class="message error">Invalid Invoice No</span>
                    ) : (
                      ""
                    )}
                  </div>
                  <div className="form-group has-float-label">
                    <input
                      type="text"
                      name="invoice_date"
                      id="invoice_date"
                      placeholder="Invoice Date *"
                      value={stepThreeProp.invoiceDate}
                      onBlur={e => {
                        this.setStepThreeProp("invoiceDate", e.target.value);
                        this.queryPaymentDueDate(e.target.value);
                      }}
                      className="form-control border border-1px border-lightgrey datepicker"
                    />
                    <label htmlFor="invoice_date">{t("Invoice Date")} *</label>
                  </div>
                  <div className="form-group has-float-label">
                    <input
                      type="text"
                      name="invoice_payment_term"
                      id="invoice_payment_term"
                      placeholder="Payment Term"
                      value={stepThreeProp.paymentTerm}
                      className="form-control border border-1px border-lightgrey"
                      disabled
                    />
                    <label htmlFor="invoice_payment_term">
                      {t("Payment Term")}
                    </label>
                  </div>
                  <div className="form-group has-float-label">
                    <input
                      type="text"
                      name="invoice_payment_DueDate"
                      id="invoice_payment_DueDate"
                      placeholder="Payment DueDate"
                      value={paymentDueDate}
                      className="form-control border border-1px border-lightgrey"
                      disabled
                    />
                    <label htmlFor="invoice_payment_term">
                      {t("Payment DueDate")}
                    </label>
                  </div>
                  {/* <div className="form-group has-float-label">
                    <input
                      type="text"
                      name="invoice_due_date"
                      id="invoice_due_date"
                      placeholder="Due Date"
                      className="form-control border border-1px border-lightgrey datepicker"
                      autoComplete={false}
                      value={dueDate}
                      disabled
                    />
                    <label htmlFor="invoice_due_date">Due Date</label>
                  </div> */}
                  <div className="form-group remark hide">
                    <span className="message error" />
                  </div>
                  <div className="form-group has-float-label">
                    <input
                      type="text"
                      name="receipt_no"
                      id="receipt_no"
                      placeholder="Receipt No"
                      value={stepThreeProp.receiptNo}
                      className="form-control border border-1px border-lightgrey"
                      onChange={e => {
                        this.setStepThreeProp("receiptNo", e.target.value);
                      }}
                    />
                    <label htmlFor="receipt_no">{t("Receipt No")}</label>
                  </div>
                  <div className="form-group remark hide">
                    <span className="message error" />
                  </div>
                  {INVOICE_CONFIG.invoiceFinancingIsAllowed == true ? (
                    <div id="invoice_financing" className="form-group">
                      <label className="form-label medium">
                        {t("Do you prefer Invoice financing?")}
                      </label>
                      <div className="d-flex">
                        <div
                          className={
                            this.state.stepThreeProp
                              .isPreferInvoiceFinancing === true
                              ? invoiceFinancingActive
                              : invoiceFinancingInactive
                          }
                        >
                          <div class="custom-control custom-radio">
                            <input
                              type="radio"
                              class="custom-control-input"
                              name="invoice_financing"
                              id="invoice_financing_y"
                              value="Y"
                              checked={
                                this.state.stepThreeProp
                                  .isPreferInvoiceFinancing
                              }
                              onClick={() => this.preferInvoiceFinancing(true)}
                            />
                            <label
                              className="custom-control-label"
                              htmlFor="invoice_financing_y"
                            >
                              {" "}
                              {t("Yes")}
                            </label>
                          </div>
                        </div>
                        <div
                          className={
                            this.state.stepThreeProp
                              .isPreferInvoiceFinancing === false
                              ? invoiceFinancingActive
                              : invoiceFinancingInactive
                          }
                        >
                          <div className="custom-control custom-radio">
                            <input
                              type="radio"
                              class="custom-control-input"
                              name="invoice_financing"
                              id="invoice_financing_n"
                              value="N"
                              checked={
                                !this.state.stepThreeProp
                                  .isPreferInvoiceFinancing
                              }
                              onClick={() => this.preferInvoiceFinancing(false)}
                            />
                            <label
                              className="custom-control-label"
                              htmlFor="invoice_financing_n"
                            >
                              {" "}
                              {t("No")}
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div />
                  )}
                </div>
                {/* Left Panel - End */}
                {/* Center Panel - Start */}
                <div id="upload-section" className="col-6">
                  {/* Row 1 - Start */}
                  <div className="d-flex">
                    {/* Box 1 - Start */}
                    <div id="box-1" className="col-6">
                      <h5>
                        {`${t("Tax Invoice")}${
                          flag.taxInvoiceFileRequired ? "*" : ""
                        }`}
                      </h5>
                      <div
                        className="uploadArea custom-fileUpload"
                        onDrop={() =>
                          this.handleDropFile(event, "attach_tax_invoice_file")
                        }
                        onDragOver={this.onDragOver}
                      >
                        <p className="text-center">
                          {t("Drag & Drop files here")}
                        </p>
                        <p className="text-center">{t("or")}</p>
                        <div className="upload-btn-wrapper">
                          <button
                            type="button"
                            className="btn btn--transparent btnUpload"
                          >
                            {t("Browse Files")}
                          </button>
                          <input
                            type="file"
                            name="attach_tax_invoice_file"
                            onChange={this.handleSelectedFile}
                          />
                        </div>
                      </div>
                      <p id="tax-label-format" className="small mb-0">
                        {t("File type")}:{" "}
                        {this.resolveTypeOfFiles("taxInvoiceFiles")}
                      </p>
                      <p
                        id="tax-label-count"
                        className="small mb-0 countUploadedFile"
                      >
                        {t("Number of Files")}:{" "}
                        <span className="number">
                          {this.resolveNumberOfFiles("taxInvoiceFiles")}
                        </span>
                      </p>
                    </div>
                    {/* Box 1 - End */}
                    {/* Box 2 - Start */}
                    <div id="box-2" className="col-6">
                      <h5>{`${t("Receipt")}${
                        flag.receiptFileRequired ? "*" : ""
                      }`}</h5>
                      <div
                        class="uploadArea custom-fileUpload"
                        onDrop={() =>
                          this.handleDropFile(event, "attach_receipt")
                        }
                        onDragOver={this.onDragOver}
                      >
                        <p className="text-center">
                          {t("Drag & Drop files here")}
                        </p>
                        <p className="text-center">{t("or")}</p>
                        <div class="upload-btn-wrapper">
                          <button
                            type="button"
                            class="btn btn--transparent btnUpload"
                          >
                            {t("Browse Files")}
                          </button>
                          <input
                            type="file"
                            name="attach_receipt"
                            onChange={this.handleSelectedFile}
                          />
                        </div>
                      </div>
                      <p id="receipt-label-format" className="small mb-0">
                        {t("File type")}:{" "}
                        {this.resolveTypeOfFiles("receiptFiles")}
                      </p>
                      <p
                        id="receipt-label-count"
                        className="small mb-0 countUploadedFile"
                      >
                        {t("Number of Files")}:{" "}
                        <span className="number">
                          {this.resolveNumberOfFiles("receiptFiles")}
                        </span>
                      </p>
                    </div>
                    {/* Box 2 - End */}
                  </div>
                  {/* Row 1 - End */}
                  {/* Row 2 - Start */}
                  <div className="d-flex">
                    {/* Box 3 - Start */}
                    <div id="box-3" className="col-6">
                      <h5>
                        {`${t("Delivery Note")}${
                          flag.deliveryNoteFileRequired ? "*" : ""
                        }`}
                      </h5>
                      <div
                        class="uploadArea custom-fileUpload"
                        onDrop={() =>
                          this.handleDropFile(event, "attach_delivery_file")
                        }
                        onDragOver={this.onDragOver}
                      >
                        <p className="text-center">
                          {t("Drag & Drop files here")}
                        </p>
                        <p className="text-center">{t("or")}</p>
                        <div class="upload-btn-wrapper">
                          <button
                            type="button"
                            class="btn btn--transparent btnUpload"
                          >
                            {t("Browse Files")}
                          </button>
                          <input
                            type="file"
                            name="attach_delivery_file"
                            onChange={this.handleSelectedFile}
                          />
                        </div>
                      </div>
                      <p id="delivery-label-format" className="small mb-0">
                        {t("File type")}:{" "}
                        {this.resolveTypeOfFiles("deliveryNoteFiles")}
                      </p>
                      <p
                        id="delivery-label-count"
                        className="small mb-0 countUploadedFile"
                      >
                        {t("Number of Files")}:{" "}
                        <span className="number">
                          {this.resolveNumberOfFiles("deliveryNoteFiles")}
                        </span>
                      </p>
                    </div>
                    {/* Box 3 - End */}
                    {/* Box 4 - Start */}
                    <div id="box-4" className="col-6">
                      <h5>
                        {`${t("Other Documents")}${
                          flag.otherFileRequired ? "*" : ""
                        }`}
                      </h5>
                      <div
                        class="uploadArea custom-fileUpload"
                        onDrop={() =>
                          this.handleDropFile(event, "attach_other_file")
                        }
                        onDragOver={this.onDragOver}
                      >
                        <p className="text-center">
                          {t("Drag & Drop files here")}
                        </p>
                        <p className="text-center">{t("or")}</p>
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

                      <p id="other-label-format" className="small mb-0">
                        {t("File type")}:{" "}
                        {this.resolveTypeOfFiles("otherFiles")}
                      </p>
                      <p
                        id="other-label-count"
                        className="small mb-0 countUploadedFile"
                      >
                        {t("Number of Files")}:{" "}
                        <span className="number">
                          {this.resolveNumberOfFiles("otherFiles")}
                        </span>
                      </p>
                    </div>
                    {/* Box 4 - End */}
                  </div>
                  {/* Row 2 - End */}
                </div>
                {/* Center Panel - End */}
                {/* Right Panel - Start */}
                <div id="uploaded-list-section" className="col-3">
                  <h5>{t("Uploaded Files")}</h5>
                  <div id="uploadedLists" className="bg-grey rounded">
                    <ul>
                      <li>
                        <h5 className="medium">{t("Tax Invoice")}</h5>
                        <div className="border-top border-bottom border-1px border-grey">
                          {stepThreeProp.taxInvoiceFiles
                            ? stepThreeProp.taxInvoiceFiles.map(
                                ({ name, size }, index) => {
                                  let filename = this.sliceFileName(name);
                                  return (
                                    <p class="form-inline" key={index}>
                                      <span>
                                        <i
                                          class="fa fa-file"
                                          aria-hidden="true"
                                        />
                                        {this.sliceFileName(name)}
                                      </span>
                                      <span class="text-right">
                                        {(size * 0.001).toFixed(2)}K
                                      </span>
                                      <a href="javascript:;" class="btnRemove">
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
                                  );
                                }
                              )
                            : ""}
                        </div>
                      </li>
                      <li>
                        <h5 className="medium">{t("Receipt")}</h5>
                        <div className="border-top border-bottom border-1px border-grey">
                          {stepThreeProp.receiptFiles
                            ? stepThreeProp.receiptFiles.map(
                                ({ name, size }, index) => {
                                  return (
                                    <p class="form-inline" key={index}>
                                      <span>
                                        <i
                                          class="fa fa-file"
                                          aria-hidden="true"
                                        />
                                        {this.sliceFileName(name)}
                                      </span>
                                      <span class="text-right">
                                        {(size * 0.001).toFixed(2)}K
                                      </span>
                                      <a href="javascript:;" class="btnRemove">
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
                                  );
                                }
                              )
                            : ""}
                        </div>
                      </li>
                      <li>
                        <h5 className="medium">{t("Delivery Note")}</h5>
                        <div className="border-top border-bottom border-1px border-grey">
                          {stepThreeProp.deliveryNoteFiles
                            ? stepThreeProp.deliveryNoteFiles.map(
                                ({ name, size }, index) => {
                                  return (
                                    <p class="form-inline" key={index}>
                                      <span>
                                        <i
                                          class="fa fa-file"
                                          aria-hidden="true"
                                        />
                                        {this.sliceFileName(name)}
                                      </span>
                                      <span class="text-right">
                                        {(size * 0.001).toFixed(2)}K
                                      </span>
                                      <a href="javascript:;" class="btnRemove">
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
                                  );
                                }
                              )
                            : ""}
                        </div>
                      </li>
                      <li>
                        <h5 className="medium">{t("Other Documents")}</h5>
                        <div className="border-top border-bottom border-1px border-grey">
                          {stepThreeProp.otherFiles
                            ? stepThreeProp.otherFiles.map(
                                ({ name, size }, index) => {
                                  return (
                                    <p class="form-inline" key={index}>
                                      <span>
                                        <i
                                          class="fa fa-file"
                                          aria-hidden="true"
                                        />
                                        {this.sliceFileName(name)}
                                      </span>
                                      <span class="text-right">
                                        {(size * 0.001).toFixed(2)}K
                                      </span>
                                      <a href="javascript:;" class="btnRemove">
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
                                  );
                                }
                              )
                            : ""}
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
                {/* Right Panel - End */}
              </div>
            </div>
            {/* Button - Start */}
            <div className="row">
              <div className="col-12 text-center">
                <span
                  className="wraper addBtnPanel"
                  style={{ padding: "10px 0 10px 0" }}
                >
                  <button
                    type="button"
                    name="btnCancel"
                    id="btnCancel"
                    className="btn btn--transparent"
                    onClick={() => {
                      this.props.Cancel();
                    }}
                  >
                    {t("Cancel")}
                  </button>
                  <button
                    type="button"
                    name="btnBack"
                    id="btnBack"
                    className="btn btn--transparent"
                    onClick={() => {
                      this.props.setMainState({
                        stepThreeProp: this.state.stepThreeProp
                      });
                      this.props.previousStep();
                    }}
                  >
                    <i className="fa fa-chevron-left" /> {t("Back")}
                  </button>
                  <button
                    type="button"
                    name="btnNext"
                    id="btnNext"
                    className="btn btn--transparent btn-purple"
                    disabled={
                      this.handdleButtonNext(this.state.stepThreeProp) == false
                    }
                    onClick={() => {
                      this.nextStep();
                    }}
                  >
                    {t("Next")} <i className="fa fa-chevron-right" />
                  </button>
                </span>
              </div>
            </div>
            <div className="row">&nbsp;</div>
            {/* Button - End */}
          </div>
        </div>
        {/* Start #invoice_create - End */}
        <ModalAlert
          title={alertContent.alertModalAlertTitle}
          visible={alertContent.isAlertModalVisible}
          button={alertContent.buttonAlert}
          isTextOnly={alertContent.isTextOnly}
        >
          {alertContent.alertModalMsg}
        </ModalAlert>
      </div>
    );
  }
}

export default withTranslation(["invoice-create"])(CreateStep3);
