import React from "react";
import Router from "next/router";
import SelectDatePopover, { dateCalculator } from "./selectDatePopover";
import moment from "moment";
import BlockUi from "react-block-ui";
import { Doughnut } from "react-chartjs-2";
import { withTranslation } from "~/i18n";

import api from "../../libs/api";
import colorMaps from "../../configs/color.chartInvoice.json";

import "chartjs-plugin-labels";
import { Parser as HtmlToReactParser } from "html-to-react";
import { isThisWeek } from "date-fns";

const htmlToReactParser = new HtmlToReactParser();

const PERMISSION_SELLER = ["Payment Failed"];

class InvoiceStatus extends React.Component {
  constructor(props) {
    super(props);
    this.apis = new api(this.props.domain).group("dashboard");
    const _this = this;
    const dataPoints = [];
    for (let key in colorMaps) {
      dataPoints.push({
        legendText: key,
        y: 0,
        dataValue: 0,
        color: colorMaps[key]
      });
    }

    this.NAME = "invoiceStatusDate";

    this.chartReference = {};

    this.state = {
      sumCountTotal: "",
      value: "",
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
      },
      data: {}
    };
  }

  goToinvList = statuses => {
    window.localStorage.setItem(
      "searchInput-inv",
      JSON.stringify({
        invoiceEntryDateFrom: this.state.date.value.from,
        invoiceEntryDateTo: this.state.date.value.to,
        statuses
      })
    );
    Router.push("/invoice");
  };

  chartClick = chart => {
    if (!chart) {
      return;
    }
    if (chart.length == 0) {
      return;
    }
    const index = chart[0]._index;
    const { data } = this.state;
    this.goToinvList(data.labels[index]);
  };

  async componentDidMount() {
    Chart.pluginService.register({
      beforeInit: function(chart) {
        var hasWrappedTicks = chart.config.data.labels.some(function(label) {
          return label.indexOf("\n") !== -1;
        });

        if (hasWrappedTicks) {
          // figure out how many lines we need - use fontsize as the height of one line
          var tickFontSize = Chart.helpers.getValueOrDefault(
            chart.options.scales.xAxes[0].ticks.fontSize,
            Chart.defaults.global.defaultFontSize
          );
          var maxLines = chart.config.data.labels.reduce(function(
            maxLines,
            label
          ) {
            return Math.max(maxLines, label.split("\n").length);
          },
          0);
          var height =
            (tickFontSize + 2) * maxLines +
            (chart.options.scales.xAxes[0].ticks.padding || 0);

          // insert a dummy box at the bottom - to reserve space for the labels
          Chart.layoutService.addBox(chart, {
            draw: Chart.helpers.noop,
            isHorizontal: function() {
              return true;
            },
            update: function() {
              return {
                height: this.height
              };
            },
            height: height,
            options: {
              position: "bottom",
              fullWidth: 1
            }
          });

          // turn off x axis ticks since we are managing it ourselves
          chart.options = Chart.helpers.configMerge(chart.options, {
            scales: {
              xAxes: [
                {
                  ticks: {
                    display: false,
                    // set the fontSize to 0 so that extra labels are not forced on the right side
                    fontSize: 0
                  }
                }
              ]
            }
          });

          chart.hasWrappedTicks = {
            tickFontSize: tickFontSize
          };
        }
      },
      afterDraw: function(chart) {
        if (chart.hasWrappedTicks) {
          // draw the labels and we are done!
          chart.chart.ctx.save();
          var tickFontSize = chart.hasWrappedTicks.tickFontSize;
          var tickFontStyle = Chart.helpers.getValueOrDefault(
            chart.options.scales.xAxes[0].ticks.fontStyle,
            Chart.defaults.global.defaultFontStyle
          );
          var tickFontFamily = Chart.helpers.getValueOrDefault(
            chart.options.scales.xAxes[0].ticks.fontFamily,
            Chart.defaults.global.defaultFontFamily
          );
          var tickLabelFont = Chart.helpers.fontString(
            tickFontSize,
            tickFontStyle,
            tickFontFamily
          );
          chart.chart.ctx.font = tickLabelFont;
          chart.chart.ctx.textAlign = "center";
          var tickFontColor = Chart.helpers.getValueOrDefault(
            chart.options.scales.xAxes[0].fontColor,
            Chart.defaults.global.defaultFontColor
          );
          chart.chart.ctx.fillStyle = tickFontColor;

          var meta = chart.getDatasetMeta(0);
          var xScale = chart.scales[meta.xAxisID];
          var yScale = chart.scales[meta.yAxisID];

          chart.config.data.labels.forEach(function(label, i) {
            label.split("\n").forEach(function(line, j) {
              chart.chart.ctx.fillText(
                line,
                xScale.getPixelForTick(i + 0.5),
                (chart.options.scales.xAxes[0].ticks.padding || 0) +
                  yScale.getPixelForValue(yScale.min) +
                  // move j lines down
                  j * (chart.hasWrappedTicks.tickFontSize + 2)
              );
            });
          });

          chart.chart.ctx.restore();
        }
      }
    });

    $(document).click(function(event) {
      // event.target is the clicked object
      $(".tooltip-invoice").html("");
    });

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

  formatNumber = number => {
    return Intl.NumberFormat("th-TH").format(number);
  };

  formatCurrency = number => {
    if (number > 1000000) {
      return (number / 1000000).toFixed(1) + " M";
    } else if (number > 1000) {
      return (number / 1000).toFixed(1) + " K";
    } else {
      return number.toFixed(1);
    }
  };

  fetchData = async () => {
    const { t } = this.props;
    this.setState({
      loading: true
    });
    try {
      const invoiceStatus = await this.apis.call("invoiceStatus", {
        currency: "THB",
        invoiceEntryDateFrom: this.state.date.value.from,
        invoiceEntryDateTo: this.state.date.value.to,
        groupBy: "invoiceStatus"
      });

      const sumCountTotal = invoiceStatus.countTotal;
      const sumValue =
        invoiceStatus.amountTotal.quantity *
        invoiceStatus.amountTotal.displayTokenSize;
      const value = `${this.formatNumber(sumValue)}`;
      // const dataPoints = this.state.options.data[0].dataPoints.map(dataPoint => {
      //     let item = invoiceStatus.data.filter(item => item.key === dataPoint.legendText)
      //     if (item.length) {
      //         item = item[0]
      //         const percent = parseFloat((((item.countTotal) / invoiceStatus.countTotal) * 100).toFixed(2))
      //         const dataValue = item.amountTotal && item.amountTotal.quantity ? item.amountTotal.quantity * item.amountTotal.displayTokenSize : 0
      //         return { ...dataPoint, y: percent, dataValue, label: item.countTotal }
      //     }
      //     return { ...dataPoint, y: 0, dataValue: 0, label: undefined }
      // })

      const colors = [];
      const keys = [];
      const quantities = [];
      const countTotals = [];
      const texts = [];
      let PERMISSION = [];
      if (this.props.user.organisationUnit === "SELLER") {
        PERMISSION = PERMISSION_SELLER;
      }

      for (let key in colorMaps) {
        if (PERMISSION.includes(key)) {
          continue;
        }
        const data = invoiceStatus.data.filter(item => item.key === key);

        let quantity = 0;
        let countTotal = 0;
        let text = "\n";
        if (data.length) {
          const item = data[0];
          quantity = item.amountTotal
            ? item.amountTotal.quantity * item.amountTotal.displayTokenSize
            : 0;
          countTotal = item.countTotal;
          text = this.formatCurrency(quantity) + text;
        }
        countTotals.push(countTotal);
        quantities.push(quantity);
        colors.push(colorMaps[key]);
        keys.push(t(key));
        texts.push(text);
      }
      const data = {
        datasets: [
          {
            data: countTotals,
            value: quantities,
            tooltipPercent: [],
            // text: ["4.5k\n(50%)", "4.5k\n(50%)", "4.5k\n(50%)", "4.5k\n(50%)", "4.5k\n(50%)", "4.5k\n(50%)", "4.5k\n(50%)"],
            text: texts,
            backgroundColor: colors
          }
        ],
        // These labels appear in the legend and in the tooltips when hovering different arcs
        labels: keys
      };
      const currency = invoiceStatus.amountTotal.token;

      this.setState({
        sumCountTotal,
        value,
        data,
        currency
      });
    } catch (e) {
      console.log("e", e);
    }
    this.setState({
      loading: false
    });
  };

  setChartOption = () => {
    const _this = this;
    const { t } = _this.props;
    return {
      options: {
        borderWidth: 0
      },
      tooltips: {
        enabled: false,
        custom: function(tooltipModel, chart) {
          // Tooltip Element
          var tooltipEl = document.getElementById("chartjs-tooltip");

          // Create element on first render
          if (!tooltipEl) {
            tooltipEl = document.createElement("div");
            tooltipEl.id = "chartjs-tooltip";
            tooltipEl.innerHTML = '<div class="tooltip-invoice"></div>';
            document.body.appendChild(tooltipEl);
          }

          // Hide if no tooltip
          if (tooltipModel.opacity === 0) {
            tooltipEl.style.opacity = 0;
            return;
          }

          // Set caret Position
          // tooltipEl.classList.remove('above', 'below', 'no-transform');
          if (tooltipModel.yAlign) {
            tooltipEl.classList.add(tooltipModel.yAlign);
          } else {
            tooltipEl.classList.add("no-transform");
          }

          function getBody(bodyItem) {
            return bodyItem.lines;
          }

          // Set Text
          if (tooltipModel.body) {
            var titleLines = tooltipModel.title || [];
            var bodyLines = tooltipModel.body.map(getBody);
            var innerHtml = "";
            // var innerHtml = '<thead>';

            // titleLines.forEach(function (title) {
            //     innerHtml += '<tr><th>' + title + '</th></tr>';
            // });
            // innerHtml += '</thead><div class="tooltip-chart" >';
            innerHtml += '<div class="tooltip-chart" >';

            bodyLines.forEach(function(body, i) {
              const index = tooltipModel.dataPoints[0].index;
              const value = _this.state.data.datasets[0].value[index];
              const countTotal = _this.state.data.datasets[0].data[index];
              const percentage =
                _this.state.data.datasets[0].tooltipPercent[index];
              var colors = tooltipModel.labelColors[i];
              var style = "background:" + colors.backgroundColor;
              style += "; border-color:" + colors.borderColor;
              style += "; border-width: 2px;";
              var span = "<span></span>";
              innerHtml += `<div class="text-right text-bold"> ${countTotal} (${percentage}%) </div>`;
              innerHtml +=
                '<div class="text-right">' +
                _this.formatNumber(value) +
                `  [${t(`THB`)}] </div>`;
            });
            innerHtml += '<span class="bullet"></span></div>';

            var tableRoot = tooltipEl.querySelector(".tooltip-invoice");
            tableRoot.innerHTML = innerHtml;
          }

          // `this` will be the overall tooltip
          var position = this._chart.canvas.getBoundingClientRect();

          // Display, position, and set styles for font
          tooltipEl.style.opacity = 1;
          tooltipEl.style.position = "absolute";
          tooltipEl.style.left =
            position.left +
            window.pageXOffset +
            tooltipModel.caretX -
            10 +
            "px";
          tooltipEl.style.top =
            position.top + window.pageYOffset + tooltipModel.caretY - 60 + "px";
          tooltipEl.style.fontFamily = "kanitlight";
          tooltipEl.style.fontSize = "14px";
          tooltipEl.style.fontStyle = "normal";
          tooltipEl.style.padding = "0px";
          tooltipEl.style.pointerEvents = "none";
          tooltipEl.style.boberRadius = "3.75px";
        }
      },
      legend: {
        display: true,
        position: "right",
        labels: {
          usePointStyle: true,
          // fontStyle: 'light',
          fontFamily: "kanitlight",
          fontSize: 14
        },
        onClick: function(e, legendItem) {
          if (!legendItem) {
            return;
          }
          _this.goToinvList(legendItem.text);
        }
      },
      title: {
        display: true,
        position: "bottom",
        fontStyle: "light",
        fontFamily: "kanitlight",
        padding: 10,
        fontSize: 14,
        text: `${t("Unit")}: ${t(
          "Number of invoice"
        )}                                                          `
      },
      plugins: {
        labels: [
          {
            render: function(args) {
              const percentage = args.percentage;
              const text = args.dataset.text[args.index];
              _this.state.data.datasets[0].tooltipPercent[
                args.index
              ] = percentage;
              return `${text}(${percentage}%)`;
            },
            fontColor: "white",
            fontFamily: "kanitbold",
            fontSize: 14
          }
        ]
      }
    };
  };

  setChartMobileOption = () => {
    const _this = this;
    const { t } = _this.props;
    return {
      options: {
        borderWidth: 0
      },
      legend: {
        display: false
      },

      tooltips: {
        enabled: false,
        custom: function(tooltipModel, chart) {
          // Tooltip Element
          var tooltipEl = document.getElementById("chartjs-tooltip");

          // Create element on first render
          if (!tooltipEl) {
            tooltipEl = document.createElement("div");
            tooltipEl.id = "chartjs-tooltip";
            tooltipEl.innerHTML = '<div class="tooltip-invoice"></div>';
            document.body.appendChild(tooltipEl);
          }

          // Hide if no tooltip
          if (tooltipModel.opacity === 0) {
            tooltipEl.style.opacity = 0;
            return;
          }

          // Set caret Position
          // tooltipEl.classList.remove('above', 'below', 'no-transform');
          if (tooltipModel.yAlign) {
            tooltipEl.classList.add(tooltipModel.yAlign);
          } else {
            tooltipEl.classList.add("no-transform");
          }

          function getBody(bodyItem) {
            return bodyItem.lines;
          }

          // Set Text
          if (tooltipModel.body) {
            var titleLines = tooltipModel.title || [];
            var bodyLines = tooltipModel.body.map(getBody);
            var innerHtml = "";
            // var innerHtml = '<thead>';

            // titleLines.forEach(function (title) {
            //     innerHtml += '<tr><th>' + title + '</th></tr>';
            // });
            // innerHtml += '</thead><div class="tooltip-chart" >';
            innerHtml += '<div class="tooltip-chart" >';

            bodyLines.forEach(function(body, i) {
              const index = tooltipModel.dataPoints[0].index;
              const value = _this.state.data.datasets[0].value[index];
              const countTotal = _this.state.data.datasets[0].data[index];
              const percentage =
                _this.state.data.datasets[0].tooltipPercent[index];
              var colors = tooltipModel.labelColors[i];
              var style = "background:" + colors.backgroundColor;
              style += "; border-color:" + colors.borderColor;
              style += "; border-width: 2px;";
              var span = "<span></span>";
              innerHtml += `<div class="text-right text-bold"> ${countTotal} (${percentage}%) </div>`;
              innerHtml +=
                '<div class="text-right">' +
                _this.formatNumber(value) +
                "  THB </div>";
            });
            innerHtml += '<span class="bullet"></span></div>';

            var tableRoot = tooltipEl.querySelector(".tooltip-invoice");
            tableRoot.innerHTML = innerHtml;
          }

          // `this` will be the overall tooltip
          var position = this._chart.canvas.getBoundingClientRect();

          // Display, position, and set styles for font
          tooltipEl.style.opacity = 1;
          tooltipEl.style.position = "absolute";
          tooltipEl.style.left =
            position.left +
            window.pageXOffset +
            tooltipModel.caretX -
            10 +
            "px";
          tooltipEl.style.top =
            position.top + window.pageYOffset + tooltipModel.caretY - 60 + "px";
          tooltipEl.style.fontFamily = "kanitlight";
          tooltipEl.style.fontSize = "14px";
          tooltipEl.style.fontStyle = "normal";
          tooltipEl.style.padding = "0px";
          tooltipEl.style.pointerEvents = "none";
          tooltipEl.style.boberRadius = "3.75px";
        }
      },

      title: {
        display: true,
        position: "bottom",
        fontStyle: "light",
        fontFamily: "kanitlight",
        padding: 10,
        fontSize: 10,
        text: `${t("Unit")}: ${t(
          "Number of invoice"
        )}                                                          `
      },
      plugins: {
        labels: [
          {
            render: function(args) {
              const percentage = args.percentage;
              const text = args.dataset.text[args.index];
              _this.state.data.datasets[0].tooltipPercent[
                args.index
              ] = percentage;
              return `${text}(${percentage}%)`;
            },
            fontColor: "white",
            fontFamily: "kanitbold",
            fontSize: 10
          }
        ]
      }
    };
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

  renderCustomLegend(data) {
    const legendItem = data.datasets[0].backgroundColor.map((color, i) => {
      return (
        <li
          className="col-6 row pl-4 pr-0"
          style={{ cursor: "pointer" }}
          onClick={() => {
            this.goToinvList(data.labels[i]);
          }}
        >
          <span className="col-1 p-0">
            <span
              style={{
                display: "inline-block",
                width: "15px",
                height: "15px",
                backgroundColor: color,
                borderRadius: "50%"
              }}
            ></span>
          </span>
          <span
            calssName="col-10 p-0"
            style={{
              maxWidth: 90,
              wordWrap: "break-word",
              lineHeight: "1rem",
              marginLeft: "5px",
              fontSize: "11px"
            }}
          >
            {data.labels[i]}
          </span>
        </li>
      );
    });
    const legendList = (
      <ui className="row" style={{ listStyleType: "none" }}>
        {legendItem}
      </ui>
    );
    return legendList;
  }

  render() {
    const { CanvasJS, data } = this.state;
    const { t } = this.props;
    const options = this.setChartOption();
    const mobileOptions = this.setChartMobileOption();

    return (
      <BlockUi blocking={this.state.loading}>
        <div className="box__header box__header--shadow px-0 py-0">
          <div className="d-flex flex-wrap justify-content-between pt-2">
            <div className="col-8">
              <h5 className="gray-1">{t("Invoice Status")}</h5>
            </div>
            <div className="col d-flex justify-content-end">
              <SelectDatePopover
                date={this.state.date}
                onChange={this.onChange}
              />
            </div>
          </div>
        </div>
        <div className="box__inner pt-0 pt-lg-3 px-3">
          <h5 className="purple d-none d-sm-block d-md-block d-lg-block d-xl-block">
            <span className="mr-3">
              {t("Total")}
              {": "}
              {this.formatNumber(this.state.sumCountTotal)} {t("invoices1")}
            </span>
            <br className="d-block d-md-none" />
            <br className="d-block d-md-none" />
            <span>
              {t("Value")}
              {": "}
              {this.state.value} {t(this.state.currency)}
            </span>
          </h5>
          <h6 className="purple d-block d-sm-none d-md-none d-lg-none d-xl-none">
            <span className="mr-1">
              Total: {this.formatNumber(this.state.sumCountTotal)} invoices
            </span>
            <br />
            <span>Value : {this.state.value}</span>
          </h6>
          {/* <CanvasJS
                        // className="doughnut-chart"
                        options={this.state.options}
                        style={{ height: "200px", width: "100%" }}
                    /> */}
          <div className="d-block d-sm-none d-md-none d-lg-none d-xl-none">
            <Doughnut
              id="mymobileChart"
              ref="mobileChart"
              data={data}
              options={mobileOptions}
              height={400}
              width={400}
              onElementsClick={this.chartClick}
            />
            {/* {this.refs.mobileChart &&
              htmlToReactParser.parse(
                this.refs.mobileChart.chartInstance.generateLegend()
              )}
            {this.refs.mobileChart &&
              this.refs.mobileChart.chartInstance.update()} */}
            {data.datasets && data.datasets.length > 0
              ? this.renderCustomLegend(this.state.data)
              : null}
          </div>
          <div className="d-none d-sm-block d-md-block d-lg-block d-xl-block">
            <Doughnut
              id="myChart"
              ref={reference => (this.chartReference = reference)}
              data={data}
              options={options}
              onElementsClick={this.chartClick}
            />
          </div>
        </div>
      </BlockUi>
    );
  }
}

export default withTranslation(["dashboard", "common", "menu"])(InvoiceStatus);
