const path = require('node:path');

const ROOT_DIR = path.join(__dirname);
const DATA_DIR = path.join(ROOT_DIR, 'data');
const STATIC_DIR = path.join(ROOT_DIR, 'static');

const basicNeeds = {
	ROOT_DIR,
	DATA_DIR,
	STATIC_DIR,
	// GALLERY_THUMB_DIR: path.join(runtime.get('STATIC_DIR'), 'thumb'),
	HOST: 'https://heri.in.ua',
	SERVER_PORT: 3303,
	STATIC_ALLOWED: [
		'/favicon.ico',
		'/search/',
		'/css/',
		'/js/',
		'/img/',
		'/nwe/',
		'/thumb/',
		'/translation.',
		'/sitemap.',
		'/sitemaps',
		'/robots.txt'
	],
	'render/robots.txt': {
		rows: [
			'User-agent: *',
			'Allow: /',
		]
	},
	'render/search': {
		blockRowsLimit: 0,
		blockSizeLimit: 0,
		gallery: null,
		divider: "\n\n",
		imageKeys: ['ogImage', 'image', 'thumb'],
		categories: [
		],
	},
	gallery: { thumb: '4-3-h300px-q90', alwaysWEBP: false },
	themes: ['heri'],
};

module.exports = {
	private: () => (
		{
			...basicNeeds,
			'render/modules': {
				item: [
					'gallery',
					'redirects',
					'dev',
					'references', // $ref: to the files of directory (terms and tariffs)
					'translations',
					'html',
				],
				html: [],
				final: [],
			}
		}
	),
	public: () => (
		{
			...basicNeeds,
			'render/modules': {
				item: [
					'search',
					'gallery', // gallery after search to render search thumbs
					'htaccess',
					'robotsTXT',
					'sitemapXML',
					'translations',
					'references', // $ref: to the files of directory (terms and tariffs)
					'html',
				],
				html: [
					'scripts',
					'styles',
					'emails',
					'links',
					'minify',
					'save',
				],
				final: [],
			},
			'render/method': 'dist',
		}
	),
};