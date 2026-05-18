import cronTasks from "./cron-tasks";

export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', ''),
  app: {
    keys: env.array('APP_KEYS'),
  },
  cron: {
    enabled: true,
    tasks: cronTasks,
  },
  web: {
    vite: {
      server: {
        allowedHosts: ['api.car4youpanama.com', 'localhost', '127.0.0.1'],
      },
    },
  },
});
