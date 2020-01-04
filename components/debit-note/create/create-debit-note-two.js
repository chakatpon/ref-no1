import React, { Component } from "react";
import Router from "next/router";
import BlockUi from "react-block-ui";
import _ from "lodash";

import StepIndicator from "../../StepIndicator";
import ModalCancelWarning from "../../ModalCancelWarning";
import SectionCancelAndNext from "../../SectionCancelAndNext";
import { DEBIT_ROUTES } from "../../../configs/routes.config";
import { WANT_ACTION } from "../../../configs/errorMessage.config";
import { COLUMN_INVOICE_ITEMS } from "../models/invoice-items-column";
import HeaderDataTable from "../../DataTables/HeaderDataTable";
import { toBigNumber } from "~/helpers/app";
import { withTranslation } from "~/i18n";

const CANCEL_CREATE_MESSAGE_PATTERN = `${WANT_ACTION} cancel this DN?`;
const lang = "debit-create";

class createDebitNoteStepTwo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      blocking: false,
      invoiceNumber: null,
      invoiceItems: [],
      rowSelected: [],
      isPriceExceeded: false
    };
  }

  handleToggleBlocking = () => {
    this.setState({ blocking: !this.state.blocking });
  };

  componentDidMount() {
    this.handleToggleBlocking();

    const { mainState } = this.props;

    if (mainState.stepTwoProp === undefined || mainState.isInvoiceChange) {
      this.setState(
        {
          invoiceNumber: mainState.stepOneProp.invoiceInput,
          invoiceItems: mainState.stepOneProp.selectedInvoice.items,
          isInvoiceChange: false
        },
        () => this.renderInvoiceItemTable(this.state.invoiceItems)
      );
    } else {
      this.setState(
        {
          ...mainState.stepTwoProp,
          blocking: !mainState.stepTwoProp.blocking
        },
        () => {
          this.renderInvoiceItemTable(this.state.invoiceItems);
          this.resolveAllowToNext();
        }
      );
    }

    this.setState({
      subVatItemChange: mainState.subVatItemChange
    });
  }

  renderInvoiceItemTable = invoiceItems => {
    const rowSelected = this.state.rowSelected;
    const datas = [];

    invoiceItems.forEach((item, index) => {
      datas.push(this.prepareDataByRowForRenderInvoiceItemTable(item, index));
    });

    window
      .jQuery(this.el)
      .DataTable({
        language: {
          lengthMenu: "Display _MENU_ Per Page"
        },
        data: datas,
        columns: COLUMN_INVOICE_ITEMS,
        columnDefs: COLUMN_INVOICE_ITEMS,
        order: [[1, "asc"]],
        stateSave: false,
        paging: false,
        bLengthChange: true,
        searching: false,
        info: false,
        ordering: true
      })
      .on("error", (e, settings, techNote, message) => {
        console.log("An error has been reported by DataTables: ", message);
      });

    this.checkItemSelectWhenRenderTable(rowSelected, invoiceItems.length);

    window.jQuery("[id^='select-']").change(event => {
      this.handleItemSelect(event);
    });

    window.jQuery("#selectAll").change(event => {
      this.handleItemSelect(event);
    });

    window.jQuery("[id^='price-select-']").on("focus", event => {
      if (event.target.value === "0.00") {
        event.target.value = "";
      } else {
        event.target.value = this.formatNumberInput(event.target.value, 2);
      }
    });

    window.jQuery("[id^='price-select-']").on("blur", event => {
      if (event.target.value === "" || event.target.value === "0.00") {
        event.target.value = "0.00";
      } else {
        event.target.value = this.formatPriceNumber(
          toBigNumber(event.target.value).toNumber()
        );
      }
    });

    window.jQuery("[id^='price-select-']").on("input", event => {
      this.handleItemUnitPriceChange(event);
    });

    this.handleToggleBlocking();
  };

  prepareDataByRowForRenderInvoiceItemTable = (item, index) => {
    let adjAmount = 0;

    if (this.state.rowSelected.includes(index + 1)) {
      adjAmount = item.debitNoteAdjustedSubTotal;
    } else {
      item.debitNoteAdjustedSubTotal = 0;
      adjAmount = 0;
    }

    return {
      selected: `
        <div class="custom-control custom-checkbox">
          <input type="checkbox" id="select-${index + 1}"></input>
        </div>
      `,
      invoiceItemNo: item.externalId ? item.externalId : "-",
      materialDescription: item.materialDescription
        ? item.materialDescription
        : "-",
      poNo: item.purchaseOrderExternalId ? item.purchaseOrderExternalId : "-",
      poItemNo: item.purchaseItem.poItemNo ? item.purchaseItem.poItemNo : "-",
      amount: item.itemSubTotal
        ? this.formatPriceNumber(item.itemSubTotal)
        : this.formatPriceNumber(0),
      adjustedAmount: `
        <input
          disabled
          type="text"
          id="price-select-${index + 1}"
          value="${this.formatPriceNumber(adjAmount)}"
          class="form-control"
        >
        </input>
      `,
      currency: item.currency ? item.currency : "-"
    };
  };

  handleItemUnitPriceChange = event => {
    let value = event.target.value || "0";

    const invoiceItems = this.state.invoiceItems;
    const id = event.target.id.split("-");
    const targetIndex = id[2] - 1;
    let number = String(value.split(".")[0]).length;
    let decimal = String(value.split(".")[1] || "").length;

    if (number <= 14 && decimal <= 2 && isNaN(value) == false) {
      invoiceItems[targetIndex].debitNoteAdjustedSubTotal = toBigNumber(
        this.formatNumberInput(value, 2)
      ).toNumber();

      this.setState(
        {
          invoiceItems: invoiceItems,
          subVatItemChange: true
        },
        () => {
          this.validatePriceInput();
        }
      );
    } else {
      event.target.value = invoiceItems[targetIndex].debitNoteAdjustedSubTotal;
    }
  };

  formatQtyNumber = amount =>
    Intl.NumberFormat("th-TH", {
      useGrouping: true,
      maximumFractionDigits: 3,
      minimumFractionDigits: 3
    }).format(amount);

  formatPriceNumber = amount =>
    Intl.NumberFormat("th-TH", {
      useGrouping: true,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(amount);

  formatNumberInput = (input, decimal) => {
    const valueReplace = input.replace(/[^0-9.]/gm, "");
    const valueSplit = valueReplace.split(".");
    const interger = valueSplit[0];
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
  };

  checkItemSelectWhenRenderTable = (rowSelected, invoiceItemsLength) => {
    if (rowSelected.length > 0) {
      if (invoiceItemsLength === rowSelected.length) {
        window.jQuery("#selectAll").prop("checked", true);
      }

      rowSelected.forEach(row => {
        window
          .jQuery("[id^='select-" + row + "']")
          .parents("tr")
          .prop("className", "odd selected");

        window.jQuery("[id^='select-" + row + "']").prop("checked", "checked");
        window.jQuery("#price-select-" + row).prop("disabled", false);
      });
    }
  };

  handleItemSelect = event => {
    const element = event.target;
    const invoiceItems = this.state.invoiceItems;
    const rowSelected = [];
    let checkElement = {};

    if (element.id === "selectAll") {
      if (!element.checked) {
        checkElement = {
          checked: false,
          disabled: true,
          className: "odd"
        };
      } else {
        checkElement = {
          checked: true,
          disabled: false,
          className: "odd selected"
        };
      }

      window.jQuery("[id^='select']").prop("checked", checkElement.checked);
      window
        .jQuery("[id^='select-']")
        .parents("tr")
        .prop("className", checkElement.className);
      window
        .jQuery("[id^='price-select-']")
        .prop("disabled", checkElement.disabled);
    } else {
      this.autoClickSelectAllWhenAllItemSelect();

      if (!element.checked) {
        checkElement = {
          disabled: true,
          className: "odd"
        };
      } else {
        checkElement = {
          disabled: false,
          className: "odd selected"
        };
      }

      event.originalEvent.path[3].className = checkElement.className;
      window
        .jQuery("#price-" + element.id)
        .prop("disabled", checkElement.disabled);
    }

    invoiceItems.forEach((item, index) => {
      if (window.jQuery("#select-" + (index + 1))[0].checked) {
        rowSelected.push(index + 1);
      }
    });

    this.setState(
      {
        rowSelected: rowSelected,
        subVatItemChange: true
      },
      () => {
        this.validatePriceInput();
      }
    );
  };

  autoClickSelectAllWhenAllItemSelect = () => {
    const invoiceItems = this.state.invoiceItems;
    const selectAllInputId = "#selectAll";
    let isSelectAll = true;

    invoiceItems.forEach((item, index) => {
      if (!window.jQuery("#select-" + (index + 1))[0].checked) {
        window.jQuery(selectAllInputId).prop("checked", false);
        isSelectAll = false;
      }

      if (isSelectAll) {
        window.jQuery(selectAllInputId).prop("checked", true);
      }
    });
  };

  validatePriceInput = () => {
    const invoiceItems = this.state.invoiceItems;
    let isPriceExceededFound = false;

    invoiceItems.forEach((item, index) => {
      const priceInputId = `#price-select-${index + 1}`;

      if (this.state.rowSelected.includes(index + 1)) {
        if (item.debitNoteAdjustedSubTotal === 0) {
          window.jQuery(priceInputId).css("color", "red");
          isPriceExceededFound = true;
        } else {
          window.jQuery(priceInputId).css("color", "");
        }
      } else {
        window.jQuery(priceInputId).css("color", "");
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
  };

  resolveAllowToNext = () => {
    if (this.state.rowSelected.length > 0 && !this.state.isPriceExceeded) {
      this.setState({
        isReadyToNext: true
      });
    } else {
      this.setState({
        isReadyToNext: false
      });
    }
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
        <div id="cn_create" className="step-2">
          <StepIndicator
            activeStep={mainState.currentStep}
            contentStep={contentStep}
            lang={lang}
          />
          <div className="page__header col-12">
            <h2>{t("Please Select Invoice Item")}</h2>
          </div>
          <form
            id="cnCreateForm"
            name="cnCreateForm"
            method="post"
            encType="multipart/form-data"
            action=""
            className="form col-12 px-0"
          >
            <div className="box col-12 fixMinHeight-528">
              <h3 className="py-3">
                {t("Invoice No")}: {this.state.invoiceNumber} (
                <span className="selectedTotal">
                  {`${this.state.invoiceItems.length} ${
                    this.state.invoiceItems.length > 1 ? t("Items") : t("Item")
                  }`}
                </span>
                )
              </h3>
              <div className="table-responsive">
                <HeaderDataTable
                  refs={el => (this.el = el)}
                  model={COLUMN_INVOICE_ITEMS}
                  lang={lang}
                />
              </div>
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
            lang={lang}
          />
        </div>
      </BlockUi>
    );
  }
}
export default withTranslation(["debit-create"])(createDebitNoteStepTwo);
