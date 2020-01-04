import React, { Component } from "react";
import _ from "lodash";
import ApiService from "../../libs/ApiService";
import BlockUi from "react-block-ui";

import Router from "next/router";

const Api = new ApiService();

const poItemColumnPattern = [
  { data: "poNumber" },
  { data: "poItemNo" },
  { data: "grItemNo" },
  { data: "refNo" },
  { data: "materialDescription" },
  { data: "poItemQtyInitial" },
  { data: "unitDescription" },
  { data: "poItemUnitPrice" },
  { data: "subTotal" },
  { data: "poItemUnitPriceCurrency" }
];

class createInvoiceByGrStepFour extends Component {
  constructor(props) {
    super(props);
    this.state = {
      blocking: false,
      mainState: undefined,
      subTotal: "",
      taxTotal: "",
      invoiceAmount: "",
      payableAmount: "",
      allItems: [],
      createErrMessage: "",
      entryDate: moment(),
      ///GroupGRItem
      isGrouping: false,
      ///Branch
      vendorBranch: "",
      companyBranch: "",
      vendorBranchList: [],
      companyBranchList: [],
      fileAttachments: [],
      isFileAttachmentsUploaded: false,
      vendorBranchInfo: {}
    };
  }

  async componentDidMount() {
    this.initVendorBranch();
    this.populateVendorBranch();
    await this.extractAllPOItems(
      this.props.mainState.stepTwoProp.selectedGRItems
    );
    await this.calAll();
    await this.getDefaultGrouping();
    await this.renderPOItemTable(this.state.allItems);
  }

  async getDefaultGrouping() {
    const fetchURL = `/api/offledgers/configuration?configOption=INVOICE_ITEM_DEFAULT_GROUPING&companyTaxId=${
      this.props.mainState.stepOneProp.selectedPO.vendorTaxNumber
    }&counterPartyTaxId=${
      this.props.mainState.stepOneProp.selectedPO.businessPlaceTaxNumber
    }`;
    try {
      const data = await fetch(fetchURL)
        .then(resp => resp.json())
        .then(json => {
          if (json[0].value === "true") {
            this.setState({ isGrouping: true });
            $("#selectGroupGRItems").prop("checked", true);
          } else {
            this.setState({ isGrouping: false });
          }
        });
      return data;
    } catch (error) {
      console.log("error in getTypeOfDocumentToCreate:", error);
    }
  }

  toggleBlocking() {
    this.setState({ blocking: !this.state.blocking });
  }

  initVendorBranch() {
    let vendorBranchInfo = {
      vendorStreet1: this.props.mainState.stepTwoProp.mainPO.item[0]
        .vendorStreet1,
      vendorDistrict: this.props.mainState.stepTwoProp.mainPO.item[0]
        .vendorDistrict,
      vendorCity: this.props.mainState.stepTwoProp.mainPO.item[0].vendorCity,
      vendorPostalCode: this.props.mainState.stepTwoProp.mainPO.item[0]
        .vendorPostalCode,
      vendorBranchCode: this.props.mainState.stepTwoProp.mainPO.item[0]
        .vendorBranchCode,
      vendorBranchName: this.props.mainState.stepTwoProp.mainPO.item[0]
        .vendorBranchName
    };

    this.setState({
      vendorBranchInfo: vendorBranchInfo
    });
  }

  extractAllPOItems(selectedGRItems) {
    let allItems = [];
    let poKeys = Object.keys(selectedGRItems);
    for (let i = 0; i < poKeys.length; i++) {
      let items = selectedGRItems[poKeys[i]].item;
      items.forEach(item => {
        allItems.push(item);
      });
    }
    this.setState({
      allItems: allItems
    });
  }

  populateVendorBranch() {
    let legalName = this.props.mainState.stepTwoProp.mainPO.item[0].seller
      .legalName;
    let vendorTaxNumber = this.props.mainState.stepTwoProp.mainPO.item[0]
      .vendorTaxNumber;
    Api.getVendorBranchCode(legalName, vendorTaxNumber).then(res => {
      let list = this.state.vendorBranchList;
      this.setState({
        vendorBranchList: list.concat(res)
      });
    });
  }

  checkGroupGRItems() {
    let thisGrouping = !this.state.isGrouping;
    this.setState({ isGrouping: thisGrouping });
    let datatable = $("#grItemsTable").DataTable({
      destroy: true,
      paging: false,
      bLengthChange: false,
      searching: false,
      info: false
    });
    let newData = [];
    if (thisGrouping) {
      this.state.groupedData.map(item => {
        newData.push([
          item.poNumber,
          item.poItemNo,
          item.grItemNo,
          item.refNo,
          item.materialDescription,
          item.poItemQtyInitial,
          item.unitDescription,
          item.poItemUnitPrice,
          item.subTotal,
          item.poItemUnitPriceCurrency
        ]);
      });
    } else {
      this.state.upgroupedData.map(item => {
        newData.push([
          item.poNumber,
          item.poItemNo,
          item.grItemNo,
          item.refNo,
          item.materialDescription,
          item.poItemQtyInitial,
          item.unitDescription,
          item.poItemUnitPrice,
          item.subTotal,
          item.poItemUnitPriceCurrency
        ]);
      });
    }
    datatable.clear();
    datatable.rows.add(newData);
    datatable.columns.adjust().draw();
  }

