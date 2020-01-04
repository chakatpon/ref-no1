import React, { Component } from "react";
import _ from "lodash";
import ApiService from "../../libs/ApiService";
import BlockUi from "react-block-ui";
import Router from "next/router";
import ModalAlert, { BTN_ACTION_BACK, BTN_ACTION_OK } from "../modalAlert";
import { i18n, withTranslation } from "~/i18n";

const Api = new ApiService();

const QTY_COLUMN_PATTERN = [
  { data: "selected" },
  { data: "invoiceItemNo" },
  { data: "materialDescription" },
  { data: "poNo" },
  { data: "poItemNo" },
  { data: "invoiceQty" },
  { data: "cnQty" },
  { data: "unit" },
  { data: "unitPrice" },
  { data: "currency" },
  { data: "cnAmount" }
];

const PRICE_COLUMN_PATTERN = [
  { data: "selected" },
  { data: "invoiceItemNo" },
  { data: "materialDescription" },
  { data: "poNo" },
  { data: "poItemNo" },
  { data: "unit" },
  { data: "qty" },
  { data: "unitPrice" },
  { data: "amount" },
  { data: "adjustedAmount" },
  { data: "currency" }
];

const CREATE_TYPE_ENUMS = {
  QTY: "QTY",
  PRICE: "PRICE"
};

