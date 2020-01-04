import React, { Component } from "react";
import moment from "moment";
import io from "socket.io-client";
import api from "../../../libs/api";
import BlockUi from "react-block-ui";
import handleError from "../../../pages/handleError";
import ModalAlert, {
  BTN_ACTION_BACK,
  BTN_ACTION_CLOSE,
  BTN_ACTION_OK
} from "../../modalAlert";
import { i18n, withTranslation } from "~/i18n";
import Router from "next/router";
import { formatNumber, numberOnly, GrThead } from "../edit/models/item";
import Step4Panel from "./components/Step4Panel";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";
import dynamic from "next/dynamic";
import followMeConfig from "../../../follow-me.json";
import { CREATE_INVOICE_STEP4 } from "../../../configs/followMe/createInvoiceStep";
import GA from "~/libs/ga";

const Tour = dynamic(() => import("~/components/custom-reactour"), {
  ssr: false
});
const accentColor = "#af3694";

class CreateStep4 extends Component {
  constructor(props) {
    super(props);
    this.apis = new api().group("createInvoice");
    this.state = {
      entryDate: moment(),
      stepOneProp: {
        mainPO: { seller: {}, customisedFields: {} },
        globalParam: {}
      },
      stepTwoProp: {},
      stepThreeProp: {
        taxInvoiceFiles: [],
        deliveryNoteFiles: [],
        receiptFiles: [],
        otherFiles: []
      },

      vendorBranchList: [],
      selectedVendorBranch: this.props.mainstate.stepFourProp
        .selectedVendorBranch,
      isNotGetVendorBranchList: false,
      flag: {
        isNotGetVendorBranchList: false,

        isChangeSubTotalTaxTotal: false
      },
      subTotal: {},
      taxTotal: {},
      POItems: [],
      alertContent: {
        alertModalAlertTitle: "",
        isAlertModalVisible: false,
        buttonAlert: [],
        isTextOnly: true,
        alertModalMsg: ""
      },
      blocking: false
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
  }
  async componentWillMount() {
    this.setState({
      steps: CREATE_INVOICE_STEP4
    });
    await this.setState(this.props.mainstate);
    await this.initialValue();
    await this.setDefaultVendorBranchList();
  }

  componentWillUnmount() {
    this.socket.disconnect();
  }

  async componentDidMount() {
    const { t } = this.props;
    const columnDisplayText = t("Column Display");
    const exportText = t("Export");
    this.socket = io.connect("/create-invoice");

    $(document).ready(() => {
      makePopover(columnDisplayText, exportText);
    });
    setTimeout(() => {
      if (followMeConfig.createInvoice.PO.enableStep4) {
        this.openTour();
      }
    }, 500);
    await this.getVendorBranchList();
    await this.preparePOItemsForCreateInvoice();
    await this.getInvoiceSummary();
    // await this.prepareFileAttachment();
  }

  //   INITIALYZE DATA
  setDefaultVendorBranchList = async () => {
    if (!this.props.mainstate.stepFourProp.selectedVendorBranch) {
      const { mainPO, settings } = this.state.stepOneProp;
      let data = {
        address: mainPO.vendorAddress1,
        street: mainPO.vendorAddress1,
        district: mainPO.vendorDistrict,
        city: mainPO.vendorCity,
        postalCode: mainPO.vendorPostalCode,
        vendorName: mainPO.vendorName,
        branchCode: mainPO.vendorBranchCode,
        name: mainPO.vendorBranchName,
        companyCode: mainPO.companyCode,
        taxId: mainPO.vendorTaxNumber,
        def: true,
        id: 0
      };
      await this.setState({
        ...this.state,
        selectedVendorBranch: data.id,
        vendorBranchList: [...this.state.vendorBranchList, data]
      });

      if (settings.INVOICE_CONFIG.defaultVendorBranch == "PO") {
      } else {
        this.setState({
          ...this.setState,
          selectedVendorBranch: -1,
          stepOneProp: {
            ...this.state.stepOneProp,
            mainPO: {
              ...this.state.stepOneProp.mainPO,
              vendorAddress1: "",
              vendorDistrict: "",
              vendorCity: "",
              vendorPostalCode: "",
              vendorBranchCode: "",
              vendorBranchName: ""
            }
          }
        });
      }
    } else {
      const { vendorBranchList } = this.props.mainstate.stepFourProp;
      const value = this.props.mainstate.stepFourProp.selectedVendorBranch;
      const { mainPO, settings } = this.state.stepOneProp;
      let data = {
        address: mainPO.vendorAddress1,
        street: mainPO.vendorAddress1,
        district: mainPO.vendorDistrict,
        city: mainPO.vendorCity,
        postalCode: mainPO.vendorPostalCode,
        vendorName: mainPO.vendorName,
        branchCode: mainPO.vendorBranchCode,
        name: mainPO.vendorBranchName,
        companyCode: mainPO.companyCode,
        taxId: mainPO.vendorTaxNumber,
        def: true,
        id: 0
      };
      await this.setState({
        ...this.state,
        vendorBranchList: [...this.state.vendorBranchList, data]
      });
      if (value == -1) {
        this.setState({
          ...this.state,
          selectedVendorBranch: value,
          stepOneProp: {
            ...this.state.stepOneProp,
            mainPO: {
              ...this.state.stepOneProp.mainPO,
              vendorAddress1: "",
              vendorDistrict: "",
              vendorCity: "",
              vendorPostalCode: "",
              vendorBranchCode: "",
              vendorBranchName: ""
            }
          }
        });
        return;
      }
      if (vendorBranchList.length > 0) {
        const vendorBranch = await vendorBranchList.find(item => {
          return item.id == value;
        });
        this.setState({
          ...this.state,
          selectedVendorBranch: value,
          stepOneProp: {
            ...this.state.stepOneProp,
            mainPO: {
              ...this.state.stepOneProp.mainPO,
              vendorAddress1: vendorBranch.address,
              vendorDistrict: vendorBranch.district,
              vendorCity: vendorBranch.city,
              vendorPostalCode: vendorBranch.postalCode,
              vendorBranchCode: vendorBranch.branchCode,
              vendorBranchName: vendorBranch.name
            }
          }
        });
      }
      $("#vendorAddress").css("color", "#d40e78");
    }
  };
  getVendorBranchList = async () => {
    const { seller, vendorTaxNumber } = this.state.stepOneProp.mainPO;
    let obj = {
      legalName: seller.legalName,
      taxId: vendorTaxNumber
    };
    try {
      const res = await this.apis.call("getVendorBranchList", obj);
      this.setVendorBranchList(res);
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
      this.setState({
        isNotGetVendorBranchList: true
      });
    }
  };
  setVendorBranchList = async res => {
    let vendorBranchList = this.state.vendorBranchList;
    vendorBranchList = vendorBranchList.concat(res);
    await this.setState({
      vendorBranchList
    });
  };

  initialValue = async () => {
    const { stepFourProp } = this.state;
    const { flag } = this.state;
    const POItems = await this.setPOItems();
    this.setState({ POItems });
    if (stepFourProp.flag) {
      if (stepFourProp.flag.isChangeSubTotalTaxTotal) {
        this.setState({
          subTotal: stepFourProp.subTotal,
          taxTotal: stepFourProp.taxTotal,
          flag: { isChangeSubTotalTaxTotal: true }
        });
      } else {
        const subTotal = await this.calPOItemsSubTotal(POItems);
        const taxTotal = await this.calPOItemsTaxTotal(POItems);
        this.setState({
          subTotal,
          taxTotal
        });
      }
    } else {
      const subTotal = await this.calPOItemsSubTotal(POItems);
      const taxTotal = await this.calPOItemsTaxTotal(POItems);
      this.setState({
        subTotal,
        taxTotal
      });
    }

    // if (stepFourProp !== {}) {
    //   console.log("TRUE OBJ");
    //   if (stepFourProp.flag) {
    //     if (!stepFourProp.flag.isChangeSubTotalTaxTotal) {
    //       const subTotal = await this.calPOItemsSubTotal(POItems);
    //       const taxTotal = await this.calPOItemsTaxTotal(POItems);
    //       this.setState({
    //         subTotal,
    //         taxTotal
    //       });
    //     } else {
    //       this.setState({
    //         subTotal: stepFourProp.subTotal,
    //         taxTotal: stepFourProp.taxTotal
    //       });
    //     }
    //   }
    // } else {
    //   console.log("ELSE");
    //   const subTotal = await this.calPOItemsSubTotal(POItems);
    //   const taxTotal = await this.calPOItemsTaxTotal(POItems);
    //   this.setState({
    //     subTotal,
    //     taxTotal
    //   });
    // }
  };

  setPOItems = () => {
    let POItems = [];
    if (this.state.stepTwoProp.length > 0) {
      this.state.stepTwoProp.map(item => {
        item.map(itm => {
          POItems.push(itm);
        });
      });
    }

    return POItems;
  };

  calPOItemsSubTotal(POItems) {
    let subTotal = 0;

    POItems.map(item => {
      subTotal += Number(item.selectAmount);
    });

    return parseFloat(subTotal.toFixed(2));
  }

  calPOItemsTaxTotal(POItems) {
    let taxTotal = 0;
    let taxSumMapping = {};

    POItems.forEach(item => {
      if (_.has(taxSumMapping, `tax${item.taxRate}`)) {
        taxSumMapping[`tax${item.taxRate}`] += +item.selectAmount;
      } else {
        taxSumMapping[`tax${item.taxRate}`] = +item.selectAmount;
      }
    });

    _.forOwn(taxSumMapping, (value, key) => {
      taxTotal = taxTotal + +this.calTax(value, key.replace("tax", ""));
    });

    return taxTotal;
  }

  calTax(amount, percentage) {
    return parseFloat(
      (
        parseFloat(amount.toFixed(2)) *
        parseFloat((percentage / 100).toFixed(2))
      ).toFixed(2)
    );
  }

  //   EVENT
  onChangeVendorBranch = async e => {
    const { vendorBranchList } = this.state;
    const value = e.target.value;
    if (value == -1) {
      this.setState({
        ...this.state,
        selectedVendorBranch: value,
        stepOneProp: {
          ...this.state.stepOneProp,
          mainPO: {
            ...this.state.stepOneProp.mainPO,
            vendorAddress1: "",
            vendorDistrict: "",
            vendorCity: "",
            vendorPostalCode: "",
            vendorBranchCode: "",
            vendorBranchName: ""
          }
        }
      });
      return;
    }
    if (vendorBranchList.length > 0) {
      const vendorBranch = await vendorBranchList.find(item => {
        return item.id == value;
      });
      this.setState({
        ...this.state,
        selectedVendorBranch: value,
        stepOneProp: {
          ...this.state.stepOneProp,
          mainPO: {
            ...this.state.stepOneProp.mainPO,
            vendorAddress1: vendorBranch.address,
            vendorDistrict: vendorBranch.district,
            vendorCity: vendorBranch.city,
            vendorPostalCode: vendorBranch.postalCode,
            vendorBranchCode: vendorBranch.branchCode,
            vendorBranchName: vendorBranch.name
          }
        }
      });
    }
    $("#vendorAddress").css("color", "#d40e78");
  };

  createInvoice = async () => {
    this.setState({
      blocking: true
    });
    const data = await this.prepareDataForCreateInvoice();
    const aToken = this.props.token;
    try {
      this.toggleBlocking();
      const data = await this.prepareDataForCreateInvoice();
      const aToken = this.props.token;

      GA.event({
        category: "Invoice",
        action: "Submit inv Ref.PO (Request)",
        label: `Invoice | ${data[0].externalId} | ${moment().format()}`
        // value: data[0].invoiceTotal
      });

      if (this.props.appenv.INV_CREATE_SUBMIT_SYNC === undefined) {
        await this.apis.call("createInvoice", {}, { data: data });
        this.setState({
          blocking: false
        });
        GA.event({
          category: "Invoice",
          action: "Submit inv Ref.PO (Success)",
          label: `Invoice | ${data[0].externalId} | ${moment().format()}`,
          value: data[0].invoiceTotal
        });
        Router.push("/invoice");
      } else {
        if (this.props.appenv.INV_CREATE_SUBMIT_SYNC == false) {
          this.socket.emit("create-invoice-po", data, aToken);
          this.setState({
            blocking: false
          });
          Router.push("/invoice");
        } else {
          await this.apis.call("createInvoice", {}, { data: data });
          this.setState({
            blocking: false
          });
          GA.event({
            category: "Invoice",
            action: "Submit inv Ref.PO (Success)",
            label: `Invoice | ${data[0].externalId} | ${moment().format()}`,
            value: data[0].invoiceTotal
          });
          Router.push("/invoice");
        }
      }
    } catch (err) {
      GA.event({
        category: "Invoice",
        action: "Submit inv Ref.PO (Failed)",
        label: `Invoice | ${data[0].externalId} | ${moment().format()}`
      });

      this.setState({
        blocking: false
      });
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
      console.error(err);
    }
  };

  getInvoiceSummary = async () => {
    try {
      const data = await this.prepareDataForCreateInvoice();
      let res = await this.apis.call(
        "getInvoiceSummary",
        {},
        { data: data[0] }
      );
      this.setState({
        retentionAmount: res.retentionAmount,
        estimatedPayable: res.estimatedPayable,
        withholdingTaxTotal: res.withholdingTaxTotal
      });
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
      console.error(err);
    }
  };

  prepareDataForCreateInvoice = async () => {
    const {
      stepOneProp,
      stepTwoProp,
      stepThreeProp,
      subTotal,
      taxTotal,
      POItems
    } = this.state;
    this.setState({
      uploadFailed: false
    });
    let invoiceFinancing = "N";

    if (stepThreeProp.isPreferInvoiceFinancing) {
      invoiceFinancing = "Y";
    }

    //   file upload
    const fileAttachments = await this.prepareFileAttachment();
    if (this.state.uploadFailed) {
      this.setState({
        uploadFailed: false
      });
      return false;
    }
    let preparedPOItems = await this.preparePOItemsForCreateInvoice();

    let invoiceObj = [
      {
        vendorNumber: stepOneProp.mainPO.vendorNumber,
        vendorBranchCode: stepOneProp.mainPO.vendorBranchCode,
        vendorBranchName: stepOneProp.mainPO.vendorBranchName,
        vendorName: stepOneProp.mainPO.vendorName,
        vendorTaxNumber: stepOneProp.mainPO.vendorTaxNumber,
        vendorAddress: `${stepOneProp.mainPO.vendorAddress1 || ""} ${stepOneProp
          .mainPO.vendorDistrict || ""} ${stepOneProp.mainPO.vendorCity ||
          ""} ${stepOneProp.mainPO.vendorPostalCode || ""}`,
        vendorTelephone: stepOneProp.mainPO.vendorTelephone,
        companyCode: stepOneProp.mainPO.companyCode,
        companyName: stepOneProp.mainPO.companyName,
        companyTaxNumber: stepOneProp.mainPO.businessPlaceTaxNumber,
        companyBranchCode: stepOneProp.mainPO.companyBranchCode,
        companyBranchName: stepOneProp.mainPO.companyBranchName,
        companyAddress: `${stepOneProp.mainPO.businessPlaceAddress1 ||
          ""} ${stepOneProp.mainPO.businessPlaceDistrict || ""} ${stepOneProp
          .mainPO.businessPlaceCity || ""} ${stepOneProp.mainPO
          .businessPlacePostalCode || ""}`,
        companyTelephone: stepOneProp.mainPO.businessPlaceTelephone,
        paymentTermCode: stepOneProp.mainPO.paymentTermCode,
        paymentTermDays: stepOneProp.mainPO.paymentTermDays,
        paymentTermDesc: stepOneProp.mainPO.paymentTermDescription,
        currency: stepTwoProp[0][0].poItemUnitPriceCurrency,

        subTotal: subTotal,
        vatTotal: taxTotal,
        invoiceTotal: parseFloat(
          (Number(subTotal) + Number(taxTotal)).toFixed(2)
        ),
        externalId: stepThreeProp.invoiceNo.trim(),
        invoiceDate: stepThreeProp.invoiceDate,
        //dueDate: stepThreeProp.dueDate,
        invoiceCreatedDate: moment().format(),
        invoiceFinancing: invoiceFinancing,

        receiptNumber: stepThreeProp.receiptNo
          ? stepThreeProp.receiptNo.trim()
          : "",

        items: preparedPOItems,

        buyer: stepOneProp.mainPO.buyer,
        seller: stepOneProp.mainPO.seller,

        fileAttachments
      }
    ];
    return invoiceObj;
  };

  prepareFileAttachment = async () => {
    try {
      let attachmentArr = [];
      const { stepThreeProp } = this.state;
      let uploadGroups = {
        TaxInvoice: stepThreeProp.taxInvoiceFiles,
        Receipt: stepThreeProp.receiptFiles,
        DeliveryNote: stepThreeProp.deliveryNoteFiles,
        Others: stepThreeProp.otherFiles
      };
      for (let grp in uploadGroups) {
        let files = uploadGroups[grp];
        let cont = true;
        for (let f in files) {
          let attachment = await this.doUploadFile(files[f]);
          if (!attachment) {
            cont = false;
            this.setState({
              uploadFailed: true
            });
            break;
          }
          let attachmentObj = {
            attachmentHash: attachment[0].attachmentHash,
            attachmentName: attachment[0].attachmentName,
            attachmentType: grp
          };
          attachmentArr.push(attachmentObj);
        }
        if (!cont) {
          break;
        }
      }
      return attachmentArr;
    } catch (err) {
      alert(err.message);
    }
  };

  preparePOItemsForCreateInvoice = () => {
    const { POItems } = this.state;

    let data = POItems.map((item, index) => {
      let obj = {
        purchaseOrderExternalId: item.poNumber,
        purchaseItemExternalId: item.poItemNo,
        externalId: index + 1,
        materialDescription: item.materialDescription,
        quantity: {
          initial: item.selectQty,
          unit: item.quantity.unit
        },
        unitDescription: item.unitDescription,
        currency: item.poItemUnitPriceCurrency,
        unitPrice: item.poItemUnitPrice,
        itemSubTotal: parseFloat(item.selectAmount),
        vatCode: item.taxCode,
        vatRate: item.taxRate,
        site: item.site,
        siteDescription: item.siteDescription,
        withholdingTaxRate: item.withholdingTaxPercent,
        withholdingTaxCode: item.withholdingTaxCode
      };

      return obj;
    });

    return data;
  };

  doUploadFile = async file => {
    try {
      const res = await this.apis.call("uploadFile", {}, { data: file.data });
      return res;
    } catch (err) {
      const message = [
        "Unable to create an invoice because it failed to upload attachment(s).",
        <br />,
        "Please try again."
      ];
      const response = handleError(message, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
      return false;
    }
  };

  //  METHOD FOR RENDER
  formatNumber(amount, digit) {
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      maximumFractionDigits: digit,
      minimumFractionDigits: digit
    }).format(amount);
  }

