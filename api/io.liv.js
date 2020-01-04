const TIMEOUT = 60; // seconds

const fetchWithTimeout = (url, options, timeout = 20) => {
  const resultOptions = {
    method: options.method,
    headers: {
      Authorization: `Bearer ${options.token}`,
      ...options.headers
    }
  };
  return Promise.race([
    zipkinFetch(url, resultOptions),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("request timeout")), timeout * 1000)
    )
  ]);
};

const livRepostProcess = async (io, notification, username) => {
  let rePosts = [];
  let inQueueProcess = false;

  const livRepost = io.of("/liv-repost").clients((error, clients) => {
    if (error) throw error;
  });

  livRepost.on("connection", socket => {
    socket.emit("queue", rePosts);
    socket.on("rePost", (accessToken, newRePosts) => {
      let appendRePosts = [];

      newRePosts.map(newRePost => {
        const has = rePosts.filter(
          rePost => rePost.linearId === newRePost.linearId
        );

        if (has.length === 0) {
          newRePost.status = "queue";
          newRePost.accessToken = accessToken;
          appendRePosts = [...appendRePosts, newRePost];
        }
      });

      rePosts = [...rePosts, ...appendRePosts];
      socket.emit("queue", rePosts);
    });
  });

  const processData = async () => {
    try {
      if (rePosts.filter(rePost => rePost.status === "queue").length > 0) {
        if (inQueueProcess) {
          return;
        }

        inQueueProcess = true;
        rePosts[0].status = "processing";

        livRepost.emit("processing", rePosts[0]);
        livRepost.emit("queue", rePosts);

        const { url, method, accessToken } = rePosts[0];

        const options = {
          token: accessToken,
          method: method
        };

        const result = await fetchWithTimeout(url, options, TIMEOUT);
        const response = await result.json();

        if (response.statusCode === 200 || response.statusCode === 201) {
          livRepost.emit("success", response, rePosts[0]);
        } else {
          livRepost.emit("error", response, rePosts[0]);
        }

        rePosts.splice(0, 1);
        livRepost.emit("queue", rePosts);
        inQueueProcess = false;
      }
    } catch (e) {
      let errorMessage = "";
      switch (true) {
        case !!e.response && !!e.response.data && !!e.response.data.message:
          errorMessage = e.response.data.message;
          break;
        case !!e.error_message:
          errorMessage = e.error_message;
        case !!e.message:
          errorMessage = e.message;
        default:
          break;
      }
      livRepost.emit("error", errorMessage, rePosts[0]);
      rePosts.splice(0, 1);
      livRepost.emit("queue", rePosts);
      inQueueProcess = false;
    }

    setTimeout(() => {
      processData();
    }, 1000);
  };
  processData();
};

module.exports = (io, notification, username) => {
  livRepostProcess(io, notification, username);
};
