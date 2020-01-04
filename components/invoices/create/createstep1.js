import React, { Component } from "react";
import api from "../../../libs/api";
import { MOCKDATA } from "./models/mockdata";
import { INVOICE_CREATE_MODEL, formatCurrency } from "./models/createmodel";
import BlockUi from "react-block-ui";
import { Loader, Types } from "react-loaders";
import handleError from "../../../pages/handleError";
import ModalAlert, {
  BTN_ACTION_BACK,
  BTN_ACTION_CLOSE,
  BTN_ACTION_OK
} from "../../modalAlert";
import { i18n, withTranslation } from "~/i18n";
import autoDelay from "../../../configs/delay.typeahead.json";
import {
  asyncContainer,
  Typeahead
} from "../../../libs/react-bootstrap-typeahead";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";
import dynamic from "next/dynamic";
import followMeConfig from "../../../follow-me.json";
import { CREATE_INVOICE_STEP1 } from "../../../configs/followMe/createInvoiceStep";
// import Tour from "reactour";
const Tour = dynamic(() => import("~/components/custom-reactour"), {
  ssr: false
});

const AsyncTypeahead = asyncContainer(Typeahead);
const poStatusQueryString = "&statuses=Confirmed";
const poSearchApiUrl =
  "/api/purchaseorders?bypass=true&" +
  poStatusQueryString +
  "&purchaseOrderNumber=";
const accentColor = "#af3694";

class CreateStep1 extends Component {
  //this.apis = new api(this.props.domain).group("invoice");
  constructor(props) {
    super(props);
    this.state = {
      ...INVOICE_CREATE_MODEL.DEFAULT_STATE_STEP1,
      selectedItems: [],
      resultSearch: { ...INVOICE_CREATE_MODEL.SEARCH_RESULT_STRUCTURE },
      mainPO: {},
      delayTime: autoDelay["delay_time"],
      isLoading: false
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

    this.poApi = new api().group("po");
    this.configApi = new api().group("config");
  }
  componentDidMount() {
    this.setState(this.props.mainstate.stepOneProp);
    setTimeout(() => {
      if (followMeConfig.createInvoice.enableStep1) {
        // this.openTour();
      }
    }, 500);
  }
  componentWillMount() {
    this.setState({
      steps: CREATE_INVOICE_STEP1
    });
  }
  componentWillUnmount() {
    this.state = {};
  }
  componentWillUpdate(nextProps, nextState) {}

  btnClearClick = async () => {
    try {
      this.setState({ clearing: true });
      this.search_po_no.getInstance().clear();
      this.search_po_no.value = "";
      this.search_inv_no.value = "";
      this.search_ref1.value = "";

      this.setState({
        resultSearch: INVOICE_CREATE_MODEL.SEARCH_RESULT_STRUCTURE
      });
      //await this.reloadTable({})
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
      let grInvoiceNumber = this.search_inv_no.value;
      let grReferenceField1 = this.search_ref1.value;
      let opts = {};
      if (purchaseOrderNumber != "")
        opts.purchaseOrderNumber = purchaseOrderNumber;
      if (grInvoiceNumber != "") opts.grInvoiceNumber = grInvoiceNumber;
      if (grReferenceField1 != "") opts.grReferenceField1 = grReferenceField1;

      await this.reloadTable(opts);
      this.setState({ searching: false });
    } catch (err) {
      this.setState({ searching: false });
    }
  };
  filterDuplicate = item => {
    if (this.state.selectedItems.length == 0) {
      return true;
    }
    let filteredArray = this.state.selectedItems.filter(
      row => row.linearId === item.linearId
    );
    return filteredArray.length == 0;
  };
  filterDuplicateItem = () => {
    let res = this.state.resultSearch.data.filter(this.filterDuplicate);
    this.setState({ resultSearch: { ...this.state.resultSearch, data: res } });
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
      let resultSearch = await this.poApi.call("purchaseordersHeader", params);
      resultSearch.data = resultSearch.data.filter(this.filterDuplicate);
      await this.setState({ resultSearch });
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
      this.setState({
        resultSearch: INVOICE_CREATE_MODEL.SEARCH_RESULT_STRUCTURE
      });
    }
  };

