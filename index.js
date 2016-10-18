const bluebird = global.Promise = require("bluebird");
const { Neuron, Layer, Network, Trainer, Architect } = require("synaptic");
const fs = require("fs");
bluebird.promisifyAll(fs);
const querystring = require("querystring");
const got = require("got");
const CSVToArray = require("./CSVToArray");

const getDataset = () => {
	return fs.readFileAsync(__dirname + "/data/multiTimeline.csv", "utf8")
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
			console.log(url);

			return got(url)
				.then(response => {
					const bpi = JSON.parse(response.body).bpi;

					dataset.forEach(record => {
						record.value = bpi[record.date];
					});

					return dataset;
				});
		});
};

const generateNetwork = dataset => {
	const network = new Architect.Perceptron(1, 5, 1);
	const trainer = new Trainer(network);

	const trainingSet = dataset.map(record => {
		return {
			input: [ record.trend / 100 ],
			output: [ record.value / 1000 ]
		};
	});

	trainer.train(trainingSet);

	const json = JSON.stringify(network.toJSON(), null, "\t");

	return fs.writeFileAsync(__dirname + "/net.json", json)
		.then(() => {
			return i => network.activate([i / 100]) * 1000;
		});
};

getDataset()
	.then(generateNetwork)
	.then(getPrice => {
		for(let i = 0; i <= 100; i += 10) {
			console.log(i + " : " + getPrice(i));
		}
	});
