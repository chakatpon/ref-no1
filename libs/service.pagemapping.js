const axios = require("axios");
const CustomException = require("../libs/exception");
const b2papi = require("../libs/b2papi");
const URLSearchParams = require("url-search-params");
var base64 = require("base-64");
module.exports = function(server, queryString, app) {
  server.get("/invoice-detail/:id", (req, res) => {
    const actualPage = "/invoice-detail";
    const queryParams = { linearId: req.params.id };
    app.render(req, res, actualPage, queryParams);
  });

  server.get("/invoice-detail-edit/:id", (req, res) => {
    const actualPage = "/invoice-detail-edit";
    const queryParams = { linearId: req.params.id };
    app.render(req, res, actualPage, queryParams);
  });
  server.get("/invoice-edit/:id", (req, res) => {
    const actualPage = "/invoice-edit";
    const queryParams = { linearId: req.params.id };
    app.render(req, res, actualPage, queryParams);
  });

  server.get("/credit-note-edit/:id", (req, res) => {
    const actualPage = "/credit-note-edit";
    const queryParams = { creditNoteID: req.params.id };
    app.render(req, res, actualPage, queryParams);
  });
};
