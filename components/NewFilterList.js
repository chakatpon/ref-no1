import React, { Component, Fragment } from "react";
import SearchBox from "./SearchBox";
import DataTable from "datatables.net-bs4";
const queryString = require("query-string");
import _ from "lodash";
import "datatables.net-buttons";
import { i18n, withTranslation } from "~/i18n";

import "datatables.net-buttons/js/buttons.html5.min";
import "datatables.net-colreorder";
import "datatables.net-fixedheader";
import "datatables.net-responsive";
import "datatables.net-rowgroup";
import "jquery-datatables-checkboxes";
import dTable from "../libs/dt";
import dTableNew from "../libs/dtNew";
import ColumnModal from "../components/column-modal";
import BlockUi from "react-block-ui";
import { Loader, Types } from "react-loaders";
import Link from "next/link";
import Router from "next/router";
import { PageHeader } from "../components/page";
import { COMMON_CONSTANT } from "../context/common-context";
import CordaService from "../services/CordaService";
import OffchainService from "../services/OffchainService";
import StandardService from "../services/StandardService";
import { tokensToFunction } from "path-to-regexp";
import { MIN_WIDTH_COLUMN_TH } from "~/configs/constant";

class NewFilterList extends Component {
  constructor(props) {
    super(props);
    this.cordaService = new CordaService();
    this.offchainService = new OffchainService();
    this.standardService = new StandardService();
    this.hideBlocking = this.hideBlocking.bind(this);
    this.forceReload = this.forceReload.bind(this);
    this.cancelAction = this.cancelAction.bind(this);
    this.reloadDataTable = this.reloadDataTable.bind(this);
    this.columnRender;
    this.updateResults = this.updateResults.bind(this);
    this.state = {
      blocking: false,
      itemFilter: "all",
      searchResult: {},
      ...this.props
    };
  }
  reloadDataTable = url => {
    const { t } = this.props;
    const { itemFilter } = this.state;
    $(".btn-search").html(
      `<i class="fa fa-spinner fa-spin" /> ${t("search-box:Searching")}`
    );
    $(".btn-search").prop("disabled", true);
    $(".btn-search").css("cursor", "not-allowed");
    if (i18n.language === "th") {
      $(".datatable thead tr th:nth-child(n+1)").each(function(i) {
        let html = $(this).html();
        $(this).css("min-width", MIN_WIDTH_COLUMN_TH);
        $(this).html(`${html}`);
      });
    }
    let searchInputs = localStorage.getItem(
      `searchInput-${this.state.menukey}`
    );
    let searchInput = {};
    let searchQuery = Router.query;

    if (itemFilter == "onHold") {
      if (searchQuery.isOnHold) {
        if (_.size(searchInput) < 1 && searchInputs) {
          searchInputs = JSON.parse(searchInputs);
          searchInput = searchInputs;
        }
        //url = `${url}&isOnHold=true`;
        searchInput["isOnHold"] = "true";
      } else {
        if (_.size(searchInput) < 1 && searchInputs) {
          searchInputs = JSON.parse(searchInputs);
          searchInput = searchInputs;
        }
        // url = `${url}&isOnHold=true`;
        searchInput["isOnHold"] = "true";
      }
    } else {
      if (searchQuery.isOnHold) {
        if (_.size(searchInput) < 1 && searchInputs) {
          searchInputs = JSON.parse(searchInputs);
          searchInput = searchInputs;
        }
        // url = url.replace("&isOnHold=true", "");
        delete searchInput.isOnHold;
      } else {
        if (_.size(searchInput) < 1 && searchInputs) {
          searchInputs = JSON.parse(searchInputs);
          searchInput = searchInputs;
        }
      }
    }

    Router.replace({
      pathname: Router.route,
      query: searchInput
    });
    if (searchInput) {
      let q = queryString.stringify(searchInput);
      let splitUrl = url.split("?");
      if (!this.state.isSearch) {
        url = `${url}&${q}`;
      }
    }
    this.dts.ajax.url(url).load();
    this.setSearch(false);
  };
  forceReload = async () => {
    let { columnRender } = this.props;
    if (typeof columnRender == "function") {
      columnRender();
    }
  };
  hideBlocking = () => {
    const { t } = this.props;
    $(".btn-search").html(
      `<i class="icon icon-search" /> ${t("search-box:Search")}`
    );
    $(".btn-search").prop("disabled", false);
    $(".btn-search").css("cursor", "pointer");
  };

