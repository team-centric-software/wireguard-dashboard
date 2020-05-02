let {execSync} = require("child_process");
const fs = require('fs');

class Stats {
	constructor() {
		this.scrape();
	}

	scrape() {
		let peers = this.peers();
		let transfer = this.transfer();
		let handshake = this.latestHandshake();
		let json = {}

		peers.forEach(peer => {
			json[peer] = {
				sent: transfer[peer][1],
				received: transfer[peer][2],
				handshake: handshake[peer][1]
			}
		})

		let content = {}
		content[Date.now()] = json;

		this.writeFile(content);
	}

	peers() {
		let peers = this.command('peers')
		peers = peers.split(/\n/);

		return this.clean(peers)
	}

	transfer() {
		let transfer = this.command('transfer')
		transfer = this.clean(transfer.split(/\n/));

		return this.format(transfer);
	}

	latestHandshake() {
		let handshake = this.command('latest-handshakes')
		handshake = this.clean(handshake.split(/\n/));

		return this.format(handshake)
	}

	command(command) {
		return execSync(`wg show wg0 ${command}`).toString();
	};

	clean(array) {
		return array.filter(function(e){return e});
	}

	format(data) {
		let json = {}

		data.forEach(client => {
			let values = client.split(/\t/)
			let key = values[0];

			json[key] = values;
		});

		return json;
	}

	writeFile(content) {
		let date = new Date().toISOString().split('T')
		let path = `stats/${date[0]}.json`;

		if (!fs.existsSync(path)) {
			fs.open(path, 'w', function (err, file) {
				if (err) throw err;
			});
		}

		fs.readFile(path, 'utf8', function (err, data) {
			if (err) throw err;

			let updated;

			if (data === '') {
				updated = JSON.parse('[]');
			} else {
				updated = JSON.parse(data);
			}

			updated.push(content)

			fs.writeFile (path, JSON.stringify(updated, null, 2), function(err) {
				if (err) throw err;
			});
		});
	}
}

module.exports = Stats