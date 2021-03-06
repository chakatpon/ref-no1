import React, { Component } from "react";
import { ThemeProvider } from "styled-components";
import memoize from "memoize-one";
import orderBy from "lodash/orderBy";
import merge from "lodash/merge";
import { DataTableProvider } from "./DataTableContext";
import Table from "./Table";
import TableHead from "./TableHead";
import TableFooter from "./TableFooter";
import TableHeadRow from "./TableHeadRow";
import TableRow from "./TableRow";
import TableCol from "./TableCol";
import TableColCheckbox from "./TableColCheckbox";
import TableHeader from "./TableHeader";
import TableSubheader from "./TableSubheader";
import TableBody from "./TableBody";
import ResponsiveWrapper from "./ResponsiveWrapper";
import ProgressWrapper from "./ProgressWrapper";
import TableWrapper from "./TableWrapper";
import NoData from "./NoData";
import { propTypes, defaultProps } from "./propTypes";
import { decorateColumns, getSortDirection } from "./util";
import {
  handleSelectAll,
  handleRowSelected,
  handleSort,
  clearSelected
} from "./statemgmt";
import getDefaultTheme from "../themes/default";

class DataTable extends Component {
  static propTypes = propTypes;

  static defaultProps = defaultProps;

  static getDerivedStateFromProps(props, state) {
    // allow clearing of rows via passed clearSelectedRows toggle prop
    if (props.clearSelectedRows !== state.clearSelectedRows) {
      return clearSelected(props.clearSelectedRows);
    }

    return null;
  }

  constructor(props) {
    super(props);

    const sortDirection = getSortDirection(props.defaultSortAsc);
    this.columns = decorateColumns(props.columns);
    this.sortedRows = memoize((rows, defaultSortField, direction) =>
      orderBy(rows, defaultSortField, direction)
    );
    this.mergeTheme = memoize((theme, customTheme) =>
      merge(theme, customTheme)
    );
    this.PaginationComponent = props.paginationComponent;
    this.state = {
      allSelected: this.props.allSelected || false,
      selectedCount: this.props.selectedCount || 0,
      selectedRows: this.props.selectedRows || [],
      sortColumn: props.defaultSortField,
      sortDirection,
      clearSelectedRows: false,
      currentPage: 1,
      rowsPerPage: props.paginationPerPage
    };
  }

  componentDidUpdate(prevProps, prevState) {
    const { onTableUpdate } = this.props;
    const { selectedRows, sortDirection, sortColumn } = this.state;

    if (
      onTableUpdate &&
      (prevState.selectedRows !== selectedRows ||
        prevState.sortDirection !== sortDirection ||
        prevState.sortColumn !== sortColumn)
    ) {
      const { allSelected, selectedCount, clearSelectedRows } = this.state;

      onTableUpdate({
        allSelected,
        selectedCount,
        selectedRows,
        sortColumn,
        sortDirection,
        clearSelectedRows
      });
    }
  }

  handleSelectAll = () => {
    const { data } = this.props;

    this.setState(state => handleSelectAll(data, state.allSelected));
  };

  handleRowSelected = row => {
    const { data } = this.props;

    this.setState(state => handleRowSelected(data, row, state.selectedRows));
  };

  handleRowClicked = (row, e) => {
    const { onRowClicked } = this.props;

    if (onRowClicked) {
      onRowClicked(row, e);
    }
  };

  handleSort = ({ selector, sortable }) => {
    const { onSort } = this.props;
    const { sortColumn, sortDirection } = this.state;

    this.setState(state => handleSort(selector, sortable, state));

    if (sortable && onSort) {
      onSort(sortColumn, sortDirection);
    }
  };

  handleChangePage = currentPage => {
    const { onChangePage } = this.props;

    this.setState({
      currentPage
    });

    if (onChangePage) {
      onChangePage(currentPage);
    }
  };

