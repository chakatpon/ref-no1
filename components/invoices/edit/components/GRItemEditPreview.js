import React, { Component, Fragment } from "react";
import api from "~/libs/api";
import { findDOMNode } from "react-dom";
import { formatNumber, numberOnly, GrThead } from "../models/item";
import ReactTooltip from "react-tooltip";
import { asyncContainer, Typeahead } from "~/libs/react-bootstrap-typeahead";
const AsyncTypeahead = asyncContainer(Typeahead);
import { INVOICE_CREATE_MODEL, formatCurrency } from "../models/createmodel";
import { array } from "prop-types";
import { withTranslation } from "~/i18n";
class GRItemEditPreview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      listItems: [],
      data: []
    };
  }
  componentDidMount() {
    this.setState({ data: this.props.selectedItems });
    let listItems = this.setPOItems();
    this.setState({ listItems });
    let itemGrouping = this.props.settings.INVOICE_ITEM_DEFAULT_GROUPING.value.toLowerCase();

    if (itemGrouping == true || itemGrouping == "true") {
      $("input[name='group_by_GR']").prop("checked", true);
      this.handleGroupGR(true);
    } else {
      this.handleGroupGR(false);
    }
  }
  setPOItems = () => {
    let POItems = [];
    if (this.props.selectedItems.length > 0) {
      this.props.selectedItems.map(item => {
        item.itemLists.map(itm => {
          if (itm.checked == true) {
            POItems.push(itm);
          }
        });
      });
    }
    return POItems;
  };
  handleGroupGR = group => {
    const POItems = this.setPOItems();
    const { flag } = this.props;
    let newGRItems = [];
    if (group) {
      POItems.forEach(row => {
        let f = newGRItems.filter(r => {
          return (
            r.purchaseItem.purchaseItemExternalId ==
              row.purchaseItem.purchaseItemExternalId &&
            r.purchaseItem.purchaseOrderExternalId ==
              row.purchaseItem.purchaseOrderExternalId &&
            r.selectUnitPrice == row.selectUnitPrice
          );
        });
        if (f.length == 1) {
          newGRItems.map(rs => {
            if (
              rs.purchaseItem.purchaseItemExternalId ==
                row.purchaseItem.purchaseItemExternalId &&
              rs.purchaseItem.purchaseOrderExternalId ==
                row.purchaseItem.purchaseOrderExternalId &&
              rs.selectUnitPrice == row.selectUnitPrice
            ) {
              if (rs.referenceField1 != row.referenceField1) {
                rs.referenceField1 = "Multiple";
              }
              (rs.selectQty = rs.selectQty + row.selectQty),
                (rs.externalId = "Multiple"),
                (rs.selectAmount = rs.selectAmount + row.selectAmount);

              if (row.goodsReceivedItems.linearId === undefined) {
                row.goodsReceivedItems.forEach(r => {
                  rs.goodReceivedItemslinearId.push({
                    linearId: r.linearId
                  });
                });
              } else {
                rs.goodReceivedItemslinearId.push({
                  linearId: row.goodsReceivedItems.linearId
                });
              }
            }
          });
        } else {
          if (row.goodsReceivedItems.linearId === undefined) {
            let newgoodReceivedItems = [];
            row.goodsReceivedItems.forEach(r => {
              newgoodReceivedItems.push({
                linearId: r.linearId
              });
            });
            newGRItems.push({
              ...row,
              goodReceivedItemslinearId: newgoodReceivedItems
            });
          } else {
            newGRItems.push({
              ...row,
              goodReceivedItemslinearId: [
                { linearId: row.goodsReceivedItems.linearId }
              ]
            });
          }
        }
      });
      let subTotal = 0;
      let taxTotal = 0;

      if (flag) {
        if (flag.isChangeSubTotalTaxTotal) {
          this.setState({
            listItems: newGRItems,
            subTotal: subTotal,
            taxTotal: taxTotal,
            flag: { isChangeSubTotalTaxTotal: true }
          });
          if (typeof this.props.updateMainState == "function") {
            this.props.updateMainState({
              listItems: newGRItems,
              subTotal: subTotal,
              taxTotal: taxTotal,
              flag: { isChangeSubTotalTaxTotal: true }
            });
          }
        } else {
          newGRItems.forEach(row => {
            let taxRate = row.purchaseItem ? row.purchaseItem.taxRate : 0;
            subTotal = subTotal + parseFloat(row.selectAmount);
          });
          taxTotal = this.calItemsTaxTotal(newGRItems);
          this.setState({ listItems: newGRItems, subTotal, taxTotal });
          if (typeof this.props.updateMainState == "function") {
            this.props.updateMainState({
              listItems: newGRItems,
              subTotal,
              taxTotal
            });
          }
        }
      } else {
        newGRItems.forEach(row => {
          let taxRate = row.purchaseItem ? row.purchaseItem.taxRate : 0;
          subTotal = subTotal + parseFloat(row.selectAmount);
          taxTotal =
            taxTotal +
            (parseFloat(row.selectAmount) * parseFloat(taxRate)) / 100;
        });
        this.setState({ listItems: newGRItems, subTotal, taxTotal });
        if (typeof this.props.updateMainState == "function") {
          this.props.updateMainState({
            listItems: newGRItems,
            subTotal,
            taxTotal
          });
        }
      }
    } else {
      console.log("DATA before", POItems);
      POItems.map(r => {
        r.goodReceivedItemslinearId = [
          { linearId: r.goodsReceivedItems[0].linearId }
        ];
      });
      let subTotal = 0;
      let taxTotal = 0;
      console.log("DATA after", POItems);
      if (flag) {
        if (flag.isChangeSubTotalTaxTotal) {
          this.setState({
            listItems: POItems,
            subTotal: this.props.subTotal,
            taxTotal: this.props.taxTotal,
            flag: { isChangeSubTotalTaxTotal: true }
          });
        } else {
          POItems.forEach(row => {
            let taxRate = row.purchaseItem ? row.purchaseItem.taxRate : 0;
            subTotal = subTotal + parseFloat(row.selectAmount);
          });
          taxTotal = this.calItemsTaxTotal(POItems);
          this.setState({ listItems: POItems, subTotal, taxTotal });
          if (typeof this.props.updateMainState == "function") {
            this.props.updateMainState({
              listItems: POItems,
              subTotal,
              taxTotal
            });
          }
        }
      } else {
        POItems.forEach(row => {
          let taxRate = row.purchaseItem ? row.purchaseItem.taxRate : 0;
          subTotal = subTotal + parseFloat(row.selectAmount);
          taxTotal =
            taxTotal +
            (parseFloat(row.selectAmount) * parseFloat(taxRate)) / 100;
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
    }
  };
  calPOItemsSubTotal(POItems) {
    let subTotal = 0;

    POItems.map(item => {
      subTotal += Number(item.selectAmount);
    });

    return subTotal;
  }

  calItemsTaxTotal(listItems) {
    let taxTotal = 0;
    let taxSumMapping = {};

    listItems.forEach(item => {
      //subTotal = subTotal + parseFloat(row.selectAmount);
      // taxTotal = taxTotal + +this.calTax(row.selectAmount, taxRate);
      let taxRate = item.purchaseItem ? item.purchaseItem.taxRate : 0;
      if (_.has(taxSumMapping, `tax${taxRate}`)) {
        taxSumMapping[`tax${taxRate}`] += +item.selectAmount.toFixed(2);
      } else {
        taxSumMapping[`tax${taxRate}`] = +item.selectAmount.toFixed(2);
      }
    });
    _.forOwn(taxSumMapping, (value, key) => {
      taxTotal += this.calTax(value, key.replace("tax", ""));
    });
    //delete taxSumMapping;
    return taxTotal;
  }

  calTax(amount, percentage) {
    return parseFloat(
      (
        parseFloat(amount.toFixed(2)) *
        parseFloat((percentage / 100).toFixed(2))
      ).toFixed(2)
    );
  }
  render() {
    const { t } = this.props;
    return (
      <div className="col-12 box d-flex flex-wrap">
        <div className="col-12 d-flex flex-wrap align-items-center mt-1 mb-3">
          <h4 className="col-8 m-0 p-0">{t("Items Information")}</h4>
          <div className="col-4 custom-control custom-checkbox mx-0 d-flex align-items-center justify-content-end">
            <input
              type="checkbox"
              id="group_by_GR"
              name="group_by_GR"
              onChange={e => this.handleGroupGR(e.target.checked)}
            />
            <label for="group_by_GR" className="c-purple font-bold mb-0 ml-3">
              {t("Group GR items")}
            </label>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table dataTable">
            <thead>
              <tr>
                <th>{t("PO No")}</th>
                <th>{t("PO Item No")}</th>
                <th>{t("GR Items No")}</th>
                <th>{t("Ref No1")}</th>
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
                      <td className="text-center">
                        {item.purchaseItem.purchaseOrderExternalId || "-"}
                      </td>
                      <td className="text-center">
                        {item.purchaseItem.purchaseItemExternalId || "-"}
                      </td>
                      <td className="text-center">{item.externalId || "-"}</td>
                      <td className="text-center">
                        {item.referenceField1 || "-"}
                      </td>
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
                        {item.quantity.unit}
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
                        {item.currency}
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
export default withTranslation(["invoice-edit"])(GRItemEditPreview);
