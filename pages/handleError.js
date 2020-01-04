import React, { useState } from "react";
import Router from "next/router";
import moment from "moment";
import GA from "~/libs/ga";

export default function handleError(err, handleDismissBtnModal, btn) {
  const BTN_CLOSE = [
    {
      label: "Close",
      attribute: {
        className: "btn btn--transparent btn-wide",
        onClick: handleDismissBtnModal
      }
    }
  ];
  const BTN_BACK = [
    {
      label: "Back",
      attribute: {
        className: "btn btn--transparent btn-wide",
        onClick: () => {
          Router.back();
        }
      }
    }
  ];
  let data = {};

  if (btn == "BTN_BACK") {
    btn = BTN_BACK;
  } else {
    btn = BTN_CLOSE;
  }

  if (err.response) {
    data = err.response.data;
  } else {
    data = {
      statusCode: 999,
      message: err.message || err,
      button: err.button || BTN_BACK
    };
  }
  if (
    err.code == "ECONNABORTED" ||
    data.statusCode == 503 ||
    data.statusCode == 504
  ) {
    // error timeout case
    GA.event({
      category: "API Timeout",
      action: "Call Non-Auth. API (No Response)",
      label: `${moment().format()}`
    });
    console.log("error timeout case");
    return {
      alertModalAlertTitle: "Error !",
      isAlertModalVisible: true,
      buttonAlert: BTN_CLOSE,
      isTextOnly: true,
      alertModalMsg: [
        "Service temporarily unavailable. Please try again later.",
        <br />,
        "ไม่สามารถเชื่อมต่อกับระบบได้ในขณะนี้ กรุณาทำรายการใหม่อีกครั้ง",
        <hr />,
        <p>
          <strong>Remark / ข้อมูลเพิ่มเติม:</strong>
        </p>,
        <p>
          <strong>{data.statusCode || "-"} :</strong> {data.error || "-"}
        </p>,
        <p>{data.message || "-"}</p>
      ]
    };
  } else if (
    data.statusCode == 400 ||
    data.statusCode == 405 ||
    data.statusCode == 406 ||
    data.statusCode == 413 ||
    data.statusCode == 414 ||
    data.statusCode == 415 ||
    data.statusCode == 500 ||
    data.statusCode == 501 ||
    data.statusCode == 999
  ) {
    // Unexpected Error case
    console.log("Unexpected Error case");

    return {
      alertModalAlertTitle: "Error !",
      isAlertModalVisible: true,
      buttonAlert: btn,
      isTextOnly: true,
      alertModalMsg: [
        "An unexpected error has occurred. Please try again later.",
        <br />,
        "เกิดปัญหาบางอย่างที่ระบบ กรุณาทำรายการใหม่อีกครั้ง",
        <hr />,
        <p>
          <strong>Remark / ข้อมูลเพิ่มเติม:</strong>
        </p>,
        <p>
          <strong>{data.statusCode || "-"} :</strong> {data.error || "-"}
        </p>,
        <p>{data.message || "-"}</p>
      ]
    };
  } else {
    return Router.push({ pathname: "/unexpected-error", query: data });
  }
}
