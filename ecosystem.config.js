// pm2 ecosystem.config.js
module.exports = {
  apps: [{
    name: 'jewell',
    script: './dist/index.cjs',
    env: {
      NODE_ENV: 'production',
    },
    env_file: '.env', // Specify the .env file I had issues loading the env file while running the app via pm2
  }]
};