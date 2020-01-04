const fs = require("fs");
const path = require("path");
// const configfile = process.env.CONFIG_FILE || "b2p.config.json";
module.exports.config = configfile => {
  // configfile = configfile || "b2p.config.json";
  configfile = configfile || process.env.CONFIG_FILE || "b2p.config.json";
  try {
    let configPath = path.resolve(process.cwd(), configfile);
    let envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath) === true) {
      console.log("Read config from .env", envPath);
      return {};
    }
    if (!fs.existsSync(configPath)) {
      console.log(configPath, "is not exists");
      return {};
    }
    // console.log("Read config from ", configPath);
    let encoding /*: string */ = "utf8";
    const parsed = JSON.parse(fs.readFileSync(configPath, { encoding }));
    Object.keys(parsed).forEach(function(key) {
      process.env[key] = parsed[key];
    });
    return { parsed };
  } catch (e) {
    //console.log("Error :", e);
    return { error: e };
  }
};
