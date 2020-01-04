import React, { Component, Fragment } from "react";
import daterangepicker from "daterangepicker";
const queryString = require("query-string");
import { asyncContainer, Typeahead } from "../libs/react-bootstrap-typeahead";
import moment from "moment";
import { SuggestionText, Option } from "../components/page";
const AsyncTypeahead = asyncContainer(Typeahead);
class SearchBox extends Component {
  constructor(props) {
    super(props);
    this.t = false;
    this.state = {
      searchItems: [],
      searchInput: {},
      isLoading: false,
      menukey: "",
      searchResult: {}
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.t) {
      clearTimeout(this.t);
    }
    if (nextProps.searchResult) {
      this.setState({ searchResult: nextProps.searchResult });
    }
    $(".btn-show-more-search").unbind("click");
    this.t = setTimeout(() => {
      $(".btn-show-more-search").on("click", function() {
        $(".box-more-search").toggleClass("active");
        if ($(".box-more-search").hasClass("active") === true) {
          $("span.text-close").hide();
          $("span.text-open").show();
          $(this)
            .find("i.icon")
            .removeClass("icon-arrow_small_down")
            .addClass("icon-arrow_small_up");
        } else {
          $("span.text-close").show();
          $("span.text-open").hide();
          $(this)
            .find("i.icon")
            .removeClass("icon-arrow_small_up")
            .addClass("icon-arrow_small_down");
        }
      });
    }, 1000);
  }
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
      reloadDataTable
    } = this.props;
    this.setState({ menukey });
    if (model && model.form && model.form.sections[0]) {
      this.setState({ searchItems: model.form.sections[0].fields });
    }

    var _this = this;
    var context = this.context;
    let searchInput = localStorage.getItem(`searchInput-${menukey}`);
    let isSearch = false;
    if (searchInput) {
      searchInput = JSON.parse(searchInput);
      isSearch = true;
    } else {
      searchInput = {};
    }
    this.setState({ searchInput, isSearch });

    $(".btn-search").on("click", function() {
      let searchInput = {};
      let isSearch = false;
      $(".input-search").each(function() {
        if ($(this).val()) {
          searchInput[$(this).attr("id")] = $(this)
            .val()
            .trim();
          isSearch = true;
          $(this).val(
            $(this)
              .val()
              .trim()
          );
        }
      });
      if (isSearch) {
        $(".searchRewsultLength").text(0);
        $(".searchBarMobile").css("display", "flex");
      } else {
        $(".searchRewsultLength").text(0);
        $(".searchBarMobile").css("display", "none");
      }

      window.localStorage.setItem(
        `searchInput-${_this.state.menukey}`,
        JSON.stringify(searchInput)
      );
      _this.setState({ searchInput, isSearch, searchResult: {} });
      if (typeof reloadDataTable == "function") {
        if (dataTableUrl.indexOf("?") === -1) {
          reloadDataTable(
            dataTableUrl + "?" + queryString.stringify(searchInput)
          );
        } else {
          reloadDataTable(
            dataTableUrl + "&" + queryString.stringify(searchInput)
          );
        }
      } else {
        alert("reloadDataTable is not set");
      }
      if ($(window).outerWidth() < 576) {
        $(".box-toggle-search").removeClass("active");
      }
    });
    $(".btn-search-reset").on("click", function() {
      let searchInput = {};
      _this.setState({ isSearch: false, searchResult: {} });
      window.localStorage.removeItem(`searchInput-${_this.state.menukey}`);
      $(".input-search,.datepicker").each(function() {
        let clearId = $(this).attr("id");
        _this.setState({ searchInput: { ...searchInput, [clearId]: "" } });

        if ($(this).val() != "") {
          $(this).val("");
        }
        if ($(window).outerWidth() < 576) {
          $(".box-toggle-search").removeClass("active");
        }
        $(".searchRewsultLength").text(0);
        $(".searchBarMobile").hide();
      });
      if (typeof reloadDataTable == "function") {
        reloadDataTable(dataTableUrl);
      } else {
        alert("reloadDataTable is not set");
      }
    });
    $("#btn-toggle-search, #btnSearch").on("click", function(e) {
      e.preventDefault();
      if ($(window).outerWidth() < 576) {
        $(".box-toggle-search").addClass("active");
      }
    });
    $(".remove-toggle-search").on("click", function(e) {
      e.preventDefault();
      if ($(window).outerWidth() < 576) {
        $(".box-toggle-search").removeClass("active");
      }
    });
    $(_this).ready(function() {
      let CalendarFrom = "";
      let CalendarTo = "";
      $("input.datepicker")
        .daterangepicker({
          showDropdowns: true,
          linkedCalendars: true,
          autoApply: true,
          minDate: moment().year(moment().year() - 4),
          maxDate: moment().year(moment().year() + 5),
          locale: {
            cancelLabel: "Clear",
            format: "DD/MM/YYYY"
          },
          template:
            '<div class="daterangepicker ">' +
            '<div class="drp-buttons">' +
            '<span class="drp-selected"></span>' +
            '<button class="cancelBtn" type="button"></button>' +
            '<button class="applyBtn" disabled="disabled" type="button"></button> ' +
            "</div>" +
            '<div class="ranges"></div>' +
            '<div class="drp-calendar left">' +
            '<div class="calendar-table"></div>' +
            '<div class="calendar-time"></div>' +
            "</div>" +
            '<div class="drp-calendar right">' +
            '<div class="calendar-table"></div>' +
            '<div class="calendar-time"></div>' +
            "</div>" +
            "</div>"
        })
        .on("outsideClick.daterangepicker", function(ev, picker) {
          if (!CalendarFrom || !CalendarTo) {
            $("#" + ev.target.id.replace(".", "\\.") + "From").val("");
            $("#" + ev.target.id.replace(".", "\\.") + "To").val("");
            $(this).val("");
          }
        })
        .on("showCalendar.daterangepicker", function(ev) {
          $(".daterangepicker").css("min-width", "490px");
          CalendarFrom = $(
            "#" + ev.target.id.replace(".", "\\.") + "From"
          ).val();
          CalendarTo = $("#" + ev.target.id.replace(".", "\\.") + "To").val();
        })
        .on("apply.daterangepicker", function(ev, picker) {
          $("#" + ev.target.id + "From").val(
            picker.startDate.format("DD/MM/YYYY")
          );
          $("#" + ev.target.id + "To").val(picker.endDate.format("DD/MM/YYYY"));
        })
        .on("cancel.daterangepicker", function(ev) {
          $("#" + ev.target.id.replace(".", "\\.") + "From").val("");
          $("#" + ev.target.id.replace(".", "\\.") + "To").val("");
          $(this).val("");
        });
      $(".btnCalendarClear").on("click", function() {
        let id = $(this)
          .data("id")
          .replace(".", "\\.");

        $("#" + id + "From").val("");
        $("#" + id + "To").val("");
        $("#" + id)
          .data("daterangepicker")
          .clickCancel();
      });

      $("input.datepicker").each(function() {
        $(this).val($(this).data("value"));
      });
      $(".rbt-input").on("keydown keypress", function() {
        $(this).val(
          $(this)
            .val()
            .trimLeft()
        );
        // $(this).val(
        //   $(this)
        //     .val()
        //     .trim()
        // );
      });
    });
  }

  searchInputGeneratorAPI = (searchItem, size, searchInput, i) => {
    const defaultValue = searchInput[searchItem.key] || "";
    if (searchItem.controlType == "dropdown") {
      return (
        <div
          key={i}
          className="col-12 col-sm-4 w-lg-20 col-md-4 pl-2 pr-2 pb-2 pb-md-0"
        >
          <div className="form-group">
            <div className="form-label-group">
              <Option
                id={searchItem.key}
                title={searchItem.title}
                apiurl={searchItem.apiUrl}
                defaultValue={defaultValue}
                apiService={this.props.apiService}
              />
            </div>
          </div>
        </div>
      );
    }
    if (searchItem.controlType == "autocomplete") {
      return (
        <div
          key={i}
          className={`col-12 col-sm-4 w-lg-20 col-md-4 pl-2 pr-2 pb-2 pb-md-0`}
        >
          <div className="form-group">
            <div className="form-label-group">
              <AsyncTypeahead
                inputProps={{
                  id: `${searchItem.key}`,
                  name: `${searchItem.key}`,
                  className: `input-search`,
                  title: `${searchItem.title}`
                }}
                ref={Typeahead => (this.Typeahead = Typeahead)}
                placeholder={searchItem.title}
                defaultInputValue={defaultValue}
                isLoading={this.state.isLoading}
                labelKey={searchItem.displayField}
                minLength={3}
                onInputChange={(text, event) => {}}
                onSearch={async query => {
                  if (query.trim() != "") {
                    this.setState({ isLoading: true });

                    if (this.props.apiService) {
                      const response = await this.props.apiService.callApi({
                        url: `${searchItem.apiUrl}${query.trim()}`,
                        options: { method: "GET" }
                      });

                      if (response.status) {
                        const data = response.data.rows
                          ? response.data.rows
                          : response.data;
                        this.setState({
                          isLoading: false,
                          options: data
                        });
                      }
                    } else {
                      fetch(`${searchItem.apiUrl}${query.trim()}`)
                        .then(resp => resp.json())
                        .then(json =>
                          this.setState({
                            isLoading: false,
                            options: json.data
                          })
                        );
                    }
                  }
                }}
                options={this.state.options}
              />
            </div>
          </div>
        </div>
      );
    }
  };
  render() {
    var searchHidden = {
      display: "none"
    };
    const searchInputGeneratorTextBox = (searchItem, size, searchInput, i) => {
      const defaultValue = searchInput[searchItem.key] || "";
      return (
        <div
          key={i}
          className={`col-12 col-sm-4 w-lg-20 col-md-4 pl-2 pr-2 pb-2 pb-md-0`}
        >
          <div className="form-group">
            <div className="form-label-group">
              <input
                type="text"
                id={searchItem.key}
                className="form-control input-search"
                placeholder={searchItem.title}
                defaultValue={defaultValue}
              />
              <label htmlFor={searchItem.key}>{searchItem.title}</label>
            </div>
          </div>
        </div>
      );
    };
    const searchInputGeneratorDropdown = (
      searchItem,
      size,
      searchInput,
      ii
    ) => {
      const defaultValue = searchInput[searchItem.key] || "";
      return (
        <div
          key={ii}
          className="col-12 col-sm-4 w-lg-20 col-md-4 pl-2 pr-2 pb-2 pb-md-0"
        >
          <div className="form-group">
            <div className="form-label-group">
              <select
                className="custom-select input-search"
                id={searchItem.key}
                placeholder={searchItem.title}
                defaultValue={defaultValue}
              >
                <option key={`${ii}00000`} value="">
                  {searchItem.title}
                </option>
                {searchItem.options.map((r, i) => {
                  return (
                    <option key={i} value={r.value}>
                      {r.text}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      );
    };

    const searchInputGeneratorDate = (searchItem, size, searchInput, i) => {
      const defaultValueFrom =
        searchInput[searchItem.key + "From"] != undefined
          ? searchInput[searchItem.key + "From"]
          : "";
      const defaultValueTo =
        searchInput[searchItem.key + "To"] != undefined
          ? searchInput[searchItem.key + "To"]
          : "";
      const defaultValue =
        defaultValueFrom && defaultValueTo
          ? `${defaultValueFrom} - ${defaultValueTo}`
          : "";
      return (
        <div
          key={i}
          className={`col-12 col-sm-4 w-lg-20 col-md-4 pl-2 pr-2 pb-2 pb-md-0`}
        >
          <input
            type="hidden"
            id={`${searchItem.key}From`}
            className="form-control input-search"
            defaultValue={defaultValueFrom}
          />
          <input
            type="hidden"
            id={`${searchItem.key}To`}
            className="form-control input-search"
            defaultValue={defaultValueTo}
          />
          <div className="form-group">
            <div className="form-label-group">
              <input
                type="text"
                id={searchItem.key}
                className="form-control datepicker"
                readOnly
                name={searchItem.key}
                placeholder={searchItem.title}
                value={defaultValue}
              />

              <label htmlFor={searchItem.key}>
                {searchItem.title}
                <a
                  href="#"
                  className="btnCalendarClear"
                  data-id={searchItem.key}
                />
              </label>
            </div>
          </div>
        </div>
      );
    };

    const searchInputGenerator = (searchItem, i) => {
      var l = this.state.searchItems.length;
      var searchInput = this.state.searchInput;
      if (l <= 5) {
        l = 100 / l;
      } else {
        l = 80 / l;
      }
      switch (searchItem.type || searchItem.controlType) {
        case "text":
          return searchInputGeneratorTextBox(searchItem, l, searchInput, i);
          break;
        case "date":
          return searchInputGeneratorDate(searchItem, l, searchInput, i);
          break;
        case "dropdown":
          return searchInputGeneratorDropdown(searchItem, l, searchInput, i);
          break;
        case "option":
          return searchInputGeneratorDropdown(searchItem, l, searchInput, i);
          break;
        case "api":
          return this.searchInputGeneratorAPI(searchItem, l, searchInput, i);
          break;
        default:
          return searchInputGeneratorTextBox(searchItem, l, searchInput, i);
          break;
      }
    };
    const searchFields = this.state.searchItems.map((searchItem, i) =>
      searchInputGenerator(searchItem, i)
    );
    const MoreSearchFields = props => {
      return (
        <div className="purple mt-3 mb-3">
          <a href="javascript:;" className="btn-show-more-search">
            <span className="text-close text-bold">More Search</span>
            <span className="text-open text-bold">Less Search</span>{" "}
            <i className="icon icon-arrow_small_down" />
          </a>
        </div>
      );
    };
    return (
      <Fragment>
        <div className="box__header box__header--shadow box-toggle-search pb-1">
          {/* <div className="page__header d-sm-none">
            <div className="row align-items-center justify-content-center m-0">
              <div className="col-10 text-center text-lg-left">
                <h2 className="list">Searchs</h2>
              </div>
            </div>
          </div> */}
          <div className="row justify-content-center align-items-center d-sm-none pt-3 pl-2 pr-2">
            <div className="col-4 pl-1 pr-1">
              <a
                className="btn btn--transparent remove-toggle-search w-100"
                href="javascript:;"
              >
                Cancel
              </a>
            </div>
            <div className="col-4 pl-1 pr-1">
              <a
                className="btn btn--transparent btn-search-reset font-bold w-100"
                href="javascript:;"
                onClick={() => {
                  try {
                    this.Typeahead
                      ? this.Typeahead.getInstance().clear()
                      : function() {};
                  } catch (err) {}
                }}
              >
                <i className="icon icon-x" /> Clear
              </a>
            </div>
            <div className="col-4 pl-1 pr-1">
              <button className="btn btn-search w-100" type="button">
                <i className="icon icon-search" /> Search
              </button>
            </div>
          </div>

          <div className="row justify-content-between align-items-center mb-2 d-none d-sm-flex">
            <div className="col">
              <h4>
                Search:
                {this.state.isSearch &&
                this.state.searchResult.recordsTotal > -1
                  ? this.state.searchResult.recordsTotal < 2
                    ? ` ${this.state.searchResult.recordsTotal} Result`
                    : ` ${this.state.searchResult.recordsTotal} Results`
                  : ""}{" "}
              </h4>
            </div>
            <div className="col text-right">
              <a
                className="btn btn--transparent btn-clear mr-2  btn-search-reset"
                href="javascript:;"
                onClick={() => {
                  try {
                    this.Typeahead
                      ? this.Typeahead.getInstance().clear()
                      : function() {};
                  } catch (err) {}
                }}
              >
                <i className="icon icon-x" /> Clear
              </a>
              <button className="btn  btn-search" type="button">
                <i className="icon icon-search" /> Search
              </button>
            </div>
          </div>
          <div className="row justify-content-between align-items-start ml--2 mr--2 pt-3 pt-md-0">
            <div
              className={
                this.state.searchItems.length > 5
                  ? `col-12 col-md-10 pl-2 pr-2 pb-2 pb-md-0 box-more-search  fix-relative`
                  : `col-12 col-md-12 pl-2 pr-2 pb-2 pb-md-0 box-more-search  fix-relative`
              }
            >
              <div className="row justify-content-start align-items-center ml--2 mr--2">
                {searchFields}
              </div>
            </div>
            {this.state.searchItems.length > 5 ? (
              <div className="col-12 col-md-2 pl-2 pr-2 pb-2 pb-md-0 text-center d-none d-md-block">
                <div className="purple mt-3 mb-3">
                  <a href="javascript:;" className="btn-show-more-search">
                    <span className="text-close text-bold">More Search</span>
                    <span className="text-open text-bold">
                      Less Search
                    </span>{" "}
                    <i className="icon icon-arrow_small_down" />
                  </a>
                </div>
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
        <div
          style={searchHidden}
          className="searchBarMobile row justify-content-between bg-lightgray align-items-center m-0 d-sm-none"
        >
          <div className="col pt-3 pb-3">
            <span className="font-large font-bold black">
              Search: <span className="searchRewsultLength">0</span> Results
            </span>
          </div>
          <div className="col text-right pt-3 pb-3">
            <a
              className="font-large btn-clear font-bold btn-search-reset"
              href="javascript:;"
            >
              <i className="icon icon-x small" /> Clear Search
            </a>
          </div>
        </div>
      </Fragment>
    );
  }
}

export default SearchBox;
