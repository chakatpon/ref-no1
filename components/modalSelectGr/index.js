import React from "react";
import ModalAlert from "../modalAlert";
import moment from "moment";
import api from "../../libs/api";
import { withTranslation } from "~/i18n";

class ModalSelectGr extends React.Component {
  apis = new api().group("thresholdPopup");
  state = {
    minValue: 0,
    maxValue: 0,
    outOfTolerance: false,
    buttonGrTable: []
  };

  async componentWillReceiveProps() {
    let configOption = "";
    let grQuantity = 0;
    let minValue = 0;
    let maxValue = 0;
    let configDetail;
    if (
      this.props.matchingType === "3wm" ||
      this.props.matchingType === "doa"
    ) {
      minValue = parseFloat(this.props.minValue);
      maxValue = parseFloat(this.props.maxValue);
      grQuantity = this.props.matchingItem.invoiceItems.invQuantity;
    } else if (this.props.matchingType === "2wm") {
      minValue = parseFloat(this.props.minValue);
      maxValue = parseFloat(this.props.maxValue);
      grQuantity = this.props.matchingItem.creditnoteItems.quantity;
    }

    minValue = parseFloat(
      (
        parseFloat(minValue.toFixed(3)) *
        parseFloat((grQuantity / 100).toFixed(3))
      ).toFixed(3)
    );
    maxValue = parseFloat(
      (
        parseFloat(maxValue.toFixed(3)) *
        parseFloat((grQuantity / 100).toFixed(3))
      ).toFixed(3)
    );
    this.setState(
      {
        maxValue,
        minValue
      },
      () => this.checkSummary(this.props.data)
    );
  }

  formatCurrency = (amount, digit) => {
    if (!amount) return 0;
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      maximumFractionDigits: digit,
      minimumFractionDigits: digit
    }).format(amount);
  };

  getConfig = configOption => {
    return this.apis.call("getConfig", {
      companyTaxId: this.props.companyTaxNumber,
      counterPartyTaxId: this.props.vendorTaxNumber,
      configOption
    });
  };

  clickCheckAll = e => {
    const data = this.props.data.map(gr => ({
      ...gr,
      tagged: e.target.checked
    }));
    this.checkSummary(data);
    this.props.clickCheckAll(data, e.target.checked);
  };

  clickCheck = (e, index) => {
    const data = [...this.props.data];
    data[index].tagged = e.target.checked;

    this.checkSummary(data);
    this.props.clickCheck(data);
  };

  renderSumary = () => {
    const summary = this.formatCurrency(
      this.props.data
        .filter(item => item.tagged)
        .reduce(
          (accumulator, currentValue) =>
            accumulator + currentValue.quantity.initial,
          0
        ),
      3
    );

    return summary;
  };

  checkSummary = data => {
    const { t } = this.props;
    const summary = data
      .filter(item => item.tagged)
      .reduce(
        (accumulator, currentValue) =>
          accumulator + currentValue.quantity.initial,
        0
      );
    let Sum = parseFloat(summary.toFixed(3));
    // let minValue = parseFloat(this.state.minValue.toFixed(3));
    let maxValue = parseFloat(this.state.maxValue.toFixed(3));

    if (Sum > maxValue) {
      this.setState({
        outOfTolerance: true,
        buttonGrTable: [
          {
            label: t("Cancel"),
            attribute: {
              className: "btn btn--transparent btn-wide",
              onClick: this.props.toggleGrListModal
            }
          },
          {
            label: t("Submit"),
            attribute: {
              disabled: true,
              className: "btn btn-wide",
              onClick: this.props.submitTagedGR
            }
          }
        ]
      });
    } else {
      this.setState({
        outOfTolerance: false,
        buttonGrTable: [
          {
            label: t("Cancel"),
            attribute: {
              className: "btn btn--transparent btn-wide",
              onClick: this.props.toggleGrListModal
            }
          },
          {
            label: t("Submit"),
            attribute: {
              className: "btn btn-wide",
              onClick: this.props.submitTagedGR
            }
          }
        ]
      });
    }
  };

  renderSelectGrBody = (grData, index) => {
    return (
      <tr style={{ backgroundColor: "white" }}>
        <td style={{ width: "10%" }}>
          <input
            type={"checkbox"}
            checked={grData.tagged}
            onClick={e => this.clickCheck(e, index)}
          />
        </td>
        <td>{grData.goodsReceivedExternalId}</td>
        <td>{grData.externalId}</td>
        <td>{grData.quantity.unit}</td>
        <td>{moment(grData.postingDate).format("DD/MM/YYYY")}</td>
        <td>{this.formatCurrency(grData.quantity.initial, 3)}</td>
      </tr>
    );
  };

  render() {
    const { t } = this.props;

    return (
      <ModalAlert
        title={t("Tag GR")}
        visible={this.props.isGrTableVisible}
        // style={{ width: "1000px" }}
        button={this.state.buttonGrTable}
      >
        <div className="text-center">
          <div className="table_wrapper">
            <table
              className="table table-3 dataTable gr-tag"
              style={{ width: "100%" }}
            >
              <thead>
                <tr>
                  <th style={{ width: "10%" }}>
                    <input
                      type="checkbox"
                      value={this.props.checkAll}
                      onClick={this.clickCheckAll}
                    />
                  </th>
                  <th>{t("GR No")}</th>
                  <th>
                    {t("GR Item No1")} <br />
                    {t("GR Item No2")}
                  </th>
                  <th>
                    {t("Unit Description1")}
                    <br />
                    {t("Unit Description2")}
                  </th>
                  <th>
                    {t("GR Posting Date1")}
                    <br /> {t("GR Posting Date2")}
                  </th>
                  <th>{t("Quantity")}</th>
                </tr>
              </thead>
              <tbody>
                {this.props.data.length == 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">
                      <i className="fa fa-info-circle" aria-hidden="true" />{" "}
                      ไม่พบรายการ GR
                    </td>
                  </tr>
                ) : (
                  ""
                )}
                {this.props.data.map((grData, index) =>
                  this.renderSelectGrBody(grData, index)
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between mt-3">
            <div className="col-8 text-left">
              <strong>{t("GR Quantity Summary")}</strong>
            </div>
            <div className="col-4 text-right mr-4">
              <strong>{this.renderSumary()}</strong>
            </div>
          </div>
          <div className="d-flex justify-content-between">
            <div className="col-8 text-left mr-4">
              <p style={{ fontSize: "14px" }}>
                {`${t("GR Quantity Tolerance")}: ${this.formatCurrency(
                  this.state.minValue,
                  3
                )} ${t("to")} ${this.formatCurrency(this.state.maxValue, 3)}`}
              </p>
            </div>
            <div className="col-4 text-right mr-4" />
          </div>
          {this.state.outOfTolerance && (
            <p className="text-danger">
              {t(
                "GR Quantity must not exceed maximum tolerance Please select again"
              )}
            </p>
          )}
        </div>
      </ModalAlert>
    );
  }
}

export default withTranslation(["threeway-detail"])(ModalSelectGr);
