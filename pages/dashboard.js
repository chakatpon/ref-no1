import React from "react";
import Head from "next/head";

import { DragDropContext } from "react-beautiful-dnd";

import Layout from "../components/Layout";
import withAuth from "../libs/withAuth";
import ApiService from "../libs/ApiService";
import api from "../libs/api";

import DashboardColumn from "../components/dashboard/dashboardColumn";
import DashboardItem from "../components/dashboard/dashboardItem";
import InvoiceStatus from "../components/dashboard/invoiceStatus";
import ThreeWayMatching from "../components/dashboard/threeWayMatching";
import PaymentStatic from "../components/dashboard/paymentStatic";
import GoodReceivedPendingInvoices from "../components/dashboard/goodReceivedPendingInvoices";
import InvoicesPendingGoodReceived from "../components/dashboard/invoicePendingGoodsReceived";
import DashboardStatistic from "../components/dashboard/dashboardStatistic";
import SelectChartPopover from "../components/dashboard/selectChartPopover";
import { i18n, withTranslation } from "~/i18n";
import ModalAlert from "../components/modalAlert";
import { isMobile } from "react-device-detect";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";
import dynamic from "next/dynamic";
import followMeConfig from "../follow-me.json";
import { HELPER_STEP_THAI } from "../configs/followMe/helperStep";
import GA from "~/libs/ga";

//import Tour from "reactour";
const Tour = dynamic(() => import("custom-reactour"), {
  ssr: false
});
const accentColor = "#af3694";

const CHART_BUYER = [
  "DashboardStatistic",
  "InvoiceStatus",
  "ThreeWayMatching",
  "PaymentStatic",
  "GoodReceivedPendingInvoices",
  "InvoicesPendingGoodReceived"
];
const CHART_SELLER = ["InvoiceStatus", "PaymentStatic"];
class Dashboard extends React.Component {
  constructor(props) {
    GA.initialize(props);
    super(props);
    this.api = new ApiService();
    this.apis = new api().group("announcement");
    this.renderGraph = {
      InvoiceStatus,
      ThreeWayMatching,
      PaymentStatic,
      GoodReceivedPendingInvoices,
      InvoicesPendingGoodReceived
    };
    this.state = {
      userinfo: [],
      usertoken: "",
      columns: [],
      chartShow: [],
      showStat: false,

      annoucement: {
        annoucementLanguege: "th",
        annoucementAShow: false,
        annoucementBShow: false,
        annoucementType: "",
        selectedItemIndex: 0,
        selectedItemList: [],
        dontShowAnnoucement: false
      },
      languageModalOpen: false,
      language: i18n.language
    };
    this.columnsVersion = "2.7";
    this.initColumns = [
      {
        droppableId: "dropColumns1",
        items: [
          {
            name: "Invoice Status",
            draggableId: "InvoiceStatus",
            permission: "Dashboard-INV",
            show: true
          },
          {
            name: "3 Way Matching",
            draggableId: "ThreeWayMatching",
            permission: "Dashboard-3WM",
            show: true
          }
        ]
      },
      {
        droppableId: "dropColumns2",
        items: [
          {
            name: "Estimated Payment",
            draggableId: "PaymentStatic",
            permission: "Dashboard-PaymentStats",
            show: true
          },
          {
            name: "Goods Receipt Pending Invoice",
            draggableId: "GoodReceivedPendingInvoices",
            permission: "Dashboard-GR-Pending",
            show: true
          },
          {
            name: "Invoice Pending Goods Receipt",
            draggableId: "InvoicesPendingGoodReceived",
            permission: "Dashboard-INV-Pending",
            show: true
          }
        ]
      }
    ];
  }

  async fetchAnnoucementInfo() {
    try {
      const annoucementInfoAPI = await this.apis.call("get");
      this.setState({
        annoucementInfo: { ...annoucementInfoAPI }
      });
      this.initAnnoucement();
    } catch (err) {
      console.log(err);
    }
  }

  componentWillMount() {}

