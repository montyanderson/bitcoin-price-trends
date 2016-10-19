const bluebird = global.Promise = require("bluebird");
const fs = require("fs");
bluebird.promisifyAll(fs);
const querystring = require("querystring");
const got = require("got");
const CSVToArray = require("./lib/CSVToArray");

fs.readFileAsync(__dirname + "/data/multiTimeline.csv", "utf8")
.then(CSVToArray)
.then(data => {
	return data.map(r => {
		return {
			date: r[0],
			trend: parseInt(r[1])
		};
	}).filter(r => r.trend > 0);
}).then(dataset => {
	const query = querystring.stringify({
		start: dataset[0].date,
		end: dataset[dataset.length - 1].date
	});

	const url = "https://api.coindesk.com/v1/bpi/historical/close.json?" + query;

	return got(url)
		.then(response => {
			const bpi = JSON.parse(response.body).bpi;

			dataset.forEach(record => {
				record.value = bpi[record.date];
			});

			return dataset;
		});
}).then(dataset => {
	const json = JSON.stringify(dataset, null, "\t");
	return fs.writeFileAsync(__dirname + "/dataset.json", json);
});
