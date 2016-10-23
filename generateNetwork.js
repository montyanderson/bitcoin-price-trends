const bluebird = global.Promise = require("bluebird");
const { Neuron, Layer, Network, Trainer, Architect } = require("synaptic");
const fs = require("fs");
bluebird.promisifyAll(fs);

fs.readFileAsync(__dirname + "/dataset.json", "utf8")
.then(JSON.parse)
.then(dataset => {
	const network = new Architect.Perceptron(1, 3, 1);
	const trainer = new Trainer(network);

	const trainingSet = dataset.slice(0, dataset.length / 2).map(record => {
		return {
			input: [ record.trend / 100 ],
			output: [ record.value / 1000 ]
		};
	});

	trainer.train(trainingSet, { iterations: 10 * 1000 });

	network.activate([0]);
	console.log(network.activate.toString());

	const json = JSON.stringify(network.toJSON(), null, "\t");

	fs.writeFileAsync(__dirname + "/net.json", json)
		.then(() => {
			return i => network.activate([i / 100]) * 1000;
		});
});
