var Ae=globalThis,_e=Ae.ShadowRoot&&(Ae.ShadyCSS===void 0||Ae.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,it=Symbol(),ls=new WeakMap,ue=class{constructor(e,t,s){if(this._$cssResult$=!0,s!==it)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(_e&&e===void 0){let s=t!==void 0&&t.length===1;s&&(e=ls.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),s&&ls.set(t,e))}return e}toString(){return this.cssText}},ds=i=>new ue(typeof i=="string"?i:i+"",void 0,it),b=(i,...e)=>{let t=i.length===1?i[0]:e.reduce((s,r,n)=>s+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+i[n+1],i[0]);return new ue(t,i,it)},cs=(i,e)=>{if(_e)i.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let s=document.createElement("style"),r=Ae.litNonce;r!==void 0&&s.setAttribute("nonce",r),s.textContent=t.cssText,i.appendChild(s)}},rt=_e?i=>i:i=>i instanceof CSSStyleSheet?(e=>{let t="";for(let s of e.cssRules)t+=s.cssText;return ds(t)})(i):i;var{is:Si,defineProperty:Ri,getOwnPropertyDescriptor:Pi,getOwnPropertyNames:Hi,getOwnPropertySymbols:Ni,getPrototypeOf:Di}=Object,Te=globalThis,ps=Te.trustedTypes,Mi=ps?ps.emptyScript:"",Ii=Te.reactiveElementPolyfillSupport,he=(i,e)=>i,nt={toAttribute(i,e){switch(e){case Boolean:i=i?Mi:null;break;case Object:case Array:i=i==null?i:JSON.stringify(i)}return i},fromAttribute(i,e){let t=i;switch(e){case Boolean:t=i!==null;break;case Number:t=i===null?null:Number(i);break;case Object:case Array:try{t=JSON.parse(i)}catch{t=null}}return t}},hs=(i,e)=>!Si(i,e),us={attribute:!0,type:String,converter:nt,reflect:!1,useDefault:!1,hasChanged:hs};Symbol.metadata??=Symbol("metadata"),Te.litPropertyMetadata??=new WeakMap;var I=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=us){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let s=Symbol(),r=this.getPropertyDescriptor(e,s,t);r!==void 0&&Ri(this.prototype,e,r)}}static getPropertyDescriptor(e,t,s){let{get:r,set:n}=Pi(this.prototype,e)??{get(){return this[t]},set(a){this[t]=a}};return{get:r,set(a){let c=r?.call(this);n?.call(this,a),this.requestUpdate(e,c,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??us}static _$Ei(){if(this.hasOwnProperty(he("elementProperties")))return;let e=Di(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(he("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(he("properties"))){let t=this.properties,s=[...Hi(t),...Ni(t)];for(let r of s)this.createProperty(r,t[r])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[s,r]of t)this.elementProperties.set(s,r)}this._$Eh=new Map;for(let[t,s]of this.elementProperties){let r=this._$Eu(t,s);r!==void 0&&this._$Eh.set(r,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let s=new Set(e.flat(1/0).reverse());for(let r of s)t.unshift(rt(r))}else e!==void 0&&t.push(rt(e));return t}static _$Eu(e,t){let s=t.attribute;return s===!1?void 0:typeof s=="string"?s:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let s of t.keys())this.hasOwnProperty(s)&&(e.set(s,this[s]),delete this[s]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return cs(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,s){this._$AK(e,s)}_$ET(e,t){let s=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,s);if(r!==void 0&&s.reflect===!0){let n=(s.converter?.toAttribute!==void 0?s.converter:nt).toAttribute(t,s.type);this._$Em=e,n==null?this.removeAttribute(r):this.setAttribute(r,n),this._$Em=null}}_$AK(e,t){let s=this.constructor,r=s._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let n=s.getPropertyOptions(r),a=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:nt;this._$Em=r;let c=a.fromAttribute(t,n.type);this[r]=c??this._$Ej?.get(r)??c,this._$Em=null}}requestUpdate(e,t,s,r=!1,n){if(e!==void 0){let a=this.constructor;if(r===!1&&(n=this[e]),s??=a.getPropertyOptions(e),!((s.hasChanged??hs)(n,t)||s.useDefault&&s.reflect&&n===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,s))))return;this.C(e,t,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:s,reflect:r,wrapped:n},a){s&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),n!==!0||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||s||(t=void 0),this._$AL.set(e,t)),r===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[r,n]of this._$Ep)this[r]=n;this._$Ep=void 0}let s=this.constructor.elementProperties;if(s.size>0)for(let[r,n]of s){let{wrapped:a}=n,c=this[r];a!==!0||this._$AL.has(r)||c===void 0||this.C(r,void 0,n,c)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(t)):this._$EM()}catch(s){throw e=!1,this._$EM(),s}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};I.elementStyles=[],I.shadowRootOptions={mode:"open"},I[he("elementProperties")]=new Map,I[he("finalized")]=new Map,Ii?.({ReactiveElement:I}),(Te.reactiveElementVersions??=[]).push("2.1.2");var at=globalThis,ms=i=>i,Ee=at.trustedTypes,gs=Ee?Ee.createPolicy("lit-html",{createHTML:i=>i}):void 0,lt="$lit$",O=`lit$${Math.random().toFixed(9).slice(2)}$`,dt="?"+O,Oi=`<${dt}>`,G=document,ge=()=>G.createComment(""),fe=i=>i===null||typeof i!="object"&&typeof i!="function",ct=Array.isArray,ks=i=>ct(i)||typeof i?.[Symbol.iterator]=="function",ot=`[ 	
\f\r]`,me=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,fs=/-->/g,vs=/>/g,K=RegExp(`>|${ot}(?:([^\\s"'>=/]+)(${ot}*=${ot}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),ys=/'/g,bs=/"/g,xs=/^(?:script|style|textarea|title)$/i,pt=i=>(e,...t)=>({_$litType$:i,strings:e,values:t}),o=pt(1),P=pt(2),gn=pt(3),_=Symbol.for("lit-noChange"),d=Symbol.for("lit-nothing"),$s=new WeakMap,W=G.createTreeWalker(G,129);function ws(i,e){if(!ct(i)||!i.hasOwnProperty("raw"))throw Error("invalid template strings array");return gs!==void 0?gs.createHTML(e):e}var Cs=(i,e)=>{let t=i.length-1,s=[],r,n=e===2?"<svg>":e===3?"<math>":"",a=me;for(let c=0;c<t;c++){let l=i[c],u,g,p=-1,f=0;for(;f<l.length&&(a.lastIndex=f,g=a.exec(l),g!==null);)f=a.lastIndex,a===me?g[1]==="!--"?a=fs:g[1]!==void 0?a=vs:g[2]!==void 0?(xs.test(g[2])&&(r=RegExp("</"+g[2],"g")),a=K):g[3]!==void 0&&(a=K):a===K?g[0]===">"?(a=r??me,p=-1):g[1]===void 0?p=-2:(p=a.lastIndex-g[2].length,u=g[1],a=g[3]===void 0?K:g[3]==='"'?bs:ys):a===bs||a===ys?a=K:a===fs||a===vs?a=me:(a=K,r=void 0);let v=a===K&&i[c+1].startsWith("/>")?" ":"";n+=a===me?l+Oi:p>=0?(s.push(u),l.slice(0,p)+lt+l.slice(p)+O+v):l+O+(p===-2?c:v)}return[ws(i,n+(i[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),s]},ve=class i{constructor({strings:e,_$litType$:t},s){let r;this.parts=[];let n=0,a=0,c=e.length-1,l=this.parts,[u,g]=Cs(e,t);if(this.el=i.createElement(u,s),W.currentNode=this.el.content,t===2||t===3){let p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(r=W.nextNode())!==null&&l.length<c;){if(r.nodeType===1){if(r.hasAttributes())for(let p of r.getAttributeNames())if(p.endsWith(lt)){let f=g[a++],v=r.getAttribute(p).split(O),A=/([.?@])?(.*)/.exec(f);l.push({type:1,index:n,name:A[2],strings:v,ctor:A[1]==="."?Se:A[1]==="?"?Re:A[1]==="@"?Pe:Y}),r.removeAttribute(p)}else p.startsWith(O)&&(l.push({type:6,index:n}),r.removeAttribute(p));if(xs.test(r.tagName)){let p=r.textContent.split(O),f=p.length-1;if(f>0){r.textContent=Ee?Ee.emptyScript:"";for(let v=0;v<f;v++)r.append(p[v],ge()),W.nextNode(),l.push({type:2,index:++n});r.append(p[f],ge())}}}else if(r.nodeType===8)if(r.data===dt)l.push({type:2,index:n});else{let p=-1;for(;(p=r.data.indexOf(O,p+1))!==-1;)l.push({type:7,index:n}),p+=O.length-1}n++}}static createElement(e,t){let s=G.createElement("template");return s.innerHTML=e,s}};function Z(i,e,t=i,s){if(e===_)return e;let r=s!==void 0?t._$Co?.[s]:t._$Cl,n=fe(e)?void 0:e._$litDirective$;return r?.constructor!==n&&(r?._$AO?.(!1),n===void 0?r=void 0:(r=new n(i),r._$AT(i,t,s)),s!==void 0?(t._$Co??=[])[s]=r:t._$Cl=r),r!==void 0&&(e=Z(i,r._$AS(i,e.values),r,s)),e}var Le=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:s}=this._$AD,r=(e?.creationScope??G).importNode(t,!0);W.currentNode=r;let n=W.nextNode(),a=0,c=0,l=s[0];for(;l!==void 0;){if(a===l.index){let u;l.type===2?u=new ee(n,n.nextSibling,this,e):l.type===1?u=new l.ctor(n,l.name,l.strings,this,e):l.type===6&&(u=new He(n,this,e)),this._$AV.push(u),l=s[++c]}a!==l?.index&&(n=W.nextNode(),a++)}return W.currentNode=G,r}p(e){let t=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(e,s,t),t+=s.strings.length-2):s._$AI(e[t])),t++}},ee=class i{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,s,r){this.type=2,this._$AH=d,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=s,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Z(this,e,t),fe(e)?e===d||e==null||e===""?(this._$AH!==d&&this._$AR(),this._$AH=d):e!==this._$AH&&e!==_&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):ks(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==d&&fe(this._$AH)?this._$AA.nextSibling.data=e:this.T(G.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:s}=e,r=typeof s=="number"?this._$AC(e):(s.el===void 0&&(s.el=ve.createElement(ws(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===r)this._$AH.p(t);else{let n=new Le(r,this),a=n.u(this.options);n.p(t),this.T(a),this._$AH=n}}_$AC(e){let t=$s.get(e.strings);return t===void 0&&$s.set(e.strings,t=new ve(e)),t}k(e){ct(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,s,r=0;for(let n of e)r===t.length?t.push(s=new i(this.O(ge()),this.O(ge()),this,this.options)):s=t[r],s._$AI(n),r++;r<t.length&&(this._$AR(s&&s._$AB.nextSibling,r),t.length=r)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let s=ms(e).nextSibling;ms(e).remove(),e=s}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},Y=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,s,r,n){this.type=1,this._$AH=d,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=n,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=d}_$AI(e,t=this,s,r){let n=this.strings,a=!1;if(n===void 0)e=Z(this,e,t,0),a=!fe(e)||e!==this._$AH&&e!==_,a&&(this._$AH=e);else{let c=e,l,u;for(e=n[0],l=0;l<n.length-1;l++)u=Z(this,c[s+l],t,l),u===_&&(u=this._$AH[l]),a||=!fe(u)||u!==this._$AH[l],u===d?e=d:e!==d&&(e+=(u??"")+n[l+1]),this._$AH[l]=u}a&&!r&&this.j(e)}j(e){e===d?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},Se=class extends Y{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===d?void 0:e}},Re=class extends Y{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==d)}},Pe=class extends Y{constructor(e,t,s,r,n){super(e,t,s,r,n),this.type=5}_$AI(e,t=this){if((e=Z(this,e,t,0)??d)===_)return;let s=this._$AH,r=e===d&&s!==d||e.capture!==s.capture||e.once!==s.once||e.passive!==s.passive,n=e!==d&&(s===d||r);r&&this.element.removeEventListener(this.name,this,s),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},He=class{constructor(e,t,s){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(e){Z(this,e)}},As={M:lt,P:O,A:dt,C:1,L:Cs,R:Le,D:ks,V:Z,I:ee,H:Y,N:Re,U:Pe,B:Se,F:He},Vi=at.litHtmlPolyfillSupport;Vi?.(ve,ee),(at.litHtmlVersions??=[]).push("3.3.3");var _s=(i,e,t)=>{let s=t?.renderBefore??e,r=s._$litPart$;if(r===void 0){let n=t?.renderBefore??null;s._$litPart$=r=new ee(e.insertBefore(ge(),n),n,void 0,t??{})}return r._$AI(i),r};var ut=globalThis,k=class extends I{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=_s(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return _}};k._$litElement$=!0,k.finalized=!0,ut.litElementHydrateSupport?.({LitElement:k});var Ui=ut.litElementPolyfillSupport;Ui?.({LitElement:k});(ut.litElementVersions??=[]).push("4.2.2");var L={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},F=i=>(...e)=>({_$litDirective$:i,values:e}),H=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,s){this._$Ct=e,this._$AM=t,this._$Ci=s}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};var{I:Bi}=As,Ts=i=>i;var Ls=i=>i.strings===void 0,Es=()=>document.createComment(""),te=(i,e,t)=>{let s=i._$AA.parentNode,r=e===void 0?i._$AB:e._$AA;if(t===void 0){let n=s.insertBefore(Es(),r),a=s.insertBefore(Es(),r);t=new Bi(n,a,i,i.options)}else{let n=t._$AB.nextSibling,a=t._$AM,c=a!==i;if(c){let l;t._$AQ?.(i),t._$AM=i,t._$AP!==void 0&&(l=i._$AU)!==a._$AU&&t._$AP(l)}if(n!==r||c){let l=t._$AA;for(;l!==n;){let u=Ts(l).nextSibling;Ts(s).insertBefore(l,r),l=u}}}return t},j=(i,e,t=i)=>(i._$AI(e,t),i),Fi={},se=(i,e=Fi)=>i._$AH=e,Ss=i=>i._$AH,Ne=i=>{i._$AR(),i._$AA.remove()};var Rs=F(class extends H{constructor(){super(...arguments),this.key=d}render(i,e){return this.key=i,e}update(i,[e,t]){return e!==this.key&&(se(i),this.key=e),t}});var De=class{constructor(e,t=Intl.DateTimeFormat().resolvedOptions().timeZone,s){this.connection=e;this.timeZone=t;this.entryId=s}call(e,t={}){return this.send({type:`tankkeeper/${e}`,args:t})}accept(e){return this.send({type:"tankkeeper/accept_proposal",proposal_id:e})}reject(e){return this.send({type:"tankkeeper/reject_proposal",proposal_id:e})}acceptFinding(e){return this.send({type:"tankkeeper/accept_finding",check_id:e})}rejectFinding(e){return this.send({type:"tankkeeper/reject_finding",check_id:e})}chatAgent(){return this.send({type:"tankkeeper/chat_agent"})}converse(e,t,s){return this.send({type:"conversation/process",text:e,conversation_id:t,agent_id:s})}send(e){return this.connection.sendMessagePromise(e)}};function Me(i){return Object(i).code==="not_found"}function X(i){return typeof i=="object"&&i!==null&&"message"in i?String(i.message):String(i)}var ye=i=>i??d;var ie="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z",Ps="M13.5,8H12V13L16.28,15.54L17,14.33L13.5,12.25V8M13,3A9,9 0 0,0 4,12H1L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3",J="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z",Hs="M15,16H19V18H15V16M15,8H22V10H15V8M15,12H21V14H15V12M3,18A2,2 0 0,0 5,20H11A2,2 0 0,0 13,18V8H3V18M14,5H11L10,4H6L5,5H2V7H14V5Z",V="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z",re="M12.5,8C9.85,8 7.45,9 5.6,10.6L2,7V16H11L7.38,12.38C8.77,11.22 10.54,10.5 12.5,10.5C16.04,10.5 19.05,12.81 20.1,16L22.47,15.22C21.08,11.03 17.15,8 12.5,8Z",U="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",E="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z",ne="M12,3C6.5,3 2,6.58 2,11C2.05,13.15 3.06,15.17 4.75,16.5C4.75,17.1 4.33,18.67 2,21C4.37,20.89 6.64,20 8.47,18.5C9.61,18.83 10.81,19 12,19C17.5,19 22,15.42 22,11C22,6.58 17.5,3 12,3M12,17C7.58,17 4,14.31 4,11C4,7.69 7.58,5 12,5C16.42,5 20,7.69 20,11C20,14.31 16.42,17 12,17Z",Ns="M18 14H20V17H23V19H20V22H18V19H15V17H18V14M12 3C17.5 3 22 6.58 22 11C22 11.58 21.92 12.14 21.78 12.68C20.95 12.25 20 12 19 12C15.69 12 13 14.69 13 18L13.08 18.95L12 19C10.76 19 9.57 18.82 8.47 18.5C5.55 21 2 21 2 21C4.33 18.67 4.7 17.1 4.75 16.5C3.05 15.07 2 13.14 2 11C2 6.58 6.5 3 12 3Z",Ds="M17,12V3A1,1 0 0,0 16,2H3A1,1 0 0,0 2,3V17L6,13H16A1,1 0 0,0 17,12M21,6H19V15H6V17A1,1 0 0,0 7,18H18L22,22V7A1,1 0 0,0 21,6Z",Ie="M2,21L23,12L2,3V10L17,12L2,14V21Z",Ms="M16,18H18V6H16M6,18L14.5,12L6,6V18Z",Oe="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z",Ve="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z",Is="M17 22V20H20V17H22V20.5C22 20.89 21.84 21.24 21.54 21.54C21.24 21.84 20.89 22 20.5 22H17M7 22H3.5C3.11 22 2.76 21.84 2.46 21.54C2.16 21.24 2 20.89 2 20.5V17H4V20H7V22M17 2H20.5C20.89 2 21.24 2.16 21.54 2.46C21.84 2.76 22 3.11 22 3.5V7H20V4H17V2M7 2V4H4V7H2V3.5C2 3.11 2.16 2.76 2.46 2.46C2.76 2.16 3.11 2 3.5 2H7M10.5 6C13 6 15 8 15 10.5C15 11.38 14.75 12.2 14.31 12.9L17.57 16.16L16.16 17.57L12.9 14.31C12.2 14.75 11.38 15 10.5 15C8 15 6 13 6 10.5C6 8 8 6 10.5 6M10.5 8C9.12 8 8 9.12 8 10.5C8 11.88 9.12 13 10.5 13C11.88 13 13 11.88 13 10.5C13 9.12 11.88 8 10.5 8Z",Os="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z",Vs="M15 16L11 20H21V16H15M12.06 7.19L3 16.25V20H6.75L15.81 10.94L12.06 7.19M5.92 18H5V17.08L12.06 10L13 10.94L5.92 18M18.71 8.04C19.1 7.65 19.1 7 18.71 6.63L16.37 4.29C16.17 4.09 15.92 4 15.66 4C15.41 4 15.15 4.1 14.96 4.29L13.13 6.12L16.88 9.87L18.71 8.04Z",Ue="M4,4H7L9,2H15L17,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z",Us="M22,16V4A2,2 0 0,0 20,2H8A2,2 0 0,0 6,4V16A2,2 0 0,0 8,18H20A2,2 0 0,0 22,16M11,12L13.03,14.71L16,11L20,16H8M2,6V20A2,2 0 0,0 4,22H18V20H4V6",Bs="M23,10C23,8.89 22.1,8 21,8H14.68L15.64,3.43C15.66,3.33 15.67,3.22 15.67,3.11C15.67,2.7 15.5,2.32 15.23,2.05L14.17,1L7.59,7.58C7.22,7.95 7,8.45 7,9V19A2,2 0 0,0 9,21H18C18.83,21 19.54,20.5 19.84,19.78L22.86,12.73C22.95,12.5 23,12.26 23,12V10M1,21H5V9H1V21Z",Be="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z",ht="M21,9L17,5V8H10V10H17V13M7,11L3,15L7,19V16H14V14H7V11Z",mt="M19.35,11.72L17.22,13.85L15.81,12.43L8.1,20.14L3.5,22L2,20.5L3.86,15.9L11.57,8.19L10.15,6.78L12.28,4.65L19.35,11.72M16.76,3C17.93,1.83 19.83,1.83 21,3C22.17,4.17 22.17,6.07 21,7.24L19.08,9.16L14.84,4.92L16.76,3M5.56,17.03L4.5,19.5L6.97,18.44L14.4,11L13,9.6L5.56,17.03Z",gt="M7,2V4H8V18A4,4 0 0,0 12,22A4,4 0 0,0 16,18V4H17V2H7M11,16C10.4,16 10,15.6 10,15C10,14.4 10.4,14 11,14C11.6,14 12,14.4 12,15C12,15.6 11.6,16 11,16M13,12C12.4,12 12,11.6 12,11C12,10.4 12.4,10 13,10C13.6,10 14,10.4 14,11C14,11.6 13.6,12 13,12M14,7H10V4H14V7Z",Fe="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",Fs="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z";function ft(i){return o`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
    ${P`<path d=${i}></path>`}
  </svg>`}function h(i){let e=i.disabled===!0;return o`<ha-icon-button
    class=${i.className}
    .path=${i.icon}
    label=${i.label}
    ?disabled=${e}
    @click=${()=>{e||i.onClick()}}
  ></ha-icon-button>`}function y(i){let e=i.expanded===void 0?void 0:String(i.expanded);return o`<button
    class="${i.className}${i.primary===!0?" primary":""} with-icon"
    type=${i.type??"button"}
    ?disabled=${i.disabled===!0}
    aria-expanded=${ye(e)}
    aria-controls=${ye(i.controls)}
    @click=${()=>{i.onClick?.()}}
  >
    ${ft(i.icon)}<span>${i.label}</span>
  </button>`}var z=b`
  button.with-icon {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  svg.icon {
    width: 18px;
    height: 18px;
    flex: none;
    fill: currentColor;
  }
  ha-icon-button {
    --mdc-icon-button-size: 36px;
    --mdc-icon-size: 20px;
    color: var(--secondary-text-color);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px;
  }
`;var ji="tk-dialog-closed",vt=class extends k{static{this.properties={heading:{},wide:{type:Boolean,reflect:!0}}}static{this.styles=[z,b`
      dialog {
        box-sizing: border-box;
        width: min(480px, calc(100vw - 32px));
        max-height: calc(100vh - 32px);
        overflow: auto;
        padding: 12px 16px 16px;
        border: none;
        border-radius: var(--ha-card-border-radius, 12px);
        color: var(--primary-text-color);
        background: var(--ha-card-background, var(--card-background-color, #fff));
      }
      :host([wide]) dialog {
        width: min(960px, calc(100vw - 32px));
      }
      dialog::backdrop {
        background: rgb(0 0 0 / 40%);
      }
      .head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      h2 {
        flex: 1;
        font-size: 1.1em;
        margin: 0;
      }
    `]}constructor(){super(),this.heading="",this.wide=!1}get dialog(){return this.renderRoot.querySelector("dialog")}firstUpdated(){this.dialog?.showModal()}close(){this.dialog?.close()}render(){return o`<dialog
      aria-labelledby="heading"
      @close=${()=>{this.dispatchEvent(new CustomEvent(ji,{bubbles:!0,composed:!0}))}}
    >
      <div class="head">
        <h2 id="heading">${this.heading}</h2>
        ${h({icon:E,label:"Close",className:"close",onClick:()=>{this.close()}})}
      </div>
      <slot></slot>
    </dialog>`}};customElements.define("tk-dialog",vt);var zi=["mon","tue","wed","thu","fri","sat","sun"];function qi(i){return i.charAt(0).toUpperCase()+i.slice(1)}function Ki(i,e){return[...i.querySelectorAll(`input[name="${e}"]`)].filter(t=>t.checked).map(t=>t.value)}function Wi(i,e){if(i.type==="weekdays")return Ki(e,i.name);let t=e.elements.namedItem(i.name);return i.type==="checkbox"?t.checked:Zi(i,t.value)}function Gi(i){return i==null?"":Array.isArray(i)?i.map(String).join(`
`):typeof i=="string"||typeof i=="number"||typeof i=="boolean"?String(i):JSON.stringify(i)}function Zi(i,e){return i.type==="number"?e.trim()===""?null:Number(e):i.type==="list"?e.split(`
`).map(t=>t.trim()).filter(t=>t!==""):e}function Yi(i){return i===""||i===null||i===!1||Array.isArray(i)&&i.length===0}function Xi(i,e,t){let s={};for(let r of i){let n=Wi(r,e),a=t[r.name];Yi(n)&&a==null||JSON.stringify(n)!==JSON.stringify(a)&&(s[r.name]=n)}return s}var yt=class extends k{static{this.properties={fields:{attribute:!1},values:{attribute:!1},submitLabel:{attribute:!1},submitIcon:{attribute:!1},busy:{type:Boolean},error:{attribute:!1}}}constructor(){super(),this.fields=[],this.values={},this.submitLabel="Save",this.submitIcon=Be,this.busy=!1,this.error=""}static{this.styles=[z,b`
      form {
        display: grid;
        gap: 8px;
      }
      label {
        display: grid;
        gap: 2px;
        font-size: 0.9em;
        color: var(--secondary-text-color);
      }
      input:not([type="checkbox"]),
      select,
      textarea {
        font: inherit;
        padding: 6px;
        color: var(--primary-text-color);
        background: var(--input-fill-color, var(--secondary-background-color));
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        box-sizing: border-box;
        width: 100%;
      }
      button {
        justify-self: start;
        font: inherit;
        padding: 6px 14px;
        border: none;
        border-radius: 4px;
        color: var(--text-primary-color, #fff);
        background: var(--primary-color);
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.5;
      }
      .error {
        color: var(--error-color);
      }
      fieldset {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 12px;
        margin: 0;
        padding: 0;
        border: none;
        font-size: 0.9em;
        color: var(--secondary-text-color);
      }
      legend {
        padding: 0 0 2px;
      }
      label.day {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--primary-text-color);
      }
    `]}weekdays(e){let t=this.values[e.name],s=Array.isArray(t)?t.map(String):[];return o`<fieldset>
      <legend>${e.label}</legend>
      ${zi.map(r=>o`<label class="day"
            ><input
              name=${e.name}
              type="checkbox"
              value=${r}
              .checked=${s.includes(r)}
            />${qi(r)}</label
          >`)}
    </fieldset>`}input(e){let t=Gi(this.values[e.name]);return e.type==="select"?o`<select name=${e.name} ?required=${e.required===!0} .value=${t}>
        <option value="" ?selected=${t===""}></option>
        ${(e.options??[]).map(s=>o`<option value=${s} ?selected=${s===t}>${s}</option>`)}
      </select>`:e.type==="checkbox"?o`<input
        name=${e.name}
        type="checkbox"
        .checked=${this.values[e.name]===!0}
      />`:e.type==="textarea"||e.type==="list"?o`<textarea
        name=${e.name}
        rows="3"
        ?required=${e.required===!0}
        .value=${t}
      ></textarea>`:o`<input
      name=${e.name}
      type=${e.type}
      step=${ye(e.step??(e.type==="number"?"any":void 0))}
      ?required=${e.required===!0}
      .value=${t}
    />`}submit(e){e.preventDefault();let t=Xi(this.fields,e.target,this.values);this.dispatchEvent(new CustomEvent("tk-save",{detail:t,bubbles:!0,composed:!0}))}render(){return o`<form
      @submit=${e=>{this.submit(e)}}
    >
      ${this.fields.map(e=>e.type==="weekdays"?this.weekdays(e):o`<label>${e.label} ${this.input(e)}</label>`)}
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      <button class="with-icon" type="submit" ?disabled=${this.busy}>
        ${ft(this.submitIcon)}<span>${this.submitLabel}</span>
      </button>
    </form>`}};customElements.define("tk-form",yt);var js="tk-changed",$=b`
  ${z}
  :host {
    display: block;
    color: var(--primary-text-color);
  }
  section,
  .card {
    background: var(--ha-card-background, var(--card-background-color, #fff));
    border-radius: var(--ha-card-border-radius, 12px);
    border: 1px solid var(--divider-color);
    padding: 12px 16px;
    margin-bottom: 12px;
  }
  h2 {
    font-size: 1.1em;
    margin: 0 0 8px;
  }
  h3 {
    font-size: 1em;
    margin: 8px 0 4px;
  }
  .pre {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  select,
  input {
    font: inherit;
    max-width: 100%;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    padding: 6px 0;
    border-bottom: 1px solid var(--divider-color);
    overflow-wrap: anywhere;
  }
  li:last-child {
    border-bottom: none;
  }
  button {
    font: inherit;
    padding: 4px 10px;
    border: 1px solid var(--primary-color);
    border-radius: 4px;
    color: var(--primary-color);
    background: none;
    cursor: pointer;
  }
  button.primary {
    color: var(--text-primary-color, #fff);
    background: var(--primary-color);
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .muted {
    color: var(--secondary-text-color);
    font-size: 0.9em;
  }
  .error {
    color: var(--error-color);
  }
  .level.watch {
    color: var(--warning-color);
  }
  .level.act {
    color: var(--error-color);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }
  .head h2 {
    margin: 0;
  }
  .actions.record {
    gap: 8px;
    margin-bottom: 8px;
  }
  li .detail {
    margin-top: 6px;
  }
  .grow {
    flex: 1 1 200px;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  details {
    margin-top: 6px;
  }
  summary {
    cursor: pointer;
    color: var(--primary-color);
  }
  .chart {
    width: 100%;
    height: auto;
    max-height: 220px;
  }
  .chart .axis {
    stroke: var(--divider-color);
  }
  .chart .tick {
    font-size: 9px;
    fill: var(--secondary-text-color);
  }
  .chart .target {
    stroke-dasharray: 4 3;
  }
  .chart .line-label {
    font-size: 8px;
  }
  .chart .off {
    fill: var(--divider-color);
  }
  .chart .on {
    fill: var(--warning-color, #f4b400);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 0.85em;
  }
  .legend li {
    border: none;
    padding: 0;
  }
  .swatch {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 4px;
  }
  .swatch.hollow {
    box-sizing: border-box;
    border: 2px solid;
    background: none;
  }
  .charts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
  }
  .charts h3 {
    margin-top: 0;
  }
  dl.facts {
    display: grid;
    grid-template-columns: minmax(120px, max-content) 1fr;
    gap: 4px 12px;
    margin: 0 0 8px;
  }
  dl.facts dt {
    color: var(--secondary-text-color);
  }
  dl.facts dd {
    margin: 0;
    min-width: 0;
  }
  dl.facts .wide {
    grid-column: 1 / -1;
  }
  dl.facts dt.wide {
    margin-top: 4px;
  }
  .snippet {
    display: block;
    font-size: 0.9em;
  }
  mark {
    background: var(--warning-color, #f4b400);
    color: inherit;
  }
  .dash {
    display: inline-block;
    width: 14px;
    border-top: 2px dashed;
    margin-right: 4px;
    vertical-align: middle;
  }
`,bt="tk-chat";function oe(i,e){i.dispatchEvent(new CustomEvent(bt,{detail:e,bubbles:!0,composed:!0}))}var $t="tk-gallery";function je(i,e=!0){i.dispatchEvent(new CustomEvent($t,{detail:e,bubbles:!0,composed:!0}))}var m=class extends k{constructor(){super();this.loads=0;this.api=void 0,this.error="",this.busy=!1,this.version=0,this.dialog=void 0,this.openHistories=new Set,this.addEventListener(js,t=>{t.composedPath()[0]!==this&&this.reload()})}static{this.properties={api:{attribute:!1},error:{state:!0},busy:{state:!0},version:{state:!0},dialog:{state:!0},openHistories:{state:!0}}}reloadOn(){return["api"]}willUpdate(t){this.reloadOn().some(s=>t.has(s))&&this.reload()}async reload(){let t=this.api;if(t===void 0)return;this.loads+=1;let s=this.loads;try{let r=await this.load(t);if(s!==this.loads)return;r(),this.error="",this.version+=1}catch(r){s===this.loads&&(this.error=X(r))}}async run(t){let s=this.api;if(s===void 0)return!1;this.busy=!0;try{return await t(s),this.error="",await this.reload(),!0}catch(r){return this.error=X(r),!1}finally{this.busy=!1}}changed(){this.dispatchEvent(new CustomEvent(js,{bubbles:!0,composed:!0}))}openDialog(t){this.error="",this.dialog=t}renderError(){return this.dialog===void 0&&this.error?o`<p class="error">${this.error}</p>`:d}formDialog(t){return this.dialog!==t.key?d:o`<tk-dialog
      class=${t.className}
      heading=${t.heading}
      @tk-dialog-closed=${()=>{this.dialog=void 0}}
    >
      <tk-form
        class=${t.className}
        .fields=${t.fields}
        .values=${t.values??{}}
        .submitLabel=${t.submitLabel??"Save"}
        .submitIcon=${t.submitIcon??Be}
        .busy=${this.busy}
        .error=${this.error}
        @tk-save=${async s=>{await t.save(s.detail)&&(this.dialog=void 0)}}
      ></tk-form>
    </tk-dialog>`}historyButton(t,s){let r=`${t}/${s}`;return h({icon:Ps,label:"History",className:"history",onClick:()=>{let n=new Set(this.openHistories);n.delete(r)||n.add(r),this.openHistories=n}})}historyPanel(t,s){return this.openHistories.has(`${t}/${s}`)?o`<tk-history
      .api=${this.api}
      .collection=${t}
      .recordId=${s}
      .stamp=${this.version}
    ></tk-history>`:d}historyDetails(t,s){return o`<div class="actions">${this.historyButton(t,s)}</div>
      ${this.historyPanel(t,s)}`}};var kt="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z",zs="/config/integrations/integration/tankkeeper";function Ji(i){return i===void 0?zs:`${zs}#config_entry=${encodeURIComponent(i)}`}function xt(i){history.pushState(null,"",Ji(i)),window.dispatchEvent(new CustomEvent("location-changed",{detail:{replace:!1}}))}function qs(i){return h({icon:kt,label:"TankKeeper settings",className:"settings",onClick:()=>{xt(i?.entryId)}})}function Qi(i,e){return i.type==="checkbox"&&typeof e=="boolean"?e?"Yes":"No":Array.isArray(e)?e.length===0?"Not set":e.map(String).join(", "):e==null||e===""?"Not set":typeof e=="string"||typeof e=="number"?String(e):JSON.stringify(e)}function q(i,e){let t=new Map(Object.entries(e));return o`<dl class="facts">
    ${i.map(s=>{let r=s.type==="textarea"?"wide":"";return o`<dt class=${r}>${s.label}</dt>
        <dd class="pre ${r}">${Qi(s,t.get(s.name))}</dd>`})}
  </dl>`}var Ks=F(class extends H{constructor(i){if(super(i),i.type!==L.PROPERTY&&i.type!==L.ATTRIBUTE&&i.type!==L.BOOLEAN_ATTRIBUTE)throw Error("The `live` directive is not allowed on child or event bindings");if(!Ls(i))throw Error("`live` bindings can only contain a single expression")}render(i){return i}update(i,[e]){if(e===_||e===d)return e;let t=i.element,s=i.name;if(i.type===L.PROPERTY){if(e===t[s])return _}else if(i.type===L.BOOLEAN_ATTRIBUTE){if(!!e===t.hasAttribute(s))return _}else if(i.type===L.ATTRIBUTE&&t.getAttribute(s)===e+"")return _;return se(i),e}});var er={panel:"Panel",mcp:"Claude (MCP)",assist:"Assist",notification:"Notification",rule:"Rule",review:"Review",camera:"Camera"};function Ws(i){return String(i).padStart(2,"0")}function qe(i,e){let t=new Intl.DateTimeFormat("en-CA",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(i),s=r=>t.find(n=>n.type===r)?.value??"";return{day:`${s("year")}-${s("month")}-${s("day")}`,minutes:Number(s("hour"))*60+Number(s("minute"))}}function B(i,e){return qe(i,e).day}function T(i,e){let[t=0,s=1,r=1]=i.split("-").map(Number);return new Date(Date.UTC(t,s-1,r+e)).toISOString().slice(0,10)}function x(i){let e=new Date(i);return`${B(e)} ${Ws(e.getHours())}:${Ws(e.getMinutes())}`}var Ct=6e4,At=60*Ct,ze=24*At;function Zs(i,e=new Date){let t=new Date(i),s=e.getTime()-t.getTime();return s<Ct?"just now":s<At?`${String(Math.floor(s/Ct))} min ago`:s<ze?`${String(Math.floor(s/At))} h ago`:s<2*ze?"yesterday":s<7*ze?`${String(Math.floor(s/ze))} days ago`:B(t)}function N(i){return er[i]??i}function Gs(i){return typeof i=="string"?i:JSON.stringify(i)}function S(i){if(i.before===null)return`Added to ${i.collection}`;if(i.after===null)return`Removed from ${i.collection}`;let{before:e,after:t}=i,r=Object.keys(t).filter(n=>JSON.stringify(e[n])!==JSON.stringify(t[n])).map(n=>`${n} ${Gs(e[n])} \u2192 ${Gs(t[n])}`);return`${i.collection}: ${r.join(", ")}`}function wt(i,...e){let t=e.filter(s=>typeof s=="string"&&s!=="");return[i,...t].join(". ")}function Ys(i){if(i.kind==="dose")return wt(`Dose: ${i.product??""} ${String(i.amount_ml??0)} ml`,i.why,i.notes);if(i.kind==="test"){let t=Object.entries(i.values??{}).map(([r,n])=>`${r} ${String(n)}`).join(", "),s=i.source==="tap"?"Tap":"Tank";return wt(`${s} test: ${t}`,i.notes)}let e=[...i.tasks??[]];return typeof i.water_change_percent=="number"&&e.push(`${String(i.water_change_percent)}% water change`),typeof i.water_litres=="number"&&e.push(`${String(i.water_litres)} l water`),wt(e.join(". "),i.why,i.notes)}var tr=["ammonia","nitrite","nitrate","phosphate","ph","kh","gh","temperature_c","cycle","light"];var sr="tankkeeper:photo/",ir=/^tankkeeper:photo\/[0-9A-HJKMNP-TV-Z]{26}$/,rr=/^tankkeeper:chart\/([a-z_]+)(?:\?days=(\d+))?$/;function nr(i){return tr.includes(i)}function be(i){if(ir.test(i))return{kind:"photo",id:i.slice(sr.length)};let e=rr.exec(i),t=e?.[1]??"";if(e===null||!nr(t))return;let s=t==="light"?30:365,r=e[2]===void 0?30:Number(e[2]);return{kind:"chart",chart:t,days:Math.min(s,Math.max(1,r))}}var Xs=1440,D=320,$e=160,R=24,Lt={ammonia:"var(--warning-color, #f4b400)",nitrite:"var(--error-color, #db4437)",nitrate:"var(--info-color, #4285f4)",ph:"var(--primary-color, #03a9f4)",kh:"var(--success-color, #43a047)",gh:"var(--accent-color, #ff9800)",phosphate:"var(--state-icon-color, #44739e)",temperature_c:"var(--error-color, #db4437)"},or=Lt.ammonia,ar=Lt.nitrite,Js="var(--secondary-text-color, #727272)",St={ammonia:"Ammonia (ppm)",nitrite:"Nitrite (ppm)",nitrate:"Nitrate (mg/l)",ph:"pH",kh:"KH (dKH)",gh:"GH (dGH)",phosphate:"Phosphate (mg/l)",temperature_c:"Temperature (\xB0C)"},lr=["ammonia","nitrite","nitrate","ph","kh","gh","phosphate","temperature_c"];function Ke(i,e,t,s){let r=i.filter(n=>n.kind==="test"&&(n.source==="tap"?"tap":"tank")===s&&typeof n.values?.[e]=="number").map(n=>({time:Date.parse(n.time),value:n.values?.[e]??0})).sort((n,a)=>n.time-a.time);return{name:t,colour:Lt[e],joined:s==="tank",points:r}}var _t=.1;function ei(i,e){let t=[...i.flatMap(a=>a.points.map(c=>c.value)),...e.map(a=>a.value)];if(t.length===0)return{series:i,lines:e,min:0,max:1};let s=Math.min(...t),r=Math.max(...t),n=r>s?(r-s)*_t:Math.abs(r)*_t||_t;return{series:i,lines:e,min:Math.max(0,s-n),max:r+n}}function Qs(i){return String(Number(i.toFixed(2)))}function Tt(i){return i.flatMap(([e,t,s])=>typeof t=="number"?[{label:e,value:t,colour:s}]:[])}function Et(i,e,t){return Tt([["Watch",i[e],or],["Act",i[t],ar]])}function We(i,e){let t=[["ammonia","Ammonia"],["nitrite","Nitrite"],["nitrate","Nitrate"]];return ei([...t.map(([s,r])=>Ke(i,s,r,"tank")),...t.map(([s,r])=>Ke(i,s,`Tap ${r.toLowerCase()}`,"tap"))],Et(e,"nitrogen_watch","nitrogen_act"))}function dr(i,e,t,s){let r=n=>Tt([["Tap water",s?.[n],Js]]);switch(i){case"ammonia":case"nitrite":return Et(e,"nitrogen_watch","nitrogen_act");case"ph":return[...Et(e,"ph_watch","ph_act"),...r("ph")];case"temperature_c":return Tt([["Target",t,Js]]);default:return r(i)}}function Rt(i,e,t,s,r){let n=[Ke(i,e,"Tank","tank"),Ke(i,e,"Tap","tap")];return{key:e,label:St[e],chart:ei(n,dr(e,t,s,r))}}function ti(i,e,t,s){let r=[],n=[];for(let a of lr){let c=Rt(i,a,e,t,s);c.chart.series.every(l=>l.points.length===0)?n.push(c.label):r.push(c)}return{charts:r,empty:n}}function ke(i,e){let t=i.series.flatMap(l=>l.points.map(u=>u.time));if(t.length===0)return o`<p class="empty">No readings yet</p>`;let s=Math.min(...t),r=Math.max(...t)-s,n=i.max-i.min||1,a=l=>r===0?D/2:R+(l-s)/r*(D-2*R),c=l=>$e-R-(l-i.min)/n*($e-2*R);return o`
    <svg viewBox="0 0 ${D} ${$e}" role="img" aria-label=${e} class="chart">
      <line class="axis" x1=${R} y1=${$e-R} x2=${D-R} y2=${$e-R}></line>
      <text class="tick" x="2" y=${c(i.max)+4}>${Qs(i.max)}</text>
      <text class="tick" x="2" y=${c(i.min)+4}>${Qs(i.min)}</text>
      ${i.lines.map(l=>P`<line class="target" x1=${R} x2=${D-R} y1=${c(l.value)} y2=${c(l.value)}
            stroke=${l.colour}><title>${l.label} ${l.value}</title></line>
            <text class="line-label" x=${D-R} y=${c(l.value)-2} text-anchor="end"
              fill=${l.colour}>${l.label} ${l.value}</text>`)}
      ${i.series.filter(l=>l.points.length>0).map(l=>P`
          ${l.joined?P`<polyline fill="none" stroke=${l.colour}
                  points=${l.points.map(u=>`${String(a(u.time))},${String(c(u.value))}`).join(" ")}>
                </polyline>`:d}
          ${l.points.map(u=>P`<circle class=${l.joined?"solid":"hollow"} cx=${a(u.time)} cy=${c(u.value)} r="3"
                stroke=${l.colour} fill=${l.joined?l.colour:"none"}>
                <title>${l.name} ${u.value}</title></circle>`)}`)}
    </svg>
    <ul class="legend">
      ${i.series.filter(l=>l.points.length>0).map(l=>o`<li>
              ${l.joined?o`<span class="swatch" style="background:${l.colour}"></span>`:o`<span class="swatch hollow" style="border-color:${l.colour}"></span>`}${l.name}
            </li>`)}
      ${i.lines.map(l=>o`<li><span class="dash" style="border-color:${l.colour}"></span>${l.label}</li>`)}
    </ul>
  `}function Ge(i,e,t,s){let r=[];for(let n=t-1;n>=0;n--)r.push({day:T(e,-n),segments:[]});for(let[n,a]of i){let c=qe(new Date(n),s),l=qe(new Date(a),s);for(let u of r){let g=c.day===u.day?c.minutes/Xs:c.day<u.day?0:null,p=l.day===u.day?l.minutes/Xs:l.day>u.day?1:null;g!==null&&p!==null&&p>g&&u.segments.push({start:g,end:p})}}return r}function Ze(i){let t=i.length*6;return P`
    <svg viewBox="0 0 ${D} ${t}" role="img" class="chart light"
      aria-label=${`Light on and off, last ${String(i.length)} days`}>
      ${i.map((s,r)=>P`
          <rect class="off" x="0" y=${r*6} width=${D} height=${5}></rect>
          ${s.segments.map(n=>P`<rect class="on" x=${n.start*D} y=${r*6}
                width=${(n.end-n.start)*D} height=${5}>
                <title>${s.day}</title></rect>`)}`)}
    </svg>`}var si=500,cr="The photo is no longer kept.";function pr(i,e){let t=i.photo_url;return t!==null&&i.id===e&&t.startsWith(`/api/tankkeeper/photos/${e}?`)?t:void 0}var ii=new WeakMap;function xe(i,e,t){let s=ii.get(i);s===void 0&&(s=new Map,ii.set(i,s));let r=JSON.stringify([e,t]),n=s.get(r);if(n!==void 0)return n;let a=s,c=i.call(e,t).finally(()=>a.delete(r));return a.set(r,c),c}async function ur(i,e){let t=[],s=new Set,r;for(;;){let n={kind:"test",since:e,...r===void 0?{}:{until:r},limit:si},a=(await xe(i,"get_log",n)).entries,c=a.filter(l=>!s.has(l.id));for(let l of c)s.add(l.id),t.push(l),r=l.time;if(a.length<si||c.length===0)return t}}var ri={...St,cycle:"Cycle",light:"Light"},Pt=class extends m{static{this.properties={...m.properties,address:{type:String},alt:{type:String},shown:{state:!0},large:{state:!0}}}static{this.styles=[$,b`
      figure {
        margin: 8px 0;
      }
      figcaption {
        color: var(--secondary-text-color);
        font-size: 0.9em;
      }
      button.photo {
        display: block;
        padding: 0;
        border: none;
        background: none;
        cursor: zoom-in;
      }
      button.photo img {
        display: block;
        width: 100%;
        max-width: 480px;
        height: auto;
        border-radius: 8px;
      }
      .large {
        position: fixed;
        inset: 0;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(0, 0, 0, 0.85);
        cursor: zoom-out;
      }
      .large img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    `]}constructor(){super(),this.address="",this.alt="",this.shown=void 0,this.large=!1}reloadOn(){return["api","address"]}async load(e){let t=be(this.address),s=t===void 0?void 0:await this.fetch(e,t);return()=>{this.shown=s}}async fetch(e,t){if(t.kind==="photo"){let p=await xe(e,"get_photo_check",{check_id:t.id}).catch(f=>{if(!Me(f))throw f});return{kind:"photo",url:p===void 0?void 0:pr(p,t.id)}}let{chart:s,days:r}=t;if(s==="light"){let p=await xe(e,"get_light",{days:r});return{kind:"light",lights:p.lights.map(v=>({model:v.model,rows:Ge(v.on_periods,p.today,r,e.timeZone)}))}}let n=T(B(new Date,e.timeZone),-r),[a,c]=await Promise.all([ur(e,n),xe(e,"get_status")]),l=ri[s];if(s==="cycle")return{kind:"chart",chart:We(a,c.settings),label:l};let u=await xe(e,"get_tank");return{kind:"chart",chart:Rt(a,s,c.settings,u.tank.temperature_c,u.water).chart,label:l}}caption(e){return this.alt!==""?this.alt:e.kind==="photo"?"The tank":`${ri[e.chart]}, last ${String(e.days)} days`}open(){this.large=!0,this.updateComplete.then(()=>this.renderRoot.querySelector(".large")?.focus())}close(){this.large=!1,this.updateComplete.then(()=>this.renderRoot.querySelector("button.photo")?.focus())}keydown(e){e.key==="Tab"&&e.preventDefault(),e.key==="Escape"&&this.close()}renderPhoto(e,t){return e===void 0?o`<p class="muted">${cr}</p>`:o`<button
        class="photo"
        aria-label="Open the photo larger"
        @click=${()=>{this.open()}}
      >
        <img
          src=${e}
          alt=${t}
          @error=${()=>{this.shown={kind:"photo",url:void 0}}}
        />
      </button>
      ${this.large?o`<div
              class="large"
              role="dialog"
              aria-modal="true"
              aria-label=${t}
              tabindex="-1"
              @click=${()=>{this.close()}}
              @keydown=${s=>{this.keydown(s)}}
            >
              <img src=${e} alt=${t} />
            </div>`:d}`}renderShown(e,t){return e.kind==="photo"?this.renderPhoto(e.url,t):e.kind==="chart"?ke(e.chart,e.label):e.lights.length===0?o`<p class="muted">No lights yet</p>`:o`${e.lights.map(s=>o`<div class="muted">${s.model}</div>
          ${Ze(s.rows)}`)}`}render(){let e=be(this.address);if(e===void 0)return o`![${this.alt}](${this.address})`;let t=this.caption(e),s=this.shown;return o`<figure>
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      ${s===void 0?d:this.renderShown(s,t)}
      <figcaption>${t}</figcaption>
    </figure>`}};customElements.define("tk-embed",Pt);function Ye(i,e){return o`${gr(i.split(`
`),{api:e,left:5})}`}var Ht=/^\s*```/,oi=/^(#{1,6})\s+(.*)$/,Nt=/^\s*[-*]\s+(.*)$/,Dt=/^\s*\d+[.)]\s+(.*)$/,mr=/`([^`]+)`|!\[([^\]]*)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|(?<![\w*])\*([^*\s](?:[^*]*[^*\s])?)\*(?![\w*])|(?<!\w)_([^_\s](?:[^_]*[^_\s])?)_(?!\w)/g;function gr(i,e){let t=[],s=0,r=n=>{let a=[];for(let c=n.exec(i[s]??"");c!==null;)a.push(c[1]??""),s+=1,c=n.exec(i[s]??"");return a};for(;s<i.length;){let n=i[s]??"",a=oi.exec(n);if(Ht.test(n)){let c=i.findIndex((u,g)=>g>s&&Ht.test(u)),l=c===-1?i.length:c;t.push(o`<pre><code>${i.slice(s+1,l).join(`
`)}</code></pre>`),s=l+1}else if(a!==null){let c=ae(a[2]??"",e);t.push((a[1]??"").length<=2?o`<h3>${c}</h3>`:o`<h4>${c}</h4>`),s+=1}else if(Nt.test(n)){let c=r(Nt).map(l=>ni(l,e));t.push(o`<ul>
          ${c}
        </ul>`)}else if(Dt.test(n)){let c=r(Dt).map(l=>ni(l,e));t.push(o`<ol>
          ${c}
        </ol>`)}else if(n.trim()==="")s+=1;else{let c=[];for(;s<i.length&&fr(i[s]??"");)c.push(i[s]??""),s+=1;let l=c.map((u,g)=>o`${g>0?o`<br />`:d}${ae(u,e)}`);t.push(o`<p>${l}</p>`)}}return t}function ni(i,e){return o`<li>${ae(i,e)}</li>`}function fr(i){return i.trim()!==""&&!Ht.test(i)&&!oi.test(i)&&!Nt.test(i)&&!Dt.test(i)}function ae(i,e){let t=[],s=0;for(let r of i.matchAll(mr)){r.index>s&&t.push(i.slice(s,r.index));let[n,a,c,,l,u,g,p,f]=r;a!==void 0?t.push(o`<code>${a}</code>`):c!==void 0?t.push(vr(c,n,e)):l!==void 0?t.push(o`<strong>${ae(l,e)}</strong>`):u!==void 0?t.push(ai(u,g??"",n,e)):t.push(o`<em>${ae(p??f??"",e)}</em>`),s=r.index+n.length}return s<i.length&&t.push(i.slice(s)),t}function ai(i,e,t,s){return/^https?:\/\//i.test(e)?o`<a href=${e} target="_blank" rel="noopener noreferrer"
    >${ae(i,s)}</a
  >`:t}function vr(i,e,t){let s=e.slice(i.length+4,-1),{api:r}=t;return r===void 0||t.left===0||be(s)===void 0?i===""?e:o`!${ai(i,s,e.slice(1),t)}`:(t.left-=1,o`<tk-embed .api=${r} .address=${s} .alt=${i}></tk-embed>`)}var li=(i,e,t)=>{let s=new Map;for(let r=e;r<=t;r++)s.set(i[r],r);return s},C=F(class extends H{constructor(i){if(super(i),i.type!==L.CHILD)throw Error("repeat() can only be used in text expressions")}dt(i,e,t){let s;t===void 0?t=e:e!==void 0&&(s=e);let r=[],n=[],a=0;for(let c of i)r[a]=s?s(c,a):a,n[a]=t(c,a),a++;return{values:n,keys:r}}render(i,e,t){return this.dt(i,e,t).values}update(i,[e,t,s]){let r=Ss(i),{values:n,keys:a}=this.dt(e,t,s);if(!Array.isArray(r))return this.ut=a,n;let c=this.ut??=[],l=[],u,g,p=0,f=r.length-1,v=0,A=n.length-1;for(;p<=f&&v<=A;)if(r[p]===null)p++;else if(r[f]===null)f--;else if(c[p]===a[v])l[v]=j(r[p],n[v]),p++,v++;else if(c[f]===a[A])l[A]=j(r[f],n[A]),f--,A--;else if(c[p]===a[A])l[A]=j(r[p],n[A]),te(i,l[A+1],r[p]),p++,A--;else if(c[f]===a[v])l[v]=j(r[f],n[v]),te(i,r[p],r[f]),f--,v++;else if(u===void 0&&(u=li(a,v,A),g=li(c,p,f)),u.has(c[p]))if(u.has(c[f])){let M=g.get(a[v]),st=M!==void 0?r[M]:null;if(st===null){let as=te(i,r[p]);j(as,n[v]),l[v]=as}else l[v]=j(st,n[v]),te(i,r[p],st),r[M]=null;v++}else Ne(r[f]),f--;else Ne(r[p]),p++;for(;v<=A;){let M=te(i,l[A+1]);j(M,n[v]),l[v++]=M}for(;p<=f;){let M=r[p++];M!==null&&Ne(M)}return this.ut=a,se(i,l),_}});function Xe(i){let e=Array.from(i.snippet),t=(s,r)=>e.slice(s,r).join("");return o`<span class="snippet pre"
    >${t(0,i.start)}<mark>${t(i.start,i.end)}</mark>${t(i.end)}</span
  >`}var we="tk-conversation-deleted";function di(i,e,t){return`${String(i)} ${i===1?e:t}`}var Mt=class extends k{static{this.properties={api:{attribute:!1},conversationId:{attribute:!1},disabled:{attribute:!1},asked:{state:!0},error:{state:!0},busy:{state:!0}}}static{this.styles=[$,b`
      :host {
        display: inline-block;
      }
      div.confirm {
        margin-top: 6px;
        padding: 8px;
        border: 1px solid var(--error-color);
        border-radius: 4px;
      }
      button.confirm-delete {
        color: var(--text-primary-color, #fff);
        background: var(--error-color);
        border-color: var(--error-color);
      }
    `]}constructor(){super(),this.api=void 0,this.conversationId="",this.disabled=!1,this.asked=void 0,this.error="",this.busy=!1}async attempt(e){let t=this.api;if(t!==void 0){this.busy=!0,this.error="";try{await e(t)}catch(s){this.asked=void 0,this.error=X(s)}finally{this.busy=!1}}}async ask(){await this.attempt(async e=>{this.asked=await e.call("delete_conversation",{id:this.conversationId})}),await this.focusOn("button.cancel")}async confirm(e){let t=this.conversationId;await this.attempt(async s=>{await s.call("delete_conversation",{id:t,code:e}),this.asked=void 0,this.dispatchEvent(new CustomEvent(we,{detail:t,bubbles:!0,composed:!0}))})}async cancel(){this.asked=void 0,await this.focusOn("ha-icon-button.delete")}async focusOn(e){await this.updateComplete,this.shadowRoot?.querySelector(e)?.focus()}renderAsked(e){let t=e.messages===1?"goes":"go",s=e.changes===1?"stays":"stay";return o`<div class="confirm" role="alertdialog" aria-labelledby="ask">
      <p id="ask" class="pre">
        Delete "${e.name}"? Its ${di(e.messages,"message","messages")} ${t}. The
        ${di(e.changes,"change","changes")} made in it ${s} in the history, and Undo
        still works.
      </p>
      <div class="row">
        ${y({icon:E,label:"Cancel",className:"cancel",disabled:this.busy,onClick:()=>{this.cancel()}})}
        ${y({icon:J,label:"Delete conversation",className:"confirm confirm-delete",disabled:this.disabled||this.busy,onClick:()=>{this.confirm(e.code)}})}
      </div>
    </div>`}render(){return o`${h({icon:J,label:"Delete",className:"delete",disabled:this.disabled||this.busy||this.asked!==void 0,onClick:()=>{this.ask()}})}
    ${this.asked===void 0?d:this.renderAsked(this.asked)}
    ${this.error?o`<p class="error">${this.error}</p>`:d}`}};customElements.define("tk-delete-conversation",Mt);var ci=50,Ce="panel_",yr="tk-open-chat",It=class extends m{static{this.properties={...m.properties,active:{attribute:!1},stamp:{attribute:!1},locked:{attribute:!1},conversations:{state:!0},query:{state:!0},renaming:{state:!0},draftTitle:{state:!0}}}static{this.styles=[$,b`
      li.active {
        background: var(--secondary-background-color);
      }
      li {
        padding: 6px 4px;
      }
      button.open {
        display: block;
        width: 100%;
        text-align: left;
        border: none;
        padding: 2px 0;
        color: inherit;
      }
      .name {
        display: block;
        font-weight: 500;
      }
      .actions button,
      .actions tk-delete-conversation {
        font-size: 0.85em;
      }
      form.search {
        margin-bottom: 8px;
      }
      input.title {
        width: 100%;
        box-sizing: border-box;
      }
    `]}constructor(){super(),this.active="",this.stamp=0,this.locked="",this.conversations=void 0,this.query="",this.renaming=void 0,this.draftTitle="",this.addEventListener(we,()=>{this.reload()})}reloadOn(){return["api","query","stamp"]}async load(e){let t=this.query===""?await e.call("list_conversations",{limit:ci}):await e.call("search_conversations",{query:this.query,limit:ci});return()=>{this.conversations=t.conversations}}search(e){e.preventDefault();let t=e.target.querySelector("input");this.query=(t?.value??"").trim()}open(e){let t=e.match?.index??null;this.dispatchEvent(new CustomEvent(yr,{detail:{id:e.id,index:t},bubbles:!0,composed:!0}))}async startRename(e){this.renaming=e.id,this.draftTitle=e.title,this.error="",await this.updateComplete,this.shadowRoot?.querySelector("input.title")?.focus()}async rename(e,t){e.preventDefault();let s=this.draftTitle.trim();if(s===""){this.renaming=void 0;return}await this.run(n=>n.call("rename_conversation",{id:t,title:s}))&&(this.renaming=void 0)}renderName(e){if(this.renaming===e.id)return o`<form
        class="rename"
        @submit=${r=>this.rename(r,e.id)}
      >
        <input
          class="title"
          aria-label="Chat title"
          maxlength="200"
          placeholder=${e.name}
          .value=${this.draftTitle}
          @input=${r=>{this.draftTitle=r.target.value}}
          @keydown=${r=>{r.key==="Escape"&&(this.renaming=void 0)}}
        />
      </form>`;let t=!e.id.startsWith(Ce),s=Zs(e.updated);return o`<button
      class="open"
      aria-current=${e.id===this.active?"true":"false"}
      @click=${()=>{this.open(e)}}
    >
      <span class="name">${e.name}</span>
      <span class="muted"
        >${t?`${s} \xB7 ${N(e.source)}, read only`:s}</span
      >
      ${e.match===void 0?d:Xe(e.match)}
    </button>`}renderItem(e){return o`<li
      data-id=${e.id}
      class=${e.id===this.active?"active":""}
    >
      ${this.renderName(e)}
      <div class="row actions">
        ${h({icon:Vs,label:"Rename",className:"rename",disabled:this.busy,onClick:()=>{this.startRename(e)}})}
        <tk-delete-conversation
          .api=${this.api}
          .conversationId=${e.id}
          .disabled=${e.id===this.locked}
        ></tk-delete-conversation>
      </div>
    </li>`}render(){let e=this.conversations;return o`<form
        class="search row"
        role="search"
        @submit=${t=>{this.search(t)}}
      >
        <input
          class="search grow"
          type="search"
          aria-label="Search chats"
          placeholder="Search chats"
          .value=${this.query}
        />
      </form>
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      ${e?.length===0?o`<p class="muted">${this.query===""?"No chats yet":"No chats match"}</p>`:d}
      <ul>
        ${C(e??[],t=>t.id,t=>this.renderItem(t))}
      </ul>`}};customElements.define("tk-chat-list",It);var br="TankKeeper's Assist agent is missing. Reload TankKeeper to add it.",$r="Choose the conversation agent the chat uses in TankKeeper's settings.",Je=200,pi=200,kr=new Set(["user","assistant","error"]);function ui(){return`panel_${[...crypto.getRandomValues(new Uint8Array(16))].map(e=>e.toString(16).padStart(2,"0")).join("")}`}function Ot(i){return i.length<=pi?i:`${i.slice(0,pi-1)}\u2026`}async function xr(i,e){let{kind:t,id:s}=e;if(t==="proposal"){let r=await i.call("list_proposals",{state:"all",limit:Je}).then(n=>n.proposals.find(a=>a.proposal_id===s)).catch(()=>{});return r===void 0?`Let's discuss the waiting change ${s}.`:`Let's discuss the waiting change "${Ot(r.summary)}" (proposal ${s}).`}if(t==="photo"){let r=await i.call("list_photos",{limit:Je}).then(n=>n.photos.find(a=>a.id===s)?.summary).catch(()=>{});return r==null?`Let's discuss photo check ${s}.`:`Let's discuss what the camera saw: "${Ot(r)}" (photo check ${s}).`}if(t==="review"){let r=await i.call("get_reviews",{limit:Je}).then(n=>n.reviews.find(a=>a.id===s)).catch(()=>{});return r===void 0?`Let's discuss review ${s}.`:`Let's discuss the review "${Ot(r.result)}" (review ${s}).`}return"Let's discuss the tank's status now."}var Vt=class extends m{constructor(){super();this.scrollToFound=!1;this.conversationId=ui();this.recorded=!1;this.resuming=!1;this.begun=0;this.start=void 0,this.agent=void 0,this.messages=[],this.draft="",this.sending=!1,this.changes=[],this.proposals=[],this.readOnly=!1,this.listOpen=!1,this.found=null}static{this.properties={...m.properties,start:{attribute:!1},agent:{state:!0},messages:{state:!0},draft:{state:!0},sending:{state:!0},changes:{state:!0},proposals:{state:!0},readOnly:{state:!0},listOpen:{state:!0},found:{state:!0}}}static{this.styles=[$,b`
      :host {
        container-type: inline-size;
      }
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 0 12px;
        align-items: start;
      }
      .list {
        display: none;
      }
      .list.open {
        display: block;
      }
      @container (min-width: 720px) {
        .layout {
          grid-template-columns: 240px minmax(0, 1fr);
        }
        .list {
          display: block;
          position: sticky;
          top: 0;
          max-height: 80vh;
          overflow-y: auto;
        }
        button.chats {
          display: none;
        }
      }
      .message.found {
        outline: 2px solid var(--warning-color, #f4b400);
        outline-offset: 2px;
      }
      .messages {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
      }
      .message {
        max-width: 85%;
        padding: 6px 12px;
        border-radius: 12px;
        overflow-wrap: anywhere;
      }
      .message.user {
        align-self: flex-end;
        color: var(--text-primary-color, #fff);
        background: var(--primary-color);
      }
      .message.assistant {
        align-self: flex-start;
        background: var(--secondary-background-color);
      }
      .message.error {
        align-self: flex-start;
        color: var(--error-color);
      }
      .message p,
      .message pre {
        margin: 4px 0;
      }
      .message pre {
        overflow-x: auto;
      }
      .message ul,
      .message ol {
        margin: 4px 0;
        padding-left: 20px;
      }
      .message ul {
        list-style: disc;
      }
      .message li {
        padding: 0;
        border: none;
      }
      form.send textarea {
        font: inherit;
        width: 100%;
        box-sizing: border-box;
        min-height: 3em;
        resize: vertical;
      }
    `]}reloadOn(){return["api","start"]}willUpdate(t){t.has("start")&&this.begin(this.start),super.willUpdate(t)}begin(t){this.begun+=1;let s=t?.kind==="resume";this.conversationId=s?t.id:ui(),this.recorded=s,this.resuming=s,this.readOnly=s&&!t.id.startsWith(Ce),this.found=null,this.scrollToFound=!1,this.messages=[],this.draft="",this.sending=!1,this.changes=[],this.proposals=[],this.error="";let r=this.api;if(t===void 0||s||r===void 0)return;let n=this.begun;xr(r,t).then(a=>{n===this.begun&&this.draft===""&&(this.draft=a)})}async load(t){let s=this.conversationId,[r,n,a]=await Promise.all([t.chatAgent(),t.call("list_proposals",{state:"pending",limit:Je}),this.recorded?this.saved(t,s):void 0]);return()=>{if(this.agent=r,a===null){this.begin(void 0);return}this.proposals=n.proposals.filter(c=>c.conversation_id===s),this.changes=a?.changes??[],this.resuming&&a!==void 0&&(this.resuming=!1,this.messages=a.messages.map((c,l)=>({...c,index:l})).filter(c=>kr.has(c.role)),this.messages.some(c=>c.index===this.found)||(this.found=null,this.scrollToFound=!1))}}async saved(t,s){try{return await t.call("get_conversation",{id:s})}catch(r){if(!this.resuming&&Me(r))return null;throw r}}connectedCallback(){super.connectedCallback(),this.hasUpdated&&this.reload()}ready(){let t=this.agent;return t?.ready===!0&&t.agent_id!==null?t.agent_id:void 0}missing(){return this.agent?.ready===!0?br:$r}async send(){let t=this.api,s=this.ready(),r=this.draft.trim();if(t===void 0||s===void 0||r===""||this.sending)return;let n=this.begun;this.messages=[...this.messages,{role:"user",text:r}],this.draft="",this.sending=!0;let a;try{let c=await t.converse(r,this.conversationId,s);if(n!==this.begun)return;this.conversationId=c.conversation_id??this.conversationId,this.recorded=!0;let l=c.response.speech?.plain?.speech??"";a={role:c.response.response_type==="error"?"error":"assistant",text:l}}catch(c){if(n!==this.begun)return;a={role:"error",text:X(c)}}this.messages=[...this.messages,a],this.sending=!1,await this.reload()}newChat(){this.begin(void 0),this.reload()}open(t){this.begin({kind:"resume",id:t.id}),this.found=t.index,this.scrollToFound=t.index!==null,this.listOpen=!1,this.reload()}deleted(t){t===this.conversationId&&this.newChat()}updated(t){if(super.updated(t),!this.scrollToFound)return;let s=this.shadowRoot?.querySelector(".message.found");s!=null&&(this.scrollToFound=!1,s.scrollIntoView({block:"center"}))}async act(t){await this.run(t)&&this.changed()}keydown(t){t.key!=="Enter"||t.shiftKey||t.isComposing||(t.preventDefault(),this.send())}renderMessage(t){let s=t.index!==void 0&&t.index===this.found;return o`<div
      class="message ${t.role}${s?" found":""}"
      data-index=${t.index??d}
    >
      ${t.role==="assistant"?Ye(t.text,this.api):o`<div class="pre">${t.text}</div>`}
    </div>`}renderLinked(){return o`${this.changes.length===0?d:o`<h3>Changes made in this chat</h3>
            <ul class="changes">
              ${this.changes.map(t=>o`<li>
                    <div class="row">
                      <span class="grow">${t.summary}</span>
                      ${h({icon:re,label:"Undo",className:"undo",disabled:this.busy,onClick:()=>{this.act(s=>s.call("undo_change",{history_id:t.id}))}})}
                    </div>
                    <div class="muted">${x(t.time)}</div>
                    ${t.changes.map(s=>o`<div class="muted">${S(s)}</div>`)}
                  </li>`)}
            </ul>`}
    ${this.proposals.length===0?d:o`<h3>Waiting for you</h3>
            <ul class="waiting">
              ${this.proposals.map(t=>o`<li data-id=${t.proposal_id}>
                    <strong class="pre">${t.summary}</strong>
                    <div class="pre">${t.reason}</div>
                    ${t.changes.map(s=>o`<div class="muted">${S(s)}</div>`)}
                    <div class="actions">
                      ${h({icon:E,label:"Reject",className:"reject",disabled:this.busy,onClick:()=>{this.act(s=>s.reject(t.proposal_id))}})}
                      ${h({icon:U,label:"Accept",className:"accept",disabled:this.busy,onClick:()=>{this.act(s=>s.accept(t.proposal_id))}})}
                    </div>
                  </li>`)}
            </ul>`}`}renderAgent(t){let s=this.agent;return s===void 0?d:t?o`<p class="muted agent">
        Chatting through ${s.chat_agent_name??s.chat_agent}
      </p>`:o`<div class="row missing">
      <span class="grow muted">${this.missing()}</span>
      ${y({icon:kt,label:"Open settings",className:"open-settings",onClick:()=>{xt(this.api?.entryId)}})}
    </div>`}renderMessages(){return o`<div class="messages">
      ${this.messages.map(t=>this.renderMessage(t))}
      ${this.sending?o`<div class="muted">Thinking…</div>`:d}
    </div>`}renderComposer(){return o`<form
      class="send"
      @submit=${t=>{t.preventDefault(),this.send()}}
    >
      <textarea
        aria-label="Message"
        placeholder="Ask about the tank"
        .value=${Ks(this.draft)}
        ?disabled=${this.sending}
        @input=${t=>{this.draft=t.target.value}}
        @keydown=${t=>{this.keydown(t)}}
      ></textarea>
      <div class="row">
        <span class="grow muted">Enter sends, Shift+Enter adds a line.</span>
        ${y({icon:Ie,label:"Send",className:"send",primary:!0,type:"submit",disabled:this.sending})}
      </div>
    </form>`}render(){let t=this.ready()!==void 0;return o`<div class="layout">
      <aside id="chat-list" class="list card ${this.listOpen?"open":""}">
        <h2>Chats</h2>
        <tk-chat-list
          .api=${this.api}
          .active=${this.conversationId}
          .stamp=${this.version}
          .locked=${this.sending?this.conversationId:""}
          @tk-open-chat=${s=>{this.open(s.detail)}}
          @tk-conversation-deleted=${s=>{this.deleted(s.detail)}}
        ></tk-chat-list>
      </aside>
      <section>
        <div class="row">
          <h2 class="grow">Chat</h2>
          ${y({icon:Ds,label:"Chats",className:"chats",controls:"chat-list",expanded:this.listOpen,onClick:()=>{this.listOpen=!this.listOpen}})}
          ${t?y({icon:Ns,label:"New chat",className:"new",disabled:this.sending,onClick:()=>{this.newChat()}}):d}
        </div>
        ${this.error?o`<p class="error">${this.error}</p>`:d}
        ${this.renderAgent(t)} ${this.renderMessages()}
        ${this.readOnly?o`<p class="muted read-only">
                Read only. Only chats started here in the panel can go on. Start a New chat to ask
                more.
              </p>`:t?this.renderComposer():d}
        ${this.renderLinked()}
      </section>
    </div>`}};customElements.define("tk-chat",Vt);var Ut=class extends m{constructor(){super();this.details=null;this.toggled=()=>{this.details?.open===!0&&this.reload()};this.collection="",this.recordId=void 0,this.stamp=0,this.entries=void 0}static{this.properties={...m.properties,collection:{attribute:!1},recordId:{attribute:!1},stamp:{attribute:!1},entries:{state:!0}}}static{this.styles=$}connectedCallback(){super.connectedCallback(),this.details=this.closest("details"),this.details?.addEventListener("toggle",this.toggled)}disconnectedCallback(){super.disconnectedCallback(),this.details?.removeEventListener("toggle",this.toggled),this.details=null}async reload(){this.details!==null&&!this.details.open||await super.reload()}reloadOn(){return["api","collection","recordId","stamp"]}async load(t){let s={collection:this.collection,limit:10};this.recordId!==void 0&&(s.record_id=this.recordId);let{history:r}=await t.call("get_history",s);return()=>{this.entries=r}}async undo(t){await this.run(s=>s.call("undo_change",{history_id:t.id}))&&this.changed()}render(){return this.entries===void 0?d:o`
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      ${this.entries.length===0?o`<p class="muted">No changes yet</p>`:d}
      <ul>
        ${this.entries.map(t=>o`<li class="row">
              <div class="grow">
                <div>${t.summary}</div>
                <div class="muted when">
                  ${x(t.time)} ·
                  ${N(t.source)}${typeof t.conversation_name=="string"?` \xB7 in ${t.conversation_name}`:d}
                </div>
                ${t.changes.map(s=>o`<div class="muted">${S(s)}</div>`)}
              </div>
              ${h({icon:re,label:"Undo",className:"undo",disabled:this.busy,onClick:()=>{this.undo(t)}})}
            </li>`)}
      </ul>
    `}};customElements.define("tk-history",Ut);var wr=[{name:"agent",label:"Conversation agent TankKeeper chats through",type:"text"},{name:"chat_agent",label:"Conversation agent the chat uses",type:"text"},{name:"ai_task",label:"AI task entity for review comments",type:"text"},{name:"review_on",label:"Review after",type:"list"},{name:"comments",label:"Claude comments on reviews",type:"checkbox"},{name:"daily_time",label:"Daily review at",type:"time"},{name:"daily_cap",label:"Claude comments a day, at most",type:"number"}],Cr=20,Ar={test:"Test",task:"Task",status:"Status change",daily:"Daily"};function _r(i){let e=i.triggers.map(s=>Ar[s]??s).join(", "),t=i.proposal_ids.length;return o`<li class="review">
    <div class="muted">${x(i.time)} · ${e}</div>
    <div>${i.result}</div>
    ${i.comment===null?d:o`<div class="comment">Claude: ${i.comment}</div>`}
    ${i.note===null?d:o`<div class="muted">${i.note}</div>`}
    ${t===0?d:o`<div class="muted">
            ${t} plan ${t===1?"change":"changes"} proposed
          </div>`}
  </li>`}var Bt=class extends m{static{this.properties={...m.properties,settings:{state:!0},reviews:{state:!0}}}static{this.styles=$}constructor(){super(),this.settings=void 0,this.reviews=[]}async load(e){let[t,s]=await Promise.all([e.call("get_claude"),e.call("get_reviews",{limit:Cr})]);return()=>{this.settings=t,this.reviews=s.reviews}}render(){let e=this.settings;return o`<section>
      <h2>Claude</h2>
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      ${e===void 0?d:o`<p class="muted note">${e.model_note}</p>
              ${q(wr,e)} ${this.historyDetails("settings","claude")}`}
      <h3>Reviews</h3>
      ${this.reviews.length===0?o`<p class="muted">No reviews yet.</p>`:o`<ul class="reviews">
              ${this.reviews.map(_r)}
            </ul>`}
    </section>`}};customElements.define("tk-claude",Bt);var hi=50,Ft=class extends m{static{this.properties={...m.properties,conversations:{state:!0},query:{state:!0},selected:{state:!0},detail:{state:!0}}}static{this.styles=$}constructor(){super(),this.conversations=[],this.query="",this.selected=void 0,this.detail=void 0,this.addEventListener(we,()=>{this.selected=void 0})}reloadOn(){return["api","query","selected"]}async load(e){let t=this.selected;if(t!==void 0){let r=await e.call("get_conversation",{id:t});return()=>{this.detail=r}}let s=this.query===""?await e.call("list_conversations",{limit:hi}):await e.call("search_conversations",{query:this.query,limit:hi});return()=>{this.detail=void 0,this.conversations=s.conversations}}search(e){e.preventDefault();let t=e.target.querySelector("input");this.query=(t?.value??"").trim()}async undo(e){await this.run(t=>t.call("undo_change",{history_id:e.id}))&&this.changed()}renderDetail(e){return o`<section>
      <div class="row">
        ${y({icon:Oe,label:"Back",className:"back",onClick:()=>this.selected=void 0})}
        <h2 class="grow">${e.name}</h2>
        ${e.id.startsWith(Ce)?y({icon:ne,label:"Continue in Chat",className:"resume",onClick:()=>{oe(this,{kind:"resume",id:e.id})}}):d}
        <tk-delete-conversation
          .api=${this.api}
          .conversationId=${e.id}
        ></tk-delete-conversation>
      </div>
      <div class="muted">${N(e.source)} · ${x(e.started)}</div>
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      <p class="pre">${e.summary}</p>
      <h3>Messages</h3>
      <ul>
        ${e.messages.map(t=>o`<li class=${t.role}>
              <div class="role muted">${t.role}</div>
              ${t.role==="assistant"?Ye(t.text,this.api):o`<div class="pre">${t.text}</div>`}
            </li>`)}
      </ul>
      <h3>Changes</h3>
      ${e.changes.length===0?o`<p class="muted">No changes</p>`:d}
      <ul>
        ${e.changes.map(t=>o`<li>
              <div class="row">
                <span class="grow">${t.summary}</span>
                ${h({icon:re,label:"Undo",className:"undo",disabled:this.busy,onClick:()=>{this.undo(t)}})}
              </div>
              <div class="muted">${x(t.time)} · ${N(t.source)}</div>
              ${t.changes.map(s=>o`<div class="muted">${S(s)}</div>`)}
            </li>`)}
      </ul>
    </section>`}render(){return this.detail!==void 0?this.renderDetail(this.detail):o`<section>
      <h2>Conversations</h2>
      <form
        class="search row"
        @submit=${e=>{this.search(e)}}
      >
        <input
          class="search grow"
          type="search"
          aria-label="Search conversations"
          .value=${this.query}
        />
        ${y({icon:Ve,label:"Search",className:"search",type:"submit"})}
      </form>
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      ${this.conversations.length===0?o`<p class="muted">No conversations</p>`:d}
      <ul>
        ${C(this.conversations,e=>e.id,e=>o`<li data-id=${e.id}>
              <div class="row">
                <strong class="grow">${e.name}</strong>
                ${h({icon:Os,label:"Open",className:"open",onClick:()=>this.selected=e.id})}
              </div>
              <div class="muted">
                ${N(e.source)} · ${x(e.updated)}
              </div>
              ${e.match===void 0?d:Xe(e.match)}
              <div class="pre">${e.summary}</div>
            </li>`)}
      </ul>
    </section>`}};customElements.define("tk-conversations",Ft);var Tr=["proposed","accepted","replaced"],mi=[{name:"title",label:"Title",type:"text"},{name:"decision",label:"Decision",type:"textarea"},{name:"why",label:"Why",type:"textarea"},{name:"open",label:"Open points, one per line",type:"list"},{name:"date",label:"Date",type:"date"}],Er=[...mi,{name:"status",label:"Status",type:"select",options:["proposed","accepted"]}],Lr=[{name:"replaced_by",label:"Replaced by decision number",type:"number",step:"1"}];function Q(i){return String(i).padStart(4,"0")}var jt=class extends m{static{this.properties={...m.properties,decisions:{state:!0},status:{state:!0},selected:{state:!0},detail:{state:!0}}}static{this.styles=$}constructor(){super(),this.decisions=[],this.status="",this.selected=void 0,this.detail=void 0}reloadOn(){return["api","status","selected"]}async load(e){let t=this.status===""?{}:{status:this.status},{decisions:s}=await e.call("list_decisions",t),r=this.selected===void 0?void 0:await e.call("get_decision",{number:this.selected});return()=>{this.decisions=s,this.detail=r}}async save(e,t,s){if(e!=="accept"&&Object.keys(t).length===0)return!1;let r=s===void 0?{action:e,...t}:{action:e,number:s,...t},n=await this.run(a=>a.call("set_decision",r));return n&&this.changed(),n}toggle(e){this.selected=this.selected===e?void 0:e}renderDetail(e){return o`<div class="card">
      <p class="pre">${e.decision}</p>
      <h3>Why</h3>
      <p class="pre">${e.why}</p>
      ${e.open.length>0?o`<h3>Open points</h3>
              <ul>
                ${e.open.map(t=>o`<li>${t}</li>`)}
              </ul>`:d}
      ${e.replaced_by===null?d:o`<p class="muted">Replaced by ${Q(e.replaced_by)}</p>`}
      ${e.replaces.length>0?o`<p class="muted">Replaces ${e.replaces.map(Q).join(", ")}</p>`:d}
      <div class="actions">
        ${e.status==="proposed"?h({icon:U,label:"Accept",className:"accept",disabled:this.busy,onClick:()=>{this.save("accept",{},e.number)}}):d}
        ${h({icon:ie,label:"Edit",className:"update",disabled:this.busy,onClick:()=>{this.openDialog("update")}})}
        ${h({icon:ht,label:"Replace",className:"replace",disabled:this.busy,onClick:()=>{this.openDialog("replace")}})}
        ${this.historyButton("decisions",Q(e.number))}
      </div>
      ${this.historyPanel("decisions",Q(e.number))}
      ${this.formDialog({key:"update",className:"update",heading:`Edit decision ${Q(e.number)}`,fields:mi,values:e,save:t=>this.save("update",t,e.number)})}
      ${this.formDialog({key:"replace",className:"replace",heading:`Replace decision ${Q(e.number)}`,fields:Lr,submitLabel:"Replace",submitIcon:ht,save:t=>this.save("replace",t,e.number)})}
    </div>`}renderDecision(e){let t=this.selected===e.number;return o`<li data-number=${e.number}>
      <div class="row">
        <strong class="grow">${Q(e.number)} ${e.title}</strong>
        ${h({icon:t?Fs:Fe,label:t?"Close":"Open",className:"open",onClick:()=>{this.toggle(e.number)}})}
      </div>
      <div class="muted">${e.status} · ${e.date}</div>
      ${t&&this.detail?.number===e.number?this.renderDetail(this.detail):d}
    </li>`}render(){return o`
      <section>
        <div class="head">
          <h2 class="grow">Decisions</h2>
          <select
            class="status"
            aria-label="Status"
            .value=${this.status}
            @change=${e=>this.status=e.target.value}
          >
            <option value="">All</option>
            ${Tr.map(e=>o`<option value=${e}>${e}</option>`)}
          </select>
          ${h({icon:V,label:"Add a decision",className:"add",disabled:this.busy,onClick:()=>{this.openDialog("add")}})}
        </div>
        ${this.renderError()}
        <ul>
          ${C(this.decisions,e=>e.number,e=>this.renderDecision(e))}
        </ul>
        ${this.formDialog({key:"add",className:"add",heading:"Add a decision",fields:Er,submitLabel:"Add",submitIcon:V,save:e=>this.save("add",e)})}
      </section>
    `}};customElements.define("tk-decisions",jt);var Sr={daily:"Daily",test:"After a test",manual:"Check now",chat:"Asked in a chat",area:"Area you chose",thorough:"Thorough"},Rr=[["water","Water"],["algae","Algae"],["plants","Plants"],["fish","Fish"],["level","Water level"]],Qe=b`
  .photo {
    display: block;
    width: 100%;
    max-width: 640px;
    height: auto;
    border-radius: 8px;
    margin: 8px 0;
  }
  .summary {
    font-weight: 500;
  }
  ul.seen li {
    border: none;
    padding: 2px 0;
  }
`;function le(i){return i.photo_url===null?d:o`<img class="photo" src=${i.photo_url} alt="The tank at ${x(i.time)}" />`}function de(i){return`${x(i.time)} \xB7 ${Sr[i.reason]}`}function zt(i){return i.asked?o`<strong class="verdict">${i.issue?"Issue found":"No issue found"}</strong>`:d}function ce(i){let e=Rr.filter(([t])=>i.seen[t]!==void 0);return o`
    ${i.question===null?d:o`<div class="question">You asked: ${i.question}</div>`}
    ${i.summary===null?d:o`<div class="summary">${i.summary}</div>`}
    ${i.suggestion===null?d:o`<div>Suggested: ${i.suggestion}</div>`}
    ${e.length===0?d:o`<ul class="seen">
            ${e.map(([t,s])=>o`<li><strong>${s}</strong> ${i.seen[t]}</li>`)}
          </ul>`}
    ${i.note===null?d:o`<div class="muted note">${i.note}</div>`}
  `}var gi=200,fi=20,vi="The photo is no longer kept.",qt=class extends m{static{this.properties={...m.properties,photos:{state:!0},opened:{state:!0},shown:{state:!0}}}static{this.styles=[$,Qe,b`
      ul.photos {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 12px;
      }
      ul.photos li.photo-check {
        border: 1px solid var(--divider-color, #e0e0e0);
        border-radius: 8px;
        padding: 8px;
      }
      button.open {
        display: block;
        width: 100%;
        padding: 0;
        border: none;
        background: none;
        color: inherit;
        text-align: left;
        cursor: pointer;
      }
      button.open .photo {
        aspect-ratio: 16 / 9;
        object-fit: cover;
        margin: 0 0 8px;
      }
      .pruned {
        display: flex;
        align-items: center;
        justify-content: center;
        aspect-ratio: 16 / 9;
        margin-bottom: 8px;
        border-radius: 8px;
        background: var(--secondary-background-color, #f5f5f5);
      }
      .large .photo {
        max-width: 100%;
      }
    `]}constructor(){super(),this.photos=void 0,this.opened=void 0,this.shown=fi}async load(e){let t=await e.call("list_photos",{limit:this.shown});return()=>{this.photos=t.photos}}showMore(){this.shown=Math.min(this.shown+fi,gi),this.reload()}renderMore(e){return e.length<this.shown||this.shown>=gi?d:o`<div class="row">
      ${y({icon:Fe,label:"Show more",className:"more",onClick:()=>{this.showMore()}})}
    </div>`}renderCard(e){return o`<li class="photo-check" data-check=${e.id}>
      <button
        class="open"
        type="button"
        aria-label="Open the photo check of ${x(e.time)}"
        @click=${()=>this.opened=e.id}
      >
        ${e.photo_url===null?o`<div class="pruned muted">${vi}</div>`:le(e)}
        <div class="muted">${de(e)}</div>
      </button>
      ${zt(e)} ${ce(e)}
    </li>`}renderLarge(){let e=this.photos?.find(t=>t.id===this.opened);return e===void 0?d:o`<tk-dialog
      class="large"
      wide
      heading=${de(e)}
      @tk-dialog-closed=${()=>this.opened=void 0}
    >
      <div class="large">
        ${e.photo_url===null?o`<p class="muted pruned-note">${vi}</p>`:le(e)}
        ${zt(e)} ${ce(e)}
      </div>
    </tk-dialog>`}render(){let e=this.photos;return o`<section id="gallery">
      <div class="row">
        ${y({icon:Oe,label:"Overview",className:"back",onClick:()=>{je(this,!1)}})}
      </div>
      <h2>Photos</h2>
      ${this.renderError()}
      ${e===void 0?d:e.length===0?o`<p class="muted">No photos yet.</p>`:o`<ul class="photos">
                  ${C(e,t=>t.id,t=>this.renderCard(t))}
                </ul>
                ${this.renderMore(e)}`}
      ${this.renderLarge()}
    </section>`}};customElements.define("tk-gallery",qt);var Pr=100,Hr=["all","dose","test","event"],Nr=[["ammonia","Ammonia (ppm)"],["nitrite","Nitrite (ppm)"],["nitrate","Nitrate (ppm)"],["phosphate","Phosphate (ppm)"],["ph","pH"],["kh","KH (dKH)"],["gh","GH (dGH)"],["temperature_c","Temperature (\xB0C)"]],Dr=[{name:"source",label:"Water",type:"select",options:["tank","tap"]},...Nr.map(([i,e])=>({name:i,label:e,type:"number"})),{name:"notes",label:"Notes",type:"textarea"}],Kt=class extends m{static{this.properties={...m.properties,entries:{state:!0},kind:{state:!0},products:{state:!0}}}static{this.styles=$}constructor(){super(),this.entries=[],this.kind="all",this.products=[]}reloadOn(){return["api","kind"]}async load(e){let[t,s]=await Promise.all([e.call("get_log",{kind:this.kind,limit:Pr}),e.call("list_products")]);return()=>{this.entries=t.entries,this.products=s.products.map(r=>r.name)}}doseFields(){return[{name:"product",label:"Product",type:"select",options:this.products,required:!0},{name:"amount_ml",label:"Amount (ml)",type:"number",required:!0},{name:"why",label:"Why",type:"text"},{name:"notes",label:"Notes",type:"textarea"}]}async record(e,t){let s=await this.run(r=>r.call(e,t));return s&&this.changed(),s}async recordTest(e){if(Object.keys(e).length===0)return!1;let{source:t,notes:s,...r}=e,n={values:r};return t!==void 0&&(n.source=t),s!==void 0&&(n.notes=s),this.record("record_test",n)}render(){return o`
      <section>
        <div class="row">
          <h2 class="grow">Log</h2>
          <select
            class="kind"
            aria-label="Kind"
            .value=${this.kind}
            @change=${e=>this.kind=e.target.value}
          >
            ${Hr.map(e=>o`<option value=${e}>${e}</option>`)}
          </select>
        </div>
        <div class="actions record">
          ${y({icon:mt,label:"Record a dose",className:"dose",disabled:this.busy,onClick:()=>{this.openDialog("dose")}})}
          ${y({icon:gt,label:"Record a test result",className:"test",disabled:this.busy,onClick:()=>{this.openDialog("test")}})}
        </div>
        ${this.renderError()}
        <ul>
          ${this.entries.map(e=>o`<li>
                <div class="pre">${Ys(e)}</div>
                <div class="muted">${x(e.time)}</div>
              </li>`)}
        </ul>
      </section>
      ${this.formDialog({key:"dose",className:"dose",heading:"Record a dose",fields:this.doseFields(),submitLabel:"Record",submitIcon:mt,save:e=>this.record("record_dose",e)})}
      ${this.formDialog({key:"test",className:"test",heading:"Record a test result",fields:Dr,submitLabel:"Record",submitIcon:gt,save:e=>this.recordTest(e)})}
    `}};customElements.define("tk-log",Kt);var yi="important",Mr=" !"+yi,bi=F(class extends H{constructor(i){if(super(i),i.type!==L.ATTRIBUTE||i.name!=="style"||i.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(i){return Object.keys(i).reduce((e,t)=>{let s=i[t];return s==null?e:e+`${t=t.includes("-")?t:t.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,"-$&").toLowerCase()}:${s};`},"")}update(i,[e]){let{style:t}=i.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(e)),this.render(e);for(let s of this.ft)e[s]==null&&(this.ft.delete(s),s.includes("-")?t.removeProperty(s):t[s]=null);for(let s in e){let r=e[s];if(r!=null){this.ft.add(s);let n=typeof r=="string"&&r.endsWith(Mr);s.includes("-")||n?t.setProperty(s,n?r.slice(0,-11):r,n?yi:""):t[s]=r}}return _}});var Ir="tk-ask",Or="tk-cancel",$i=.01,pe=1e4;function et(i){return Math.round(Math.min(1,Math.max(0,i))*pe)/pe}function ki(i,e){let t=et(Math.min(i.x,e.x)),s=et(Math.min(i.y,e.y));return{x:t,y:s,width:Math.round((et(Math.max(i.x,e.x))-t)*pe)/pe,height:Math.round((et(Math.max(i.y,e.y))-s)*pe)/pe}}var Wt=class extends k{static{this.properties={src:{type:String},alt:{type:String},disabled:{type:Boolean},box:{state:!0},question:{state:!0}}}static{this.styles=[z,b`
      :host {
        display: block;
      }
      .frame {
        position: relative;
        max-width: 640px;
        margin: 8px 0;
        cursor: crosshair;
        touch-action: none;
        user-select: none;
        overflow: hidden;
        border-radius: 8px;
      }
      img {
        display: block;
        width: 100%;
        height: auto;
        border-radius: 8px;
        pointer-events: none;
      }
      .box {
        position: absolute;
        border: 2px solid var(--primary-color);
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.35);
        box-sizing: border-box;
      }
      label {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin: 8px 0;
      }
      input {
        font: inherit;
        padding: 8px;
        max-width: 624px;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .muted {
        color: var(--secondary-text-color);
      }
    `]}constructor(){super(),this.src="",this.alt="",this.disabled=!1,this.box=void 0,this.question="",this.start=void 0}point(e){let t=e.currentTarget.getBoundingClientRect();return{x:(e.clientX-t.left)/t.width,y:(e.clientY-t.top)/t.height}}down(e){this.disabled||(e.currentTarget.setPointerCapture(e.pointerId),this.start=this.point(e),this.box=void 0)}move(e){this.start!==void 0&&(this.box=ki(this.start,this.point(e)))}up(e){if(this.start===void 0)return;let t=ki(this.start,this.point(e));this.start=void 0,this.box=t.width<$i||t.height<$i?void 0:t}ask(e){let t=this.question.trim(),s=t===""?{...e}:{...e,question:t};this.dispatchEvent(new CustomEvent(Ir,{detail:s,bubbles:!0,composed:!0}))}renderBox(e){return o`<div
      class="box"
      style=${bi({left:`${String(e.x*100)}%`,top:`${String(e.y*100)}%`,width:`${String(e.width*100)}%`,height:`${String(e.height*100)}%`})}
    ></div>`}render(){let e=this.box;return o`<div
        class="frame"
        @pointerdown=${t=>{this.down(t)}}
        @pointermove=${t=>{this.move(t)}}
        @pointerup=${t=>{this.up(t)}}
        @pointercancel=${()=>{this.start=void 0}}
      >
        <img src=${this.src} alt=${this.alt} draggable="false" />
        ${e===void 0?d:this.renderBox(e)}
      </div>
      <p class="muted">
        Drag over the part of the photo to look at closely. Claude sees it at the camera's full
        resolution, from a photo taken now.
      </p>
      <label>
        Question (optional)
        <input
          class="question"
          maxlength="500"
          .value=${this.question}
          @input=${t=>{this.question=t.target.value}}
        />
      </label>
      <div class="row">
        ${y({icon:Ie,label:"Ask Claude",className:"ask",primary:!0,disabled:this.disabled||e===void 0,onClick:()=>{e!==void 0&&this.ask(e)}})}
        ${y({icon:E,label:"Cancel",className:"cancel",onClick:()=>{this.dispatchEvent(new CustomEvent(Or,{bubbles:!0,composed:!0}))}})}
      </div>`}};customElements.define("tk-area-picker",Wt);var Vr=[{name:"camera",label:"Camera entity, such as a Tapo C100",type:"text"},{name:"check_time",label:"Daily check at, only while a light is on",type:"time"},{name:"after_test",label:"Check after each test",type:"checkbox"},{name:"alerts",label:"Alert me about issues",type:"checkbox"},{name:"keep_days",label:"Keep photos for (days)",type:"number"},{name:"check_plants",label:"Check plant health",type:"checkbox"},{name:"check_fish",label:"Check fish health",type:"checkbox"},{name:"thorough_days",label:"Thorough check on",type:"weekdays"}],Gt=class extends m{static{this.properties={...m.properties,stamp:{type:Number},info:{state:!0},proposals:{state:!0},picking:{state:!0}}}static{this.styles=[$,Qe]}constructor(){super(),this.stamp=0,this.info=void 0,this.proposals=[],this.picking=!1}reloadOn(){return["api","stamp"]}async load(e){let[t,s]=await Promise.all([e.call("get_camera"),e.call("list_proposals",{state:"pending"})]);return()=>{this.info=t,this.proposals=s.proposals}}async act(e){let t=await this.run(e);return t&&this.changed(),t}async askArea(e){await this.act(t=>t.call("check_area",{...e}))&&(this.picking=!1)}renderLatest(e){return this.picking&&e.photo_url!==null?o`<tk-area-picker
        src=${e.photo_url}
        alt="The tank, to choose an area"
        ?disabled=${this.busy}
        @tk-ask=${t=>{this.askArea(t.detail)}}
        @tk-cancel=${()=>{this.picking=!1}}
      ></tk-area-picker>`:o`<div class="latest">
      <div class="muted">${de(e)}</div>
      ${le(e)} ${ce(e)}
    </div>`}renderIssue(e){let t=this.proposals.filter(s=>e.proposal_ids.includes(s.proposal_id));return o`<li class="issue" data-check=${e.id}>
      <div class="muted">${de(e)}</div>
      ${le(e)} ${ce(e)}
      ${t.length===0?d:o`<div class="waiting">
              <div class="muted">Accept applies:</div>
              ${t.map(s=>o`<div class="proposal">
                    <strong class="pre">${s.summary}</strong>
                    ${s.changes.map(r=>o`<div class="muted">${S(r)}</div>`)}
                  </div>`)}
            </div>`}
      <div class="actions">
        ${h({icon:Bs,label:"Not a problem",className:"dismiss",disabled:this.busy,onClick:()=>{this.act(s=>s.call("dismiss_finding",{check_id:e.id}))}})}
        ${h({icon:ne,label:"Discuss",className:"discuss",onClick:()=>{oe(this,{kind:"photo",id:e.id})}})}
        ${h({icon:E,label:"Reject",className:"reject",disabled:this.busy,onClick:()=>{this.act(s=>s.rejectFinding(e.id))}})}
        ${h({icon:U,label:"Accept",className:"accept",disabled:this.busy,onClick:()=>{this.act(s=>s.acceptFinding(e.id))}})}
      </div>
    </li>`}renderSettings(e){return o`<details class="settings">
      <summary>Camera settings</summary>
      <p class="muted">
        Each check sends the photo to Anthropic through the AI task entity, uses paid API calls and
        counts toward Claude's comments a day.
      </p>
      ${q(Vr,e)} ${this.historyDetails("settings","camera")}
    </details>`}render(){let e=this.info;if(e===void 0)return this.error?o`<p class="error">${this.error}</p>`:o``;let t=this.error?o`<p class="error">${this.error}</p>`:d;if(e.camera===null)return o`<section id="camera">
        <h2>Camera</h2>
        ${t}
        <p class="muted">
          No camera is set. Add one in the settings, such as a Tapo C100, to have Claude look at the
          tank.
        </p>
        ${this.renderSettings(e)}
      </section>`;let s=e.latest;return o`<section id="camera">
        <h2>Camera</h2>
        ${t}
        ${s===null?o`<p class="muted">No photo yet.</p>`:this.renderLatest(s)}
        <div class="row">
          ${y({icon:Ue,label:"Check now",className:"check",primary:!0,disabled:this.busy,onClick:()=>{this.act(r=>r.call("check_now"))}})}
          ${y({icon:Is,label:"Thorough check",className:"thorough",disabled:this.busy,onClick:()=>{this.act(r=>r.call("check_thorough"))}})}
          ${s?.photo_url==null||this.picking?d:y({icon:Ve,label:"Look closer",className:"closer",disabled:this.busy,onClick:()=>{this.picking=!0}})}
          ${y({icon:Us,label:"More photos",className:"photos",onClick:()=>{je(this)}})}
        </div>
        ${this.renderSettings(e)}
      </section>
      ${e.open.length===0?d:o`<section id="seen">
              <h2>Seen by the camera</h2>
              <ul>
                ${C(e.open,r=>r.id,r=>this.renderIssue(r))}
              </ul>
            </section>`}`}};customElements.define("tk-camera",Gt);var Ur=7,xi=30,Br=60,wi={on_course:"On course",watch:"Watch",act:"Act"},Fr={cycling:"Cycling",cycled:"Cycled"},jr=[{name:"name",label:"Name",type:"text"},{name:"volume_litres",label:"Volume (litres)",type:"number"},{name:"dosing_volume_litres",label:"Water volume for doses (litres)",type:"number"},{name:"temperature_c",label:"Target temperature (\xB0C)",type:"number"},{name:"stage",label:"Stage",type:"select",options:["cycling","cycled"]},{name:"notes",label:"Notes",type:"textarea"}],zr=[{name:"source",label:"Values come from",type:"select",options:["supplier","tap_test"]},{name:"ph",label:"pH",type:"number"},{name:"kh",label:"KH (dKH)",type:"number"},{name:"gh",label:"GH (dGH)",type:"number"},{name:"nitrate",label:"Nitrate (mg/l)",type:"number"},{name:"phosphate",label:"Phosphate (mg/l)",type:"number"},{name:"notes",label:"Notes",type:"textarea"}],qr=[{name:"nitrogen_watch",label:"Ammonia or nitrite Watch above (ppm)",type:"number"},{name:"nitrogen_act",label:"Ammonia or nitrite Act above (ppm)",type:"number"},{name:"ph_watch",label:"pH Watch under, while cycling",type:"number"},{name:"ph_act",label:"pH Act under, while cycling",type:"number"},{name:"stall_watch_days",label:"Stalled cycle Watch after (days)",type:"number",step:"1"},{name:"stall_act_days",label:"Stalled cycle Act after (days)",type:"number",step:"1"},{name:"test_watch_days",label:"Late test Watch after (days)",type:"number",step:"1"},{name:"test_act_days",label:"Late test Act after (days)",type:"number",step:"1"},{name:"skip_watch",label:"Skipped tasks for Watch",type:"number",step:"1"},{name:"skip_act",label:"Skipped tasks for Act",type:"number",step:"1"},{name:"plan_watch_days",label:"Plan ends within, for Watch (days)",type:"number",step:"1"},{name:"plan_act_days",label:"Plan ends within, for Act (days)",type:"number",step:"1"}],Zt=class extends m{static{this.properties={...m.properties,status:{state:!0},tank:{state:!0},plan:{state:!0},log:{state:!0},lights:{state:!0},proposals:{state:!0},camera:{state:!0},claude:{state:!0},result:{state:!0}}}static{this.styles=$}constructor(){super(),this.status=void 0,this.tank=void 0,this.plan=void 0,this.log=[],this.lights=void 0,this.proposals=[],this.camera=void 0,this.claude=void 0,this.result=void 0}async load(e){let t=B(new Date,e.timeZone),[s,r,n,a,c,l,u,g]=await Promise.all([e.call("get_status"),e.call("get_tank"),e.call("get_plan",{start:t,end:T(t,Ur)}),e.call("get_log",{kind:"test",since:T(t,-Br),limit:500}),e.call("get_light",{days:xi}),e.call("list_proposals",{state:"pending"}),e.call("get_camera"),e.call("get_claude")]);return()=>{this.status=s,this.tank=r,this.plan=n,this.log=a.entries,this.lights=c,this.proposals=l.proposals,this.camera=u,this.claude=g}}async act(e){await this.run(e)&&this.changed()}settingsCard(e,t,s,r,n,a){return o`<section id=${e}>
      <h2>${t}</h2>
      ${q(s,r)} ${this.historyDetails(n,a)}
    </section>`}renderStatus(e,t){let s=e.status===null?"Not checked yet":wi[e.status],r=e.stage===null?"":Fr[e.stage];return o`<section id="status">
      <div class="row">
        <h2 class="grow">${t.tank.name}</h2>
        <strong class="level ${e.status??""}">${s}</strong>
      </div>
      <div class="muted">
        ${[r,e.checked===null?"":`checked ${x(e.checked)}`].filter(n=>n!=="").join(" \xB7 ")}
      </div>
      <ul>
        ${e.rules.filter(n=>n.level!=="on_course").map(n=>o`<li>
                <strong>${wi[n.level]}</strong> ${n.reason}
                ${n.action===null?d:o`<div>${n.action}</div>`}
              </li>`)}
      </ul>
    </section>`}analyseBlocked(e){return this.busy?"A check is running.":e.lights.length>0&&e.lights.every(s=>s.state!=="on")?"Every light is off, so the camera sees nothing.":void 0}scrollToCamera(e){e.preventDefault(),this.renderRoot.querySelector("tk-camera")?.scrollIntoView({block:"start"})}renderAnalyse(e){let{claude:t,result:s}=this;if(this.camera?.camera==null||t===void 0)return d;let r=this.analyseBlocked(e);return o`<section id="analyse">
      <div class="row">
        ${y({icon:Ue,label:"Analyse tank now",className:"analyse",primary:!0,disabled:r!==void 0,onClick:()=>{this.act(async n=>{this.result=await n.call("check_now")})}})}
      </div>
      ${r===void 0?d:o`<p class="muted reason">${r}</p>`}
      <p class="muted cost">
        Each check uses paid Anthropic API usage and counts toward Claude's daily cap of
        ${String(t.daily_cap)}.
      </p>
      ${t.ai_task===null?o`<p class="muted no-ai-task">
              No AI task entity is set, so a check takes a photo but Claude does not look at it.
            </p>`:d}
      ${s===void 0?d:o`<div class="result">
              <div class="muted">${x(s.time)}</div>
              ${s.asked?o`<strong>${s.issue?"Issue found":"No issue found"}</strong>`:d}
              ${s.summary===null?d:o`<div>${s.summary}</div>`}
              ${s.suggestion===null?d:o`<div>Suggested: ${s.suggestion}</div>`}
              ${s.note===null?d:o`<div class="muted">${s.note}</div>`}
              <a
                class="camera-link"
                href="#camera"
                @click=${n=>{this.scrollToCamera(n)}}
                >See it in the Camera section</a
              >
            </div>`}
    </section>`}renderTask(e,t){return o`<li>
      <div class="row">
        <span class="grow">${e.time??""} ${e.text}</span>
        ${t&&e.state==="open"?o`<div class="actions">
                ${h({icon:Ms,label:"Skip",className:"skip",disabled:this.busy,onClick:()=>{this.act(s=>s.call("skip_task",{task_id:e.id}))}})}
                ${h({icon:U,label:"Complete",className:"complete",disabled:this.busy,onClick:()=>{this.act(s=>s.call("complete_task",{task_id:e.id}))}})}
              </div>`:o`<span class="muted">${e.state==="open"?"":e.state}</span>`}
      </div>
    </li>`}renderLight(e,t){let{schedule:s,automation:r}=e;return o`<li data-light=${e.id}>
      <div class="row">
        <strong class="grow">${e.model}</strong>
        <span class="muted">${e.state??"unknown"}</span>
      </div>
      ${s===null?o`<div><strong>Needs helpers</strong></div>
              <div class="muted">
                Should run ${e.on} to
                ${e.off}${e.brightness_pct===null?"":`, ${String(e.brightness_pct)}%`}
              </div>`:o`<div>${Kr(s)}</div>`}
      ${r===null?d:o`<div class="muted">
              Automation
              ${r.id===null?r.entity_id:o`<a class="automation" href=${`/config/automation/edit/${r.id}`}
                      >${r.entity_id}</a
                    >`}
              (${r.state??"missing"})
            </div>`}
      <div class="muted">Today ${e.today.on} to ${e.today.off}</div>
      ${e.problems.map(n=>o`<div class="error">${n}</div>`)}
      ${Ze(Ge(e.on_periods,t,xi,this.api?.timeZone))}
      ${this.historyDetails("lights",e.id)}
    </li>`}renderParameters(e,t){let{charts:s,empty:r}=ti(this.log,e.settings,t.tank.temperature_c,t.water);return o`<section id="parameters">
      <h2>Water parameters</h2>
      <div class="charts">
        ${s.map(n=>o`<div class="parameter" data-parameter=${n.key}>
              <h3>${n.label}</h3>
              ${ke(n.chart,n.label)}
            </div>`)}
      </div>
      ${r.length===0?d:o`<p class="muted">No readings yet for: ${r.join(", ")}</p>`}
    </section>`}renderProposal(e){return o`<li>
      <strong class="pre">${e.summary}</strong>
      <div class="pre">${e.reason}</div>
      <div class="muted">${N(e.source)} · ${x(e.created)}</div>
      ${e.changes.map(t=>o`<div class="muted">${S(t)}</div>`)}
      <div class="actions">
        ${h({icon:ne,label:"Discuss",className:"discuss",onClick:()=>{oe(this,{kind:"proposal",id:e.proposal_id})}})}
        ${h({icon:E,label:"Reject",className:"reject",disabled:this.busy,onClick:()=>{this.act(t=>t.reject(e.proposal_id))}})}
        ${h({icon:U,label:"Accept",className:"accept",disabled:this.busy,onClick:()=>{this.act(t=>t.accept(e.proposal_id))}})}
      </div>
    </li>`}render(){let{status:e,tank:t,plan:s,lights:r}=this;if(e===void 0||t===void 0||s===void 0||r===void 0)return this.error?o`<p class="error">${this.error}</p>`:o`<p class="muted">Loading</p>`;let n=B(new Date,this.api?.timeZone),a=s.tasks.filter(l=>l.date===n),c=s.tasks.filter(l=>l.date>n);return o`
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      ${this.renderStatus(e,t)} ${this.renderAnalyse(r)}
      <section id="today">
        <h2>Today</h2>
        ${a.length===0?o`<p class="muted">No tasks today</p>`:d}
        <ul>
          ${C(a,l=>l.id,l=>this.renderTask(l,!0))}
        </ul>
      </section>
      <section id="waiting">
        <h2>Waiting for you</h2>
        ${this.proposals.length===0?o`<p class="muted">Nothing is waiting for you</p>`:d}
        <ul>
          ${C(this.proposals,l=>l.proposal_id,l=>this.renderProposal(l))}
        </ul>
      </section>
      <section id="cycle">
        <h2>Cycle</h2>
        ${ke(We(this.log,e.settings),"Cycle")}
      </section>
      ${this.renderParameters(e,t)}
      <section id="week">
        <h2>Next 7 days</h2>
        ${c.length===0?o`<p class="muted">No tasks</p>`:d}
        <ul>
          ${c.map(l=>o`<li>
                <span class="muted">${l.date}</span> ${l.time??""} ${l.text}
              </li>`)}
        </ul>
      </section>
      ${this.settingsCard("tank","Tank",jr,t.tank,"tank","tank")}
      ${this.settingsCard("water","Water",zr,t.water??{},"water","water")}
      <section id="light">
        <h2>Light</h2>
        ${r.lights.length===0?o`<p class="muted">No lights yet</p>`:d}
        ${r.next_change===null?d:o`<div class="muted">Next change ${x(r.next_change.time)}</div>`}
        <ul>
          ${C(r.lights,l=>l.id,l=>this.renderLight(l,r.today))}
        </ul>
      </section>
      ${this.settingsCard("rules","Rule limits",qr,e.settings,"settings","rules")}
      <tk-camera .api=${this.api} .stamp=${this.version}></tk-camera>
    `}};customElements.define("tk-overview",Zt);function Kr(i){let e=[`${i.on??"?"} to ${i.off??"?"}`];return i.brightness_pct!==null&&e.push(`${String(i.brightness_pct)}%`),i.ramp_minutes!==null&&e.push(`${String(i.ramp_minutes)} min ramp`),e.join(", ")}var es="M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z",Wr=[0,1,2,3,4,5,6],Gr=new Intl.DateTimeFormat("en-GB",{weekday:"short",timeZone:"UTC"}),Zr=/\btest/i;function Jt(i){let[e=0,t=1,s=1]=i.split("-").map(Number);return new Date(Date.UTC(e,t-1,s))}function Yr(i){return(Jt(i).getUTCDay()+6)%7}function Yt(i){return T(i,-Yr(i))}function Xr(i){return Zr.test(i.text)?"test":i.slot==="dose"?"dose":"task"}function Xt(i){return`${Gr.format(Jt(i))} ${String(Jt(i).getUTCDate())}`}var Qt=class extends k{static{this.properties={tasks:{attribute:!1},start:{attribute:!1},end:{attribute:!1},today:{attribute:!1},picked:{attribute:!1},week:{state:!0}}}constructor(){super(),this.tasks=[],this.start="",this.end="",this.today="",this.picked=void 0,this.week=void 0}static{this.styles=b`
    :host {
      display: block;
      margin-bottom: 12px;
    }
    nav {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .label {
      flex: 1;
      text-align: center;
      font-size: 0.9em;
      color: var(--secondary-text-color);
    }
    nav button {
      font: inherit;
      padding: 4px 10px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      color: var(--primary-text-color);
      background: none;
      cursor: pointer;
    }
    nav button:disabled {
      opacity: 0.4;
      cursor: default;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 4px;
    }
    .day {
      min-height: 72px;
      padding: 4px;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }
    .day.outside {
      opacity: 0.4;
    }
    .today {
      border-color: var(--primary-color);
      box-shadow: inset 0 0 0 1px var(--primary-color);
    }
    .head {
      font-size: 0.8em;
      color: var(--secondary-text-color);
    }
    .today .head {
      color: var(--primary-color);
      font-weight: 600;
    }
    .chip {
      display: flex;
      align-items: center;
      gap: 2px;
      width: 100%;
      font: inherit;
      font-size: 0.75em;
      text-align: left;
      padding: 2px 4px;
      border: none;
      border-radius: 4px;
      color: rgba(0, 0, 0, 0.87);
      cursor: pointer;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .chip span {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .chip.task {
      background: var(--primary-color);
    }
    .chip.dose {
      background: var(--success-color, #43a047);
    }
    .chip.test {
      background: var(--warning-color, #ffa600);
    }
    .chip.done {
      opacity: 0.5;
      text-decoration: line-through;
    }
    ha-svg-icon {
      --mdc-icon-size: 12px;
      flex: none;
    }
    .strip {
      display: none;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 4px;
    }
    .strip button {
      display: grid;
      justify-items: center;
      gap: 2px;
      font: inherit;
      font-size: 0.8em;
      padding: 4px 0;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      color: var(--primary-text-color);
      background: none;
      cursor: pointer;
    }
    .strip button:disabled {
      opacity: 0.4;
      cursor: default;
    }
    .strip button.picked {
      background: var(--primary-color);
      color: rgba(0, 0, 0, 0.87);
    }
    .count {
      font-weight: 600;
      min-height: 1.2em;
    }
    @media (max-width: 600px) {
      .grid {
        display: none;
      }
      .strip {
        display: grid;
      }
    }
  `}first(){return Yt(this.start)}last(){return Yt(this.end)}shown(){let e=this.week??Yt(this.today);return e<this.first()?this.first():e>this.last()?this.last():e}move(e){this.week=T(this.shown(),7*e),this.fire("tk-week-change",this.week)}fire(e,t){this.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:!0,composed:!0}))}inside(e){return e>=this.start&&e<=this.end}chip(e){let t=Xr(e),s=e.state!=="open",r=["chip",t,...s?["done"]:[]].join(" "),n=[e.text,t,...e.series_id===null?[]:["repeats"],...s?["done"]:[]].join(", ");return o`<button
      class=${r}
      aria-label=${n}
      data-task=${e.id}
      title=${e.text}
      @click=${()=>{this.fire("tk-pick-task",e.id)}}
    >
      ${e.series_id===null?d:o`<ha-svg-icon class="repeat" .path=${es}></ha-svg-icon>`}<span>${e.text}</span>
    </button>`}render(){let e=this.shown(),t=Wr.map(n=>T(e,n)),s=n=>this.tasks.filter(a=>a.date===n),r=(n,a)=>[a,...n===this.today?["today"]:[],...this.inside(n)?[]:["outside"]].join(" ");return o`<nav>
        <button
          class="prev"
          aria-label="Previous week"
          ?disabled=${e<=this.first()}
          @click=${()=>{this.move(-1)}}
        >
          ‹
        </button>
        <span class="label">${e} to ${T(e,6)}</span>
        <button
          class="next"
          aria-label="Next week"
          ?disabled=${e>=this.last()}
          @click=${()=>{this.move(1)}}
        >
          ›
        </button>
      </nav>
      <div class="grid">
        ${t.map(n=>o`<div
              class=${r(n,"day")}
              data-day=${n}
              aria-current=${n===this.today?"date":d}
            >
              <span class="head">${Xt(n)}</span>
              ${s(n).map(a=>this.chip(a))}
            </div>`)}
      </div>
      <div class="strip">
        ${t.map(n=>{let a=s(n).length,c=[...n===this.today?["today"]:[],...n===this.picked?["picked"]:[]].join(" ");return o`<button
            class=${c}
            data-day=${n}
            aria-current=${n===this.today?"date":d}
            aria-pressed=${n===this.picked?"true":"false"}
            aria-label=${`${Xt(n)}: ${String(a)} ${a===1?"task":"tasks"}`}
            ?disabled=${!this.inside(n)}
            @click=${()=>{this.fire("tk-pick-day",n)}}
          >
            <span>${Xt(n)}</span><span class="count">${a===0?"":String(a)}</span>
          </button>`})}
      </div>`}};customElements.define("tk-week",Qt);var Jr=28,Ci=[{name:"text",label:"Task",type:"text"},{name:"date",label:"Date",type:"date"},{name:"slot",label:"Slot",type:"select",options:["task","dose"]}],Ai={name:"note",label:"Note",type:"text"},_i=[{name:"every_days",label:"Repeat every N days",type:"number",step:"1"},{name:"weekdays",label:"Or repeat weekly on",type:"weekdays"},{name:"until",label:"Repeat until",type:"date"}],Qr=[...Ci,Ai,..._i],Ti=[...Ci,{name:"state",label:"State",type:"select",options:["open","complete","skip"]},Ai],en=[...Ti,{name:"scope",label:"Apply to (the repeat changes only for this and later ones)",type:"select",options:["this","future"],required:!0},..._i],tn=[{name:"notify",label:"Notify services for reminders",type:"list"},{name:"status_notify",label:"Notify services for status alerts",type:"list"},{name:"task_time",label:"Task reminder time",type:"time"},{name:"dose_time",label:"Dose reminder time",type:"time"},{name:"resend_time",label:"Resend open tasks at",type:"time"}],ts=class extends m{static{this.properties={...m.properties,plan:{state:!0},today:{state:!0},day:{state:!0}}}static{this.styles=$}constructor(){super(),this.plan=void 0,this.today="",this.day=void 0}async load(e){let t=B(new Date,e.timeZone),s=await e.call("get_plan",{start:t,end:T(t,Jr-1)});return()=>{this.plan=s,this.today=t,this.day!==void 0&&(this.day<t||this.day>s.end)&&(this.day=void 0)}}async save(e,t,s){if(s===void 0&&Object.keys(t).length===0)return!1;let r=Object.fromEntries(Object.entries(t).filter(([,c])=>!Array.isArray(c)||c.length>0)),n=s===void 0?r:{task_id:s,...r},a=await this.run(c=>c.call(e,n));return a&&this.changed(),a}async showTask(e){this.day=void 0,await this.updateComplete,this.renderRoot.querySelector(`li[data-task="${CSS.escape(e)}"]`)?.scrollIntoView({behavior:"smooth",block:"center"})}keepDayIn(e){this.day!==void 0&&(this.day<e||this.day>T(e,6))&&(this.day=void 0)}pickDay(e){this.day=this.day===e?void 0:e}renderTask(e){let t=this.plan?.series.find(r=>r.id===e.series_id),s=[e.state,e.note,t?.repeat].filter(r=>r!=null&&r!=="");return o`<li data-task=${e.id}>
      <div class="row">
        ${t===void 0?d:o`<ha-svg-icon class="repeat" .path=${es} title="Repeats"></ha-svg-icon>`}
        <span class="grow">${e.time??""} ${e.text}</span>
        <div class="actions">
          ${h({icon:ie,label:"Edit",className:"edit",disabled:this.busy,onClick:()=>{this.openDialog(`edit:${e.id}`)}})}
          ${this.historyButton("tasks",e.id)}
          ${h({icon:J,label:"Remove",className:"remove",disabled:this.busy,onClick:()=>{this.save("remove_task",{},e.id)}})}
          ${t===void 0?d:h({icon:Hs,label:"Remove this and later",className:"remove-future",disabled:this.busy,onClick:()=>{this.save("remove_task",{scope:"future"},e.id)}})}
        </div>
      </div>
      <div class="muted detail">${s.join(" \xB7 ")}</div>
      ${this.historyPanel("tasks",e.id)}
      ${this.formDialog({key:`edit:${e.id}`,className:"edit",heading:"Edit the task",fields:t===void 0?Ti:en,values:t===void 0?e:sn(e,t),save:r=>this.save("update_task",r,e.id)})}
    </li>`}render(){let e=this.plan,t=[...new Set(e?.tasks.map(r=>r.date)??[])],s=this.day===void 0?t:t.filter(r=>r===this.day);return o`
      <section>
        <div class="head">
          <h2>Plan</h2>
          ${h({icon:V,label:"Add a task",className:"add",disabled:this.busy,onClick:()=>{this.openDialog("add")}})}
        </div>
        ${this.renderError()}
        ${e===void 0?d:o`<tk-week
                .tasks=${e.tasks}
                .start=${e.start}
                .end=${e.end}
                .today=${this.today}
                .picked=${this.day}
                @tk-week-change=${r=>{this.keepDayIn(r.detail)}}
                @tk-pick-task=${r=>this.showTask(r.detail)}
                @tk-pick-day=${r=>{this.pickDay(r.detail)}}
              ></tk-week>`}
        ${this.day===void 0?d:o`<p class="filter muted">
                Showing ${this.day}
                ${y({icon:E,label:"Show all",className:"show-all",onClick:()=>{this.day=void 0}})}
              </p>`}
        ${e!==void 0&&s.length===0?o`<p class="muted">
                ${this.day===void 0?"No tasks in the next four weeks":`No tasks on ${this.day}`}
              </p>`:d}
        ${s.map(r=>o`<h3>${r}</h3>
              <ul>
                ${C(e?.tasks.filter(n=>n.date===r)??[],n=>n.id,n=>this.renderTask(n))}
              </ul>`)}
        ${this.formDialog({key:"add",className:"add",heading:"Add a task",fields:Qr,submitLabel:"Add",submitIcon:V,save:r=>this.save("add_task",r)})}
      </section>
      ${e===void 0?d:o`<section id="reminders">
              <h2>Reminders</h2>
              ${q(tn,e.reminders)}
              ${this.historyDetails("settings","reminders")}
            </section>`}
    `}};function sn(i,e){return{...i,scope:"this",every_days:e.every_days,weekdays:e.weekdays,until:e.until}}customElements.define("tk-plan",ts);var ss={back_left:"Back left",back_middle:"Back middle",back_right:"Back right",front_left:"Front left",front_middle:"Front middle",front_right:"Front right"};function Li(i){return(typeof i=="string"?ss[i]:void 0)??"Not placed"}var rn="tk-move",Ei="application/x-tankkeeper-content",tt="none",is=class extends k{static{this.properties={items:{attribute:!1},disabled:{type:Boolean},picked:{state:!0}}}static{this.styles=b`
    :host {
      display: block;
    }
    .edge {
      font-size: 12px;
      letter-spacing: 0.08em;
      text-align: center;
      color: var(--secondary-text-color);
    }
    .tank {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      border: 3px solid var(--info-color, #64b5f6);
      border-radius: 6px;
      overflow: hidden;
    }
    .zone {
      min-height: 96px;
      padding: 8px;
      border: 1px dashed var(--divider-color);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .zone.none {
      min-height: 0;
      margin-top: 8px;
      border-radius: 8px;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    button {
      font: inherit;
      color: inherit;
      cursor: pointer;
    }
    button:disabled {
      cursor: default;
    }
    button.zone-name {
      align-self: flex-start;
      padding: 2px 4px;
      border: none;
      background: none;
      font-size: 12px;
      font-weight: 500;
      color: var(--secondary-text-color);
    }
    button.zone-name:not(:disabled) {
      color: var(--primary-color);
      text-decoration: underline;
    }
    button.chip {
      display: flex;
      align-items: center;
      gap: 6px;
      min-height: 32px;
      padding: 2px 10px 2px 2px;
      border: 1px solid var(--divider-color);
      border-radius: 16px;
      background: var(--card-background-color, #fff);
      font-size: 13px;
    }
    button.chip[aria-pressed="true"] {
      box-shadow: 0 0 0 2px var(--primary-color);
    }
    button.chip b {
      min-width: 24px;
      height: 24px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: var(--text-primary-color, #fff);
      background: var(--primary-color);
    }
  `}constructor(){super(),this.items=[],this.disabled=!1,this.picked=void 0}move(e,t){this.picked=void 0;let s=this.items.find(n=>n.id===e),r=t===tt?null:t;s===void 0||(s.zone??null)===r||this.dispatchEvent(new CustomEvent(rn,{detail:{id:e,zone:r},bubbles:!0,composed:!0}))}chip(e){return o`<button
      type="button"
      class="chip"
      data-id=${e.id}
      draggable="true"
      aria-pressed=${this.picked===e.id?"true":"false"}
      ?disabled=${this.disabled}
      @click=${()=>this.picked=this.picked===e.id?void 0:e.id}
      @dragstart=${t=>{t.dataTransfer?.setData(Ei,e.id),t.dataTransfer&&(t.dataTransfer.effectAllowed="move")}}
    >
      <b>${e.number??d}</b> ${e.name??""}
    </button>`}zone(e,t,s){let r=this.picked;return o`<div
      class="zone ${e===tt?tt:""}"
      data-zone=${e}
      @dragover=${n=>{n.preventDefault(),n.dataTransfer&&(n.dataTransfer.dropEffect="move")}}
      @drop=${n=>{n.preventDefault();let a=n.dataTransfer?.getData(Ei)??"";a!==""&&this.move(a,e)}}
    >
      <button
        type="button"
        class="zone-name"
        ?disabled=${this.disabled||r===void 0}
        @click=${()=>{r!==void 0&&this.move(r,e)}}
      >
        ${t}
      </button>
      <div class="chips">
        ${C(s,n=>n.id,n=>this.chip(n))}
      </div>
    </div>`}render(){let e=t=>this.items.filter(s=>(typeof s.zone=="string"&&s.zone in ss?s.zone:null)===t);return o`
      <div class="edge">BACK</div>
      <div class="tank">
        ${Object.entries(ss).map(([t,s])=>this.zone(t,s,e(t)))}
      </div>
      <div class="edge">FRONT (camera side)</div>
      ${this.zone(tt,"Not placed",e(null))}
    `}};customElements.define("tk-tank-map",is);function w(i){return typeof i=="string"||typeof i=="number"?String(i):""}function nn(i){return i.label_dose??{}}var on={products:{title:"Products",noun:"product",collection:"products",list:"list_products",key:"products",canShowRemoved:!0,label:i=>w(i.name),lines:i=>{let e=nn(i),t=[w(i.purpose)];if(i.label_dose){let s=i.label_dose_for_tank_ml===void 0?"":` (${w(i.label_dose_for_tank_ml)} ml for this tank)`;t.push(`Label: ${w(e.amount_ml)} ml per ${w(e.per_litres)} l, ${w(e.frequency)}${s}`)}return w(i.your_dose)&&t.push(`Your dose: ${w(i.your_dose)}`),t.push(w(i.notes)),Array.isArray(i.links)&&t.push(i.links.map(w).join(" ")),t}},contents:{title:"Contents",noun:"content",collection:"contents",list:"list_contents",key:"contents",canShowRemoved:!0,label:i=>[w(i.number),w(i.name)].filter(e=>e!=="").join(" "),lines:i=>[[w(i.type),w(i.count),Li(i.zone),w(i.where),`added ${w(i.added)}`].filter(e=>e!=="").join(" \xB7 "),Array.isArray(i.aliases)&&i.aliases.length>0?`Also called: ${i.aliases.map(w).join(", ")}`:"",w(i.notes)]},notes:{title:"Notes",noun:"note",collection:"notes",list:"list_notes",key:"notes",edit:{idArg:"note_id",add:"add_note",update:"update_note",remove:"remove_note",fields:[{name:"kind",label:"Kind",type:"select",options:["question","assumption"]},{name:"topic",label:"Topic",type:"text"},{name:"text",label:"Text",type:"textarea"},{name:"how_to_resolve",label:"How to resolve",type:"textarea"}]},canShowRemoved:!1,label:i=>`${w(i.kind)}: ${w(i.topic)}`,lines:i=>[w(i.text),w(i.how_to_resolve)]}},rs=class extends m{static{this.properties={...m.properties,kind:{attribute:!1},items:{state:!0},showRemoved:{state:!0}}}static{this.styles=$}constructor(){super(),this.kind="",this.items=[],this.showRemoved=!1}get config(){let e=on[this.kind];if(e===void 0)throw new Error(`No records called ${this.kind}`);return e}reloadOn(){return["api","kind","showRemoved"]}async load(e){let t=this.config,s=t.canShowRemoved?{include_removed:this.showRemoved}:{},r=(await e.call(t.list,s))[t.key]??[];return()=>{this.items=r}}async save(e,t,s,r){if(Object.keys(s).length===0)return!1;let n=r===void 0?s:{[e.idArg]:r,...s};return this.run(a=>a.call(t,n))}async removeRecord(e,t){await this.run(s=>s.call(e.remove,{[e.idArg]:t}))}map(){if(this.kind!=="contents")return d;let e=this.items.filter(t=>typeof t.removed!="string");return o`<tk-tank-map
      .items=${e}
      ?disabled=${this.busy}
      @tk-move=${t=>{this.run(s=>s.call("update_content",{content_id:t.detail.id,zone:t.detail.zone}))}}
    ></tk-tank-map>`}actions(e,t){let s=e.edit,r=typeof t.removed=="string";return o`<div class="actions">
      ${r?o`<span class="muted">Removed ${t.removed}</span>`:d}
      ${s===void 0?d:h({icon:ie,label:"Edit",className:"edit",disabled:this.busy,onClick:()=>{this.openDialog(`edit:${t.id}`)}})}
      ${this.historyButton(e.collection,t.id)}
      ${s===void 0||r?d:h({icon:J,label:"Remove",className:"remove",disabled:this.busy,onClick:()=>{this.removeRecord(s,t.id)}})}
    </div>`}item(e,t){let s=e.edit;return o`<li data-id=${t.id}>
      <div class="row">
        <strong class="grow">${e.label(t)}</strong>
        ${this.actions(e,t)}
      </div>
      ${e.lines(t).filter(r=>r!=="").map(r=>o`<div class="muted pre">${r}</div>`)}
      ${this.historyPanel(e.collection,t.id)}
      ${s===void 0?d:this.formDialog({key:`edit:${t.id}`,className:"edit",heading:`Edit the ${e.noun}`,fields:s.fields,values:t,save:r=>this.save(s,s.update,r,t.id)})}
    </li>`}addButton(e){return e.edit===void 0?d:h({icon:V,label:`Add a ${e.noun}`,className:"add",disabled:this.busy,onClick:()=>{this.openDialog("add")}})}addDialog(e){let t=e.edit;return t===void 0?d:this.formDialog({key:"add",className:"add",heading:`Add a ${e.noun}`,fields:t.fields,submitLabel:"Add",submitIcon:V,save:s=>this.save(t,t.add,s)})}render(){let e=this.config;return o`
      <section>
        <div class="head">
          <h2 class="grow">${e.title}</h2>
          ${e.canShowRemoved?o`<label class="muted"
                  ><input
                    type="checkbox"
                    class="show-removed"
                    .checked=${this.showRemoved}
                    @change=${t=>this.showRemoved=t.target.checked}
                  />
                  Show removed</label
                >`:d}
          ${this.addButton(e)}
        </div>
        ${this.renderError()} ${this.map()}
        <ul>
          ${C(this.items,t=>t.id,t=>this.item(e,t))}
        </ul>
        ${this.addDialog(e)}
      </section>
    `}};customElements.define("tk-records",rs);var an=["proposal","photo","review","status"],ln=/^[0-9A-Za-z_-]{1,64}$/;function dn(i){let e=new URLSearchParams(i);for(let t of an){let s=e.get(t);if(s===null)continue;return(t==="status"?s==="now":ln.test(s))?{kind:t,id:s}:void 0}}var ns="photos",cn=[["overview","Overview"],["chat","Chat"],["plan","Plan"],["log","Log"],["contents","Contents"],["products","Products"],["decisions","Decisions"],["notes","Notes"],["conversations","Conversations"],["claude","Claude"]],os=class extends k{constructor(){super();this.chat=document.createElement("tk-chat");this.connection=void 0;this.hass=void 0,this.panel=void 0,this.narrow=!1,this.route=void 0,this.addEventListener(bt,t=>{this.openChat(t.detail)}),this.addEventListener($t,t=>{this.openGallery(t.detail)}),this.tab="overview",this.api=void 0}static{this.properties={hass:{attribute:!1},panel:{attribute:!1},narrow:{type:Boolean},route:{attribute:!1},tab:{state:!0},api:{state:!0}}}static{this.styles=b`
    :host {
      display: block;
      min-height: 100%;
      background: var(--primary-background-color);
      color: var(--primary-text-color);
      font-family: var(--ha-font-family-body, inherit);
    }
    header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px;
      height: var(--header-height, 56px);
      background: var(--app-header-background-color, var(--primary-color));
      color: var(--app-header-text-color, var(--text-primary-color, #fff));
    }
    h1 {
      flex: 1;
      font-size: 1.25em;
      font-weight: 400;
      margin: 0;
    }
    nav {
      display: flex;
      overflow-x: auto;
      border-bottom: 1px solid var(--divider-color);
      background: var(--card-background-color, #fff);
    }
    button.tab {
      font: inherit;
      flex: 0 0 auto;
      padding: 12px 14px;
      border: none;
      border-bottom: 2px solid transparent;
      background: none;
      color: var(--secondary-text-color);
      cursor: pointer;
    }
    button.tab[aria-selected="true"] {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
    }
    main {
      max-width: 960px;
      margin: 0 auto;
      padding: 12px 16px;
      box-sizing: border-box;
    }
  `}connectedCallback(){super.connectedCallback(),this.followAddress()}followAddress(){let t=dn(window.location.search);window.location.search!==""&&history.replaceState(history.state,"",window.location.pathname),t!==void 0&&this.openChat(t)}async openGallery(t){this.tab=t?ns:"overview",await this.updateComplete,t&&this.scrollIntoView({block:"start"})}openChat(t){this.chat.start={...t},this.tab="chat"}willUpdate(t){t.has("route")&&this.followAddress(),this.updateApi(t),this.chat.api=this.api}updateApi(t){let s=this.hass;if(s===void 0||!(t.has("hass")||t.has("panel")))return;let r=this.panel?.config?.entry_id;this.connection===s.connection&&this.api?.entryId===r||(this.connection=s.connection,this.api=new De(s.connection,s.config?.time_zone,r))}view(){switch(this.tab){case"chat":return o`${this.chat}`;case"plan":return o`<tk-plan .api=${this.api}></tk-plan>`;case"log":return o`<tk-log .api=${this.api}></tk-log>`;case"decisions":return o`<tk-decisions .api=${this.api}></tk-decisions>`;case"claude":return o`<tk-claude .api=${this.api}></tk-claude>`;case ns:return o`<tk-gallery .api=${this.api}></tk-gallery>`;case"conversations":return o`<tk-conversations .api=${this.api}></tk-conversations>`;case"contents":case"products":case"notes":return o`${Rs(this.tab,o`<tk-records .api=${this.api} .kind=${this.tab}></tk-records>`)}`;default:return o`<tk-overview .api=${this.api}></tk-overview>`}}selected(){return this.tab===ns?"overview":this.tab}render(){return o`
      <header>
        ${this.narrow?o`<ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>`:d}
        <h1>TankKeeper</h1>
        ${qs(this.api)}
      </header>
      <nav role="tablist">
        ${cn.map(([t,s])=>o`<button
              class="tab"
              role="tab"
              data-tab=${t}
              aria-selected=${this.selected()===t?"true":"false"}
              @click=${()=>this.tab=t}
            >
              ${s}
            </button>`)}
      </nav>
      <main>${this.view()}</main>
    `}};customElements.define("tankkeeper-panel",os);export{os as TankkeeperPanel,dn as discussed};