  handleChangeRowsPerPage = rowsPerPage => {
    const { onChangeRowsPerPage } = this.props;

    this.setState({
      rowsPerPage
    });

    if (onChangeRowsPerPage) {
      onChangeRowsPerPage(rowsPerPage);
    }
  };

  renderColumns() {
    const { lang } = this.props;
    return this.columns.map(column => (
      <TableCol
        key={column.id}
        column={column}
        onColumnClick={this.handleSort}
        lang={lang}
      />
    ));
  }

  renderRows() {
    const { keyField, data, pagination } = this.props;

    const { currentPage, rowsPerPage, sortDirection, sortColumn } = this.state;

    const lastIndex = currentPage * rowsPerPage;
    const firstIndex = lastIndex - rowsPerPage;
    const sortedRows = this.sortedRows(data, sortColumn, sortDirection);
    const currentRows = pagination
      ? sortedRows.slice(firstIndex, lastIndex)
      : sortedRows;

    return currentRows.map((row, i) => (
      <TableRow
        key={row[keyField] || i}
        row={row}
        onRowClicked={this.handleRowClicked}
        onRowSelected={this.handleRowSelected}
      />
    ));
  }

  renderTableHead() {
    const { selectableRows, expandableRows } = this.props;

    return (
      <TableHead>
        <TableHeadRow>
          {selectableRows && (
            <TableColCheckbox onClick={this.handleSelectAll} />
          )}
          {expandableRows && <div style={{ width: "48px" }} />}
          {this.renderColumns()}
        </TableHeadRow>
      </TableHead>
    );
  }

  render() {
    const {
      data,
      title,
      customTheme,
      actions,
      className,
      style,
      responsive,
      overflowY,
      overflowYOffset,
      progressPending,
      progressComponent,
      progressCentered,
      noDataComponent,
      disabled,
      noHeader,
      fixedHeader,
      pagination,
      selectableRows,
      expandableRows,
      subHeader,
      subHeaderAlign,
      subHeaderWrap,
      subHeaderComponent,
      footerHtml
    } = this.props;

    const { rowsPerPage, currentPage } = this.state;

    const theme = this.mergeTheme(getDefaultTheme(), customTheme);
    const enabledPagination = pagination && !progressPending && data.length > 0;
    const init = {
      ...this.props,
      ...this.state,
      ...{ columns: this.columns },
      ...{ internalCell: selectableRows || expandableRows }
    };

    return (
      <ThemeProvider theme={theme}>
        <DataTableProvider initialState={init}>
          <ResponsiveWrapper
            responsive={responsive}
            className={className}
            style={style}
            overflowYOffset={overflowYOffset}
            overflowY={overflowY}
          >
            {!noHeader && (
              <TableHeader
                title={title}
                actions={actions}
                pending={progressPending}
              />
            )}

            {subHeader && (
              <TableSubheader
                align={subHeaderAlign}
                wrapContent={subHeaderWrap}
                component={subHeaderComponent}
              />
            )}

            <TableWrapper>
              {progressPending && (
                <ProgressWrapper
                  component={progressComponent}
                  centered={progressCentered}
                />
              )}

              {!data.length > 0 && !progressPending && (
                <NoData component={noDataComponent} />
              )}

              {data.length > 0 && (
                <Table disabled={disabled}>
                  {this.renderTableHead()}

                  <TableBody
                    fixedHeader={fixedHeader}
                    hasOffset={overflowY}
                    offset={overflowYOffset}
                  >
                    {this.renderRows()}
                  </TableBody>
                </Table>
              )}

              {enabledPagination && (
                <TableFooter>
                  <this.PaginationComponent
                    onChangePage={this.handleChangePage}
                    onChangeRowsPerPage={this.handleChangeRowsPerPage}
                    rowCount={data.length}
                    currentPage={currentPage}
                    rowsPerPage={rowsPerPage}
                    theme={theme}
                  />
                </TableFooter>
              )}
              {footerHtml}
            </TableWrapper>
          </ResponsiveWrapper>
        </DataTableProvider>
      </ThemeProvider>
    );
  }
}

export default DataTable;
