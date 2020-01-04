import React from "react";
import ReactGA from "react-ga";
var ANALYTICS_CODE = "";
export const initialize = props => {
  if (props.appenv != undefined) {
    if (props.appenv.ANALYTICS_CODE) {
      ReactGA.initialize(props.appenv.ANALYTICS_CODE);
      console.log("Analtics Initialize");
      ANALYTICS_CODE = props.appenv.ANALYTICS_CODE;
      //console.log(props);
    } else {
      //ReactGA.initialize("UA-143075307-1");
      // console.warn("Analtics code is not set.");
    }
  }
};
export const pageview = url => {
  if (!ANALYTICS_CODE) {
    // console.warn("Analtics code is not set.");
    return;
  }
  if (url !== undefined) {
    ReactGA.pageview(url);
    console.log("Analtics track pageview.", url);
  } else {
    url =
      window.location.pathname + window.location.hash + window.location.search;
    ReactGA.pageview(url);
    console.log("Analtics track pageview.", url);
  }
};
export const event = e => {
  if (!ANALYTICS_CODE) {
    console.warn("Analtics code is not set.");
    return;
  }
  if (e !== undefined) {
    ReactGA.event(e);
    // console.log("Analtics track event.", e);
  } else {
    console.log(
      "Analtics Event required event information. Please use GA.event({category : ?? , action : ??})"
    );
  }
};
export const set = (fieldsObject, trackerNames) => {
  if (!ANALYTICS_CODE) {
    // console.warn("Analtics code is not set.");
    return;
  }
  if (fieldsObject !== undefined) {
    if (trackerNames !== undefined) {
      ReactGA.set(fieldsObject, trackerNames);
    } else {
      ReactGA.set(fieldsObject);
    }

    console.log("Analtics set.", fieldsObject, trackerNames);
  } else {
    console.log("Analtics required event information.");
  }
};

export const timing = args => {
  if (!ANALYTICS_CODE) {
    // console.warn("Analtics code is not set.");
    return;
  }
  if (args !== undefined) {
    ReactGA.timing(args);
    console.log("Analtics timing.", args);
  } else {
    console.log("Analtics required event information.");
  }
};
export const exception = args => {
  if (!ANALYTICS_CODE) {
    // console.warn("Analtics code is not set.");
    return;
  }
  if (args !== undefined) {
    ReactGA.exception(args);
    console.log("Analtics timing.", args);
  } else {
    console.log("Analtics exception tracking required args.description.");
  }
};
export const modalview = args => {
  if (!ANALYTICS_CODE) {
    // console.warn("Analtics code is not set.");
    return;
  }
  if (args !== undefined) {
    ReactGA.modalview(args);
    console.log("Analtics timing.", args);
  } else {
    console.log("Analtics modelview tracking required args.description.");
  }
};
export default {
  initialize,
  pageview,
  event,
  set,
  timing,
  exception,
  modalview
};