  componentDidMount() {
    GA.pageview();
    this.fetchAnnoucementInfo();
    this.setState({
      helper: HELPER_STEP_THAI
    });
    const { user, permissions } = this.props;
    let columns = localStorage.getItem("stateColumns");
    let columnsVersion = localStorage.getItem("columnsVersion");
    let showStat = false;
    if (permissions.includes("Dashboard-Stats")) {
      showStat = true;
    }

    let chartShow = [];

    if (columns && columnsVersion && columnsVersion === this.columnsVersion) {
      columns = JSON.parse(columns);
    } else {
      columns = this.initColumns;
    }

    const dashboardPermission = permissions
      ? permissions.filter(item => item.startsWith("Dashboard"))
      : [];

    let columnsFilter = columns;
    if (columnsFilter.length) {
      const [columnOne, columnTwo] = columnsFilter;
      const newItemOne = columnOne.items.filter(chart =>
        chart.permission
          ? dashboardPermission.includes(chart.permission)
          : false
      );
      const newItemTwo = columnTwo.items.filter(chart =>
        chart.permission
          ? dashboardPermission.includes(chart.permission)
          : false
      );
      columnsFilter = [
        { ...columnOne, items: newItemOne },
        { ...columnTwo, items: newItemTwo }
      ];
    }

    columnsFilter.forEach(column => {
      chartShow = [...chartShow, ...column.items.map(chart => chart)];
    });

    this.setState({
      columns: columnsFilter,
      chartShow,
      showStat
    });
    this.prepareHelper();
  }

  onDragEnd = item => {
    if (item.destination) {
      const { columns } = this.state;
      const oldColumns = [...columns];
      const dragableIndex = item.source.index;
      const dropableIndex = item.destination.index;
      const newColumnId = item.destination.droppableId;
      const oldColumnId = item.source.droppableId;
      let newItem;
      oldColumns.forEach(column => {
        if (column.droppableId === oldColumnId) {
          newItem = column.items.splice(dragableIndex, 1);
        }
      });
      oldColumns.forEach(column => {
        if (column.droppableId === newColumnId) {
          column.items.splice(dropableIndex, 0, ...newItem);
        }
      });

      this.setState({
        columns: oldColumns
      });
      this.setLocalStorage(oldColumns);
    }
  };

  setLocalStorage = columns => {
    localStorage.setItem("stateColumns", JSON.stringify(columns));
    localStorage.setItem("columnsVersion", this.columnsVersion);
  };

  onFilter = chartShow => {
    let columnsFilter = this.state.columns;
    chartShow.forEach(item => {
      if (columnsFilter.length) {
        columnsFilter.forEach((column, index) => {
          for (let i = 0; i < column.items.length; i++) {
            if (column.items[i].draggableId === item.draggableId) {
              columnsFilter[index].items[i] = item;
            }
          }
        });
      }
    });
    this.setLocalStorage(columnsFilter);
    this.setState({
      chartShow,
      columns: columnsFilter
    });
  };

  handleDontShow = e => {
    const { annoucementInfo } = this.state;
    this.setState({
      annoucement: {
        ...this.state.annoucement,
        dontShowAnnoucement: this.refs.dontShow.checked
      }
    });
    window.localStorage.setItem("annoucementVersion", annoucementInfo.version);
    window.localStorage.setItem(
      "dontShowAnnoucement",
      this.refs.dontShow.checked
    );
  };

  initAnnoucement() {
    const { annoucementInfo } = this.state;
    if (!isMobile) {
      const annoucementVersion = window.localStorage.getItem(
        "annoucementVersion"
      );
      const isDontShow = window.localStorage.getItem("dontShowAnnoucement");

      if (isDontShow == "true") {
        if (annoucementInfo.version.localeCompare(annoucementVersion) == 0) {
          this.setState({
            annoucement: {
              ...this.state.annoucement,
              annoucementAShow: false,
              annoucementBShow: false
            }
          });
        } else {
          this.handleAnnoucementType();
        }
      } else {
        this.handleAnnoucementType();
      }
    }
  }

  handleAnnoucementType() {
    const { annoucementInfo } = this.state;
    if (annoucementInfo.type.toLowerCase() == "a") {
      this.setState({
        annoucement: {
          ...this.state.annoucement,
          annoucementAShow: true,
          annoucementBShow: false
        }
      });
    } else if (annoucementInfo.type.toLowerCase() == "b") {
      this.setState({
        annoucement: {
          ...this.state.annoucement,
          annoucementAShow: false,
          annoucementBShow: true,
          selectedItemList:
            annoucementInfo.typeB[this.state.annoucement.annoucementLanguege]
              .data[0]
        }
      });
    } else {
      this.setState({
        annoucement: {
          ...this.state.annoucement,
          annoucementAShow: false,
          annoucementBShow: false
        }
      });
    }
  }