  setUngroupedData(poItems) {
    let data = [];
    poItems.forEach((item, index) => {
      data.push({
        poNumber: item.poNumber,
        poItemNo: item.purchaseItemExternalId,
        grItemNo: item.externalId,
        refNo: item.referenceField1 || "N/A",
        materialDescription: item.materialDescription,
        poItemQtyInitial: this.formatQtyNumber(item.quantity.initial),
        unitDescription: item.quantity.unit,
        poItemUnitPrice: this.formatPriceNumber(item.poItemUnitPrice),
        subTotal: this.formatCurrency(
          item.poItemUnitPrice * item.quantity.initial
        ),
        poItemUnitPriceCurrency: item.poItemUnitPriceCurrency
      });
    });
    this.setState({ upgroupedData: data });
    return data;
  }

  setGroupedData(poItems) {
    let groupedData = [];
    let groupedDataForCreate = [];
    let multiplePoItemNumber = [];
    let externalIdIndex = 0;
    const noReferencePoItems = poItems.slice();
    poItems.forEach((itemWithRef, index) => {
      const item = _.cloneDeep(itemWithRef);
      let indexInGroupedData = groupedData.findIndex(
        x =>
          x.poNumber === item.poNumber &&
          x.purchaseItemExternalId === item.purchaseItemExternalId &&
          x.poItemUnitPrice === item.poItemUnitPrice
      );
      if (indexInGroupedData > -1) {
        const compositeKey = {
          poNumber: item.poNumber,
          purchaseItemExternalId: item.purchaseItemExternalId,
          poItemUnitPrice: item.poItemUnitPrice
        };
        multiplePoItemNumber.push(compositeKey);
        groupedData[indexInGroupedData].poItemQtyInitial =
          groupedData[indexInGroupedData].poItemQtyInitial +
          item.quantity.initial;
        groupedData[indexInGroupedData].subTotal =
          groupedData[indexInGroupedData].subTotal +
          item.poItemUnitPrice * item.quantity.initial;
        groupedDataForCreate[indexInGroupedData].quantity.initial =
          groupedDataForCreate[indexInGroupedData].quantity.initial +
          item.quantity.initial;
        groupedDataForCreate[indexInGroupedData].itemSubTotal =
          groupedDataForCreate[indexInGroupedData].itemSubTotal +
          item.poItemUnitPrice * item.quantity.initial;
        groupedDataForCreate[indexInGroupedData].goodsReceivedItems.push({
          linearId: item.linearId
        });
      } else {
        groupedData.push({
          poNumber: item.poNumber,
          poItemNo: item.purchaseItemExternalId,
          grItemNo: item.externalId,
          refNo: item.referenceField1 || "N/A",
          materialDescription: item.materialDescription,
          poItemQtyInitial: item.quantity.initial,
          unitDescription: item.quantity.unit,
          poItemUnitPrice: item.poItemUnitPrice,
          subTotal: item.poItemUnitPrice * item.quantity.initial,
          purchaseItemExternalId: item.purchaseItemExternalId,
          poItemUnitPriceCurrency: item.poItemUnitPriceCurrency
        });
        groupedDataForCreate.push({
          purchaseOrderExternalId: item.poNumber,
          purchaseItemExternalId: item.purchaseItemExternalId,
          externalId: externalIdIndex + 1,
          materialDescription: item.materialDescription,
          quantity: item.quantity,
          unitDescription: item.quantity.unit,
          currency: item.poItemUnitPriceCurrency,
          unitPrice: item.poItemUnitPrice,
          itemSubTotal: item.poItemUnitPrice * item.quantity.initial,
          vatCode: item.taxCode,
          vatRate: item.taxRate,
          goodsReceivedItems: [
            {
              linearId: item.linearId
            }
          ],
          site: item.site,
          siteDescription: item.siteDescription,
          section: item.section,
          sectionDescription: item.sectionDescription
        });
        externalIdIndex = externalIdIndex + 1;
      }
    });
    multiplePoItemNumber = _.uniq(multiplePoItemNumber, _.isEqual);
    groupedData.map(item => {
      let indexInMultiplePoItemNumber = multiplePoItemNumber.findIndex(
        x =>
          x.poNumber === item.poNumber &&
          x.purchaseItemExternalId === item.purchaseItemExternalId &&
          x.poItemUnitPrice === item.poItemUnitPrice
      );
      if (indexInMultiplePoItemNumber > -1) {
        item.grItemNo = "Multiple";
        item.refNo = "Multiple";
      }
      item.poItemQtyInitial = this.formatQtyNumber(item.poItemQtyInitial);
      item.poItemUnitPrice = this.formatPriceNumber(item.poItemUnitPrice);
      item.subTotal = this.formatCurrency(item.subTotal);
    });
    groupedData.forEach(key => delete key.purchaseItemExternalId);
    this.setState({ groupedData });
    this.setState({ groupedDataForCreate });
    return groupedData;
  }

