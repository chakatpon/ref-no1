import React from "react";

import Popover, { ArrowContainer } from "react-tiny-popover";

export default class MatchDetailSearch extends React.Component {
    state = {
        isPopoverOpen: false,
        text: ""
    };

    formatCurrency = (number) => {
        if (number > 1000000) {
            return (number / 1000000).toFixed(2) + " M"
        } else if (number > 1000) {
            return (number / 1000).toFixed(2) + " K"
        } else {
            return Intl.NumberFormat('th-TH').format(number);
        }
    }

    render() {
        const { isPopoverOpen } = this.state;
        const { hideTooltip } = this.props
        return (
            <Popover
                isOpen={isPopoverOpen && !hideTooltip}
                position={['top']}
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
                                paddingLeft: "20px",
                                paddingRight: "20px",
                                borderRadius: "10px"
                            }}
                        >
                            {this.props.value}
                        </div>
                    </ArrowContainer>
                )}
            >
                <a
                    onMouseEnter={() => this.setState({ isPopoverOpen: true })}
                    onMouseLeave={() => this.setState({ isPopoverOpen: false })}
                    href="javascript:void(0);"
                    className="graph-item"
                    data-placement="top"
                >
                    &nbsp;
              </a>
            </Popover>
        );
    }
}
