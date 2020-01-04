const queryString = require("query-string");
const FormData = require("form-data");
const multer = require("multer");
const fs = require("fs");

const wrapFetch = require("zipkin-instrumentation-fetch");
const { tracer } = require("../libs/zipkinTracer");
const zipkinFetch = tracer != null ? wrapFetch(fetch, { tracer }) : fetch;

const TIMEOUT = 60; // seconds

const storage = multer.diskStorage({
  destination: "./tmp/",
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

function removeContentForUploadFile(headers) {
  Object.keys(headers).forEach(key => {
    if (
      key.toLowerCase() === "content-type" ||
      key.toLowerCase() === "content-length"
    ) {
      delete headers[key];
    }
  });
}

function prepareUrl(host, server, req) {
  const { path, query } = req;
  let url = path;

  if (server !== "") url = path.replace(`/${server}`, "");

  return `${host}${url}?${queryString.stringify(query)}`;
}

function prepareOption(url, method, headers) {
  // We remove cookie from headers because not use for query the api and reduce header size
  delete headers.cookie;

  const options = {
    method: method,
    headers: headers
  };

  if (url.indexOf("https") !== -1) {
    options.agent = new (require("https")).Agent({
      rejectUnauthorized: false
    });
  }

  return options;
}

function prepareUploadFile(key, req) {
  const form = new FormData();

  form.append(key, fs.createReadStream(req.file.path));

  return form;
}

function fetchWithTimeout(url, options, timeout = 20) {
  return Promise.race([
    zipkinFetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("request timeout")), timeout * 1000)
    )
  ]);
}

async function curl(url, options, req, res) {
  try {
    console.log("Call api(Fetch) : ", url);
    const response = await fetchWithTimeout(url, options, TIMEOUT);
    let result = await response.json();

    result =
      typeof result === "object"
        ? {
            ...result,
            headerStatusCode: response.status
          }
        : { data: result, headerStatusCode: response.status };

    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    res.json(result);
  } catch (e) {
    console.warn(
      `*** Error method ${options.method} url: ${url}, message: ${e.message}`
    );

    res.status(500).send(e.message);
  }
}

async function curlBasic(url, options) {
  try {
    const response = await fetchWithTimeout(url, options, TIMEOUT);
    const result = await response.json();

    return result;
  } catch (e) {
    console.warn(
      `Error method ${options.method} url: ${url}, message: ${e.message}`
    );
  }
}
module.exports.curlBasic = curlBasic;

module.exports = function(server) {
  // Get api from corda server
  server.get("/corda/*", async (req, res) => {
    const headers = req.headers;
    const url = prepareUrl(process.env.API_DOMAIN_URL_10004, "corda", req);
    const options = prepareOption(url, "GET", headers);

    await curl(url, options, req, res);
  });

  server.post("/corda/*", upload.single("file"), async (req, res) => {
    const headers = req.headers;
    const url = prepareUrl(process.env.API_DOMAIN_URL_10004, "corda", req);
    let newForm = req.body;

    if (req.file && req.file.path) {
      let key = "file";

      if (url.includes("multiple")) {
        key = "files";
      }

      newForm = prepareUploadFile(key, req);

      removeContentForUploadFile(headers);
    }

    const options = prepareOption(url, "POST", headers);
    const body =
      newForm instanceof FormData ? newForm : JSON.stringify(newForm);
    const request = {
      ...options,
      body: body
    };

    await curl(url, request, req, res);
  });

  server.put("/corda/*", upload.single("file"), async (req, res) => {
    const headers = req.headers;
    const url = prepareUrl(process.env.API_DOMAIN_URL_10004, "corda", req);
    let newForm = req.body;

    if (req.file && req.file.path) {
      let key = "file";

      if (url.includes("multiple")) {
        key = "files";
      }

      newForm = prepareUploadFile(key, req);

      removeContentForUploadFile(headers);
    }

    const options = prepareOption(url, "PUT", headers);
    const body =
      newForm instanceof FormData ? newForm : JSON.stringify(newForm);
    const request = {
      ...options,
      body: body
    };

    await curl(url, request, req, res);
  });

  // Get api from off-chain server
  server.get("/offchain/*", async (req, res) => {
    const headers = req.headers;
    const url = prepareUrl(process.env.API_DOMAIN_URL_12000, "offchain", req);
    const options = prepareOption(url, "GET", headers);

    await curl(url, options, req, res);
  });

  server.post("/offchain/*", upload.single("file"), async (req, res) => {
    const headers = req.headers;
    const url = prepareUrl(process.env.API_DOMAIN_URL_12000, "offchain", req);
    let newForm = req.body;

    if (req.file && req.file.path) {
      let key = "file";

      if (url.includes("multiple")) {
        key = "files";
      }

      newForm = prepareUploadFile(key, req);

      removeContentForUploadFile(headers);
    }

    const options = prepareOption(url, "POST", headers);
    const body =
      newForm instanceof FormData ? newForm : JSON.stringify(newForm);
    const request = {
      ...options,
      body: body
    };

    await curl(url, request, req, res);
  });

  server.put("/offchain/*", upload.single("file"), async (req, res) => {
    const headers = req.headers;
    const url = prepareUrl(process.env.API_DOMAIN_URL_12000, "offchain", req);
    let newForm = req.body;

    if (req.file && req.file.path) {
      let key = "file";

      if (url.includes("multiple")) {
        key = "files";
      }

      newForm = prepareUploadFile(key, req);

      removeContentForUploadFile(headers);
    }

    const options = prepareOption(url, "PUT", headers);
    const body =
      newForm instanceof FormData ? newForm : JSON.stringify(newForm);
    const request = {
      ...options,
      body: body
    };

    await curl(url, request, req, res);
  });

  // Get api from standard server
  server.get("/standard/*", async (req, res) => {
    const headers = req.headers;
    const url = prepareUrl(process.env.API_DOMAIN_URL_8999, "", req);
    const options = prepareOption(url, "GET", headers);

    await curl(url, options, req, res);
  });

  server.post("/standard/*", upload.single("file"), async (req, res) => {
    const headers = req.headers;
    const url = prepareUrl(process.env.API_DOMAIN_URL_8999, "", req);
    let newForm = req.body;

    if (req.file && req.file.path) {
      let key = "file";

      if (url.includes("multiple")) {
        key = "files";
      }

      newForm = prepareUploadFile(key, req);

      removeContentForUploadFile(headers);
    }

    const options = prepareOption(url, "POST", headers);
    const body =
      newForm instanceof FormData ? newForm : JSON.stringify(newForm);
    const request = {
      ...options,
      body: body
    };

    await curl(url, request, req, res);
  });

  server.put("/standard/*", upload.single("file"), async (req, res) => {
    const headers = req.headers;
    const url = prepareUrl(process.env.API_DOMAIN_URL_8999, "", req);
    let newForm = req.body;

    if (req.file && req.file.path) {
      let key = "file";

      if (url.includes("multiple")) {
        key = "files";
      }

      newForm = prepareUploadFile(key, req);

      removeContentForUploadFile(headers);
    }

    const options = prepareOption(url, "PUT", headers);
    const body =
      newForm instanceof FormData ? newForm : JSON.stringify(newForm);
    const request = {
      ...options,
      body: body
    };

    await curl(url, request, req, res);
  });
};
