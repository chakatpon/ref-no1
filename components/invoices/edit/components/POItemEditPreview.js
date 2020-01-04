import React, { Component, Fragment } from "react";
import api from "~/libs/api";
import { findDOMNode } from "react-dom";
import { formatNumber, numberOnly, GrThead } from "../models/item";
import ReactTooltip from "react-tooltip";
import { asyncContainer, Typeahead } from "~/libs/react-bootstrap-typeahead";
const AsyncTypeahead = asyncContainer(Typeahead);
import { INVOICE_CREATE_MODEL, formatCurrency } from "../models/createmodel";
import { withTranslation } from "~/i18n";
class POItemEditPreview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      listItems: [],
      data: []
    };
  }
  async componentDidMount() {
    // await this.setState({ data: this.props.selectedItems });
    this.setPOItems();
    // let listItems = this.setPOItems();
    // this.setState({ listItems });
    // this.handleGroupGR(false);
  }
  setPOItems = async () => {
    let POItems = [];
    let subTotal = 0;
    let taxTotal = 0;
    if (this.props.selectedItems.length > 0) {
      await this.props.selectedItems.map(item => {
        item.itemLists.map(itm => {
          if (itm.checked == true) {
            POItems.push(itm);
          }
        });
      });
      POItems.forEach(row => {
        let taxRate = row ? row.taxRate : 0;
        subTotal = subTotal + parseFloat(row.selectAmount);
        taxTotal =
          taxTotal + (parseFloat(row.selectAmount) * parseFloat(taxRate)) / 100;
      });
      this.setState({ listItems: POItems, subTotal, taxTotal });
      if (typeof this.props.updateMainState == "function") {
        this.props.updateMainState({
          listItems: POItems,
          subTotal,
          taxTotal
        });
      }
    }
    return POItems;
  };
  render() {
    const { t } = this.props;
    return (
      <div className="col-12 box d-flex flex-wrap">
        <div className="col-12 d-flex flex-wrap align-items-center mt-1 mb-3">
          <h4 className="col-8 m-0 p-0">{t("Items Information")}</h4>
        </div>

        <div className="table-responsive">
          <table className="table dataTable">
            <thead>
              <tr>
                <th>{t("PO No")}</th>
                <th>{t("PO Items No")}</th>
                <th>{t("Material Description")}</th>
                <th>{t("Qty")}</th>
                <th>{t("Unit Description")}</th>
                <th>{t("Unit Price")}</th>
                <th>{t("Sub Total")}</th>
                <th>{t("Currency")}</th>
              </tr>
            </thead>
            <tbody>
              {this.state.listItems.length > 0 ? (
                this.state.listItems.map(item => {
                  return (
                    <tr>
                      <td className="text-center">{item.poNumber || "-"}</td>
                      <td className="text-center">{item.poItemNo || "-"}</td>
                      <td
                        className="text-left text-uppercase"
                        style={{ minWidth: 200 }}
                      >
                        {item.materialDescription || "-"}
                      </td>
                      <td className="text-right">
                        {item.selectQty != undefined
                          ? formatNumber(item.selectQty, 3)
                          : "-"}
                      </td>
                      <td className="text-center text-uppercase">
                        {item.unitDescription}
                      </td>
                      <td className="text-right">
                        {item.selectUnitPrice != undefined
                          ? formatNumber(item.selectUnitPrice, 2)
                          : "-"}
                      </td>
                      <td className="text-right">
                        {item.selectAmount != undefined
                          ? formatNumber(item.selectAmount, 2)
                          : "-"}
                      </td>
                      <td className="text-center text-uppercase">
                        {item.poItemUnitPriceCurrency || "-"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colspan="10" className="text-center">
                    No Data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
export default withTranslation(["invoice-edit"])(POItemEditPreview);
