const fs = require('fs');
const FeedParser = require('feedparser');
const feedparser = new FeedParser();
const request = require('request');

module.exports = function (Kirbi) {
	let returnObject = {
		commands: [ 'rss' ],
		rss: {
			description: 'Lists Available RSS Feeds',
			process: function (msg, suffix, isEdit, cb) {
				let output = '';
				for (let c in rssFeeds) {
					output += `${c}: ${rssFeeds[c].url}\n`;
				}
				cb(`Available feeds:\n${output}`, msg);
			}
		}
	};
	function rssfeed(msg, url, count, cb) {
		request(url).pipe(feedparser);
		feedparser.on('error', function (error) {
			cb(`Failed reading feed: ${error}`, msg);
		});
		let shown = 0;
		feedparser.on('readable', function () {
			let stream = this;
			shown += 1
			if (shown > count) {
				return;
			}
			let item = stream.read();
			cb(`${item.title} ${item.link}`, msg);
			stream.alreadyRead = true;
		});
	}
	function loadFeeds() {
		for (let cmd in rssFeeds) {
			returnObject.commands.push(cmd);
			returnObject[cmd] = {
				usage: '[count]',
				description: rssFeeds[cmd].description,
				url: rssFeeds[cmd].url,
				process: function (msg, suffix, isEdit, cb) {
					let count = 1;
					if (suffix != null && suffix != "" && !isNaN(suffix)) {
						count = suffix;
					}
					rssfeed(msg, this.url, count, cb);
				}
			};
		}
	}
	loadFeeds();

	try {
		let rssFeeds = Kirbi.getJsonObject('/config/rss.json');
	} catch (err) {
		console.log(chalk.red(`Couldn't load rss.json. See rss.json.example if you want rss feed commands. error: ${err}`));
	}
	
	return returnObject;
};
