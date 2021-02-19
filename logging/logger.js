//++ Der Logger dient dazu durch Farben Ausschlusreichere Logs in der Konsole abzulegen

const chalk = require("chalk"); //i Chalk dient zum einfärben der Konsolen Logs

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

exports.Logger = new Logger(); //i Soll direkt verwendet werden Können daher ein Objekt der Klasse
