import React from "react";
import Popover, { ArrowContainer } from "react-tiny-popover";
import { withTranslation } from "~/i18n";

import moment from "moment";
export const dateCalculator = () => {
  let dateChoice = [
    {
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
    {
      name: "Yesterday",
      value: {
        from: moment()
          .subtract(1, "day")
          .startOf("day")
          .format("DD/MM/YYYY"),
        to: moment()
          .subtract(1, "day")
          .endOf("day")
          .format("DD/MM/YYYY")
      },
      check: false
    },
    {
      name: "This Week",
      value: {
        from: moment()
          .startOf("isoWeek")
          .format("DD/MM/YYYY"),
        to: moment()
          .endOf("isoWeek")
          .format("DD/MM/YYYY")
      },
      check: false
    },
    {
      name: "Last Week",
      value: {
        from: moment()
          .subtract(1, "week")
          .startOf("isoWeek")
          .format("DD/MM/YYYY"),
        to: moment()
          .subtract(1, "week")
          .endOf("isoWeek")
          .format("DD/MM/YYYY")
      },
      check: false
    },
    {
      name: "This Month",
      value: {
        from: moment()
          .startOf("month")
          .format("DD/MM/YYYY"),
        to: moment()
          .endOf("month")
          .format("DD/MM/YYYY")
      },
      check: false
    },
    {
      name: "Last Month",
      value: {
        from: moment()
          .subtract(1, "month")
          .startOf("month")
          .format("DD/MM/YYYY"),
        to: moment()
          .subtract(1, "month")
          .endOf("month")
          .format("DD/MM/YYYY")
      },
      check: false
    },
    {
      name: "This Year",
      value: {
        from: moment()
          .startOf("year")
          .format("DD/MM/YYYY"),
        to: moment()
          .endOf("year")
          .format("DD/MM/YYYY")
      },
      check: false
    },
    {
      name: "Past 1 Year",
      value: {
        from: moment()
          .subtract(1, "year")
          .startOf("day")
          .format("DD/MM/YYYY"),
        to: moment()
          .endOf("day")
          .format("DD/MM/YYYY")
      },
      check: false
    }
  ];
  return dateChoice;
};

class SelectDatePopover extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isPopoverOpen: false,
      dateChoice: new dateCalculator()
    };
  }
  componentWillReceiveProps(props) {
    if (props.date) {
      const { dateChoice } = this.state;
      const newDateChoice = dateChoice.map(item => {
        if (props.date.name === item.name) {
          //this.props.onChange(item)
          return { ...item, check: true };
        }
        return { ...item, check: false };
      });
      this.setState({
        dateChoice: newDateChoice
      });
    }
  }

  onChange = item => {
    this.props.onChange(item);
  };

  renderCheck = check => {
    if (check) {
      return (
        <i className="fa fa-check" style={{ color: "purple", width: "25px" }} />
      );
    }
    return <div style={{ display: "inline", marginRight: "25px" }} />;
  };
  render() {
    const { isPopoverOpen } = this.state;
    const { t } = this.props;
    return (
      <Popover
        isOpen={isPopoverOpen}
        position={["bottom"]}
        padding={3}
        onClickOutside={() => this.setState({ isPopoverOpen: false })}
        content={({ position, targetRect, popoverRect }) => (
          <ArrowContainer // if you'd like an arrow, you can import the ArrowContainer!
            position={position}
            targetRect={targetRect}
            popoverRect={popoverRect}
            arrowColor={"white"}
            arrowSize={10}
          >
            <div
              style={{
                backgroundColor: "white",
                boxShadow: "0px 0px 30px rgb(175, 183, 196)",
                paddingTop: "10px",
                paddingBottom: "10px",
                paddingLeft: "10px",
                paddingRight: "10px",
                borderRadius: "10px"
              }}
              onClick={() => this.setState({ isPopoverOpen: !isPopoverOpen })}
            >
              {this.state.dateChoice.map(item => {
                return (
                  <div
                    key={item.name}
                    className="date-choice"
                    onClick={() => this.onChange(item)}
                  >
                    {this.renderCheck(item.check)}
                    {t(item.name)}
                  </div>
                );
              })}
            </div>
          </ArrowContainer>
        )}
      >
        <a
          href="javascript:void(0);"
          onClick={() => this.setState({ isPopoverOpen: !isPopoverOpen })}
        >
          <strong className="purple">
            {t(this.props.date) && t(this.props.date.name)}
          </strong>{" "}
          <i className="fa fa-chevron-down purple" />
        </a>
      </Popover>
    );
  }
}

export default withTranslation(["common"])(SelectDatePopover);
