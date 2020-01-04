const axios = require("axios");
const CustomException = require("../libs/exception");
const b2papi = require("../libs/b2papi");
//multer
const multer = require("multer");
const storage = multer.diskStorage({
  destination: "./tmp/",
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});
const fs = require("fs");
const upload = multer({ storage: storage });
const FormData = require("form-data");
module.exports = function(server, queryString) {
  server.post(
    "/api/files/multiple-upload",
    upload.single("file"),
    (req, res) => {
      let form = new FormData();
      form.append("files", fs.createReadStream(req.file.path));
      console.log(form);

      let authorization = req.headers["authorization"];
      if (req.cookies["aToken"]) {
        authorization = "Bearer " + req.cookies["aToken"];
      }
      const headers = {
        Accept: "application/json",
        Authorization: authorization
      };

      let url = process.env.API_DOMAIN_URL_10004 + req.path;

      fetch(url, {
        method: "post",
        strictSSL: false,
        agent: new (require("https")).Agent({
          rejectUnauthorized: false
        }),
        headers: headers,
        body: form
      })
        .then(r => {
          try {
            fs.unlinkSync(req.file.path);
            if (r.status === 200) {
              return r;
            } else {
              res.status(r.status || 500);
              return r;
            }
          } catch (e) {
            if (r.status === 200) {
              return r;
            } else {
              res.status(r.status || 500);
              return r;
            }
          }
        })
        .then(r => r.json())
        .then(data => {
          if (data.error) {
            return res.status(data.status || 500).send(data);
          }
          console.log("Success : ", data);
          return res.json(data);
        })
        .catch(r => {
          console.warn("Error : ", r);
          return res.send(r);
        });
    }
  );

  server.post("/api/files/upload", upload.single("file"), (req, res) => {
    let form = new FormData();
    form.append("file", fs.createReadStream(req.file.path));
    console.log(form);

    let authorization = req.headers["authorization"];
    if (req.cookies["aToken"]) {
      authorization = "Bearer " + req.cookies["aToken"];
    }
    const headers = {
      Accept: "application/json",
      Authorization: authorization
    };

    let url = process.env.API_DOMAIN_URL_10004 + req.path;

    fetch(url, {
      method: "post",
      strictSSL: false,
      agent: new (require("https")).Agent({
        rejectUnauthorized: false
      }),
      headers: headers,
      body: form
    })
      .then(r => {
        try {
          fs.unlinkSync(req.file.path);
          if (r.status === 200) {
            return r;
          } else {
            res.status(r.status || 500);
            return r;
          }
        } catch (e) {
          if (r.status === 200) {
            return r;
          } else {
            res.status(r.status || 500);
            return r;
          }
        }
      })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          return res.status(data.status || 500).send(data);
        }
        console.log("Success : ", data);
        return res.json(data);
      })
      .catch(r => {
        console.warn("Error : ", r);
        return res.send(r);
      });
  });

  server.post("/api/invoices/upload", upload.single("file"), (req, res) => {
    let form = new FormData();
    const { vendor, isAttachment } = req.query;
    form.append("file", fs.createReadStream(req.file.path));

    let authorization = req.headers["authorization"];
    if (req.cookies["aToken"]) {
      authorization = "Bearer " + req.cookies["aToken"];
    }
    const headers = {
      Accept: "application/json",
      Authorization: authorization
    };

    let url =
      process.env.API_DOMAIN_URL_8999 +
      `/standard` +
      req.path +
      `?vendor=${vendor}` +
      `&isAttachment=${isAttachment}`;

    fetch(url, {
      method: "post",
      strictSSL: false,
      agent: new (require("https")).Agent({
        rejectUnauthorized: false
      }),
      headers: headers,
      body: form
    })
      .then(r => {
        fs.unlinkSync(req.file.path);
        if (r.status === 200) {
          return r;
        } else {
          res.status(r.status || 500);
          return r;
        }
      })
      .then(async r => {
        const text = await r.text();
        try {
          let t = JSON.parse(text);
          if (t.statusCode > 201) {
            return CustomException.ApiException(t, req, res);
          }
        } catch (err) {}

        console.log("result text ", text);
        return r;
      })
      .then(data => {
        console.log("result data ", data);
        if (data.statusCode > 299) {
          return res
            .status(data.statusCode || data.status || 500)
            .send(data.message);
        }
        return res.json(data);
      })
      .catch(r => {
        console.warn("Error : ", r);
        return res.send(r);
      });
  });
};
