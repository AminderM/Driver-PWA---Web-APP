module.exports = {
  apps: [
    {
      name: 'driver-app-prod',
      script: 'npx',
      args: 'serve -s /var/www/driver-app-prod/build -l 4002 --no-clipboard',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      cwd: '/var/www/driver-app-prod',
      env: {
        NODE_ENV: 'production',
        PORT: 4002
      },
      error_file: '/var/www/driver-app-prod/logs/pm2-error.log',
      out_file: '/var/www/driver-app-prod/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
