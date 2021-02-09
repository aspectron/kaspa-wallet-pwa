const path = require('path');
const crypto = require('crypto');
const EventEmitter = require("events");
const FlowRouter = require('@aspectron/flow-router');
const utils = require('@aspectron/flow-utils');
//require("colors");
const fs = require("fs");
const args = utils.args();
const sockjs = require('sockjs');
const session = require('express-session');
const express = require('express');
const bodyParser = require('body-parser');
const Cookie = require("cookie");
const CookieSignature = require("cookie-signature");
const { Command, CommanderError } = require('commander');
const ws = require('ws');
const {FlowHttp} = require('@aspectron/flow-http')({
	express,
	session,
	//sockjs,
	ws,
	Cookie,
	CookieSignature,
});
const Decimal = require('decimal.js');
const { Wallet, initKaspaFramework, log } = require('kaspa-wallet-worker');

const { RPC } = require('kaspa-grpc-node');

class KaspaPWA extends EventEmitter {
	constructor(appFolder){
		super();
		this.appFolder = appFolder;
		this.config = utils.getConfig(path.join(appFolder, "config", "kaspa-wallet-pwa"));
		this.ip_limit_map = new Map();
		this.cache = { };

		this.options = {
			port : 3080
		}

		if(!this.config?.http?.session) {

			console.log('');
			console.log('_  _ _ ____ ____ _ _  _ ____    ____ ____ ____ ____ _ ____ _  _    ');
			console.log('|\\/| | [__  [__  | |\\ | | __    [__  |___ [__  [__  | |  | |\\ |  ');
			console.log('|  | | ___] ___] | | \\| |__]    ___] |___ ___] ___] | |__| | \\|    ');

			this.http_session_ = {
				secret:"34343546756767567657534578678672346573237436523798",
				key:"kaspa-faucet-pwa"
			};
		}else{
			this.http_session_ = this.config.http.session;
		}

		console.log('');
		console.log('_  _ ____ ____ ___  ____    _ _ _ ____ _    _    ____ ___    ____ ____ ____ _  _ ____ ____ ');
		console.log('|_/  |__| [__  |__] |__|    | | | |__| |    |    |___  |     [__  |___ |__/ |  | |___ |__/ ');
		console.log('| \\_ |  | ___] |    |  |    |_|_| |  | |___ |___ |___  |     ___] |___ |  \\  \\/  |___ |  \\ ');
		console.log('');

		Wallet.setWorkerLogLevel("none");
	}

	async initHttp(){

		const { host, port } = this.options;

		let flowHttp = new FlowHttp(__dirname, {
			config:{
				websocketMode:"RPC",
				websocketPath:"/rpc",
				http:{
					host,
					port,
					session: this.http_session_
				},
				staticFiles:{
					'/':'http'
				}
			}
		});
		this.flowHttp = flowHttp;

		flowHttp.on("app.init", args=>{
			let {app} = args;
			app.use(bodyParser.json())
			app.use(bodyParser.urlencoded({ extended: true }))

			let rootFolder = this.appFolder;
			let config = this.config||{};
			const {folders={}} = config;
			const {
				kaspaUX='/node_modules/kaspa-ux',
				flowUX='/node_modules/@aspectron/flow-ux',
			} = folders;

			let router = new FlowRouter(app, {
				mount:{
					// flowUX:'/node_modules/@aspectron/flow-ux',
					flowUX:"/flow/flow-ux",
					litHtml:'/lit-html',
					litElement:'/lit-element',
					webcomponents:'/webcomponentsjs',
					sockjs:'/sockjs',
				},
				rootFolder,
				folders:[
					{url:'/http', folder:path.join(rootFolder, "http")},
					{url:'/kaspa-ux', folder:kaspaUX},
					{url:'/node_modules/@aspectron/flow-ux', folder:flowUX},
					{url:'/resources/extern', folder:flowUX+'/resources/extern'}
				]
			});
			router.init();
		});

		flowHttp.init();
	}

