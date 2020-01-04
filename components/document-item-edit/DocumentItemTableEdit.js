import React, { Component } from "react";
import DataTable from "../common/DataTable";
import { withTranslation } from "~/i18n";
class DocumentItemTableEdit extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {
      tableHeader,
      columns,
      data,
      selectableRows,
      onTableUpdate,
      selectedRows,
      clearSelectedRows,
      footer,
      defaultSortField,
      lang
    } = this.props;
    return (
      <div className="d-flex flex-wrap box">
        <DataTable
          noHeader
          subHeader
          subHeaderAlign="left"
          subHeaderComponent={tableHeader}
          selectableRows={selectableRows}
          fixedHeader
          className="table table-3 table-constructor"
          columns={columns}
          customTheme={tableTheme}
          data={data}
          defaultSortField={defaultSortField}
          onTableUpdate={onTableUpdate}
          selectedRows={selectableRows && selectedRows}
          selectedCount={selectableRows && selectedRows.length}
          allSelected={selectableRows && data.length === selectedRows.length}
          clearSelectedRows={clearSelectedRows}
          footerHtml={footer}
          lang={lang}
        />
      </div>
    );
  }
}

const tableTheme = {
  header: {
    fontSize: "16px",
    fontColor: "#46474A",
    backgroundColor: "rgb(241, 243, 246)"
  },
  rows: {
    fontSize: "14px",
    fontColor: "#626262"
  }
};

export default withTranslation(["request-create", "request-edit"])(
  DocumentItemTableEdit
);
