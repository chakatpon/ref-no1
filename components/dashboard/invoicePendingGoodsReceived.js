import React from "react";
import Router from "next/router";
import api from "../../libs/api";
import BlockUi from "react-block-ui";
import PendingPopover from "./pendingPopover";
import { withTranslation } from "~/i18n";

import moment from "moment";
class InvoicePendingGoodReceived extends React.Component {
  constructor(props) {
    super(props);
    this.apis = new api(this.props.domain).group("dashboard");
    this.state = {
      loading: false,
      outOfDateArray: []
    };
  }

  goToInvoice = outOfDate => {
    const invoiceEntryDateFrom = moment()
      .subtract(outOfDate.endDate, "day")
      .startOf("day")
      .format("DD/MM/YYYY");
    const invoiceEntryDateTo = moment()
      .subtract(outOfDate.startDate, "day")
      .startOf("day")
      .format("DD/MM/YYYY");
    window.localStorage.setItem(
      "searchInput-inv",
      JSON.stringify({
        invoiceEntryDateFrom,
        invoiceEntryDateTo,
        matchingStatus: ["Missing GR", "Partial GR"]
      })
    );
    Router.push("/invoice");
  };

  async componentDidMount() {
    this.setState({
      loading: true
    });
    try {
      const invoicePendingConfig = await this.apis.call(
        "invoicePendingConfig",
        {
          configOption: "PERIOD_INVOICE_PENDING_GR"
        }
      );
      const invoicePending = await this.apis.call("invoicePending", {
        currency: "THB",
        groupBy: "daysWithoutGoods"
      });
      if (invoicePendingConfig.length > 0) {
        const config = invoicePendingConfig[0];
        const dayValue = config.value.split(",");
        let outOfDateArray = dayValue.map((value, index) => {
          let obj = {};
          let dataPending = invoicePending.data.filter(
            data => data.key === value
          );
          if (dataPending.length) {
            obj.countTotal = dataPending[0].countTotal;
            obj.dataValue =
              dataPending[0].amountTotal && dataPending[0].amountTotal.quantity
                ? dataPending[0].amountTotal.quantity *
                  dataPending[0].amountTotal.displayTokenSize
                : 0;
          } else {
            obj.countTotal = 0;
            obj.dataValue = 0;
          }
          if (index === 0) {
            obj = {
              ...obj,
              key: value,
              value: `0 - ${value}`,
              startDate: 0,
              endDate: parseInt(value)
            };
          } else if (index === dayValue.length - 1) {
            const startDate = parseInt(dayValue[index - 1]);
            const endDate = parseInt(dayValue[index]);
            obj = {
              ...obj,
              key: value,
              value: `> ${startDate}`,
              startDate: startDate + 1,
              endDate
            };
          } else {
            const startDate = parseInt(dayValue[index - 1]);
            obj = {
              ...obj,
              key: value,
              value: `${startDate + 1} - ${value}`,
              startDate: startDate + 1,
              endDate: parseInt(value)
            };
          }
          return obj;
        });
        this.setState({
          outOfDateArray
        });
      }
    } catch (e) {
      console.log("invoicePending error ", e);
    }
    this.setState({
      loading: false
    });
  }

  formatNumber = number => {
    return Intl.NumberFormat("th-TH").format(number);
  };

  formatCurrency = number => {
    if (number > 1000000) {
      return (number / 1000000).toFixed(2) + " M";
    } else if (number > 1000) {
      return (number / 1000).toFixed(2) + " K";
    } else {
      return number;
    }
  };

  render() {
    const { t } = this.props;
    return (
      <BlockUi blocking={this.state.loading}>
        <div className="box__header box__header--shadow px-0 py-0">
          <div className="d-flex flex-wrap justify-content-between pt-2">
            <div className="col">
              <h5 className="gray-1">{t("Invoice Pending Goods Receipt")}</h5>
            </div>
          </div>
        </div>

        <div className="box__inner px-3">
          <div className="graph d-flex flex-wrap">
            <div className="header col-12 col-lg-2">
              <p className="small c-lightgray text-xs-center text-sm-center text-md-center text-lg-left">
                {t("QTY")}
              </p>
              <p className="d-none d-lg-block">&nbsp;</p>
              <p className="small c-lightgray d-none d-lg-block">
                {t("Without GR")}
                <br />
                {t("(Day)")}
              </p>
            </div>

            {/* <!-- Graph slot - Start --> */}
            {this.state.outOfDateArray.map(outOfDate => {
              return (
                <div
                  className="col px-0"
                  key={outOfDate.value}
                  onClick={() => this.goToInvoice(outOfDate)}
                >
                  <p className="text-center mb-0">
                    <strong>{this.formatCurrency(outOfDate.countTotal)}</strong>
                  </p>
                  <PendingPopover
                    value={this.formatNumber(outOfDate.dataValue)}
                  />
                  <p className="small c-lightgray text-center">
                    {outOfDate.value}
                  </p>
                </div>
              );
            })}
            {/* <!-- Graph slot - End --> */}

            <div className="footer col-12 d-block d-lg-none">
              <p className="small c-lightgray text-center">
                {t("Without GR (Day)")}
              </p>
            </div>

            {/* <!-- Graph Background - Start --> */}
            <div className="graph-background">&nbsp;</div>
            {/* <!-- Graph Background - End --> */}
          </div>
        </div>
      </BlockUi>
    );
  }
}

export default withTranslation(["dashboard", "common", "menu"])(
  InvoicePendingGoodReceived
);
