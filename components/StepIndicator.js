import React, { Component } from "react";
import { withTranslation } from "~/i18n";

class StepIndicator extends Component {
  componentDidMount() {
    $(`#step${this.props.activeStep}`).addClass("active");
  }

  render() {
    const { activeStep, contentStep, lang, t } = this.props;

    return (
      <div id="step-indicator" className="col-12">
        <ul className="d-flex justify-content-center">
          {contentStep &&
            contentStep.map((item, index) => {
              const addClassFinish = index + 1 < activeStep ? "finished" : "";

              return (
                <li
                  id={`step${index + 1}`}
                  key={item + index}
                  className={`flex-fill ${addClassFinish}`}
                >
                  <div
                    className={`indicator step-${activeStep} rounded-circle text-center`}
                  >
                    <span className="number">{index + 1}</span>
                    <i className="fa fa-check" />
                  </div>
                  <p className="text-center">{t(`${lang}:${item}`)}</p>
                </li>
              );
            })}
        </ul>
      </div>
    );
  }
}

export default withTranslation(["debit-create", "request-create"])(
  StepIndicator
);
