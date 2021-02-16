const { Logger } = require("../logging/logger");

exports.errorHandler = (handler) => {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      Logger.error(`${error}`);
      res.status(500).send("Something went wrong!");
      return;
    }
  };
};