  renderPOItemTable(poItems) {
    var data;
    var ungroupedData = this.setUngroupedData(poItems);
    var groupedData = this.setGroupedData(poItems);
    if (this.state.isGrouping === true) {
      data = groupedData;
    } else {
      data = ungroupedData;
    }

    var dts = window
      .jQuery(this.el)
      .DataTable({
        data: data,
        columns: poItemColumnPattern,
        scrollX: true,
        language: {
          lengthMenu: "Display _MENU_ Per Page"
        },
        columnDefs: [
          {
            targets: [0],
            orderable: false
          },
          {
            targets: [1],
            width: "120px"
          },
          {
            targets: [2],
            width: "120px"
          },
          {
            targets: [3],
            width: "100px"
          },
          {
            targets: [4],
            width: "300px"
          },
          {
            targets: [5],
            width: "150px"
          },
          {
            targets: [6],
            width: "100px"
          },
          {
            targets: [7],
            width: "150px"
          },
          {
            targets: [8],
            width: "120px"
          },
          {
            targets: [9],
            width: "100px"
          }
        ],
        destroy: true,
        stateSave: true,
        paging: false,
        bLengthChange: false,
        searching: false,
        info: false
      })
      .on("error", function(e, settings, techNote, message) {
        console.log("An error has been reported by DataTables: ", message);
      });

    this.setState({
      poItemDataTable: dts
    });
  }

  calPOItemsSubTotal() {
    let subTotal = 0;
    let poItems = this.state.allItems;
    poItems.forEach(item => {
      subTotal = subTotal + item.poItemUnitPrice * item.quantity.initial;
    });

    return subTotal;
  }

  calPOItemsTaxTotal() {
    let taxTotal = 0;
    let taxSumMapping = {};
    let poItems = this.state.allItems;

    poItems.forEach(item => {
      if (_.has(taxSumMapping, `tax${item.taxRate}`)) {
        taxSumMapping[`tax${item.taxRate}`] +=
          +item.poItemUnitPrice * item.quantity.initial;
      } else {
        taxSumMapping[`tax${item.taxRate}`] =
          +item.poItemUnitPrice * item.quantity.initial;
      }
    });

    _.forOwn(taxSumMapping, (value, key) => {
      taxTotal = taxTotal + +this.calTax(value, key.replace("tax", ""));
    });

    return taxTotal;
  }

  calTax(amount, percentage) {
    return (amount * (percentage / 100)).toFixed(2);
  }

  formatCurrency(amount) {
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(amount);
  }

  calAll() {
    let subTotal = this.calPOItemsSubTotal();
    let taxTotal = this.calPOItemsTaxTotal();
    this.setState({
      subTotal: subTotal,
      taxTotal: taxTotal
    });
  }

