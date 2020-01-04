import React from "react";
import api from "../../libs/api";

import SelectDatePopover, { dateCalculator } from "./selectDatePopover";
import moment from "moment";
import BlockUi from "react-block-ui";
import { withTranslation } from "~/i18n";

class PaymentStatic extends React.Component {
  constructor(props) {
    super(props);
    this.apis = new api(this.props.domain).group("dashboard");
    this.NAME = "paymentStaticDate";
    this.state = {
      paymentStatistic: {},
      paidCount: 0,
      paidValue: 0,
      unpaidCount: 0,
      unpaidValue: 0,
      loading: false,
      date: {
        name: "Today",
        value: {
          from: moment()
            .startOf("day")
            .format("DD/MM/YYYY"),
          to: moment()
            .endOf("day")
            .format("DD/MM/YYYY")
        },
        check: true
      }
    };
  }

  async componentDidMount() {
    let date = localStorage.getItem(this.NAME);
    date = JSON.parse(date);
    if (date) {
      let dateList = new dateCalculator();
      let newDate = dateList.filter(r => date.name == r.name);
      if (newDate.length == 1) {
        date = newDate[0];
      }
      await this.setState({
        date
      });
    }
    await this.fetchData();
  }

  sumQuantity = (current, data) => current + data.countTotal;
  sumValue = (current, data) =>
    current + data.amountTotal.quantity * data.amountTotal.displayTokenSize;
  filterPaid = data => data.key === "Paid";
  filterUnpaid = data => data.key !== "Paid";

  fetchData = async () => {
    this.setState({
      loading: true
    });
    try {
      const paymentStatistic = await this.apis.call("paymentStatistic", {
        currency: "THB",
        invoiceEntryDateFrom: this.state.date.value.from,
        invoiceEntryDateTo: this.state.date.value.to,
        groupBy: "invoiceStatus"
      });
      const paidStatistic = paymentStatistic.data.filter(this.filterPaid);
      const paidCount = paidStatistic.reduce(this.sumQuantity, 0);
      const paidValue = paidStatistic.reduce(this.sumValue, 0);
      const unpaidStatistic = paymentStatistic.data.filter(this.filterUnpaid);
      const unpaidCount = unpaidStatistic.reduce(this.sumQuantity, 0);
      const unpaidValue = unpaidStatistic.reduce(this.sumValue, 0);
      this.setState({
        paymentStatistic,
        paidCount,
        paidValue,
        unpaidCount,
        unpaidValue
      });
    } catch (e) {
      console.log("e", e);
    }
    this.setState({
      loading: false
    });
  };

  onChange = item => {
    window.localStorage.setItem(this.NAME, JSON.stringify(item));

    this.setState(
      {
        date: item
      },
      () => this.fetchData()
    );
  };

  formatNumber = number => {
    return Intl.NumberFormat("th-TH").format(number);
  };

  formatCurrency = number => {
    if (number > 1000000) {
      return (number / 1000000).toFixed(2) + " M";
    } else if (number > 1000) {
      return (number / 1000).toFixed(2) + " K";
    } else {
      return Intl.NumberFormat("th-TH").format(number);
    }
  };

  render() {
    const { t } = this.props;
    return (
      <BlockUi blocking={this.state.loading}>
        <div className="box__header box__header--shadow px-0 py-0">
          <div className="d-flex flex-wrap justify-content-between pt-2">
            <div className="col-8">
              <h5 className="gray-1">{t("Estimated Payment")}</h5>
              <p>{t("Invoice amount before CN/DN settlement")}</p>
            </div>
            <div className="col-4 d-flex justify-content-end">
              <SelectDatePopover
                date={this.state.date}
                onChange={this.onChange}
              />
            </div>
          </div>
        </div>

        <div className="box__inner px-3 d-flex flex-wrap">
          <div className="col-4 px-0 px-lg-3">
            <p className="text-right">{t("Paid invoices")}</p>
            <h1 className="text-right purple">
              {this.formatCurrency(this.state.paidCount)}
            </h1>
          </div>

          <div className="col-2 offset-1 d-flex justify-content-center px-0">
            <h1 className="purple align-self-end"> = </h1>
          </div>

          <div className="col-4 pl-0 pr-3 px-lg-3">
            <p className="text-right">{t("Value")}</p>
            <h1 className="text-right purple">
              {this.formatCurrency(this.state.paidValue)} THB
            </h1>
          </div>

          <div className="col-4 px-0 px-lg-3">
            <p className="text-right">{t("Unpaid invoices")}</p>
            <h1 className="text-right purple">
              {this.formatCurrency(this.state.unpaidCount)}
            </h1>
          </div>

          <div className="col-2 offset-1 d-flex justify-content-center px-0">
            <h1 className="purple align-self-end"> = </h1>
          </div>

          <div className="col-4 pl-0 pr-3 px-lg-3">
            <p className="text-right">{t("Value")}</p>
            <h1 className="text-right purple">
              {this.formatCurrency(this.state.unpaidValue)} THB
            </h1>
          </div>
        </div>
      </BlockUi>
    );
  }
}

export default withTranslation(["dashboard", "common", "menu"])(PaymentStatic);