  sliceFileName = fileName => {
    if (fileName) {
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
  };

  toggleBlocking = () => {
    this.setState({
      blocking: !this.state.blocking
    });
  };

  handleDismissBtnModal = () => {
    this.setState({
      ...this.state.alertContent,
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      alertModalMsg: "",
      buttonAlert: []
    });
  };

  validateStatus = () => {
    if (this.state.stepOneProp.mainPO.vendorBranchCode === "") {
      return true;
    }
    return false;
  };

  onChangeInput = e => {
    if (!this.state.flag.isChangeSubTotalTaxTotal) {
      this.setState({
        flag: { ...this.state.flag, isChangeSubTotalTaxTotal: true }
      });
    }
    // e.target.value = this.formatNumberInput(e.target.value, 2);
    this.setState({ [e.target.name]: e.target.value });
  };

  formatNumberInput(input, decimal) {
    let valueReplace = input.replace(/[^0-9.]/gm, "");
    let valueSplit = valueReplace.split(".");
    let interger = valueSplit[0];
    let fraction = "";

    if (input.endsWith(".")) {
      fraction =
        valueSplit[1] === "" ? "." : "." + valueSplit[1].substring(0, decimal);
    } else {
      fraction =
        valueSplit[1] === undefined
          ? ""
          : "." + valueSplit[1].substring(0, decimal);
    }

    return fraction === ""
      ? interger.replace("-", "")
      : (interger + fraction).replace("-", "");
  }

  handleBackBtn = () => {
    // this.setState(this.props.mainstate);
    this.props.setMainState({ stepFourProp: this.state });
    this.props.previousStep();
  };
  numberOnly(event, digitAmount) {
    let input = event.target.value.replace(/[^0-9.]/gm, "");
    let valueReplace = input.replace(/[^0-9.]/gm, "");
    let valueSplit = valueReplace.split(".");
    let digit = valueReplace.replace(".", "");
    let cursorPosition = event.currentTarget.selectionStart;
    let integer = valueSplit[0];
    let decimal = valueSplit[1];
    let typablePosition = digit.length - (decimal ? decimal.length : 0);

    if (
      window.getSelection().toString().length == 0 &&
      ((event.which >= "48" && event.which <= "57") || event.which == "46")
    ) {
      if (event.target.value.indexOf(".") !== -1) {
        if (
          (digit.length >= 16 || decimal.length >= 16 - digitAmount) &&
          event.which != "46"
        ) {
          if (
            (cursorPosition > typablePosition ||
              integer.length >= digitAmount) &&
            event.which != "46"
          ) {
            event.preventDefault();
          }
        } else if (event.which == "46") {
          event.preventDefault();
        }
      } else {
        if (integer.length >= digitAmount && event.which != "46") {
          event.preventDefault();
        }
      }
    } else if (
      (event.which < "48" || event.which > "57") &&
      event.which != "46"
    ) {
      event.preventDefault();
    }
  }
  handleSubTotalValidation = async e => {
    let val = parseFloat(e.target.value.replace(/,/g, ""));
    let colorDefault = "#626262";
    let res = false;
    if (val >= 0) {
      res = true;
    }
    if (!res) {
      $(e.target).css("color", "red");
    } else {
      $(e.target).css("color", colorDefault);
    }
    return res;
  };
  handleSubTotalChange = async e => {
    if (e.target.value == "" || isNaN(Number(e.target.value))) {
      e.target.value = formatNumber(0, 2);
      this.state.subTotal = formatNumber(0, 2);
    } else {
      e.target.value = parseFloat(e.target.value.replace(/,/g, "")).toFixed(2);
      this.state.subTotal = parseFloat(e.target.value.replace(/,/g, ""));
      e.target.value = formatNumber(e.target.value.replace(/,/g, ""), 2);
    }

    // this.changeFlagIsChangeSubTotalTaxTotal();
    // this.calInvoiceTotal();
    this.onChangeInput(e);
  };
  handleSubTotalFocus = e => {
    e.target.value = e.target.value.replace(/,/g, "");
    if (e.target.value == 0) {
      e.target.value = "";
    }
    e.target.select();
    let arr = e.target.id.split("subTotal");
    let itemRef = arr[1];
    // let row = JSON.parse(e.target.getAttribute("data-row"));
  };
  handleTaxTotalValidation = async e => {
    let val = parseFloat(e.target.value.replace(/,/g, ""));
    let colorDefault = "#626262";
    let res = false;
    if (val >= 0) {
      res = true;
    }
    if (!res) {
      $(e.target).css("color", "red");
    } else {
      $(e.target).css("color", colorDefault);
    }
    return res;
  };
  handleTaxTotalChange = async e => {
    if (e.target.value == "" || isNaN(Number(e.target.value))) {
      e.target.value = formatNumber(0, 2);
      this.state.taxTotal = formatNumber(0, 2);
    } else {
      e.target.value = parseFloat(e.target.value.replace(/,/g, "")).toFixed(2);
      this.state.taxTotal = parseFloat(e.target.value.replace(/,/g, ""));
      e.target.value = formatNumber(e.target.value.replace(/,/g, ""), 2);
    }

    this.onChangeInput(e);
  };
  handleTaxTotalFocus = e => {
    e.target.value = e.target.value.replace(/,/g, "");
    if (e.target.value == 0) {
      e.target.value = "";
    }
    e.target.select();
    let arr = e.target.id.split("vatTotal");
    let itemRef = arr[1];
    // let row = JSON.parse(e.target.getAttribute("data-row"));
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
        isOpen={
          this.props.openTour &&
          this.props.appenv.ENABLE_TOUR &&
          this.state.isTourOpen
        }
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

  alert = (title, message, button = BTN_ACTION_BACK) => {
    this.setState({
      ...this.state.alertContent,
      isAlertModalVisible: true,
      alertModalAlertTitle: title,
      alertModalMsg: message,
      buttonAlert: button,
      isTextOnly: true
    });
  };

  render() {
    const { t } = this.props;
    const {
      stepOneProp,
      stepTwoProp,
      stepThreeProp,
      entryDate,
      vendorBranchList,
      isNotGetVendorBranchList,
      subTotal,
      taxTotal,
      POItems,
      blocking,
      retentionAmount,
      estimatedPayable,
      withholdingTaxTotal,
      flag,
      alertContent
    } = this.state;

    return (
      <BlockUi tag="div" blocking={blocking}>
        {this.renderTour()}
        {/* Header - Start */}
        <div className="page__header col-12">
          <div className="col-7 px-0">
            <h2>{`${t("Invoice No")}: ${stepThreeProp.invoiceNo || "-"}`}</h2>
          </div>
        </div>
        {/* Header - End */}

        {/* Body - Start */}
        <div
          id="createPO"
          className="col-12 box-bg d-flex flex-wrap summary mb-3"
        >
          <p id="date" className="col-12 px-0">
            {t("Entry Date")} :{" "}
            <strong>{moment(entryDate).format("DD/MM/YYYY") || "-"}</strong>
          </p>

          {/* Vendor & Company Information - Start */}
          <Step4Panel
            {...this.state}
            onChangeVendorBranch={this.onChangeVendorBranch}
          />
          {/* Vendor & Company Information - End */}

          {/* Payment and Attachment wrapper - Start */}
          <div className="col-12 p-0 paymentAndAttachment">
            {/* Payment Information - Start */}
            <div className="col-12 box d-flex flex-wrap paymentInfo">
              <div className="col-12">
                <h4 className="w-100 border-bottom border-1px pt-0 pb-2">
                  {t("Payment Information")}
                </h4>
              </div>

              {/* Column 1 - Start */}
              <div className="col-6 d-flex-inline flex-wrap">
                <div className="col-12 py-2 px-0 d-flex flex-wrap">
                  <div className="col-5 text-right">{t("Invoice Date")} : </div>
                  <div className="col-7 text-left">
                    {stepThreeProp.invoiceDate || "-"}
                  </div>
                </div>
                <div className="col-12 py-2 px-0 d-flex flex-wrap">
                  <div className="col-5 text-right">
                    {t("Payment Term Description")} :{" "}
                  </div>
                  <div className="col-7 text-left">
                    {stepOneProp.globalParam.paymentTermDescription || "-"}
                  </div>
                </div>
                <div className="col-12 py-2 px-0 d-flex flex-wrap">
                  <div className="col-5 text-right">
                    {t("Invoice Financing")} :{" "}
                  </div>
                  <div className="col-7 text-left">
                    {stepThreeProp.isPreferInvoiceFinancing ? "Yes" : "No"}
                  </div>
                </div>
              </div>
              {/* Column 1 - End */}

              {/* Column 2 - Start */}
              <div className="col-6 d-flex-inline flex-wrap">
                <div className="col-12 py-2 px-0 d-flex flex-wrap">
                  <div className="col-5 text-right">{t("Sub Total")} : </div>
                  <div className="col-7 text-left d-flex flex-wrap">
                    <div className="col-8 text-right">
                      {subTotal >= 0 ? (
                        <input
                          className="form-control"
                          data-tip="custom show"
                          data-event="focus"
                          data-event-off="blur"
                          data-for="priceSelect"
                          key="subTotal"
                          id="subTotal"
                          ref="subTotal"
                          // data-row={JSON.stringify(row)}
                          type="text"
                          name="subTotal[]"
                          pattern="[0-9]*"
                          defaultValue={formatNumber(subTotal || 0, 2)}
                          placeholder={formatNumber(subTotal || 0, 2)}
                          onKeyPress={e => this.numberOnly(e, 14)}
                          onFocus={this.handleSubTotalFocus}
                          onBlur={e => {
                            this.handleSubTotalChange(e);
                          }}
                          onChange={e => {
                            this.handleSubTotalValidation(e);
                          }}
                        />
                      ) : (
                        ""
                      )}
                    </div>
                    <div className="col-4 text-left">
                      {stepOneProp.mainPO.currency || "-"}
                    </div>
                  </div>
                </div>
                <div className="col-12 py-2 px-0 d-flex flex-wrap">
                  <div className="col-5 text-right">{t("Tax Total")} : </div>
                  <div className="col-7 text-left d-flex flex-wrap">
                    <div className="col-8 text-right">
                      {taxTotal >= 0 ? (
                        <input
                          className="form-control"
                          data-tip="custom show"
                          data-event="focus"
                          data-event-off="blur"
                          data-for="priceSelect"
                          key="vatTotal"
                          id="vatTotal"
                          ref="vatTotal"
                          // data-row={JSON.stringify(row)}
                          type="text"
                          name="vatTotal[]"
                          pattern="[0-9]*"
                          defaultValue={formatNumber(taxTotal || 0, 2)}
                          // value={formatNumber(row.vatTotal || 0, 2)}
                          placeholder={formatNumber(taxTotal || 0, 2)}
                          // disabled={!row.checked}
                          onKeyPress={e => this.numberOnly(e, 14)}
                          // onInput={e => {
                          //   this.autoResizeInput(e);
                          // }}
                          onFocus={this.handleTaxTotalFocus}
                          onChange={e => {
                            this.handleTaxTotalValidation(e);
                          }}
                          onBlur={e => {
                            this.handleTaxTotalChange(e);
                          }}
                        />
                      ) : (
                        ""
                      )}
                    </div>
                    <div className="col-4 text-left">
                      {stepOneProp.mainPO.currency || "-"}
                    </div>
                  </div>
                </div>
                <div className="col-12 py-2 px-0 d-flex flex-wrap">
                  <div className="col-5 text-right">
                    {t("Invoice Amount (Inc TAX)")} :
                  </div>
                  <div className="col-7 text-left d-flex flex-wrap">
                    <div className="col-8 text-right">
                      {formatNumber(Number(subTotal) + Number(taxTotal), 2) ||
                        "-"}
                    </div>
                    <div className="col-4 text-left">
                      {stepOneProp.mainPO.currency || "-"}
                    </div>
                  </div>
                </div>

                <div className="col-12 py-2 px-0 d-flex flex-wrap">
                  <div className="col-5 text-right">
                    {t("WHT Pre-calculated Amount")} :{" "}
                  </div>
                  <div className="col-7 text-left d-flex flex-wrap">
                    <div className="col-8 text-right">
                      {this.formatNumber(Number(withholdingTaxTotal), 2) || "-"}
                    </div>
                    <div className="col-4 text-left">
                      {stepOneProp.mainPO.currency || "-"}
                    </div>
                  </div>
                </div>

                <div className="col-12 py-2 px-0 d-flex flex-wrap">
                  <div className="col-5 text-right">
                    {t("Retention Amount")} :{" "}
                  </div>
                  <div className="col-7 text-left d-flex flex-wrap">
                    <div className="col-8 text-right">
                      {this.formatNumber(Number(retentionAmount), 2) || "-"}
                    </div>
                    <div className="col-4 text-left">
                      {stepOneProp.mainPO.currency || "-"}
                      {
                        <a
                          href="javascript:void(0);"
                          class="ml-10"
                          data-content={t(
                            "This is an estimated amount and may be subjected to change as per agreement upon buyer and seller"
                          )}
                          data-toggle="popover"
                        >
                          <i
                            className="fa fa-info-circle"
                            style={{
                              WebkitTextStroke: "0px",
                              fontSize: "20px"
                            }}
                          />
                        </a>
                      }
                    </div>
                  </div>
                </div>

                <div className="col-12 py-2 px-0 d-flex flex-wrap">
                  <div className="col-5 text-right">
                    {t("Estimated Invoice Payable Amount")} :{" "}
                  </div>
                  <div className="col-7 text-left d-flex flex-wrap">
                    <div className="col-8 text-right">
                      {this.formatNumber(Number(estimatedPayable), 2) || "-"}
                    </div>
                    <div className="col-4 text-left">
                      {stepOneProp.mainPO.currency || "-"}
                    </div>
                  </div>
                </div>
              </div>
              {/* Column 2 - End */}
            </div>
            {/* Payment Information - End */}

            {/* Attachment - Start */}
            <div className="col-12 box d-flex flex-wrap attachment">
              <div className="col-12">
                <h4 className="w-100 border-bottom border-1px pt-0 pb-2">
                  {t("Attachments")}
                </h4>
              </div>

              {/* Column 1 - Start */}
              <div className="col-6 d-flex-inline flex-wrap">
                <div className="col-12 py-2 px-0 d-flex flex-wrap">
                  <div className="col-5 text-right">
                    {t("Attach Tax Invoice")} :{" "}
                  </div>
                  <div className="col-7 text-left">
                    {stepThreeProp.taxInvoiceFiles.length > 0
                      ? stepThreeProp.taxInvoiceFiles.map(file => (
                          <div>
                            <span className="fileName">
                              {this.sliceFileName(file.name)}
                            </span>
                          </div>
                        ))
                      : "-"}
                  </div>
                </div>
                <div className="col-12 py-2 px-0 d-flex flex-wrap">
                  <div className="col-5 text-right">{t("Receipt No")} : </div>
                  <div className="col-7 text-left">
                    {stepThreeProp.receiptNo || "-"}
                  </div>
                </div>
              </div>
              {/* Column 1 - End */}

              {/* Column 2 - Start */}
              <div className="col-6 d-flex-inline flex-wrap">
                <div className="col-12 py-2 px-0 d-flex flex-wrap">
                  <div className="col-5 text-right">
                    {t("Attach Delivery Note")} :{" "}
                  </div>
                  <div className="col-7 text-left">
                    {stepThreeProp.deliveryNoteFiles.length > 0
                      ? stepThreeProp.deliveryNoteFiles.map(file => (
                          <div>
                            <span className="fileName">
                              {this.sliceFileName(file.name)}
                            </span>
                          </div>
                        ))
                      : "-"}
                  </div>
                </div>
                <div className="col-12 py-2 px-0 d-flex flex-wrap">
                  <div className="col-5 text-right">
                    {t("Attach Receipt")} :{" "}
                  </div>
                  <div className="col-7 text-left">
                    {stepThreeProp.receiptFiles.length > 0
                      ? stepThreeProp.receiptFiles.map(file => (
                          <div>
                            <span className="fileName">
                              {this.sliceFileName(file.name)}
                            </span>
                          </div>
                        ))
                      : "-"}
                  </div>
                </div>
                <div className="col-12 py-2 px-0 d-flex flex-wrap">
                  <div className="col-5 text-right">
                    {t("Attach Other Documents")} :{" "}
                  </div>
                  <div className="col-7 text-left">
                    {stepThreeProp.otherFiles.length > 0
                      ? stepThreeProp.otherFiles.map(file => (
                          <div>
                            <span className="fileName">
                              {this.sliceFileName(file.name)}
                            </span>
                          </div>
                        ))
                      : "-"}
                  </div>
                </div>
              </div>
              {/* Column 2 - End */}
            </div>
            {/* Attachment - End */}
          </div>
          {/* Payment and Attachment wrapper - End */}

          {/* Items Information - Start */}
          <div className="col-12 box d-flex flex-wrap itemsInfo">
            <div className="col-12 d-flex flex-wrap align-items-center mt-1 mb-3">
              <h4 className="col-8 m-0 p-0">{t("Items Information")}</h4>
            </div>

            <div className="table-responsive">
              <table className="table dataTable">
                <thead>
                  <tr>
                    <th>{t("PO No")}</th>
                    <th>
                      {t("PO Items No1")} <br />
                      {t("PO Items No2")}
                    </th>
                    <th>{t("Material Description")}</th>
                    <th>{t("QTY")}</th>
                    <th>
                      {t("Unit Description1")}
                      <br />
                      {t("Unit Description2")}
                    </th>
                    <th>{t("Unit Price")}</th>
                    <th>{t("Sub Total")}</th>
                    <th>{t("Currency")}</th>
                  </tr>
                </thead>
                <tbody>
                  {POItems.length > 0 ? (
                    POItems.map(item => {
                      return (
                        <tr>
                          <td className="text-center">
                            {item.poNumber || "-"}
                          </td>
                          <td className="text-center">
                            {item.poItemNo || "-"}
                          </td>

                          <td className="text-left" style={{ minWidth: 200 }}>
                            {item.materialDescription || "-"}
                          </td>
                          <td className="text-right">
                            {item.selectQty != undefined
                              ? formatNumber(item.selectQty, 3)
                              : "-"}
                          </td>
                          <td className="text-center">
                            {item.unitDescription}
                          </td>
                          <td className="text-right">
                            {item.poItemUnitPrice != undefined
                              ? formatNumber(item.poItemUnitPrice, 2)
                              : "-"}
                          </td>
                          <td className="text-right">
                            {item.selectAmount != undefined
                              ? formatNumber(item.selectAmount, 2)
                              : "-"}
                          </td>
                          <td className="text-center">
                            {item.poItemUnitPriceCurrency}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colspan="8" className="text-center">
                        No Data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Items Information - End */}
        </div>
        {/* Body - End */}

        {/* Footer - Start */}
        <div className="col-12 text-center">
          <span
            className="wraper addBtnPanel"
            style={{ padding: "10px 0 10px 0" }}
          >
            <button
              type="button"
              name="btnCloseModal"
              id="btnCloseModal"
              className="btn btn--transparent btn-wide"
              data-dismiss="modal"
              aria-hidden="true"
              onClick={() => {
                this.props.Cancel();
              }}
            >
              {t("Cancel")}
            </button>
            <button
              type="button"
              name="btnpreviousStep"
              id="btnpreviousStep"
              className="btn btn--transparent btn-wide ml-3"
              data-dismiss="modal"
              aria-hidden="true"
              onClick={() => {
                this.handleBackBtn();
              }}
            >
              <i className="fa fa-chevron-left" /> {t("Back")}
            </button>
            <button
              type="button"
              name="btnNext"
              id="btnAddPO"
              disabled={this.validateStatus()}
              onClick={() => {
                this.enableBody($(".reactour__helper--is-open")[0]);
                this.closeTour();
                this.createInvoice();
              }}
              className="btn btn-wide ml-3"
            >
              {t("Submit")}
            </button>
          </span>
        </div>
        {/* Footer - End */}
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

export default withTranslation(["invoice-create", "detail"])(CreateStep4);
