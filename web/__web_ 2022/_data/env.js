module.exports = function() {
  return {
    environment: process.env.ELEVENTY_ENVIRONMENT || "development",
    recaptchaSecret: process.env.RECAPTCHA_SECRET
  };
};