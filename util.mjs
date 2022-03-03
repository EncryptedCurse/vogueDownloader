import fs from 'fs';
import chalk from 'chalk';
import fetch from 'node-fetch';

export function getUrlFileName(url) {
	const pathName = new URL(url).pathname;
	const index = pathName.lastIndexOf('/');
	return -1 !== index ? pathName.substring(index + 1) : pathName;
}

export async function downloadFile(path, url) {
	const response = await fetch(url);
	const fileStream = fs.createWriteStream(path);
	return new Promise((resolve, reject) => {
		response.body.pipe(fileStream);
		response.body.on('error', reject);
		fileStream.on('finish', resolve);
	});
}

export async function sleep(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

export function getArrayLowerCase(array) {
	return array?.map((element) => element.toString().toLowerCase());
}

export async function asyncMapFilter(array, mapFunction, filterFunction = (element) => element) {
	return (await Promise.all(array.map(mapFunction))).filter(filterFunction);
}

export function error(message, exitCode = undefined) {
	console.error(`${chalk.bgRedBright(' error ')} ${message}`);
	if (exitCode) process.exit(exitCode);
}

export function warn(message) {
	console.warn(`${chalk.bgYellow(' warn ')} ${message}`);
}
