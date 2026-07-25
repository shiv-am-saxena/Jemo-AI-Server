import { createLogger, format, transports } from 'winston';
import chalk from 'chalk';

const { combine, timestamp, json } = format;

// Define chalk colors for different log levels
const levelColors = {
	error: chalk.red.bold,
	warn: chalk.yellow,
	info: chalk.blue,
	http: chalk.magenta,
	verbose: chalk.cyan,
	debug: chalk.green,
	silly: chalk.gray
};

// Custom format for console logging with Chalk
const consoleLogFormat = format.combine(
	format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
	format.printf(({ level, message, timestamp }) => {
		// FIX: Cast 'level' to the exact keys of levelColors
		const colorizeLevel =
			levelColors[level as keyof typeof levelColors] || chalk.white;

		const styledLevel = colorizeLevel(level.toUpperCase());
		const styledTimestamp = chalk.gray(`[${timestamp}]`);

		return `${styledTimestamp} ${styledLevel}: ${message}`;
	})
);

// Create a Winston logger
const logger = createLogger({
	level: 'info',
	format: combine(timestamp(), json()),
	transports: [
		new transports.Console({
			format: consoleLogFormat
		}),
		new transports.File({ filename: './logs/app.log' })
	]
});

export default logger;
