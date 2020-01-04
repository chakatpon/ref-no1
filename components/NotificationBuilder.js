import React, { Component } from "react";
import io from "socket.io-client";
import ReactNotification from "react-notifications-component";

import GA from "~/libs/ga";

class NotificationBuilder extends Component {
  constructor(props) {
    super(props);
    this.notificationDOMRef = React.createRef();
  }

  componentDidMount() {
    const username = this.props.authority
      ? this.props.authority.name
      : "no-user";
    this.socket = io.connect("/notification");
    this.socket.emit("userManager", username);
    this.socket.on(username, (message, actionType, messageType, GA_EVENT) => {
      switch (actionType) {
        case "success":
          //do something when 'success'

          switch (messageType) {
            case "create-invoice-po":
              // do something
              this.addNotification("success", message);
              this.googleAnalytic(GA_EVENT);
              break;
            case "create-invoice-gr":
              // do something
              this.addNotification("success", message);
              this.googleAnalytic(GA_EVENT);
              break;
            case "edit-invoice-po":
              // do something
              this.addNotification("success", message);
              this.googleAnalytic(GA_EVENT);
              break;
            case "edit-invoice-gr":
              // do something
              this.addNotification("success", message);
              this.googleAnalytic(GA_EVENT);
              break;
            case "resubmit-invoice-po":
              // do something
              this.addNotification("success", message);
              this.googleAnalytic(GA_EVENT);
              break;
            case "resubmit-invoice-gr":
              // do something
              this.addNotification("success", message);
              this.googleAnalytic(GA_EVENT);
              break;
            case "3-way-matching":
              // do something
              break;
            case "liv-posting-result":
              // do something
              break;
            case "io-tester":
              this.addNotification("success", message);
              break;
            default:
              this.addNotification("success", message);
              break;
          }
          break;

        case "failed":
          //do something when 'error'
          switch (messageType) {
            case "create-invoice-po":
              // do something
              this.addNotification("failed", message);
              this.googleAnalytic(GA_EVENT);
              break;
            case "create-invoice-gr":
              // do something
              this.addNotification("failed", message);
              this.googleAnalytic(GA_EVENT);
              break;
            case "edit-invoice-po":
              // do something
              this.addNotification("failed", message);
              this.googleAnalytic(GA_EVENT);
              break;
            case "edit-invoice-gr":
              // do something
              this.addNotification("failed", message);
              this.googleAnalytic(GA_EVENT);
              break;
            case "resubmit-invoice-po":
              // do something
              this.addNotification("failed", message);
              this.googleAnalytic(GA_EVENT);
              break;
            case "resubmit-invoice-gr":
              // do something
              this.addNotification("failed", message);
              this.googleAnalytic(GA_EVENT);
              break;
            case "3-way-matching":
              // do something
              break;
            case "liv-posting-result":
              // do something
              break;
            case "io-tester":
              this.addNotification("failed", message);
              break;
            default:
              this.addNotification("failed", message);
              break;
          }
          break;

        default:
          break;
      }
    });
  }

  componentWillUnmount() {
    this.socket.disconnect();
  }

  googleAnalytic = GA_EVENT => {
    GA.event(GA_EVENT);
  };

  addNotification = (type, message) => {
    this.notificationDOMRef.current.addNotification({
      // title,
      message,
      type,
      insert: "top",
      container: "top-right",
      animationIn: ["animated", "fadeIn"],
      animationOut: ["animated", "fadeOut"],
      dismiss: { duration: 5000 },
      dismissable: { click: true },
      breakpoint: 300
    });
  };

  render() {
    return (
      <div>
        <ReactNotification
          ref={this.notificationDOMRef}
          types={[
            {
              htmlClasses: ["notification-success"],
              name: "success"
            },
            {
              htmlClasses: ["notification-failed"],
              name: "failed"
            }
          ]}
        />
      </div>
    );
  }
}

export default NotificationBuilder;
