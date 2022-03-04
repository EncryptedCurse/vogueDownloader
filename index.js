import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import { getBrand, getSeason, getBrandSeason } from './api.mjs';
import * as util from './util.mjs';

const defaultArgs = {
	delay: 500,
	directory: process.cwd(),
}
const args = yargs(hideBin(process.argv))
	.option('brand', {
		alias: 'b',
		type: 'array',
		coerce: util.getArrayLowerCase,
		// implies: 'season',
		// conflicts: 'url',
	})
	.option('season', {
		alias: 's',
		type: 'array',
		coerce: util.getArrayLowerCase,
		// implies: 'brand',
		// conflicts: 'url',
	})
	.option('url', {
		alias: 'u',
		type: 'array',
		coerce: util.getArrayLowerCase,
		// conflicts: ['brand', 'season'],
	})
	.option('delay', {
		alias: 't',
		type: 'number',
		default: defaultArgs.delay,
	})
	.option('directory', {
		alias: 'd',
		type: 'string',
		default: defaultArgs.directory,
	})
	.option('no-collection', { type: 'boolean' })
	.option('no-atmosphere', { type: 'boolean' })
	.option('no-beauty',     { type: 'boolean' })
	.option('no-detail',     { type: 'boolean' })
	.option('no-front-row',  { type: 'boolean' })
	.parserConfiguration({
		'duplicate-arguments-array': false,
		'strip-dashed': true,
    })
	.help(false)
	.showHelpOnFail(false)
	.argv;

if (args.help) {
	const header = chalk.magentaBright.bold;
	const argument = (text) => `    ${text}`;
	const description = (text) => chalk.gray(`        ${text}`);

	console.log(
		[
			header('download by brand and season:'),
			argument('-b, --brand <slugs...>'),
			description('one or more Vogue show URL brand slugs'),
			argument('-s, --season <slugs...>'),
			description('one or more Vogue show URL season slugs'),
			'',
			header('download by URL:'),
			argument('-u, --url <URLs...>'),
			description('one or more Vogue show URLs'),
			'',
			header('options:'),
			argument(`-d, --directory <path="${defaultArgs.directory}">`),
			description('download parent directory'),
			argument(`-t, --delay <time=${defaultArgs.delay}>`),
			description('time to wait between each download (in milliseconds)'),
			argument('--no-collection, --no-atmosphere, --no-beauty, --no-detail, --no-front-row'),
			description('skip the specified gallery when downloading')
		].join('\n')
	);

	process.exit();
}

// validate command-line arguments
try {
	// if no arguments are provided...
	if (args.brand === undefined && args.season === undefined && args.url === undefined)
		throw `invalid arguments`;

	// if both (--`season` or `--brand`) and `--url` are provided...
	if ((args.brand !== undefined || args.season !== undefined) && args.url !== undefined)
		throw `invalid arguments; ${chalk.italic('--brand')} and ${chalk.italic('--season')} are mutually exclusive from ${chalk.italic('--url')}`;

	// if `--brand` is provided but `--season` isn't...
	if (args.brand && !args.season?.length)
		throw 'invalid arguments; must specify season';

	// if `--season` is provided but `--brand` isn't...
	if (args.season && !args.brand?.length)
		throw 'invalid arguments; must specify brand';
} catch (e) {
	util.error(e, 2);
}

let brandSlugs, seasonSlugs;
if (args.brand && args.season) {
	// if `--brand` and `--season` arguments are provided, use them as-is
	brandSlugs = args.brand;
	seasonSlugs = args.season;
} else if (args.url) {
	// if `--url` argument is provided, extract the brand and season from each URL
	brandSlugs = [];
	seasonSlugs = [];
	const urlRegex = /(vogue.com)\/fashion-shows\/(?<season>.*?)\/(?<brand>.*?)(?:\/|$)/i;
	for (const url of args.url) {
		const urlRegexMatches = url.match(urlRegex);
		if (urlRegexMatches) {
			brandSlugs.push(urlRegexMatches.groups.brand);
			seasonSlugs.push(urlRegexMatches.groups.season);
		} else {
			util.warn(`invalid URL ${url}`);
		}
	}
}

// obtain brand and season info from API and filter invalid entries
const brands = await util.asyncMapFilter(brandSlugs, async (slug) => {
	const brandData = (await getBrand(slug)).brand;
	if (brandData) {
		return brandData;
	} else {
		util.warn(`invalid brand '${slug}'`);
	}
});
const seasons = await util.asyncMapFilter(seasonSlugs, async (slug) => {
	const seasonData = (await getSeason(slug)).season;
	if (seasonData) {
		return seasonData;
	} else {
		util.warn(`invalid season '${slug}'`);
	}
});

// gallery types used by API
const galleryTypes = ['collection', 'atmosphere', 'beauty', 'detail', 'frontRow'];

for (const brand of brands) {
	for (const season of seasons) {
		// obtain brand + season combination info from API
		const brandSeasonData = (await getBrandSeason(brand.slug, season.slug)).fashionShowV2;

		// if brand + season combination isn't valid...
		if (!brandSeasonData)
			util.warn(`invalid season '${season.slug}' for brand '${brand.slug}'`);

		// create parent directory structure
		const brandSeasonDirectory = path.join(args.directory, brand.name, season.name);
		fs.mkdirSync(brandSeasonDirectory, { recursive: true });

		console.log(
			chalk.bgMagentaBright(` ${brand.name} (${brand.slug}) `) +
			chalk.bgBlueBright(` ${season.name} (${season.slug}) `)
		);
		// console.log(chalk.bgMagentaBright(` https://www.vogue.com/${season.slug}/${brand.slug} `));

		for (const galleryType of galleryTypes) {
			// if --no-<galleryType> argument is provided...
			if (args[galleryType] === false)
				continue;

			const galleryPrefix = chalk.bgGray(` ${galleryType} `);

			const imageUrls = brandSeasonData?.galleries?.[galleryType]?.slidesV2?.slide?.map(
				(element) => element.photosTout.url
			);

			// if gallery doesn't contain images...
			if (!imageUrls) {
				console.log(`${galleryPrefix} non-existent gallery`);
				continue;
			}

			// create directory for respective gallery
			const galleryDirectory = path.join(brandSeasonDirectory, galleryType);
			fs.mkdirSync(galleryDirectory, { recursive: true });

			for (let i = 0, imageUrlsLength = imageUrls.length; i < imageUrlsLength; i++) {
				const progressPrefix =
					` ${(i + 1).toString().padStart(imageUrlsLength.toString().length)}/${imageUrlsLength} `;

				const fileName = util.getUrlFileName(imageUrls[i]);
				const downloadPath = path.join(galleryDirectory, fileName);

				// if file doesn't already exist...
				if (!fs.existsSync(downloadPath)) {
					await util.downloadFile(downloadPath, imageUrls[i]).then(
						// success
						async () => {
							console.log(
								`${galleryPrefix}${chalk.bgGreenBright(progressPrefix)} downloaded ${fileName}`
							);
							await util.sleep(args.delay);
						},
						// failure
						() => {
							console.log(
								`${galleryPrefix}${chalk.bgRedBright(progressPrefix)} failed to download ${fileName}`
							);
						}
					);
				} else {
					console.log(
						`${galleryPrefix}${chalk.bgYellowBright(progressPrefix)} ${fileName} already exists`
					);
				}
			}
		}
	}
}
