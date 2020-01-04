import _ from "lodash";
import moment from "moment";
import "daterangepicker";
import Router from "next/router";
import React, { Component } from "react";
import io from "socket.io-client";
import BlockUi from "react-block-ui";
import { findDOMNode } from "react-dom";
import ReactTooltip from "react-tooltip";
import Layout from "../components/Layout";
import ApiService from "../libs/ApiService";
import "../libs/mycools";
import GA from "~/libs/ga";
import {
  asyncContainer,
  Typeahead
} from "../libs/react-bootstrap-typeahead/lib";
import withAuth from "../libs/withAuth";

const AsyncTypeahead = asyncContainer(Typeahead);
const poSearchApiUrl =
  "/api/purchaseorders?bypass=true&statuses=CONFIRMED&purchaseOrderNumber=";

const Api = new ApiService();

const lifecycleResubmit = ["PENDING_SELLER"];
const lifecycleEdit = ["ISSUED", "MISSING", "PARTIAL"];

const poItemColumnPattern = [
  { data: "selected" },
  { data: "poItemNo" },
  { data: "materialDescription" },
  { data: "poItemQtyRemaining" },
  { data: "poItemQtyInitial" },
  { data: "unitDescription" },
  { data: "poItemUnitPrice" },
  { data: "amount" },
  { data: "poItemUnitPriceCurrency" }
];

const addPOIcon = <i class="fa fa-plus" />;

const getSuggestionValue = suggestion => suggestion.purchaseOrderNumber;

