import React, { Component, Fragment } from "react";
import ReactDOMServer from "react-dom/server";
import daterangepicker from "daterangepicker";
import queryString from "query-string";
import { asyncContainer, Typeahead } from "../libs/react-bootstrap-typeahead";
import moment from "moment";
import { SuggestionText, Option } from "../components/page";
import GA from "~/libs/ga";
import DatePicker from "react-datepicker";
import Popover, { ArrowContainer } from "react-tiny-popover";
import { Button } from "react-bootstrap";
import { format, parse } from "date-fns";
import Router from "next/router";
import autoDelay from "../configs/delay.typeahead.json";
import { i18n, withTranslation } from "~/i18n";

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
      searchResult: {},
      datePicker: {},
      delayTime: autoDelay["delay_time"],
      isTourOpen: false
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
        if ($(".box-more-search").hasClass("active") === false) {
          $(".box-more-search").addClass("active");
          $("span.text-close").hide();
          $("span.text-open").show();
          $(this)
            .find("i.icon")
            .removeClass("icon-arrow_small_down")
            .addClass("icon-arrow_small_up");
        } else {
          $(".box-more-search").removeClass("active");
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
      GATitle,
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
    let searchInputs = localStorage.getItem(`searchInput-${menukey}`);
    let searchQuery = Router.query;
    let searchInput = {};
    if (_.size(searchQuery) > 0) {
      searchInput = searchQuery;
      // model.form.sections[0].fields.map((searchItem, i) => {
      //   if (searchQuery[searchItem.key] !== undefined) {
      //     searchInput[searchItem.key] = searchQuery[searchItem.key];
      //   }
      // });
    }
    if (_.size(searchInput) < 1 && searchInputs) {
      searchInputs = JSON.parse(searchInputs);
      searchInput = searchInputs;
      // console.log(searchInputs);
      // model.form.sections[0].fields.map((searchItem, i) => {
      //   if (searchInputs[searchItem.key] !== undefined) {
      //     searchInput[searchItem.key] = searchInputs[searchItem.key];
      //   }
      // });
      Router.replace({
        pathname: Router.route,
        query: searchInput
      });
    }
    let isSearch = false;

    if (searchInput) {
      isSearch = true;
    } else {
      searchInput = {};
    }
    this.setState({ searchInput, isSearch });

    $(".btn-search").on("click", function() {
      let searchInput = {};
      let isSearch = false;
      if (typeof _this.props.setSearch == "function") {
        _this.props.setSearch(true);
      }

      $(".input-search").each(function() {
        if ($(this).val()) {
          GA.event({
            category: GATitle,
            action: `Search with critiria`,
            label: $(this).attr("id") + "|" + $(this).val()
          });

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
      if (searchInput.length == 0) {
        GA.event({
          category: GATitle,
          action: `Search without critiria`
        });
      }

      if (isSearch) {
        Router.replace({
          pathname: Router.route,
          query: searchInput
        });
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
      GA.event({
        category: GATitle,
        label: "Search",
        action: "Clear"
      });

      _this.clearInput();
      let searchInput = {};
      Router.replace({
        pathname: Router.route
      });
      _this.setState({ isSearch: false, searchResult: {} });
      window.localStorage.removeItem(`searchInput-${_this.state.menukey}`);
      $(".input-search").each(function() {
        if ($(this).val() != "") {
          $(this).val("");
        }
      });
      $(".input-search, .datepicker").each(function() {
        let clearId = $(this).attr("id");
        if ($(this).val() != "") {
          $(this).val("");
        }
        _this.setState({ searchInput: { ...searchInput, [clearId]: "" } });

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

    $(".btn-clear-mobile").on("click", function() {
      _this.clearInput();
      let searchInput = {};
      Router.replace({
        pathname: Router.route
      });
      _this.setState({ isSearch: false, searchResult: {} });
      window.localStorage.removeItem(`searchInput-${_this.state.menukey}`);
      $(".input-search").each(function() {
        if ($(this).val() != "") {
          $(this).val("");
        }
      });
      $(".input-search, .datepicker").each(function() {
        let clearId = $(this).attr("id");
        if ($(this).val() != "") {
          $(this).val("");
        }
        _this.setState({ searchInput: { ...searchInput, [clearId]: "" } });

        $(".searchRewsultLength").text(0);
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

      // $("input.datepicker")
      //   .daterangepicker({
      //     showDropdowns: true,
      //     linkedCalendars: true,
      //     autoApply: true,
      //     minDate: moment().year(moment().year() - 4),
      //     maxDate: moment().year(moment().year() + 5),
      //     locale: {
      //       cancelLabel: "Clear",
      //       format: "DD/MM/YYYY"
      //     },
      //     template:
      //       '<div class="daterangepicker ">' +
      //       '<div class="drp-buttons">' +
      //       '<span class="drp-selected"></span>' +
      //       '<button class="cancelBtn" type="button"></button>' +
      //       '<button class="applyBtn" disabled="disabled" type="button"></button> ' +
      //       "</div>" +
      //       '<div class="ranges"></div>' +
      //       '<div class="drp-calendar left">' +
      //       '<div class="calendar-table"></div>' +
      //       '<div clas"calendar-time"></div>' +
      //       "</div>" +
      //       '<div class="drp-calendar right">' +
      //       '<div class="calendar-table"></div>' +
      //       '<div class="calendar-time"></div>' +
      //       "</div>" +
      //       "</div>"
      //   })
      //   .on("outsideClick.daterangepicker", function(ev, picker) {
      //     if (!CalendarFrom || !CalendarTo) {
      //       console.log("---outsideClick.datarangepicker---");
      //       $("#" + ev.target.id.replace(".", "\\.") + "From").val("");
      //       $("#" + ev.target.id.replace(".", "\\.") + "To").val("");
      //       $(this).val("");
      //     }
      //   })
      //   .on("showCalendar.daterangepicker", function(ev) {
      //     console.log("---showCalendar.daterangepicker---");
      //     $(".daterangepicker").css("min-width", "490px");
      //     CalendarFrom = $(
      //       "#" + ev.target.id.replace(".", "\\.") + "From"
      //     ).val();
      //     CalendarTo = $("#" + ev.target.id.replace(".", "\\.") + "To").val();
      //   })
      //   .on("apply.daterangepicker", function(ev, picker) {
      //     console.log("---apply.daterangepicker---");
      //     $("#" + ev.target.id + "From").val(
      //       picker.startDate.format("DD/MM/YYYY")
      //     );
      //     $("#" + ev.target.id + "To").val(picker.endDate.format("DD/MM/YYYY"));
      //   })
      //   .on("cancel.daterangepicker", function(ev) {
      //     console.log("---cancel.daterangepicker---");
      //     $("#" + ev.target.id.replace(".", "\\.") + "From").val("");
      //     $("#" + ev.target.id.replace(".", "\\.") + "To").val("");
      //     $(this).val("");
      //   });

      // $(".btnCalendarClear").on("click", function() {
      //   let id = $(this)
      //     .data("id")
      //     .replace(".", "\\.");

      //   $("#" + id + "From").val("");
      //   $("#" + id + "To").val("");
      //   $("#" + id)
      //     .data("daterangepicker")
      //     .clickCancel();
      // });

      // $("input.datepicker").each(function() {
      //   $(this).val($(this).data("value"));
      // });

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

  searchInputGeneratorAPI = (searchItem, size, searchInput, i, t) => {
    const { searchParams = [], lang } = this.props;
    const stringField = queryString.stringify(searchParams);
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
                title={t(`${lang}:${searchItem.title.replace(/[.]/g, "")}`)}
                apiurl={searchItem.apiUrl}
                defaultValue={defaultValue}
                apiService={this.props.apiService}
                t={t}
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
                  className: "input-search",
                  title: t(`${lang}:${searchItem.title.replace(/[.]/g, "")}`)
                }}
                className={"input-search"}
                ref={Typeahead => (this.searchAhead = Typeahead)}
                placeholder={t(searchItem.title.replace(/[.]/g, ""))}
                defaultInputValue={defaultValue}
                isLoading={this.state.isLoading}
                labelKey={searchItem.displayField}
                minLength={3}
                delay={this.state.delayTime}
                onInputChange={(text, event) => {}}
                onSearch={async query => {
                  if (query.trim() != "") {
                    this.setState({ isLoading: true });

                    if (this.props.apiService) {
                      const response = await this.props.apiService.callApi({
                        url: `${
                          searchItem.apiUrl
                        }${query.trim()}&${stringField}`,
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

  handleInvoiceDate() {}

  handleDueDate() {}

  dateFormat(date) {
    const format = `${date.getDate()}/${date.getMonth() +
      1}/${date.getFullYear()}`;
    return format;
  }

  renderCustomDatepicker(
    searchInput,
    searchItem,
    defaultValue,
    defaultValueFrom,
    defaultValueTo,
    i,
    t
  ) {
    const { lang } = this.props;
    return (
      <Popover
        isOpen={this.state.datePicker[`${searchItem.key}Open`] || false}
        position={"bottom"} // preferred position
        containerClassName="react-tiny-popover-container calendarPopover"
        key={i}
        contentLocation={({
          targetRect,
          popoverRect,
          position,
          align,
          nudgedLeft,
          nudgedTop
        }) => {
          const offset = $(`#${searchItem.key}`).offset();
          return {
            left: targetRect.left,
            top: offset.top + 46
          };
        }}
        onClickOutside={event => {
          if (
            event.target.className != "react-datepicker__year-option" &&
            event.target.className != "react-datepicker__month-option" &&
            event.target.className !=
              "react-datepicker__navigation react-datepicker__navigation--previous" &&
            event.target.className !=
              "react-datepicker__navigation react-datepicker__navigation--next"
          ) {
            this.setState({
              datePicker: {
                ...this.state.datePicker,
                [`${searchItem.key}Open`]: false
              }
            });
          }
        }}
        align={"end"}
        content={({ position, targetRect, popoverRect }) => (
          <div className="the-arrow">
            <ArrowContainer // if you'd like an arrow, you can import the ArrowContainer!
              position={position}
              targetRect={targetRect}
              popoverRect={popoverRect}
              arrowColor={"white"}
              arrowSize={10}
              arrowStyle={{ left: "20.578px" }}
            >
              <div
                style={{
                  backgroundColor: "white",
                  boxShadow: "0px 0px 30px gray",
                  paddingTop: "10px",
                  paddingBottom: "10px",
                  paddingLeft: "10px",
                  paddingRight: "10px"
                }}
              >
                <div
                  className="duration-header"
                  style={{
                    marginBottom: "10px",
                    display: "block",
                    height: "40px"
                  }}
                >
                  <h6 style={{ float: "left" }}>
                    Duration :{" "}
                    {(this.state.datePicker[`${searchItem.key}Start`]
                      ? format(
                          this.state.datePicker[`${searchItem.key}Start`],
                          "DD/MM/YYYY"
                        )
                      : "") +
                      (this.state.datePicker[`${searchItem.key}End`]
                        ? ` - ${format(
                            this.state.datePicker[`${searchItem.key}End`],
                            "DD/MM/YYYY"
                          )}`
                        : "")}
                  </h6>
                  {/* <Button
                      style={{ marginleft: "10px", float: "right" }}
                      className="applyBtn"
                      type="button"
                      onClick={() =>
                        this.setState({
                          isInvDatepickerOpen: !this.state.isInvDatepickerOpen
                        })
                      }
                    >
                      Apply
                    </Button>
                    <Button
                      style={{ float: "right", marginRight: "10px" }}
                      className="cancelBtn"
                      type="button"
                      onClick={() =>
                        this.setState({
                          invoiceDate: {
                            start: "",
                            end: ""
                          }
                        })
                      }
                    >
                      Clear
                    </Button> */}
                </div>

                <div style={{ display: "inline-block" }}>
                  <h6>
                    From :{" "}
                    {this.state.datePicker[`${searchItem.key}Start`]
                      ? format(
                          this.state.datePicker[`${searchItem.key}Start`],
                          "DD/MM/YYYY"
                        )
                      : ""}
                  </h6>
                  <DatePicker
                    inline
                    fixedHeight
                    showMonthDropdown
                    showYearDropdown
                    selectsStart
                    hideHeader
                    selected={
                      this.state.datePicker[`${searchItem.key}Start`] || null
                    }
                    startDate={
                      this.state.datePicker[`${searchItem.key}Start`] || null
                    }
                    endDate={
                      this.state.datePicker[`${searchItem.key}End`] || null
                    }
                    maxDate={
                      this.state.datePicker[`${searchItem.key}End`] || null
                    }
                    onChange={date => {
                      this.setState({
                        datePicker: {
                          ...this.state.datePicker,
                          [`${searchItem.key}Start`]: date
                        }
                      });
                    }}
                  />
                </div>

                <div style={{ display: "inline-block" }}>
                  <h6>
                    To :{" "}
                    {this.state.datePicker[`${searchItem.key}End`]
                      ? format(
                          this.state.datePicker[`${searchItem.key}End`],
                          "DD/MM/YYYY"
                        )
                      : ""}
                  </h6>
                  <DatePicker
                    inline
                    fixedHeight
                    showMonthDropdown
                    showYearDropdown
                    selectsEnd
                    hideHeader
                    selected={
                      this.state.datePicker[`${searchItem.key}End`] || null
                    }
                    startDate={
                      this.state.datePicker[`${searchItem.key}Start`] || null
                    }
                    endDate={
                      this.state.datePicker[`${searchItem.key}End`] || null
                    }
                    minDate={
                      this.state.datePicker[`${searchItem.key}Start`] || null
                    }
                    onChange={date =>
                      this.setState({
                        datePicker: {
                          ...this.state.datePicker,
                          [`${searchItem.key}End`]: date
                        }
                      })
                    }
                  />
                </div>
              </div>
            </ArrowContainer>
          </div>
        )}
      >
        <div
          key={i}
          className={`col-12 col-sm-4 w-lg-20 col-md-4 pl-2 pr-2 pb-2 pb-md-0`}
        >
          <input
            type="hidden"
            id={`${searchItem.key}From`}
            className="form-control input-search"
            // defaultValue={defaultValueFrom}
            value={
              this.state.datePicker[`${searchItem.key}Start`]
                ? format(
                    this.state.datePicker[`${searchItem.key}Start`],
                    "DD/MM/YYYY"
                  )
                : ""
            }
          />
          <input
            type="hidden"
            id={`${searchItem.key}To`}
            className="form-control input-search"
            // defaultValue={defaultValueTo}
            value={
              this.state.datePicker[`${searchItem.key}End`]
                ? format(
                    this.state.datePicker[`${searchItem.key}End`],
                    "DD/MM/YYYY"
                  )
                : ""
            }
          />
          <div className="form-group">
            <div className="form-label-group">
              <input
                type="text"
                id={searchItem.key}
                className="form-control datepicker"
                readOnly
                name={searchItem.key}
                placeholder={t(`${lang}:${searchItem.title}`)}
                value={
                  (this.state.datePicker[`${searchItem.key}Start`]
                    ? format(
                        this.state.datePicker[`${searchItem.key}Start`],
                        "DD/MM/YYYY"
                      )
                    : searchInput[`${searchItem.key}From`]
                    ? searchInput[`${searchItem.key}From`]
                    : "") +
                  (this.state.datePicker[`${searchItem.key}End`]
                    ? ` - ${format(
                        this.state.datePicker[`${searchItem.key}End`],
                        "DD/MM/YYYY"
                      )}`
                    : searchInput[`${searchItem.key}To`]
                    ? " - " + searchInput[`${searchItem.key}To`]
                    : "")
                }
                onClick={() =>
                  this.setState({
                    datePicker: {
                      ...this.state.datePicker,
                      [`${searchItem.key}Open`]: true
                    }
                  })
                }
              />
              <label htmlFor={searchItem.key}>
                {t(`${lang}:${searchItem.title}`)}
                <a
                  href="#"
                  className="btnCalendarClear"
                  data-id={searchItem.key}
                  onClick={() =>
                    this.setState({
                      datePicker: {
                        ...this.state.datePicker,
                        [`${searchItem.key}Start`]: "",
                        [`${searchItem.key}End`]: ""
                      }
                    })
                  }
                />
              </label>
            </div>
          </div>
        </div>
      </Popover>
    );
  }

  clearInput() {
    try {
      this.setState({
        datePicker: {}
      });
      this.searchAhead.getInstance().clear();
    } catch (err) {}
  }

  render() {
    const { t, lang } = this.props;
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
                placeholder={t(`${lang}:${searchItem.title}`)}
                defaultValue={defaultValue}
              />
              <label htmlFor={searchItem.key}>
                {t(`${lang}:${searchItem.title.replace(/[.]/g, "")}`)}
              </label>
            </div>
          </div>
        </div>
      );
    };
    const searchInputGeneratorDropdown = (
      searchItem,
      size,
      searchInput,
      ii,
      t
    ) => {
      const defaultValue = searchInput[searchItem.key] || "";
      const { lang } = this.props;

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
                // placeholder={t(
                //   searchItem.title.replace(/[.]/g, "")
                // )}
                defaultValue={defaultValue}
              >
                <option key={`${ii}00000`} value="">
                  {t(`${lang}:${searchItem.title.replace(/[.]/g, "")}`)}
                </option>
                {searchItem.options.map((r, i) => {
                  return (
                    <option key={i} value={r.value}>
                      {t(r.text.replace(/[.]/g, ""))}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      );
    };

    const searchInputGeneratorDate = (searchItem, size, searchInput, i, t) => {
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

      return this.renderCustomDatepicker(
        searchInput,
        searchItem,
        defaultValue,
        defaultValueFrom,
        defaultValueTo,
        i,
        t
      );
    };

    const searchInputGenerator = (searchItem, i, t) => {
      var l = this.state.searchItems.length;
      var searchInput = this.state.searchInput;
      const defaultValue = searchInput[searchItem.key] || "";
      if (l <= 5) {
        l = 100 / l;
      } else {
        l = 80 / l;
      }
      if (defaultValue != "" && defaultValue != undefined && i > 4) {
        $(".box-more-search").addClass("active");
        $("span.text-close").hide();
        $("span.text-open").show();
      }
      switch (searchItem.type || searchItem.controlType) {
        case "text":
          return searchInputGeneratorTextBox(searchItem, l, searchInput, i, t);
          break;
        case "date":
          return searchInputGeneratorDate(searchItem, l, searchInput, i, t);
          break;
        case "dropdown":
          return searchInputGeneratorDropdown(searchItem, l, searchInput, i, t);
          break;
        case "option":
          return searchInputGeneratorDropdown(searchItem, l, searchInput, i, t);
          break;
        case "api":
          return this.searchInputGeneratorAPI(searchItem, l, searchInput, i, t);
          break;
        default:
          return searchInputGeneratorTextBox(searchItem, l, searchInput, i, t);
          break;
      }
    };
    const searchFields = this.state.searchItems.map((searchItem, i) => {
      return searchInputGenerator(searchItem, i, t);
    });
    const MoreSearchFields = props => {
      return (
        <div className="purple mt-3 mb-3">
          <a href="javascript:;" className="btn-show-more-search">
            <span className="text-close text-bold">{t("More Search")}</span>
            <span className="text-open text-bold">{t("Less Search")}</span>{" "}
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
                {t("Cancel")}
              </a>
            </div>
            <div className="col-4 pl-1 pr-1">
              <a
                className="btn btn--transparent btn-clear-mobile font-bold w-100"
                href="javascript:;"
                // onClick={() => this.clearInput()}
              >
                <i className="icon icon-x" /> {t("Clear")}
              </a>
            </div>
            <div className="col-4 pl-1 pr-1">
              <button id="S1" className="btn btn-search w-100" type="button">
                <i className="icon icon-search" /> {t("Search")}
              </button>
            </div>
          </div>

          <div className="row justify-content-between align-items-center mb-2 d-none d-sm-flex">
            <div className="col">
              <h4>
                {t("Search1")}:
                {this.state.searchResult.recordsTotal > -1
                  ? this.state.searchResult.recordsTotal < 2
                    ? ` ${this.state.searchResult.recordsTotal} ${t("Result")}`
                    : ` ${this.state.searchResult.recordsTotal} ${t("Results")}`
                  : ""}{" "}
              </h4>
            </div>
            <div className="col text-right">
              <a
                className="btn btn--transparent mr-2  btn-search-reset"
                href="javascript:;"
                // onClick={() => this.clearInput()}
              >
                <i className="icon icon-x" /> {t("Clear")}
              </a>
              <button id="S2" className="btn  btn-search" type="button">
                <i className="icon icon-search" /> {t("Search")}
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
                    <span className="text-close text-bold">
                      {t("More Search")}
                    </span>
                    <span className="text-open text-bold">
                      {t("Less Search")}
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
              {t("Search1")}: <span className="searchRewsultLength">0</span>{" "}
              {t("Results")}
            </span>
          </div>
          <div className="col text-right pt-3 pb-3">
            <a
              className="font-large btn-clear-mobile font-bold btn-search-reset"
              href="javascript:;"
            >
              <i className="icon icon-x small" /> {t("Clear Search")}
            </a>
          </div>
        </div>
      </Fragment>
    );
  }
}

export default withTranslation(["search-box"])(SearchBox);
