import fetch from 'node-fetch';

const apiEndpoint = 'https://graphql.vogue.com/graphql?query=';

async function apiRequest(payload) {
	const url = `${apiEndpoint}${payload}`.replace(/\s{2,}/g, ' ');
	const options = { method: 'GET' };
	return fetch(url, options)
		.then((response) => response.json())
		.then((json) => json.data);
}

export function getAllBrands() {
	const payload = `query {
			allBrands {
				Brand {
					name
					slug
				}
			}
		}`;
	return apiRequest(payload);
}

export function getAllSeasons() {
	const payload = `query {
			allSeasons {
				Season {
					name
					slug
				}
			}
		}`;
	return apiRequest(payload);
}

export function getBrand(brandSlug) {
	const payload = `query {
			brand(slug: "${brandSlug}") {
				name
				slug
				url
			}
		}`;
	return apiRequest(payload);
}

export function getSeason(seasonSlug) {
	const payload = `query {
			season(slug: "${seasonSlug}") {
				name
				year
				type
				slug
				url
			}
		}`;
	return apiRequest(payload);
}

export function getBrandSeason(brandSlug, seasonSlug) {
	const payload = `query {
			fashionShowV2(slug: "${seasonSlug}/${brandSlug}") {
				url
				title
				brand {
					name
					slug
				}
				season {
					name
					slug
					year
				}
				galleries {
					collection {
						...GalleryFragment
					}
					atmosphere {
						...GalleryFragment
					}
					beauty {
						...GalleryFragment
					}
					detail {
						...GalleryFragment
					}
					frontRow {
						...GalleryFragment
					}
				}
				video {
					url
					title
				}
			}
		}
		fragment GalleryFragment on FashionShowGallery {
			slidesV2 {
				... on GallerySlidesConnection {
					slide {
						... on Slide {
							photosTout {
								...imageFields
							}
						}
						... on CollectionSlide {
							type
							photosTout {
								...imageFields
							}
						}
					}
				}
			}
		}
		fragment imageFields on Image {
			url
		}
	`;
	return apiRequest(payload);
}