const renderSuggestion = suggestion => (
  <button class="list-btn add">
    {addPOIcon}
    {suggestion.purchaseOrderNumber}
  </button>
);
class invoiceDetailEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      //Permission
      isIssued: false,
      //
      blocking: false,
      initialInvoiceNumber: "",
      linearId: "",
      invoiceNumber: "",
      invoicePOHeader: "",
      configuration: {},
      invoiceDetailData: {},
      innerPurchaseItem: {},
      innerAccounting: {},
      noteReferItemNumber: 0,
      noteSettledItemNumber: 0,
      invoiceFinancingChecked: "",
      attachmentTaxInvoice: {},
      attachmentReceipt: {},
      attachmentDeliveryNote: {},
      attachmentOther: {},
      purchaseItems: [],
      populatedPO: [],
      activePO: 0,
      AllPO: [],
      isAllowResubmit: false,
      isInvoiceDup: false,
      inputPONumber: "",
      invoiceDate: "",
      poHeaderList: [],
      //Attachment
      fileAttachments: [],
      taxInvoiceFiles: [],
      taxInvoiceFilesNew: [],
      deliveryNoteFiles: [],
      deliveryNoteFilesNew: [],
      receiptFiles: [],
      receiptFilesNew: [],
      otherFiles: [],
      otherFilesNew: [],
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
      TaxInvoiceAction: [],
      DeliveryNoteAction: [],
      ReceiptAction: [],
      OtherAction: [],
      //Initial Resource
      mainPO: {},
      activePOItems: [],
      poSuggestions: [],
      //Element
      poItemDataTable: undefined,
      //NewPOModal
      po_code: "",
      po_name: "",
      po_taxId: "",
      po_tel: "",
      po_branch: "",
      po_address: "",
      //POItemsTable
      isPurchaseOrderSelected: true,
      isQtyExceeded: false,
      selectedPOItems: {},
      isAddPOInputTriggered: false,
      isInvoiceCompanyUpdated: false,
      isInvoiceInEmptyPOState: false,
      editErrMessage: "",
      maximumQtyTooltip: "-",
      editFileOnly: false
    };
    this.layout = React.createRef();
  }

  componentDidMount() {
    this.socket = io.connect("/edit-invoice");
    this.getInvoiceDetailData(this.props.url.query.linearId);
    this.getPurchasesOrders();
    this.setState({
      linearId: this.props.url.query.linearId
    });
    $(".datepicker").on("change", event => {
      this.setState({
        [event.target.name]: $("#" + event.target.id).val()
      });
    });
  }

  toggleBlocking() {
    this.setState({ blocking: !this.state.blocking });
  }

  resolvePermission() {
    if (lifecycleEdit.includes(this.state.invoiceDetailData.lifecycle)) {
      this.setState({
        isIssued: true
      });
    } else {
      this.setState({
        isIssued: false
      });
    }
  }
  componentWillUnmount() {
    this.state = [];
    this.socket.disconnect();
  }
  resolveFilesRequiredUploaded() {
    let taxUploaded = true;
    let deliveryUploaded = true;
    let receiptUploaded = true;
    let otherUploaded = true;

    if (this.state.isTaxInvoiceRequired) {
      if (
        this.state.taxInvoiceFiles.length === 0 &&
        this.state.taxInvoiceFilesNew.length === 0
      ) {
        taxUploaded = false;
      }
    }
    if (this.state.isDeliveryNoteRequired) {
      if (
        this.state.deliveryNoteFiles.length === 0 &&
        this.state.deliveryNoteFilesNew.length === 0
      ) {
        deliveryUploaded = false;
      }
    }
    if (this.state.isReceiptRequired) {
      if (
        this.state.receiptFiles.length === 0 &&
        this.state.receiptFilesNew.length === 0
      ) {
        receiptUploaded = false;
      }
    }
    if (this.state.isOtherRequired) {
      if (
        this.state.otherFiles.length === 0 &&
        this.state.otherFilesNew.length === 0
      ) {
        otherUploaded = false;
      }
    }

    return taxUploaded && deliveryUploaded && receiptUploaded && otherUploaded;
  }

  resolveAllowToResubmitEdit() {
    if (
      !this.state.isQtyExceeded &&
      this.state.isPurchaseOrderSelected &&
      this.resolveFilesRequiredUploaded()
    ) {
      this.setState({
        isAllowResubmit: true
      });
    } else {
      this.setState({
        isAllowResubmit: false
      });
    }
  }

  getInvoiceDetailData(id) {
    this.setState({
      blocking: true
    });
    Api.getInvoiceDetail(id)
      .then(res => {
        this.setState({
          invoiceDetailData: res.rows[0],
          innerPurchaseItem: res.rows[0].items[0].purchaseItem,
          innerAccounting: res.rows[0].accounting,
          purchaseItems: res.rows[0].items,
          invoiceDate: moment(res.rows[0].invoiceDate).format("DD/MM/YYYY")
        });
      })
      .then(async () => {
        await Api.getInvoiceConfiguration(
          this.state.invoiceDetailData.buyer.legalName,
          this.state.invoiceDetailData.companyTaxNumber,
          this.state.invoiceDetailData.vendorTaxNumber
        )
          .then(res => {
            this.setState({
              configuration: res
            });
          })
          .then(() => {
            this.initCalendar("existed");
            this.resolveFileRequired();
            this.populateNumberRequiredFileString();
          });

        let poHeaderList = this.extractInvoicePOHeaderNumber(
          this.state.invoiceDetailData.purchaseOrderHeaderNumber
        );
        let mainPONumber = poHeaderList[0];

        this.setState(
          {
            initialInvoiceNumber: this.state.invoiceDetailData.externalId,
            invoiceNumber: this.state.invoiceDetailData.externalId,
            invoiceFinancingChecked: this.state.invoiceDetailData
              .invoiceFinancing,
            invoicePOHeader: mainPONumber,
            poHeaderList: poHeaderList
          },
          () => this.initSelectedRow()
        );

        Api.getPOByPONumber(mainPONumber).then(res => {
          let po = res.data.find(po => {
            return po.purchaseOrderNumber === mainPONumber;
          });
          this.setState({
            mainPO: po,
            blocking: false
          });
          if (po && po.linearId) {
            Api.getPOItemsByPOId(po.linearId).then(res => {
              let itemList = this.filterItemByCondition(res.data);
              this.getPOItems(mainPONumber, itemList);
            });
          }
        });

        this.populateAttachmentsToState(
          this.state.invoiceDetailData.fileAttachments
        );
        this.populatePurchaseOrderFromItems();
        this.resolvePermission();
        this.resolveAllowToResubmitEdit();
      });
  }

  getPurchasesOrders() {
    Api.getPOTableData().then(res => {
      this.setState({
        AllPO: res.data
      });
    });
  }

  getPurchasesOrdersByCompany(
    vendorTaxId,
    businessPlaceTaxNumber,
    companyBranchCode,
    paymentTermDays
  ) {
    Api.getMorePODataByCompany(
      vendorTaxId,
      businessPlaceTaxNumber,
      companyBranchCode,
      paymentTermDays
    ).then(res => {
      this.setState({
        AllPO: res.data
      });
    });
  }

  initCalendar(existed) {
    const { configuration, invoiceDate } = this.state;
    let d = new Date();
    let todayDate =
      "" + d.getDate() + "/" + (d.getMonth() + 1) + "/" + (d.getFullYear() + 3);
    $(function() {
      let datePickerOpts = {
        singleDatePicker: true,
        showDropdowns: true,
        locale: {
          format: "DD/MM/YYYY"
        },
        startDate: invoiceDate
      };

      if (configuration.minimumDocumentEffectiveDate) {
        datePickerOpts = {
          ...datePickerOpts,
          minDate: moment(configuration.minimumDocumentEffectiveDate).format(
            "DD/MM/YYYY"
          )
        };
      }
      if (configuration.maximumDocumentEffectiveDate) {
        datePickerOpts = {
          ...datePickerOpts,
          maxDate: moment(configuration.maximumDocumentEffectiveDate).format(
            "DD/MM/YYYY"
          )
        };
      }

      $(".datepicker").daterangepicker(datePickerOpts);

      // $(".datepicker")
      //   .daterangepicker({
      //     singleDatePicker: true,
      //     showDropdowns: true,
      //     minDate: moment(
      //       this.state.configuration.minimumDocumentEffectiveDate
      //     ).format("DD/MM/YYYY"),
      //     maxDate: moment(
      //       this.state.configuration.maximumDocumentEffectiveDate
      //     ).format("DD/MM/YYYY"),
      //     locale: {
      //       format: "DD/MM/YYYY"
      //     }
      //   })
      //   .on("change", event => {
      //     this.setState({
      //       [event.target.name]: window.jQuery("#" + event.target.id).val()
      //     });
      //   });
    });

    // if (this.state.invoiceDate === "") {
    //   window.jQuery(".datepicker").val("");
    // } else {
    //   if (existed !== undefined) {
    //       $("#invoice_date")
    //         .data("daterangepicker")
    //         .setStartDate(this.state.invoiceDate);

    //       $("#invoice_date")
    //         .data("daterangepicker")
    //         .setEndDate(this.state.invoiceDate);
    //   }
    // }
  }

  initSelectedRow() {
    let selectedPOItems = this.state.selectedPOItems;
    let purchaseItems = this.state.purchaseItems;
    let poList = this.state.poHeaderList;

    poList.forEach(poNumber => {
      let rowSelected = [];
      let itemSelected = [];
      Api.getPOByPONumber(poNumber).then(res => {
        let po = res.data.find(po => {
          return po.purchaseOrderNumber === poNumber;
        });
        if (po && po.linearId) {
          Api.getPOItemsByPOId(po.linearId)
            .then(res => {
              let itemList = this.filterItemByCondition(res.data);
              this.updatePOItemsNumber(poNumber, itemList.length);
              purchaseItems.forEach(pItem => {
                let foundItem = itemList.find(poItem => {
                  return poItem.linearId === pItem.purchaseItemLinearId;
                });
                if (foundItem != undefined) {
                  rowSelected.push(pItem.purchaseItemExternalId);
                  foundItem.quantity.initial = pItem.quantity.initial;
                  itemSelected.push(foundItem);
                }
              });
            })
            .then(() => {
              selectedPOItems[po.purchaseOrderNumber] = {
                rowSelected: rowSelected,
                item: itemSelected
              };
            });
        }
      });
    });
    this.setState({
      selectedPOItems: selectedPOItems
    });
  }

  updatePOItemsNumber(addingPONumber, count) {
    let populatedPO = this.state.populatedPO;
    let index = populatedPO.findIndex(item => {
      return item.poNumber === addingPONumber;
    });

    populatedPO[index].count = count;

    this.setState({
      populatedPO: populatedPO
    });
  }

  async getPOItems(poNumber, itemList) {
    this.setState({
      activePOItems: itemList
    });
    this.updatePOItemsNumber(poNumber, itemList.length);

    let selectedPOItems = this.state.selectedPOItems;
    let selectedPOItemsKeys = Object.keys(selectedPOItems);
    let rowSelected = [];
    let itemSelected = [];

    if (selectedPOItemsKeys.includes(poNumber)) {
      rowSelected = selectedPOItems[poNumber].rowSelected;
      itemSelected = selectedPOItems[poNumber].item;
    }

    if (this.state.poItemDataTable === undefined) {
      this.renderPOItemTable(itemList);
    } else {
      let data = [];
      let selectedPOItems = this.state.selectedPOItems;
      let pointer = 0;
      let poNumber = this.state.activePO;

      itemList.forEach((item, index) => {
        if (this.state.configuration.autoPopulateInvoiceItemQuantity === true) {
          item.quantity.initial = item.quantity.remaining;
        } else {
          item.quantity.initial = 0;
        }
        let invoiceItem = this.getAddedInvoiceItem(item);
        let qty = 0;
        let unitPrice = item.poItemUnitPrice;
        if (poNumber in selectedPOItems) {
          if (selectedPOItems[poNumber].rowSelected.length != 0) {
            if (selectedPOItems[poNumber].rowSelected.includes(item.poItemNo)) {
              qty = selectedPOItems[poNumber].item[pointer].quantity.initial;
              unitPrice =
                selectedPOItems[poNumber].item[pointer].poItemUnitPrice;
              pointer++;
            } else {
              qty = item.quantity.initial;
            }
          }
        } else {
          qty =
            invoiceItem === undefined
              ? item.quantity.initial
              : invoiceItem.quantity.initial;
        }
        data.push({
          selected:
            '<div className="custom-control custom-checkbox">' +
            '<input type="checkbox" className="custom-control-input" id="select-' +
            item.poItemNo +
            '"></input>' +
            '<label className="custom-control-label pl-1 font-small text-shadow" for="selectall"></label>' +
            "</div>",
          poItemNo: item.poItemNo,
          materialDescription: item.materialDescription,
          poItemQtyRemaining: this.formatQtyNumber(item.quantity.remaining),
          poItemQtyInitial:
            '<input disabled type="text" ref="qty-ref-' +
            item.poItemNo +
            '" data-tip="custom show" data-event="focus" data-event-off="blur" data-for="maximumQty" id="qty-select-' +
            item.poItemNo +
            '" value="' +
            this.formatQtyNumber(qty) +
            '" class="form-control" width="80" pattern="^[0-9]*$"></input>',
          unitDescription: item.quantity.unit,
          poItemUnitPrice:
            "estimatedUnitPrice" in item
              ? '<input disabled type="text" id="unit-select-' +
                item.poItemNo +
                '" value="' +
                this.formatPriceNumber(unitPrice) +
                '" class="form-control"></input>'
              : this.formatPriceNumber(unitPrice),
          amount:
            '<div id="amount-' +
            item.poItemNo +
            '">' +
            this.formatPriceNumber(
              (invoiceItem === undefined ? qty : invoiceItem.quantity.initial) *
                unitPrice
            ) +
            "</div>",
          poItemUnitPriceCurrency: item.poItemUnitPriceCurrency
        });
      });

      this.state.poItemDataTable.clear();
      this.state.poItemDataTable.rows.add(data);
      this.state.poItemDataTable.draw();
    }

    $("[id^='select-']")
      .parents("tr")
      .prop("className", "odd");

    $("[id^='select-']").prop("checked", "");

    rowSelected.forEach(row => {
      window
        .jQuery("[id^='select-" + row + "']")
        .parents("tr")
        .prop("className", "even");

      window.jQuery("[id^='select-" + row + "']").prop("checked", "checked");
      window.jQuery("#qty-select-" + row).prop("disabled", false);
      window.jQuery("#unit-select-" + row).prop("disabled", false);
    });

    await this.shouldPOItemsSelectAll();
  }

  populatePurchaseOrderFromItems() {
    let items = this.state.purchaseItems;
    let populatedPO = this.state.populatedPO;
    items.forEach(item => {
      let cursorPOId = item.purchaseOrderExternalId;
      let existingPO = populatedPO.find(PO => {
        return PO.poNumber == cursorPOId;
      });
      if (existingPO === undefined) {
        populatedPO.push({
          poNumber: item.purchaseOrderExternalId,
          count: 1
        });
      } else {
        let toUpdateIndex = populatedPO.findIndex(PO => {
          return PO.poNumber === cursorPOId;
        });
        populatedPO[toUpdateIndex].count++;
      }
    });
    this.setState({
      populatedPO: populatedPO,
      activePO: populatedPO[0].poNumber
    });
  }

  routeBack() {
    Router.push("/invoice-detail?linearId=" + this.state.linearId);
  }

  handleKeyInToCheckDuplicateInvoice(keyInInvoice) {
    Api.getInvoiceByNumber(keyInInvoice).then(res => {
      let matchInvoice = res.data.find(invoice => {
        return invoice.externalId === keyInInvoice;
      });

      if (
        matchInvoice === undefined ||
        keyInInvoice === this.state.initialInvoiceNumber
      ) {
        this.setState({
          isInvoiceDup: false
        });
      } else {
        this.setState({
          isInvoiceDup: true
        });
      }
    });
  }

  formatCurrency(amount) {
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(amount);
  }

  handleInvoiceFinancingRadioChange = changeEvent => {
    this.setState({
      invoiceFinancingChecked: changeEvent.target.value
    });
  };

  handleSelectedFile = event => {
    let filetype = event.target.name;
    let files = event.target.files;
    let data = new FormData();
    data.append("file", files[0]);
    if (this.isValidToUpload(files[0], filetype)) {
      files[0].data = data;
      if (filetype === "attach_tax_invoice_file") {
        let taxInvoiceFiles = this.state.taxInvoiceFilesNew;
        taxInvoiceFiles.push(files[0]);
        this.setState({
          taxInvoiceFilesNew: taxInvoiceFiles
        });
      } else if (filetype === "attach_receipt") {
        let receiptFiles = this.state.receiptFilesNew;
        receiptFiles.push(files[0]);
        this.setState({
          receiptFilesNew: receiptFiles
        });
      } else if (filetype === "attach_delivery_file") {
        let deliveryNoteFiles = this.state.deliveryNoteFilesNew;
        deliveryNoteFiles.push(files[0]);
        this.setState({
          deliveryNoteFilesNew: deliveryNoteFiles
        });
      } else if (filetype === "attach_other_file") {
        let otherFiles = this.state.otherFilesNew;
        otherFiles.push(files[0]);
        this.setState({
          otherFilesNew: otherFiles
        });
      }
      this.resolveAllowToResubmitEdit();
    }
    event.target.value = null;
  };

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
          this.state.taxInvoiceFiles.length +
            this.state.taxInvoiceFilesNew.length <
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
          this.state.receiptFiles.length + this.state.receiptFilesNew.length <
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
          this.state.deliveryNoteFiles.length +
            this.state.deliveryNoteFilesNew.length <
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
          this.state.otherFiles.length + this.state.otherFilesNew.length <
          filesConfig[3].maximumNumberOfFiles
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

  handleDeselectedFile(type, fileIndex) {
    let files = this.state[type];
    files.splice(fileIndex, 1);

    this.setState(
      {
        type: files
      },
      () => {
        this.resolveAllowToResubmitEdit();
      }
    );
  }

  async renderPOItemTable(poItems) {
    var data = [];
    let selectedPOItems = this.state.selectedPOItems;
    let pointer = 0;
    let poNumber = this.state.activePO;
    poItems.forEach((item, index) => {
      if (this.state.configuration.autoPopulateInvoiceItemQuantity === true) {
        item.quantity.initial = item.quantity.remaining;
      } else {
        item.quantity.initial = 0;
      }
      let invoiceItem = this.getAddedInvoiceItem(item);
      let qty = 0;
      let unitPrice = item.poItemUnitPrice;
      if (poNumber in selectedPOItems) {
        if (selectedPOItems[poNumber].rowSelected.length != 0) {
          if (selectedPOItems[poNumber].rowSelected.includes(item.poItemNo)) {
            qty =
              invoiceItem === undefined
                ? selectedPOItems[poNumber].item[pointer].quantity.initial
                : invoiceItem.quantity.initial;
            unitPrice =
              invoiceItem === undefined
                ? selectedPOItems[poNumber].item[pointer].poItemUnitPrice
                : invoiceItem.unitPrice;
            if (invoiceItem !== undefined) {
              this.state.selectedPOItems[poNumber].item[
                pointer
              ].poItemUnitPrice = invoiceItem.unitPrice;
            }

            pointer++;
          } else {
            qty = item.quantity.initial;
          }
        }
      } else {
        qty =
          invoiceItem === undefined
            ? item.quantity.initial
            : invoiceItem.quantity.initial;
      }
      data.push({
        selected:
          '<div className="custom-control custom-checkbox">' +
          '<input checked="checked" type="checkbox" id="select-' +
          item.poItemNo +
          '"></input>' +
          '<label className="custom-control-label pl-1 font-small text-shadow" for="selectall"></label>' +
          "</div>",
        poItemNo: item.poItemNo,
        materialDescription: item.materialDescription,
        poItemQtyRemaining: this.formatQtyNumber(item.quantity.remaining),
        poItemQtyInitial:
          '<input disabled type="text" ref="qty-ref-' +
          item.poItemNo +
          '" data-tip="custom show" data-event="focus" data-event-off="blur" data-for="maximumQty" id="qty-select-' +
          item.poItemNo +
          '" value="' +
          this.formatQtyNumber(qty) +
          '" class="form-control" width="80" pattern="^[0-9]*$"></input>',
        unitDescription: item.quantity.unit,
        poItemUnitPrice:
          "estimatedUnitPrice" in item
            ? '<input disabled type="text" id="unit-select-' +
              item.poItemNo +
              '" value="' +
              this.formatPriceNumber(unitPrice) +
              '" class="form-control"></input>'
            : this.formatPriceNumber(unitPrice),
        amount:
          '<div id="amount-' +
          item.poItemNo +
          '">' +
          this.formatPriceNumber(
            (invoiceItem === undefined ? qty : invoiceItem.quantity.initial) *
              unitPrice
          ) +
          "</div>",
        poItemUnitPriceCurrency: item.poItemUnitPriceCurrency
      });
    });
    var dts = window
      .jQuery(this.el)
      .DataTable({
        autoWidth: false,
        language: {
          lengthMenu: "Display _MENU_ Per Page"
        },
        scrollX: true,

        data: data,
        columns: poItemColumnPattern,
        createdRow: function(row, data, dataIndex) {
          if (dataIndex % 2 == 0) {
            $(row).addClass("even");
          } else $(row).addClass("odd");
        },
        columnDefs: [
          {
            targets: [0],
            orderable: false,
            sortable: false
          },
          {
            targets: [1],
            width: "120px",
            orderable: false,
            sortable: false
          },
          {
            targets: [2],
            width: "300px",
            orderable: false,
            sortable: false
          },
          {
            targets: [3],
            width: "150px",
            orderable: false,
            sortable: false
          },
          {
            targets: [4],
            width: "100px",
            orderable: false,
            sortable: false
          },
          {
            targets: [5],
            width: "150px",
            orderable: false,
            sortable: false
          },
          {
            targets: [6],
            width: "120px",
            orderable: false,
            sortable: false
          },
          {
            targets: [7, 8],
            width: "100px",
            orderable: false,
            sortable: false
          }
        ],
        order: [[1, "asc"]],
        fixedHeader: false,
        stateSave: false,
        paging: false,
        bLengthChange: false,
        searching: false,
        info: false,
        ordering: false,
        responsive: false,
        width: "auto"
      })
      .on("error", function(e, settings, techNote, message) {
        console.log("An error has been reported by DataTables: ", message);
      });

    await $("[id^='select']").change(event => {
      this.handlePOItemSelect(event);
    });

    await $("[id^='qty-select-']").on("input", event => {
      this.handlePOItemQtyChange(event);
    });

    await $("[id^='qty-select-']").on("focus", event => {
      this.handlePOItemQtyFocus(event);
    });

    await $("[id^='qty-select-']").on("blur", event => {
      event.target.value = this.formatQtyNumber(
        this.formatNumberInput(event.target.value.replace(/[^0-9.]/gm, ""), 3)
      );
      this.validateQtyInput();
    });

    await $("[id^='unit-select-']").on("input", event => {
      this.handlePOItemUnitPriceChange(event);
    });

    await $("[id^='unit-select-']").on("blur", event => {
      event.target.value = this.formatPriceNumber(
        this.formatNumberInput(event.target.value.replace(/[^0-9.]/gm, ""), 2)
      );
    });

    await ReactTooltip.rebuild();

    this.setState({
      poItemDataTable: dts
    });
  }

  handlePOItemQtyFocus(event) {
    if (event.target.value === "0.000") {
      event.target.value = "";
    }
    event.target.value = event.target.value.replace(/,/g, "");
    let arr = event.target.id.split("-");
    let itemRef = arr[2];
    ReactTooltip.show(findDOMNode(this.refs["qty-ref-" + itemRef]));
    let selectedPOItems = this.state.selectedPOItems;
    let targetItem = selectedPOItems[this.state.activePO].item.find(item => {
      return item.poItemNo === itemRef;
    });

    let invoiceItem = this.state.invoiceDetailData.items.find(item => {
      return item.purchaseItemLinearId === targetItem.linearId;
    });

    this.setState({
      maximumQtyTooltip: this.formatQtyNumber(
        targetItem.quantity.remaining +
          targetItem.overDeliveryQuantity.remaining +
          (invoiceItem === undefined ? 0 : invoiceItem.quantity.initial)
      )
    });
  }

  validateQtyInput() {
    let activePO = this.state.activePO;
    let isQtyExceededFound = false;
    let selectedPOItems = this.state.selectedPOItems;
    _.forOwn(selectedPOItems, (value, key) => {
      let poItems = selectedPOItems[key].item;
      poItems.forEach((item, index) => {
        let invoiceItem = this.state.invoiceDetailData.items.find(invItem => {
          return (
            invItem.purchaseItemExternalId === item.poItemNo &&
            invItem.purchaseOrderExternalId === item.poNumber
          );
        });
        let maximumQty =
          item.quantity.remaining +
          item.overDeliveryQuantity.remaining +
          (invoiceItem === undefined ? 0 : invoiceItem.quantity.initial);

        let validateQty =
          invoiceItem === undefined
            ? item.quantity.initial
            : invoiceItem.quantity.initial;
        if (
          parseFloat(maximumQty) < parseFloat(item.quantity.initial) ||
          parseFloat(item.quantity.initial) === 0
        ) {
          if (key === activePO) {
            window.jQuery("#qty-select-" + item.poItemNo).css("color", "red");
          }
          isQtyExceededFound = true;
        } else {
          if (key === activePO) {
            window.jQuery("#qty-select-" + item.poItemNo).css("color", "");
          }
        }
      });
    });

    if (isQtyExceededFound) {
      this.setState(
        {
          isQtyExceeded: true
        },
        () => this.resolveAllowToResubmitEdit()
      );
    } else {
      this.setState(
        {
          isQtyExceeded: false
        },
        () => this.resolveAllowToResubmitEdit()
      );
    }
  }

  async handlePOItemQtyChange(event) {
    event.target.value = this.formatNumberInput(
      event.target.value.replace(/[^0-9.]/gm, ""),
      3
    );
    let selectedPOItems = this.state.selectedPOItems;
    let changeQty = event.target.value;
    let arr = event.target.id.split("-");
    let itemRef = arr[2];
    let targetItem = selectedPOItems[this.state.activePO].item.find(item => {
      return item.poItemNo === itemRef;
    });
    let invoiceItem = this.state.invoiceDetailData.items.find(item => {
      return item.purchaseItemLinearId === targetItem.linearId;
    });

    targetItem.quantity.initial = +changeQty;
    let inputUnitPrice = $("#unit-select-" + targetItem.poItemNo).val();
    inputUnitPrice = this.formatNumberInput(
      inputUnitPrice.replace(/[^0-9.]/gm, ""),
      2
    );
    window
      .jQuery("#amount-" + targetItem.poItemNo)
      .text(
        this.formatPriceNumber(
          +changeQty *
            parseFloat(
              $("#unit-select-" + targetItem.poItemNo).val() === undefined
                ? targetItem.poItemUnitPrice
                : inputUnitPrice
            )
        )
      );
    this.validateQtyInput();
    await this.setState({
      selectedPOItems: selectedPOItems
    });
  }

  async handlePOItemUnitPriceChange(event) {
    event.target.value = this.formatNumberInput(
      event.target.value.replace(/[^0-9.]/gm, ""),
      2
    );
    let selectedPOItems = this.state.selectedPOItems;
    let changeUnit = event.target.value;
    let arr = event.target.id.split("-");
    let itemRef = arr[2];
    let targetItem = selectedPOItems[this.state.activePO].item.find(item => {
      return item.poItemNo === itemRef;
    });

    targetItem.poItemUnitPrice = +changeUnit;

    window
      .jQuery("#amount-" + targetItem.poItemNo)
      .text(this.formatPriceNumber(+changeUnit * targetItem.quantity.initial));

    await this.setState({
      selectedPOItems: selectedPOItems
    });
  }

  async handlePOItemSelect(event) {
    let element = event.target;

    if (element.id === "selectall") {
      if (!element.checked) {
        window.jQuery("[id^='select']").prop("checked", false);
        window
          .jQuery("[id^='select-']")
          .parents("tr")
          .prop("className", "odd");
        window.jQuery("[id^='qty-select-']").prop("disabled", true);
        window.jQuery("[id^='unit-select-']").prop("disabled", true);
      } else {
        window.jQuery("[id^='select']").prop("checked", true);
        window
          .jQuery("[id^='select-']")
          .parents("tr")
          .prop("className", "even");
        window.jQuery("[id^='qty-select-']").prop("disabled", false);
        window.jQuery("[id^='unit-select-']").prop("disabled", false);
      }
    } else {
      this.shouldPOItemsSelectAll();
      if (element.checked) {
        event.originalEvent.path[3].className = "even";
        window.jQuery("#qty-" + element.id).prop("disabled", false);
        window.jQuery("#unit-" + element.id).prop("disabled", false);
      } else {
        event.originalEvent.path[3].className = "odd";
        window.jQuery("#qty-" + element.id).prop("disabled", true);
        window.jQuery("#unit-" + element.id).prop("disabled", true);
      }
    }

    let selectedPOItems = this.state.selectedPOItems;
    let selectedPOItemsActivePO = [];
    let poItems = this.state.activePOItems;
    let rowSelected = [];
    poItems.forEach((item, index) => {
      let qtyFieldValue = $("#qty-select-" + item.poItemNo).val();

      if (window.jQuery("#select-" + item.poItemNo)[0].checked) {
        let selectedItems = selectedPOItems[this.state.activePO];
        let selectedItem =
          selectedItems === undefined
            ? item
            : selectedItems.item.find(sItem => {
                return sItem.poItemNo === item.poItemNo;
              });
        let addingItem = selectedItem === undefined ? item : selectedItem;
        let inputUnitPrice = $("#unit-select-" + item.poItemNo).val();
        inputUnitPrice = this.formatNumberInput(
          inputUnitPrice.replace(/[^0-9.]/gm, ""),
          2
        );
        qtyFieldValue = parseInt(qtyFieldValue.replace(",", ""));
        addingItem.quantity.initial = +qtyFieldValue;
        window
          .jQuery("#amount-" + item.poItemNo)
          .text(
            this.formatPriceNumber(
              +qtyFieldValue *
                parseFloat(
                  $("#unit-select-" + item.poItemNo).val() === undefined
                    ? item.poItemUnitPrice
                    : inputUnitPrice
                )
            )
          );
        item.linearId = "";
        rowSelected.push(
          selectedItem === undefined ? item.poItemNo : selectedItem.poItemNo
        );
        selectedPOItemsActivePO.push(addingItem);
      }
    });

    selectedPOItems[this.state.activePO] = {
      rowSelected: rowSelected,
      item: selectedPOItemsActivePO
    };
    await this.setState(
      {
        selectedPOItems: selectedPOItems
      },
      () => this.validateQtyInput()
    );

    await this.checkIsPurchaseOrderSelected();
  }

  shouldPOItemsSelectAll() {
    let isSelectAll = true;
    let poItems = this.state.activePOItems;
    poItems.forEach(item => {
      if (!window.jQuery("#select-" + item.poItemNo)[0].checked) {
        window.jQuery("#selectall").prop("checked", false);
        isSelectAll = false;
      }
      if (isSelectAll) {
        window.jQuery("#selectall").prop("checked", true);
      }
    });
  }

  async checkIsPurchaseOrderSelected() {
    let isSelected = false;
    let editedPO = Object.keys(this.state.selectedPOItems);
    for (let i = 0; i < editedPO.length; i++) {
      if (this.state.selectedPOItems[editedPO[i]].item.length > 0) {
        isSelected = true;
      }
    }
    this.setState({
      isPurchaseOrderSelected: isSelected
    });
    await this.resolveAllowToResubmitEdit();
  }

  handleAddPOButton() {}

  handleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });

    if (event.target.name === "invoiceNumber") {
      this.handleKeyInToCheckDuplicateInvoice(event.target.value);
    }
  }

  handlePOAutoCompleteChange(selectedPO) {
    if (selectedPO !== undefined) {
      let existingPO = this.state.populatedPO.find(po => {
        return po.poNumber === selectedPO.purchaseOrderNumber;
      });

      if (existingPO === undefined) {
        this.setState(
          {
            inputPONumber: selectedPO.purchaseOrderNumber
          },
          () => this.handleSubmitNewPO(selectedPO)
        );
      } else {
        this.setState({
          inputPONumber: ""
        });
      }
    }
  }

  handleNewPO() {
    let newPONumber = this.state.inputPONumber;
    let newPODetail = this.state.AllPO.find(po => {
      return po.purchaseOrderNumber === newPONumber;
    });
    if (newPODetail === undefined) {
      $("[name='inputPONumber']").focus();
    } else {
      this.setState({
        po_code: newPODetail.paymentTermCode,
        po_name: newPODetail.companyName,
        po_taxId: newPODetail.businessPlaceTaxNumber,
        po_tel: newPODetail.businessPlaceTelephone,
        po_branch: newPODetail.companyBranchName,
        po_address: newPODetail.businessPlaceAddress1
      });
    }
  }

  handleSubmitNewPO(selectedPO) {
    let newPONumber = this.state.inputPONumber;
    if (this.checkPOConfiguration(newPONumber)) {
      let populatedPO = this.state.populatedPO;
      let newPOTemplate = {
        poNumber: this.state.inputPONumber,
        count: 1,
        vendorTaxNumber: selectedPO.vendorTaxNumber,
        businessPlaceTaxNumber: selectedPO.businessPlaceTaxNumber,
        companyBranchCode: selectedPO.companyBranchCode,
        paymentTermDays: selectedPO.paymentTermDays
      };

      this.handleSelectPO(newPONumber);

      populatedPO.push(newPOTemplate);
      this.setState({
        populatedPO: populatedPO,
        inputPONumber: "",
        isAddPOInputTriggered: false
      });
    } else {
      window.jQuery("#configWarning").modal("toggle");
    }
  }

  async checkPOConfiguration(PO) {
    let isValid = false;
    Api.getPOByPONumber(PO)
      .then(res => {
        return res.data.find(po => {
          return po.purchaseOrderNumber === PO;
        });
      })
      .then(po => {
        Api.getInvoiceConfiguration(
          po.accounting.legalName,
          po.businessPlaceTaxNumber,
          po.vendorTaxNumber
        ).then(config => {
          if (
            Object.keys(config).length === 0 ||
            !"attachmentConfiguration" in config
          ) {
            isValid = false;
          } else {
            isValid = true;
          }
        });
      })
      .then(() => {
        return isValid;
      });
  }

  handleSelectPO(poNumber) {
    this.setState({
      blocking: true
    });
    Api.getPOByPONumber(poNumber).then(res => {
      let po = res.data.find(po => {
        return po.purchaseOrderNumber === poNumber;
      });
      if (po && po.linearId) {
        Api.getPOItemsByPOId(po.linearId)
          .then(res => {
            let itemList = this.filterItemByCondition(res.data);
            if (itemList.length > 0) {
              this.getPOItems(poNumber, itemList);
            } else {
              window.jQuery("#itemConditionWarning").modal("toggle");
            }
          })
          .then(() => {
            this.validateQtyInput();
            $("[id^='select']").change(event => {
              this.handlePOItemSelect(event);
            });

            $("[id^='qty-select-']").on("input", event => {
              this.handlePOItemQtyChange(event);
            });

            $("[id^='qty-select-']").on("focus", event => {
              this.handlePOItemQtyFocus(event);
            });

            $("[id^='qty-select-']").on("blur", event => {
              event.target.value = Number.parseFloat(
                +this.formatNumberInput(event.target.value, 3)
              ).toFixed(3);
            });

            $("[id^='unit-select-']").on("input", event => {
              this.handlePOItemUnitPriceChange(event);
            });

            $("[id^='unit-select-']").on("blur", event => {
              event.target.value = Number.parseFloat(
                +this.formatNumberInput(event.target.value, 2)
              ).toFixed(2);
            });

            ReactTooltip.rebuild();
          });
      }
      this.setState(
        {
          activePO: poNumber,
          blocking: false
        },
        () => {
          this.validateQtyInput();
        }
      );
    });
  }

  handleRemovePO(poNumber) {
    let populatedPO = this.state.populatedPO;
    let selectedPOItems = this.state.selectedPOItems;

    populatedPO.splice(
      populatedPO.findIndex(po => po.poNumber === poNumber),
      1
    );
    delete selectedPOItems[poNumber];

    this.setState(
      {
        populatedPO: populatedPO,
        selectedPOItems: selectedPOItems
      },
      () => {
        if (this.state.populatedPO.length > 0) {
          if (this.state.activePO === poNumber) {
            this.handleSelectPO(this.state.populatedPO[0].poNumber);
          }
        } else {
          this.setState({
            isInvoiceInEmptyPOState: true
          });
          this.state.poItemDataTable.clear();
          this.state.poItemDataTable.rows.add([]);
          this.state.poItemDataTable.draw();
          this.getPurchasesOrders();
        }
      }
    );
  }

  onSuggestionsFetchRequested = ({ value }) => {
    let suggestionArray = [];
    let inputValue = value.trim().toLowerCase();
    let inputLength = inputValue.length;

    suggestionArray =
      inputLength < 3
        ? []
        : this.state.AllPO.filter(
            po =>
              po.purchaseOrderNumber.toLowerCase().slice(0, inputLength) ===
              inputValue
          );

    this.setState({
      poSuggestions: suggestionArray
    });
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      poSuggestions: []
    });
  };

  filterItemByCondition(poItems) {
    return poItems.filter(item => {
      return item.deleteFlag !== "BLOCKED" && item.deleteFlag !== "DELETED";
    });
  }

  ///// Upload ///////

  ///// Resubmit & Edit /////

  async editInvoice() {
    this.toggleBlocking();
    let uploadPromises = await this.populateFileAttachmentForEdit();
    Promise.all(uploadPromises).then(data => {
      let existingFile = this.populateExistingFileAttachment();
      let fileAttachments = data.concat(existingFile);

      let editedPOItems = this.populateEditedPOItemsToObject();
      let subTotal = this.calEditInvoiceAmount(editedPOItems);
      let vatTotal = this.calTaxInvoiceAmount(editedPOItems);
      let receiptNumber = null;
      if (this.state.invoiceDetailData.receiptNumber !== undefined) {
        receiptNumber = this.state.invoiceDetailData.receiptNumber;
      }
      let editInvoiceObject = {
        accounting: this.state.invoiceDetailData.accounting,
        buyer: this.state.invoiceDetailData.buyer,
        companyBranchCode: this.state.invoiceDetailData.companyBranchCode,
        companyBranchName: this.state.invoiceDetailData.companyBranchName,
        companyCode: this.state.invoiceDetailData.companyCode,
        companyName: this.state.invoiceDetailData.companyName,
        currency: this.state.invoiceDetailData.currency,
        customisedFields: this.state.invoiceDetailData.customisedFields,
        customisedFieldsUpdatedDate: this.state.invoiceDetailData
          .customisedFieldsUpdatedDate,
        documentEntryDate: moment().format("DD/MM/YYYY"),
        issuedDate: this.state.innerPurchaseItem.issuedDate,
        lastPartyUpdatedBy: this.state.innerPurchaseItem.lastPartyUpdatedBy,
        lastUpdatedBy: this.state.innerPurchaseItem.lastUpdatedBy,
        lastUpdatedDate: moment().toString(),
        lifecycle: this.state.invoiceDetailData.lifecycle,
        linearId: this.state.invoiceDetailData.linearId,
        purchaseOrderNumber: this.state.selectedPOItems[
          Object.keys(this.state.selectedPOItems)[0]
        ].item[0].poNumber,
        paymentTermCode: this.state.invoiceDetailData.paymentTermCode,
        paymentTermDays: this.state.invoiceDetailData.paymentTermDays,
        paymentTermDescription: this.state.invoiceDetailData.paymentTermDesc,
        items: editedPOItems,
        seller: this.state.invoiceDetailData.seller,
        status: this.state.invoiceDetailData.status,
        vendorAddress1: this.state.innerPurchaseItem.vendorStreet1,
        vendorBranchCode: this.state.invoiceDetailData.vendorBranchCode,
        vendorBranchName: "",
        vendorCity: this.state.innerPurchaseItem.vendorCity,

        vendorDistrict: this.state.innerPurchaseItem.vendorDistrict,
        vendorEmail: this.state.innerPurchaseItem.vendorEmail,
        vendorName: this.state.invoiceDetailData.vendorName,
        vendorNumber: this.state.invoiceDetailData.vendorNumber,
        vendorPostalCode: this.state.innerPurchaseItem.vendorPostalCode,
        vendorTaxNumber: this.state.invoiceDetailData.vendorTaxNumber,
        vendorTelephone: this.state.innerPurchaseItem.vendorTelephone,
        fileAttachments: fileAttachments,
        ////
        bank: this.state.invoiceDetailData.bank,
        baselineDate: moment().format("DD/MM/YYYY"),

        companyTaxNumber: this.state.invoiceDetailData.companyTaxNumber,
        companyAddress: this.state.invoiceDetailData.companyAddress,

        dueDate: this.state.invoiceDetailData.dueDate,
        dueDateIsLocked: this.state.invoiceDetailData.dueDateIsLocked,
        externalId: this.state.invoiceNumber.trim(),
        goodsReceived: this.state.invoiceDetailData.goodsReceived,
        initialDueDate: this.state.invoiceDetailData.initialDueDate,
        invoiceCreatedDate: this.state.invoiceDetailData.invoiceCreatedDate,
        invoiceDate: this.state.invoiceDate,
        invoiceFinancing: this.state.invoiceFinancingChecked,
        invoiceTotal: +subTotal + +vatTotal,
        isETaxInvoice: this.state.invoiceDetailData.isETaxInvoice,
        matchingStatus: this.state.invoiceDetailData.matchingStatus,
        paymentFee: this.state.invoiceDetailData.paymentFee,
        paymentTermDesc: this.state.invoiceDetailData.paymentTermDesc,
        purchaseOrder: this.state.invoiceDetailData.purchaseOrder,
        purchaseOrderHeaderNumber: this.state.invoiceDetailData
          .purchaseOrderHeaderNumber,
        receiptNumber: receiptNumber,
        restrictedMap: this.state.invoiceDetailData.restrictedMap,
        resubmitCount: this.state.invoiceDetailData.resubmitCount,
        subTotal: subTotal,
        totalPayable: +subTotal + +vatTotal,
        vatTotal: vatTotal,
        vendorAddress: this.state.invoiceDetailData.vendorAddress,
        disclosedMap: this.state.invoiceDetailData.disclosedMap
      };

      if (this.props.appenv.INV_EDIT_SUBMIT_SYNC === undefined) {
        Api.putEditInvoice(editInvoiceObject)
          .then(res => {
            this.toggleBlocking();
            Router.push(
              "/invoice-detail?linearId=" +
                this.state.invoiceDetailData.linearId
            );
          })
          .catch(err => {
            this.toggleBlocking();
            this.setState({
              editErrMessage: err.response.data.message
            });
            window.jQuery("#errorWarning").modal("toggle");
          });
      } else {
        if (this.props.appenv.INV_EDIT_SUBMIT_SYNC == false) {
          const aToken = this.props.token;
          this.socket.emit("edit-invoice", data, aToken);
          this.toggleBlocking();
          Router.push(
            "/invoice-detail?linearId=" + this.state.invoiceDetailData.linearId
          );
        } else {
          Api.putEditInvoice(editInvoiceObject)
            .then(res => {
              this.toggleBlocking();
              Router.push(
                "/invoice-detail?linearId=" +
                  this.state.invoiceDetailData.linearId
              );
            })
            .catch(err => {
              this.toggleBlocking();
              this.setState({
                editErrMessage: err.response.data.message
              });
              window.jQuery("#errorWarning").modal("toggle");
            });
        }
      }
    });
  }

  editFileInvoice = async () => {
    let uploadPromises = await this.populateFileAttachmentForEdit();

    const data = await Promise.all(uploadPromises);
    let existingFile = this.populateExistingFileAttachment();
    let fileAttachments = data.concat(existingFile);

    this.toggleBlocking();
    let resubmitInvoiceObject = {
      linearId: this.state.invoiceDetailData.linearId,
      lifecycle: this.state.invoiceDetailData.lifecycle,
      buyer: this.state.invoiceDetailData.buyer,
      seller: this.state.invoiceDetailData.seller,
      companyTaxNumber: this.state.invoiceDetailData.companyTaxNumber,
      fileAttachments: fileAttachments
    };
    Api.putEditFileInvoice(resubmitInvoiceObject)
      .then(res => {
        this.toggleBlocking();
        Router.push(
          "/invoice-detail?linearId=" + this.state.invoiceDetailData.linearId
        );
      })
      .catch(err => {
        this.toggleBlocking();
        this.setState({
          editErrMessage: err.response.data.message
        });
        window.jQuery("#errorWarning").modal("toggle");
      });
  };

  async resubmitInvoice() {
    this.toggleBlocking();
    let uploadPromises = await this.populateFileAttachmentForEdit();
    Promise.all(uploadPromises).then(data => {
      let existingFile = this.populateExistingFileAttachment();
      let fileAttachments = data.concat(existingFile);

      let editedPOItems = this.populateEditedPOItemsToObject();
      let subTotal = this.calEditInvoiceAmount(editedPOItems);
      let vatTotal = this.calTaxInvoiceAmount(editedPOItems);
      let receiptNumber = null;
      if (this.state.invoiceDetailData.receiptNumber !== undefined) {
        receiptNumber = this.state.invoiceDetailData.receiptNumber;
      }
      let resubmitInvoiceObject = {
        accounting: this.state.invoiceDetailData.accounting,
        buyer: this.state.invoiceDetailData.buyer,
        companyBranchCode: this.state.invoiceDetailData.companyBranchCode,
        companyBranchName: this.state.invoiceDetailData.companyBranchName,
        companyCode: this.state.invoiceDetailData.companyCode,
        companyName: this.state.invoiceDetailData.companyName,
        currency: this.state.invoiceDetailData.currency,
        customisedFields: this.state.invoiceDetailData.customisedFields,
        customisedFieldsUpdatedDate: this.state.invoiceDetailData
          .customisedFieldsUpdatedDate,
        documentEntryDate: moment().format("DD/MM/YYYY"),
        issuedDate: this.state.innerPurchaseItem.issuedDate,
        lastPartyUpdatedBy: this.state.innerPurchaseItem.lastPartyUpdatedBy,
        lastUpdatedBy: this.state.innerPurchaseItem.lastUpdatedBy,
        lastUpdatedDate: moment().toString(),
        lifecycle: this.state.invoiceDetailData.lifecycle,
        linearId: this.state.invoiceDetailData.linearId,
        purchaseOrderNumber: this.state.selectedPOItems[
          Object.keys(this.state.selectedPOItems)[0]
        ].item[0].poNumber,
        paymentTermCode: this.state.invoiceDetailData.paymentTermCode,
        paymentTermDays: this.state.invoiceDetailData.paymentTermDays,
        paymentTermDescription: this.state.invoiceDetailData.paymentTermDesc,
        items: editedPOItems,
        seller: this.state.invoiceDetailData.seller,
        status: this.state.invoiceDetailData.status,
        vendorAddress1: this.state.innerPurchaseItem.vendorStreet1,
        vendorBranchCode: this.state.invoiceDetailData.vendorBranchCode,
        vendorBranchName: "",
        vendorCity: this.state.innerPurchaseItem.vendorCity,
        vendorDistrict: this.state.innerPurchaseItem.vendorDistrict,
        vendorEmail: this.state.innerPurchaseItem.vendorEmail,
        vendorName: this.state.invoiceDetailData.vendorName,
        vendorNumber: this.state.invoiceDetailData.vendorNumber,
        vendorPostalCode: this.state.innerPurchaseItem.vendorPostalCode,
        vendorTaxNumber: this.state.invoiceDetailData.vendorTaxNumber,
        vendorTelephone: this.state.innerPurchaseItem.vendorTelephone,
        fileAttachments: fileAttachments,
        ////
        bank: this.state.invoiceDetailData.bank,
        baselineDate: moment().format("DD/MM/YYYY"),
        companyTaxNumber: this.state.invoiceDetailData.companyTaxNumber,
        companyAddress: this.state.invoiceDetailData.companyAddress,
        dueDate: this.state.invoiceDetailData.dueDate,
        dueDateIsLocked: this.state.invoiceDetailData.dueDateIsLocked,
        externalId: this.state.invoiceNumber,
        goodsReceived: this.state.invoiceDetailData.goodsReceived,
        initialDueDate: this.state.invoiceDetailData.initialDueDate,
        invoiceCreatedDate: this.state.invoiceDetailData.invoiceCreatedDate,
        invoiceDate: this.state.invoiceDate,
        invoiceFinancing: this.state.invoiceDetailData.invoiceFinancing,
        invoiceTotal: +subTotal + +vatTotal,
        isETaxInvoice: this.state.invoiceDetailData.isETaxInvoice,
        matchingStatus: this.state.invoiceDetailData.matchingStatus,
        paymentFee: this.state.invoiceDetailData.paymentFee,
        paymentTermDesc: this.state.invoiceDetailData.paymentTermDesc,
        purchaseOrder: this.state.invoiceDetailData.purchaseOrder,
        purchaseOrderHeaderNumber: this.state.invoiceDetailData
          .purchaseOrderHeaderNumber,
        receiptNumber: receiptNumber,
        restrictedMap: this.state.invoiceDetailData.restrictedMap,
        resubmitCount: this.state.invoiceDetailData.resubmitCount,
        subTotal: subTotal,
        totalPayable: +subTotal + +vatTotal,
        vatTotal: vatTotal,
        vendorAddress: this.state.invoiceDetailData.vendorAddress,
        disclosedMap: this.state.invoiceDetailData.disclosedMap
      };

      if (this.props.appenv.INV_EDIT_SUBMIT_SYNC === undefined) {
        Api.putResubmitInvoice(resubmitInvoiceObject)
          .then(res => {
            this.toggleBlocking();
            Router.push(
              "/invoice-detail?linearId=" +
                this.state.invoiceDetailData.linearId
            );
          })
          .catch(err => {
            this.toggleBlocking();
            this.setState({
              editErrMessage: err.response.data.message
            });
            window.jQuery("#errorWarning").modal("toggle");
          });
      } else {
        if (this.props.appenv.INV_EDIT_SUBMIT_SYNC == false) {
          const aToken = this.props.token;
          this.socket.emit("resubmit-invoice", data, aToken);
          this.toggleBlocking();
          Router.push(
            "/invoice-detail?linearId=" + this.state.invoiceDetailData.linearId
          );
        } else {
          Api.putResubmitInvoice(resubmitInvoiceObject)
            .then(res => {
              this.toggleBlocking();
              Router.push(
                "/invoice-detail?linearId=" +
                  this.state.invoiceDetailData.linearId
              );
            })
            .catch(err => {
              this.toggleBlocking();
              this.setState({
                editErrMessage: err.response.data.message
              });
              window.jQuery("#errorWarning").modal("toggle");
            });
        }
      }
    });
  }

  populateEditedPOItemsToObject() {
    let runningExternalId = 1;
    let purchaseItem = [];
    let editedPOItems = this.state.selectedPOItems;
    let propAsPONumberArray = Object.keys(editedPOItems);
    for (let i = 0; i < propAsPONumberArray.length; i++) {
      let poItems = editedPOItems[propAsPONumberArray[i]].item;
      for (let j = 0; j < poItems.length; j++) {
        let alreadyAddedItem = this.getAddedInvoiceItem(poItems[j]);
        if (alreadyAddedItem === undefined) {
          let newItem = {
            accounting: this.state.invoiceDetailData.accounting,
            bank: this.state.invoiceDetailData.bank,
            buyer: this.state.invoiceDetailData.buyer,
            creditNoteAdjustedSubtotal: 0,
            creditNoteQuantity: {
              initial: 0,
              consumed: 0,
              remaining: 0,
              unit: poItems[j].quantity.unit
            },
            currency: this.state.invoiceDetailData.currency,
            customisedFieldsUpdatedDate: this.state.invoiceDetailData
              .customisedFieldsUpdatedDate,
            externalId: runningExternalId,
            invoiceLinearId: this.state.invoiceDetailData.linearId,
            issuedDate: poItems[j].issuedDate,
            itemSubTotal:
              poItems[j].quantity.initial * poItems[j].poItemUnitPrice,
            lifecycle: poItems[j].lifecycle,
            materialDescription: poItems[j].materialDescription,
            purchaseItem: {
              poNumber: poItems[j].poNumber,
              businessPlaceTaxNumber: poItems[j].businessPlaceTaxNumber,
              poItemNo: poItems[j].poItemNo
            },
            purchaseItemExternalId: poItems[j].poItemNo,
            purchaseItemLinearId: poItems[j].linearId,
            purchaseOrderExternalId: poItems[j].poNumber,
            quantity: poItems[j].quantity,
            quantityUnit: poItems[j].poItemUnitOfMeasure,
            seller: this.state.invoiceDetailData.seller,
            status: this.state.invoiceDetailData.status,
            unitPrice: poItems[j].poItemUnitPrice,
            vatCode: poItems[j].taxCode,
            vatRate: poItems[j].taxRate
          };
          purchaseItem.push(newItem);
        } else {
          alreadyAddedItem.externalId = runningExternalId;
          alreadyAddedItem.purchaseItem = {
            poNumber: poItems[j].poNumber,
            businessPlaceTaxNumber: poItems[j].businessPlaceTaxNumber,
            poItemNo: poItems[j].poItemNo
          };
          alreadyAddedItem.quantity.initial = poItems[j].quantity.initial;
          alreadyAddedItem.itemSubTotal =
            poItems[j].quantity.initial * poItems[j].poItemUnitPrice;
          alreadyAddedItem.unitPrice = poItems[j].poItemUnitPrice;
          purchaseItem.push(alreadyAddedItem);
        }
        runningExternalId++;
      }
    }
    return purchaseItem;
  }

  getAddedInvoiceItem(editingItem) {
    let addedItem = this.state.purchaseItems;
    return addedItem.find(item => {
      return item.purchaseItemLinearId === editingItem.linearId;
    });
  }

  async populateFileAttachmentForEdit() {
    /// populate & upload new file
    let fileTypeMapping = [];
    this.state.taxInvoiceFilesNew.forEach(file => {
      fileTypeMapping.push("TaxInvoice");
    });
    this.state.receiptFilesNew.forEach(file => {
      fileTypeMapping.push("Receipt");
    });
    this.state.deliveryNoteFilesNew.forEach(file => {
      fileTypeMapping.push("DeliveryNote");
    });
    this.state.otherFilesNew.forEach(file => {
      fileTypeMapping.push("Others");
    });

    let uploadPackage = this.state.taxInvoiceFilesNew.concat(
      this.state.receiptFilesNew.concat(
        this.state.deliveryNoteFilesNew.concat(this.state.otherFilesNew)
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

  populateExistingFileAttachment() {
    let fileAttachments = [];
    //// populate existing file
    this.state.taxInvoiceFiles.forEach(file => {
      let attachment = {
        attachmentHash: file.hash,
        attachmentName: file.name,
        attachmentType: "TaxInvoice",
        owner: file.owner
      };
      fileAttachments.push(attachment);
    });
    this.state.receiptFiles.forEach(file => {
      let attachment = {
        attachmentHash: file.hash,
        attachmentName: file.name,
        attachmentType: "Receipt",
        owner: file.owner
      };
      fileAttachments.push(attachment);
    });
    this.state.deliveryNoteFiles.forEach(file => {
      let attachment = {
        attachmentHash: file.hash,
        attachmentName: file.name,
        attachmentType: "DeliveryNote",
        owner: file.owner
      };
      fileAttachments.push(attachment);
    });
    this.state.otherFiles.forEach(file => {
      let attachment = {
        attachmentHash: file.hash,
        attachmentName: file.name,
        attachmentType: "Others",
        owner: file.owner
      };
      fileAttachments.push(attachment);
    });
    return fileAttachments;
  }

  populateAttachmentsToState(attachments) {
    let taxInvoiceFiles = [];
    let receiptFiles = [];
    let deliveryNoteFiles = [];
    let otherFiles = [];

    attachments.forEach(item => {
      if (item.attachmentType === "TaxInvoice") {
        let file = {
          name: item.attachmentName,
          hash: item.attachmentHash,
          uploadDate: item.uploadDate,
          owner: item.owner
        };
        taxInvoiceFiles.push(file);
      } else if (item.attachmentType === "Receipt") {
        let file = {
          name: item.attachmentName,
          hash: item.attachmentHash,
          uploadDate: item.uploadDate,
          owner: item.owner
        };
        receiptFiles.push(file);
      } else if (item.attachmentType === "DeliveryNote") {
        let file = {
          name: item.attachmentName,
          hash: item.attachmentHash,
          uploadDate: item.uploadDate,
          owner: item.owner
        };
        deliveryNoteFiles.push(file);
      } else if (item.attachmentType === "Others") {
        let file = {
          name: item.attachmentName,
          hash: item.attachmentHash,
          uploadDate: item.uploadDate,
          owner: item.owner
        };
        otherFiles.push(file);
      }
    });
    this.setState({
      taxInvoiceFiles: taxInvoiceFiles,
      receiptFiles: receiptFiles,
      deliveryNoteFiles: deliveryNoteFiles,
      otherFiles: otherFiles
    });
  }

  populateNumberRequiredFileString() {
    let config = this.state.configuration;
    let config1 = config.attachmentConfiguration[0];
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
    let config2 = config.attachmentConfiguration[1];
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
    let config3 = config.attachmentConfiguration[2];
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
    let config4 = config.attachmentConfiguration[3];
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

    const { attachmentConfiguration } = this.state.configuration;
    let allLifeCycle = attachmentConfiguration.reduce(
      (newArray, fileConfig) => [...newArray, ...fileConfig.allowedLifecycle],
      []
    );
    const unionLifeCycle = new Set(allLifeCycle);
    allLifeCycle = [...unionLifeCycle];
    if (
      allLifeCycle.includes(this.state.invoiceDetailData.lifecycle) &&
      !lifecycleEdit.includes(
        this.state.invoiceDetailData.lifecycle.toUpperCase()
      ) &&
      !lifecycleResubmit.includes(
        this.state.invoiceDetailData.lifecycle.toUpperCase()
      )
    ) {
      this.setState({
        editFileOnly: true
      });
    }

    const checkAllowedAction = config => {
      if (
        config.allowedLifecycle.includes(invoiceLifeCycle) &&
        !lifecycleEdit.includes(this.state.invoiceDetailData.lifecycle) &&
        !lifecycleResubmit.includes(this.state.invoiceDetailData.lifecycle)
      ) {
        return config.allowedAction;
      } else if (
        lifecycleEdit.includes(
          this.state.invoiceDetailData.lifecycle.toUpperCase()
        ) ||
        lifecycleResubmit.includes(
          this.state.invoiceDetailData.lifecycle.toUpperCase()
        )
      ) {
        return ["Add", "Remove"];
      } else {
        return [];
      }
    };

    const invoiceLifeCycle = this.state.invoiceDetailData.lifecycle.toUpperCase();
    fileConfig.forEach(config => {
      if (config.attachmentType === "TaxInvoice") {
        let required = false;
        if (checkRequired(config.minimumNumberOfFiles)) {
          required = true;
        }
        let allowedAction = checkAllowedAction(config);
        this.setState({
          isTaxInvoiceRequired: required,
          taxInvoiceFilesFormat: config.fileType,
          TaxInvoiceAction: allowedAction
        });
      } else if (config.attachmentType === "Receipt") {
        let required = false;
        if (checkRequired(config.minimumNumberOfFiles)) {
          required = true;
        }
        let allowedAction = checkAllowedAction(config);
        this.setState({
          isReceiptRequired: required,
          receiptFilesFormat: config.fileType,
          ReceiptAction: allowedAction
        });
      } else if (config.attachmentType === "DeliveryNote") {
        let required = false;
        if (checkRequired(config.minimumNumberOfFiles)) {
          required = true;
        }
        let allowedAction = checkAllowedAction(config);
        this.setState({
          isDeliveryNoteRequired: required,
          deliveryNoteFilesFormat: config.fileType,
          DeliveryNoteAction: allowedAction
        });
      } else if (config.attachmentType === "Others") {
        let required = false;
        if (checkRequired(config.minimumNumberOfFiles)) {
          required = true;
        }
        let allowedAction = checkAllowedAction(config);
        this.setState({
          isOtherRequired: required,
          otherFilesFormat: config.fileType,
          OtherAction: allowedAction
        });
      }
      this.resolveAllowToResubmitEdit();
    });
  }

  ///////////////////

  updateCompany(newMainPO) {
    this.triggerCompanyChange();
    let updatedCompanyInvoice = this.state.invoiceDetailData;
    let updatedCompanyInnerItem = this.state.innerPurchaseItem;
    updatedCompanyInvoice.companyCode = newMainPO.companyCode;
    updatedCompanyInvoice.companyName = newMainPO.companyName;
    updatedCompanyInvoice.companyTaxNumber = newMainPO.businessPlaceTaxNumber;
    updatedCompanyInvoice.companyBranchName = newMainPO.companyBranchName;
    updatedCompanyInvoice.companyBranchCode = newMainPO.companyBranchCode;

    updatedCompanyInvoice.companyAddress =
      newMainPO.businessPlaceAddress1 +
      " " +
      newMainPO.businessPlaceAddress2 +
      " " +
      newMainPO.businessPlaceDistrict +
      " " +
      newMainPO.businessPlaceCity +
      " " +
      newMainPO.businessPlaceCountry;

    updatedCompanyInnerItem.businessPlacePostalTelephone =
      newMainPO.businessPlaceTelephone;

    this.setState(
      {
        invoiceDetailData: updatedCompanyInvoice,
        innerPurchaseItem: updatedCompanyInnerItem,
        isInvoiceCompanyUpdated: true,
        isInvoiceInEmptyPOState: false
      },
      () => {
        Api.getInvoiceConfiguration(
          this.state.invoiceDetailData.buyer.legalName,
          this.state.invoiceDetailData.companyTaxNumber,
          this.state.invoiceDetailData.vendorTaxNumber
        ).then(res => {
          this.setState({
            configuration: res
          });
        });
      }
    );
  }

  triggerCompanyChange() {
    window.jQuery("#company-info").css("color", "#d40e78");
  }

  //// Utill /////

  extractInvoicePOHeaderNumber(poHeader) {
    let poHeaders = poHeader.split("|");
    return _.uniq(poHeaders);
  }

  calEditInvoiceAmount(editedPOItems) {
    let subTotal = 0;
    editedPOItems.forEach(item => {
      subTotal = subTotal + +item.itemSubTotal;
    });
    return subTotal;
  }

  calTaxInvoiceAmount(editedPOItems) {
    let vatTotal = 0;
    let taxSumMapping = {};

    editedPOItems.forEach(item => {
      if (_.has(taxSumMapping, `tax${item.vatRate}`)) {
        taxSumMapping[`tax${item.vatRate}`] += +item.itemSubTotal;
      } else {
        taxSumMapping[`tax${item.vatRate}`] = +item.itemSubTotal;
      }
    });

    _.forOwn(taxSumMapping, (value, key) => {
      vatTotal = vatTotal + +this.calTax(value, key.replace("tax", ""));
    });

    return vatTotal;
  }

  calTax(amount, percentage) {
    return parseFloat(
      (
        parseFloat(amount.toFixed(2)) *
        parseFloat((percentage / 100).toFixed(2))
      ).toFixed(2)
    );
  }

  formatQtyNumber(amount) {
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      maximumFractionDigits: 3,
      minimumFractionDigits: 3
    }).format(amount);
  }

  formatQtyNumberEdit(amount) {
    return Intl.NumberFormat("th-TH", {
      useGrouping: false,
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

  formatNumberInput(input, decimal) {
    let valueReplace = input.replace(/[^0-9.]/gm, "");
    let valueSplit = input.split(".");
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

  uploadFiles(data) {
    return Api.postUploadFile(data).then(res => {
      return res[0].attachmentHash;
    });
  }

  routeCancel() {
    Router.push("/invoice");
  }
  closeAlertDialog = () => {
    Router.push(
      `/invoice-detail-edit?linearId=${this.props.url.query.linearId}`,
      ""
    );
  };
  render() {
    const poNumberInputProp = {
      placeholder: "Select PO",
      value: this.state.inputPONumber,
      onChange: this.handlePOAutoCompleteChange,
      className: "form-control",
      name: "inputPONumber",
      style: { "margin-bottom": "10px" }
    };
    const submitDisableStyle = {
      "background-color": "#6c757d"
      //border: "1px solid #343a40"
    };
    const submitEnableStyle = {
      "background-color": "#AF3694"
      //border: "1px solid #AF3694"
    };
    const invoiceFoundStyle = { width: "auto", color: "#AF3694" };
    const invoiceNotFoundStyle = { width: "auto" };
    return (
      <div>
        <Layout hideNavBar={true} ref={this.layout} {...this.props}>
          <BlockUi tag="div" blocking={this.state.blocking}>
            <ReactTooltip
              id="maximumQty"
              place="top"
              type="light"
              effect="float"
            >
              <span>
                <b>Maximum: {this.state.maximumQtyTooltip}</b>
              </span>
            </ReactTooltip>
            <div className="page__header d-flex flex-wrap px-3">
              <h2 className="col-6 offset-3 text-center">Edit Mode</h2>
              <div id="control-panel" className="ml-auto d-flex">
                {/* Desktop Version - Start */}
                <div class="d-none d-lg-flex">
                  {/* <a
                    href="javascript:void(0);"
                    id="btnNoti"
                    data-toggle="tooltip"
                    data-placement="bottom"
                    title="Notifications"
                    >
                        <i class="icon icon-icon_noti" />
                    </a> */}
                  {this.props.user.legalName.split(",")[1] === " O=SCG1" ||
                  this.props.user.legalName.split(",")[1] === " O=SCGPA" ||
                  this.props.user.legalName.split(",")[1] === " O=SUPPLIER1" ? (
                    <a
                      href={this.props.appenv.SUPPORT_SCG_URL}
                      id="btnCallcenter"
                      target="_blank"
                      data-toggle="popover"
                      data-placement="bottom"
                      data-content="myRequests"
                      onClick={() => {
                        GA.event({
                          category: "myRequests",
                          action: "Link to myRequests"
                        });
                      }}
                    >
                      <i class="icon icon-icon_callcenter" />
                    </a>
                  ) : (
                    ""
                  )}
                  <a
                    href={this.props.appenv.SUPPORT_URL}
                    id="btnHelp"
                    target="_blank"
                    data-toggle="popover"
                    data-placement="bottom"
                    data-content="Help"
                    onClick={() => {
                      GA.event({
                        category: "Help",
                        action: "Link to Help"
                      });
                    }}
                  >
                    <i className="icon icon-icon_help" />
                  </a>
                  <a href="javascript:void(0);" id="btnUser">
                    <i className="icon icon-icon-user-profile" />{" "}
                    {this.props.authority.userAuthentication.name}
                  </a>
                </div>
                {/* Desktop Version - End */}

                {/* Mobile Version - Start */}
                <div class="d-flex d-lg-none">
                  <a href="javascript:void(0);" id="btnSearch">
                    <i class="icon icon-search" />
                  </a>
                  <a
                    href="#mobile-control-panel"
                    id="btnControlPanel"
                    data-toggle="collapse"
                    role="button"
                    aria-expanded="false"
                    aria-controls="mobile-control-panel"
                  >
                    <i class="fa fa-ellipsis-h" />
                  </a>

                  {/* Mobile Control Panel - Start */}
                  <div
                    id="mobile-control-panel"
                    className="collapse multi-collapse"
                  >
                    <ul>
                      {this.props.user.legalName.split(",")[1] === " O=SCG1" ||
                      this.props.user.legalName.split(",")[1] === " O=SCGPA" ||
                      this.props.user.legalName.split(",")[1] ===
                        " O=SUPPLIER1" ? (
                        <li>
                          <a href={this.props.appenv.SUPPORT_URL}>Help</a>
                        </li>
                      ) : (
                        ""
                      )}
                      <li>
                        <a href={this.props.appenv.SUPPORT_SCG_URL}>
                          MyRequest
                        </a>
                      </li>
                      <li>
                        <a href="javascript:void(0);">My Account</a>
                      </li>
                      <li>
                        <a href="javascript:void(0);">Setting</a>
                      </li>
                      <li>
                        <a href="javascript:void(0);">Logout</a>
                      </li>
                    </ul>
                  </div>
                  {/* Mobile Control Panel - End */}
                </div>
                {/* Mobile Version - End */}
              </div>
            </div>
            <div id="invoice_detail_edit_page" className="row">
              <div className="form col-12">
                <div className="form-group form-inline col-12 mb-3">
                  <label className="control-label h3 font-bold">
                    Invoice No.:{" "}
                    {this.state.editFileOnly && this.state.invoiceNumber}
                  </label>
                  <input
                    hidden={this.state.editFileOnly}
                    type="text"
                    maxlength="30"
                    style={
                      this.state.isInvoiceDup === true
                        ? invoiceNotFoundStyle
                        : invoiceFoundStyle
                    }
                    name="invoiceNumber"
                    onChange={event => this.handleInputChange(event)}
                    value={this.state.invoiceNumber}
                    className="form-control"
                  />
                  <label
                    style={{ color: "red", "margin-left": "10px" }}
                    hidden={!this.state.isInvoiceDup}
                  >
                    Invoice No. is duplicated. Please enter another number.
                  </label>
                </div>
                <section className="box box--width-header col-12">
                  <div className="box__header">
                    <div className="row justify-content-between align-items-center">
                      <div className="col">
                        {" "}
                        Entry Date :{" "}
                        <strong>
                          {moment(
                            this.state.invoiceDetailData.invoiceCreatedDate
                          ).format("DD/MM/YYYY")}
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div className="box__inner">
                    <div className="row box" style={{ "min-height": "0px" }}>
                      <a
                        href="#vendorInfo"
                        data-toggle="collapse"
                        role="button"
                        aria-expanded="true"
                        area-controls="vendorInfo"
                        className="d-flex w-100 btnToggle"
                      >
                        <div className="col-6">
                          <h3 className="border-bottom gray-1">Vendor</h3>
                        </div>
                        <div className="col-6">
                          <h3 className="border-bottom gray-1">Company</h3>
                          <i
                            className="fa fa-chevron-up gray-1"
                            aria-hidden="true"
                          />
                          <i
                            className="fa fa-chevron-down gray-1"
                            aria-hidden="true"
                          />
                        </div>
                      </a>

                      <div
                        id="vendorInfo"
                        className="collapse multi-collapse w-100 show"
                      >
                        <div className="card card-body noborder">
                          <div className="row">
                            <div className="col-6">
                              <div className="row">
                                <p className="col-4 text-right pl-0">Code :</p>
                                <p className="col-6">
                                  {this.state.invoiceDetailData.vendorNumber}
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">Name :</p>
                                <p className="col-6">
                                  {this.state.invoiceDetailData.vendorName}
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  Tax ID :
                                </p>
                                <p className="col-6">
                                  {this.state.invoiceDetailData.vendorTaxNumber}
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  Branch :
                                </p>
                                <p className="col-6">
                                  {
                                    this.state.invoiceDetailData
                                      .vendorBranchCode
                                  }{" "}
                                  (BKK)
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  Address :
                                </p>
                                <p className="col-6">
                                  {this.state.invoiceDetailData.vendorAddress}
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">Tel. :</p>
                                <p className="col-6">
                                  {this.state.innerPurchaseItem.vendorTelephone}
                                </p>
                              </div>
                            </div>
                            <div id="company-info" className="col-6">
                              <div className="row">
                                <p className="col-4 text-right pl-0">Code :</p>
                                <p className="col-6 purple">
                                  {this.state.invoiceDetailData.companyCode}
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">Name :</p>
                                <p className="col-6 purple">
                                  {this.state.invoiceDetailData.companyName}
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  Tax ID :
                                </p>
                                <p className="col-6 purple">
                                  {
                                    this.state.invoiceDetailData
                                      .companyTaxNumber
                                  }
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  Branch :
                                </p>
                                <p className="col-6 purple">
                                  {
                                    this.state.invoiceDetailData
                                      .companyBranchCode
                                  }{" "}
                                  (
                                  {
                                    this.state.invoiceDetailData
                                      .companyBranchName
                                  }
                                  )
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  Address :
                                </p>
                                <p className="col-6 purple">
                                  {this.state.invoiceDetailData.companyAddress}
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">Tel. :</p>
                                <p className="col-6 purple">
                                  {
                                    this.state.innerPurchaseItem
                                      .businessPlacePostalTelephone
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="row box">
                      <a
                        href="javascript:void(0);"
                        aria-expanded="true"
                        className="d-flex w-100 btnToggle itsNotButton"
                      >
                        <div className="col-12">
                          <h3 className="border-bottom gray-1">
                            Payment Information
                          </h3>
                        </div>
                      </a>

                      <div id="paymentInfo" className="w-100">
                        <div className="card card-body noborder">
                          <div className="row">
                            <div className="col-6">
                              <div className="row form-group">
                                <p className="col-6 text-right pl-0">
                                  Invoice Date :
                                </p>
                                {this.state.editFileOnly ? (
                                  <React.Fragment>
                                    <p className="col-6">
                                      {this.state.invoiceDate}
                                    </p>
                                    <p
                                      className="col-6 form-group"
                                      style={{ display: "none" }}
                                    >
                                      <i className="fa fa-calendar-o purple" />
                                      <input
                                        type="text"
                                        onChange={event =>
                                          this.handleInputChange(event)
                                        }
                                        name="invoiceDate"
                                        id="invoice_date"
                                        className="datepicker form-control"
                                      />
                                    </p>
                                  </React.Fragment>
                                ) : (
                                  <p className="col-6 form-group">
                                    <i className="fa fa-calendar-o purple" />
                                    <input
                                      type="text"
                                      onChange={event =>
                                        this.handleInputChange(event)
                                      }
                                      name="invoiceDate"
                                      id="invoice_date"
                                      className="datepicker form-control"
                                    />
                                  </p>
                                )}
                              </div>
                              <div className="row">
                                <p className="col-6 text-right pl-0">
                                  Payment Date :
                                </p>
                                <p className="col-6">
                                  {this.state.invoiceDetailData.paymentTermDays}{" "}
                                  days
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-6 text-right pl-0">
                                  Payment Term Description :
                                </p>
                                <p className="col-6">
                                  {this.state.invoiceDetailData.paymentTermDesc}
                                </p>
                              </div>
                              {this.state.configuration
                                .invoiceFinancingIsAllowed === true ? (
                                <div className="row">
                                  <p className="col-6 text-right pl-0">
                                    Invoice Financing :
                                  </p>

                                  {this.state.editFileOnly ? (
                                    this.state.invoiceFinancingChecked ===
                                    "Y" ? (
                                      <p class="col-6">Yes</p>
                                    ) : (
                                      <p class="col-6">No</p>
                                    )
                                  ) : (
                                    <div className="col-6 d-inline-flex form-group">
                                      <div className="custom-control custom-radio">
                                        <input
                                          type="radio"
                                          className="custom-control-input"
                                          name="invoice_financing"
                                          id="invoice_financing_y"
                                          value="Y"
                                          checked={
                                            this.state
                                              .invoiceFinancingChecked === "Y"
                                          }
                                          onChange={
                                            this
                                              .handleInvoiceFinancingRadioChange
                                          }
                                        />
                                        <label
                                          className="custom-control-label"
                                          for="invoice_financing_y"
                                        >
                                          {" "}
                                          Yes
                                        </label>
                                      </div>
                                      <div className="custom-control custom-radio">
                                        <input
                                          type="radio"
                                          className="custom-control-input"
                                          name="invoice_financing"
                                          id="invoice_financing_n"
                                          value="N"
                                          checked={
                                            this.state
                                              .invoiceFinancingChecked === "N"
                                          }
                                          onChange={
                                            this
                                              .handleInvoiceFinancingRadioChange
                                          }
                                        />
                                        <label
                                          className="custom-control-label"
                                          for="invoice_financing_n"
                                        >
                                          {" "}
                                          No
                                        </label>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                ""
                              )}
                              <div className="row">
                                <p className="col-6 text-right pl-0">
                                  Send to CMS :
                                </p>
                                <p className="col-6">No</p>
                              </div>
                              <div className="row">
                                <p className="col-6 text-right pl-0">
                                  Send to Bank :
                                </p>
                                <p className="col-6">
                                  {this.state.invoiceDetailData
                                    .paymentItemLinearId
                                    ? "Yes"
                                    : "No"}
                                </p>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="row">
                                <p className="col-6 text-right pl-0">
                                  Expected Due Date :
                                </p>
                                <p className="col-6">
                                  {moment(
                                    this.state.invoiceDetailData.dueDate
                                  ).format("DD/MM/YYYY")}
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-6 text-right pl-0">
                                  Revised Payment Due Date :
                                </p>
                                <p className="col-6">-</p>
                              </div>
                              <div className="row">
                                <p className="col-6 text-right pl-0">
                                  Sub Total :
                                </p>
                                <p className="col-6 purple">
                                  <span className="number text-right">
                                    {this.formatCurrency(
                                      this.state.invoiceDetailData.subTotal
                                    )}
                                  </span>
                                  <span className="unit"> THB</span>
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-6 text-right pl-0">
                                  TAX Total :
                                </p>
                                <p className="col-6 purple">
                                  <span className="number text-right">
                                    {this.formatCurrency(
                                      this.state.invoiceDetailData.vatTotal
                                    )}
                                  </span>
                                  <span className="unit"> THB</span>
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-6 text-right pl-0">
                                  Invoice Amount (Inc. TAX) :
                                </p>
                                <p className="col-6 purple">
                                  <span className="number text-right">
                                    {this.formatCurrency(
                                      this.state.invoiceDetailData.invoiceTotal
                                    )}
                                  </span>
                                  <span className="unit"> THB</span>
                                </p>
                              </div>
                              <div className="row">
                                <p className="col-6 text-right pl-0">
                                  Invoice Payable Amount (Inc. TAX) :
                                </p>
                                <p className="col-6 purple">
                                  <span className="number text-right">
                                    {this.formatCurrency(
                                      this.state.invoiceDetailData.totalPayable
                                    )}
                                  </span>
                                  <span className="unit"> THB</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="row box">
                      <a
                        href="javascript:void(0);"
                        aria-expanded="true"
                        className="d-flex w-100 btnToggle itsNotButton"
                      >
                        <div className="col-12">
                          <h3 className="border-bottom gray-1">Attachments</h3>
                        </div>
                      </a>

                      <div
                        id="attachmentLists"
                        className="collapse multi-collapse w-100 show"
                      >
                        <div className="card card-body noborder">
                          <div className="row">
                            <div className="col-6 nopadding">
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  Attach Tax Invoice :
                                </p>
                                <div className="col-6 nopadding form-group d-inline-flex custom-fileUpload">
                                  <input
                                    type="text"
                                    name="attach_tax_invoice"
                                    disabled="disabled"
                                    className="form-control"
                                  />
                                  {this.state.TaxInvoiceAction.includes(
                                    "Add"
                                  ) && (
                                    <div className="upload-btn-wrapper">
                                      <button
                                        type="button"
                                        className="btn btn--transparent btnUpload"
                                      >
                                        Browse
                                      </button>
                                      <input
                                        type="file"
                                        name="attach_tax_invoice_file"
                                        onChange={this.handleSelectedFile}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="row">
                                <div class="col-8 offset-4 nopadding">
                                  <small>
                                    File type:{" "}
                                    {this.state.taxInvoiceFilesFormat},
                                    Required:{" "}
                                    {this.state.taxInvoiceRequiredString} files
                                  </small>
                                </div>
                                <p className="col-4">&nbsp;</p>
                                <ul
                                  id="attach_tax_invoice_list"
                                  className="uploadedList col-6 px-0"
                                >
                                  {_.map(
                                    this.state.taxInvoiceFiles,
                                    ({ name, hash, owner = "" }, index) => (
                                      <li>
                                        <a
                                          href={`/download/${hash}/${name}?filename=${name}&owner=${owner}`}
                                          className="gray-1"
                                          target="_blank"
                                        >
                                          {name}
                                        </a>
                                        {this.state.TaxInvoiceAction.includes(
                                          "Remove"
                                        ) && (
                                          <a href="javascript:void(0);">
                                            <i
                                              className="fa fa-times purple"
                                              onClick={() =>
                                                this.handleDeselectedFile(
                                                  "taxInvoiceFiles",
                                                  index
                                                )
                                              }
                                            />
                                          </a>
                                        )}
                                      </li>
                                    )
                                  )}
                                  {_.map(
                                    this.state.taxInvoiceFilesNew,
                                    ({ name, hash, owner = "" }, index) => (
                                      <li>
                                        <a
                                          href={`/download/${hash}/${name}?filename=${name}&owner=${owner}`}
                                          className="gray-1"
                                          target="_blank"
                                        >
                                          {name}
                                        </a>
                                        <a href="javascript:void(0);">
                                          <i
                                            className="fa fa-times purple"
                                            onClick={() =>
                                              this.handleDeselectedFile(
                                                "taxInvoiceFilesNew",
                                                index
                                              )
                                            }
                                          />
                                        </a>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  Receipt NO. :
                                </p>
                                <p className="col-6 px-0">
                                  {this.state.invoiceDetailData.receiptNumber}
                                </p>
                              </div>
                            </div>
                            <div className="col-6 nopadding">
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  Attach Delivery Note :
                                </p>
                                <div className="col-6 nopadding form-group d-inline-flex custom-fileUpload">
                                  <input
                                    type="text"
                                    name="attach_tax_invoice"
                                    disabled="disabled"
                                    className="form-control"
                                  />
                                  {this.state.DeliveryNoteAction.includes(
                                    "Add"
                                  ) && (
                                    <div className="upload-btn-wrapper">
                                      <button
                                        type="button"
                                        className="btn btn--transparent btnUpload"
                                      >
                                        Browse
                                      </button>
                                      <input
                                        type="file"
                                        name="attach_delivery_file"
                                        onChange={this.handleSelectedFile}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="row">
                                <div class="col-8 offset-4 nopadding">
                                  <small>
                                    File type:{" "}
                                    {this.state.deliveryNoteFilesFormat},
                                    Required:{" "}
                                    {this.state.deliveryNoteRequiredString}{" "}
                                    files
                                  </small>
                                </div>
                                <p className="col-4">&nbsp;</p>
                                <ul
                                  id="attach_tax_invoice_list"
                                  className="uploadedList col-6 px-0"
                                >
                                  {_.map(
                                    this.state.deliveryNoteFiles,
                                    ({ name, hash, owner = "" }, index) => (
                                      <li>
                                        <a
                                          href={`/download/${hash}/${name}?filename=${name}&owner=${owner}`}
                                          className="gray-1"
                                          target="_blank"
                                        >
                                          {name}
                                        </a>
                                        {this.state.DeliveryNoteAction.includes(
                                          "Remove"
                                        ) && (
                                          <a href="javascript:void(0);">
                                            <i
                                              className="fa fa-times purple"
                                              onClick={() =>
                                                this.handleDeselectedFile(
                                                  "deliveryNoteFiles",
                                                  index
                                                )
                                              }
                                            />
                                          </a>
                                        )}
                                      </li>
                                    )
                                  )}
                                  {_.map(
                                    this.state.deliveryNoteFilesNew,
                                    ({ name, hash, owner = "" }, index) => (
                                      <li>
                                        <a
                                          href={`/download/${hash}/${name}?filename=${name}&owner=${owner}`}
                                          className="gray-1"
                                          target="_blank"
                                        >
                                          {name}
                                        </a>
                                        <a href="javascript:void(0);">
                                          <i
                                            className="fa fa-times purple"
                                            onClick={() =>
                                              this.handleDeselectedFile(
                                                "deliveryNoteFilesNew",
                                                index
                                              )
                                            }
                                          />
                                        </a>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  Attach Receipt :
                                </p>
                                <div className="col-6 nopadding form-group d-inline-flex custom-fileUpload">
                                  <input
                                    type="text"
                                    name="attach_tax_invoice"
                                    disabled="disabled"
                                    className="form-control"
                                  />
                                  {this.state.ReceiptAction.includes("Add") && (
                                    <div className="upload-btn-wrapper">
                                      <button
                                        type="button"
                                        className="btn btn--transparent btnUpload"
                                      >
                                        Browse
                                      </button>
                                      <input
                                        type="file"
                                        name="attach_receipt"
                                        onChange={this.handleSelectedFile}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="row">
                                <div class="col-8 offset-4 nopadding">
                                  <small>
                                    File type: {this.state.receiptFilesFormat},
                                    Required: {this.state.receiptRequiredString}{" "}
                                    files
                                  </small>
                                </div>
                                <p className="col-4">&nbsp;</p>
                                <ul
                                  id="attach_tax_invoice_list"
                                  className="uploadedList col-6 px-0"
                                >
                                  {_.map(
                                    this.state.receiptFiles,
                                    ({ name, hash, owner = "" }, index) => (
                                      <li>
                                        <a
                                          href={`/download/${hash}/${name}?filename=${name}&owner=${owner}`}
                                          className="gray-1"
                                          target="_blank"
                                        >
                                          {name}
                                        </a>
                                        {this.state.ReceiptAction.includes(
                                          "Remove"
                                        ) && (
                                          <a href="javascript:void(0);">
                                            <i
                                              className="fa fa-times purple"
                                              onClick={() =>
                                                this.handleDeselectedFile(
                                                  "receiptFiles",
                                                  index
                                                )
                                              }
                                            />
                                          </a>
                                        )}
                                      </li>
                                    )
                                  )}
                                  {_.map(
                                    this.state.receiptFilesNew,
                                    ({ name, hash, owner = "" }, index) => (
                                      <li>
                                        <a
                                          href={`/download/${hash}/${name}?filename=${name}&owner=${owner}`}
                                          className="gray-1"
                                          target="_blank"
                                        >
                                          {name}
                                        </a>
                                        <a href="javascript:void(0);">
                                          <i
                                            className="fa fa-times purple"
                                            onClick={() =>
                                              this.handleDeselectedFile(
                                                "receiptFilesNew",
                                                index
                                              )
                                            }
                                          />
                                        </a>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                              <div className="row">
                                <p className="col-4 text-right pl-0">
                                  Attach Other Documents :
                                </p>
                                <div className="col-6 nopadding form-group d-inline-flex custom-fileUpload">
                                  <input
                                    type="text"
                                    name="attach_tax_invoice"
                                    disabled="disabled"
                                    className="form-control"
                                  />
                                  {this.state.OtherAction.includes("Add") && (
                                    <div className="upload-btn-wrapper">
                                      <button
                                        type="button"
                                        className="btn btn--transparent btnUpload"
                                      >
                                        Browse
                                      </button>
                                      <input
                                        type="file"
                                        name="attach_other_file"
                                        onChange={this.handleSelectedFile}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="row">
                                <div class="col-8 offset-4 nopadding">
                                  <small>
                                    File type: {this.state.otherFilesFormat},
                                    Required: {this.state.otherRequiredString}{" "}
                                    files
                                  </small>
                                </div>
                                <p className="col-4">&nbsp;</p>
                                <ul
                                  id="attach_tax_invoice_list"
                                  className="uploadedList col-6 px-0"
                                >
                                  {_.map(
                                    this.state.otherFiles,
                                    ({ name, hash, owner = "" }, index) => (
                                      <li>
                                        <a
                                          href={`/download/${hash}/${name}?filename=${name}&owner=${owner}`}
                                          className="gray-1"
                                          target="_blank"
                                        >
                                          {name}
                                        </a>
                                        {this.state.OtherAction.includes(
                                          "Remove"
                                        ) && (
                                          <a href="javascript:void(0);">
                                            <i
                                              className="fa fa-times purple"
                                              onClick={() =>
                                                this.handleDeselectedFile(
                                                  "otherFiles",
                                                  index
                                                )
                                              }
                                            />
                                          </a>
                                        )}
                                      </li>
                                    )
                                  )}
                                  {_.map(
                                    this.state.otherFilesNew,
                                    ({ name, hash, owner = "" }, index) => (
                                      <li>
                                        <a
                                          href={`/download/${hash}/${name}?filename=${name}&owner=${owner}`}
                                          className="gray-1"
                                          target="_blank"
                                        >
                                          {name}
                                        </a>
                                        <a href="javascript:void(0);">
                                          <i
                                            className="fa fa-times purple"
                                            onClick={() =>
                                              this.handleDeselectedFile(
                                                "otherFilesNew",
                                                index
                                              )
                                            }
                                          />
                                        </a>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {this.state.editFileOnly && (
                      <div className="box pt-0 pb-0 px-0">
                        <a
                          href="javascript:void(0);"
                          aria-expanded="true"
                          className="d-flex w-100 btnToggle itsNotButton"
                        >
                          <div className="col-12 px-0">
                            <h3 className="border-bottom gray-1 px-3">
                              Item Information
                            </h3>
                          </div>
                        </a>
                        <div
                          style={{
                            display: "flex",
                            padding: "20px",
                            justifyContent: "center"
                          }}
                        >
                          <div
                            className="table_wrapper"
                            style={{ width: "100%" }}
                          >
                            <table className="table" ref={el => (this.el = el)}>
                              <thead
                                style={{
                                  backgroundColor: "rgb(241, 243, 246)"
                                }}
                              >
                                <tr>
                                  <th>
                                    PO Item
                                    <br />
                                    No.
                                  </th>
                                  <th>Material Description</th>
                                  <th>
                                    Remaining
                                    <br />
                                    Qty
                                  </th>
                                  <th>Qty</th>
                                  <th>
                                    Unit
                                    <br />
                                    Description
                                  </th>
                                  <th>Unit Price</th>
                                  <th>Amount</th>
                                  <th>Currency</th>
                                </tr>
                              </thead>
                              <tbody>
                                {this.state.activePOItems.map(item => {
                                  return (
                                    <tr key={item.poItemNo}>
                                      <td>{item.poItemNo}</td>
                                      <td>{item.materialDescription}</td>
                                      <td>
                                        {this.formatQtyNumber(
                                          item.quantity.remaining
                                        )}
                                      </td>
                                      <td>
                                        {this.formatQtyNumber(
                                          item.quantity.initial
                                        )}
                                      </td>
                                      <td>{item.quantity.unit}</td>
                                      <td>
                                        {this.formatPriceNumber(
                                          item.poItemUnitPrice
                                        )}
                                      </td>
                                      <td>
                                        {this.formatPriceNumber(
                                          item.quantity.initial *
                                            item.poItemUnitPrice
                                        )}
                                      </td>
                                      <td>{item.poItemUnitPriceCurrency}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                            {/* <label id='label-error' style={{ 'color': 'red', 'margin-left': '10px', 'float': 'right', 'padding-right': '10px' }} hidden={!this.state.isQtyExceeded}>Qty cannot greater than remainning qty.</label> */}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Item Information only */}

                    <div
                      className="box pt-0 pb-0 px-0"
                      style={{ display: this.state.editFileOnly && "none" }}
                    >
                      <a
                        href="javascript:void(0);"
                        aria-expanded="true"
                        className="d-flex w-100 btnToggle itsNotButton"
                      >
                        <div className="col-12 px-0">
                          <h3 className="border-bottom gray-1 px-3">
                            Item Information
                          </h3>
                        </div>
                      </a>
                      <div class="d-flex flex-wrap min-height-500 pl-0 pr-0">
                        <div
                          id="po_items"
                          className="col-2 border-right pb-3 pl-0"
                        >
                          <ul>
                            {
                              <div
                                style={{
                                  marginTop: "15px",
                                  position: "relative"
                                }}
                              >
                                {this.state.populatedPO.length > 0
                                  ? this.state.populatedPO.map(po => (
                                      <li
                                        className={
                                          this.state.activePO === po.poNumber
                                            ? "active"
                                            : "inactive"
                                        }
                                      >
                                        <a href="javascript:void(0);">
                                          <strong
                                            onClick={() =>
                                              this.handleSelectPO(po.poNumber)
                                            }
                                            className="gray-1 text-center font-bold"
                                          >
                                            {" "}
                                            {po.poNumber}
                                            <br /> ({po.count}{" "}
                                            {po.count > 1 ? "items" : "item"}){" "}
                                          </strong>
                                          <i
                                            onClick={() =>
                                              this.handleRemovePO(po.poNumber)
                                            }
                                            className="fa fa-times gray-2"
                                          />
                                        </a>
                                      </li>
                                    ))
                                  : ""}
                              </div>
                            }
                            {this.state.populatedPO.length > 0 ? (
                              <div>
                                {this.state.isAddPOInputTriggered === false ? (
                                  <div style={{ marginTop: "20px" }}>
                                    <p
                                      hidden={
                                        this.state.isAddPOInputTriggered ===
                                        true
                                      }
                                      id="morePOBtn"
                                      class="text-center"
                                    >
                                      <a
                                        href="javascript:void(0);"
                                        class="text-bold"
                                        data-toggle="modal"
                                        data-target="#addMorePO"
                                        // onClick={() => this.handleAddPOButton()}
                                      >
                                        <i class="fa fa-plus small" /> Add PO
                                      </a>
                                    </p>
                                  </div>
                                ) : (
                                  <div className="form-label-group pl-3 pt-3">
                                    <AsyncTypeahead
                                      inputProps={{
                                        id: `purchaseOrderNumber`,
                                        name: `purchaseOrderNumber`,
                                        className: `input-search`,
                                        title: `Select PO.`
                                      }}
                                      ref={Typeahead =>
                                        (this.Typeahead = Typeahead)
                                      }
                                      placeholder="Select PO."
                                      defaultInputValue=""
                                      isLoading={this.state.isLoading}
                                      labelKey="purchaseOrderNumber"
                                      minLength={3}
                                      useCache={false}
                                      onChange={selected =>
                                        this.handlePOAutoCompleteChange(
                                          selected[0]
                                        )
                                      }
                                      onSearch={query => {
                                        if (query.trim() != "") {
                                          let fetchURL = "";
                                          this.setState({ isLoading: true });
                                          if (
                                            !this.state.isInvoiceInEmptyPOState
                                          ) {
                                            let invoiceDetail = this.state
                                              .invoiceDetailData;
                                            fetchURL =
                                              `${poSearchApiUrl}${query}&vendorTaxNumber=${invoiceDetail.vendorTaxNumber}&` +
                                              `businessPlaceTaxNumber=${invoiceDetail.companyTaxNumber}&` +
                                              `companyBranchCode=${invoiceDetail.companyBranchCode}&` +
                                              `paymentTermDays=${invoiceDetail.paymentTermDays}`;
                                          } else {
                                            fetchURL = `${poSearchApiUrl}${query}`;
                                          }
                                          fetch(fetchURL)
                                            .then(resp => resp.json())
                                            .then(json => {
                                              this.setState({
                                                isLoading: false,
                                                options: json.data
                                              });
                                            });
                                        }
                                      }}
                                      options={this.state.options}
                                    />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="form-label-group mt-3">
                                <AsyncTypeahead
                                  inputProps={{
                                    id: `purchaseOrderNumber`,
                                    name: `purchaseOrderNumber`,
                                    className: `input-search`,
                                    title: `Select PO.`
                                  }}
                                  ref={Typeahead =>
                                    (this.Typeahead = Typeahead)
                                  }
                                  placeholder="Select PO."
                                  defaultInputValue=""
                                  isLoading={this.state.isLoading}
                                  labelKey="purchaseOrderNumber"
                                  minLength={3}
                                  useCache={false}
                                  onChange={selected =>
                                    this.handlePOAutoCompleteChange(selected[0])
                                  }
                                  onSearch={query => {
                                    if (query.trim() != "") {
                                      let fetchURL = "";
                                      this.setState({ isLoading: true });
                                      if (!this.state.isInvoiceInEmptyPOState) {
                                        let invoiceDetail = this.state
                                          .invoiceDetailData;
                                        fetchURL =
                                          `${poSearchApiUrl}${query}&vendorTaxNumber=${invoiceDetail.vendorTaxNumber}&` +
                                          `businessPlaceTaxNumber=${invoiceDetail.companyTaxNumber}&` +
                                          `companyBranchCode=${invoiceDetail.companyBranchCode}&` +
                                          `paymentTermDays=${invoiceDetail.paymentTermDays}`;
                                      } else {
                                        fetchURL = `${poSearchApiUrl}${query}`;
                                      }
                                      fetch(fetchURL)
                                        .then(resp => resp.json())
                                        .then(json => {
                                          this.setState({
                                            isLoading: false,
                                            options: json.data
                                          });
                                        });
                                    }
                                  }}
                                  options={this.state.options}
                                />
                              </div>
                            )}
                            {this.state.populatedPO.length === 0 ? (
                              <div>
                                <p class="text-center">
                                  {" "}
                                  Start selecting items by adding PO{" "}
                                </p>
                                <p class="text-center">
                                  {" "}
                                  *Only approved PO can be selected here{" "}
                                </p>
                              </div>
                            ) : (
                              ""
                            )}
                          </ul>
                        </div>
                        <div id="po_lists" className="col-10 px-0">
                          <div className="table_wrapper">
                            <label
                              id="label-error"
                              style={{
                                color: "red",
                                "margin-left": "10px",
                                float: "left",
                                "padding-right": "10px"
                              }}
                              hidden={this.state.isPurchaseOrderSelected}
                            >
                              Please select PO item.
                            </label>
                            <table
                              className="table dataTable"
                              ref={el => (this.el = el)}
                            >
                              <thead>
                                <tr>
                                  <th>
                                    <div className="custom-control custom-checkbox">
                                      <input
                                        type="checkbox"
                                        // className="custom-control-input"
                                        id="selectall"
                                      />
                                      <label
                                        className="ccustom-control-label pl-1 font-small text-shadow"
                                        for="selectall"
                                      />
                                    </div>
                                  </th>
                                  <th>
                                    PO Item
                                    <br />
                                    No.
                                  </th>
                                  <th>Material Description</th>
                                  <th>
                                    Remaining
                                    <br />
                                    Qty
                                  </th>
                                  <th>Qty</th>
                                  <th>
                                    Unit
                                    <br />
                                    Description
                                  </th>
                                  <th>Unit Price</th>
                                  <th>Amount</th>
                                  <th>Currency</th>
                                </tr>
                              </thead>
                            </table>
                            {/* <label id='label-error' style={{ 'color': 'red', 'margin-left': '10px', 'float': 'right', 'padding-right': '10px' }} hidden={!this.state.isQtyExceeded}>Qty cannot greater than remainning qty.</label> */}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-12 text-center">
                        <button
                          type="button"
                          name="btnCancel"
                          id="btnCancel"
                          className="btn btn--transparent"
                          data-toggle="modal"
                          data-target="#cancelWarning"
                        >
                          Cancel
                        </button>
                        {this.state.isIssued ? (
                          <button
                            disabled={!this.state.isAllowResubmit}
                            className="btn"
                            style={
                              !this.state.isAllowResubmit
                                ? submitDisableStyle
                                : submitEnableStyle
                            }
                            onClick={() => this.editInvoice()}
                          >
                            Edit
                          </button>
                        ) : (
                          <button
                            disabled={!this.state.isAllowResubmit}
                            className="btn"
                            style={
                              !this.state.isAllowResubmit
                                ? submitDisableStyle
                                : submitEnableStyle
                            }
                            onClick={() => {
                              if (this.state.editFileOnly) {
                                this.editFileInvoice();
                              } else {
                                this.resubmitInvoice();
                              }
                            }}
                          >
                            Resubmit
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="row">&nbsp;</div>
                  </div>
                </section>
              </div>

              <div
                id="addPO"
                class="modal hide fade"
                tabindex="-1"
                role="dialog"
                aria-labelledby="addPO"
                aria-hidden="true"
              >
                <div class="modal-dialog modal-lg" role="document">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h3 id="myModalLabel">Company Information</h3>
                    </div>
                    <div class="modal-body d-flex">
                      <div class="col-6">
                        <div class="form-group border border-1px border-lightgrey rounded disabled">
                          <label class="form-label" for="po_code">
                            Code
                          </label>
                          <input
                            type="text"
                            name="po_code"
                            value={this.state.po_code}
                            class="form-control noborder"
                            disabled="disabled"
                          />
                        </div>
                        <div class="form-group border border-1px border-lightgrey rounded disabled">
                          <label class="form-label" for="po_name">
                            Name
                          </label>
                          <input
                            type="text"
                            name="po_name"
                            value={this.state.po_name}
                            class="form-control noborder"
                            disabled="disabled"
                          />
                        </div>
                        <div class="form-group border border-1px border-lightgrey rounded">
                          <label class="form-label" for="po_taxId">
                            Tax ID
                          </label>
                          <input
                            type="text"
                            name="po_taxId"
                            value={this.state.po_taxId}
                            class="form-control noborder"
                          />
                        </div>
                        <div class="form-group border border-1px border-lightgrey rounded">
                          <label class="form-label" for="po_tel">
                            Tel.
                          </label>
                          <input
                            type="text"
                            name="po_code"
                            value={this.state.po_tel}
                            class="form-control noborder"
                          />
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="form-group border border-1px border-lightgrey rounded">
                          <label class="form-label" for="po_branch">
                            Branch
                          </label>
                          <input
                            type="text"
                            name="po_code"
                            value={this.state.po_branch}
                            class="form-control noborder"
                          />
                        </div>
                        <div class="form-group border border-1px border-lightgrey rounded">
                          <label class="form-label" for="po_address">
                            Address
                          </label>
                          <textarea
                            name="po_address"
                            class="form-control noborder"
                          >
                            {this.state.po_address}
                          </textarea>
                        </div>
                      </div>
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
                        Cancel
                      </button>
                      <button
                        type="button"
                        name="btnAddPO"
                        id="btnAddPO"
                        class="btn btn--transparent btn-purple btn-wide"
                        data-dismiss="modal"
                        onClick={() => this.handleSubmitNewPO()}
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              id="configWarning"
              class="modal hide fade"
              tabindex="-1"
              role="dialog"
              aria-labelledby="addPO"
              aria-hidden="true"
            >
              <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                  <div class="modal-header">
                    <h3 id="myModalLabel">
                      <center>Error</center>
                    </h3>
                  </div>
                  <div class="modal-body d-flex">
                    <center>
                      The system cannot get attachment configuration
                    </center>
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
                  <div class="modal-header d-flex justify-content-center">
                    <h3 id="myModalLabel">Cancel</h3>
                  </div>
                  <div class="modal-body text-center">
                    <div className="text">
                      Do you want to cancel editing this invoice?
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
                      Edit Invoice Failed
                    </h3>
                  </div>
                  <div class="modal-body d-flex" style={{ margin: "auto" }}>
                    Unable to edit invoice because <br />
                    {this.state.editErrMessage}
                  </div>
                  <div class="modal-footer justify-content-center">
                    <button
                      type="button"
                      name="btnCloseModal"
                      id="btnCloseModal"
                      class="btn btn--transparent btn-wide"
                      // data-dismiss="modal"
                      aria-hidden="true"
                      onClick={() => {
                        this.closeAlertDialog();
                      }}
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div
              id="itemConditionWarning"
              class="modal hide fade"
              tabindex="-1"
              role="dialog"
              aria-labelledby="addPO"
              aria-hidden="true"
            >
              <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                  <div class="modal-header">
                    <h3 id="myModalLabel">
                      <center>Error</center>
                    </h3>
                  </div>
                  <div class="modal-body d-flex">
                    <center>
                      There is no available item for invoice creation. Please
                      contact procurement team for further assistant.
                    </center>
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
            <div
              id="addMorePO"
              class="modal hide fade"
              tabindex="-1"
              role="dialog"
              aria-labeledby="addMorePO"
              aria-hidden="true"
            >
              <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                  <div class="modal-header">
                    <h3 id="myModalLabel" class="mb-0">
                      Add PO
                    </h3>
                  </div>
                  <div class="modal-body d-flex flex-wrap bg-white align-items-start">
                    {/* Search Box - Start */}
                    <div
                      id="searchMorePO"
                      class="form col-12 px-0 d-flex flex-wrap align-items-center"
                    >
                      <div class="form-group col-3 px-0 mb-0">
                        <div class="form-label-group">
                          <input
                            type="text"
                            id="purchaseOrderNumber"
                            class="form-control input-search"
                            placeholder="PO No."
                            value=""
                          />
                          <label for="purchaseOrderNumber">PO No.</label>
                        </div>
                      </div>
                      <div class="form-group col-9 mb-0">
                        <a
                          href="javascript:void(0);"
                          class="btn btn--transparent btn-search-reset font-bold"
                        >
                          <i className="icon icon-x" /> Clear
                        </a>
                        <button className="btn btn-search ml-2" type="button">
                          <i className="icon icon-search" /> Search
                        </button>
                      </div>
                    </div>
                    {/* Search Box - End */}

                    {/* DataTable - Start */}
                    <div class="table-responsive col-12 px-0 mt-3">
                      <table class="table dataTable">
                        <thead>
                          <tr>
                            <th class="font-bold text-center">&nbsp;</th>
                            <th class="font-bold text-center">PO No.</th>
                            <th class="font-bold text-center">Company Name</th>
                            <th class="font-bold text-center">
                              Company
                              <br />
                              Branch Code
                            </th>
                            <th class="font-bold text-center">Vendor Name</th>
                            <th class="font-bold text-center">Payment Term</th>
                            <th class="font-bold text-center">PO Amount</th>
                            <th class="font-bold text-center">Reference</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr data-po="2018083-1">
                            <td class="text-center">
                              <a href="javascript:void(0);">
                                <i class="icon-add border border-purple border-1px border-rounded" />
                              </a>
                            </td>
                            <td class="text-center">
                              <span class="text-bold">2018083-1</span>
                            </td>
                            <td class="text-left">
                              <span class="text-uppercase mw-container text-left">
                                Thaiwood Groups Co., Ltd.
                              </span>
                            </td>
                            <td class="text-center">8,500.00</td>
                            <td class="text-left">
                              <span class="text-uppercase mw-container text-left">
                                Bkk Bayswood Co., Ltd.
                              </span>
                            </td>
                            <td class="text-center">
                              Credit 30 days
                              <br />
                              after receive bill
                            </td>
                            <td class="text-right">8,500.00</td>
                            <td class="text-left">Lorem ipsum</td>
                          </tr>
                          <tr data-po="5002111786">
                            <td class="text-center">
                              <a href="javascript:void(0);">
                                <i class="icon-add border border-purple border-1px border-rounded" />
                              </a>
                            </td>
                            <td class="text-center">
                              <span class="text-bold">5002111786</span>
                            </td>
                            <td class="text-left">
                              <span class="text-uppercase mw-container text-left">
                                Thaiwood Groups Co., Ltd.
                              </span>
                            </td>
                            <td class="text-center">6,000.00</td>
                            <td class="text-left">
                              <span class="text-uppercase mw-container text-left">
                                Siam Abitech Innovation Co., Ltd.
                              </span>
                            </td>
                            <td class="text-center">
                              Credit 30 days
                              <br />
                              after receive bill
                            </td>
                            <td class="text-right">6,000.00</td>
                            <td class="text-left">Lorem ipsum</td>
                          </tr>
                          <tr data-po="5002111787">
                            <td class="text-center">
                              <a href="javascript:void(0);">
                                <i class="icon-add border border-purple border-1px border-rounded" />
                              </a>
                            </td>
                            <td class="text-center">
                              <span class="text-bold">5002111787</span>
                            </td>
                            <td class="text-left">
                              <span class="text-uppercase mw-container text-left">
                                Thaiwood Groups Co., Ltd.
                              </span>
                            </td>
                            <td class="text-center">8,050.00</td>
                            <td class="text-left">
                              <span class="text-uppercase mw-container text-left">
                                Sec Bkk Co., Ltd.
                              </span>
                            </td>
                            <td class="text-center">
                              Credit 30 days
                              <br />
                              after receive bill
                            </td>
                            <td class="text-right">8,050.00</td>
                            <td class="text-left">Lorem ipsum</td>
                          </tr>
                          <tr data-po="5002111013">
                            <td class="text-center">
                              <a href="javascript:void(0);">
                                <i class="icon-add border border-purple border-1px border-rounded" />
                              </a>
                            </td>
                            <td class="text-center">
                              <span class="text-bold">5002111013</span>
                            </td>
                            <td class="text-left">
                              <span class="text-uppercase mw-container text-left">
                                Thaiwood Groups Co., Ltd.
                              </span>
                            </td>
                            <td class="text-center">10,000.00</td>
                            <td class="text-left">
                              <span class="text-uppercase mw-container text-left">
                                Structeco Co., Ltd.
                              </span>
                            </td>
                            <td class="text-center">
                              Credit 30 days
                              <br />
                              after receive bill
                            </td>
                            <td class="text-right">10,000.00</td>
                            <td class="text-left">Lorem ipsum</td>
                          </tr>
                          <tr data-po="5002111785">
                            <td class="text-center">
                              <a href="javascript:void(0);">
                                <i class="icon-add border border-purple border-1px border-rounded" />
                              </a>
                            </td>
                            <td class="text-center">
                              <span class="text-bold">5002111785</span>
                            </td>
                            <td class="text-left">
                              <span class="text-uppercase mw-container text-left">
                                Thaiwood Groups Co., Ltd.
                              </span>
                            </td>
                            <td class="text-center">5,000.00</td>
                            <td class="text-left">
                              <span class="text-uppercase mw-container text-left">
                                Bangkok Homesward Co., Ltd.
                              </span>
                            </td>
                            <td class="text-center">
                              Credit 30 days
                              <br />
                              after receive bill
                            </td>
                            <td class="text-right">5,000.00</td>
                            <td class="text-left">Lorem ipsum</td>
                          </tr>
                          <tr data-po="5002111789">
                            <td class="text-center">
                              <a href="javascript:void(0);">
                                <i class="icon-add border border-purple border-1px border-rounded" />
                              </a>
                            </td>
                            <td class="text-center">
                              <span class="text-bold">5002111789</span>
                            </td>
                            <td class="text-left">
                              <span class="text-uppercase mw-container text-left">
                                Thaiwood Groups Co., Ltd.
                              </span>
                            </td>
                            <td class="text-center">12,550.00</td>
                            <td class="text-left">
                              <span class="text-uppercase mw-container text-left">
                                Thai Masterpack Corporation Co., Ltd.
                              </span>
                            </td>
                            <td class="text-center">
                              Credit 30 days
                              <br />
                              after receive bill
                            </td>
                            <td class="text-right">12,550.00</td>
                            <td class="text-left">Lorem ipsum</td>
                          </tr>
                          <tr data-po="5002111785">
                            <td class="text-center">
                              <a href="javascript:void(0);">
                                <i class="icon-add border border-purple border-1px border-rounded" />
                              </a>
                            </td>
                            <td class="text-center">
                              <span class="text-bold">5002111785</span>
                            </td>
                            <td class="text-left">
                              <span class="text-uppercase mw-container text-left">
                                Thaiwood Groups Co., Ltd.
                              </span>
                            </td>
                            <td class="text-center">5,000.00</td>
                            <td class="text-left">
                              <span class="text-uppercase mw-container text-left">
                                Bangkok Homsward Co., Ltd.
                              </span>
                            </td>
                            <td class="text-center">
                              Credit 30 days
                              <br />
                              after receive bill
                            </td>
                            <td class="text-right">5,000.00</td>
                            <td class="text-left">Lorem ipsum</td>
                          </tr>
                          <tr data-po="5002111789">
                            <td class="text-center">
                              <a href="javascript:void(0);">
                                <i class="icon-add border border-purple border-1px border-rounded" />
                              </a>
                            </td>
                            <td class="text-center">
                              <span class="text-bold">5002111789</span>
                            </td>
                            <td class="text-left">
                              <span class="text-uppercase mw-container text-left">
                                Thaiwood Groups Co., Ltd.
                              </span>
                            </td>
                            <td class="text-center">12,550.00</td>
                            <td class="text-left">
                              <span class="text-uppercase mw-container text-left">
                                Thai Masterpack Corporation Co., Ltd.
                              </span>
                            </td>
                            <td class="text-center">
                              Credit 30 days
                              <br />
                              after receive bill
                            </td>
                            <td class="text-right">12,550.00</td>
                            <td class="text-left">Lorem ipsum</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {/* DataTable - End */}

                    {/* Selected PO Lists - Start */}
                    <div class="col-12 px-0 pt-3 d-flex flex-wrap align-items-start">
                      <div class="col-3 align-self-center">
                        <p class="font-bold">Selected PO : </p>
                      </div>
                      <div class="col-9 px-0 bootstrap-tagsinput">
                        <span class="tag label label-info font-bold disabled">
                          99999099564
                          <span data-role="remove" />
                        </span>
                        <span class="tag label label-info font-bold disabled">
                          99999099565
                          <span data-role="remove" />
                        </span>
                        <span class="tag label label-info font-bold">
                          PO32879-3001
                          <span data-role="remove" />
                        </span>
                        <span class="tag label label-info font-bold">
                          PO38292-1204
                          <span data-role="remove" />
                        </span>
                        <span class="tag label label-info font-bold">
                          PO38292-1204
                          <span data-role="remove" />
                        </span>
                        <span class="tag label label-info font-bold">
                          PO38292-1204
                          <span data-role="remove" />
                        </span>
                        <span class="tag label label-info font-bold">
                          PO38292-1204
                          <span data-role="remove" />
                        </span>
                      </div>
                    </div>
                    {/* Selected PO Lists - End */}
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
                      Cancel
                    </button>
                    <button
                      type="button"
                      name="btnSelectMorePO"
                      id="btnSelectMorePO"
                      class="btn btn-wide"
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </BlockUi>
        </Layout>
      </div>
    );
  }
}
export default withAuth(invoiceDetailEdit);
