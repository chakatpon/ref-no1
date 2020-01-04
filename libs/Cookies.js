import cookie from "js-cookie";

export const setCookie = (key, value, opts) => {
  if (process.browser) {
    cookie.set(key, value, opts);
  }
};

export const removeCookie = key => {
  if (process.browser) {
    cookie.remove(key, {
      expires: 1
    });
  }
};

export const getCookie = (key, req) => {
  return process.browser
    ? getCookieFromBrowser(key)
    : getCookieFromServer(key, req);
};

const getCookieFromBrowser = key => {
  console.log("grabbing key from browser");
  return cookie.get(key);
};

const getCookieFromServer = (key, req) => {
  console.log("grabbing key from server");
  if (!req.headers.cookie) {
    return undefined;
  }
  const rawCookie = req.headers.cookie
    .split(";")
    .find(c => c.trim().startsWith(`${key}=`));
  if (!rawCookie) {
    return undefined;
  }
  return rawCookie.split("=")[1];
};