  handleClickAnnoucementLanguege(event) {
    const { annoucementInfo } = this.state;
    const value = event.currentTarget.getAttribute("data-language");

    if (annoucementInfo.type.toLowerCase() == "a") {
      this.setState({
        annoucement: {
          ...this.state.annoucement,
          annoucementLanguege: value,
          annoucementAShow: true,
          annoucementBShow: false
        }
      });
    } else if (annoucementInfo.type.toLowerCase() == "b") {
      this.setState({
        annoucement: {
          ...this.state.annoucement,
          annoucementLanguege: value,
          selectedItemList:
            annoucementInfo.typeB[value].data[
              this.state.annoucement.selectedItemIndex
            ],
          annoucementAShow: false,
          annoucementBShow: true
        }
      });
    } else {
      this.setState({
        annoucement: {
          ...this.state.annoucement,
          annoucementLanguege: value,
          annoucementAShow: false,
          annoucementBShow: false
        }
      });
    }
  }

  closeAnnoucement() {
    const { annoucementInfo } = this.state;
    window.localStorage.setItem("annoucementVersion", annoucementInfo.version);
    window.localStorage.setItem(
      "dontShowAnnoucement",
      this.refs.dontShow.checked
    );
    if (annoucementInfo.type.toLowerCase() == "a") {
      this.setState({
        annoucement: {
          ...this.state.annoucement,
          annoucementAShow: true,
          annoucementBShow: false
        }
      });
    } else if (annoucementInfo.type.toLowerCase() == "b") {
      this.setState({
        annoucement: {
          ...this.state.annoucement,
          annoucementAShow: false,
          annoucementBShow: true
        }
      });
    } else {
      this.setState({
        annoucement: {
          ...this.state.annoucement,
          annoucementAShow: false,
          annoucementBShow: false
        }
      });
    }
  }

  handleAnnoucementListSelected(e, index) {
    const { annoucementInfo } = this.state;
    let listB = document.querySelectorAll(".listB");

    Array.from(listB).map(itemB => {
      itemB.classList.remove("active");
    });

    e.currentTarget.parentNode.classList.add("active");

    this.setState({
      annoucement: {
        ...this.state.annoucement,
        selectedItemIndex: index,
        selectedItemList:
          annoucementInfo.typeB[this.state.annoucement.annoucementLanguege]
            .data[index]
      }
    });
  }

  renderAnnoucementTypeBItemList() {
    const { annoucementInfo } = this.state;
    const list = annoucementInfo.typeB[
      this.state.annoucement.annoucementLanguege
    ].data.map((item, index) => {
      if (
        index ==
        annoucementInfo.typeB[this.state.annoucement.annoucementLanguege].data
          .length -
          1
      ) {
        return (
          <React.Fragment key={index}>
            <li
              className={`py-3 px-3 border-bottom listB ${
                index == 0 ? "active" : ""
              }`}
              key={index}
            >
              <h5
                className="mb-0"
                onClick={e => this.handleAnnoucementListSelected(e, index)}
                style={{ cursor: "pointer" }}
              >
                {item.header}
              </h5>

              <p className="mb-0">{item.description}</p>
            </li>
            <li className="py-3 px-3 border-bottom" key={index + 1}>
              <h5 className="mb-0">{"   "}</h5>

              <p className="mb-0">{"   "}</p>
            </li>
          </React.Fragment>
        );
      } else {
        return (
          <li
            className={`py-3 px-3 border-bottom listB ${
              index == 0 ? "active" : ""
            }`}
            key={index}
          >
            <h5
              className="mb-0"
              onClick={e => this.handleAnnoucementListSelected(e, index)}
              style={{ cursor: "pointer" }}
            >
              {item.header}
            </h5>

            <p className="mb-0">{item.description}</p>
          </li>
        );
      }
    });

    return list;
  }

  disableBody = target => disableBodyScroll(target);
  enableBody = target => enableBodyScroll(target);

  openHelper = () => {
    this.setState({ isHelperOpen: true });
  };

