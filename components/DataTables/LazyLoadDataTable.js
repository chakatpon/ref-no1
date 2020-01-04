import React, { Component, Fragment } from "react";
import BlockUi from "react-block-ui";

import ResponseService from "../../services/ResponseService";
import HelpButton from "../HelpButton";
import SearchBox from "../SearchBox";

import { customFieldMapping } from "./utilities";

class LazyLoadDataTable extends Component {
  constructor(props) {
    super(props);
    this.responseService = new ResponseService();
    this.state = {
      blocking: false,
      loadNewData: true
    };
  }

  async componentDidMount() {
    this.dataTable = await this.renderDatatableWithLazyLoad();

    if (this.props.showSearchbox) {
      this.removeClassSearchBoxForLazyLoadTable();

      this.dataTable.on("draw", (e, settings) => {
        this.enableAndHideAnimationForSearchButton();
      });
    }
  }

  renderDatatableWithLazyLoad = async () => {
    this.handleToggleBlocking();

    const { columnList, searchParams, actionColumn } = this.props;
    let searchInput = localStorage.getItem(`searchInput-${this.props.menukey}`);
    let page = searchParams.page !== undefined ? searchParams.page : 1;
    let requestParams = {
      ...searchParams
    };

    if (searchInput) {
      searchInput = JSON.parse(searchInput);
      requestParams = {
        ...requestParams,
        ...searchInput
      };
    }

    const data = await this.loadData(requestParams);
    let length = data.pageSize;
    let totalRecords = data.totalRecords;

    if (length === totalRecords) {
      this.setState({
        loadNewData: false
      });
    }

    this.handleToggleBlocking();

    const dataTable = window
      .jQuery(this.el)
      .DataTable({
        language: {
          lengthMenu: "Show _MENU_ Per Page"
        },
        responsive: {
          details: {
            type: "column",
            target: "td:last-child"
          }
        },
        columns: columnList,
        columnDefs: columnList,
        info: false,
        searching: false,
        ordering: false,
        stateSave: false,
        scrollY: 300,
        scrollCollapse: true,
        paging: false,
        data: data.rows || []
      })
      .on("draw", (e, settings) => {
        if (actionColumn) {
          // Remove old event for all
          $(".action-column").off("change");

          // Add new event for all
          $(".action-column").on("change", e => {
            this.props.actionEvent(e.target.value);
          });
        }

        page = settings.iDraw;
        length = settings.aoData.length;

        if (length === totalRecords) {
          this.setState({
            loadNewData: false
          });
        }
      })
      .on("error", (e, settings, techNote, message) => {
        console.log("An error has been reported by DataTables: ", message);
      });

    $(".dataTables_scrollBody").on("scroll", async () => {
      const maxScrollHeight =
        $(this.el)
          .find("tbody")
          .height() +
        $(this.el)
          .find("thead")
          .height();

      const scrollFromTop =
        $(".dataTables_scrollBody").scrollTop() +
        $(".dataTables_scrollBody").height();

      // When scroll to bottom, we need to load new data
      if (maxScrollHeight <= scrollFromTop) {
        if (this.state.loadNewData) {
          this.handleToggleBlocking();

          requestParams = {
            ...requestParams,
            page: page + 1
          };

          const newData = await this.loadData(requestParams);

          if (!newData.rows) {
            this.handleToggleBlocking();

            return;
          }

          dataTable.rows.add(newData.rows).draw();

          this.handleToggleBlocking();
        }
      }
    });

    if (actionColumn) {
      $(".action-column").change(e => {
        this.props.actionEvent(e.target.value);
      });
    }

    return dataTable;
  };

