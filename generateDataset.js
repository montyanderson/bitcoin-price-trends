const bluebird = global.Promise = require("bluebird");
const fs = require("fs");
bluebird.promisifyAll(fs);
const querystring = require("querystring");
const got = require("got");
const CSVToArray = require("./lib/CSVToArray");

const dataRoot = __dirname + "/data/";

const normal = arr => Math.max(...arr);
const values = obj => Object.keys(obj).map(key => obj[key]);

fs.readdirAsync(dataRoot)
.then(files => {
	return Promise.all(files.map(getTrend))
	.then(trends => {
		const dataset = {
			labels: {
				input: [],
				output: []
			},
			normals: {
				input: [],
				output: []
			},
			records: []
		};

		const { normals, records, labels } = dataset;

		const trendMax = 100;

		files.forEach(f => labels.input.push(f));

		for(let key in trends[0]) {
			const record = { input: [], date: key };

			const inputs = trends.forEach((trend, i) => {
				record.input[i] = trend[key] / trendMax;
			});

			if(Object.keys(record.input).every(a => record.input[a] > -1))
				records.push(record);
		}

		trends.forEach((trend, i) => {
			normals.input[i] = trendMax;
		});

		return dataset;
	}).then(dataset => {
		const { normals, records, labels } = dataset;

		labels.output.push("price");

		const query = querystring.stringify({
			start: records[0].date,
			end: records[records.length - 1].date
		});

		const url = "https://api.coindesk.com/v1/bpi/historical/close.json?" + query;


		return got(url)
			.then(response => {
				const bpi = JSON.parse(response.body).bpi;
				const n = normal(values(bpi));
				normals.output[0] = n;

				records.forEach(record => {
					record.output = [ bpi[record.date] / n ];
				});

				return dataset;
			});

		return dataset;
	}).then(dataset => {
		fs.writeFileAsync(__dirname + "/dataset.json", JSON.stringify(dataset, null, "\t"));
	});
});

function getTrend(f) {
	const uri = dataRoot + f;

	return fs.readFileAsync(uri, "utf8")
	.then(CSVToArray)
	.then(data => {
		const trend = {};

		data.forEach(r => {
			trend[r[0]] = parseInt(r[1]);
		});

		return trend;
	});
}

/*
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
*/
