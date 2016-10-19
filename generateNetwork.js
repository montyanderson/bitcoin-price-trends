const bluebird = global.Promise = require("bluebird");
const { Neuron, Layer, Network, Trainer, Architect } = require("synaptic");
const fs = require("fs");
bluebird.promisifyAll(fs);

fs.readFileAsync(__dirname + "/dataset.json", "utf8")
.then(JSON.parse)
.then(dataset => {
	const { records, labels, normals } = dataset;

	const network = new Architect.Perceptron(3, 2, 1);
	const trainer = new Trainer(network);

	const trainingSet = records.slice(0, records.length / 1.5);

	trainer.train(trainingSet, { iterations: 10 * 1000 });

	fs.writeFileSync(__dirname + "/graph.csv", records.map(r => {
		console.log(r);
		return (r.output[0] * normals.output[0]) + "," + (network.activate(r.input)[0] * normals.output[0]);
	}).join("\n"));

	return network;
})
.then(network => {
	const json = JSON.stringify(network.toJSON(), null, "\t");

	fs.writeFileAsync(__dirname + "/net.json", json)
		.then(() => {
			return i => network.activate([i / 100]) * 1000;
		});
});