  componentWillReceiveProps(props) {
    const { refresh } = this.props;
    if (props.refresh !== refresh) {
      this.dts
        .rows()
        .invalidate("data")
        .draw(false);
    }
  }

  setSearch = isSearch => {
    this.setState({
      isSearch: isSearch
    });
  };

  reRenderDatatable = () => {
    let { dataTableUrl, columnList, model, fixHeader, t } = this.props;
    const translateLabel = {};
    const _this = this;
    if (fixHeader === undefined) {
      fixHeader = true;
    }
    let searchInputs = localStorage.getItem(
      `searchInput-${this.state.menukey}`
    );
    let searchQuery = Router.query;
    let isSearch = false;

    let searchInput = {};
    if (_.size(searchQuery) > 0) {
      searchInput = searchQuery;
    }
    if (_.size(searchInput) < 1 && searchInputs) {
      searchInputs = JSON.parse(searchInputs);
      searchInput = searchInputs;
    }

    if (searchInput) {
      //searchInput = JSON.parse(searchInput);
      if (dataTableUrl.indexOf(dataTableUrl) > -1) {
        if (!("ref" in searchInput)) {
          let q = queryString.stringify(searchInput);
          let splitUrl = dataTableUrl.split("?");
          if (q != "") {
            if (splitUrl.length > 1) {
              dataTableUrl = `${dataTableUrl}&${q}`;
            } else {
              dataTableUrl = `${dataTableUrl}?${q}`;
            }
          }
        }
      }
    } else {
      searchInput = {};
    }

    translateLabel.show = t("Show");
    translateLabel.perPage = t("Per Page");

    if (
      dataTableUrl.indexOf("corda") !== -1 ||
      dataTableUrl.indexOf("offchain") !== -1 ||
      dataTableUrl.indexOf("standard") !== -1
    ) {
      return new dTableNew(
        this,
        model,
        columnList,
        dataTableUrl,
        this.props,
        translateLabel
      );
    } else {
      return new dTable(
        this,
        _this,
        model,
        columnList,
        dataTableUrl,
        _this.props,
        translateLabel
      );
    }
  };
  componentDidMount() {
    const {
      title,
      breadcrumb,
      showSearchbox,
      dataTableUrl,
      columnList,
      model,
      dtClickAction,
      dtButton,
      saveColumnUrl,
      menukey,
      t,
      lang
    } = this.props;
    const columnDisplayText = t(`${lang}:Column Display`);
    const exportText = t(`${lang}:Export`);

    if (typeof dtClickAction == "function") {
      this.dtClickAction = dtClickAction;
    }

    const _this = this;

    $.fn.dataTable.ext.errMode = "log";

    var dts = this.reRenderDatatable();
    dts
      .on("init preDraw", function() {})
      .on("preXhr", function() {})
      .on("xhr.dt", function(e, settings, json, xhr) {
        if (json && json.recordsTotal) {
          $(".searchRewsultLength").text(json.recordsTotal);
        }
        if (_this.updateResults) {
          _this.updateResults(json);
        }
        _this.hideBlocking();
        if (_this.props.onAfterLoad) {
          _this.props.onAfterLoad(e, settings, json, xhr);
        }
      })
      .on("draw", function(e, settings, json, xhr) {
        $(".btn-wrap.filter").html(
          `<strong class="mr-3">${t(
            "Filter"
          )}:</strong><a id="all" href="javascript:void(0);">${t(
            "All"
          )}</a><a id="onHold" href="javascript:void(0);">${t("On Hold")}</a>`
        );
        console.log("DATA F", _this.props.currentDataTableData);
        if (_this.props.currentDataTableData.isOnHold) {
          $("#all").removeClass("active");
          $("#onHold").addClass("active");
          window.localStorage.setItem(`searchInput-inv-filter`, "onHold");
        } else {
          $("#all").addClass("active");
          $("#onHold").removeClass("active");
          window.localStorage.setItem(`searchInput-inv-filter`, "all");
        }

        $("#all").on("click", () => {
          _this.updateItemFilter("all");
        });
        $("#onHold").on("click", () => {
          _this.updateItemFilter("onHold");
        });
        $(".datatable tbody tr td:nth-child(n+1)").each(function(i) {
          let html = $(this).html();
          let text = $(this).text();

          if ($(this).hasClass("list-display-popover")) {
            //let title = "";
            var idx = dts.cell($(this)).index().column;
            var title = dts.columns(idx).header();
            //var title = table.columns(i - 1).header();
            // if (columnList[i - 1]) {
            //   title = columnList[i].title;
            // }

            $(this).attr("data-toggle", "popover");
            $(this).attr("title", $(title).text());
            $(this).attr("data-content", text);
          }
          if (i18n.language === "th")
            $(this).css("min-width", MIN_WIDTH_COLUMN_TH);
          $(this).html(`${html}`);
        });

        if (i18n.language === "th") {
          $(".datatable thead tr th:nth-child(n+1)").each(function(i) {
            let html = $(this).html();
            $(this).css("min-width", MIN_WIDTH_COLUMN_TH);
            $(this).html(`${html}`);
          });
        }

        try {
          makePopover(columnDisplayText, exportText);
        } catch (err) {
          console.warn(err.message);
        }
        $(".datatable tbody tr td:nth-child(1)").each(function(i) {
          let seq = settings._iDisplayStart + i + 1;
          let html = $(this).html();
          $(this).html(`${html}<div class="row-number">${seq}</div>`);
        });
        dts.cells(".dtClickAction").every(function __triggerAction() {
          const cell = this;
          const anchor = $(cell.node()).find("a");
          const href = anchor.attr("href");
          anchor.click(function __actionOnClick(event) {
            event.preventDefault();
            if (_this.dtClickAction) {
              _this.dtClickAction(href, anchor);
            }
          });
        });
        if (_this.props.onAfterDraw) {
          _this.props.onAfterDraw(e, settings, json, xhr);
        }
        // set all select box
        let checkBoxChildren = $(
          "tbody tr td:first-child input[type=checkbox]"
        );
        let checkBoxParent = $("thead tr th:first-child input[type=checkbox]");

        checkBoxParent.on("click", function(e) {
          let selectedCheckboxIds = [];
          if ($(this).is(":checked")) {
            checkBoxChildren.each(function(index, value) {
              if (!value.disabled) {
                $(this).prop("checked", true);
              }
            });

            checkBoxChildren.each((index, value) => {
              if (!value.disabled && value.id) {
                selectedCheckboxIds.push(value.id);
              }
            });
          } else {
            checkBoxChildren.prop("checked", false);
            selectedCheckboxIds = [];
          }
          _this.props.updateSelectedCheckboxIds(selectedCheckboxIds);
        });

        checkBoxChildren.on("click", function(e) {
          let checkBoxAll = 0;
          let selectedCheckboxIds = [];

          checkBoxChildren.each((index, value) => {
            if (!value.disabled) {
              checkBoxAll++;
              if (value.checked && value.id) selectedCheckboxIds.push(value.id);
            }
          });

          if (checkBoxAll === selectedCheckboxIds.length) {
            checkBoxParent.prop("checked", true);
          } else {
            checkBoxParent.prop("checked", false);
          }
          _this.props.updateSelectedCheckboxIds(selectedCheckboxIds);
        });
        let checkBoxNotDisable = 0;
        checkBoxChildren.each((index, value) => {
          if (!value.disabled) {
            checkBoxNotDisable++;
          }
        });
        if (checkBoxNotDisable === 0) {
          checkBoxParent.prop("disabled", true);
        }
      });

    if (typeof dtButton == "function") {
      dtButton();
    }

    if (typeof saveColumnUrl == "string") {
      this.columnSorting(dts, columnList, _this, saveColumnUrl);
    }

    $(function() {
      $(".modal-backdrop").remove();
    });

    // $('[data-toggle="popover"]').popover();
  }

