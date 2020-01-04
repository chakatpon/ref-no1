import React, { Component } from "react";
import { findDOMNode } from "react-dom";
import _ from "lodash";
import ApiService from "../../libs/ApiService";
import Autosuggest from "react-autosuggest";
import { throws } from "assert";
import BlockUi from "react-block-ui";
import Router from "next/router";
import DataTable from "datatables.net-bs4";
import {
  asyncContainer,
  Typeahead
} from "../../libs/react-bootstrap-typeahead";
import ReactTooltip from "react-tooltip";
import ModalAlert from "../modalAlert";

const AsyncTypeahead = asyncContainer(Typeahead);
const poSearchApiUrl =
  "/api/purchaseorders?bypass=true&statuses=Confirmed&purchaseOrderNumber=";

const Api = new ApiService();

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

class createInvoiceByPoStepTwo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mainPO: "",
      isReadyToNext: false,
      selectedPOItems: [],
      populatedPO: [],
      activePO: 0,
      AllPO: [],
      inputPONumber: "",
      isAddPOInputTriggered: false,
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
      isPurchaseOrderSelected: false,
      isQtyExceeded: false,
      selectedPOItems: {},
      blocking: false,
      isMainPOSelected: false,
      maximumQtyTooltip: "-",
      maximumQty: 0,
      alertModalAlertTitle: "",
      isAlertModalVisible: false,
      buttonAlert: [],
      isTextOnly: false,
      alertModalMsg: []
    };
  }

  routeBack() {
    Router.push("/invoice-detail?linearId=" + this.state.linearId);
  }

  toggleBlocking() {
    this.setState({ blocking: !this.state.blocking });
  }

  async componentDidMount() {
    if (this.props.mainState.stepOneProp === undefined) {
      this.renderPOItemTable([]);
    } else if (
      this.props.mainState.stepOneProp &&
      this.props.mainState.stepOneProp.selectedPO &&
      this.props.mainState.stepTwoProp === undefined &&
      this.props.mainState.stepThreeProp === undefined
    ) {
      await this.renderPOItemTable([]);
      await this.handlePOAutoCompleteChange(
        this.props.mainState.stepOneProp.selectedPO
      );
      const AllPO = [this.props.mainState.stepOneProp.selectedPO];
      this.setState({ AllPO: AllPO });
    } else {
      this.setState(
        {
          selectedPOItems: this.props.mainState.stepTwoProp.selectedPOItems,
          populatedPO: this.props.mainState.stepTwoProp.populatedPO,
          activePO: this.props.mainState.stepTwoProp.activePO,
          AllPO: this.props.mainState.stepTwoProp.AllPO,
          inputPONumber: this.props.mainState.stepTwoProp.inputPONumber,
          activePOItems: this.props.mainState.stepTwoProp.activePOItems,
          poSuggestions: this.props.mainState.stepTwoProp.poSuggestions,
          //Element
          poItemDataTable: this.props.mainState.stepTwoProp.poItemDataTable,
          //NewPOModal
          po_code: this.props.mainState.stepTwoProp.po_code,
          po_name: this.props.mainState.stepTwoProp.po_name,
          po_taxId: this.props.mainState.stepTwoProp.po_taxId,
          po_tel: this.props.mainState.stepTwoProp.po_tel,
          po_branch: this.props.mainState.stepTwoProp.po_branch,
          po_address: this.props.mainState.stepTwoProp.po_address
        },
        () => {
          this.renderPOItemTable(this.state.activePOItems, this.state.activePO);
          this.validateQtyInput();
          this.resolveAllowToNext();
        }
      );
    }
    this.resolveAllowToNext();
    this.checkIsPurchaseOrderSelected();
  }

  resolveAllowToNext() {
    if (!this.state.isQtyExceeded && this.state.isPurchaseOrderSelected) {
      this.setState({
        isReadyToNext: true
      });
    } else {
      this.setState({
        isReadyToNext: false
      });
    }
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
      activePOItems: itemList,
      blocking: false
    });

    this.updatePOItemsNumber(poNumber, itemList.length);

    let selectedPOItems = this.state.selectedPOItems;
    let selectedPOItemsKeys = Object.keys(selectedPOItems);
    let rowSelected = [];

    if (selectedPOItemsKeys.includes(poNumber)) {
      rowSelected = selectedPOItems[poNumber].rowSelected;
    } else {
      selectedPOItems[this.state.activePO] = {
        rowSelected: [],
        item: []
      };
      this.setState({
        selectedPOItems: selectedPOItems
      });
    }

    let pointer = 0;
    let data = [];
    itemList.forEach(item => {
      if (this.props.mainState.stepOneProp.autoPopulate === true) {
        item.quantity.initial = item.quantity.remaining;
      } else {
        item.quantity.initial = 0;
      }

      let qty = 0;
      let unitPrice = item.poItemUnitPrice;
      if (poNumber in selectedPOItems) {
        if (rowSelected.length != 0) {
          if (rowSelected.includes(item.poItemNo)) {
            qty = selectedPOItems[poNumber].item[pointer].quantity.initial;
            unitPrice = selectedPOItems[poNumber].item[pointer].poItemUnitPrice;
            pointer++;
          } else {
            qty = item.quantity.initial;
          }
        } else {
          qty = item.quantity.initial;
        }
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
        poItemQtyRemaining: this.formatQtyNumber(item.quantity.remaining, true),
        poItemQtyInitial:
          '<input disabled type="text" ref="qty-ref-' +
          item.poItemNo +
          '" data-tip="custom show" data-event="focus" data-event-off="blur" data-for="maximumQty" id="qty-select-' +
          item.poItemNo +
          '" value="' +
          this.formatQtyNumber(qty) +
          '" class="form-control text-right"></input>',
        unitDescription: item.quantity.unit,
        poItemUnitPrice:
          "estimatedUnitPrice" in item
            ? '<input disabled type="text" id="unit-select-' +
              item.poItemNo +
              '" value="' +
              this.formatPriceNumber(unitPrice) +
              '" class="form-control text-right"></input>'
            : this.formatPriceNumber(unitPrice),
        amount:
          '<div id="amount-' +
          item.poItemNo +
          '">' +
          this.formatPriceNumber(qty * unitPrice) +
          "</div>",
        poItemUnitPriceCurrency: item.poItemUnitPriceCurrency
      });
    });

    this.state.poItemDataTable.clear();
    this.state.poItemDataTable.rows.add(data);
    this.state.poItemDataTable.draw();

    $("[id^='select-']")
      .parents("tr")
      .prop("className", "odd");

    rowSelected.forEach(row => {
      $("[id^='select-" + row + "']")
        .parents("tr")
        .prop("className", "odd active");

      $("[id^='select-" + row + "']").prop("checked", "checked");
      $("#qty-select-" + row).prop("disabled", false);
      $("#unit-select-" + row).prop("disabled", false);
    });

    await this.shouldPOItemsSelectAll();
    await this.validateQtyInput();
  }

  async renderPOItemTable(poItems, poNumber) {
    var data = [];
    let selectedPOItems = this.state.selectedPOItems;
    let pointer = 0;
    poItems.forEach((item, index) => {
      let qty = 0;
      let unitPrice = item.poItemUnitPrice;
      if (poNumber in selectedPOItems) {
        if (selectedPOItems[poNumber].rowSelected.length != 0) {
          if (selectedPOItems[poNumber].rowSelected.includes(item.poItemNo)) {
            qty = selectedPOItems[poNumber].item[pointer].quantity.initial;
            unitPrice = selectedPOItems[poNumber].item[pointer].poItemUnitPrice;
            pointer++;
          } else {
            qty = 0;
          }
        }
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
        poItemQtyRemaining: this.formatQtyNumber(item.quantity.remaining, true),
        poItemQtyInitial:
          '<input disabled type="text" ref="qty-ref-' +
          item.poItemNo +
          '" data-tip="custom show" data-event="focus" data-event-off="blur" data-for="maximumQty" id="qty-select-' +
          item.poItemNo +
          '" value="' +
          this.formatQtyNumber(qty) +
          '" class="form-control"></input>',
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
          this.formatPriceNumber(qty * unitPrice) +
          "</div>",
        poItemUnitPriceCurrency: item.poItemUnitPriceCurrency
      });
    });
    var _this = this;

    var dts = $(_this.el)
      .DataTable({
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
            sortable: false
          },
          {
            targets: [1],
            width: "120px",
            sortable: false
          },
          {
            targets: [2],
            width: "300px",
            sortable: false
          },
          {
            targets: [3],
            width: "150px",
            sortable: false
          },
          {
            targets: [4],
            width: "100px",
            sortable: false
          },
          {
            targets: [5],
            width: "150px",
            sortable: false
          },
          {
            targets: [6],
            width: "120px",
            sortable: false
          },
          {
            targets: [7, 8],
            width: "100px",
            sortable: false
          }
        ],
        stateSave: false,
        paging: false,
        bLengthChange: false,
        searching: false,
        info: false,
        ordering: false
      })
      .on("error", function(e, settings, techNote, message) {
        console.log("An error has been reported by DataTables: ", message);
      });

    $("[id^='select-']")
      .parents("tr")
      .prop("className", "odd");

    if (poItems.length > 0) {
      let selectedPOItemsKeys = Object.keys(selectedPOItems);
      let rowSelected = [];

      if (selectedPOItemsKeys.includes(poNumber)) {
        rowSelected = selectedPOItems[poNumber].rowSelected;
      } else {
        selectedPOItems[this.state.activePO] = {
          rowSelected: [],
          item: []
        };
        this.setState({
          selectedPOItems: selectedPOItems
        });
      }
      rowSelected.forEach(row => {
        $("[id^='select-" + row + "']")
          .parents("tr")
          .prop("className", "odd active");

        $("[id^='select-" + row + "']").prop("checked", "checked");
        $("#qty-select-" + row).prop("disabled", false);
        $("#unit-select-" + row).prop("disabled", false);
      });
    }

    await $("[id^='select-']").change(event => {
      this.handlePOItemSelect(event);
    });

    await $("#selectall").change(event => {
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
        this.formatNumberInput(event.target.value, 3)
      );
      // event.target.value = Number.parseFloat(
      //   +this.formatNumberInput(event.target.value, 3)
      // ).toFixed(3);
    });

    await $("[id^='unit-select-']").on("input", event => {
      this.handlePOItemUnitPriceChange(event);
    });

    await $("[id^='unit-select-']").on("blur", event => {
      event.target.value = this.formatPriceNumber(
        this.formatNumberInput(event.target.value, 2)
      );
      // event.target.value = Number.parseFloat(
      //   +this.formatNumberInput(event.target.value, 2)
      // ).toFixed(2);
    });

    await ReactTooltip.rebuild();

    this.setState({
      poItemDataTable: dts
    });
    this.checkIsPurchaseOrderSelected();
  }
  componentWillUnmount() {
    this.state = [];
  }
  handlePOItemQtyFocus(event) {
    if (event.target.value === "0.000") {
      event.target.value = "";
    }
    let arr = event.target.id.split("-");
    let itemRef = arr[2];
    ReactTooltip.show(findDOMNode(this.refs["qty-ref-" + itemRef]));
    let selectedPOItems = this.state.selectedPOItems;
    let targetItem = selectedPOItems[this.state.activePO].item.find(item => {
      return item.poItemNo === itemRef;
    });
    this.setState({
      maximumQtyTooltip: this.formatQtyNumber(
        targetItem.quantity.remaining +
          targetItem.overDeliveryQuantity.remaining
      ),
      maximumQty: (
        targetItem.quantity.remaining +
        targetItem.overDeliveryQuantity.remaining
      ).toFixed(3)
    });
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
    targetItem.quantity.initial = +changeQty;

    $("#amount-" + targetItem.poItemNo).text(
      this.formatPriceNumber(+changeQty * targetItem.poItemUnitPrice)
    );

    this.validateQtyInput();
    await this.setState({
      selectedPOItems: selectedPOItems
    });
  }

  validateQtyInput() {
    let isQtyExceededFound = false;
    let selectedPOItems = this.state.selectedPOItems;
    let _this = this;
    _.forOwn(selectedPOItems, (value, key) => {
      let poItems = selectedPOItems[key].item;
      poItems.forEach((item, index) => {
        if (
          item.quantity.initial >
            item.quantity.remaining + item.overDeliveryQuantity.remaining ||
          item.quantity.initial === 0
        ) {
          if (key === _this.state.activePO) {
            $("#qty-select-" + item.poItemNo).css("color", "red");
          }
          isQtyExceededFound = true;
        } else {
          if (key === _this.state.activePO) {
            $("#qty-select-" + item.poItemNo).css("color", "");
          }
        }
      });
    });

    if (isQtyExceededFound) {
      this.setState(
        {
          isQtyExceeded: true
        },
        () => this.resolveAllowToNext()
      );
    } else {
      this.setState(
        {
          isQtyExceeded: false
        },
        () => this.resolveAllowToNext()
      );
    }
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

    $("#amount-" + targetItem.poItemNo).text(
      this.formatPriceNumber(+changeUnit * targetItem.quantity.initial)
    );

    await this.setState({
      selectedPOItems: selectedPOItems
    });
  }

  async handlePOItemSelect(event) {
    let element = event.target;

    if (element.id === "selectall") {
      if (!element.checked) {
        $("[id^='select']").prop("checked", false);
        $("[id^='select-']")
          .parents("tr")
          .prop("className", "odd");
        $("[id^='qty-select-']").prop("disabled", true);
        $("[id^='unit-select-']").prop("disabled", true);
      } else {
        $("[id^='select']").prop("checked", true);
        $("[id^='select-']")
          .parents("tr")
          .prop("className", "odd active");
        $("[id^='qty-select-']").prop("disabled", false);
        $("[id^='unit-select-']").prop("disabled", false);
      }
    } else {
      this.shouldPOItemsSelectAll();

      if (element.checked) {
        $(event.originalEvent.target)
          .closest("tr")
          .addClass("active");
        $("#qty-" + element.id).prop("disabled", false);
        $("#unit-" + element.id).prop("disabled", false);
      } else {
        $(event.originalEvent.target)
          .closest("tr")
          .removeClass("active");
        $("#qty-" + element.id).prop("disabled", true);
        $("#unit-" + element.id).prop("disabled", true);
      }
    }

    let selectedPOItems = this.state.selectedPOItems;
    let selectedPOItemsActivePO = [];
    let poItems = this.state.activePOItems;
    let rowSelected = [];
    poItems.forEach((item, index) => {
      if ($("#select-" + item.poItemNo)[0].checked) {
        let qtyFieldValue = $("#qty-select-" + item.poItemNo).val();
        qtyFieldValue = parseInt(qtyFieldValue.replace(",", ""));
        let selectedItem = selectedPOItems[this.state.activePO].item.find(
          sItem => {
            return sItem.poItemNo == item.poItemNo;
          }
        );
        let addingItem = selectedItem === undefined ? item : selectedItem;
        addingItem.quantity.initial = +qtyFieldValue;
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
      () => {
        this.validateQtyInput();
      }
    );

    await this.checkIsPurchaseOrderSelected();
  }

  handleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  handlePOAutoCompleteChange(selectedPO) {
    if (selectedPO !== undefined) {
      let existingPO = this.state.populatedPO.find(po => {
        return po.poNumber === selectedPO.purchaseOrderNumber;
      });

      if (existingPO === undefined) {
        const AllPO = this.state.AllPO;
        AllPO.push(selectedPO);
        this.setState(
          {
            AllPO: AllPO,
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

  handleSubmitNewPO(selectedPO) {
    let newPONumber = this.state.inputPONumber;
    if (this.checkPOConfiguration(newPONumber)) {
      let populatedPO = this.state.populatedPO;
      let newPOTemplate = {
        poNumber: this.state.inputPONumber,
        count: "-",
        vendorTaxNumber: selectedPO.vendorTaxNumber,
        businessPlaceTaxNumber: selectedPO.businessPlaceTaxNumber,
        companyBranchCode: selectedPO.companyBranchCode,
        paymentTermCode: selectedPO.paymentTermCode,
        paymentTermDays: selectedPO.paymentTermDays
      };

      this.handleSelectPO(newPONumber);

      populatedPO.push(newPOTemplate);
      this.setState({
        populatedPO: populatedPO,
        inputPONumber: "",
        isAddPOInputTriggered: false,
        isMainPOSelected: true
      });
    } else {
      this.setState({
        alertModalAlertTitle: "Error",
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
        alertModalMsg: ["The system cannot get attachment configuration."]
      });
    }
  }

  handleSelectPO(poNumber) {
    this.setState({
      blocking: true
    });
    Api.getPOByPONumber(poNumber).then(res => {
      let po = res.data.find(po => {
        return po.purchaseOrderNumber === poNumber;
      });
      Api.getPOItemsByPOId(po.linearId)
        .then(res => {
          let itemList = this.filterItemByCondition(res.data);
          return itemList;
        })
        .then(itemList => {
          if (itemList.length > 0) {
            this.getPOItems(poNumber, itemList);
          } else {
            this.setState({
              alertModalAlertTitle: "Error",
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
              alertModalMsg: [
                "There is no available item for invoice creation.",
                <br />,
                "Please contact procurement team for further assistant."
              ]
            });
            this.handleRemovePO(poNumber);
          }
        })
        .then(() => {
          $("[id^='select-']").change(event => {
            this.handlePOItemSelect(event);
          });

          $("[id^='qty-select-']").on("input", event => {
            this.handlePOItemQtyChange(event);
            //$(event.target).css("width", event.target.value.length * 14);
          });

          $("[id^='qty-select-']").on("focus", event => {
            this.handlePOItemQtyFocus(event);
            if (event.target.value == "0.000") {
              event.target.value = "";
            }
            // $(event.target).css("width", event.target.value.length * 14);
          });

          $("[id^='qty-select-']").on("blur", event => {
            this.handlePOItemQtyFocus(event);
            if (event.target.value == "" || event.target.value == "0.000") {
              event.target.value = "0.000";
            }
          });

          $("[id^='unit-select-']").on("input", event => {
            this.handlePOItemUnitPriceChange(event);
            //$(event.target).css("width", event.target.value.length * 14);
          });

          $("[id^='unit-select-']").on("blur", event => {
            event.target.value = Number.parseFloat(
              +this.formatNumberInput(event.target.value, 2)
            ).toFixed(2);
            //$(event.target).css("width", event.target.value.length * 12);
          });

          ReactTooltip.rebuild();
        });
      this.setState({
        activePO: poNumber
        // blocking: false
      });
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
          this.state.poItemDataTable.clear();
          this.state.poItemDataTable.rows.add([]);
          this.state.poItemDataTable.draw();
          this.setState({
            isMainPOSelected: false
          });
        }
        this.checkIsPurchaseOrderSelected();
      }
    );
  }

  handleAddPOButton() {
    this.setState({
      isAddPOInputTriggered: true
    });
  }

  handleDismissBtnModal = () => {
    this.setState({
      blocking: false,
      alertModalAlertTitle: "",
      isAlertModalVisible: false,
      buttonAlert: [],
      isTextOnly: true,
      alertModalMsg: []
    });
  };

  shouldPOItemsSelectAll() {
    let isSelectAll = true;
    let poItems = this.state.activePOItems;
    poItems.forEach(item => {
      if (!$("#select-" + item.poItemNo)[0].checked) {
        $("#selectall").prop("checked", false);
        isSelectAll = false;
      }
      if (isSelectAll) {
        $("#selectall").prop("checked", true);
      }
    });
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
          po.buyer.legalName,
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

  async checkIsPurchaseOrderSelected() {
    let isSelected = false;
    let editedPO = Object.keys(this.state.selectedPOItems);
    for (let i = 0; i < editedPO.length; i++) {
      if (this.state.selectedPOItems[editedPO[i]].item.length > 0) {
        isSelected = true;
      }
    }
    this.setState(
      {
        isPurchaseOrderSelected: isSelected
      },
      () => this.resolveAllowToNext()
    );
  }

  filterItemByCondition(poItems) {
    return poItems.filter(item => {
      return item.deleteFlag !== "BLOCKED" && item.deleteFlag !== "DELETED";
    });
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

  ///// NEXT //////

  async handleNext() {
    let allSelectedPO = Object.keys(this.state.selectedPOItems);

    await this.setState({
      mainPO: this.state.selectedPOItems[allSelectedPO[0]]
    });

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

  ///// Util /////

  formatQtyNumber(amount, grouping) {
    return Intl.NumberFormat("th-TH", {
      useGrouping: grouping,
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(amount);
  }

  formatPriceNumber(amount, grouping) {
    return Intl.NumberFormat("th-TH", {
      useGrouping: grouping,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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

  render() {
    return (
      <BlockUi tag="div" blocking={this.state.blocking}>
        <ReactTooltip id="maximumQty" place="top" type="light" effect="float">
          <span>
            <b>Maximum: {this.state.maximumQtyTooltip}</b>
          </span>
        </ReactTooltip>
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
                <li className="flex-fill active">
                  <div className="indicator step-2 rounded-circle text-center">
                    <span className="number">2</span>
                    <i className="fa fa-check" />
                  </div>
                  <p className="text-center">Select Items</p>
                </li>
                <li className="flex-fill">
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
              <h2>Please Select PO and PO Items (PO)</h2>
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
            <div id="editForm" name="editForm" class="form col-12">
              <div class="box box--width-header col-12">
                <div class="d-flex">
                  <div
                    id="selectPO-panel"
                    class="col-2 border-right border-1px border-lightgrey px-0"
                  >
                    <div id="po_items" class="col-12 pb-3 px-0">
                      {/* <div style={{ 'padding': '0px' }} class="form-group border-bottom border-1px border-lightgrey">
                                        </div> */}
                      <ul>
                        {
                          <div
                            style={{ marginTop: "15px", position: "relative" }}
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
                                    <a
                                      href="javascript:void(0);"
                                      onClick={() =>
                                        this.handleSelectPO(po.poNumber)
                                      }
                                    >
                                      <strong className="gray-1 text-center font-bold">
                                        {" "}
                                        {po.poNumber}
                                        <br /> ({po.count}{" "}
                                        {po.count > 1 ? "items" : "item"}){" "}
                                      </strong>
                                    </a>
                                    {this.state.populatedPO.length > 1 ? (
                                      <i
                                        onClick={() =>
                                          this.handleRemovePO(po.poNumber)
                                        }
                                        className="fa fa-times gray-2"
                                      />
                                    ) : (
                                      ""
                                    )}
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
                                    this.state.isAddPOInputTriggered === true
                                  }
                                  id="morePOBtn"
                                  class="text-center"
                                >
                                  <a
                                    href="javascript:void(0);"
                                    class="text-bold"
                                    onClick={() => this.handleAddPOButton()}
                                  >
                                    <i class="fa fa-plus small" /> Add PO
                                  </a>
                                </p>
                              </div>
                            ) : (
                              <div className="form-label-group px-3">
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
                                      if (this.state.isMainPOSelected) {
                                        fetchURL =
                                          `${poSearchApiUrl}${query}&vendorTaxNumber=${
                                            this.state.populatedPO[0]
                                              .vendorTaxNumber
                                          }&` +
                                          `businessPlaceTaxNumber=${
                                            this.state.populatedPO[0]
                                              .businessPlaceTaxNumber
                                          }&` +
                                          `companyBranchCode=${
                                            this.state.populatedPO[0]
                                              .companyBranchCode
                                          }&` +
                                          `paymentTermCode=${
                                            this.state.populatedPO[0]
                                              .paymentTermCode
                                          }`;
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
                          <div className="form-label-group px-3">
                            <AsyncTypeahead
                              inputProps={{
                                id: `purchaseOrderNumber`,
                                name: `purchaseOrderNumber`,
                                className: `input-search`,
                                title: `Select PO.`
                              }}
                              ref={Typeahead => (this.Typeahead = Typeahead)}
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
                                  if (this.state.isMainPOSelected) {
                                    fetchURL =
                                      `${poSearchApiUrl}${query}&vendorTaxNumber=${
                                        this.state.populatedPO[0]
                                          .vendorTaxNumber
                                      }&` +
                                      `businessPlaceTaxNumber=${
                                        this.state.populatedPO[0]
                                          .businessPlaceTaxNumber
                                      }&` +
                                      `companyBranchCode=${
                                        this.state.populatedPO[0]
                                          .companyBranchCode
                                      }&` +
                                      `paymentTermCode=${
                                        this.state.populatedPO[0]
                                          .paymentTermCode
                                      }`;
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
                          <div className="px-3">
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
                  </div>
                  <div id="POLists" class="col-10">
                    <div class="table-responsive mt-3">
                      <table class="table datatable" ref={el => (this.el = el)}>
                        <thead class="rounded">
                          <tr>
                            <th width="50">
                              <div class="custom-control custom-checkbox">
                                <input
                                  type="checkbox"
                                  class="custom-control-input"
                                  id="selectall"
                                />
                                <label
                                  class="custom-control-label pl-1 font-small text-shadow"
                                  for="selectall"
                                />
                                {}
                              </div>
                            </th>
                            <th width="100">
                              PO Item <br />
                              No.
                            </th>
                            <th>Material Description</th>
                            <th width="100">
                              Remaining <br />
                              QTY
                            </th>
                            <th width="50">QTY</th>
                            <th width="100">
                              Unit <br />
                              Description
                            </th>
                            <th width="90">Unit Price</th>
                            <th width="90">Amount</th>
                            <th width="90">Currency</th>
                          </tr>
                        </thead>
                      </table>
                      {/* <label id='label-error' style={{ 'color': 'red', 'margin-left': '10px', 'float': 'right', 'padding-right': '10px' }} hidden={!this.state.isQtyExceeded}>Qty cannot greater than remainning qty.</label>
                                        <label id='label-error' style={{ 'color': 'red', 'margin-left': '10px', 'float': 'right', 'padding-right': '10px' }} hidden={this.state.isPurchaseOrderSelected}>Please select Purchase Order Item.</label> */}
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
                  {this.state.isReadyToNext === true ? (
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
                  {/* <button type="button" name="btnNext" id="btnNext" onClick={this.props.nextStep} class="btn btn--transparent btn-purple">Next <i class="fa fa-chevron-right"></i></button> */}
                </div>
              </div>
              <div class="row">&nbsp;</div>
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
              id="itemConditionWarning"
              class="modal hide fade"
              tabindex="-1"
              role="dialog"
              aria-labelledby="addPO"
              aria-hidden="true"
            >
              <div class="modal-dialog" role="document">
                <div class="modal-content">
                  <div class="modal-header">
                    <h3 id="myModalLabel">
                      <center>Error</center>
                    </h3>
                  </div>
                  <div class="modal-body text-center">
                    <div className="text">
                      There is no available item for invoice creation. Please
                      contact procurement team for further assistant.
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
                      Close
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
                  <div class="modal-header">
                    <h3 id="myModalLabel" class="w-100 text-center">
                      Cancel
                    </h3>
                  </div>
                  <div class="modal-body d-flex justify-content-center">
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

export default createInvoiceByPoStepTwo;