  async submitToCreateInvoice() {
    this.toggleBlocking();
    let uploadPromises = await this.populateFileAttachmentForCreate();
    Promise.all(uploadPromises).then(data => {
      let fileAttachments = data;

      let invoiceFinancing = "";
      if (this.props.mainState.stepThreeProp.isPreferInvoiceFinancing) {
        invoiceFinancing = "Y";
      } else invoiceFinancing = "N";

      let populateItemsForCreate = this.populateItemsForCreate();

      let invoiceObject = [
        {
          vendorNumber: this.props.mainState.stepTwoProp.mainPO.item[0]
            .vendorNumber,
          vendorBranchCode: this.props.mainState.stepOneProp.vendorBranchInfo
            .vendorBranchCode,
          vendorBranchName: this.props.mainState.stepOneProp.vendorBranchInfo
            .vendorBranchName,
          vendorName: this.props.mainState.stepTwoProp.mainPO.item[0]
            .vendorName,
          vendorTaxNumber: this.props.mainState.stepTwoProp.mainPO.item[0]
            .vendorTaxNumber,
          vendorAddress:
            this.props.mainState.stepOneProp.vendorBranchInfo.vendorStreet1 +
            " " +
            this.props.mainState.stepOneProp.vendorBranchInfo.vendorDistrict +
            " " +
            this.props.mainState.stepOneProp.vendorBranchInfo.vendorCity +
            " " +
            this.props.mainState.stepOneProp.vendorBranchInfo.vendorPostalCode,
          vendorTelephone: this.props.mainState.stepOneProp.selectedPO
            .vendorTelephone,

          // vendorNumber: this.props.mainState.stepOneProp.selectedPO
          //   .vendorNumber,
          // vendorBranchCode: this.props.mainState.stepOneProp.selectedPO
          //   .vendorBranchCode,
          // vendorBranchName: this.props.mainState.stepOneProp.selectedPO
          //   .vendorBranchName,
          // vendorName: this.props.mainState.stepOneProp.selectedPO.vendorName,
          // vendorTaxNumber: this.props.mainState.stepOneProp.selectedPO
          //   .vendorTaxNumber,
          // vendorAddress: `${this.props.mainState.stepOneProp.selectedPO
          //   .vendorAddress || ""} ${this.props.mainState.stepOneProp.selectedPO
          //   .vendorAddress1 || ""} ${this.props.mainState.stepOneProp.selectedPO
          //   .vendorDistrict || ""} ${this.props.mainState.stepOneProp.selectedPO
          //   .vendorCity || ""} ${this.props.mainState.stepOneProp.selectedPO
          //   .vendorPostalCode || ""}`,

          // vendorTelephone: this.props.mainState.stepOneProp.selectedPO
          //   .vendorTelephone,

          companyCode: this.props.mainState.stepOneProp.selectedPO.companyCode,
          companyName: this.props.mainState.stepOneProp.selectedPO.companyName,
          companyTaxNumber: this.props.mainState.stepOneProp.selectedPO
            .businessPlaceTaxNumber,
          companyBranchCode: this.props.mainState.stepOneProp.selectedPO
            .companyBranchCode,
          companyBranchName: this.props.mainState.stepOneProp.selectedPO
            .companyBranchName,
          companyAddress: `${this.props.mainState.stepOneProp.selectedPO
            .businessPlaceAddress || ""} ${this.props.mainState.stepOneProp
            .selectedPO.businessPlaceAddress1 || ""} ${this.props.mainState
            .stepOneProp.selectedPO.businessPlaceDistrict || ""} ${this.props
            .mainState.stepOneProp.selectedPO.businessPlaceCity || ""} ${this
            .props.mainState.stepOneProp.selectedPO.businessPlacePostalCode ||
            ""}`,
          companyTelephone: this.props.mainState.stepOneProp.selectedPO
            .businessPlaceTelephone,

          paymentTermCode: this.props.mainState.stepOneProp.selectedPO
            .paymentTermCode,
          paymentTermDays: this.props.mainState.stepOneProp.selectedPO
            .paymentTermDays,
          paymentTermDesc: this.props.mainState.stepOneProp.selectedPO
            .paymentTermDescription,
          currency: this.props.mainState.stepTwoProp.mainPO.item[0]
            .poItemUnitPriceCurrency,

          subTotal: this.state.subTotal,
          vatTotal: this.state.taxTotal,
          invoiceTotal:
            Number(this.state.subTotal) + Number(this.state.taxTotal),

          externalId: this.props.mainState.stepThreeProp.invoiceNo.trim(),
          invoiceDate: this.props.mainState.stepThreeProp.invoiceDate,
          dueDate: this.props.mainState.stepThreeProp.dueDate,
          invoiceCreatedDate: moment().format(),
          invoiceFinancing: invoiceFinancing,

          receiptNumber: this.props.mainState.stepThreeProp.receiptNo.trim(),

          items: populateItemsForCreate,

          buyer: this.props.mainState.stepOneProp.selectedPO.buyer,
          seller: this.props.mainState.stepOneProp.selectedPO.seller,

          fileAttachments: fileAttachments
        }
      ];
      Api.postCreateInvoice(invoiceObject)
        .then(res => {
          this.toggleBlocking();
          Router.push("/invoice");
        })
        .catch(err => {
          this.toggleBlocking();
          console.log(err.response);
          let modalMessage = "";
          if (Array.isArray(err.response.data)) {
            modalMessage = err.response.data[0].body.message;
          } else {
            modalMessage = err.response.data.message;
          }
          this.setState({
            createErrMessage: modalMessage
          });
          window.jQuery("#errorWarning").modal("toggle");
        });
    });
  }