  updateResults(res) {
    if (res.data === undefined) {
      res = {
        recordsTotal: 0,
        recordsFiltered: 0,
        data: [],
        columns: []
      };
    }
    if (typeof this.props.updateResults == "function") {
      this.props.updateResults(res);
    }
    this.setState({ searchResult: res });
  }
  reSorting = () => {
    return Sortable.create(document.getElementById("currentColumn"), {
      group: "column",
      animation: 150,
      onAdd: function(evt) {},
      onUpdate: function(evt) {},
      onRemove: function(evt) {},
      onStart: function(evt) {},
      onEnd: function(evt) {}
    });
  };
  columnSorting = (dts, columns, _this, saveColumnUrl) => {
    var _this = this;
    const { menukey } = this.props;

    let columnListDefault = [];
    columns
      .filter(r => r.defaultOrder)
      .map(r => {
        columnListDefault.splice(r.defaultOrder - 1, 0, r);
      });

    var sort = this.reSorting();
    this.sort = sort;
    let currentColumn = $(`.column-display-${menukey} #currentColumn`).html();
    let allColumn = $(`.column-display-${menukey} #allColumn`).html();
    _this.setState({ currentColumn, allColumn });
    $(".btn-save-column").on("click", async function() {
      var a = sort.toArray();
      if (a.length < 1) {
        alert("ไม่สามารถบันทึก Column ว่างได้");
        return false;
      }
      localStorage.removeItem("B2PTable_" + btoa(_this.props.url));
      var cols = [];
      var b = [];
      for (var aa in a) {
        let idx = dts.column(columns[a[aa]].name).indexes();
        cols.push(columns[a[aa]].searchKey);
      }
      $(`.column-display-${menukey} #currentColumn`)
        .find(".li")
        .each(function(e) {
          b.push($(this).data("id"));
        });
      $(`.column-display-${menukey} #allColumn`)
        .find(".li")
        .each(function(e) {
          b.push($(this).data("id"));
        });
      dts.columns().visible(false);
      dts.columns(a).visible(true, false);

      $(_this.el).css("width", "100%");

      let apiService = null;

      if (saveColumnUrl.indexOf("corda") !== -1) {
        apiService = _this.cordaService;
      } else if (saveColumnUrl.indexOf("offchain") !== -1) {
        apiService = _this.offchainService;
      } else if (saveColumnUrl.indexOf("standard") !== -1) {
        apiService = _this.standardService;
      }

      if (apiService) {
        const response = await apiService.callApi({
          url: saveColumnUrl,
          options: { method: "POST" },
          requestParams: { colSeq: cols.join() }
        });

        if (!response.status) {
          alert(response.message);
        }

        _this.forceReload();
      } else {
        $.post(saveColumnUrl + "?colSeq=" + cols.join())
          .done(function(res) {
            if (res.status == 200) {
            } else {
              alert("บันทึกการตั้งค่า Column ผิดพลาดจากระบบ");
            }
            _this.forceReload();
          })
          .fail(function(err) {
            alert("ไม่สามารถบันทึกการตั้งค่า Column ได้");
          });
      }
    });

    $("body").on("click", "button.add-all", function() {
      $(this)
        .removeClass("add")
        .addClass("disabled");

      var element = $(`.column-display-${menukey} #allColumn`).each(function() {
        var li_element = $(this).html();
        $(`.column-display-${menukey} #currentColumn`).append(li_element);
      });
      $(`.column-display-${menukey} #allColumn`)
        .find(".li")
        .remove();
      $(`.column-display-${menukey} #currentColumn`)
        .find(".li button")
        .removeClass("add")
        .addClass("remove");
    });

    $("body").on("click", "button.remove-all", function() {
      $(`.column-display-${menukey} #currentColumn li`).each(function() {
        var li_element = $(this);
        if (li_element.length == 1) {
          $(`.column-display-${menukey} #allColumn`).append(
            '<li data-id="' +
              li_element.data("id") +
              '" class="' +
              li_element.attr("class") +
              '" id="' +
              li_element.attr("id") +
              '" data-name="' +
              li_element.attr("data-name") +
              '">' +
              li_element.html() +
              "</li>"
          );
          $(this).remove();
        }
      });
      columnListDefault.map(function(r) {
        var li_element = $(
          `.column-display-${menukey} #allColumn li#${r.data.replace(
            COMMON_CONSTANT.REGEX_ID_HTML,
            "_"
          )}`
        );
        if (li_element.length == 1) {
          $(`.column-display-${menukey} #currentColumn`).append(
            '<li data-id="' +
              li_element.data("id") +
              '" class="' +
              li_element.attr("class") +
              '" id="' +
              li_element.attr("id") +
              '" data-name="' +
              li_element.attr("data-name") +
              '">' +
              li_element.html() +
              "</li>"
          );
          li_element.remove();
        }
      });

      $(`.column-display-${menukey} #currentColumn`)
        .find(".li button")
        .removeClass("add")
        .addClass("remove");
      $(`.column-display-${menukey} #allColumn`)
        .find(".li button")
        .removeClass("remove")
        .addClass("add");
    });

    $("body").on(
      "click",
      `.column-display-${menukey} #allColumn button`,
      function() {
        $(this)
          .removeClass("add")
          .addClass("remove");
        var element = $(this).parents(".li");
        var target = $(`.column-display-${menukey} #currentColumn`);

        target.append(
          '<li data-id="' +
            element.data("id") +
            '" class="' +
            element.attr("class") +
            '" id="' +
            element.attr("id") +
            '" data-name="' +
            element.attr("data-name") +
            '">' +
            element.html() +
            "</li>"
        );
        $(this)
          .parents(".li")
          .remove();
      }
    );

    $("body").on(
      "click",
      `.column-display-${menukey} #currentColumn .li:not(".fixed") button`,
      function() {
        var element = $(this).parents(".li");
        var ul = element.parents("ul");
        if (ul === undefined) {
          return false;
        }
        if (ul.find("li").length < 2) {
          alert("คุณไม่สามารถลบ Column ทั้งหมดได้");
          return false;
        }
        $(this)
          .removeClass("remove")
          .addClass("add");
        var target = $(`.column-display-${menukey} #allColumn`);
        target.append(
          '<li data-id="' +
            element.data("id") +
            '" class="' +
            element.attr("class") +
            '" id="' +
            element.attr("id") +
            '" data-name="' +
            element.attr("data-name") +
            '">' +
            element.html() +
            "</li>"
        );
        $(this)
          .parents(".li")
          .remove();
      }
    );
    $(window).on("scroll", function() {
      let fix = $(".fixedHeader-floating");
      if (fix.length > 0) {
        $(".fixedHeader-floating").css("width", $(".table__wrapper").width());
        $(".fixedHeader-floating").scrollLeft(
          $(".dataTables_scrollBody").scrollLeft()
        );
      }
    });

    $(".dataTables_scrollBody").scroll(function() {
      $(".fixedHeader-floating").scrollLeft($(this).scrollLeft());
      $(".fixedHeader-floating").css("width", $(".table__wrapper").width());
    });
    this.dts = dts;
  };

