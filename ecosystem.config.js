module.exports = {
  apps : [{
    name   : "polstrat-api-backend",
    script : "./src/index.js",
    watch: true,
    post_update: ["npm install"],
    env: {
      "NODE_ENV": "development"
    },
    env_production : {
       "NODE_ENV": "production"
    },
    exec_mode  : "cluster"
  }]
}
