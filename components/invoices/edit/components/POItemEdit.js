import React, { Component, Fragment } from "react";
import api from "~/libs/api";
import { findDOMNode } from "react-dom";
import { formatNumber, numberOnly, GrThead } from "../models/item";
import ReactTooltip from "react-tooltip";
import { asyncContainer, Typeahead } from "~/libs/react-bootstrap-typeahead";
const AsyncTypeahead = asyncContainer(Typeahead);
import { INVOICE_CREATE_MODEL, formatCurrency } from "../models/createmodel";
import handleError from "../../../../pages/handleError";
import ModalAlert, {
  BTN_ACTION_BACK,
  BTN_ACTION_CLOSE,
  BTN_ACTION_OK
} from "../../../modalAlert";
import autoDelay from "../../../../configs/delay.typeahead.json";
import { withTranslation } from "~/i18n";
class POItemEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activePO: "",
      currentActiveItems: 0,
      maximumQtyTooltip: 0,
      checkAll: false,
      rawData: [],
      selectedItems: [],
      populatedPO: [],
      resultSearch: { data: [] },
      settings: {},
      allowMultipleGR: true,
      isMultipleGRExceeded: false,
      modalMultipleGRExceeded: false,
      searching: false,
      searchConfig: {},
      addList: [],
      adding: false,
      finalData: [],
      delayTime: autoDelay["delay_time"],
      isAlertModalVisible: false,
      alertModalAlertTitle: "",
      buttonAlert: "",
      isTextOnly: true,
      alertModalMsg: ""
    };
    this.invApi = new api().group("invoice");
    this.poApi = new api().group("po");
    this.configApi = new api().group("config");
  }
  componentWillMount = async () => {
    ReactTooltip.rebuild();
    try {
      this.setState({
        rawData: this.props.data,
        settings: this.props.settings,
        searchConfig: {
          vendorTaxNumber: this.props.data.items[0].purchaseItem
            .vendorTaxNumber,
          businessPlaceTaxNumber: this.props.data.items[0].purchaseItem
            .businessPlaceTaxNumber,
          companyBranchCode: this.props.data.items[0].purchaseItem
            .companyBranchCode,
          paymentTermCode: this.props.data.items[0].purchaseItem.paymentTermCode
        }
      });
      if (this.props.selectedItems.length == 0) {
        let populatedPO = [];
        let index = [];
        await this.props.data.items.map(itm => {
          if (!index.includes(itm.purchaseItem.purchaseOrderLinearId)) {
            index.push(itm.purchaseItem.purchaseOrderLinearId);
          }
        });

        let res = await Promise.all(
          index.map(async item => {
            let response = await this.poApi.call("poitem", {
              purchaseOrderLinearId: item,
              bypass: true
            });
            response = response.data;
            await response.map((itm, i) => {
              response[i].validateQtyPass = false;
              response[i].validateUnitPricePass = false;
              response[i].selectQty = 0;
              // response[i].selectQty = itm.quantity.initial;
              response[i].selectUnitPrice = itm.poItemUnitPrice;
              //AUTOPOPULATE
              // response[i].selectAmount =
              //   itm.quantity.initial * itm.poItemUnitPrice;
              response[i].selectAmount = 0;
              this.state.rawData.items.map((t, k) => {
                if (itm.linearId === t.purchaseItemLinearId) {
                  response[i].isOldItem = true;
                  response[i].invoiceLinearId = t.linearId;
                  response[i].checked = true;
                  response[i].validateQtyPass = true;
                  response[i].validateUnitPricePass = true;
                  response[i].selectQty = t.quantity.initial;
                  response[i].selectUnitPrice = t.unitPrice;
                  response[i].selectAmount = t.itemSubTotal;
                }
              });
            });
            return response;

            // await this.addInvoiceItem(item2.data);
          })
        );
        await res.map(itm => {
          if (itm.length == 0) {
            console.warn("Invalid PO. item is not found.");
            return;
          }
          let obj = {
            itemLists: itm,
            purchaseOrderLinearId: itm[0].purchaseOrderLinearId,
            purchaseOrderNumber: itm[0].poNumber
          };
          populatedPO.push(obj);
        });
        this.setState({
          populatedPO
        });
        this.updateAmount();
        this.prepareDataForPreview();
      } else {
        this.setState({ populatedPO: this.props.selectedItems });
      }

      if (this.props.settings && this.props.settings.INVOICE_CONFIG) {
        if (
          this.props.settings.INVOICE_CONFIG
            .onlyAllowInvoiceCreationBySingleGR == true
        ) {
          this.setState({ allowMultipleGR: false });
        }
      }
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }
  };
  setActiveItems = index => {
    let checkAll = false;
    if (this.state.populatedPO.length > 0) {
      if (this.state.populatedPO[index] === undefined) {
        index--;
      }
      checkAll =
        this.state.populatedPO[index].itemLists.filter(row2 => {
          return !row2.checked;
        }).length == 0;
      this.setState({ currentActiveItems: index });
    }

    this.setState({ checkAll: checkAll });
  };
  addInvoiceItem = async item => {
    let { populatedPO } = this.state;

    await item.map(itm => {
      itm.checked = true;
      let obj = {
        itemLists: itm,
        purchaseOrderLinearId: itm.purchaseOrderLinearId,
        purchaseOrderNumber: itm.poNumber
      };
      populatedPO.push(obj);
    });

    this.setState({ populatedPO });
    // if (typeof this.props.updateMainState == "function") {
    //   this.props.updateMainState({ selectedItems: populatedPO });
    // }
  };
  addItem = async po => {
    try {
      let { addList } = this.state;
      let obj = {};
      this.handleAddingState();
      let res = await this.poApi.call("poitem", {
        purchaseOrderLinearId: po.linearId,
        bypass: true
      });

      res = res.data;

      if (res.length == 0) {
        obj = {
          itemLists: [],
          purchaseOrderNumber: po.purchaseOrderNumber
        };
      } else {
        await res.map((item, i) => {
          res[i].validateQtyPass = false;
          res[i].validateUnitPricePass = false;
          res[i].selectQty = 0;
          // res[i].selectQty = itm.quantity.initial;
          res[i].selectUnitPrice = item.poItemUnitPrice;
          //AUTOPOPULATE
          // res[i].selectAmount =
          //   itm.quantity.initial * itm.poItemUnitPrice;
          res[i].selectAmount = 0;
        });

        obj = {
          itemLists: res,
          purchaseOrderLinearId: res[0].purchaseOrderLinearId,
          purchaseOrderNumber: res[0].poNumber
        };
      }

      addList.push(obj);
      await this.setState({
        addList
      });
      await this.filterDuplicateItem();
      this.handleAddingState();
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
    }
  };
  handleCheckAll = e => {
    const item = e.target.name;
    const isChecked = e.target.checked;
    let selectedItem = this.state.populatedPO[this.state.currentActiveItems]
      .itemLists;
    selectedItem.map(row => {
      row.checked = isChecked;
      let itemUnitPrice = 0;
      if (row.selectUnitPrice !== undefined) {
        itemUnitPrice = row.selectUnitPrice;
      } else if (row.unitPrice) {
        itemUnitPrice = row.unitPrice;
      } else {
        itemUnitPrice = row ? row.poItemUnitPrice : 0;
      }
      if (itemUnitPrice >= 0) {
        row.validateUnitPricePass = true;
      }
      if (row.selectQty == undefined) {
        row.selectQty = 0;
      }
    });
    let populatedPO = this.state.populatedPO;
    populatedPO.map((r, i) => {
      if (i == this.state.currentActiveItems) {
        r.itemLists = selectedItem;
      }
    });
    this.setState({ populatedPO, checkAll: isChecked });
    this.updateAmount();
    this.prepareDataForPreview();
  };
  handleItemChecked = async e => {
    const item = e.target;
    const isChecked = e.target.checked;
    let populatedPO = this.state.populatedPO;
    populatedPO.map(row => {
      row.itemLists.map(row2 => {
        if (row2.linearId == item.value) {
          row2.checked = isChecked;
          let itemUnitPrice = 0;
          if (row.selectUnitPrice !== undefined) {
            itemUnitPrice = row.selectUnitPrice;
          } else if (row.unitPrice) {
            itemUnitPrice = row.unitPrice;
          } else {
            itemUnitPrice = row ? row.poItemUnitPrice : 0;
          }
          if (itemUnitPrice >= 0) {
            row2.validateUnitPricePass = true;
          }
          if (row2.selectQty == undefined) {
            row2.selectQty = 0;
          }
        }
      });
    });
    let checkAll =
      populatedPO[this.state.currentActiveItems].itemLists.filter(row2 => {
        return !row2.checked;
      }).length == 0;

    await this.setState({ populatedPO, checkAll: checkAll });
    this.updateAmount();
    this.prepareDataForPreview();
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
    console.log(event);
    console.log("selectionStart", event.currentTarget.selectionStart);
    console.log("selectionEnd", event.currentTarget.selectionEnd);
    console.log("target", event.target);
    console.log("event.which", event.which);
    console.log("digit.length - decimal.length", typablePosition);
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
  //Qty - Start
  handleQtyFocus = e => {
    e.target.value = e.target.value.replace(/,/g, "");
    if (e.target.value == 0) {
      e.target.value = "";
    }
    e.target.select();
    let arr = e.target.id.split("qty-select-");
    let itemRef = arr[1];
    let row = JSON.parse(e.target.getAttribute("data-row"));
    let maximumQtyTooltip =
      parseFloat(row.quantity.remaining.toFixed(3)) +
      parseFloat(row.selectQty.toFixed(3)) +
      parseFloat(row.overDeliveryQuantity.remaining.toFixed(3));
    this.setState({
      maximumQtyTooltip: parseFloat(maximumQtyTooltip.toFixed(3))
    });
    ReactTooltip.show(findDOMNode(this.refs["qty-ref-" + itemRef]));
  };
  handleQtyChange = (e, row, index) => {
    if (e.target.value == "" || Number.isNaN(parseFloat(e.target.value))) {
      e.target.value = formatNumber(0, 3);
      row.selectQty = formatNumber(0, 3);
    } else {
      e.target.value = parseFloat(e.target.value.replace(/,/g, "")).toFixed(3);
      row.selectQty = parseFloat(e.target.value.replace(/,/g, ""));
      e.target.value = formatNumber(e.target.value.replace(/,/g, ""), 3);
    }

    ReactTooltip.hide();
    this.updateItemState(row);
    this.autoResizeInput(e);
    this.handleQtyValidation(e, row);
    this.handleCalculateQty(e, row);
  };
  handleCalculateQty = async (e, row) => {
    let arr = e.target.id.split("qty-select-");
    let itemRef = arr[1];
    let populatedPO = this.state.populatedPO;
    let Qty = parseFloat(e.target.value.replace(/,/g, ""));
    // let itemUnitPrice = row.unitPrice;
    // row.selectUnitPrice = itemUnitPrice;
    row.validateQtyPass = await this.handleQtyValidation(e, row);
    row.validateUnitPricePass = row.selectUnitPrice >= 0;
    populatedPO[this.state.currentActiveItems].itemLists.map(r => {
      if (r.linearId == row.linearId) {
        r.selectAmount = parseFloat(row.selectUnitPrice) * Qty;
      }
    });

    if (itemRef) {
      findDOMNode(this.refs["price-ref-" + itemRef]).value = formatNumber(
        row.selectAmount,
        2
      );
    }
    this.updateItemState(row);
    return true;
  };
  handleQtyValidation = (e, row) => {
    let val = parseFloat(e.target.value.replace(/,/g, ""));
    let colorDefault = "#626262";
    let maxQty = 0;
    let res = false;
    if (row) {
      maxQty = this.state.maximumQtyTooltip;
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
  //UnitPrice - Start
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
    let arr = e.target.id.split("unit-select-");
    let itemRef = arr[1];
    let populatedPO = this.state.populatedPO;
    let Qty = parseFloat(row.selectQty || 0);
    let UnitPrice = parseFloat(e.target.value.replace(/,/g, "") || 0);
    row.validateUnitPricePass = await this.handleUnitValidation(e, row);
    populatedPO[this.state.currentActiveItems].itemLists.map(r => {
      if (r.linearId == row.linearId) {
        r.selectUnitPrice = UnitPrice;
        r.selectAmount = parseFloat(UnitPrice) * Qty;
      }
    });
    this.setState({ populatedPO });
    this.props.updateMainState({ selectedItems: populatedPO });
    this.updateItemState(row);

    if (itemRef) {
      findDOMNode(this.refs["price-ref-" + itemRef]).value = formatNumber(
        row.selectAmount,
        2
      );
    }

    return true;
  };
  handleUnitChange = (e, row, index) => {
    ReactTooltip.hide();
    if (e.target.value == "" || Number.isNaN(parseFloat(e.target.value))) {
      e.target.value = formatNumber(0, 2);
      row.selectUnitPrice = formatNumber(0, 2);
      row.poItemUnitPrice = row.selectUnitPrice;
    } else {
      e.target.value = parseFloat(e.target.value.replace(/,/g, "")).toFixed(2);
      row.selectUnitPrice = parseFloat(e.target.value.replace(/,/g, ""));
      row.poItemUnitPrice = row.selectUnitPrice;
      e.target.value = formatNumber(e.target.value.replace(/,/g, ""), 2);
    }
    this.updateItemState(row);
    this.autoResizeInput2(e);
    this.handleUnitValidation(e, row);
    this.handleCalculateUnit(e, row);
  };
  autoResizeInput2 = (e, row) => {
    let newW = this.textWidth(e.target.value);
    if (newW > 80) {
      $(e.target).width(newW);
    } else {
      $(e.target).width(80);
    }
  };
  //UnitPrice -  End

  //Amount - Start
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
  handleAmountChange = async (e, row) => {
    if (e.target.value == "" || Number.isNaN(parseFloat(e.target.value))) {
      e.target.value = formatNumber(0, 2);
      row.selectAmount = formatNumber(0, 2);
    } else {
      e.target.value = parseFloat(e.target.value.replace(/,/g, "")).toFixed(2);
      row.selectAmount = parseFloat(e.target.value.replace(/,/g, ""));
      e.target.value = formatNumber(e.target.value.replace(/,/g, ""), 2);
    }

    this.updateItemState(row);
  };
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
  //Amount - End

  updateItemState = row => {
    let populatedPO = this.state.populatedPO;
    populatedPO[this.state.currentActiveItems].itemLists.map(r => {
      if (r.linearId == row.linearId) {
        r = row;
      }
    });
    this.setState({
      populatedPO
    });
    if (typeof this.props.updateMainState == "function") {
      this.props.updateMainState({ selectedItems: populatedPO });
      // this.validateAll();
    }
    if (!this.props.flag) {
      this.updateAmount();
    }
  };
  deleteItem = async index => {
    let { populatedPO, currentActiveItems } = this.state;
    populatedPO.splice(index, 1);
    if (currentActiveItems == index) {
      currentActiveItems = currentActiveItems--;
    }
    this.setState({
      populatedPO,
      currentActiveItems
    });
    this.prepareDataForPreview();
    if (!this.props.flag) {
      this.updateAmount();
    }
  };
  filterDuplicate = (item, index) => {
    if (this.state.populatedPO.length == 0) {
      return true;
    }
    let filteredArray = this.state.populatedPO.filter(
      row => row.purchaseOrderLinearId === item.linearId
    );
    if (this.state.addList.length > 0) {
      filteredArray = this.state.addList.filter(
        row => row.purchaseOrderLinearId === item.linearId
      );
    }
    return filteredArray.length == 0;
  };
  filterDuplicateItem = async () => {
    let res = this.state.resultSearch.data.filter(this.filterDuplicate);
    this.setState({ resultSearch: { ...this.state.resultSearch, data: res } });
  };
  handlePoAutoCompleteChange(selectedPO) {
    if (selectedPO !== undefined) {
      this.search_po_no.value = selectedPO.purchaseOrderNumber;
    }
  }
  btnClearClick = async () => {
    try {
      this.setState({ clearing: true });
      this.search_po_no.getInstance().clear();
      this.search_po_no.value = "";
      // this.search_inv_no.value = "";
      // this.search_ref1.value = "";

      this.setState({
        resultSearch: INVOICE_CREATE_MODEL.SEARCH_RESULT_STRUCTURE
      });
      this.setState({ clearing: false });
    } catch (err) {
      this.setState({ clearing: false });
    }
  };
  btnSearchClick = async () => {
    try {
      this.setState({ searching: true });
      this.setState({
        resultSearch: INVOICE_CREATE_MODEL.SEARCH_RESULT_STRUCTURE
      });
      let purchaseOrderNumber = this.search_po_no.value;
      // let grInvoiceNumber = this.search_inv_no.value;
      // let grReferenceField1 = this.search_ref1.value;
      let opts = {};
      if (purchaseOrderNumber != "")
        opts.purchaseOrderNumber = purchaseOrderNumber;
      // if (grInvoiceNumber != "") opts.grInvoiceNumber = grInvoiceNumber;
      // if (grReferenceField1 != "") opts.grReferenceField1 = grReferenceField1;

      await this.reloadTable(opts);
      this.setState({ searching: false });
    } catch (err) {
      this.setState({ searching: false });
    }
  };
  reloadTable = async (params = {}) => {
    try {
      params = {
        ...this.state.searchConfig,
        ...params,
        bypass: true,
        length: 100,
        start: 0,
        statuses: "Confirmed"
      };
      let resultSearch = await this.poApi.call("list", params);
      resultSearch.data = resultSearch.data.filter(this.filterDuplicate);
      await this.setState({ resultSearch });
      this.filterDuplicateItem();
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response,
        resultSearch: INVOICE_CREATE_MODEL.SEARCH_RESULT_STRUCTURE
      });
    }
  };
  selectAddlist = async () => {
    let { populatedPO } = this.state;
    populatedPO = await populatedPO.concat(this.state.addList);
    this.clearAddList();
    this.setState({
      populatedPO
    });
    this.prepareDataForPreview();
  };
  deleteAddItem = index => {
    let { addList } = this.state;
    addList.splice(index, 1);
    this.setState({
      addList
    });
  };
  clearAddList = () => {
    this.setState({
      addList: []
    });
  };
  handleAddingState = () => {
    this.setState({
      adding: !this.state.adding
    });
  };
  updateAmount = () => {
    let populatedPO = this.state.populatedPO;
    let subTotal = 0;
    let vatTotal = 0;
    let invoiceTotal = 0;
    populatedPO.forEach(r => {
      r.itemLists.forEach(rr => {
        if (rr.checked) {
          let selectAmount = parseFloat(parseFloat(rr.selectAmount).toFixed(2));
          let vatRate = parseFloat(rr.taxRate);
          subTotal = subTotal + selectAmount;
          vatTotal =
            vatTotal +
            parseFloat(
              (
                parseFloat(selectAmount.toFixed(2)) *
                parseFloat((vatRate / 100).toFixed(2))
              ).toFixed(2)
            );
        }
      });
    });
    invoiceTotal = parseFloat(parseFloat(subTotal + vatTotal).toFixed(2));
    this.props.updateMainState({
      rawData: {
        ...this.state.rawData,
        subTotal,
        vatTotal,
        invoiceTotal
      }
    });
  };
  prepareDataForPreview = async () => {
    // let finalData = [];
    // if (this.state.populatedPO.length > 0) {
    //   await this.state.populatedPO.map(item => {
    //     finalData = finalData.concat(item);
    //   });
    //   finalData = await finalData.filter(item => {
    //     return item.checked === true;
    //   });
    //   await this.setState({
    //     finalData
    //   });
    if (typeof this.props.updateMainState == "function") {
      this.props.updateMainState({ selectedItems: this.state.populatedPO });
      // this.validateAll();
    }
    // }
  };

  componentWillUnmount() {
    this.state = {};
  }
  handleDismissBtnModal = () => {
    this.setState({ isAlertModalVisible: false });
  };

  render() {
    const { t } = this.props;
    const {
      populatedPO,
      currentActiveItems,
      checkAll,
      isLoading,
      searching,
      searchConfig,
      maximumQtyTooltip,
      clearing,
      resultSearch,
      addList,
      adding,
      isAlertModalVisible,
      alertModalAlertTitle,
      alertModalMsg,
      isTextOnly,
      buttonAlert
    } = this.state;
    return (
      <Fragment>
        <ReactTooltip id="maximumQty" place="top" type="light" effect="float">
          <span>
            <b>Maximum: {maximumQtyTooltip}</b>
          </span>
        </ReactTooltip>
        <div className="box pt-0 pb-0 px-0">
          <a
            href="javascript:void(0);"
            aria-expanded="true"
            className="d-flex w-100 btnToggle itsNotButton"
          >
            <div className="col-12 px-0">
              <h3 className="border-bottom gray-1 px-3">
                {t("Items Information")}
              </h3>
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
                  {populatedPO.length > 0
                    ? populatedPO.map((r, i) => {
                        return (
                          <li
                            className={`font-bold ${
                              r.itemLists && r.itemLists.length == 0
                                ? "disabled_items"
                                : ""
                            } ${currentActiveItems == i ? "active" : ""}`}
                            onClick={() => {
                              this.setActiveItems(i);
                            }}
                          >
                            <a>
                              {r.purchaseOrderNumber}
                              <br />
                              {r.itemLists ? (
                                <span>
                                  ( {r.itemLists.length}{" "}
                                  {r.itemLists.length > 1
                                    ? t("items")
                                    : t("item")}
                                  )
                                  <span
                                    className="btnRemove"
                                    onClick={() => {
                                      this.deleteItem(i);
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
                      })
                    : ""}
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
                        <i className="fa fa-plus small" /> {t("Add PO")}
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
                            checked={checkAll}
                            onChange={this.handleCheckAll}
                          />
                        </div>
                      </th>
                      <th className="font-bold text-center">
                        {t("PO Item No1")}
                        <br />
                        {t("PO Item No2")}
                      </th>
                      <th className="font-bold text-center">
                        {t("Material Description")}
                      </th>
                      <th className="font-bold text-center">
                        {t("Remaining QTY")}
                      </th>

                      <th className="font-bold text-center">{t("Qty")}</th>
                      <th className="font-bold text-center">
                        {t("Unit Description1")}
                        <br />
                        {t("Unit Description2")}
                      </th>
                      <th className="font-bold text-center">
                        {t("Unit Price")}
                      </th>
                      <th className="font-bold text-center">{t("Amount")}</th>
                      <th className="font-bold text-center">{t("Currency")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {populatedPO.length > 0 &&
                      populatedPO[currentActiveItems] !== undefined &&
                      populatedPO[currentActiveItems].itemLists &&
                      populatedPO[currentActiveItems].itemLists.map(
                        (row, i) => {
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
                                {row.poItemNo ? row.poItemNo : "-"}
                              </td>
                              <td
                                className="text-left"
                                style={{ minWidth: 200 }}
                              >
                                {row.materialDescription}
                              </td>
                              <td className="text-right">
                                {formatNumber(row.quantity.remaining, 3)}
                              </td>
                              <td className="text-right">
                                <input
                                  className="form-control input-search"
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
                                    (row.selectQty || 0) <= 0.0 &&
                                    row.checked == true
                                      ? { color: "red" }
                                      : { color: "#626262" }
                                  }
                                  defaultValue={formatNumber(
                                    row.selectQty || 0,
                                    3
                                  )}
                                  placeholder={formatNumber(
                                    row.selectQty || 0,
                                    3
                                  )}
                                  disabled={!row.checked}
                                  onKeyPress={e => this.numberOnly(e, 13)}
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
                                {row.estimatedUnitPrice == "X" ? (
                                  <input
                                    className="form-control input-search"
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
                                      row.selectUnitPrice <= 0.0 &&
                                      row.checked == true
                                        ? { color: "red" }
                                        : { color: "#626262" }
                                    }
                                    defaultValue={formatNumber(
                                      row.selectUnitPrice,
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
                                    parseFloat(row.selectUnitPrice),
                                    2
                                  )
                                )}
                              </td>
                              <td className="text-right">
                                <input
                                  className="form-control"
                                  data-tip="custom show"
                                  data-event="focus"
                                  data-event-off="blur"
                                  data-for="priceSelect"
                                  key={`price-select-${row.linearId}`}
                                  id={`price-select-${row.linearId}`}
                                  ref={`price-ref-${row.linearId}`}
                                  data-row={JSON.stringify(row)}
                                  type="text"
                                  name="price[]"
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
                              <td className="text-center">
                                {row.poItemUnitPriceCurrency}
                              </td>
                            </tr>
                          );
                        }
                      )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div
          id="addMorePO"
          className="modal hide fade"
          tabindex="-1"
          role="dialog"
          aria-labeledby="addMorePO"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h3 id="myModalLabel" className="mb-0">
                  Add PO
                </h3>
              </div>
              <div className="modal-body d-flex flex-wrap bg-white align-items-start">
                {/* Search Box - Start */}
                <div
                  id="searchMorePO"
                  className="form col-12 px-0 d-flex flex-wrap align-items-center"
                >
                  <div className="form-group col-3 px-0 mb-0">
                    <div className="form-label-group">
                      <AsyncTypeahead
                        inputProps={{
                          id: `poNumber`,
                          name: `poNumber`,
                          className: `input-search`,
                          title: `Purchase Order No.`
                        }}
                        placeholder="Purchase Order No."
                        ref={Typeahead => (this.search_po_no = Typeahead)}
                        defaultInputValue=""
                        isLoading={isLoading}
                        labelKey="purchaseOrderNumber"
                        minLength={3}
                        delay={this.state.delayTime}
                        useCache={false}
                        onChange={selected =>
                          this.handlePoAutoCompleteChange(selected[0])
                        }
                        onInputChange={(text, event) => {
                          this.search_po_no.value = text;
                        }}
                        onSearch={query => {
                          if (query.trim() != "") {
                            this.search_po_no.value = query;
                            this.setState({ isLoading: true });
                            let params = {
                              ...searchConfig,
                              purchaseOrderNumber: query,
                              bypass: true,
                              length: 100,
                              start: 0,
                              statuses: "Confirmed"
                            };
                            let fetchURL = this.poApi.url("list", params);
                            try {
                              fetch(fetchURL)
                                .then(resp => resp.json())
                                .then(json => {
                                  json.data = json.data.filter(
                                    this.filterDuplicate
                                  );
                                  this.setState({
                                    isLoading: false,
                                    options: json.data
                                  });
                                });
                            } catch (error) {
                              console.log(error);
                            }
                          }
                        }}
                        options={this.state.options}
                      />
                    </div>
                  </div>
                  <span className="">
                    <button
                      className="btn btn--transparent btn-search-reset font-bold"
                      type="button"
                      disabled={searching || clearing}
                      dangerouslySetInnerHTML={{
                        __html: clearing
                          ? INVOICE_CREATE_MODEL.BTN_CLEAR.loading
                          : INVOICE_CREATE_MODEL.BTN_CLEAR.text
                      }}
                      ref={el => (this.btnClearSearch = el)}
                      onClick={() => {
                        this.btnClearClick();
                      }}
                    />
                  </span>
                  <span className="">
                    <button
                      className="btn btn-search ml-2"
                      disabled={searching || clearing}
                      dangerouslySetInnerHTML={{
                        __html: searching
                          ? INVOICE_CREATE_MODEL.BTN_SEARCH.loading
                          : INVOICE_CREATE_MODEL.BTN_SEARCH.text
                      }}
                      ref={el => (this.btnSearch = el)}
                      type="button"
                      onClick={() => {
                        this.btnSearchClick();
                      }}
                    />
                  </span>
                </div>
                {/* Search Box - End */}

                {/* DataTable - Start */}
                <div className="table-responsive col-12 px-0 mt-3">
                  <table className="table dataTable">
                    <thead>
                      <tr>
                        <th>&nbsp;</th>
                        {INVOICE_CREATE_MODEL.MODEL_PO_COLUMN.map(col => {
                          return (
                            <th className="font-bold text-center">
                              {t(col.header)}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {resultSearch.data.length == 0 ? (
                        <tr>
                          <td
                            className="text-center"
                            colSpan={
                              INVOICE_CREATE_MODEL.MODEL_PO_COLUMN.length + 1
                            }
                          >
                            {searching ? (
                              <span>
                                <i
                                  className="fa fa-circle-o-notch fa-spin"
                                  aria-hidden="true"
                                />{" "}
                                Searching...
                              </span>
                            ) : (
                              "No search result."
                            )}
                          </td>
                        </tr>
                      ) : (
                        ""
                      )}
                      {resultSearch.data.map(row => {
                        return (
                          <tr>
                            <td className="text-center">
                              {adding ? (
                                <i
                                  class="fa fa-circle-o-notch fa-spin"
                                  aria-hidden="true"
                                />
                              ) : (
                                <a
                                  href="javascript:void(0);"
                                  onClick={() => {
                                    this.addItem(row);
                                  }}
                                >
                                  <i className="icon-add border border-purple border-1px border-rounded" />
                                </a>
                              )}
                            </td>
                            {INVOICE_CREATE_MODEL.MODEL_PO_COLUMN.map(col => {
                              if (typeof col.render == "function") {
                                let res = col.render(row[col.field], row, col);
                                return (
                                  <td
                                    className={`${col.className ||
                                      "text-left"}`}
                                  >
                                    <span
                                      className={`${col.optClassName || ""}`}
                                    >
                                      {res}
                                    </span>
                                  </td>
                                );
                              } else {
                                return (
                                  <td
                                    className={`${col.className ||
                                      "text-left"}`}
                                  >
                                    <span
                                      className={`${col.optClassName || ""}`}
                                    >
                                      {row[col.field]}
                                    </span>
                                  </td>
                                );
                              }
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* DataTable - End */}

                {/* Selected PO Lists - Start */}
                <div className="col-12 px-0 pt-3 d-flex flex-wrap align-items-start">
                  <div className="col-2 align-self-center">
                    <p className="font-bold">Selected PO : </p>
                  </div>
                  <div className="col-10 px-0 bootstrap-tagsinput">
                    {populatedPO.map((r, i) => {
                      return (
                        <span className="tag label label-badge font-bold">
                          {r.purchaseOrderNumber}
                          {/* <span
                            data-role="remove"
                            onClick={() => {
                              this.deleteItem(r);
                            }}
                          /> */}
                        </span>
                      );
                    })}
                    {addList.map((r, i) => {
                      return (
                        <span className="tag label label-info font-bold">
                          {r.purchaseOrderNumber}
                          <span
                            data-role="remove"
                            onClick={() => {
                              this.deleteAddItem(i);
                            }}
                          />
                        </span>
                      );
                    })}
                  </div>
                </div>
                {/* Selected PO Lists - End */}
              </div>
              <div className="modal-footer justify-content-center">
                <button
                  type="button"
                  name="btnCloseModal"
                  id="btnCloseModal"
                  className="btn btn--transparent btn-wide"
                  data-dismiss="modal"
                  aria-hidden="true"
                  onClick={() => {
                    this.clearAddList();
                  }}
                >
                  {t("Cancel")}
                </button>
                <button
                  type="button"
                  name="btnSelectMorePO"
                  id="btnSelectMorePO"
                  className="btn btn-wide"
                  data-dismiss="modal"
                  aria-hidden="true"
                  disabled={addList.length == 0 && populatedPO.length == 0}
                  onClick={() => {
                    this.selectAddlist();
                  }}
                >
                  {t("Select")}
                </button>
              </div>
            </div>
          </div>
        </div>
        <ModalAlert
          title={alertModalAlertTitle}
          visible={isAlertModalVisible}
          button={buttonAlert}
          isTextOnly={isTextOnly}
        >
          {alertModalMsg}
        </ModalAlert>
      </Fragment>
      // <div />
    );
  }
}
export default withTranslation(["invoice-edit"])(POItemEdit);