  closeHelper = () => {
    this.setState({ isHelperOpen: false });
    this.enableBody($(".reactour__helper--is-open")[0]);
  };

  onAfterOpen = target => {
    this.disableBody(target);
    setTimeout(() => {
      $(".helperCheckbox").change(function() {
        if ($(this).is(":checked")) {
          window.localStorage.setItem("dontShowHelper", true);
          console.log("check true");
        } else {
          window.localStorage.setItem("dontShowHelper", false);
          console.log("check false");
        }
      });
    }, 200);
  };

  renderHelper() {
    return (
      <Tour
        steps={this.state.helper}
        closeWithMask={false}
        disableKeyboardNavigation={!followMeConfig.devVersion}
        disableInteraction={false}
        showNavigation={false}
        isOpen={
          this.state.isHelperOpen &&
          !this.state.annoucement.annoucementAShow &&
          !this.state.annoucement.annoucementBShow &&
          !isMobile
        }
        rounded={5}
        accentColor={accentColor}
        onRequestClose={this.closeHelper}
        onAfterOpen={this.onAfterOpen}
        onBeforeClose={this.enableBody}
        prevButton={<div hidden={true} />}
        nextButton={<div hidden={true} />}
        lastStepNextButton={<div hidden={true} />}
        showNumber={false}
        inViewThreshold={1000}
        scrollDuration={300}
        isCircleMask={true}
      />
    );
  }

  prepareHelper() {
    const _this = this;
    setTimeout(() => {
      if (followMeConfig.helper.enable) {
        const dontShowHelper = window.localStorage.getItem("dontShowHelper");
        const helperVersion = window.localStorage.getItem("helperVersion");
        window.localStorage.setItem(
          "helperVersion",
          followMeConfig.helper.version
        );

        if (dontShowHelper != "true") {
          _this.openHelper();
        } else if (
          followMeConfig.helper.version.localeCompare(helperVersion) != 0
        ) {
          window.localStorage.setItem("dontShowHelper", false);
          _this.openHelper();
        }
      }
    }, 1000);
  }