  updateItemFilter = itemFilter => {
    this.props.updateViewing(itemFilter);
    this.setState({ itemFilter });
    this.reloadDataTable(this.state.dataTableUrl);
  };

  cancelAction = () => {
    const { menukey } = this.props;
    let currentColumn = this.state.currentColumn;
    let allColumn = this.state.allColumn;
    $(`.column-display-${menukey} #currentColumn`).html(currentColumn);
    $(`.column-display-${menukey} #allColumn`).html(allColumn);
  };
  componentWillUnmount() {
    $("body").unbind("click");
    $(window).unbind("scroll");
    $(".dataTables_scrollBody").unbind("scroll");
    $(".fixedHeader-floating").remove();
  }
  render() {
    const { title, breadcrumbs, showSearchbox, columnList } = this.props;
    return (
      <Fragment>
        <PageHeader title={title} breadcrumbs={breadcrumbs} {...this.props} />
        <section className="box box--width-header pb-0 pb-lg-3">
          {/* Search Box - Start */}
          {showSearchbox == true || showSearchbox == "true" ? (
            <SearchBox
              {...this.props}
              {...this.state}
              setSearch={this.setSearch}
              reloadDataTable={this.reloadDataTable}
            />
          ) : (
            <div className="box__header box__header-blank">
              <div className="page__header d-sm-none" />
            </div>
          )}

          {/* Search Box - End */}
          <BlockUi
            tag="div"
            blocking={this.state.blocking}
            loader={
              <Loader active type="ball-spin-fade-loader" color="#af3694" />
            }
          >
            <div className="box__inner box__inner--table">
              <div className="table__wrapper">
                <table className="table datatable" ref={el => (this.el = el)} />
              </div>
            </div>
          </BlockUi>
        </section>
        <ColumnModal
          title="Column List"
          columnList={columnList}
          cancelAction={this.cancelAction}
          {...this.props}
          {...this.state}
        />
      </Fragment>
    );
  }
}

export default withTranslation(["inv-list", "search-box", "detail"])(
  NewFilterList
);
