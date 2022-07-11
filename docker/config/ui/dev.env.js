const {
    SERVICE_AUTHORITY,
    MAIN_URL,
    MAIN_WS_URL,
} = process.env;

const S = (s) => `"${s}"`;

//if you update this, you will need to restart the dev server for it to take effect
module.exports = {
  NODE_ENV: S('development'),
  GTAG: S('UA-000000000-0'),
  URL: MAIN_URL,
  WS_URL: MAIN_WS_URL,
  AUTHORITY: SERVICE_AUTHORITY,
};