  addItem = async item => {
    let { selectedItems } = this.state;
    let filteredArray = this.state.selectedItems.filter(
      row => row.linearId === item.linearId
    );
    if (filteredArray.length != 0) {
      return;
    }
    selectedItems.push(item);
    this.setState({ selectedItems });
    if (selectedItems.length == 1) {
      await this.getConfiguration(item);
      this.setState({
        mainPO: item
      });
      if (
        this.state.settings.INVOICE_CREATED_BY_DOCUMENT.value ==
        "GOODS_RECEIVED"
      ) {
        this.getItemGR(item);
      } else {
        this.getItemPO(item);
      }
      this.btnSearchClick();
    } else {
      await this.filterDuplicateItem();
      if (
        this.state.settings.INVOICE_CREATED_BY_DOCUMENT.value ==
        "GOODS_RECEIVED"
      ) {
        this.getItemGR(item);
      } else {
        this.getItemPO(item);
      }
    }
  };
  addItemLists = async (item, result) => {
    result.data = result.data.filter(r => {
      return r.deleteFlag !== "BLOCK" && r.deleteFlag !== "DELETED";
    });

    // if (result.data.length < 1) {
    //     return await this.deleteItem(item);
    //     return;
    // }
    let selectedItems = this.state.selectedItems.map(row => {
      if (item.linearId == row.linearId) {
        row.itemLists = result.data;
      }
      return row;
    });
    return await this.setState({ selectedItems });
  };
  deleteItem = async item => {
    let filteredArray = this.state.selectedItems.filter(
      row => row.linearId !== item.linearId
    );

    if (filteredArray.length < 1) {
      this.clearAll();
      this.setState({ selectedItems: [] });
    } else {
      this.setState({ selectedItems: filteredArray });
      await this.filterDuplicateItem();
    }
  };
  getItemGR = async item => {
    try {
      let itemGrResp = await this.poApi.call("gritem", {
        linearId: item.linearId
      });

      itemGrResp.data = itemGrResp.goodsReceivedItems;
      if (itemGrResp.data.length == 0) {
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

      await this.addItemLists(item, itemGrResp);
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
      this.deleteItem(item);
    }
  };
  getItemPO = async item => {
    try {
      let itemResp = await this.poApi.call("poitem", {
        purchaseOrderLinearId: item.linearId,
        deleteFlag: "IS_NULL",
        bypass: true
      });
      itemResp.data = itemResp.data.filter(r => {
        return (
          r.quantity !== undefined &&
          r.quantity.remaining !== undefined &&
          r.quantity.unit !== undefined &&
          r.quantity.remaining >= 0
        );
      });
      await this.addItemLists(item, itemResp);
    } catch (err) {
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
      this.deleteItem(item);
    }
  };
  nextStep = () => {
    this.enableBody($(".reactour__helper--is-open")[0]);
    this.props.setMainState({ stepOneProp: { ...this.state } });
    this.props.nextStep();
  };
  getConfiguration = async item => {
    try {
      this.setState({ blockuiTable: true });
      // get invoice created by document start
      let INVOICE_CREATED_BY_DOCUMENT = await this.configApi.call(
        "configuration",
        {
          companyTaxId: item.vendorTaxNumber,
          counterPartyTaxId: item.businessPlaceTaxNumber,
          configOption: "INVOICE_CREATED_BY_DOCUMENT"
        }
      );
      if (INVOICE_CREATED_BY_DOCUMENT.length > 1) {
        this.setState({ selectedItems: [] });
        throw new Error(
          INVOICE_CREATE_MODEL.ERROR_MESSAGE.INVOICE_CREATED_BY_DOCUMENT_DUPLICATE
        );
      } else if (INVOICE_CREATED_BY_DOCUMENT.length != 1) {
        this.setState({ selectedItems: [] });
        throw new Error(
          INVOICE_CREATE_MODEL.ERROR_MESSAGE.INVOICE_CREATED_BY_DOCUMENT
        );
      } else {
        INVOICE_CREATED_BY_DOCUMENT = INVOICE_CREATED_BY_DOCUMENT[0];
      }
      // get invoice created by document end

      // get invoice attachment config start
      let INVOICE_CONFIG = await this.configApi.call("configuration-invoice", {
        legalName: item.buyer.legalName,
        companyTaxId: item.businessPlaceTaxNumber,
        vendorTaxId: item.vendorTaxNumber
      });

      if (!INVOICE_CONFIG && !INVOICE_CONFIG.attachmentConfiguration) {
        throw new Error(INVOICE_CREATE_MODEL.ERROR_MESSAGE.INVOICE_CONFIG);
      }
      // get invoice attachment config end

      // get invoice grouping config start
      if (INVOICE_CREATED_BY_DOCUMENT.value == "GOODS_RECEIVED") {
        let INVOICE_ITEM_DEFAULT_GROUPING = await this.configApi.call(
          "configuration",
          {
            companyTaxId: item.vendorTaxNumber,
            counterPartyTaxId: item.businessPlaceTaxNumber,
            configOption: "INVOICE_ITEM_DEFAULT_GROUPING"
          }
        );
        if (INVOICE_ITEM_DEFAULT_GROUPING.length > 1) {
          this.setState({
            settings: {
              ...this.state.settings,
              INVOICE_ITEM_DEFAULT_GROUPING: {
                value: false
              }
            }
          });
          throw new Error(
            INVOICE_CREATE_MODEL.ERROR_MESSAGE.INVOICE_ITEM_DEFAULT_GROUPING_DUPLICATE
          );
        } else if (INVOICE_ITEM_DEFAULT_GROUPING.length != 1) {
          this.setState({
            settings: {
              ...this.state.settings,
              INVOICE_ITEM_DEFAULT_GROUPING: {
                value: false
              }
            }
          });
          throw new Error(
            INVOICE_CREATE_MODEL.ERROR_MESSAGE.INVOICE_ITEM_DEFAULT_GROUPING
          );
        } else {
          let grouping = INVOICE_ITEM_DEFAULT_GROUPING[0];
          grouping.value = grouping.value.toLowerCase();
          let isGrouping = false;
          if (grouping.value === "true") {
            isGrouping = true;
          }
          this.setState({
            settings: {
              ...this.state.settings,
              INVOICE_ITEM_DEFAULT_GROUPING: {
                value: isGrouping
              }
            }
          });
        }
      }
      this.setState({
        settings: {
          ...this.state.settings,
          INVOICE_CREATED_BY_DOCUMENT: INVOICE_CREATED_BY_DOCUMENT,
          INVOICE_CONFIG: INVOICE_CONFIG
        },
        blockuiTable: false,
        searchConfig: {
          vendorTaxNumber: item.vendorTaxNumber,
          businessPlaceTaxNumber: item.businessPlaceTaxNumber,
          companyBranchCode: item.companyBranchCode,
          paymentTermCode: item.paymentTermCode
        },
        globalParam: {
          paymentTermDescription: item.paymentTermDescription,
          paymentTermDays: item.paymentTermDays,
          legalName: item.buyer.legalName
        }
      });

      return true;
    } catch (err) {
      this.clearAll();
      const response = handleError(err, this.handleDismissBtnModal);
      this.setState({
        ...response
      });
      this.setState({ blockuiTable: false });
      return false;
    }
  };
  clearAll = () => {
    this.setState({
      ...INVOICE_CREATE_MODEL.DEFAULT_STATE_STEP1,
      resultSearch: INVOICE_CREATE_MODEL.SEARCH_RESULT_STRUCTURE,
      settings: {
        INVOICE_CREATED_BY_DOCUMENT: {},
        INVOICE_CREATED_BY_DOCUMENT: {},
        INVOICE_CONFIG: {}
      }
    });
  };
  handleDismissBtnModal = () => {
    //this.setState({ resultSearch: INVOICE_CREATE_MODEL.SEARCH_RESULT_STRUCTURE });
    this.setState({ isAlertModalVisible: false });
  };

  handlePoAutoCompleteChange(selectedPO) {
    if (selectedPO !== undefined) {
      this.search_po_no.value = selectedPO.purchaseOrderNumber;
    }
  }

  openTour = () => {
    this.setState({ isTourOpen: true });
  };

  closeTour = () => {
    this.setState({ isTourOpen: false });
    this.enableBody($(".reactour__helper--is-open")[0]);
    this.props.closeTour();
  };

  disableBody = target => {
    disableBodyScroll(target);
  };
  enableBody = target => {
    enableBodyScroll(target);
  };

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

  alert = (title, message, button = BTN_ACTION_BACK) => {
    this.setState({
      alertModalAlertTitle: title,
      isAlertModalVisible: true,
      buttonAlert: button,
      isTextOnly: true,
      alertModalMsg: message,
      blockuiTable: false
    });
  };

  render() {
    const { t } = this.props;
    return (
      <div>
        {/* Header - Start */}
        {this.renderTour()}
        <div className="page__header col-12">
          <div className="col-7">
            <h2>{t("Please Search and Select PO")}</h2>
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
              id="selectPO-panel"
              className="col-12 align-self-start list-style-none px-2 mt-2"
            >
              {this.state.selectedItems.map(row => {
                return (
                  <li
                    className={`font-bold ${
                      row.itemLists && row.itemLists.length == 0
                        ? "disabled_items"
                        : ""
                    }`}
                  >
                    <a>
                      {row.purchaseOrderNumber}
                      <br />
                      {row.itemLists ? (
                        <span>
                          ( {row.itemLists.length}{" "}
                          {row.itemLists.length > 1 ? t("items") : t("item")} )
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

              {/* <li className="font-bold text-center">
                                No item selected.
                            </li> */}
            </ul>
            <div
              className="col-12 mt-auto form-group border-top border-1px border-grey"
              id="itemTypeTour"
            >
              <p className="font-bold my-3">{t("Create invoice by")} : </p>
              <div className="custom-control custom-radio mt-2">
                <input
                  type="radio"
                  className="custom-control-input"
                  name="create_invoice_by"
                  id="by_po_items"
                  value="po_items"
                  ref={el => (this.by_po_items = el)}
                  checked={
                    this.state.settings.INVOICE_CREATED_BY_DOCUMENT.value ==
                    "PURCHASE_ORDER"
                  }
                />
                <label className="custom-control-label" htmlFor="by_po_items">
                  {" "}
                  {t("Selecting PO items")}
                </label>
              </div>
              <div className="custom-control custom-radio mt-2">
                <input
                  type="radio"
                  className="custom-control-input"
                  name="create_invoice_by"
                  id="by_gr_items"
                  value="gr_items"
                  checked={
                    this.state.settings.INVOICE_CREATED_BY_DOCUMENT.value ==
                    "GOODS_RECEIVED"
                  }
                  ref={el => (this.by_gr_items = el)}
                />
                <label className="custom-control-label" htmlFor="by_gr_items">
                  {" "}
                  {t("Selecting GR items")}
                </label>
              </div>
            </div>
          </div>
          {/* Sidebar - End */}

          {/* List - Start */}
          <BlockUi
            tag="div"
            id="createPO-body"
            className="col-10 d-flex flex-wrap align-items-start"
            blocking={this.state.blockuiTable}
          >
            {/* <div id="createPO-body" className="col-10 d-flex flex-wrap align-items-start"> */}

            {/* SearchBox - Start */}
            <div
              id="searchForm"
              name="searchForm"
              className="col-12 px-0 d-flex flex-wrap"
            >
              <div className="col-12 px-0 d-flex flex-wrap align-items-center my-3">
                <h4 className="font-bold col-8 pl-1">
                  {t("Please Search PO Ref No")}:
                </h4>
                <div className="col-4 pr-1 text-right">
                  <span
                    className="wraper btnPanel"
                    style={{ padding: "10px 0 10px 0" }}
                  >
                    <button
                      disabled={this.state.searching || this.state.clearing}
                      className="btn btn--transparent btn-clear mr-2  btn-search-reset clearTour"
                      ref={el => (this.btnClearSearch = el)}
                      onClick={() => {
                        this.btnClearClick();
                      }}
                    >
                      {this.state.searching ? (
                        <>
                          <i
                            className="fa fa-circle-o-notch fa-spin"
                            aria-hidden="true"
                          ></i>{" "}
                          {t("Clearing")}
                        </>
                      ) : (
                        <>
                          <i className="icon icon-x"></i> {t("Clear")}
                        </>
                      )}
                    </button>
                    <button
                      disabled={this.state.searching || this.state.clearing}
                      className="btn btn-search searchTour"
                      ref={el => (this.btnSearch = el)}
                      type="button"
                      onClick={() => {
                        this.btnSearchClick();
                      }}
                    >
                      {this.state.searching ? (
                        <>
                          <i
                            className="fa fa-circle-o-notch fa-spin"
                            aria-hidden="true"
                          ></i>{" "}
                          {t("Searching")}
                        </>
                      ) : (
                        <>
                          <i className="icon icon-search"></i> {t("Search")}
                        </>
                      )}
                    </button>
                  </span>
                </div>
              </div>
              <div className="col-12 row input-search-group">
                <div className="form-group col-4 mb-0 px-1">
                  <div className="form-label-group">
                    <AsyncTypeahead
                      inputProps={{
                        id: `poNumber`,
                        name: `poNumber`,
                        className: `input-search`,
                        title: `${t("Purchase Order No")}`
                      }}
                      ref={Typeahead => (this.search_po_no = Typeahead)}
                      placeholder="Select PO."
                      defaultInputValue=""
                      isLoading={this.state.isLoading}
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
                            ...this.state.searchConfig,
                            purchaseOrderNumber: query,
                            bypass: true,
                            length: 100,
                            start: 0,
                            statuses: "Confirmed"
                          };
                          let fetchURL = this.poApi.url(
                            "purchaseordersHeader",
                            params
                          );
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
                          } catch (err) {
                            console.log(err);
                          }
                        }
                      }}
                      options={this.state.options}
                    />
                  </div>
                </div>

                <div className="form-group col-4 mb-0 px-1">
                  <div className="form-label-group">
                    <input
                      type="text"
                      id="search-invoice-no"
                      name="search-invoice-no"
                      ref={el => (this.search_inv_no = el)}
                      placeholder={t("Invoice No")}
                      className="form-control input-search"
                    />
                    <label htmlFor="search-invoice-no">{t("Invoice No")}</label>
                  </div>
                </div>
                <div className="form-group col-4 mb-0 px-1">
                  <div className="form-label-group">
                    <input
                      type="text"
                      id="search-ref-1"
                      name="search-ref-1"
                      ref={el => (this.search_ref1 = el)}
                      placeholder={t("Reference_1_gr")}
                      className="form-control input-search"
                    />
                    <label htmlFor="search-ref-1">{t("Reference_1_gr")}</label>
                  </div>
                </div>
              </div>
            </div>
            {/* SearchBox - End */}

            {/* dataTable - Start */}
            <div className="table-responsive">
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
                  {this.state.resultSearch.data.length == 0 ? (
                    <tr>
                      <td
                        className="text-center"
                        colSpan={
                          INVOICE_CREATE_MODEL.MODEL_PO_COLUMN.length + 1
                        }
                      >
                        {this.state.searching ? (
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
                  {this.state.resultSearch.data.map(row => {
                    return (
                      <tr>
                        <td className="text-center">
                          <a
                            href="javascript:void(0);"
                            onClick={() => {
                              this.addItem(row);
                            }}
                          >
                            <i className="icon-add border border-purple border-1px border-rounded" />
                          </a>
                        </td>
                        {INVOICE_CREATE_MODEL.MODEL_PO_COLUMN.map(col => {
                          if (typeof col.render == "function") {
                            let res = col.render(row[col.field], row, col);
                            return (
                              <td className={`${col.className || "text-left"}`}>
                                <span className={`${col.optClassName || ""}`}>
                                  {res}
                                </span>
                              </td>
                            );
                          } else {
                            return (
                              <td className={`${col.className || "text-left"}`}>
                                <span className={`${col.optClassName || ""}`}>
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

              {/* dataTable - End */}
            </div>

            {/* </div> */}
          </BlockUi>
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
              name="btnNext"
              id="btnAddPO"
              disabled={
                this.state.selectedItems.length == 0 ||
                this.state.selectedItems.filter(r => {
                  if (r.itemLists) {
                    if (r.itemLists.length == 0) {
                      return true;
                    }
                    return false;
                  } else {
                    return true;
                  }
                }).length != 0
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
        {/* Footer - End */}
        <ModalAlert
          title={this.state.alertModalAlertTitle}
          visible={this.state.isAlertModalVisible}
          button={this.state.buttonAlert}
          isTextOnly={this.state.isTextOnly}
        >
          {this.state.alertModalMsg}
        </ModalAlert>
      </div>
    );
  }
}

export default withTranslation(["invoice-create"])(CreateStep1);
