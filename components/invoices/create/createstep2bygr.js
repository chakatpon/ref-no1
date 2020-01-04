import React, { Component } from "react";
import { formatNumber, numberOnly } from "./models/createmodel";
import ReactTooltip from "react-tooltip";
import { findDOMNode } from "react-dom";
import ModalAlert from "../../../components/modalAlert";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";
import dynamic from "next/dynamic";
import followMeConfig from "../../../follow-me.json";
import { CREATE_INVOICE_STEP2 } from "../../../configs/followMe/createInvoiceStep";
import { i18n, withTranslation } from "~/i18n";

const Tour = dynamic(() => import("~/components/custom-reactour"), {
  ssr: false
});
const accentColor = "#af3694";

class CreateStep2ByGR extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentActiveItems: 0,
      stepOneProp: {
        selectedItems: []
      },
      invoiceNeedAllItemFromGR: false,
      allowMultipleGR: true,
      isMultipleGRExceeded: false,
      modalMultipleGRExceeded: false,
      isTourOpen: false
    };
  }
  setActiveItems = index => {
    this.setState({ currentActiveItems: index });
    let checkAll =
      this.state.stepOneProp.selectedItems[index].itemLists.filter(row2 => {
        return !row2.checked;
      }).length == 0;
    this.setState({ checkAll: checkAll });
  };

  componentWillMount() {
    this.setState({
      steps: CREATE_INVOICE_STEP2
    });
  }

  componentDidUpdate() {}
  async componentDidMount() {
    //await this.setState(this.props.mainstate);
    await this.prepairingItems();
    ReactTooltip.rebuild();
    if (
      this.props.mainstate.stepOneProp.settings &&
      this.props.mainstate.stepOneProp.settings.INVOICE_CONFIG
    ) {
      if (
        this.props.mainstate.stepOneProp.settings.INVOICE_CONFIG
          .onlyAllowInvoiceCreationBySingleGR == true
      ) {
        this.setState({ allowMultipleGR: false });
      }
      if (
        this.props.mainstate.stepOneProp.settings.INVOICE_CONFIG
          .onlyAllowInvoiceTieWithSingleGR == true
      ) {
        this.setState({ invoiceNeedAllItemFromGR: true });
      }
    }
    setTimeout(() => {
      if (followMeConfig.createInvoice.GR.enableStep2) {
        // this.openTour();
      }
    }, 500);

    //this.setActiveItems(this.currentActiveItems)
  }
  handleCheckAll = e => {
    const isChecked = e.target.checked;
    let selectedItem = this.state.stepOneProp.selectedItems[
      this.state.currentActiveItems
    ];
    selectedItem.itemLists.map(row => {
      row.checked = isChecked;
      let itemUnitPrice = 0;
      if (row.selectUnitPrice !== undefined) {
        itemUnitPrice = row.selectUnitPrice;
      } else if (row.unitPrice) {
        itemUnitPrice = row.unitPrice;
      } else {
        itemUnitPrice = row.purchaseItem ? row.purchaseItem.poItemUnitPrice : 0;
      }
      // if (row.selectUnitPrice == undefined) {
      //   row.selectUnitPrice = itemUnitPrice;
      // }
      if (itemUnitPrice >= 0) {
        row.validateUnitPricePass = true;
      }
      if (row.selectQty == undefined) {
        row.selectQty = 0;
      }
      // if (row.selectUnitPrice == undefined) {
      //   row.selectUnitPrice = itemUnitPrice;
      // }
    });
    let selectedItems = this.state.stepOneProp.selectedItems;
    selectedItems[this.state.currentActiveItems] = selectedItem;
    this.setState({ selectedItems, checkAll: isChecked });
    this.handleMultipleGRChecked();
  };
  handleMultipleGRChecked = () => {
    if (this.state.allowMultipleGR == false) {
      let headerGr = [];
      this.state.stepOneProp.selectedItems.forEach(r => {
        r.itemLists.forEach(rt => {
          if (rt.checked == true) {
            if (headerGr.indexOf(rt.goodsReceivedLinearId) === -1) {
              headerGr.push(rt.goodsReceivedLinearId);
            }
          }
        });
      });
      if (headerGr.length > 1) {
        this.setState({
          isMultipleGRExceeded: true,
          modalMultipleGRExceeded: true
        });
      } else {
        this.setState({
          isMultipleGRExceeded: false,
          modalMultipleGRExceeded: false
        });
      }
    }
  };
  prepairingItems = () => {
    let selectedItems = this.props.mainstate.stepOneProp.selectedItems;
    selectedItems.map(row => {
      row.itemLists.map(row2 => {
        let itemUnitPrice = 0;
        let itemUnitPriceCurrency = row2.selectUnitPriceCurrency || "-";
        if (row2.selectUnitPrice !== undefined) {
          itemUnitPrice = row2.selectUnitPrice;
        } else if (row2.unitPrice !== undefined) {
          itemUnitPrice = row2.unitPrice;
          if (row2.currency) {
            itemUnitPriceCurrency = row2.currency;
          } else {
            itemUnitPriceCurrency = row2.purchaseItem.poItemUnitPriceCurrency;
          }
        } else {
          itemUnitPrice = row2.purchaseItem
            ? row2.purchaseItem.poItemUnitPrice
            : 0;
          itemUnitPriceCurrency = row2.purchaseItem.poItemUnitPriceCurrency;
        }
        if (itemUnitPrice >= 0) {
          row2.validateUnitPricePass = true;
        }
        row2.selectUnitPrice = itemUnitPrice;
        row2.selectUnitPriceCurrency = itemUnitPriceCurrency;
        if (row2.selectQty == undefined) {
          if (
            this.props.mainstate.stepOneProp.settings.INVOICE_CONFIG
              .autoPopulateInvoiceItemQuantity
          ) {
            row2.selectQty = row2.quantity.remaining;

            row2.selectAmount = parseFloat(
              (
                parseFloat(row2.selectQty).toFixed(3) *
                parseFloat(itemUnitPrice).toFixed(2)
              ).toFixed(2)
            );
            if (row2.selectQty !== 0.0) {
              row2.validateQtyPass = true;
            }
          } else {
            row2.selectQty = 0;
          }
        }
      });
    });

    this.setState({
      stepOneProp: {
        ...this.state.stepOneProp,
        selectedItems
      }
    });
  };
  handleItemChecked = e => {
    const item = e.target;
    const isChecked = e.target.checked;
    let selectedItems = this.state.stepOneProp.selectedItems;
    selectedItems.map(row => {
      row.itemLists.map(row2 => {
        if (row2.linearId == item.value) {
          row2.checked = isChecked;
          let itemUnitPrice = 0;
          if (row.selectUnitPrice !== undefined) {
            itemUnitPrice = row.selectUnitPrice;
          } else if (row.unitPrice) {
            itemUnitPrice = row.unitPrice;
          } else {
            itemUnitPrice = row.purchaseItem
              ? row.purchaseItem.poItemUnitPrice
              : 0;
          }
          if (itemUnitPrice >= 0) {
            row2.validateUnitPricePass = true;
          }
          if (row2.selectQty == undefined) {
            row2.selectQty = 0;
          }

          // if (row2.selectUnitPrice == undefined) {
          //   row2.selectUnitPrice = itemUnitPrice;
          // }
        }
      });
    });

    if (this.state.invoiceNeedAllItemFromGR == true) {
      let headerGr = [];
      this.state.stepOneProp.selectedItems.forEach(r => {
        r.itemLists.forEach(rt => {
          if (item.value == rt.linearId) {
            headerGr.push(rt.goodsReceivedLinearId);
          }
        });
        headerGr.forEach(headerLinearId => {
          r.itemLists.forEach(rt => {
            if (rt.goodsReceivedLinearId == headerLinearId)
              rt.checked = isChecked;
          });
        });
      });
    }

    let checkAll =
      selectedItems[this.state.currentActiveItems].itemLists.filter(row2 => {
        return !row2.checked;
      }).length == 0;

    this.setState({ selectedItems, checkAll: checkAll });
    this.setState({
      stepOneProp: {
        ...this.state.stepOneProp,
        selectedItems
      },
      checkAll: checkAll
    });
    this.handleMultipleGRChecked();
  };
  handleQtyChange = (e, row, index) => {
    if (e.target.value == "" || Number.isNaN(parseFloat(e.target.value))) {
      e.target.value = formatNumber(0, 3);
      row.selectQty = parseFloat(0).toFixed(3);
    } else {
      e.target.value = parseFloat(e.target.value.replace(/,/g, "")).toFixed(3);
      row.selectQty = parseFloat(e.target.value.replace(/,/g, ""));
      e.target.value = formatNumber(e.target.value.replace(/,/g, ""), 3);
    }

    this.updateItemState(row);
    this.autoResizeInput(e);
    this.handleQtyValidation(e, row);
    this.handleCalculateQty(e, row);
    ReactTooltip.hide();
  };
  updateItemState = row => {
    let selectedItems = this.state.stepOneProp.selectedItems;
    selectedItems[this.state.currentActiveItems].itemLists.map(r => {
      if (r.linearId == row.linearId) {
        r = row;
      }
    });
    this.setState({
      stepOneProp: {
        ...this.state.stepOneProp,
        selectedItems
      }
    });
  };
  handleCalculateQty = async (e, row) => {
    let arr = e.target.id.split("qty-select-");
    let itemRef = arr[1];
    let selectedItems = this.state.stepOneProp.selectedItems;
    let Qty = parseFloat(e.target.value.replace(/,/g, ""));
    let itemUnitPrice = 0;
    let itemUnitPriceCurrency = "";
    if (row.selectUnitPrice !== undefined) {
      itemUnitPrice = row.selectUnitPrice;
    } else if (row.unitPrice) {
      itemUnitPrice = row.unitPrice;
    } else {
      itemUnitPrice = row.purchaseItem ? row.purchaseItem.poItemUnitPrice : 0;
    }
    if (row.currency) {
      itemUnitPriceCurrency = row.currency;
    } else {
      itemUnitPriceCurrency = row.purchaseItem
        ? row.purchaseItem.poItemUnitPriceCurrency
        : "-";
    }
    row.selectUnitPrice = itemUnitPrice;
    row.validateQtyPass = await this.handleQtyValidation(e, row);
    row.validateUnitPricePass = row.selectUnitPrice >= 0;

    if (itemRef) {
      findDOMNode(this.refs["price-ref-" + itemRef]).value = parseFloat(
        row.selectUnitPrice * Qty
      ).toFixed(2);
    }

    selectedItems[this.state.currentActiveItems].itemLists.map(r => {
      if (r.linearId == row.linearId) {
        r.selectAmount = parseFloat(
          (parseFloat(itemUnitPrice) * Qty).toFixed(2)
        );
        r.selectUnitPrice = parseFloat(itemUnitPrice);
        r.selectUnitPriceCurrency = itemUnitPriceCurrency;
      }
    });
    this.updateItemState(row);
    return true;
  };
  handleQtyFocus = e => {
    e.target.value = e.target.value.replace(/,/g, "");
    if (e.target.value == 0) {
      e.target.value = "";
    }
    e.target.select();
    let arr = e.target.id.split("qty-select-");
    let itemRef = arr[1];
    let row = JSON.parse(e.target.getAttribute("data-row"));
    let maxQty = parseFloat(row.quantity.remaining);
    if (
      row.overDeliveryQuantity !== undefined &&
      row.overDeliveryQuantity.remaining !== undefined
    ) {
      maxQty = maxQty + parseFloat(row.overDeliveryQuantity.remaining);
    } else if (
      row.purchaseItem.overDeliveryQuantity !== undefined &&
      row.purchaseItem.overDeliveryQuantity.remaining !== undefined
    ) {
      maxQty =
        maxQty + parseFloat(row.purchaseItem.overDeliveryQuantity.remaining);
    }
    // this.setState({ maximumQtyTooltip: maxQty.toFixed(3) });
    ReactTooltip.show(findDOMNode(this.refs["qty-ref-" + itemRef]));
  };
  handleQtyValidation = (e, row) => {
    let val = parseFloat(e.target.value.replace(/,/g, ""));
    let colorDefault = "#626262";
    let maxQty = 0;
    let res = false;
    if (row) {
      maxQty = parseFloat(row.quantity.remaining);
      if (
        row.overDeliveryQuantity !== undefined &&
        row.overDeliveryQuantity.remaining !== undefined
      ) {
        maxQty = maxQty + parseFloat(row.overDeliveryQuantity.remaining);
      } else if (
        row.purchaseItem.overDeliveryQuantity !== undefined &&
        row.purchaseItem.overDeliveryQuantity.remaining !== undefined
      ) {
        maxQty =
          maxQty + parseFloat(row.purchaseItem.overDeliveryQuantity.remaining);
      }
      if (val > maxQty) {
        res = false;
      } else if (val <= 0.0) {
        res = false;
      } else {
        res = true;
      }
      //Check with Config
    } else {
      //Check without Config
      if (val <= 0.0) {
        res = false;
      } else {
        res = true;
      }
    }
    if (!res) {
      $(e.target).css("color", "red");
    } else {
      $(e.target).css("color", colorDefault);
    }
    return res;
  };

  textWidth = text => {
    try {
      let test = $("<span>")
        .hide()
        .appendTo(document.body);
      test.text(text);
      let width = test.width();
      test.remove();
      return width;
    } catch (err) {
      return 0;
    }
  };
  autoResizeInput = (e, row) => {
    let newW = this.textWidth(e.target.value);
    if (newW > 80) {
      $(e.target).width(newW);
    } else {
      $(e.target).width(80);
    }
    this.handleQtyValidation(e, row);
  };
  autoResizeInput2 = (e, row) => {
    let newW = this.textWidth(e.target.value);
    if (newW > 80) {
      $(e.target).width(newW);
    } else {
      $(e.target).width(80);
    }
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
  setDataForstepTwoProp = () => {
    let filteredItem = this.state.stepOneProp.selectedItems.map(item => {
      return item.itemLists
        .filter(itm => {
          return itm.checked === true;
        })
        .map(itm => {
          return itm;
        });
    });
    filteredItem = filteredItem.filter(item => {
      return item.length !== 0;
    });

    return filteredItem;
  };
  nextStep = async () => {
    let stepTwoProp = await this.setDataForstepTwoProp();
    await this.enableBody($(".reactour__helper--is-open")[0]);

    this.props.setMainState({ stepTwoProp });
    this.props.nextStep();
  };
  handleUnitFocus = e => {
    ReactTooltip.hide();
    e.target.value = e.target.value.replace(/,/g, "");
    if (e.target.value == 0) {
      e.target.value = "";
    }
    e.target.select();
  };
  handleUnitValidation = (e, row) => {
    ReactTooltip.hide();
    let val = parseFloat(e.target.value.replace(/,/g, ""));
    let colorDefault = "#626262";
    let res = false;
    if (val > 0) {
      res = true;
    }
    if (!res) {
      $(e.target).css("color", "red");
    } else {
      $(e.target).css("color", colorDefault);
    }
    return res;
  };
  handleCalculateUnit = async (e, row) => {
    let selectedItems = this.state.stepOneProp.selectedItems;
    let Qty = parseFloat(row.selectQty || 0);
    let UnitPrice = parseFloat(e.target.value.replace(/,/g, "") || 0);
    let arr = e.target.id.split("unit-select-");
    let itemRef = arr[1];
    findDOMNode(this.refs["price-ref-" + itemRef]).value = parseFloat(
      parseFloat(UnitPrice) * Qty
    ).toFixed(2);
    row.validateUnitPricePass = await this.handleUnitValidation(e, row);
    selectedItems[this.state.currentActiveItems].itemLists.map(r => {
      if (r.linearId == row.linearId) {
        r.selectAmount = parseFloat((parseFloat(UnitPrice) * Qty).toFixed(2));
        r.selectQty = Qty;
      }
    });
    this.updateItemState(row);
    return true;
  };
  handleUnitChange = (e, row, index) => {
    ReactTooltip.hide();
    if (e.target.value == "" || Number.isNaN(parseFloat(e.target.value))) {
      e.target.value = formatNumber(0, 2);
      row.selectUnitPrice = parseFloat(0);
    } else {
      e.target.value = parseFloat(e.target.value).toFixed(2);
      row.selectUnitPrice = parseFloat(e.target.value);
      e.target.value = formatNumber(e.target.value, 2);
    }

    this.updateItemState(row);
    this.autoResizeInput2(e);
    this.handleUnitValidation(e, row);
    this.handleCalculateUnit(e, row);
  };
  summaryAmount = () => {
    let summary = 0;
    this.state.stepOneProp.selectedItems.filter(r => {
      return r.itemLists.filter(rt => {
        if (rt.checked == true) {
          summary += rt.selectAmount;
        }
        return rt.checked == true;
      });
    });
    return summary;
  };
  handleAmountValidation = async (e, row) => {
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
  handleAmountChange(e, row) {
    let input = e.target.value;
    let value = input.replace(".", "");
    if (value == "" || isNaN(Number(value))) {
      e.target.value = formatNumber(0, 2);
      row.selectAmount = parseFloat(0);
    } else {
      e.target.value = parseFloat(e.target.value.replace(/,/g, "")).toFixed(2);
      row.selectAmount = parseFloat(e.target.value.replace(/,/g, ""));
      e.target.value = formatNumber(e.target.value.replace(/,/g, ""), 2);
    }
    this.updateItemState(row);
  }
  handleAmountFocus = e => {
    e.target.value = e.target.value.replace(/,/g, "");
    if (e.target.value == 0) {
      e.target.value = "";
    }
    e.target.select();
    let arr = e.target.id.split("price-select-");
    let itemRef = arr[1];
    let row = JSON.parse(e.target.getAttribute("data-row"));
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
    let items = [];
    let gr = [];
    if (this.state.stepOneProp.selectedItems[this.state.currentActiveItems]) {
      gr = this.state.stepOneProp.selectedItems[this.state.currentActiveItems];
      items = gr.itemLists;
    }
    return (
      <div>
        {this.renderTour()}
        {/* <ReactTooltip id="maximumQty" place="top" type="light" effect="float">
          <span>
            <b>Maximum: {this.state.maximumQtyTooltip}</b>
          </span>
        </ReactTooltip> */}
        {/* Header - Start */}
        <div className="page__header col-12">
          <div className="col-7">
            <h2>{t("Please Select PO and Items")}</h2>
          </div>
        </div>
        {/* Header - End */}

        {/* Body - Start */}
        <div id="createPO" className="col-12 box p-0 d-flex flex-wrap">
          {/* Sidebar - Start */}
          <div
            id="createPO-sidebar"
            className="col-2 d-flex flex-wrap p-0 border-right border-1px border-grey"
          >
            <ul
              id="selectPO-tab"
              className="col-12 align-self-start list-style-none"
            >
              {this.state.stepOneProp.selectedItems.map((row, i) => {
                return (
                  <li
                    className={`font-bold ${
                      this.state.currentActiveItems == i ? "active" : ""
                    }`}
                    onClick={() => {
                      this.setActiveItems(i);
                    }}
                  >
                    <a href="javascript:void(0);">
                      {row.purchaseOrderNumber}
                      <br />
                      <span>
                        ( {row.itemLists.length}{" "}
                        {row.itemLists.length > 1 ? t("items") : t("item")} )
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
          {/* Sidebar - End */}

          {/* List - Start */}
          <div
            id="createPO-body"
            className="col-10 d-flex flex-wrap align-items-start p-2"
          >
            {/* dataTable - Start */}
            <div className="table-responsive full-height">
              <table className="table dataTable">
                <thead>
                  <tr>
                    <th className="font-bold text-center checkbox-header">
                      <div className="custom-control custom-checkbox">
                        <input
                          type="checkbox"
                          id="selectAll"
                          checked={this.state.checkAll}
                          onChange={this.handleCheckAll}
                        />
                      </div>
                    </th>
                    <th className="font-bold text-center">
                      {t("PO Items No1")}
                      <br />
                      {t("PO Items No2")}
                    </th>
                    <th className="font-bold text-center">{t("Ref No1")}</th>
                    <th className="font-bold text-center">{t("Invoice No")}</th>
                    <th className="font-bold text-center">
                      {t("Material Description")}
                    </th>
                    <th className="font-bold text-center">{t("GR QTY")}</th>
                    <th className="font-bold text-center">{t("QTY")}</th>
                    <th className="font-bold text-center">
                      {t("Unit Description1")}
                      <br />
                      {t("Unit Description2")}
                    </th>
                    <th className="font-bold text-center">{t("Unit Price")}</th>
                    <th className="font-bold text-center">{t("Amount")}</th>
                    <th className="font-bold text-center">{t("Currency")}</th>
                  </tr>
                </thead>
                <tbody className="documentItems">
                  {items.map((row, i) => {
                    let defaultQty = 0.0;
                    let itemUnitPriceCurrency = "";
                    let itemUnitPrice = 0.0;

                    if (row.unitPrice !== undefined) {
                      itemUnitPrice = row.unitPrice;
                      if (row.currency) {
                        itemUnitPriceCurrency = row.currency;
                      } else {
                        itemUnitPriceCurrency =
                          row.purchaseItem.poItemUnitPriceCurrency;
                      }
                    } else {
                      itemUnitPrice = row.purchaseItem
                        ? row.purchaseItem.poItemUnitPrice
                        : 0;
                      itemUnitPriceCurrency = row.purchaseItem
                        ? row.purchaseItem.poItemUnitPriceCurrency
                        : "-";
                    }
                    if (row.purchaseItem.estimatedUnitPrice) {
                      row.estimatedUnitPrice =
                        row.purchaseItem.estimatedUnitPrice;
                    }

                    if (row.selectQty >= 0) {
                      defaultQty = row.selectQty;
                    }

                    let maxQty = parseFloat(row.quantity.remaining);
                    if (
                      row.overDeliveryQuantity !== undefined &&
                      row.overDeliveryQuantity.remaining !== undefined
                    ) {
                      maxQty =
                        maxQty + parseFloat(row.overDeliveryQuantity.remaining);
                    } else if (
                      row.purchaseItem.overDeliveryQuantity !== undefined &&
                      row.purchaseItem.overDeliveryQuantity.remaining !==
                        undefined
                    ) {
                      maxQty =
                        maxQty +
                        parseFloat(
                          row.purchaseItem.overDeliveryQuantity.remaining
                        );
                    }
                    return (
                      <tr
                        key={row.linearId}
                        className={row.checked ? "active" : ""}
                      >
                        <td className="text-center">
                          <div className="custom-control custom-checkbox">
                            <input
                              type="checkbox"
                              name="selectIds[]"
                              value={row.linearId}
                              checked={row.checked}
                              onClick={this.handleItemChecked}
                            />
                          </div>
                        </td>
                        <td className="text-center">
                          {row.purchaseItem.purchaseItemExternalId
                            ? row.purchaseItem.purchaseItemExternalId
                            : "-"}
                        </td>
                        <td className="text-center">
                          {row.referenceField1 || "-"}
                        </td>
                        <td className="text-center">
                          {row.invoiceExternalId || "-"}
                        </td>
                        <td className="text-left" style={{ minWidth: 200 }}>
                          {row.materialDescription}
                        </td>
                        <td className="text-right">
                          {formatNumber(row.quantity.remaining, 3)}
                        </td>
                        <td className="text-right">
                          <input
                            data-tip="custom show"
                            data-event="focus"
                            data-event-off="blur"
                            data-for={`maximumQty-${row.linearId}`}
                            id={`qty-select-${row.linearId}`}
                            ref={`qty-ref-${row.linearId}`}
                            data-row={JSON.stringify(row)}
                            type="text"
                            name="qty[]"
                            pattern="[0-9]*"
                            style={
                              (row.selectQty || defaultQty) <= 0.0 &&
                              row.checked == true
                                ? { color: "red" }
                                : { color: "#626262" }
                            }
                            defaultValue={formatNumber(row.selectQty, 3)}
                            placeholder={formatNumber(
                              row.selectQty || defaultQty,
                              3
                            )}
                            disabled={!row.checked}
                            onKeyPress={e => this.numberOnly(e, 13)}
                            onInput={e => {
                              this.autoResizeInput(e, row);
                            }}
                            onFocus={this.handleQtyFocus}
                            onBlur={e => {
                              this.handleQtyChange(e, row, i);
                            }}
                          />
                        </td>
                        <td className="text-center">{row.quantity.unit}</td>
                        <td className="text-right">
                          {"estimatedUnitPrice" in row ? (
                            <input
                              data-tip="custom show"
                              data-event="focus"
                              data-event-off="blur"
                              // data-for="maximumQty"
                              id={`unit-select-${row.linearId}`}
                              ref={`unit-ref-${row.linearId}`}
                              data-row={JSON.stringify(row)}
                              type="text"
                              name="unit_price[]"
                              pattern="[0-9]*"
                              style={
                                itemUnitPrice <= 0.0 && row.checked == true
                                  ? { color: "red" }
                                  : { color: "#626262" }
                              }
                              defaultValue={formatNumber(
                                row.selectUnitPrice !== undefined
                                  ? row.selectUnitPrice
                                  : itemUnitPrice,
                                2
                              )}
                              placeholder={formatNumber(
                                row.selectUnitPrice || 0,
                                2
                              )}
                              onInput={e => {
                                this.autoResizeInput2(e, row);
                              }}
                              disabled={!row.checked}
                              onKeyPress={e => this.numberOnly(e, 14)}
                              onFocus={this.handleUnitFocus}
                              //onFocusIn={this.handleQtyFocus}
                              onChange={e => {
                                this.handleUnitValidation(e, row);
                              }}
                              onBlur={e => {
                                this.handleUnitChange(e, row, i);
                              }}
                            />
                          ) : (
                            formatNumber(
                              parseFloat(
                                row.selectUnitPrice !== undefined
                                  ? row.selectUnitPrice
                                  : itemUnitPrice
                              ),
                              2
                            )
                          )}
                        </td>
                        <td className="text-right">
                          <input
                            data-tip="custom show"
                            data-event="focus"
                            data-event-off="blur"
                            // data-for="maximumQty"
                            key={`price-select-${row.linearId}`}
                            id={`price-select-${row.linearId}`}
                            ref={`price-ref-${row.linearId}`}
                            data-row={JSON.stringify(row)}
                            type="text"
                            name="amount[]"
                            pattern="[0-9]*"
                            style={
                              (row.selectAmount || 0) <= 0.0 &&
                              row.checked == true
                                ? { color: "red" }
                                : { color: "#626262" }
                            }
                            defaultValue={formatNumber(
                              row.selectAmount || 0,
                              2
                            )}
                            placeholder={formatNumber(0, 2)}
                            disabled={!row.checked}
                            onKeyPress={e => this.numberOnly(e, 14)}
                            onInput={e => {
                              this.autoResizeInput(e, row);
                            }}
                            onFocus={this.handleAmountFocus}
                            onChange={e => {
                              this.handleAmountValidation(e, row);
                            }}
                            onBlur={e => {
                              this.handleAmountChange(e, row, i);
                            }}
                          />
                        </td>
                        <td className="text-center">{itemUnitPriceCurrency}</td>
                        {/* Tooltip for maximumQty  */}
                        <ReactTooltip
                          id={`maximumQty-${row.linearId}`}
                          place="top"
                          type="light"
                          effect="float"
                        >
                          <span>
                            <b>Maximum: {maxQty}</b>
                          </span>
                        </ReactTooltip>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* dataTable - End */}
          </div>
          {/* List - End */}
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
                this.props.previousStep();
              }}
            >
              <i className="fa fa-chevron-left" /> {t("Back")}
            </button>
            <button
              type="button"
              name="btnNext"
              id="btnAddPO"
              disabled={
                this.state.stepOneProp.selectedItems.filter(r => {
                  return r.itemLists.filter(rt => {
                    return rt.checked == true;
                  }).length;
                }).length == 0 ||
                this.state.stepOneProp.selectedItems.filter(r => {
                  return r.itemLists.filter(rt => {
                    return rt.checked == true && !rt.validateQtyPass;
                  }).length;
                }).length > 0 ||
                this.summaryAmount() == 0 ||
                this.state.isMultipleGRExceeded == true
              }
              onClick={() => {
                this.nextStep();
              }}
              className="btn btn-wide ml-3"
            >
              {t("Next")} <i className="fa fa-chevron-right" />
            </button>
          </span>
        </div>
        <ModalAlert
          title="Error"
          visible={this.state.modalMultipleGRExceeded}
          button={[
            {
              label: "Close",
              attribute: {
                className: "btn btn--transparent btn-wide",
                onClick: () => {
                  this.setState({ modalMultipleGRExceeded: false });
                }
              }
            }
          ]}
          isTextOnly={true}
        >
          Please select only one goods receipt (GR) per invoice.
        </ModalAlert>
        {/* Footer - End */}
      </div>
    );
  }
}

export default withTranslation(["invoice-create"])(CreateStep2ByGR);