  render() {
    const { annoucement, annoucementInfo } = this.state;
    let columnsFilter = this.state.columns;
    const { t } = this.props;
    if (columnsFilter.length) {
      const [columnOne, columnTwo] = columnsFilter;
      const newItemOne = columnOne.items.filter(chart =>
        chart.show === undefined ? true : chart.show
      );
      const newItemTwo = columnTwo.items.filter(chart =>
        chart.show === undefined ? true : chart.show
      );
      columnsFilter = [
        { ...columnOne, items: newItemOne },
        { ...columnTwo, items: newItemTwo }
      ];
    }

    return (
      <div>
        {this.renderHelper()}
        <Head>
          <title>{t("menu:Dashboard")}</title>
        </Head>
        <Layout {...this.props}>
          <div id="dashboard">
            <div className="page__header d-flex flex-wrap">
              <h2 className="col-4">{t("menu:Dashboard")}</h2>

              {/* Panel Control - Start */}
              <div id="control-panel" className="ml-auto d-flex">
                {/* Desktop Version - Start */}
                <div className="d-none d-lg-flex">
                  <SelectChartPopover
                    chartShow={this.state.chartShow}
                    onFilter={this.onFilter}
                  />

                  {/* <a
                                        href="javascript:void(0);"
                                        id="btnNoti"
                                        data-toggle="tooltip"
                                        data-placement="bottom"
                                        title="Notifications"
                                    >
                                        <i className="icon icon-icon_noti" />
                                    </a> */}
                  {/* <a
                    // href="javascript:;"
                    data-toggle="tooltip"
                    data-placement="bottom"
                    title="ChangLanguage"
                    onClick={() =>
                      i18n.changeLanguage(i18n.language === "en" ? "th" : "en")
                    }
                  >
                    <i className={`icon icon-flag`} />
                  </a> */}
                  {this.props.appenv.MULTILANG_CONFIG &&
                  this.props.appenv.MULTILANG_CONFIG.length > 1 ? (
                    <a
                      href="#multilang-control-panel"
                      id="btnMultilang"
                      data-toggle="collapse"
                      role="button"
                      aria-expanded="false"
                      aria-controls="multilang-control-panel"
                    >
                      <span className="uppercase">{i18n.language}</span>
                      <i className="fa fa-chevron-down" />
                      <i className="fa fa-chevron-up" />
                    </a>
                  ) : null}

                  {/* multilang Control Panel - Start */}
                  <div
                    id="multilang-control-panel"
                    className="collapse multi-collapse"
                  >
                    <ul>
                      {this.props.appenv.MULTILANG_CONFIG &&
                      this.props.appenv.MULTILANG_CONFIG.length > 1
                        ? this.props.appenv.MULTILANG_CONFIG.map(
                            (language, i) => {
                              return (
                                <li
                                  key={i}
                                  onClick={() => {
                                    if (
                                      i18n.options.allLanguages.includes(
                                        language
                                      )
                                    ) {
                                      i18n.changeLanguage(language);
                                      setTimeout(function() {
                                        window.location.reload();
                                      }, 500);
                                      GA.event({
                                        category: "Language Swticher",
                                        action: "Switch Language",
                                        label: `language ${language}`
                                      });
                                    }
                                  }}
                                >
                                  <span>{t(`common:${language}`)}</span>
                                </li>
                              );
                            }
                          )
                        : null}
                    </ul>
                  </div>
                  {/* multilang Control Panel - End */}
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
                      <i className="icon icon-icon_callcenter" />
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
                    data-content={t("Help")}
                    onClick={() => {
                      GA.event({
                        category: "Help",
                        action: "Link to Help"
                      });
                    }}
                  >
                    <i className="icon icon-icon_help" />
                  </a>

                  <a
                    href="#desktop-control-panel"
                    id="btnUser"
                    data-toggle="collapse"
                    role="button"
                    aria-expanded="false"
                    aria-controls="desktop-control-panel"
                  >
                    <i className="icon icon-icon-user-profile" />{" "}
                    {this.props.authority.userAuthentication.name}
                    <i className="fa fa-chevron-down" />
                    <i className="fa fa-chevron-up" />
                  </a>

                  {/* Desktop Control Panel - Start */}
                  <div
                    id="desktop-control-panel"
                    className="collapse multi-collapse"
                  >
                    <ul>
                      <li>
                        <a
                          href="logout"
                          onClick={() => {
                            GA.event({
                              category: "Logout",
                              action: "Logout"
                            });
                          }}
                        >
                          {t("Logout")}
                        </a>
                      </li>
                    </ul>
                  </div>
                  {/* Desktop Control Panel - End */}
                </div>
                {/* Desktop Version - End */}

                {/* Mobile Version - Start */}
                <div className="d-flex d-lg-none">
                  {/* <a href="javascript:void(0);" id="btnSearch">
                    <i className="icon icon-search" />
                  </a> */}

                  <a
                    href="#mobile-control-panel"
                    id="btnControlPanel"
                    data-toggle="collapse"
                    role="button"
                    aria-expanded="false"
                    aria-controls="mobile-control-panel"
                  >
                    <i className="fa fa-ellipsis-h" />
                  </a>

                  {/* Mobile Control Panel - Start */}
                  <div
                    id="mobile-control-panel"
                    className="collapse multi-collapse"
                  >
                    <ul>
                      <li className="border-bottom pb-1 mb-3">
                        {this.props.authority.userAuthentication.name}
                      </li>
                      <li>
                        <a
                          href={this.props.appenv.SUPPORT_URL}
                          onClick={() => {
                            GA.event({
                              category: "Help",
                              action: "Link to Help"
                            });
                          }}
                          target="_blank"
                        >
                          Help
                        </a>
                      </li>
                      {this.props.user.legalName.split(",")[1] === " O=SCG1" ||
                      this.props.user.legalName.split(",")[1] === " O=SCGPA" ||
                      this.props.user.legalName.split(",")[1] ===
                        " O=SUPPLIER1" ? (
                        <li>
                          <a
                            href={this.props.appenv.SUPPORT_SCG_URL}
                            onClick={() => {
                              GA.event({
                                category: "myRequests",
                                action: "Link to myRequests"
                              });
                            }}
                            target="_blank"
                          >
                            myRequests
                          </a>
                        </li>
                      ) : (
                        ""
                      )}

                      {this.props.appenv.MULTILANG_CONFIG &&
                      this.props.appenv.MULTILANG_CONFIG.length > 1 ? (
                        <li
                          onClick={() => {
                            this.setState({ languageModalOpen: true });
                          }}
                          style={{
                            cursor: "pointer"
                          }}
                        >
                          <span>
                            Language:{" "}
                            <span className="ml-auto uppercase">
                              {i18n.language}
                            </span>
                          </span>
                        </li>
                      ) : null}
                      <li>
                        <a
                          href="logout"
                          onClick={() => {
                            GA.event({
                              category: "Logout",
                              action: "Logout"
                            });
                          }}
                        >
                          {t("Logout")}
                        </a>
                      </li>
                    </ul>
                  </div>
                  {/* Mobile Control Panel - End */}
                </div>
                {/* Mobile Version - End */}
              </div>
              {/* Panel Control - End */}

              {/* <div className="col-4 d-flex justify-content-end align-items-center px-0">
                                
                                <a href="https://support.b2p.in" id="btnHelp" target="_blank" data-toggle="tooltip" data-placement="bottom" title="Help!" className="with-devider"><i className="fa fa-question-circle"></i></a>
                            </div> */}
            </div>

            <div className="d-flex d-lg-none col-12 p-0 my-3 mt-md-0">
              <SelectChartPopover
                chartShow={this.state.chartShow}
                onFilter={this.onFilter}
              />
            </div>

            {/* <!-- Statistics - Start --> */}
            {this.state.showStat && <DashboardStatistic />}
            {/* <!-- Statistics - End --> */}
            <div className="page-wrapper d-flex flex-wrap">
              <DragDropContext onDragEnd={this.onDragEnd}>
                {columnsFilter.map((column, index) => (
                  <DashboardColumn
                    droppableId={column.droppableId}
                    index={index}
                    key={`DashBoardColumn-${index}`}
                  >
                    {column.items.map((item, index) => {
                      const GraphComponent = this.renderGraph[item.draggableId];
                      return (
                        <DashboardItem
                          draggableId={item.draggableId}
                          index={index}
                          key={`DashboardItem-${index}`}
                        >
                          <GraphComponent user={this.props.user} />
                        </DashboardItem>
                      );
                    })}
                  </DashboardColumn>
                ))}
              </DragDropContext>
            </div>
          </div>
          <ModalAlert
            className="annouecmentA"
            modalSize="modal-lg"
            title={
              annoucementInfo
                ? annoucementInfo.typeA[annoucement.annoucementLanguege].title
                : ""
            }
            visible={
              !isMobile ? this.state.annoucement.annoucementAShow : false
            }
            isHeaderCenter
            children={
              <div className="d-flex flex-wrap px-0">
                <div className="col-12 px-0 d-flex flex-wrap mb-3">
                  {/* <div
                    id="announcement-languages-wrapper"
                    className="col-6 px-0"
                  >
                    <a
                      href="#announcement-languages"
                      id="btnAnnouncementLanguage"
                      data-toggle="collapse"
                      role="button"
                      aria-expanded="false"
                      aria-controls="announcement-languages"
                      className="uppercase d-flex align-items-center"
                    >
                      {annoucement.annoucementLanguege}
                      <i className="fa fa-chevron-down" />
                      <i className="fa fa-chevron-up" />
                    </a>
                    <div
                      id="announcement-languages"
                      className="collapse multi-collapse"
                    >
                      <ul>
                        <li value={"th"}>
                          <a
                            href="javascript:void(0);"
                            onClick={event =>
                              this.handleClickAnnoucementLanguege(event)
                            }
                            data-language="th"
                          >
                            {
                              annoucementInfo.typeA[
                                annoucement.annoucementLanguege
                              ].th
                            }
                          </a>
                        </li>
                        <li value={"en"}>
                          <a
                            href="javascript:void(0);"
                            onClick={event =>
                              this.handleClickAnnoucementLanguege(event)
                            }
                            data-language="en"
                          >
                            {
                              annoucementInfo.typeA[
                                annoucement.annoucementLanguege
                              ].en
                            }
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-6 px-0 text-right">
                    {
                      annoucementInfo.typeA[annoucement.annoucementLanguege]
                        .linkLabel
                    }
                    <a
                      className="ml-1"
                      target="_blank"
                      href={
                        annoucementInfo.typeA[annoucement.annoucementLanguege]
                          .link
                      }
                    >
                      {
                        annoucementInfo.typeA[annoucement.annoucementLanguege]
                          .click
                      }
                    </a>
                  </div> */}
                </div>
                <div className="col-12 px-0 align-items-center justify-content-center d-flex">
                  <img
                    className={"img-fluid"}
                    src={
                      annoucementInfo
                        ? annoucementInfo.typeA[annoucement.annoucementLanguege]
                            .imgURL
                        : ""
                    }
                  />
                </div>
              </div>
            }
            footer={
              <div className="container row">
                <div
                  className="modal-footer col-6 row justify-content-start"
                  style={{
                    borderTop: "0px"
                  }}
                >
                  <input
                    style={{
                      marginTop: "0rem",
                      marginLeft: "0rem",
                      marginRight: "0.3rem",
                      marginBottom: "0.4rem"
                    }}
                    ref="dontShow"
                    checked={this.state.dontShowAnnoucement}
                    onChange={this.handleDontShow}
                    className="form-check-input"
                    type="checkbox"
                  />
                  <label className="">
                    {annoucementInfo
                      ? annoucementInfo.typeA[annoucement.annoucementLanguege]
                          .dontShowLabel
                      : ""}
                  </label>
                </div>

                <div
                  className="modal-footer col-4 row justify-content-start"
                  style={{
                    borderTop: "0px",
                    paddingLeft: "0px"
                  }}
                >
                  <button
                    className="btn  btn-wide"
                    onClick={() => {
                      this.setState({
                        annoucement: {
                          ...this.state.annoucement,
                          annoucementAShow: false
                        }
                      });
                    }}
                  >
                    {annoucementInfo
                      ? annoucementInfo.typeA[annoucement.annoucementLanguege]
                          .closeLabel
                      : ""}
                  </button>
                </div>
              </div>
            }
          />

          <ModalAlert
            className="annouecmentB"
            modalSize="modal-lg"
            visible={
              !isMobile ? this.state.annoucement.annoucementBShow : false
            }
            isHeaderCenter
            hideHeader
            children={
              <div className="d-flex flex-wrap">
                <div className="col-12 px-0 d-flex flex-wrap">
                  <div className="col-7">
                    <h5>{annoucement.selectedItemList.header}</h5>
                  </div>
                  <div className="col-5 pr-1">
                    <h5>
                      {annoucementInfo
                        ? annoucementInfo.typeB[annoucement.annoucementLanguege]
                            .title
                        : ""}
                    </h5>
                    <p>
                      {annoucementInfo
                        ? annoucementInfo.typeB[annoucement.annoucementLanguege]
                            .dateLabel
                        : ""}{" "}
                      :{" "}
                      {annoucementInfo
                        ? annoucementInfo.typeB[annoucement.annoucementLanguege]
                            .date
                        : ""}
                    </p>
                  </div>
                  {/* <div
                    id="announcement-languages-wrapper"
                    className="col-1 px-0 d-flex justify-content-end align-items-start"
                  >
                    <a
                      href="#announcement-languages"
                      id="btnAnnouncementLanguage"
                      data-toggle="collapse"
                      role="button"
                      aria-expanded="false"
                      aria-controls="announcement-languages"
                      className="uppercase d-flex align-items-center"
                    >
                      {annoucement.annoucementLanguege}
                      <i className="fa fa-chevron-down" />
                      <i className="fa fa-chevron-up" />
                    </a>
                    <div
                      id="announcement-languages"
                      className="collapse multi-collapse"
                    >
                      <ul>
                        <li>
                          <a
                            href="javascript:void(0);"
                            onClick={e =>
                              this.handleClickAnnoucementLanguege(e)
                            }
                            data-language="th"
                          >
                            {
                              annoucementInfo.typeB[
                                annoucement.annoucementLanguege
                              ].th
                            }
                          </a>
                        </li>
                        <li>
                          <a
                            href="javascript:void(0);"
                            onClick={e =>
                              this.handleClickAnnoucementLanguege(e)
                            }
                            data-language="en"
                          >
                            {
                              annoucementInfo.typeB[
                                annoucement.annoucementLanguege
                              ].en
                            }
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div> */}
                </div>
                <div className="col-12 px-0 d-flex flex-wrap">
                  <div className="col-7 bg-white align-items-center justify-content-center d-flex">
                    <img
                      className={"img-fluid my-auto"}
                      src={annoucement.selectedItemList.imgURL}
                    />
                  </div>
                  <div id="list-group-wrapper" className="col-5 pl-3 pr-0">
                    <ul
                      className="list-group list-group-flush"
                      style={{ overflowY: "scroll", maxHeight: "300px" }}
                    >
                      {annoucementInfo
                        ? this.renderAnnoucementTypeBItemList()
                        : ""}
                    </ul>
                    <div className="scrollBarOverlay">&nbsp;</div>
                  </div>
                </div>

                <div className="col-12 px-0 d-flex flex-wrap mt-3 mb-0">
                  <div className="col-12 text-right">
                    {annoucementInfo
                      ? annoucementInfo.typeB[annoucement.annoucementLanguege]
                          .linkLabel
                      : ""}
                    <a
                      className="ml-1"
                      target="_blank"
                      href={
                        annoucementInfo
                          ? annoucementInfo.typeB[
                              annoucement.annoucementLanguege
                            ].link
                          : ""
                      }
                    >
                      {annoucementInfo
                        ? annoucementInfo.typeB[annoucement.annoucementLanguege]
                            .click
                        : ""}
                    </a>
                  </div>
                </div>
              </div>
            }
            footer={
              <div className="container row">
                <div
                  className="modal-footer col-6 row justify-content-start"
                  style={{
                    borderTop: "0px"
                  }}
                >
                  <input
                    style={{
                      marginTop: "0rem",
                      marginLeft: "0rem",
                      marginRight: "0.3rem",
                      marginBottom: "0.4rem"
                    }}
                    ref="dontShow"
                    checked={this.state.dontShowAnnoucement}
                    onChange={this.handleDontShow}
                    className="form-check-input"
                    type="checkbox"
                  />
                  <label className="">
                    {annoucementInfo
                      ? annoucementInfo.typeB[annoucement.annoucementLanguege]
                          .dontShowLabel
                      : ""}
                  </label>
                </div>

                <div
                  className="modal-footer col-4 row justify-content-start"
                  style={{
                    borderTop: "0px",
                    paddingLeft: "0px"
                  }}
                >
                  <button
                    className="btn btn-wide"
                    onClick={() => {
                      this.setState({
                        annoucement: {
                          ...this.state.annoucement,
                          annoucementBShow: false
                        }
                      });
                    }}
                  >
                    {annoucementInfo
                      ? annoucementInfo.typeB[annoucement.annoucementLanguege]
                          .closeLabel
                      : ""}
                  </button>
                </div>
              </div>
            }
          />
          <ModalAlert
            title="Language"
            visible={this.state.languageModalOpen}
            button={[
              {
                label: "Close",
                attribute: {
                  className: "btn btn--transparent",
                  onClick: () => {
                    this.setState({ languageModalOpen: false });
                  }
                }
              },
              {
                label: "Save",
                attribute: {
                  className: "btn btn-wide",
                  onClick: () => {
                    i18n.changeLanguage(this.state.language);

                    this.setState({ languageModalOpen: false });
                    setTimeout(function() {
                      window.location.reload();
                    }, 500);
                    GA.event({
                      category: "Language Swticher",
                      action: "Switch Language",
                      label: `language ${language}`
                    });
                  }
                }
              }
            ]}
          >
            <div className="col-12 mt-auto form-group  border-grey">
              <p className="font-bold my-3" />

              {this.props.appenv.MULTILANG_CONFIG &&
              this.props.appenv.MULTILANG_CONFIG.length > 1
                ? this.props.appenv.MULTILANG_CONFIG.map((lang, i) => {
                    return (
                      <div className="custom-control custom-radio border-bottom border-1px mt-2 pb-2">
                        <input
                          type="radio"
                          className="custom-control-input"
                          name="language"
                          id={`${lang}_language`}
                          value={lang}
                          defaultChecked={this.state.language == lang}
                          onChange={() => {
                            this.setState({ language: lang });
                          }}
                        />
                        <label
                          className="custom-control-label"
                          htmlFor={`${lang}_language`}
                        >
                          {t(`common:${lang}`)}
                        </label>
                      </div>
                    );
                  })
                : null}
            </div>
          </ModalAlert>
        </Layout>
      </div>
    );
  }
}
export default withAuth(
  withTranslation(["dashboard", "common", "menu", "detail"])(Dashboard)
);
