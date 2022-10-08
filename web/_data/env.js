module.exports = function() {
  return {
    environment: process.env.ELEVENTY_ENVIRONMENT || "development",
    recaptchaKey: process.env.RECAPTCHA_SITEKEY,
    recaptchaSecret: process.env.RECAPTCHA_SECRET,
  };
};