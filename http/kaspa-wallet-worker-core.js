//import "@kaspa/wallet-worker/worker.js";
//if(typeof window == 'undefined')
	globalThis['window'] = globalThis;

require("@kaspa/wallet-worker/worker.js")
