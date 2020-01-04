module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    {
      script: "server.js",
      max_memory_restart: "700M",
      watch: [
        "config",
        "libs",
        "components",
        "containers",
        "context",
        "helpers",
        "pages",
        "api",
        "server.js",
        "b2p-seller.config.json",
        "b2p.config.json"
      ],
      env: {
        name: "B2P-BUYER-SIT-1",
        PORT: 3000,
        CONFIG_FILE: "b2p.config.json"
      },
      env_sit2: {
        name: "B2P-BUYER-SIT-2",
        PORT: 3001,
        CONFIG_FILE: "b2p-buyer-sit2.config.json"
      },
      env_seller: {
        name: "B2P-SELLER",
        PORT: 3002,
        CONFIG_FILE: "b2p-seller.config.json"
      },
      env_production: {
        NODE_ENV: "production",
        name: "PROD-B2P-BUYER",
        PORT: 3000
      },
      env_production_seller: {
        NODE_ENV: "production",
        name: "PROD-B2P-SELLER",
        PORT: 3002,
        CONFIG_FILE: "b2p-seller.config.json"
      },
      env_buyer_dev2: {
        name: "B2P-BUYER-DEV-2",
        PORT: 3000,
        CONFIG_FILE: "b2p-buyer-dev2.config.json"
      },
      env_seller_dev2: {
        name: "B2P-SELLER-DEV-2",
        PORT: 3002,
        CONFIG_FILE: "b2p-seller-dev2.config.json"
      }
    }
  ]
};