  loadData = async params => {
    const {
      model,
      apiService,
      dataTableUrl,
      actionColumn,
      actionType
    } = this.props;
    const columns = model.table.columns;
    const response = await apiService.callApi({
      url: dataTableUrl,
      options: { method: "GET" },
      requestParams: params
    });

    let data = [];

    if (response.status) {
      data = response.data.rows;

      if (!data || data.length === 0) return [];

      // Set checkbox or radio button
      if (actionColumn) {
        data.forEach(item => {
          item.action =
            actionType === "radio"
              ? this.renderFieldRadio(item)
              : actionType === "checkBox"
              ? this.renderFieldCheckBox(item)
              : "";
        });
      }

      // Set as default data when data from api not return
      data = this.responseService.setDefaultDataByColumnWhenDataIsNull(
        data,
        columns
      );

      // Format value by type base on config in column
      data = this.responseService.setValueByTypeBaseOnConfigInColumn(
        data,
        columns
      );
    }

    response.data.rows = customFieldMapping(data);

    return response.data;
  };

  renderFieldRadio = item => {
    const { actionField, actionFieldUnique, actionFieldValue } = this.props;

    return `
      <div class="custom-control custom-radio">
        <input
          id="${item[actionFieldUnique]}"
          class="action-column custom-control-input"
          type="radio"
          name="${actionField}"
          value="${item[actionFieldValue]}"
        ></input>
        <label class="col-1 nopadding custom-control-label" for="${
          item[actionFieldUnique]
        }"></label>
      </div>
    `;
  };

  renderFieldCheckBox = item => {
    const { actionField, actionFieldUnique, actionFieldValue } = this.props;

    return `
      <div class="custom-control custom-checkbox">
        <input
          id="${item[actionFieldUnique]}"
          class="action-column custom-control-input"
          type="checkbox"
          name="${actionField}"
          value="${item[actionFieldValue]}"
        ></input>
        <label
          class="custom-control-label pl-1 font-small text-shadow"
          for="${item[actionFieldUnique]}"
        ></label>
      </div>
    `;
  };

  removeClassSearchBoxForLazyLoadTable = () => {
    const searchBox = document.getElementsByClassName("box__header");

    if (searchBox.length > 0) {
      searchBox[0].setAttribute("class", "");
    }
  };

  reloadDataTable = async () => {
    this.destroyDataTable();
    this.disableAndShowAnimationForSearchButton();

    this.setState({
      loadNewData: true
    });

    // Render new table when reload
    this.dataTable = await this.renderDatatableWithLazyLoad();
    this.resetScroller();

    if (this.props.showSearchbox) {
      this.removeClassSearchBoxForLazyLoadTable();
    }
  };

  destroyDataTable = () => {
    window
      .jQuery(this.el)
      .DataTable()
      .destroy();
  };

  enableAndHideAnimationForSearchButton = () => {
    $(".btn-search").html('<i class="icon icon-search"></i> Search');
    $(".btn-search").prop("disabled", false);
    $(".btn-search").css("cursor", "pointer");
  };

  disableAndShowAnimationForSearchButton = () => {
    $(".btn-search").html(
      '<i class="fa fa-circle-o-notch fa-spin" aria-hidden="true"></i> Searching...'
    );
    $(".btn-search").prop("disabled", true);
    $(".btn-search").css("cursor", "not-allowed");
  };

  resetScroller = () => {
    $(this.dataTable.settings()[0].nScrollBody).scrollTop();
    $(this.dataTable.settings()[0].nScrollBody).scrollLeft();
  };

  handleToggleBlocking = () => {
    this.setState({ blocking: !this.state.blocking });
  };

  render() {
    const { title, showSearchbox } = this.props;

    return (
      <div className="page__header">
        {title && (
          <Fragment>
            <div className="row align-items-center justify-content-between justify-content-lg-start m-0">
              <div className="col-2 col-md-1 p-0 d-lg-none" />
              <div className="text-center text-lg-left">
                <h2 className="list">{title}</h2>
              </div>
            </div>
            <HelpButton />
          </Fragment>
        )}
        <section>
          {showSearchbox && (
            <SearchBox
              {...this.props}
              {...this.state}
              reloadDataTable={async e => await this.reloadDataTable(e)}
            />
          )}
          <BlockUi tag="div" blocking={this.state.blocking}>
            <div id="rq-step-1-data-table" className="table__wrapper">
              <table className="table datatable" ref={el => (this.el = el)} />
            </div>
          </BlockUi>
        </section>
      </div>
    );
  }
}

export default LazyLoadDataTable;