class createCreditNoteStepTwo extends Component {
  constructor(props) {
    super(props);
    this.toggleBlocking = this.toggleBlocking.bind(this);
    this.state = {
      blocking: false,
      invoiceNumber: "",
      invoiceItems: [],
      createType: undefined,
      // Input
      rowSelected: [],
      isQtyExceeded: false,
      isPriceExceeded: false,
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

  componentDidMount() {
    this.resolveCreateType();
    this.toggleBlocking();
    if (
      this.props.mainState.stepTwoProp === undefined ||
      this.props.mainState.stepOneProp.isInvoiceChange
    ) {
      this.setState(
        {
          invoiceNumber: this.props.mainState.stepOneProp.invoiceInput,
          invoiceItems: this.props.mainState.stepOneProp.selectedInvoice.items
        },
        () => this.renderInvoiceItemTable(this.state.invoiceItems)
      );
    } else {
      if (this.isCreateTypeChange()) {
        this.setState(
          {
            invoiceNumber: this.props.mainState.stepOneProp.invoiceInput,
            invoiceItems: this.props.mainState.stepOneProp.selectedInvoice.items
          },
          () => this.renderInvoiceItemTable(this.state.invoiceItems)
        );
      } else {
        this.setState(
          {
            invoiceNumber: this.props.mainState.stepTwoProp.invoiceNumber,
            invoiceItems: this.props.mainState.stepTwoProp.invoiceItems,
            createType: this.props.mainState.stepTwoProp.createType,
            // Input
            isQtyExceeded: this.props.mainState.stepTwoProp.isQtyExceeded,
            isPriceExceeded: this.props.mainState.stepTwoProp.isPriceExceeded,
            rowSelected: this.props.mainState.stepTwoProp.rowSelected
          },
          () => {
            this.renderInvoiceItemTable(this.state.invoiceItems);
            this.resolveAllowToNext();
          }
        );
      }
    }
  }

  resolveAllowToNext() {
    if (
      this.state.rowSelected.length > 0 &&
      !this.state.isQtyExceeded &&
      !this.state.isPriceExceeded
    ) {
      this.setState({
        isReadyToNext: true
      });
    } else {
      this.setState({
        isReadyToNext: false
      });
    }
  }

  resolveCreateType() {
    if (this.props.mainState.stepOneProp.isQuantityAdjusted) {
      this.setState({
        createType: CREATE_TYPE_ENUMS.QTY
      });
    } else if (this.props.mainState.stepOneProp.isPriceAdjusted) {
      this.setState({
        createType: CREATE_TYPE_ENUMS.PRICE
      });
    }
  }

  isCreateTypeChange() {
    let incomingType = this.state.createType;
    let propType = this.props.mainState.stepTwoProp.createType;

    if (this.props.mainState.stepOneProp.isQuantityAdjusted) {
      incomingType = CREATE_TYPE_ENUMS.QTY;
    } else if (this.props.mainState.stepOneProp.isPriceAdjusted) {
      incomingType = CREATE_TYPE_ENUMS.PRICE;
    }

    if (propType === incomingType) {
      return false;
    } else {
      return true;
    }
  }

  populateRowForInvoiceItemTable(item, index) {
    if (this.state.createType === CREATE_TYPE_ENUMS.QTY) {
      let qty = 0;
      if (this.state.rowSelected.includes(index + 1)) {
        qty = item.creditNoteQuantity.initial;
      } else {
        item.creditNoteQuantity.initial = 0;
        qty = 0;
      }
      return {
        selected:
          '<div class="custom-control custom-checkbox">' +
          '<input type="checkbox" id="select-' +
          (index + 1) +
          '"></input>' +
          '<label class="pl-1 font-small text-shadow" for="selectall"></label>' +
          "</div>",
        invoiceItemNo: index + 1,
        materialDescription: item.materialDescription,
        poNo: item.purchaseOrderExternalId,
        poItemNo: item.purchaseItem.poItemNo,
        invoiceQty: this.formatQtyNumber(item.quantity.initial),
        cnQty:
          '<input disabled type="text" id="qty-select-' +
          (index + 1) +
          '" value="' +
          this.formatQtyNumber(qty) +
          '" class="form-control"></input>',
        unit: item.quantity.unit,
        unitPrice: this.formatPriceNumber(item.unitPrice),
        currency: item.currency,
        cnAmount:
          '<input disabled type="text" id="cnAmount-select-' +
          (index + 1) +
          '" value="' +
          this.formatPriceNumber(item.creditNoteAdjustedSubtotal) +
          '" class="form-control"></input>'
      };
    } else if (this.state.createType === CREATE_TYPE_ENUMS.PRICE) {
      let adjAmount = 0;
      if (this.state.rowSelected.includes(index + 1)) {
        adjAmount = item.creditNoteAdjustedSubtotal;
      } else {
        item.creditNoteAdjustedSubtotal = 0;
        adjAmount = 0;
      }
      return {
        selected:
          '<div class="custom-control custom-checkbox">' +
          '<input type="checkbox" id="select-' +
          (index + 1) +
          '"></input>' +
          '<label class="pl-1 font-small text-shadow" for="selectall"></label>' +
          "</div>",
        invoiceItemNo: index + 1,
        materialDescription: item.materialDescription,
        poNo: item.purchaseOrderExternalId,
        poItemNo: item.purchaseItem.poItemNo,
        unit: item.quantity.unit,
        qty: this.formatQtyNumber(item.quantity.initial),
        unitPrice: this.formatPriceNumber(item.unitPrice),
        amount: this.formatPriceNumber(item.itemSubTotal),
        adjustedAmount:
          '<input disabled type="text" id="price-select-' +
          (index + 1) +
          '" value="' +
          this.formatPriceNumber(adjAmount) +
          '" class="form-control"></input>',
        currency: item.currency
      };
    }
  }

  async renderInvoiceItemTable(invoiceItem) {
    let data = [];
    invoiceItem.forEach((item, index) => {
      data.push(this.populateRowForInvoiceItemTable(item, index));
    });
    let dts = window
      .jQuery(this.el)
      .DataTable({
        //dom: '<<"row justify-content-between align-items-center mb-3"<"col d-flex align-items-center"lp><"col d-flex justify-content-end"<"btn-wrap upload"><"btn-wrap create"><"btn-wrap col-display"><"btn-wrap export">>><t>>',
        language: {
          lengthMenu: "Display _MENU_ Per Page"
        },
        data: data,
        columns:
          this.state.createType === CREATE_TYPE_ENUMS.QTY
            ? QTY_COLUMN_PATTERN
            : PRICE_COLUMN_PATTERN,
        columnDefs: [
          {
            targets: [0],
            orderable: false,
            sortable: false,
            width: "60px"
          },
          {
            targets: [1],
            width: "80px",
            orderable: true,
            className: "text-center"
          },
          {
            targets: [2],
            width: "300px"
          },
          {
            targets: [3],
            width: "100px"
          },
          {
            targets: [4],
            width: "80px"
          },
          {
            targets: [5],
            width: "80px"
          },
          {
            targets: [6],
            width: "80px"
          },
          {
            targets: [7, 8, 9, 10],
            width: "80px"
          }
        ],
        order: [[1, "asc"]],
        stateSave: false,
        paging: false,
        bLengthChange: true,
        searching: false,
        info: false,
        ordering: true
      })
      .on("error", function(e, settings, techNote, message) {
        console.log("An error has been reported by DataTables: ", message);
      });

    if (this.state.rowSelected.length > 0) {
      let rowSelected = this.state.rowSelected;
      rowSelected.forEach(row => {
        window
          .jQuery("[id^='select-" + row + "']")
          .parents("tr")
          .prop("className", "odd selected");

        window.jQuery("[id^='select-" + row + "']").prop("checked", "checked");
        if (this.state.createType === CREATE_TYPE_ENUMS.QTY) {
          window.jQuery("#qty-select-" + row).prop("disabled", false);
          window.jQuery("#cnAmount-select-" + row).prop("disabled", false);
        } else {
          window.jQuery("#price-select-" + row).prop("disabled", false);
        }
      });
    }

    await window.jQuery("[id^='select-']").change(event => {
      this.handleItemSelect(event);
    });

    await window.jQuery("#selectAll").change(event => {
      this.handleItemSelect(event);
    });

    await window.jQuery("[id^='qty-select-']").on("input", event => {
      this.handleItemQtyChange(event);
    });
    await window.jQuery("[id^='qty-select-']").on("keypress", event => {
      let input = event.target.value;
      let valueReplace = input.replace(/[^0-9.]/gm, "");
      let valueSplit = valueReplace.split(".");
      let digit = valueReplace.replace(".", "");
      let cursorPosition = event.currentTarget.selectionStart;
      let integer = valueSplit[0];
      let decimal = valueSplit[1];
      let typablePosition = digit.length - (decimal ? decimal.length : 0);
      console.log(event);
      console.log("selectionStart", event.currentTarget.selectionStart);
      console.log("selectionEnd", event.currentTarget.selectionEnd);
      console.log("target", event.target);
      console.log("digit.length - decimal.length", typablePosition);
      if (window.getSelection().toString().length == 0) {
        if (event.target.value.indexOf(".") !== -1) {
          if (
            (digit.length >= 16 || decimal.length >= 16 - 13) &&
            event.which != "46"
          ) {
            if (
              (cursorPosition > typablePosition || integer.length >= 13) &&
              event.which != "46"
            ) {
              return false;
            }
          } else if (event.which == "46") {
            return false;
          }
        } else {
          if (integer.length >= 13 && event.which != "46") {
            return false;
          }
        }
      }
    });
    await window.jQuery("[id^='qty-select-']").on("focus", event => {
      if (event.target.value == "0.000") {
        event.target.value = "";
      }
      event.target.select();
    });
    await window.jQuery("[id^='qty-select-']").on("change", event => {
      let input = event.target.value;
      let value = input.replace(".", "");
      if (value == "") {
        event.target.value = this.formatQtyNumber(0);
      }
      event.target.value = this.formatQtyNumber(event.target.value);
    });
    await window.jQuery("[id^='cnAmount-select-']").on("input", event => {
      this.handleItemUnitPriceChange(event);
    });
    await window.jQuery("[id^='cnAmount-select-']").on("change", event => {
      let input = event.target.value;
      let value = input.replace(".", "");
      if (value == "") {
        event.target.value = this.formatPriceNumber(0);
      }
      event.target.value = this.formatPriceNumber(event.target.value);
    });

    await window.jQuery("[id^='cnAmount-select-']").on("keypress", event => {
      let input = event.target.value;
      let valueReplace = input.replace(/[^0-9.]/gm, "");
      let valueSplit = valueReplace.split(".");
      let digit = valueReplace.replace(".", "");
      let cursorPosition = event.currentTarget.selectionStart;
      let integer = valueSplit[0];
      let decimal = valueSplit[1];
      let typablePosition = digit.length - (decimal ? decimal.length : 0);
      console.log(event);
      console.log("selectionStart", event.currentTarget.selectionStart);
      console.log("selectionEnd", event.currentTarget.selectionEnd);
      console.log("target", event.target);
      console.log("digit.length - decimal.length", typablePosition);
      if (window.getSelection().toString().length == 0) {
        if (event.target.value.indexOf(".") !== -1) {
          if (
            (digit.length >= 16 || decimal.length >= 16 - 14) &&
            event.which != "46"
          ) {
            if (
              (cursorPosition > typablePosition || integer.length >= 14) &&
              event.which != "46"
            ) {
              return false;
            }
          } else if (event.which == "46") {
            return false;
          }
        } else {
          if (integer.length >= 14 && event.which != "46") {
            return false;
          }
        }
      }
    });

    await window.jQuery("[id^='price-select-']").on("input", event => {
      this.handleItemUnitPriceChange(event);
    });

    await window.jQuery("[id^='price-select-']").on("keypress", event => {
      let input = event.target.value;
      let valueReplace = input.replace(/[^0-9.]/gm, "");
      let valueSplit = valueReplace.split(".");
      let digit = valueReplace.replace(".", "");
      let cursorPosition = event.currentTarget.selectionStart;
      let integer = valueSplit[0];
      let decimal = valueSplit[1];
      let typablePosition = digit.length - (decimal ? decimal.length : 0);
      console.log(event);
      console.log("selectionStart", event.currentTarget.selectionStart);
      console.log("selectionEnd", event.currentTarget.selectionEnd);
      console.log("target", event.target);
      console.log("digit.length - decimal.length", typablePosition);
      if (window.getSelection().toString().length == 0) {
        if (event.target.value.indexOf(".") !== -1) {
          if (
            (digit.length >= 16 || decimal.length >= 16 - 14) &&
            event.which != "46"
          ) {
            if (
              (cursorPosition > typablePosition || integer.length >= 14) &&
              event.which != "46"
            ) {
              return false;
            }
          } else if (event.which == "46") {
            return false;
          }
        } else {
          if (integer.length >= 14 && event.which != "46") {
            return false;
          }
        }
      }
    });

    await window.jQuery("[id^='price-select-']").on("focus", event => {
      if (event.target.value == "0.00") {
        event.target.value = "";
      }
      event.target.select();
    });
    await window.jQuery("[id^='price-select-']").on("change", event => {
      let input = event.target.value;
      let value = input.replace(".", "");
      if (value == "") {
        event.target.value = this.formatPriceNumber(0);
      }
      event.target.value = this.formatPriceNumber(event.target.value);
    });

    await this.toggleBlocking();
  }

  handleItemSelect(event) {
    let element = event.target;
    if (element.id === "selectAll") {
      if (!element.checked) {
        window.jQuery("[id^='select']").prop("checked", false);
        window
          .jQuery("[id^='select-']")
          .parents("tr")
          .prop("className", "odd");
        window.jQuery("[id^='qty-select-']").prop("disabled", true);
        window.jQuery("[id^='cnAmount-select-']").prop("disabled", true);
        window.jQuery("[id^='price-select-']").prop("disabled", true);
      } else {
        window.jQuery("[id^='select']").prop("checked", true);
        window
          .jQuery("[id^='select-']")
          .parents("tr")
          .prop("className", "odd selected");
        window.jQuery("[id^='qty-select-']").prop("disabled", false);
        window.jQuery("[id^='cnAmount-select-']").prop("disabled", false);
        window.jQuery("[id^='price-select-']").prop("disabled", false);
      }
    } else {
      this.shouldItemsSelectAll();
      if (element.checked) {
        event.originalEvent.path[3].className = "odd selected";
        window.jQuery("#qty-" + element.id).prop("disabled", false);
        window.jQuery("#cnAmount-" + element.id).prop("disabled", false);
        window.jQuery("#price-" + element.id).prop("disabled", false);
      } else {
        event.originalEvent.path[3].className = "odd";
        window.jQuery("#qty-" + element.id).prop("disabled", true);
        window.jQuery("#cnAmount-" + element.id).prop("disabled", true);
        window.jQuery("#price-" + element.id).prop("disabled", true);
      }
    }

    let items = this.state.invoiceItems;
    let rowSelected = [];
    items.forEach((item, index) => {
      if (window.jQuery("#select-" + (index + 1))[0].checked) {
        rowSelected.push(index + 1);
      }
    });

    this.setState(
      {
        rowSelected: rowSelected
      },
      () => {
        if (this.state.createType === CREATE_TYPE_ENUMS.QTY) {
          this.validateQtyInput();
        } else if (this.state.createType === CREATE_TYPE_ENUMS.PRICE) {
          this.validatePriceInput();
        }
      }
    );
  }

  shouldItemsSelectAll() {
    let isSelectAll = true;
    let items = this.state.invoiceItems;
    items.forEach((item, index) => {
      if (!window.jQuery("#select-" + (index + 1))[0].checked) {
        window.jQuery("#selectAll").prop("checked", false);
        isSelectAll = false;
      }
      if (isSelectAll) {
        window.jQuery("#selectAll").prop("checked", true);
      }
    });
  }

  handleItemQtyChange(event) {
    event.target.value = this.formatNumberInput(event.target.value, 3);
    let invoiceItems = this.state.invoiceItems;
    let changeQty = event.target.value;
    console.log("Type Of : ", isNaN(Number(changeQty)));
    let arr = event.target.id.split("-");
    let index = arr[2] - 1;
    let targetItem = invoiceItems[index];
    targetItem.creditNoteQuantity.initial = isNaN(Number(changeQty))
      ? Number(0)
      : Number(changeQty);
    targetItem.creditNoteAdjustedSubtotal =
      (isNaN(Number(changeQty)) ? Number(0) : Number(changeQty)) *
      Number(targetItem.unitPrice);

    console.log(
      "creditNoteQuantity.initial : ",
      targetItem.creditNoteQuantity.initial
    );
    console.log(
      "creditNoteAdjustedSubtotal : ",
      targetItem.creditNoteAdjustedSubtotal
    );
    window
      .jQuery("#cnAmount-select-" + (index + 1))
      .val(
        this.formatPriceNumber(
          (isNaN(Number(changeQty)) ? 0 : Number(changeQty)) *
            Number(targetItem.unitPrice)
        )
      );

    this.setState(
      {
        invoiceItems: invoiceItems
      },
      () => {
        this.validateQtyInput();
      }
    );
  }

  handleItemUnitPriceChange(event) {
    event.target.value = this.formatNumberInput(event.target.value, 2);
    let invoiceItems = this.state.invoiceItems;
    let changeUnit = event.target.value;
    console.log("Type Of : ", isNaN(Number(changeUnit)));
    let arr = event.target.id.split("-");
    let index = arr[2] - 1;
    let targetItem = invoiceItems[index];
    targetItem.creditNoteAdjustedSubtotal = isNaN(Number(changeUnit))
      ? Number(0)
      : Number(changeUnit);

    console.log(
      "creditNoteAdjustedSubtotal : ",
      targetItem.creditNoteAdjustedSubtotal
    );

    this.setState(
      {
        invoiceItems: invoiceItems
      },
      () => {
        this.validatePriceInput();
      }
    );
  }

  validateQtyInput() {
    let isQtyExceededFound = false;
    let invoiceItems = this.state.invoiceItems;
    invoiceItems.forEach((item, index) => {
      if (this.state.rowSelected.includes(index + 1)) {
        console.log(
          "item.creditNoteQuantity.initial",
          item.creditNoteQuantity.initial
        );
        console.log("quantity.remaining", item.quantity.remaining);
        if (
          item.creditNoteQuantity.initial > item.quantity.remaining ||
          item.creditNoteQuantity.initial === 0
        ) {
          window.jQuery("#qty-select-" + (index + 1)).css("color", "red");
          isQtyExceededFound = true;
        } else {
          window.jQuery("#qty-select-" + (index + 1)).css("color", "");
        }
      } else {
        window.jQuery("#qty-select-" + (index + 1)).css("color", "");
      }
    });

    if (isQtyExceededFound) {
      this.setState(
        {
          isQtyExceeded: TextTrackCueList
        },
        () => this.resolveAllowToNext()
      );
    } else {
      this.setState(
        {
          isQtyExceeded: false,
          isPriceExceeded: false
        },
        () => this.resolveAllowToNext()
      );
    }
  }

  validatePriceInput() {
    let isPriceExceededFound = false;
    let invoiceItems = this.state.invoiceItems;
    invoiceItems.forEach((item, index) => {
      if (this.state.rowSelected.includes(index + 1)) {
        console.log(
          "item.creditNoteAdjustedSubtotal : ",
          item.creditNoteAdjustedSubtotal
        );
        console.log("itemSubTotal", item.itemSubTotal);
        if (
          item.creditNoteAdjustedSubtotal > item.itemSubTotal ||
          item.creditNoteAdjustedSubtotal === 0
        ) {
          window.jQuery("#price-select-" + (index + 1)).css("color", "red");
          isPriceExceededFound = true;
        } else {
          window.jQuery("#price-select-" + (index + 1)).css("color", "");
        }
      } else {
        window.jQuery("#price-select-" + (index + 1)).css("color", "");
      }
    });

    if (isPriceExceededFound) {
      this.setState(
        {
          isPriceExceeded: true
        },
        () => this.resolveAllowToNext()
      );
    } else {
      this.setState(
        {
          isPriceExceeded: false
        },
        () => this.resolveAllowToNext()
      );
    }
  }

  ///// Util /////

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
          <div id="cn_create" class="step-2">
            <div id="step-indicator" class="col-12">
              <ul class="d-flex justify-content-center">
                <li class="flex-fill finished">
                  <div class="indicator step-1 rounded-circle text-center finished">
                    <span class="number">1</span>
                    <i class="fa fa-check" />
                  </div>
                  <p class="text-center">{t("Select Invoice")}</p>
                </li>
                <li class="flex-fill active">
                  <div class="indicator step-2 rounded-circle text-center">
                    <span class="number">2</span>
                    <i class="fa fa-check" />
                  </div>
                  <p class="text-center">{t("Credit Note Items")}</p>
                </li>
                <li class="flex-fill">
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
              <h2>{t("Please Select Invoice Item")}</h2>
            </div>
            <form
              id="cnCreateForm"
              name="cnCreateForm"
              method="post"
              enctype="multipart/form-data"
              action=""
              class="form col-12 px-0"
            >
              <div class="box col-12 fixMinHeight-528">
                <h3 class="py-3">
                  {t("Invoice No")}: {this.state.invoiceNumber} (
                  <span class="selectedTotal">
                    {this.state.invoiceItems.length}{" "}
                    {this.state.invoiceItems.length > 1
                      ? t("Items")
                      : t("Item")}
                  </span>
                  )
                </h3>
                <div class="table-responsive">
                  <table class="table datatable" ref={el => (this.el = el)}>
                    <thead class="bg-lightgrey">
                      {this.state.createType === CREATE_TYPE_ENUMS.QTY ? (
                        <tr>
                          <th class="text-left">
                            <input type="checkbox" id="selectAll" />
                          </th>
                          <th>
                            {t("Invoice Item No1")}
                            <br />
                            {t("Invoice Item No2")}
                          </th>
                          <th>{t("Material Description")}</th>
                          <th>{t("PO No")}</th>
                          <th>
                            {t("PO Item No1")}
                            <br />
                            {t("PO Item No2")}
                          </th>
                          <th>{t("Invoice QTY")}</th>
                          <th>{t("CN QTY")}</th>
                          <th>{t("Unit")}</th>
                          <th>
                            {t("Unit Price1")}
                            <br />
                            {t("Unit Price2")}
                          </th>
                          <th>{t("Currency")}</th>
                          <th>
                            {t("CN Amount1")}
                            <br />
                            {t("CN Amount2")}
                          </th>
                        </tr>
                      ) : (
                        <tr>
                          <th class="text-left">
                            <input type="checkbox" id="selectAll" />
                          </th>
                          <th>
                            Invoice
                            <br />
                            Item No.
                          </th>
                          <th>Material Description</th>
                          <th>PO No.</th>
                          <th>
                            PO
                            <br />
                            Item No.
                          </th>
                          <th>Unit</th>
                          <th>Invoice Qty</th>
                          <th>
                            Invoice
                            <br />
                            Unit Price
                          </th>
                          <th>
                            Invoice
                            <br />
                            Amount
                          </th>
                          <th>
                            Adjusted
                            <br />
                            Amount
                          </th>
                          <th>Currency</th>
                        </tr>
                      )}
                    </thead>
                  </table>
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
                  {this.state.isReadyToNext === true ? (
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
export default withTranslation(["credit-create"])(createCreditNoteStepTwo);
