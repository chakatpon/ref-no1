import React from "react";

import Popover, { ArrowContainer } from "react-tiny-popover";

export default class MatchDetailSearch extends React.Component {
    state = {
        isPopoverOpen: false,
        text: ""
    };

    clickCheck = (e, index) => {
        const { chartShow } = this.props;
        chartShow[index].show = !chartShow[index].show;
        this.props.onFilter(chartShow);
    };


    onChange = e => {
        this.setState({
            text: e.target.value
        });
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
        return (
            <Popover
                isOpen={isPopoverOpen}
                position={['bottom']}
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
                            {this.formatCurrency(this.props.value)}
                        </div>
                    </ArrowContainer>
                )}
            >
                <div className="progress"
                    onMouseEnter={() => this.setState({ isPopoverOpen: true })}
                    onMouseLeave={() => this.setState({ isPopoverOpen: false })}
                >
                    <div
                        className="progress-bar"
                        role="progressbar"
                        style={{
                            width: `${this.props.totalPercent}%`,
                            backgroundColor: this.props.color
                        }}

                        aria-valuenow="9.25"
                        aria-valuemin="0"
                        aria-valuemax="100"
                    />
                </div>
            </Popover>
        );
    }
}
