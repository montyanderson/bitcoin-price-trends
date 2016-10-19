const bluebird = global.Promise = require("bluebird");
const { Neuron, Layer, Network, Trainer, Architect } = require("synaptic");
const fs = require("fs");
bluebird.promisifyAll(fs);

fs.readFileAsync(__dirname + "/net.json", "utf8")
.then(net => {
	const network = Network.fromJSON(JSON.parse(net));
	const getPrice = i => network.activate([i / 100]) * 1000;

	fs.readFileAsync(__dirname + "/dataset.json", "utf8")
	.then(JSON.parse)
	.then(dataset => {
		dataset.forEach(record => {
			record.neuralValue = getPrice(record.trend);
		});

		console.log(dataset.map(r => `${r.value},${r.neuralValue}`).join("\n"));
	});
});