	async initKaspa() {

		await initKaspaFramework();

		const aliases = Object.keys(Wallet.networkAliases);
		let filter = aliases.map((alias) => { return this.options[alias] ? Wallet.networkAliases[alias] : null; }).filter(v=>v);

		this.rpc = { }
		this.wallets = { }
		this.addresses = { }
		this.limits = { }

		if(this.options.rpc && filter.length != 1) {
			log.error('You must explicitly use the network flag when specifying the RPC option');
			log.error('Option required: --mainnet, --testnet, --devnet, --simnet')
			process.exit(1);
		}

		for (const {network,port} of Object.values(Wallet.networkTypes)) {
			if(filter.length && !filter.includes(network)) {
				log.verbose(`Skipping creation of '${network}'...`);
				continue;
			}

			const host = this.options.rpc || `127.0.0.1:${port}`;
			log.info(`Creating gRPC binding for network '${network}' at ${host}`);
			const rpc = this.rpc[network] = new RPC({ clientConfig:{ host } });
			rpc.onError((error)=>{ log.error(`gRPC[${host}] ${error}`); })

			this.wallets[network] = Wallet.fromMnemonic(
				"about artefact spirit predict toast size earth slow soon allow evoke spell",
				// "wasp involve attitude matter power weekend two income nephew super way focus",
				{ network, rpc },
				{disableAddressDerivation:true}
			);
			this.wallets[network].setLogLevel(log.level);

			log.info(`${Wallet.networkTypes[network].name} address - ${this.addresses[network]}`);
		}

		this.networks = Object.keys(this.wallets);
	}

	async initWallet() {
		// const { flowHttp } = this;
		// let socketConnections = flowHttp.sockets.events.subscribe('connect');
		// (async()=>{
		// 	for await(const event of socketConnections) {
		// 		const { networks, addresses, limits } = this;
		// 		const { socket, ip } = event;
		// 		socket.publish('networks', { networks });
		// 		socket.publish('addresses', { addresses });
		// 		networks.forEach(network=>{
		// 			let wallet = this.wallets[network];

		// 			if(!wallet)
		// 				return;
		// 			const { balance } = wallet;
		// 			//setTimeout(()=>{
		// 				socket.publish(`balance`, { network, balance });
		// 				//console.log("wallet balance",  balance)
		// 			//}, 50);
		// 			this.publishLimit({ network, socket, ip });

		// 			let cache = this.cache[network];
		// 			if(cache && cache.length) {
		// 				cache.forEach((msg) => {
		// 					socket.publish(`utxo-change`, msg);
		// 				})
		// 			}

		// 		});
		// 	}
		// })();

	}

	async main() {
		const logLevels = ['error','warn','info','verbose','debug'];
		const program = this.program = new Command();
		program
			.version('0.0.1', '--version')
			.description('Kaspa Wallet')
			.helpOption('--help','display help for command')
			.option('--log <level>',`set log level ${logLevels.join(', ')}`, (level)=>{
				if(!logLevels.includes(level))
					throw new Error(`Log level must be one of: ${logLevels.join(', ')}`);
				return level;
			})
			.option('--verbose','log wallet activity')
			.option('--debug','debug wallet activity')
			.option('--testnet','use testnet network')
			.option('--devnet','use devnet network')
			.option('--simnet','use simnet network')
			.option('--host <host>','http host (default: localhost)', 'localhost')
			.option('--port <port>',`set http port (default ${this.options.port})`, (port)=>{
				port = parseInt(port);
				if(isNaN(port))
					throw new Error('Port is not a number');
				if(port < 0 || port > 0xffff)
					throw new Error('Port number is out of range');
				return port;
			})
            .option('--rpc <address>','use custom RPC address <host:port>')
			;

		program.command('run', { isDefault : true })
			.description('run wallet daemon')
			.action(async ()=>{

				let options = program.opts();
				Object.entries(options).forEach(([k,v])=>{ if(v === undefined) delete options[k]; })
				Object.assign(this.options, options);
				// console.log(this.options);
				// return;

				log.level = (this.options.verbose&&'verbose')||(this.options.debug&&'debug')||(this.options.log)||'info';

				await this.initHttp();
				await this.initKaspa();
				await this.initWallet();
			})

		program.parse();
	}

	KAS(v) {
		var [int,frac] = Decimal(v).mul(1e-8).toFixed(8).split('.');
		int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		frac = frac?.replace(/0+$/,'');
		return frac ? `${int}.${frac}` : int;
	}

}

(async () => {
	let kaspaPWA = new KaspaPWA(__dirname);
	try {
		await kaspaPWA.main();
	} catch(ex) {
		console.log(ex.toString());
	}
})();
