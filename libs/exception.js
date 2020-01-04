const ERROR_FORMAT = {
    statusCode: 500,
    error: "abnormal",
    message: "API running abnormal."
}
exports.ApiException = (error, req, res) => {
    let resBody = ERROR_FORMAT;
    if (error.error) {
        resBody.statusCode = error.status;
        resBody.error = error.status;
        resBody.message = error.message || error.error_description;
        res.status(error.status).json(resBody);
    } else if (error.code) {
        resBody.statusCode = 500;
        resBody.error = error.code;
        resBody.message = error.code;
        res.status(error.status).json(resBody);
    } else if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        resBody.statusCode = error.response.status || 500;
        resBody.error = error.response.statusText;
        resBody.message = error.response.data.message || resBody.message;
        //console.log("Error", error.response);
        res.status(error.response.status || 500).json(resBody);
        //res.status(error.response.status).send(error.response.data);
    } else if (error.request) {
        resBody.statusCode = error.request.status || 500;
        resBody.error = error.request.statusText;
        resBody.message = error.request.data.message || resBody.message;
        //console.log("Error", error.request);
        res.status(error.request.status || 500).json(resBody);
    } else {
        // Something happened in setting up the request that triggered an Error
        resBody.statusCode = error.status || 500;
        resBody.message = error.message || resBody.message;
        //console.log("Error", error.message);
        res.status(error.status || 500).json(resBody);
    }
    res.end()
}