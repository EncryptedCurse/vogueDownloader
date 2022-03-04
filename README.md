# vogueDownloader
Utility to download [Vogue](https://www.vogue.com/fashion-shows) runway shows.


## Arguments
argument | alias | description | default
-|-|-|-
`--brand` | `-b` | Vogue URL brand slug(s)
`--season` | `-s` | Vogue URL season slug(s)
`--url` | `-u` | Vogue show URL(s)
`--delay` | `-t` | time to wait between each download (in ms) | 500
`--directory` | `-d` | download parent directory | current directory
`--no-collection` | | omit the collection gallery from download
`--no-atmosphere` | | omit the atmosphere gallery from download
`--no-beauty` | | omit the beauty gallery from download
`--no-detail` | | omit the detail gallery from download
`--no-front-row` | | omit the front row gallery from download

Multiple brands and seasons or URLs, separated by spaces, may be provided.

The `--brand` and `--season` arguments are mutually exclusive from `--url` and vice versa.


## Download by...


### Brand and season
```
node index.js --brand <brandSlug> --season <seasonSlug>
```
`brandSlug` and `seasonSlug` can be located within the URL of a particular collection. They only contain alphanumeric characters and dashes (i.e., following the `^[a-z0-9\-]+$` regex pattern).

### URL
```
node index.js --url <url>
```
URLs must be in the following format:
```
vogue.com/fashion-shows/<season>/<brand>/
```
