import React, { Component, Fragment } from "react";
import {
  PageHeader,
  Collapse,
  CollapseItem,
  CollapseItemText,
  CollapseItemExternalLink,
  CollapseItemLink2,
  CollapseItemLink,
  ModalDefault
} from "~/components/page";
import api from "~/libs/api";
import { findDOMNode } from "react-dom";
import { formatNumber, numberOnly } from "../models/item";
import ReactTooltip from "react-tooltip";
export default class GRItemEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activePO: "",
      currentActiveItems: 0,
      maximumQtyTooltip: 0,
      checkAll: false,
      rawData: [],
      selectedItems: [],
      settings: {},
      allowMultipleGR: true,
      isMultipleGRExceeded: false,
      modalMultipleGRExceeded: false
    };
    this.poApi = new api().group("po");
    this.configApi = new api().group("config");
  }
  componentDidMount = () => {
    ReactTooltip.rebuild();

    let selectedItems = this.state.selectedItems;

    this.setState({
      rawData: this.props.data,
      settings: this.props.settings
    });

    this.props.data.items.forEach(item => {
      console.log(item);
      this.addItem({
        linearId: item.purchaseItem.purchaseOrderLinearId,
        siblingLinearId: item.linearId,
        purchaseOrderNumber: item.purchaseOrderExternalId,
        existsItems: item.goodsReceivedItems,
        invoiceItem: item
      });
    });
    if (this.props.settings && this.props.settings.INVOICE_CONFIG) {
      if (
        this.props.settings.INVOICE_CONFIG.onlyAllowInvoiceCreationBySingleGR ==
        true
      ) {
        this.setState({ allowMultipleGR: false });
      }
    }
  };
  componentWillReceiveProps = nextProps => { };
  setActiveItems = index => {
    this.setState({ currentActiveItems: index });
    let checkAll =
      this.state.selectedItems[index].itemLists.filter(row2 => {
        return !row2.checked;
      }).length == 0;
    this.setState({ checkAll: checkAll });
  };
  addItem = async item => {
    console.log("addItem", item);
    let { selectedItems } = this.state;
    let filteredArray = this.state.selectedItems.filter(
      row => row.linearId === item.linearId
    );
    if (filteredArray.length != 0) {
      selectedItems.map(row => {
        if (row.linearId === item.linearId) {
          row.existsItems.push(...item.existsItems);
        }
      });
      this.setState({ selectedItems });
      this.props.updateMainState({ selectedItems });

      return;
    }
    selectedItems.push(item);
    this.setState({ selectedItems });
    this.props.updateMainState({ selectedItems });
    this.getItemGR(item);
  };
  getItemGR = async item => {
    try {
      let itemResp = await this.poApi.call("poitem", {
        purchaseOrderLinearId: item.linearId,
        //deleteFlag: "IS_NULL",
        bypass: true
      });
      console.log("itemResp", itemResp);
      let itemGrResp = await this.poApi.call("gritem", {
        purchaseOrderExternalId: item.purchaseOrderNumber,
        movementClass: "NORMAL",
        //siblingLinearId: "IS_NULL",
        //statuses: "ISSUED",
        filterReverse: "true",
        bypass: true
      });
      console.log("itemGrResp", itemGrResp);
      itemGrResp.data = itemGrResp.rows || itemGrResp.data;
      if (itemGrResp.data.length == 0) {
        itemResp.data = [];
        await this.addItemLists(item, itemGrResp);
        return;
      }
      itemGrResp.data = itemGrResp.data.filter(r => {
        return (
          r.quantity !== undefined &&
          r.quantity.remaining !== undefined &&
          r.quantity.unit !== undefined &&
          r.quantity.remaining >= 0
        );
      });
      itemGrResp.data.map(r => {
        r.purchaseItems = itemResp.data.filter(
          f => f.linearId == r.purchaseItemLinearId
        );
      });

      //console.log('itemResp', itemResp)
      //console.log('itemGrResp', itemGrResp)
      await this.addItemLists(item, itemGrResp);
    } catch (error) {
      console.log(error.message);
      //this.deleteItem(item);
    }
  };
  addItemLists = async (item, result) => {
    //console.log("rawData", this.state.rawData.linearId, result);
    result.data = result.data.filter(r => {
      return (
        r.deleteFlag !== "BLOCK" &&
        r.deleteFlag !== "DELETED" &&
        (r.invoiceItemLinearId == item.siblingLinearId ||
          r.invoiceItemLinearId == "" ||
          r.invoiceItemLinearId === undefined)
      );
    });
    result.data.map(r => {
      console.log("item.existsItems", item.existsItems);
      let curr = item.existsItems.filter(x => {
        console.log(r.linearId, "==", x.linearId);
        return r.linearId == x.linearId;
      });

      if (curr.length == 1) {
        r.checked = true;
        r.selectQty = parseFloat(curr[0].quantity.initial).toFixed(3);
        r.selectUnitPrice = parseFloat(curr[0].unitPrice).toFixed(2);
        r.selectAmount = parseFloat(r.selectQty * r.selectUnitPrice).toFixed(2);
        console.log("curr[0]", curr[0]);
      }
    });

    // if (result.data.length < 1) {
    //     return await this.deleteItem(item);
    //     return;
    // }
    let selectedItems = this.state.selectedItems.map(row => {
      if (item.linearId == row.linearId) {
        if (row.itemLists) {
        }
        row.itemLists = result.data;
      }
      return row;
    });
    this.props.updateMainState({ selectedItems });
    return await this.setState({ selectedItems });
  };
  deleteItem = async item => {
    let filteredArray = this.state.selectedItems.filter(
      row => row.linearId !== item.linearId
    );

    if (filteredArray.length < 1) {
      this.setState({ selectedItems: [] });
      this.props.updateMainState({ selectedItems: [] });
    } else {
      this.setState({ selectedItems: filteredArray });
      this.props.updateMainState({ selectedItems: filteredArray });
    }
  };
  componentWillUnmount() {
    this.state = {};
  }
  handleCheckAll = e => {
    const item = e.target.name;
    const isChecked = e.target.checked;
    let selectedItem = this.state.selectedItems[this.state.currentActiveItems];
    console.log(isChecked);
    selectedItem.itemLists.map(row => {
      row.checked = isChecked;
      let itemUnitPrice = 0;
      if (row.selectUnitPrice !== undefined) {
        itemUnitPrice = row.selectUnitPrice;
      } else if (row.unitPrice) {
        itemUnitPrice = row.unitPrice;
      } else {
        itemUnitPrice = row.purchaseItems[0]
          ? row.purchaseItems[0].poItemUnitPrice
          : 0;
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
    let selectedItems = this.state.selectedItems;
    selectedItems[this.state.currentActiveItems] = selectedItem;
    this.setState({ selectedItems, checkAll: isChecked });
    this.props.updateMainState({ selectedItems });
    this.handleMultipleGRChecked();
  };
  handleMultipleGRChecked = () => {
    if (this.state.allowMultipleGR == false) {
      let headerGr = [];
      this.state.selectedItems.forEach(r => {
        r.itemLists.forEach(rt => {
          console.log(rt);
          if (rt.checked == true) {
            if (headerGr.indexOf(rt.goodsReceivedLinearId) === -1) {
              headerGr.push(rt.goodsReceivedLinearId);
            }
          }
        });
      });
      console.log(headerGr);
      if (headerGr.length > 1) {
        console.log("isMultipleGRExceeded");
        this.setState({
          isMultipleGRExceeded: true,
          modalMultipleGRExceeded: true
        });
      } else {
        this.setState({
          isMultipleGRExceeded: false,
          modalMultipleGRExceeded: false
        });
        this.props.updateMainState({
          isMultipleGRExceeded: false,
          modalMultipleGRExceeded: false
        });
      }
    }
  };
  handleItemChecked = e => {
    const item = e.target;
    const isChecked = e.target.checked;
    let selectedItems = this.state.selectedItems;
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
            itemUnitPrice =
              row.purchaseItems && row.purchaseItems[0]
                ? row.purchaseItems[0].poItemUnitPrice
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
    let checkAll =
      selectedItems[this.state.currentActiveItems].itemLists.filter(row2 => {
        return !row2.checked;
      }).length == 0;

    this.setState({ selectedItems, checkAll: checkAll });
    this.props.updateMainState({ selectedItems });
    this.handleMultipleGRChecked();
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
  };
  numberOnly = e => {
    const keyCode = e.keyCode || e.which;
    if ((keyCode >= 48 && keyCode <= 57) || keyCode == 46) {
      if (keyCode == 46) {
        if (e.target.value.indexOf(".") !== -1) {
          e.preventDefault();
        }
      }
      e.target.value = e.target.value.replace(/,/g, "");
    } else {
      e.preventDefault();
    }
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
      row.purchaseItems[0].overDeliveryQuantity !== undefined &&
      row.purchaseItems[0].overDeliveryQuantity.remaining !== undefined
    ) {
      maxQty =
        maxQty +
        parseFloat(row.purchaseItems[0].overDeliveryQuantity.remaining);
    }
    this.setState({ maximumQtyTooltip: maxQty });
    ReactTooltip.show(findDOMNode(this.refs["qty-ref-" + itemRef]));
    //this.handleQtyValidation(e)
  };
  handleQtyChange = (e, row, index) => {
    if (e.target.value == "") {
      e.target.value = 0;
    }
    e.target.value = parseFloat(e.target.value.replace(/,/g, "")).toFixed(3);
    row.selectQty = parseFloat(e.target.value.replace(/,/g, ""));
    e.target.value = formatNumber(e.target.value.replace(/,/g, ""), 3);
    this.updateItemState(row);
    this.autoResizeInput(e);
    this.handleQtyValidation(e, row);
    this.handleCalculateQty(e, row);
  };
  updateItemState = row => {
    let selectedItems = this.state.selectedItems;
    selectedItems[this.state.currentActiveItems].itemLists.map(r => {
      if (r.linearId == row.linearId) {
        r = row;
      }
    });
    this.setState({
      selectedItems
    });
    this.props.updateMainState({ selectedItems });
    console.log(selectedItems);
  };

  handleCalculateQty = async (e, row) => {
    let selectedItems = this.state.selectedItems;
    let Qty = parseFloat(e.target.value.replace(/,/g, ""));
    let itemUnitPrice = 0;
    let itemUnitPriceCurrency = "";
    if (row.selectUnitPrice !== undefined) {
      itemUnitPrice = row.selectUnitPrice;
    } else if (row.unitPrice) {
      itemUnitPrice = row.unitPrice;
    } else {
      itemUnitPrice = row.purchaseItems[0]
        ? row.purchaseItems[0].poItemUnitPrice
        : 0;
    }
    if (row.unitPrice) {
      itemUnitPriceCurrency = row.currency;
    } else {
      itemUnitPriceCurrency = row.purchaseItems[0]
        ? row.purchaseItems[0].poItemUnitPriceCurrency
        : "-";
    }
    row.selectUnitPrice = itemUnitPrice;
    row.validateQtyPass = await this.handleQtyValidation(e, row);
    row.validateUnitPricePass = row.selectUnitPrice >= 0;
    selectedItems[this.state.currentActiveItems].itemLists.map(r => {
      if (r.linearId == row.linearId) {
        r.selectAmount = parseFloat(itemUnitPrice) * Qty;
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
      row.purchaseItems[0].overDeliveryQuantity !== undefined &&
      row.purchaseItems[0].overDeliveryQuantity.remaining !== undefined
    ) {
      maxQty =
        maxQty +
        parseFloat(row.purchaseItems[0].overDeliveryQuantity.remaining);
    }
    this.setState({ maximumQtyTooltip: maxQty });
    ReactTooltip.show(findDOMNode(this.refs["qty-ref-" + itemRef]));
    //this.handleQtyValidation(e)
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
        row.purchaseItems[0].overDeliveryQuantity !== undefined &&
        row.purchaseItems[0].overDeliveryQuantity.remaining !== undefined
      ) {
        maxQty =
          maxQty +
          parseFloat(row.purchaseItems[0].overDeliveryQuantity.remaining);
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

  handleUnitFocus = e => {
    e.target.value = e.target.value.replace(/,/g, "");
    if (e.target.value == 0) {
      e.target.value = "";
    }
    e.target.select();
  };
  handleUnitValidation = (e, row) => {
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
    let selectedItems = this.state.selectedItems;
    let Qty = parseFloat(row.selectQty || 0);
    let UnitPrice = parseFloat(e.target.value || 0);
    row.validateUnitPricePass = await this.handleUnitValidation(e, row);
    selectedItems[this.state.currentActiveItems].itemLists.map(r => {
      if (r.linearId == row.linearId) {
        r.selectAmount = parseFloat(UnitPrice) * Qty;
      }
    });
    this.updateItemState(row);
    return true;
  };
  handleUnitChange = (e, row, index) => {
    if (e.target.value == "") {
      e.target.value = 0;
    }
    e.target.value = parseFloat(e.target.value).toFixed(2);
    row.selectUnitPrice = parseFloat(e.target.value);
    e.target.value = formatNumber(e.target.value, 2);
    this.updateItemState(row);
    this.autoResizeInput(e);
    this.handleUnitValidation(e, row);
    this.handleCalculateUnit(e, row);
  };
  summaryAmount = () => {
    let summary = 0;
    this.state.selectedItems.filter(r => {
      return r.itemLists.filter(rt => {
        if (rt.checked == true) {
          summary += rt.selectAmount;
        }
        return rt.checked == true;
      });
    });
    return summary;
  };
  render() {
    let items = [];
    let gr = [];
    if (this.state.selectedItems[this.state.currentActiveItems]) {
      gr = this.state.selectedItems[this.state.currentActiveItems];
      items = gr.itemLists;
      console.log("currentActiveItems", this.state.currentActiveItems, items);
    }
    return (
      <Fragment>
        <ReactTooltip id="maximumQty" place="top" type="light" effect="float">
          <span>
            <b>Maximum: {this.state.maximumQtyTooltip}</b>
          </span>
        </ReactTooltip>
        <div className="box pt-0 pb-0 px-0">
          <a
            href="javascript:void(0);"
            aria-expanded="true"
            className="d-flex w-100 btnToggle itsNotButton"
          >
            <div className="col-12 px-0">
              <h3 className="border-bottom gray-1 px-3">Item Information</h3>
            </div>
          </a>
          <div className="d-flex flex-wrap min-height-500 pl-0 pr-0">
            <div id="po_items" className="col-2 border-right pb-3 pl-0">
              <ul>
                <div
                  style={{
                    marginTop: "15px",
                    position: "relative"
                  }}
                >
                  {this.state.selectedItems.map((row, i) => {
                    return (
                      <li
                        className={`font-bold ${
                          row.itemLists && row.itemLists.length == 0
                            ? "disabled_items"
                            : ""
                          } ${
                          this.state.currentActiveItems == i ? "active" : ""
                          }`}
                        onClick={() => {
                          this.setActiveItems(i);
                        }}
                      >
                        <a>
                          {row.purchaseOrderNumber}
                          <br />
                          {row.itemLists ? (
                            <span>
                              ( {row.itemLists.length}{" "}
                              {row.itemLists.length > 1 ? "items" : "item"} )
                              <span
                                className="btnRemove"
                                onClick={() => {
                                  this.deleteItem(row);
                                }}
                              >
                                <i className="fa fa-times" />
                              </span>
                            </span>
                          ) : (
                              <span>
                                <span className="item-prepairing">
                                  ({" "}
                                  <i
                                    className="fa fa-circle-o-notch fa-spin"
                                    aria-hidden="true"
                                  />{" "}
                                  Preparing... )
                              </span>
                              </span>
                            )}
                        </a>
                      </li>
                    );
                  })}
                </div>
                <div>
                  <div style={{ marginTop: "20px" }}>
                    <p id="morePOBtn" className="text-center">
                      <a
                        href="javascript:void(0);"
                        className="text-bold"
                        data-toggle="modal"
                        data-target="#addMorePO"
                      >
                        <i className="fa fa-plus small" /> Add PO
                      </a>
                    </p>
                  </div>
                </div>
              </ul>
            </div>
            <div id="po_lists" className="col-10 px-0">
              <div className="table_wrapper table-responsive">
                <table className="table dataTable">
                  <thead>
                    <tr>
                      <th className="font-bold text-center">
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
                        PO Item
                        <br />
                        No.
                      </th>
                      <th className="font-bold text-center">Ref No.1</th>
                      <th className="font-bold text-center">
                        Material Description
                      </th>
                      <th className="font-bold text-center">GR QTY</th>

                      <th className="font-bold text-center">Qty</th>
                      <th className="font-bold text-center">
                        Unit
                        <br />
                        Description
                      </th>
                      <th className="font-bold text-center">Unit Price</th>
                      <th className="font-bold text-center">Amount</th>
                      <th className="font-bold text-center">Currency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items &&
                      items.length > 0 &&
                      items.map((row, i) => {
                        console.log("row", row);
                        let defaultQty = 0.0;
                        let itemUnitPriceCurrency = "";
                        let itemUnitPrice = 0.0;
                        if (
                          this.state.settings.INVOICE_CONFIG
                            .autoPopulateInvoiceItemQuantity
                        ) {
                          defaultQty = row.quantity.remaining;
                        }
                        if (row.unitPrice) {
                          itemUnitPrice = row.unitPrice;
                          itemUnitPriceCurrency = row.currency;
                        } else {
                          itemUnitPrice = row.purchaseItems[0]
                            ? row.purchaseItems[0].poItemUnitPrice
                            : 0;
                          itemUnitPriceCurrency = row.purchaseItems[0]
                            ? row.purchaseItems[0].poItemUnitPriceCurrency
                            : "-";
                        }
                        if (row.purchaseItems[0].estimatedUnitPrice) {
                          row.estimatedUnitPrice =
                            row.purchaseItems[0].estimatedUnitPrice;
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
                              {row.purchaseItemExternalId
                                ? row.purchaseItemExternalId
                                : "-"}
                            </td>
                            <td className="text-center text-uppercase">
                              {row.referenceField1 || "-"}
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
                                data-for="maximumQty"
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
                                defaultValue={formatNumber(
                                  row.selectQty || defaultQty,
                                  3
                                )}
                                placeholder={formatNumber(
                                  row.selectQty || defaultQty,
                                  3
                                )}
                                disabled={!row.checked}
                                onKeyPress={this.numberOnly}
                                onInput={e => {
                                  this.autoResizeInput(e, row);
                                }}
                                onFocus={this.handleQtyFocus}
                                onBlur={e => {
                                  this.handleQtyChange(e, row, i);
                                }}
                              />
                            </td>
                            <td className="text-center text-uppercase">
                              {row.quantity.unit}
                            </td>
                            <td className="text-right">
                              {"estimatedUnitPrice" in row ? (
                                <input
                                  data-tip="custom show"
                                  data-event="focus"
                                  data-event-off="blur"
                                  data-for="maximumQty"
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
                                  disabled={!row.checked}
                                  onKeyPress={this.numberOnly}
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
                              {formatNumber(
                                parseFloat(row.selectAmount || 0),
                                2
                              )}
                            </td>
                            <td className="text-center">
                              {itemUnitPriceCurrency}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}
