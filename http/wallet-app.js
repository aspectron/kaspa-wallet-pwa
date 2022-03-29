import {RPC} from '/@kaspa/grpc-web';
//console.log("PWA", window.PWA)
//console.log("RPC", RPC)
import '/style/style.js';
import {
	dpc, html, css, FlowApp, BaseElement, i18n
} from '/flow/flow-ux/flow-ux.js';
import {isMobile} from '/@kaspa/ux/kaspa-ux.js';
export * from '/@kaspa/ux/kaspa-ux.js';

window.__testI18n = (test)=>i18n.setTesting(!!test);

class KaspaWalletHeader extends BaseElement{
	static get styles(){
		return css`
			:host{display:block}
			.container{
				display:flex;align-items:center;padding:5px;
			}
			.logo{
				height:30px;width:30px;/*background-color:#DDD;*/
				background:no-repeat url('/resources/images/kaspa.png') center;
				background-size:contain;
			}
			.flex{flex:1}

		`
	}
	render(){
		return html`
			<div class="container">
				<div class="logo"></div>
				<div class="flex"></div>
				<!--a class="link">About us</a-->
			</div>
		`
	}
}
KaspaWalletHeader.define("kaspa-wallet-header")

class KaspaWalletApp extends FlowApp {

	static get properties(){
		return {
			network:{type:String},
			networks:{type:Array},
			addresses:{type:Object},
			available:{type:Object},
			limits:{type:Object}
		}
	}
	constructor(){
		super();

		this.networks = ['kaspa','kaspatest','kaspadev','kaspasim'];
		this.network = "kaspa";
		this.addresses = {};
		this.available = {};
		this.limits = {};
		this.opt = {};

		this.aliases = {
			kaspa : 'MAINNET',
			kaspatest : 'TESTNET',
			kaspadev : 'DEVNET',
			kaspasim : 'SIMNET'
		}

		this.initLog();
		dpc(async ()=>this.init());
		this.registerListener("popstate", (e)=>{
			let {menu="home", args=[]} = e.state||{};
			console.log(`popstate: ${document.location}, state: ${JSON.stringify(e.state)}`)
			//this.setMenu(menu, args, true);
		});
	}

	async init(){
		await this.initSocketRPC({
			timeout : 90,
			args:{
				transports:["websocket"]
			}
		});
		await this.initUI();
		dpc(()=>this.setLoading(false));
	}

	async initUI(){
		this.bodyEl = document.body;
		await this.initI18n();
	}

	async initI18n(){
		i18n.setActiveLanguages(['en', 'ja', 'zh_HANS']);
		//i18n.setTesting(true);
		const { rpc } = flow.app;
		let {entries} = await rpc.request("get-app-i18n-entries")
		.catch((err)=>{
			console.log("get-app-i18n-entries:error", err)
		})
		if(entries)
			i18n.setEntries(entries);
	}

	onlineCallback() {
		const { rpc } = flow.app;
		this.networkUpdates = rpc.subscribe(`networks`);
		(async()=>{
			for await(const msg of this.networkUpdates) {
				const { networks } = msg.data;
				this.networks = networks;
				if(!this.networks.includes(this.network))
					this.network = this.networks[0];
				console.log("available networks:", networks);
				this.requestUpdate();
			}
		})().then();

		this.addressUpdates = rpc.subscribe(`addresses`);
		(async()=>{
			for await(const msg of this.addressUpdates) {
                const { addresses } = msg.data;
                this.addresses = addresses;
                this.requestUpdate();
				// this.networks = networks;
				// console.log("available networks:",networks);
			}
		})().then();

		this.limitUpdates = rpc.subscribe(`limit`);
		(async()=>{
			for await(const msg of this.limitUpdates) {
				const { network, limit, available } = msg.data;
				console.log('limits',msg.data);
				this.limits[network] = limit;
				this.available[network] = available;
				if(this.network == network)
					this.requestUpdate();
			}
		})().then();
	}

	offlineCallback() {
		this.networkUpdates?.close();
		this.addressUpdates?.close();
		this.limitUpdates?.close();
	}

	render(){
		let network = this.network;
		let address = this.addresses?.[this.network] || '';
		let limit = this.limits?.[this.network] || '';
		let available = this.available?.[this.network] || '';
		let meta = {"generator":"pwa"}

		return html`
		${isMobile?'':html`<!--kaspa-wallet-header></kaspa-wallet-header-->`}
		<kaspa-wallet .walletMeta='${meta}'></kaspa-wallet>
		`
	}

	onNetworkChange(e){
		console.log("on-network-change", e.detail)
		this.network = e.detail.network;
	}

	firstUpdated(){
		super.firstUpdated();
		console.log("app: firstUpdated")
		this.wallet = this.renderRoot.querySelector("kaspa-wallet");
		//console.log("this.wallet", this.wallet)
		let verbose = localStorage.rpcverbose == 1;
		this.wallet.setRPCBuilder(()=>{
			return {
				rpc: new RPC({verbose, clientConfig:{path:"/rpc"}}),
				network: this.network
			}
		});
	}

}

KaspaWalletApp.define("kaspa-wallet-app");
