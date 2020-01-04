import React, { PureComponent } from "react";
import swal from "@sweetalert/with-react";
import _ from "lodash";

const ButtonModal = ({ ele }) => {
  return (
    <div className="swal-button-container">
      <button
        {...(_.has(ele, "attribute") ? ele.attribute : {})}
        onClick={
          _.has(ele, "attribute") && _.has(ele.attribute, "onClick")
            ? e => {
                ele.attribute.onClick(e);
                swal.close();
              }
            : () => swal.close()
        }
        className={`swal-button ${
          _.has(ele, "attribute") && _.has(ele.attribute, "className")
            ? ele.attribute.className
            : ""
        }`}
      >
        {_.has(ele, "label") ? ele.label : "OK"}
      </button>
    </div>
  );
};

export default function Swal(option = {}) {
  let icon = "";
  switch (_.has(option, "type") ? option.type : null) {
    case "success":
      icon = "fa-check-circle";
      break;
    case "error":
      icon = "fa-times-circle";
      break;
    case "warning":
      icon = "fa-exclamation-triangle";
      break;
    case "info":
      icon = "fa-info-circle";
      break;
    case "question":
      icon = "fa-question-circle";
      break;
  }

  return swal({
    title: _.has(option, "title") ? option.title : "",
    closeOnClickOutside: _.has(option, "closeOnClickOutside")
      ? option.closeOnClickOutside
      : true,
    content: (
      <div>
        <div className="text-center">
          {icon && (
            <i
              className={`fa ${icon}`}
              style={{ color: "rgb(175, 54, 148)", fontSize: "100px" }}
            />
          )}
          <div>
            {_.has(option, "message") ? option.message : ""}
            {_.has(option, "html") ? option.html : ""}
          </div>
        </div>
        <div className="swal-footer">
          {_.has(option, "buttons") ? (
            _.map(option.buttons, (ele, i) => {
              return <ButtonModal ele={ele} key={i.toString()} />;
            })
          ) : (
            <ButtonModal />
          )}
        </div>
      </div>
    ),
    buttons: false
  });
}