  populateFileAttachmentForCreate() {
    let fileAttachments = [];
    /// populate & upload file
    let fileTypeMapping = [];
    this.props.mainState.stepThreeProp.taxInvoiceFiles.forEach(file => {
      fileTypeMapping.push("TaxInvoice");
    });
    this.props.mainState.stepThreeProp.receiptFiles.forEach(file => {
      fileTypeMapping.push("Receipt");
    });
    this.props.mainState.stepThreeProp.deliveryNoteFiles.forEach(file => {
      fileTypeMapping.push("DeliveryNote");
    });
    this.props.mainState.stepThreeProp.otherFiles.forEach(file => {
      fileTypeMapping.push("Others");
    });

    let uploadPackage = this.props.mainState.stepThreeProp.taxInvoiceFiles.concat(
      this.props.mainState.stepThreeProp.receiptFiles.concat(
        this.props.mainState.stepThreeProp.deliveryNoteFiles.concat(
          this.props.mainState.stepThreeProp.otherFiles
        )
      )
    );

    let delay = -1000;
    const delayIncrement = 1000;
    let uploadPromise = uploadPackage.map((file, index) => {
      delay += delayIncrement;
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(
            this.uploadFiles(file.data).then(hash => {
              let attachment = {
                attachmentHash: hash,
                attachmentName: file.name,
                attachmentType: fileTypeMapping[index]
              };
              return attachment;
            })
          );
        }, delay);
      });
    });

    return uploadPromise;
  }

  populateItemsForCreate() {
    let items = [];

    if (this.state.isGrouping === true) {
      const groupedItems = this.state.groupedDataForCreate;
      return groupedItems;
    }
    this.state.allItems.forEach((item, index) => {
      let toCreateItem = {
        purchaseOrderExternalId: item.poNumber,
        purchaseItemExternalId: item.purchaseItemExternalId,
        externalId: index + 1,
        materialDescription: item.materialDescription,
        quantity: item.quantity,
        unitDescription: item.quantity.unit,
        currency: item.poItemUnitPriceCurrency,
        unitPrice: item.poItemUnitPrice,
        itemSubTotal: item.poItemUnitPrice * item.quantity.initial,
        vatCode: item.taxCode,
        vatRate: item.taxRate,
        goodsReceivedItems: [
          {
            linearId: item.linearId
          }
        ],

        site: item.site,
        siteDescription: item.siteDescription
      };
      items.push(toCreateItem);
    });

    return items;
  }

  handleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });

    if (
      event.target.name === "vendorBranch" ||
      event.target.name === "companyBranch"
    ) {
      this.triggerBranchChange(event.target.name, event.target.value);
    }
  }

  triggerBranchChange(branch, id) {
    if (branch === "vendorBranch") {
      let vendorBranchInfo = this.state.vendorBranchInfo;
      let vendorBranch = this.state.vendorBranchList.find(b => {
        return b.id === +id;
      });
      if (vendorBranch !== undefined) {
        vendorBranchInfo.vendorStreet1 =
          vendorBranch.street === undefined ? "" : vendorBranch.street;
        vendorBranchInfo.vendorDistrict =
          vendorBranch.district === undefined ? "" : vendorBranch.district;
        vendorBranchInfo.vendorCity =
          vendorBranch.city === undefined ? "" : vendorBranch.city;
        vendorBranchInfo.vendorPostalCode =
          vendorBranch.postalCode === undefined ? "" : vendorBranch.postalCode;
        vendorBranchInfo.vendorBranchCode =
          vendorBranch.branchCode === undefined ? "" : vendorBranch.branchCode;
        vendorBranchInfo.vendorBranchName =
          vendorBranch.name === undefined ? "" : vendorBranch.name;
        window.jQuery("#addressPanel-vendor").css("color", "#d40e78");
        window.jQuery("#addressInput-vendor").css("color", "#d40e78");
      }
      this.setState({
        vendorBranchInfo: vendorBranchInfo
      });
    } else if (branch === "companyBranch") {
      window.jQuery("#addressPanel-company").css("color", "#d40e78");
      window.jQuery("#addressInput-company").css("color", "#d40e78");
    }
  }

  uploadFiles(data) {
    return Api.postUploadFile(data).then(res => {
      return res[0].attachmentHash;
    });
  }

  ///// Util /////

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

  formatQtyNumber(amount) {
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      maximumFractionDigits: 3,
      minimumFractionDigits: 3
    }).format(amount);
  }

  formatPriceNumber(amount) {
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(amount);
  }

  routeCancel() {
    Router.push("/invoice");
  }

  render() {
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
                <li className="flex-fill finished">
                  <div className="indicator step-3 rounded-circle text-center">
                    <span className="number">3</span>
                    <i className="fa fa-check" />
                  </div>
                  <p className="text-center">Insert Invoice Details</p>
                </li>
                <li className="flex-fill active">
                  <div className="indicator step-4 rounded-circle text-center">
                    <span className="number">4</span>
                    <i className="fa fa-check" />
                  </div>
                  <p className="text-center">Summary</p>
                </li>
              </ul>
            </div>
            <div class="page__header col-12">
              <h2>
                Invoice No.:{" "}
                {this.props.mainState.stepThreeProp.invoiceNo || ""}
              </h2>
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
            <div class="box box--width-header col-12">
              <div class="box__header">
                <div class="row justify-content-between align-items-center">
                  <div class="col">
                    {" "}
                    Entry Date :{" "}
                    <strong>
                      {moment(this.state.entryDate).format("DD/MM/YYYY")}
                    </strong>
                  </div>
                </div>
              </div>
              <div class="box__inner">
                <div class="row box ml-0 mr-0">
                  <a href="#vendorInfo" class="d-flex w-100 btnToggle">
                    <div class="col-6">
                      <h3 class="border-bottom gray-1">Vendor</h3>
                    </div>
                    <div class="col-6">
                      <h3 class="border-bottom gray-1">Company</h3>
                    </div>
                  </a>
                  <div
                    id="vendorInfo"
                    class="collapse multi-collapse w-100 show"
                  >
                    <div class="card card-body noborder">
                      <div class="row">
                        <div class="col-6">
                          <div class="row">
                            <p class="col-4 text-right nopadding">Code :</p>
                            <p class="col-6">
                              {
                                this.props.mainState.stepTwoProp.mainPO.item[0]
                                  .vendorNumber
                              }
                            </p>
                          </div>
                          <div class="row">
                            <p class="col-4 text-right nopadding">Name :</p>
                            <p class="col-6">
                              {
                                this.props.mainState.stepTwoProp.mainPO.item[0]
                                  .vendorName
                              }
                            </p>
                          </div>
                          <div class="row">
                            <p class="col-4 text-right nopadding">Tax ID :</p>
                            <p class="col-6">
                              {
                                this.props.mainState.stepTwoProp.mainPO.item[0]
                                  .vendorTaxNumber
                              }
                            </p>
                          </div>
                          <div class="row">
                            <p class="col-4 text-right nopadding">Branch :</p>
                            <p class="col-6">
                              {`${
                                this.props.mainState.stepOneProp
                                  .vendorBranchInfo.vendorBranchCode
                              } (${
                                this.props.mainState.stepOneProp
                                  .vendorBranchInfo.vendorBranchName
                              })`}
                            </p>
                          </div>
                          <div class="row">
                            <p class="col-4 text-right nopadding">Address :</p>
                            <p id="addressPanel-vendor" class="col-6">
                              {this.props.mainState.stepOneProp.vendorBranchInfo
                                .vendorStreet1 +
                                " " +
                                this.props.mainState.stepOneProp
                                  .vendorBranchInfo.vendorDistrict +
                                " " +
                                this.props.mainState.stepOneProp
                                  .vendorBranchInfo.vendorCity +
                                " " +
                                this.props.mainState.stepOneProp
                                  .vendorBranchInfo.vendorPostalCode}
                            </p>
                          </div>
                          <div class="row">
                            <p class="col-4 text-right nopadding">Tel. :</p>
                            <p class="col-6">
                              {
                                this.props.mainState.stepOneProp.selectedPO
                                  .vendorTelephone
                              }
                            </p>
                          </div>
                        </div>
                        <div class="col-6">
                          <div class="row">
                            <p class="col-4 text-right nopadding">Code :</p>
                            <p class="col-6">
                              {
                                this.props.mainState.stepTwoProp.mainPO.item[0]
                                  .companyCode
                              }
                            </p>
                          </div>
                          <div class="row">
                            <p class="col-4 text-right nopadding">Name :</p>
                            <p class="col-6">
                              {
                                this.props.mainState.stepOneProp.selectedPO
                                  .companyName
                              }
                            </p>
                          </div>
                          <div class="row">
                            <p class="col-4 text-right nopadding">Tax ID :</p>
                            <p class="col-6">
                              {
                                this.props.mainState.stepOneProp.selectedPO
                                  .businessPlaceTaxNumber
                              }
                            </p>
                          </div>
                          <div class="row">
                            <p class="col-4 text-right nopadding">Branch :</p>
                            <p class="col-6">
                              {`${
                                this.props.mainState.stepOneProp.selectedPO
                                  .companyBranchCode
                              } (${
                                this.props.mainState.stepOneProp.selectedPO
                                  .companyBranchName
                              })`}
                            </p>
                          </div>
                          <div class="row">
                            <p class="col-4 text-right nopadding">Address :</p>
                            <p id="addressPanel-company" class="col-6">
                              {(this.props.mainState.stepOneProp.selectedPO
                                .businessPlaceAddress || "") +
                                " " +
                                (this.props.mainState.stepOneProp.selectedPO
                                  .businessPlaceAddress1 || "") +
                                " " +
                                this.props.mainState.stepOneProp.selectedPO
                                  .businessPlaceDistrict +
                                " " +
                                this.props.mainState.stepOneProp.selectedPO
                                  .businessPlaceCity +
                                " " +
                                this.props.mainState.stepOneProp.selectedPO
                                  .businessPlacePostalCode}
                            </p>
                          </div>
                          <div class="row">
                            <p class="col-4 text-right nopadding">Tel. :</p>
                            <p class="col-6">
                              {
                                this.props.mainState.stepOneProp.selectedPO
                                  .businessPlaceTelephone
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="row box ml-0 mr-0">
                  <a href="#paymentInfo" class="d-flex w-100 btnToggle">
                    <div class="col-12">
                      <h3 class="border-bottom gray-1">Payment Information</h3>
                    </div>
                  </a>
                  <div id="paymentInfo" class="w-100">
                    <div class="card card-body noborder">
                      <div class="row">
                        <div class="col-6">
                          <div class="row">
                            <p class="col-4 text-right nopadding">
                              Invoice Date :
                            </p>
                            <p class="col-6">
                              {this.props.mainState.stepThreeProp.invoiceDate ||
                                ""}
                            </p>
                          </div>
                          <div class="row">
                            <p class="col-4 text-right nopadding">
                              Payment Date :
                            </p>
                            <p class="col-6">
                              {
                                this.props.mainState.stepTwoProp.mainPO.item[0]
                                  .paymentTermDays
                              }{" "}
                              days
                            </p>
                          </div>
                          <div class="row">
                            <p class="col-4 text-right nopadding">
                              Payment Term Description :
                            </p>
                            <p class="col-6">
                              {this.props.mainState.stepThreeProp.paymentTerm ||
                                ""}
                            </p>
                          </div>
                          <div class="row">
                            <p class="col-4 text-right nopadding">
                              Invoice Financing :
                            </p>
                            <p class="col-6">
                              {this.props.mainState.stepThreeProp
                                .isPreferInvoiceFinancing === true
                                ? "Yes"
                                : "No"}
                            </p>
                          </div>
                          <div class="row">
                            <p class="col-4 text-right nopadding">
                              Send to CMS :
                            </p>
                            <p class="col-6">
                              {this.props.mainState.stepTwoProp.mainPO.item[0].customisedFields.hasOwnProperty(
                                "CMS"
                              )
                                ? "Yes"
                                : "No"}
                            </p>
                          </div>
                          <div class="row">
                            <p class="col-4 text-right nopadding">
                              Send to Bank :
                            </p>
                            <p class="col-6">No</p>
                          </div>
                        </div>
                        <div class="col-6">
                          <div class="row">
                            <p class="col-4 text-right nopadding">
                              Expected Due Date :
                            </p>
                            <p class="col-6">
                              {this.props.mainState.stepThreeProp.dueDate || ""}
                            </p>
                          </div>
                          <div class="row">
                            <p class="col-4 text-right nopadding">
                              Revised Payment Due Date :
                            </p>
                            <p class="col-6">-</p>
                          </div>
                          <div class="row">
                            <p class="col-4 text-right nopadding">
                              Sub Total :
                            </p>
                            <p class="col-6">
                              <span class="number text-right">
                                {this.formatCurrency(this.state.subTotal)}
                              </span>
                              <span class="unit">THB</span>
                            </p>
                          </div>
                          <div class="row">
                            <p class="col-4 text-right nopadding">
                              TAX Total :
                            </p>
                            <p class="col-6">
                              <span class="number text-right">
                                {this.formatCurrency(this.state.taxTotal)}
                              </span>
                              <span class="unit">THB</span>
                            </p>
                          </div>
                          <div class="row">
                            <p class="col-4 text-right nopadding">
                              Invoice Amount (Inc. TAX) :
                            </p>
                            <p class="col-6">
                              <span class="number text-right">
                                {this.formatCurrency(
                                  Number(this.state.subTotal) +
                                    Number(this.state.taxTotal)
                                )}
                              </span>
                              <span class="unit">THB</span>
                            </p>
                          </div>
                          <div class="row">
                            <p class="col-4 text-right nopadding">
                              Invoice Payable Amount (Inc. TAX) :
                            </p>
                            <p class="col-6">
                              <span class="number text-right">
                                {this.formatCurrency(
                                  Number(this.state.subTotal) +
                                    Number(this.state.taxTotal)
                                )}
                              </span>
                              <span class="unit">THB</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="row box ml-0 mr-0">
                  <a href="#attachmentLists" class="d-flex w-100 btnToggle">
                    <div class="col-12">
                      <h3 class="border-bottom gray-1">Attachments</h3>
                    </div>
                  </a>
                  <div id="attachmentLists" class="w-100">
                    <div class="card card-body noborder">
                      <div class="row">
                        <div class="col-6">
                          <div class="row">
                            <p class="col-4 text-right nopadding">
                              Attach Tax Invoice :
                            </p>
                            <p class="col-6">
                              {this.props.mainState.stepThreeProp
                                .taxInvoiceFiles.length > 0
                                ? this.props.mainState.stepThreeProp.taxInvoiceFiles.map(
                                    file => (
                                      <div>
                                        <span className="fileName">
                                          {this.sliceFileName(file.name)}
                                        </span>
                                      </div>
                                    )
                                  )
                                : "-"}
                            </p>{" "}
                          </div>{" "}
                          <div class="row">
                            <p class="col-4 text-right nopadding">
                              Receipt NO. :
                            </p>
                            <p class="col-6">
                              {this.props.mainState.stepThreeProp.receiptNo ||
                                ""}
                            </p>
                          </div>
                        </div>
                        <div class="col-6">
                          <div class="row">
                            <p class="col-4 text-right nopadding">
                              Attach Delivery Note :
                            </p>
                            <p class="col-6">
                              {this.props.mainState.stepThreeProp
                                .deliveryNoteFiles.length > 0
                                ? this.props.mainState.stepThreeProp.deliveryNoteFiles.map(
                                    file => (
                                      <div>
                                        <span className="fileName">
                                          {this.sliceFileName(file.name)}
                                        </span>
                                      </div>
                                    )
                                  )
                                : "-"}
                            </p>
                          </div>
                          <div class="row">
                            <p class="col-4 text-right nopadding">
                              Attach Receipt :
                            </p>
                            <p class="col-6">
                              {this.props.mainState.stepThreeProp
                                .receiptFiles &&
                              this.props.mainState.stepThreeProp.receiptFiles
                                .length > 0
                                ? this.props.mainState.stepThreeProp.receiptFiles.map(
                                    file => (
                                      <div>
                                        <span className="fileName">
                                          {this.sliceFileName(file.name)}
                                        </span>
                                      </div>
                                    )
                                  )
                                : "-"}
                            </p>
                          </div>
                          <div class="row">
                            <p class="col-4 text-right nopadding">
                              Attach Other Documents :
                            </p>
                            <p class="col-6">
                              {(this.props.mainState.stepThreeProp
                                .receiptFiles &&
                                this.props.mainState.stepThreeProp.otherFile) ||
                              "".length > 0
                                ? this.props.mainState.stepThreeProp.otherFiles.map(
                                    file => (
                                      <div>
                                        <span className="fileName">
                                          {this.sliceFileName(file.name)}
                                        </span>
                                      </div>
                                    )
                                  )
                                : "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="row box ml-0 mr-0">
                  <a href="#tax3" class="d-flex w-100 btnToggle">
                    <div class="col-10">
                      <h3 class="gray-1">Items Information</h3>
                    </div>
                    <div class="col-4" style={{ paddingTop: "15px" }}>
                      <div className="custom-control custom-checkbox">
                        <input
                          type="checkbox"
                          id="selectGroupGRItems"
                          class="custom-control-input"
                          onChange={() => {
                            this.checkGroupGRItems();
                          }}
                        />
                        <label
                          className="custom-control-label pl-1"
                          for="selectGroupGRItems"
                        >
                          Group GR Items
                        </label>
                      </div>
                    </div>
                  </a>
                  <div id="tax3" class="w-100">
                    <div class="card card-body noborder">
                      <div class="row">
                        <div class="col-12">
                          <div class="table_wrapper">
                            <table
                              id="grItemsTable"
                              class="table datatable"
                              ref={el => (this.el = el)}
                            >
                              <thead>
                                <tr>
                                  <th>PO No.</th>
                                  <th>PO Item No.</th>
                                  <th>GR Item No.</th>
                                  <th>Ref No.</th>
                                  <th>Material Description</th>
                                  <th>Qty</th>
                                  <th>Unit Description</th>
                                  <th>Unit Price</th>
                                  <th>Sub Total</th>
                                  <th>Currency</th>
                                </tr>
                              </thead>
                              <tbody />
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="row w-100">
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
                  onClick={this.props.previousStep}
                  class="btn btn--transparent btn-wide"
                >
                  <i class="fa fa-chevron-left" /> Back
                </button>
                <button
                  type="submit"
                  name="btnSubmit"
                  id="btnSubmit"
                  class="btn btn-wide"
                  onClick={() => this.submitToCreateInvoice()}
                >
                  Submit
                </button>
              </div>
            </div>
            <div class="row">&nbsp;</div>
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
            id="errorWarning"
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
                    Create Invoice Failed
                  </h3>
                </div>
                <div class="modal-body d-flex" style={{ margin: "auto" }}>
                  Unable to create invoice because <br />
                  {this.state.createErrMessage}
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

export default createInvoiceByGrStepFour;
