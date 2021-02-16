const chalk = require("chalk");

class Logger {
  error(message) {
    console.log(chalk.bgRed(message));
  }
  success(message) {
    console.log(chalk.green(message));
  }
  info(message) {
    console.log(chalk.yellow(message));
  }
  warning(message) {
    console.log(chalk.redBright(message));
  }
  ipLog(message) {
    console.log(chalk.blueBright(message));
  }
}

exports.Logger = new Logger();
