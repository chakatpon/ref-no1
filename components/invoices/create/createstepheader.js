import React, { Component } from "react";
import { i18n, withTranslation } from "~/i18n";
const MODEL_CREATE_INVOICE_STEP = [
  {
    stepNo: 1,
    stepTitle: "Select Type of Invoice"
  },
  {
    stepNo: 2,
    stepTitle: "Select Items"
  },
  {
    stepNo: 3,
    stepTitle: "Insert Invoice Details"
  },
  {
    stepNo: 4,
    stepTitle: "Summary"
  }
];
class Stepheader extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { t } = this.props;
    return (
      <div id="invoice_create" className="row">
        <div id="step-indicator" className="col-12">
          <ul className="d-flex justify-content-center">
            {MODEL_CREATE_INVOICE_STEP.map(row => {
              let className = "";
              if (this.props.mainstate.currentStep > row.stepNo) {
                className = "finished";
              }
              if (this.props.mainstate.currentStep == row.stepNo) {
                className = "active";
              }
              if (this.props.mainstate.currentStep - 1 > row.stepNo) {
                className = "finished no-gradient";
              }

              return (
                <li
                  key={`step-${row.stepNo}`}
                  className={`flex-fill ${className}`}
                >
                  <div
                    className={`indicator step-${row.stepNo} rounded-circle text-center`}
                  >
                    <span className="number">{row.stepNo}</span>
                    <i className="fa fa-check" />
                  </div>
                  <p className="text-center">{t(row.stepTitle)}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }
}

export default withTranslation(["invoice-create"])(Stepheader);
