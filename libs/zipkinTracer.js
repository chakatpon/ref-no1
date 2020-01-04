let tracer = null;
if (process.env.API_ZIPKIN) {
  // console.log("USE ZIPKIN ", process.env.API_ZIPKIN);
  const localServiceName = "UI-FRONTEND"; // name of this application
  const {
    Tracer,
    ExplicitContext,
    BatchRecorder,
    jsonEncoder: { JSON_V2 }
  } = require("zipkin");
  const { HttpLogger } = require("zipkin-transport-http");

  const ctxImpl = new ExplicitContext();
  const recorder = new BatchRecorder({
    logger: new HttpLogger({
      endpoint: process.env.API_ZIPKIN,
      jsonEncoder: JSON_V2
    })
  });

  tracer = new Tracer({ ctxImpl, recorder, localServiceName });

  module.exports = { tracer };
}
