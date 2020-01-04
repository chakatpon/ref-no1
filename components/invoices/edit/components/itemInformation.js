import React, { Component } from "react";
import { i18n, withTranslation } from "~/i18n";
class ItemInformation extends Component {
  render() {
    const { t } = this.props;
    const { columnItem, items } = this.props;
    return (
      <div className={`box pt-0 pb-0 px-0 ${this.props.className}`}>
        <a
          href="javascript:void(0);"
          aria-expanded="true"
          className="d-flex w-100 btnToggle itsNotButton"
        >
          <div className="col-12 px-0">
            <h3 className="border-bottom gray-1 px-3">{t("Items Information")}</h3>
          </div>
        </a>
        <div
          style={{
            display: "flex",
            padding: "20px",
            justifyContent: "center"
          }}
        >
          <div className="table_wrapper" style={{ width: "100%" }}>
            <table className="table" ref={el => (this.el = el)}>
              <thead
                style={{
                  backgroundColor: "rgb(241, 243, 246)"
                }}
              >
                <tr>
                  {columnItem.map(col => {
                    return (
                      <th
                        style={{ verticalAlign: "middle" }}
                        dangerouslySetInnerHTML={{
                          __html: t(col.header)
                        }}
                      />
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {items &&
                  items.map(row => {
                    return (
                      <tr>
                        {columnItem.map(col => {
                          return (
                            <td
                              style={{ verticalAlign: "middle" }}
                              dangerouslySetInnerHTML={{
                                __html:
                                  col.render !== undefined
                                    ? col.render(row)
                                    : row[col.field]
                              }}
                            />
                          );
                        })}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}
export default withTranslation(["invoice-edit"])(ItemInformation);
