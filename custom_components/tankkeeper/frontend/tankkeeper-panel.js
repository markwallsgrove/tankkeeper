var de=globalThis,ce=de.ShadowRoot&&(de.ShadyCSS===void 0||de.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Se=Symbol(),ht=new WeakMap,X=class{constructor(e,t,r){if(this._$cssResult$=!0,r!==Se)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(ce&&e===void 0){let r=t!==void 0&&t.length===1;r&&(e=ht.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),r&&ht.set(t,e))}return e}toString(){return this.cssText}},mt=s=>new X(typeof s=="string"?s:s+"",void 0,Se),w=(s,...e)=>{let t=s.length===1?s[0]:e.reduce((r,i,n)=>r+(l=>{if(l._$cssResult$===!0)return l.cssText;if(typeof l=="number")return l;throw Error("Value passed to 'css' function must be a 'css' function result: "+l+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+s[n+1],s[0]);return new X(t,s,Se)},ft=(s,e)=>{if(ce)s.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let r=document.createElement("style"),i=de.litNonce;i!==void 0&&r.setAttribute("nonce",i),r.textContent=t.cssText,s.appendChild(r)}},Re=ce?s=>s:s=>s instanceof CSSStyleSheet?(e=>{let t="";for(let r of e.cssRules)t+=r.cssText;return mt(t)})(s):s;var{is:cs,defineProperty:ps,getOwnPropertyDescriptor:us,getOwnPropertyNames:hs,getOwnPropertySymbols:ms,getPrototypeOf:fs}=Object,pe=globalThis,gt=pe.trustedTypes,gs=gt?gt.emptyScript:"",vs=pe.reactiveElementPolyfillSupport,Q=(s,e)=>s,Pe={toAttribute(s,e){switch(e){case Boolean:s=s?gs:null;break;case Object:case Array:s=s==null?s:JSON.stringify(s)}return s},fromAttribute(s,e){let t=s;switch(e){case Boolean:t=s!==null;break;case Number:t=s===null?null:Number(s);break;case Object:case Array:try{t=JSON.parse(s)}catch{t=null}}return t}},yt=(s,e)=>!cs(s,e),vt={attribute:!0,type:String,converter:Pe,reflect:!1,useDefault:!1,hasChanged:yt};Symbol.metadata??=Symbol("metadata"),pe.litPropertyMetadata??=new WeakMap;var R=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=vt){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let r=Symbol(),i=this.getPropertyDescriptor(e,r,t);i!==void 0&&ps(this.prototype,e,i)}}static getPropertyDescriptor(e,t,r){let{get:i,set:n}=us(this.prototype,e)??{get(){return this[t]},set(l){this[t]=l}};return{get:i,set(l){let c=i?.call(this);n?.call(this,l),this.requestUpdate(e,c,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??vt}static _$Ei(){if(this.hasOwnProperty(Q("elementProperties")))return;let e=fs(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(Q("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(Q("properties"))){let t=this.properties,r=[...hs(t),...ms(t)];for(let i of r)this.createProperty(i,t[i])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[r,i]of t)this.elementProperties.set(r,i)}this._$Eh=new Map;for(let[t,r]of this.elementProperties){let i=this._$Eu(t,r);i!==void 0&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let r=new Set(e.flat(1/0).reverse());for(let i of r)t.unshift(Re(i))}else e!==void 0&&t.push(Re(e));return t}static _$Eu(e,t){let r=t.attribute;return r===!1?void 0:typeof r=="string"?r:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let r of t.keys())this.hasOwnProperty(r)&&(e.set(r,this[r]),delete this[r]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return ft(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,r){this._$AK(e,r)}_$ET(e,t){let r=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,r);if(i!==void 0&&r.reflect===!0){let n=(r.converter?.toAttribute!==void 0?r.converter:Pe).toAttribute(t,r.type);this._$Em=e,n==null?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(e,t){let r=this.constructor,i=r._$Eh.get(e);if(i!==void 0&&this._$Em!==i){let n=r.getPropertyOptions(i),l=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:Pe;this._$Em=i;let c=l.fromAttribute(t,n.type);this[i]=c??this._$Ej?.get(i)??c,this._$Em=null}}requestUpdate(e,t,r,i=!1,n){if(e!==void 0){let l=this.constructor;if(i===!1&&(n=this[e]),r??=l.getPropertyOptions(e),!((r.hasChanged??yt)(n,t)||r.useDefault&&r.reflect&&n===this._$Ej?.get(e)&&!this.hasAttribute(l._$Eu(e,r))))return;this.C(e,t,r)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:r,reflect:i,wrapped:n},l){r&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,l??t??this[e]),n!==!0||l!==void 0)||(this._$AL.has(e)||(this.hasUpdated||r||(t=void 0),this._$AL.set(e,t)),i===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[i,n]of this._$Ep)this[i]=n;this._$Ep=void 0}let r=this.constructor.elementProperties;if(r.size>0)for(let[i,n]of r){let{wrapped:l}=n,c=this[i];l!==!0||this._$AL.has(i)||c===void 0||this.C(i,void 0,n,c)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(r=>r.hostUpdate?.()),this.update(t)):this._$EM()}catch(r){throw e=!1,this._$EM(),r}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};R.elementStyles=[],R.shadowRootOptions={mode:"open"},R[Q("elementProperties")]=new Map,R[Q("finalized")]=new Map,vs?.({ReactiveElement:R}),(pe.reactiveElementVersions??=[]).push("2.1.2");var De=globalThis,$t=s=>s,ue=De.trustedTypes,bt=ue?ue.createPolicy("lit-html",{createHTML:s=>s}):void 0,Ne="$lit$",P=`lit$${Math.random().toFixed(9).slice(2)}$`,Ie="?"+P,ys=`<${Ie}>`,W=document,te=()=>W.createComment(""),se=s=>s===null||typeof s!="object"&&typeof s!="function",He=Array.isArray,Tt=s=>He(s)||typeof s?.[Symbol.iterator]=="function",Le=`[ 	
\f\r]`,ee=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,kt=/-->/g,_t=/>/g,j=RegExp(`>|${Le}(?:([^\\s"'>=/]+)(${Le}*=${Le}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),wt=/'/g,xt=/"/g,Ct=/^(?:script|style|textarea|title)$/i,Me=s=>(e,...t)=>({_$litType$:s,strings:e,values:t}),o=Me(1),I=Me(2),Hr=Me(3),_=Symbol.for("lit-noChange"),d=Symbol.for("lit-nothing"),At=new WeakMap,F=W.createTreeWalker(W,129);function Et(s,e){if(!He(s)||!s.hasOwnProperty("raw"))throw Error("invalid template strings array");return bt!==void 0?bt.createHTML(e):e}var St=(s,e)=>{let t=s.length-1,r=[],i,n=e===2?"<svg>":e===3?"<math>":"",l=ee;for(let c=0;c<t;c++){let a=s[c],u,g,p=-1,m=0;for(;m<a.length&&(l.lastIndex=m,g=l.exec(a),g!==null);)m=l.lastIndex,l===ee?g[1]==="!--"?l=kt:g[1]!==void 0?l=_t:g[2]!==void 0?(Ct.test(g[2])&&(i=RegExp("</"+g[2],"g")),l=j):g[3]!==void 0&&(l=j):l===j?g[0]===">"?(l=i??ee,p=-1):g[1]===void 0?p=-2:(p=l.lastIndex-g[2].length,u=g[1],l=g[3]===void 0?j:g[3]==='"'?xt:wt):l===xt||l===wt?l=j:l===kt||l===_t?l=ee:(l=j,i=void 0);let f=l===j&&s[c+1].startsWith("/>")?" ":"";n+=l===ee?a+ys:p>=0?(r.push(u),a.slice(0,p)+Ne+a.slice(p)+P+f):a+P+(p===-2?c:f)}return[Et(s,n+(s[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),r]},re=class s{constructor({strings:e,_$litType$:t},r){let i;this.parts=[];let n=0,l=0,c=e.length-1,a=this.parts,[u,g]=St(e,t);if(this.el=s.createElement(u,r),F.currentNode=this.el.content,t===2||t===3){let p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(i=F.nextNode())!==null&&a.length<c;){if(i.nodeType===1){if(i.hasAttributes())for(let p of i.getAttributeNames())if(p.endsWith(Ne)){let m=g[l++],f=i.getAttribute(p).split(P),b=/([.?@])?(.*)/.exec(m);a.push({type:1,index:n,name:b[2],strings:f,ctor:b[1]==="."?me:b[1]==="?"?fe:b[1]==="@"?ge:K}),i.removeAttribute(p)}else p.startsWith(P)&&(a.push({type:6,index:n}),i.removeAttribute(p));if(Ct.test(i.tagName)){let p=i.textContent.split(P),m=p.length-1;if(m>0){i.textContent=ue?ue.emptyScript:"";for(let f=0;f<m;f++)i.append(p[f],te()),F.nextNode(),a.push({type:2,index:++n});i.append(p[m],te())}}}else if(i.nodeType===8)if(i.data===Ie)a.push({type:2,index:n});else{let p=-1;for(;(p=i.data.indexOf(P,p+1))!==-1;)a.push({type:7,index:n}),p+=P.length-1}n++}}static createElement(e,t){let r=W.createElement("template");return r.innerHTML=e,r}};function B(s,e,t=s,r){if(e===_)return e;let i=r!==void 0?t._$Co?.[r]:t._$Cl,n=se(e)?void 0:e._$litDirective$;return i?.constructor!==n&&(i?._$AO?.(!1),n===void 0?i=void 0:(i=new n(s),i._$AT(s,t,r)),r!==void 0?(t._$Co??=[])[r]=i:t._$Cl=i),i!==void 0&&(e=B(s,i._$AS(s,e.values),i,r)),e}var he=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:r}=this._$AD,i=(e?.creationScope??W).importNode(t,!0);F.currentNode=i;let n=F.nextNode(),l=0,c=0,a=r[0];for(;a!==void 0;){if(l===a.index){let u;a.type===2?u=new z(n,n.nextSibling,this,e):a.type===1?u=new a.ctor(n,a.name,a.strings,this,e):a.type===6&&(u=new ve(n,this,e)),this._$AV.push(u),a=r[++c]}l!==a?.index&&(n=F.nextNode(),l++)}return F.currentNode=W,i}p(e){let t=0;for(let r of this._$AV)r!==void 0&&(r.strings!==void 0?(r._$AI(e,r,t),t+=r.strings.length-2):r._$AI(e[t])),t++}},z=class s{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,r,i){this.type=2,this._$AH=d,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=r,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=B(this,e,t),se(e)?e===d||e==null||e===""?(this._$AH!==d&&this._$AR(),this._$AH=d):e!==this._$AH&&e!==_&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Tt(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==d&&se(this._$AH)?this._$AA.nextSibling.data=e:this.T(W.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:r}=e,i=typeof r=="number"?this._$AC(e):(r.el===void 0&&(r.el=re.createElement(Et(r.h,r.h[0]),this.options)),r);if(this._$AH?._$AD===i)this._$AH.p(t);else{let n=new he(i,this),l=n.u(this.options);n.p(t),this.T(l),this._$AH=n}}_$AC(e){let t=At.get(e.strings);return t===void 0&&At.set(e.strings,t=new re(e)),t}k(e){He(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,r,i=0;for(let n of e)i===t.length?t.push(r=new s(this.O(te()),this.O(te()),this,this.options)):r=t[i],r._$AI(n),i++;i<t.length&&(this._$AR(r&&r._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let r=$t(e).nextSibling;$t(e).remove(),e=r}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},K=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,r,i,n){this.type=1,this._$AH=d,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=n,r.length>2||r[0]!==""||r[1]!==""?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=d}_$AI(e,t=this,r,i){let n=this.strings,l=!1;if(n===void 0)e=B(this,e,t,0),l=!se(e)||e!==this._$AH&&e!==_,l&&(this._$AH=e);else{let c=e,a,u;for(e=n[0],a=0;a<n.length-1;a++)u=B(this,c[r+a],t,a),u===_&&(u=this._$AH[a]),l||=!se(u)||u!==this._$AH[a],u===d?e=d:e!==d&&(e+=(u??"")+n[a+1]),this._$AH[a]=u}l&&!i&&this.j(e)}j(e){e===d?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},me=class extends K{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===d?void 0:e}},fe=class extends K{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==d)}},ge=class extends K{constructor(e,t,r,i,n){super(e,t,r,i,n),this.type=5}_$AI(e,t=this){if((e=B(this,e,t,0)??d)===_)return;let r=this._$AH,i=e===d&&r!==d||e.capture!==r.capture||e.once!==r.once||e.passive!==r.passive,n=e!==d&&(r===d||i);i&&this.element.removeEventListener(this.name,this,r),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},ve=class{constructor(e,t,r){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(e){B(this,e)}},Rt={M:Ne,P,A:Ie,C:1,L:St,R:he,D:Tt,V:B,I:z,H:K,N:fe,U:ge,B:me,F:ve},$s=De.litHtmlPolyfillSupport;$s?.(re,z),(De.litHtmlVersions??=[]).push("3.3.3");var Pt=(s,e,t)=>{let r=t?.renderBefore??e,i=r._$litPart$;if(i===void 0){let n=t?.renderBefore??null;r._$litPart$=i=new z(e.insertBefore(te(),n),n,void 0,t??{})}return i._$AI(s),i};var Oe=globalThis,x=class extends R{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Pt(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return _}};x._$litElement$=!0,x.finalized=!0,Oe.litElementHydrateSupport?.({LitElement:x});var bs=Oe.litElementPolyfillSupport;bs?.({LitElement:x});(Oe.litElementVersions??=[]).push("4.2.2");var L={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},q=s=>(...e)=>({_$litDirective$:s,values:e}),H=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,r){this._$Ct=e,this._$AM=t,this._$Ci=r}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};var{I:ks}=Rt,Lt=s=>s;var Nt=s=>s.strings===void 0,Dt=()=>document.createComment(""),G=(s,e,t)=>{let r=s._$AA.parentNode,i=e===void 0?s._$AB:e._$AA;if(t===void 0){let n=r.insertBefore(Dt(),i),l=r.insertBefore(Dt(),i);t=new ks(n,l,s,s.options)}else{let n=t._$AB.nextSibling,l=t._$AM,c=l!==s;if(c){let a;t._$AQ?.(s),t._$AM=s,t._$AP!==void 0&&(a=s._$AU)!==l._$AU&&t._$AP(a)}if(n!==i||c){let a=t._$AA;for(;a!==n;){let u=Lt(a).nextSibling;Lt(r).insertBefore(a,i),a=u}}}return t},M=(s,e,t=s)=>(s._$AI(e,t),s),_s={},Y=(s,e=_s)=>s._$AH=e,It=s=>s._$AH,ye=s=>{s._$AR(),s._$AA.remove()};var Ht=q(class extends H{constructor(){super(...arguments),this.key=d}render(s,e){return this.key=s,e}update(s,[e,t]){return e!==this.key&&(Y(s),this.key=e),t}});var $e=class{constructor(e,t=Intl.DateTimeFormat().resolvedOptions().timeZone,r){this.connection=e;this.timeZone=t;this.entryId=r}call(e,t={}){return this.send({type:`tankkeeper/${e}`,args:t})}accept(e){return this.send({type:"tankkeeper/accept_proposal",proposal_id:e})}reject(e){return this.send({type:"tankkeeper/reject_proposal",proposal_id:e})}acceptFinding(e){return this.send({type:"tankkeeper/accept_finding",check_id:e})}rejectFinding(e){return this.send({type:"tankkeeper/reject_finding",check_id:e})}deleteConversation(e){return this.send({type:"tankkeeper/delete_conversation",conversation_id:e})}chatAgent(){return this.send({type:"tankkeeper/chat_agent"})}converse(e,t,r){return this.send({type:"conversation/process",text:e,conversation_id:t,agent_id:r})}send(e){return this.connection.sendMessagePromise(e)}};function ie(s){return typeof s=="object"&&s!==null&&"message"in s?String(s.message):String(s)}var Mt="tk-changed",v=w`
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
  .dash {
    display: inline-block;
    width: 14px;
    border-top: 2px dashed;
    margin-right: 4px;
    vertical-align: middle;
  }
`,Ve="tk-chat";function J(s,e){s.dispatchEvent(new CustomEvent(Ve,{detail:e,bubbles:!0,composed:!0}))}var h=class extends x{constructor(){super();this.loads=0;this.api=void 0,this.error="",this.busy=!1,this.version=0,this.addEventListener(Mt,t=>{t.composedPath()[0]!==this&&this.reload()})}static{this.properties={api:{attribute:!1},error:{state:!0},busy:{state:!0},version:{state:!0}}}reloadOn(){return["api"]}willUpdate(t){this.reloadOn().some(r=>t.has(r))&&this.reload()}async reload(){let t=this.api;if(t===void 0)return;this.loads+=1;let r=this.loads;try{let i=await this.load(t);if(r!==this.loads)return;i(),this.error="",this.version+=1}catch(i){r===this.loads&&(this.error=ie(i))}}async run(t){let r=this.api;if(r===void 0)return!1;this.busy=!0;try{return await t(r),this.error="",await this.reload(),!0}catch(i){return this.error=ie(i),!1}finally{this.busy=!1}}changed(){this.dispatchEvent(new CustomEvent(Mt,{bubbles:!0,composed:!0}))}};var ws={panel:"Panel",mcp:"Claude (MCP)",assist:"Assist",notification:"Notification",rule:"Rule",review:"Review",camera:"Camera"};function Ot(s){return String(s).padStart(2,"0")}function be(s,e){let t=new Intl.DateTimeFormat("en-CA",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(s),r=i=>t.find(n=>n.type===i)?.value??"";return{day:`${r("year")}-${r("month")}-${r("day")}`,minutes:Number(r("hour"))*60+Number(r("minute"))}}function O(s,e){return be(s,e).day}function D(s,e){let[t=0,r=1,i=1]=s.split("-").map(Number);return new Date(Date.UTC(t,r-1,i+e)).toISOString().slice(0,10)}function $(s){let e=new Date(s);return`${O(e)} ${Ot(e.getHours())}:${Ot(e.getMinutes())}`}function V(s){return ws[s]??s}function Vt(s){return typeof s=="string"?s:JSON.stringify(s)}function A(s){if(s.before===null)return`Added to ${s.collection}`;if(s.after===null)return`Removed from ${s.collection}`;let{before:e,after:t}=s,i=Object.keys(t).filter(n=>JSON.stringify(e[n])!==JSON.stringify(t[n])).map(n=>`${n} ${Vt(e[n])} \u2192 ${Vt(t[n])}`);return`${s.collection}: ${i.join(", ")}`}function Ue(s,...e){let t=e.filter(r=>typeof r=="string"&&r!=="");return[s,...t].join(". ")}function Ut(s){if(s.kind==="dose")return Ue(`Dose: ${s.product??""} ${String(s.amount_ml??0)} ml`,s.why,s.notes);if(s.kind==="test"){let t=Object.entries(s.values??{}).map(([i,n])=>`${i} ${String(n)}`).join(", "),r=s.source==="tap"?"Tap":"Tank";return Ue(`${r} test: ${t}`,s.notes)}let e=[...s.tasks??[]];return typeof s.water_change_percent=="number"&&e.push(`${String(s.water_change_percent)}% water change`),typeof s.water_litres=="number"&&e.push(`${String(s.water_litres)} l water`),Ue(e.join(". "),s.why,s.notes)}var je=class extends h{constructor(){super();this.details=null;this.toggled=()=>{this.details?.open===!0&&this.reload()};this.collection="",this.recordId=void 0,this.stamp=0,this.entries=void 0}static{this.properties={...h.properties,collection:{attribute:!1},recordId:{attribute:!1},stamp:{attribute:!1},entries:{state:!0}}}static{this.styles=v}connectedCallback(){super.connectedCallback(),this.details=this.closest("details"),this.details?.addEventListener("toggle",this.toggled)}disconnectedCallback(){super.disconnectedCallback(),this.details?.removeEventListener("toggle",this.toggled),this.details=null}async reload(){this.details!==null&&!this.details.open||await super.reload()}reloadOn(){return["api","collection","recordId","stamp"]}async load(t){let r={collection:this.collection,limit:10};this.recordId!==void 0&&(r.record_id=this.recordId);let{history:i}=await t.call("get_history",r);return()=>{this.entries=i}}async undo(t){await this.run(r=>r.call("undo_change",{history_id:t.id}))&&this.changed()}render(){return this.entries===void 0?d:o`
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      ${this.entries.length===0?o`<p class="muted">No changes yet</p>`:d}
      <ul>
        ${this.entries.map(t=>o`<li class="row">
              <div class="grow">
                <div>${t.summary}</div>
                <div class="muted">${$(t.time)} · ${V(t.source)}</div>
                ${t.changes.map(r=>o`<div class="muted">${A(r)}</div>`)}
              </div>
              <button class="undo" ?disabled=${this.busy} @click=${()=>this.undo(t)}>
                Undo
              </button>
            </li>`)}
      </ul>
    `}};customElements.define("tk-history",je);var xs="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z",jt="/config/integrations/integration/tankkeeper";function As(s){return s===void 0?jt:`${jt}#config_entry=${encodeURIComponent(s)}`}function Ts(s){history.pushState(null,"",As(s)),window.dispatchEvent(new CustomEvent("location-changed",{detail:{replace:!1}}))}function Ft(s){return o`<ha-icon-button
    class="settings"
    .path=${xs}
    label="TankKeeper settings"
    @click=${()=>{Ts(s?.entryId)}}
  ></ha-icon-button>`}function Cs(s,e){return s.type==="checkbox"&&typeof e=="boolean"?e?"Yes":"No":Array.isArray(e)?e.length===0?"Not set":e.map(String).join(", "):e==null||e===""?"Not set":typeof e=="string"||typeof e=="number"?String(e):JSON.stringify(e)}function U(s,e){let t=new Map(Object.entries(e));return o`<dl class="facts">
    ${s.map(r=>o`<dt>${r.label}</dt>
          <dd class="pre">${Cs(r,t.get(r.name))}</dd>`)}
  </dl>`}function T(s,e,t,r){return o`<details>
    <summary>History</summary>
    <tk-history
      .api=${s}
      .collection=${e}
      .recordId=${t}
      .stamp=${r}
    ></tk-history>
  </details>`}var Wt=q(class extends H{constructor(s){if(super(s),s.type!==L.PROPERTY&&s.type!==L.ATTRIBUTE&&s.type!==L.BOOLEAN_ATTRIBUTE)throw Error("The `live` directive is not allowed on child or event bindings");if(!Nt(s))throw Error("`live` bindings can only contain a single expression")}render(s){return s}update(s,[e]){if(e===_||e===d)return e;let t=s.element,r=s.name;if(s.type===L.PROPERTY){if(e===t[r])return _}else if(s.type===L.BOOLEAN_ATTRIBUTE){if(!!e===t.hasAttribute(r))return _}else if(s.type===L.ATTRIBUTE&&t.getAttribute(r)===e+"")return _;return Y(s),e}});var Es=["ammonia","nitrite","nitrate","phosphate","ph","kh","gh","temperature_c","cycle","light"];var Ss="tankkeeper:photo/",Rs=/^tankkeeper:photo\/[0-9A-HJKMNP-TV-Z]{26}$/,Ps=/^tankkeeper:chart\/([a-z_]+)(?:\?days=(\d+))?$/;function Ls(s){return Es.includes(s)}function ne(s){if(Rs.test(s))return{kind:"photo",id:s.slice(Ss.length)};let e=Ps.exec(s),t=e?.[1]??"";if(e===null||!Ls(t))return;let r=t==="light"?30:365,i=e[2]===void 0?30:Number(e[2]);return{kind:"chart",chart:t,days:Math.min(r,Math.max(1,i))}}var Bt=1440,N=320,oe=160,C=24,Be={ammonia:"var(--warning-color, #f4b400)",nitrite:"var(--error-color, #db4437)",nitrate:"var(--info-color, #4285f4)",ph:"var(--primary-color, #03a9f4)",kh:"var(--success-color, #43a047)",gh:"var(--accent-color, #ff9800)",phosphate:"var(--state-icon-color, #44739e)",temperature_c:"var(--error-color, #db4437)"},Ds=Be.ammonia,Ns=Be.nitrite,Kt="var(--secondary-text-color, #727272)",Ke={ammonia:"Ammonia (ppm)",nitrite:"Nitrite (ppm)",nitrate:"Nitrate (mg/l)",ph:"pH",kh:"KH (dKH)",gh:"GH (dGH)",phosphate:"Phosphate (mg/l)",temperature_c:"Temperature (\xB0C)"},Is=["ammonia","nitrite","nitrate","ph","kh","gh","phosphate","temperature_c"];function ke(s,e,t,r){let i=s.filter(n=>n.kind==="test"&&(n.source==="tap"?"tap":"tank")===r&&typeof n.values?.[e]=="number").map(n=>({time:Date.parse(n.time),value:n.values?.[e]??0})).sort((n,l)=>n.time-l.time);return{name:t,colour:Be[e],joined:r==="tank",points:i}}function zt(s,e){let t=[...s.flatMap(r=>r.points.map(i=>i.value)),...e.map(r=>r.value)];return{series:s,lines:e,min:Math.min(0,...t),max:Math.max(...t,0)}}function Fe(s){return s.flatMap(([e,t,r])=>typeof t=="number"?[{label:e,value:t,colour:r}]:[])}function We(s,e,t){return Fe([["Watch",s[e],Ds],["Act",s[t],Ns]])}function _e(s,e){let t=[["ammonia","Ammonia"],["nitrite","Nitrite"],["nitrate","Nitrate"]];return zt([...t.map(([r,i])=>ke(s,r,i,"tank")),...t.map(([r,i])=>ke(s,r,`Tap ${i.toLowerCase()}`,"tap"))],We(e,"nitrogen_watch","nitrogen_act"))}function Hs(s,e,t,r){let i=n=>Fe([["Tap water",r?.[n],Kt]]);switch(s){case"ammonia":case"nitrite":return We(e,"nitrogen_watch","nitrogen_act");case"ph":return[...We(e,"ph_watch","ph_act"),...i("ph")];case"temperature_c":return Fe([["Target",t,Kt]]);default:return i(s)}}function ze(s,e,t,r,i){let n=[ke(s,e,"Tank","tank"),ke(s,e,"Tap","tap")];return{key:e,label:Ke[e],chart:zt(n,Hs(e,t,r,i))}}function qt(s,e,t,r){let i=[],n=[];for(let l of Is){let c=ze(s,l,e,t,r);c.chart.series.every(a=>a.points.length===0)?n.push(c.label):i.push(c)}return{charts:i,empty:n}}function ae(s,e){let t=s.series.flatMap(a=>a.points.map(u=>u.time));if(t.length===0)return o`<p class="empty">No readings yet</p>`;let r=Math.min(...t),i=Math.max(...t)-r,n=s.max-s.min||1,l=a=>i===0?N/2:C+(a-r)/i*(N-2*C),c=a=>oe-C-(a-s.min)/n*(oe-2*C);return o`
    <svg viewBox="0 0 ${N} ${oe}" role="img" aria-label=${e} class="chart">
      <line class="axis" x1=${C} y1=${oe-C} x2=${N-C} y2=${oe-C}></line>
      <text class="tick" x="2" y=${c(s.max)+4}>${s.max}</text>
      <text class="tick" x="2" y=${c(s.min)+4}>${s.min}</text>
      ${s.lines.map(a=>I`<line class="target" x1=${C} x2=${N-C} y1=${c(a.value)} y2=${c(a.value)}
            stroke=${a.colour}><title>${a.label} ${a.value}</title></line>`)}
      ${s.series.filter(a=>a.points.length>0).map(a=>I`
          ${a.joined?I`<polyline fill="none" stroke=${a.colour}
                  points=${a.points.map(u=>`${String(l(u.time))},${String(c(u.value))}`).join(" ")}>
                </polyline>`:d}
          ${a.points.map(u=>I`<circle class=${a.joined?"solid":"hollow"} cx=${l(u.time)} cy=${c(u.value)} r="3"
                stroke=${a.colour} fill=${a.joined?a.colour:"none"}>
                <title>${a.name} ${u.value}</title></circle>`)}`)}
    </svg>
    <ul class="legend">
      ${s.series.filter(a=>a.points.length>0).map(a=>o`<li>
              ${a.joined?o`<span class="swatch" style="background:${a.colour}"></span>`:o`<span class="swatch hollow" style="border-color:${a.colour}"></span>`}${a.name}
            </li>`)}
      ${s.lines.map(a=>o`<li><span class="dash" style="border-color:${a.colour}"></span>${a.label}</li>`)}
    </ul>
  `}function we(s,e,t,r){let i=[];for(let n=t-1;n>=0;n--)i.push({day:D(e,-n),segments:[]});for(let[n,l]of s){let c=be(new Date(n),r),a=be(new Date(l),r);for(let u of i){let g=c.day===u.day?c.minutes/Bt:c.day<u.day?0:null,p=a.day===u.day?a.minutes/Bt:a.day>u.day?1:null;g!==null&&p!==null&&p>g&&u.segments.push({start:g,end:p})}}return i}function xe(s){let t=s.length*6;return I`
    <svg viewBox="0 0 ${N} ${t}" role="img" class="chart light"
      aria-label=${`Light on and off, last ${String(s.length)} days`}>
      ${s.map((r,i)=>I`
          <rect class="off" x="0" y=${i*6} width=${N} height=${5}></rect>
          ${r.segments.map(n=>I`<rect class="on" x=${n.start*N} y=${i*6}
                width=${(n.end-n.start)*N} height=${5}>
                <title>${r.day}</title></rect>`)}`)}
    </svg>`}var Gt=500,Ms="The photo is no longer kept.";function Os(s,e){let t=s.photo_url;return t!==null&&s.id===e&&t.startsWith(`/api/tankkeeper/photos/${e}?`)?t:void 0}var Yt=new WeakMap;function le(s,e,t){let r=Yt.get(s);r===void 0&&(r=new Map,Yt.set(s,r));let i=JSON.stringify([e,t]),n=r.get(i);if(n!==void 0)return n;let l=r,c=s.call(e,t).finally(()=>l.delete(i));return l.set(i,c),c}async function Vs(s,e){let t=[],r=new Set,i;for(;;){let n={kind:"test",since:e,...i===void 0?{}:{until:i},limit:Gt},l=(await le(s,"get_log",n)).entries,c=l.filter(a=>!r.has(a.id));for(let a of c)r.add(a.id),t.push(a),i=a.time;if(l.length<Gt||c.length===0)return t}}function Us(s){return Object(s).code==="not_found"}var Jt={...Ke,cycle:"Cycle",light:"Light"},qe=class extends h{static{this.properties={...h.properties,address:{type:String},alt:{type:String},shown:{state:!0},large:{state:!0}}}static{this.styles=[v,w`
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
    `]}constructor(){super(),this.address="",this.alt="",this.shown=void 0,this.large=!1}reloadOn(){return["api","address"]}async load(e){let t=ne(this.address),r=t===void 0?void 0:await this.fetch(e,t);return()=>{this.shown=r}}async fetch(e,t){if(t.kind==="photo"){let p=await le(e,"get_photo_check",{check_id:t.id}).catch(m=>{if(!Us(m))throw m});return{kind:"photo",url:p===void 0?void 0:Os(p,t.id)}}let{chart:r,days:i}=t;if(r==="light"){let p=await le(e,"get_light",{days:i});return{kind:"light",lights:p.lights.map(f=>({model:f.model,rows:we(f.on_periods,p.today,i,e.timeZone)}))}}let n=D(O(new Date,e.timeZone),-i),[l,c]=await Promise.all([Vs(e,n),le(e,"get_status")]),a=Jt[r];if(r==="cycle")return{kind:"chart",chart:_e(l,c.settings),label:a};let u=await le(e,"get_tank");return{kind:"chart",chart:ze(l,r,c.settings,u.tank.temperature_c,u.water).chart,label:a}}caption(e){return this.alt!==""?this.alt:e.kind==="photo"?"The tank":`${Jt[e.chart]}, last ${String(e.days)} days`}open(){this.large=!0,this.updateComplete.then(()=>this.renderRoot.querySelector(".large")?.focus())}close(){this.large=!1,this.updateComplete.then(()=>this.renderRoot.querySelector("button.photo")?.focus())}keydown(e){e.key==="Tab"&&e.preventDefault(),e.key==="Escape"&&this.close()}renderPhoto(e,t){return e===void 0?o`<p class="muted">${Ms}</p>`:o`<button
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
              @keydown=${r=>{this.keydown(r)}}
            >
              <img src=${e} alt=${t} />
            </div>`:d}`}renderShown(e,t){return e.kind==="photo"?this.renderPhoto(e.url,t):e.kind==="chart"?ae(e.chart,e.label):e.lights.length===0?o`<p class="muted">No lights yet</p>`:o`${e.lights.map(r=>o`<div class="muted">${r.model}</div>
          ${xe(r.rows)}`)}`}render(){let e=ne(this.address);if(e===void 0)return o`![${this.alt}](${this.address})`;let t=this.caption(e),r=this.shown;return o`<figure>
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      ${r===void 0?d:this.renderShown(r,t)}
      <figcaption>${t}</figcaption>
    </figure>`}};customElements.define("tk-embed",qe);function Ae(s,e){return o`${Ws(s.split(`
`),{api:e,left:5})}`}var Ge=/^\s*```/,Xt=/^(#{1,6})\s+(.*)$/,Ye=/^\s*[-*]\s+(.*)$/,Je=/^\s*\d+[.)]\s+(.*)$/,Fs=/`([^`]+)`|!\[([^\]]*)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|(?<![\w*])\*([^*\s](?:[^*]*[^*\s])?)\*(?![\w*])|(?<!\w)_([^_\s](?:[^_]*[^_\s])?)_(?!\w)/g;function Ws(s,e){let t=[],r=0,i=n=>{let l=[];for(let c=n.exec(s[r]??"");c!==null;)l.push(c[1]??""),r+=1,c=n.exec(s[r]??"");return l};for(;r<s.length;){let n=s[r]??"",l=Xt.exec(n);if(Ge.test(n)){let c=s.findIndex((u,g)=>g>r&&Ge.test(u)),a=c===-1?s.length:c;t.push(o`<pre><code>${s.slice(r+1,a).join(`
`)}</code></pre>`),r=a+1}else if(l!==null){let c=Z(l[2]??"",e);t.push((l[1]??"").length<=2?o`<h3>${c}</h3>`:o`<h4>${c}</h4>`),r+=1}else if(Ye.test(n)){let c=i(Ye).map(a=>Zt(a,e));t.push(o`<ul>
          ${c}
        </ul>`)}else if(Je.test(n)){let c=i(Je).map(a=>Zt(a,e));t.push(o`<ol>
          ${c}
        </ol>`)}else if(n.trim()==="")r+=1;else{let c=[];for(;r<s.length&&Bs(s[r]??"");)c.push(s[r]??""),r+=1;let a=c.map((u,g)=>o`${g>0?o`<br />`:d}${Z(u,e)}`);t.push(o`<p>${a}</p>`)}}return t}function Zt(s,e){return o`<li>${Z(s,e)}</li>`}function Bs(s){return s.trim()!==""&&!Ge.test(s)&&!Xt.test(s)&&!Ye.test(s)&&!Je.test(s)}function Z(s,e){let t=[],r=0;for(let i of s.matchAll(Fs)){i.index>r&&t.push(s.slice(r,i.index));let[n,l,c,,a,u,g,p,m]=i;l!==void 0?t.push(o`<code>${l}</code>`):c!==void 0?t.push(Ks(c,n,e)):a!==void 0?t.push(o`<strong>${Z(a,e)}</strong>`):u!==void 0?t.push(Qt(u,g??"",n,e)):t.push(o`<em>${Z(p??m??"",e)}</em>`),r=i.index+n.length}return r<s.length&&t.push(s.slice(r)),t}function Qt(s,e,t,r){return/^https?:\/\//i.test(e)?o`<a href=${e} target="_blank" rel="noopener noreferrer"
    >${Z(s,r)}</a
  >`:t}function Ks(s,e,t){let r=e.slice(s.length+4,-1),{api:i}=t;return i===void 0||t.left===0||ne(r)===void 0?s===""?e:o`!${Qt(s,r,e.slice(1),t)}`:(t.left-=1,o`<tk-embed .api=${i} .address=${r} .alt=${s}></tk-embed>`)}var zs="TankKeeper's Assist agent is missing. Reload TankKeeper in Settings, Devices & services.",qs="Choose the conversation agent in TankKeeper's Claude settings first: Settings, Devices & services, TankKeeper, Configure.",Te=200,es=200,Gs=new Set(["user","assistant","error"]);function ts(){return`panel_${[...crypto.getRandomValues(new Uint8Array(16))].map(e=>e.toString(16).padStart(2,"0")).join("")}`}function Ze(s){return s.length<=es?s:`${s.slice(0,es-1)}\u2026`}async function Ys(s,e){let{kind:t,id:r}=e;if(t==="proposal"){let i=await s.call("list_proposals",{state:"all",limit:Te}).then(n=>n.proposals.find(l=>l.proposal_id===r)).catch(()=>{});return i===void 0?`Let's discuss the waiting change ${r}.`:`Let's discuss the waiting change "${Ze(i.summary)}" (proposal ${r}).`}if(t==="photo"){let i=await s.call("list_photos",{limit:Te}).then(n=>n.photos.find(l=>l.id===r)?.summary).catch(()=>{});return i==null?`Let's discuss photo check ${r}.`:`Let's discuss what the camera saw: "${Ze(i)}" (photo check ${r}).`}if(t==="review"){let i=await s.call("get_reviews",{limit:Te}).then(n=>n.reviews.find(l=>l.id===r)).catch(()=>{});return i===void 0?`Let's discuss review ${r}.`:`Let's discuss the review "${Ze(i.result)}" (review ${r}).`}return"Let's discuss the tank's status now."}var Xe=class extends h{constructor(){super();this.conversationId=ts();this.recorded=!1;this.resuming=!1;this.begun=0;this.start=void 0,this.agent=void 0,this.messages=[],this.draft="",this.sending=!1,this.changes=[],this.proposals=[]}static{this.properties={...h.properties,start:{attribute:!1},agent:{state:!0},messages:{state:!0},draft:{state:!0},sending:{state:!0},changes:{state:!0},proposals:{state:!0}}}static{this.styles=[v,w`
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
    `]}reloadOn(){return["api","start"]}willUpdate(t){t.has("start")&&this.begin(this.start),super.willUpdate(t)}begin(t){this.begun+=1;let r=t?.kind==="resume";this.conversationId=r?t.id:ts(),this.recorded=r,this.resuming=r,this.messages=[],this.draft="",this.sending=!1,this.changes=[],this.proposals=[],this.error="";let i=this.api;if(t===void 0||r||i===void 0)return;let n=this.begun;Ys(i,t).then(l=>{n===this.begun&&this.draft===""&&(this.draft=l)})}async load(t){let r=this.conversationId,[i,n,l]=await Promise.all([t.chatAgent(),t.call("list_proposals",{state:"pending",limit:Te}),this.recorded?t.call("get_conversation",{id:r}):void 0]);return()=>{this.agent=i,this.proposals=n.proposals.filter(c=>c.conversation_id===r),this.changes=l?.changes??[],this.resuming&&l!==void 0&&(this.resuming=!1,this.messages=l.messages.filter(c=>Gs.has(c.role)))}}ready(){let t=this.agent;return t?.ready===!0&&t.agent_id!==null?t.agent_id:void 0}missing(){return this.agent?.ready===!0?zs:qs}async send(){let t=this.api,r=this.ready(),i=this.draft.trim();if(t===void 0||r===void 0||i===""||this.sending)return;let n=this.begun;this.messages=[...this.messages,{role:"user",text:i}],this.draft="",this.sending=!0;let l;try{let c=await t.converse(i,this.conversationId,r);if(n!==this.begun)return;this.conversationId=c.conversation_id??this.conversationId,this.recorded=!0;let a=c.response.speech?.plain?.speech??"";l={role:c.response.response_type==="error"?"error":"assistant",text:a}}catch(c){if(n!==this.begun)return;l={role:"error",text:ie(c)}}this.messages=[...this.messages,l],this.sending=!1,await this.reload()}newChat(){this.begin(void 0),this.reload()}async act(t){await this.run(t)&&this.changed()}keydown(t){t.key!=="Enter"||t.shiftKey||t.isComposing||(t.preventDefault(),this.send())}renderMessage(t){return o`<div class="message ${t.role}">
      ${t.role==="assistant"?Ae(t.text,this.api):o`<div class="pre">${t.text}</div>`}
    </div>`}renderLinked(){return o`${this.changes.length===0?d:o`<h3>Changes made in this chat</h3>
            <ul class="changes">
              ${this.changes.map(t=>o`<li>
                    <div class="row">
                      <span class="grow">${t.summary}</span>
                      <button
                        class="undo"
                        ?disabled=${this.busy}
                        @click=${()=>this.act(r=>r.call("undo_change",{history_id:t.id}))}
                      >
                        Undo
                      </button>
                    </div>
                    <div class="muted">${$(t.time)}</div>
                    ${t.changes.map(r=>o`<div class="muted">${A(r)}</div>`)}
                  </li>`)}
            </ul>`}
    ${this.proposals.length===0?d:o`<h3>Waiting for you</h3>
            <ul class="waiting">
              ${this.proposals.map(t=>o`<li data-id=${t.proposal_id}>
                    <strong class="pre">${t.summary}</strong>
                    <div class="pre">${t.reason}</div>
                    ${t.changes.map(r=>o`<div class="muted">${A(r)}</div>`)}
                    <div class="row">
                      <button
                        class="reject"
                        ?disabled=${this.busy}
                        @click=${()=>this.act(r=>r.reject(t.proposal_id))}
                      >
                        Reject
                      </button>
                      <button
                        class="accept primary"
                        ?disabled=${this.busy}
                        @click=${()=>this.act(r=>r.accept(t.proposal_id))}
                      >
                        Accept
                      </button>
                    </div>
                  </li>`)}
            </ul>`}`}renderChat(){return o`<div class="messages">
        ${this.messages.map(t=>this.renderMessage(t))}
        ${this.sending?o`<div class="muted">Thinking…</div>`:d}
      </div>
      <form
        class="send"
        @submit=${t=>{t.preventDefault(),this.send()}}
      >
        <textarea
          aria-label="Message"
          placeholder="Ask about the tank"
          .value=${Wt(this.draft)}
          ?disabled=${this.sending}
          @input=${t=>{this.draft=t.target.value}}
          @keydown=${t=>{this.keydown(t)}}
        ></textarea>
        <div class="row">
          <span class="grow muted">Enter sends, Shift+Enter adds a line.</span>
          <button class="primary" type="submit" ?disabled=${this.sending}>Send</button>
        </div>
      </form>
      ${this.renderLinked()}`}render(){let t=this.ready()!==void 0;return o`<section>
      <div class="row">
        <h2 class="grow">Chat</h2>
        ${t?o`<button
                class="new"
                ?disabled=${this.sending}
                @click=${()=>{this.newChat()}}
              >
                New chat
              </button>`:d}
      </div>
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      ${this.agent!==void 0&&!t?o`<p class="muted">${this.missing()}</p>`:d}
      ${t?this.renderChat():d}
    </section>`}};customElements.define("tk-chat",Xe);var Js=[{name:"agent",label:"Conversation agent TankKeeper chats through",type:"text"},{name:"ai_task",label:"AI task entity for review comments",type:"text"},{name:"review_on",label:"Review after",type:"list"},{name:"comments",label:"Claude comments on reviews",type:"checkbox"},{name:"daily_time",label:"Daily review at",type:"time"},{name:"daily_cap",label:"Claude comments a day, at most",type:"number"}],Zs=20,Xs={test:"Test",task:"Task",status:"Status change",daily:"Daily"};function Qs(s){let e=s.triggers.map(r=>Xs[r]??r).join(", "),t=s.proposal_ids.length;return o`<li class="review">
    <div class="muted">${$(s.time)} · ${e}</div>
    <div>${s.result}</div>
    ${s.comment===null?d:o`<div class="comment">Claude: ${s.comment}</div>`}
    ${s.note===null?d:o`<div class="muted">${s.note}</div>`}
    ${t===0?d:o`<div class="muted">
            ${t} plan ${t===1?"change":"changes"} proposed
          </div>`}
  </li>`}var Qe=class extends h{static{this.properties={...h.properties,settings:{state:!0},reviews:{state:!0}}}static{this.styles=v}constructor(){super(),this.settings=void 0,this.reviews=[]}async load(e){let[t,r]=await Promise.all([e.call("get_claude"),e.call("get_reviews",{limit:Zs})]);return()=>{this.settings=t,this.reviews=r.reviews}}render(){let e=this.settings;return o`<section>
      <h2>Claude</h2>
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      ${e===void 0?d:o`<p class="muted note">${e.model_note}</p>
              ${U(Js,e)}
              ${T(this.api,"settings","claude",this.version)}`}
      <h3>Reviews</h3>
      ${this.reviews.length===0?o`<p class="muted">No reviews yet.</p>`:o`<ul class="reviews">
              ${this.reviews.map(Qs)}
            </ul>`}
    </section>`}};customElements.define("tk-claude",Qe);var ss=(s,e,t)=>{let r=new Map;for(let i=e;i<=t;i++)r.set(s[i],i);return r},k=q(class extends H{constructor(s){if(super(s),s.type!==L.CHILD)throw Error("repeat() can only be used in text expressions")}dt(s,e,t){let r;t===void 0?t=e:e!==void 0&&(r=e);let i=[],n=[],l=0;for(let c of s)i[l]=r?r(c,l):l,n[l]=t(c,l),l++;return{values:n,keys:i}}render(s,e,t){return this.dt(s,e,t).values}update(s,[e,t,r]){let i=It(s),{values:n,keys:l}=this.dt(e,t,r);if(!Array.isArray(i))return this.ut=l,n;let c=this.ut??=[],a=[],u,g,p=0,m=i.length-1,f=0,b=n.length-1;for(;p<=m&&f<=b;)if(i[p]===null)p++;else if(i[m]===null)m--;else if(c[p]===l[f])a[f]=M(i[p],n[f]),p++,f++;else if(c[m]===l[b])a[b]=M(i[m],n[b]),m--,b--;else if(c[p]===l[b])a[b]=M(i[p],n[b]),G(s,a[b+1],i[p]),p++,b--;else if(c[m]===l[f])a[f]=M(i[m],n[f]),G(s,i[p],i[m]),m--,f++;else if(u===void 0&&(u=ss(l,f,b),g=ss(c,p,m)),u.has(c[p]))if(u.has(c[m])){let S=g.get(l[f]),Ee=S!==void 0?i[S]:null;if(Ee===null){let ut=G(s,i[p]);M(ut,n[f]),a[f]=ut}else a[f]=M(Ee,n[f]),G(s,i[p],Ee),i[S]=null;f++}else ye(i[m]),m--;else ye(i[p]),p++;for(;f<=b;){let S=G(s,a[b+1]);M(S,n[f]),a[f++]=S}for(;p<=m;){let S=i[p++];S!==null&&ye(S)}return this.ut=l,Y(s,a),_}});var rs=50,er="panel_",et=class extends h{static{this.properties={...h.properties,conversations:{state:!0},query:{state:!0},selected:{state:!0},detail:{state:!0}}}static{this.styles=v}constructor(){super(),this.conversations=[],this.query="",this.selected=void 0,this.detail=void 0}reloadOn(){return["api","query","selected"]}async load(e){let t=this.selected;if(t!==void 0){let i=await e.call("get_conversation",{id:t});return()=>{this.detail=i}}let r=this.query===""?await e.call("list_conversations",{limit:rs}):await e.call("search_conversations",{query:this.query,limit:rs});return()=>{this.detail=void 0,this.conversations=r.conversations}}search(e){e.preventDefault();let t=e.target.querySelector("input");this.query=(t?.value??"").trim()}async undo(e){await this.run(t=>t.call("undo_change",{history_id:e.id}))&&this.changed()}async deleteConversation(e){window.confirm("Delete this conversation? The changes made in it stay in the history.")&&await this.run(async t=>{await t.deleteConversation(e),this.selected=void 0})}renderDetail(e){return o`<section>
      <div class="row">
        <button class="back" @click=${()=>this.selected=void 0}>Back</button>
        <h2 class="grow">${e.title}</h2>
        ${e.id.startsWith(er)?o`<button
                class="resume"
                @click=${()=>{J(this,{kind:"resume",id:e.id})}}
              >
                Continue in Chat
              </button>`:d}
        <button
          class="delete"
          ?disabled=${this.busy}
          @click=${()=>this.deleteConversation(e.id)}
        >
          Delete
        </button>
      </div>
      <div class="muted">${V(e.source)} · ${$(e.started)}</div>
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      <p class="pre">${e.summary}</p>
      <h3>Messages</h3>
      <ul>
        ${e.messages.map(t=>o`<li class=${t.role}>
              <div class="role muted">${t.role}</div>
              ${t.role==="assistant"?Ae(t.text,this.api):o`<div class="pre">${t.text}</div>`}
            </li>`)}
      </ul>
      <h3>Changes</h3>
      ${e.changes.length===0?o`<p class="muted">No changes</p>`:d}
      <ul>
        ${e.changes.map(t=>o`<li>
              <div class="row">
                <span class="grow">${t.summary}</span>
                <button class="undo" ?disabled=${this.busy} @click=${()=>this.undo(t)}>
                  Undo
                </button>
              </div>
              <div class="muted">${$(t.time)} · ${V(t.source)}</div>
              ${t.changes.map(r=>o`<div class="muted">${A(r)}</div>`)}
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
        <button type="submit">Search</button>
      </form>
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      ${this.conversations.length===0?o`<p class="muted">No conversations</p>`:d}
      <ul>
        ${k(this.conversations,e=>e.id,e=>o`<li data-id=${e.id}>
              <div class="row">
                <strong class="grow">${e.title}</strong>
                <button class="open" @click=${()=>this.selected=e.id}>Open</button>
              </div>
              <div class="muted">
                ${V(e.source)} · ${$(e.updated)}
              </div>
              <div class="pre">${e.summary}</div>
            </li>`)}
      </ul>
    </section>`}};customElements.define("tk-conversations",et);var is=s=>s??d;function tr(s){return s==null?"":Array.isArray(s)?s.map(String).join(`
`):typeof s=="string"||typeof s=="number"||typeof s=="boolean"?String(s):JSON.stringify(s)}function sr(s,e){return s.type==="number"?e.trim()===""?null:Number(e):s.type==="list"?e.split(`
`).map(t=>t.trim()).filter(t=>t!==""):e}function rr(s){return s===""||s===null||s===!1||Array.isArray(s)&&s.length===0}function ir(s,e,t){let r={};for(let i of s){let n=e.elements.namedItem(i.name),l=i.type==="checkbox"?n.checked:sr(i,n.value),c=t[i.name];rr(l)&&c==null||JSON.stringify(l)!==JSON.stringify(c)&&(r[i.name]=l)}return r}var tt=class extends x{static{this.properties={fields:{attribute:!1},values:{attribute:!1},submitLabel:{attribute:!1},busy:{type:Boolean},error:{attribute:!1}}}constructor(){super(),this.fields=[],this.values={},this.submitLabel="Save",this.busy=!1,this.error=""}static{this.styles=w`
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
  `}input(e){let t=tr(this.values[e.name]);return e.type==="select"?o`<select name=${e.name} ?required=${e.required===!0} .value=${t}>
        <option value="" ?selected=${t===""}></option>
        ${(e.options??[]).map(r=>o`<option value=${r} ?selected=${r===t}>${r}</option>`)}
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
      step=${is(e.step??(e.type==="number"?"any":void 0))}
      ?required=${e.required===!0}
      .value=${t}
    />`}reset(){this.renderRoot.querySelector("form")?.reset()}submit(e){e.preventDefault();let t=ir(this.fields,e.target,this.values);this.dispatchEvent(new CustomEvent("tk-save",{detail:t,bubbles:!0,composed:!0}))}render(){return o`<form
      @submit=${e=>{this.submit(e)}}
    >
      ${this.fields.map(e=>o`<label>${e.label} ${this.input(e)}</label>`)}
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      <button type="submit" ?disabled=${this.busy}>${this.submitLabel}</button>
    </form>`}};customElements.define("tk-form",tt);async function E(s,e){let t=s.target;await e(s.detail)&&t.reset()}var nr=["proposed","accepted","replaced"],ns=[{name:"title",label:"Title",type:"text"},{name:"decision",label:"Decision",type:"textarea"},{name:"why",label:"Why",type:"textarea"},{name:"open",label:"Open points, one per line",type:"list"},{name:"date",label:"Date",type:"date"}],or=[...ns,{name:"status",label:"Status",type:"select",options:["proposed","accepted"]}],ar=[{name:"replaced_by",label:"Replaced by decision number",type:"number",step:"1"}];function Ce(s){return String(s).padStart(4,"0")}var st=class extends h{static{this.properties={...h.properties,decisions:{state:!0},status:{state:!0},selected:{state:!0},detail:{state:!0}}}static{this.styles=v}constructor(){super(),this.decisions=[],this.status="",this.selected=void 0,this.detail=void 0}reloadOn(){return["api","status","selected"]}async load(e){let t=this.status===""?{}:{status:this.status},{decisions:r}=await e.call("list_decisions",t),i=this.selected===void 0?void 0:await e.call("get_decision",{number:this.selected});return()=>{this.decisions=r,this.detail=i}}async save(e,t,r){if(e!=="accept"&&Object.keys(t).length===0)return!1;let i=r===void 0?{action:e,...t}:{action:e,number:r,...t},n=await this.run(l=>l.call("set_decision",i));return n&&this.changed(),n}toggle(e){this.selected=this.selected===e?void 0:e}renderDetail(e){return o`<div class="card">
      <p class="pre">${e.decision}</p>
      <h3>Why</h3>
      <p class="pre">${e.why}</p>
      ${e.open.length>0?o`<h3>Open points</h3>
              <ul>
                ${e.open.map(t=>o`<li>${t}</li>`)}
              </ul>`:d}
      ${e.replaced_by===null?d:o`<p class="muted">Replaced by ${Ce(e.replaced_by)}</p>`}
      ${e.replaces.length>0?o`<p class="muted">Replaces ${e.replaces.map(Ce).join(", ")}</p>`:d}
      ${e.status==="proposed"?o`<button
              class="accept primary"
              ?disabled=${this.busy}
              @click=${()=>this.save("accept",{},e.number)}
            >
              Accept
            </button>`:d}
      <details>
        <summary>Edit</summary>
        <tk-form
          class="update"
          .fields=${ns}
          .values=${e}
          .busy=${this.busy}
          @tk-save=${t=>this.save("update",t.detail,e.number)}
        ></tk-form>
      </details>
      <details>
        <summary>Replace</summary>
        <tk-form
          class="replace"
          .fields=${ar}
          submitLabel="Replace"
          .busy=${this.busy}
          @tk-save=${t=>E(t,r=>this.save("replace",r,e.number))}
        ></tk-form>
      </details>
      <tk-history
        .api=${this.api}
        .collection=${"decisions"}
        .recordId=${Ce(e.number)}
        .stamp=${this.version}
      ></tk-history>
    </div>`}renderDecision(e){let t=this.selected===e.number;return o`<li data-number=${e.number}>
      <div class="row">
        <strong class="grow">${Ce(e.number)} ${e.title}</strong>
        <button
          class="open"
          @click=${()=>{this.toggle(e.number)}}
        >
          ${t?"Close":"Open"}
        </button>
      </div>
      <div class="muted">${e.status} · ${e.date}</div>
      ${t&&this.detail?.number===e.number?this.renderDetail(this.detail):d}
    </li>`}render(){return o`
      <section>
        <div class="row">
          <h2 class="grow">Decisions</h2>
          <select
            class="status"
            aria-label="Status"
            .value=${this.status}
            @change=${e=>this.status=e.target.value}
          >
            <option value="">All</option>
            ${nr.map(e=>o`<option value=${e}>${e}</option>`)}
          </select>
        </div>
        ${this.error?o`<p class="error">${this.error}</p>`:d}
        <ul>
          ${k(this.decisions,e=>e.number,e=>this.renderDecision(e))}
        </ul>
      </section>
      <section>
        <h2>Add a decision</h2>
        <tk-form
          class="add"
          .fields=${or}
          submitLabel="Add"
          .busy=${this.busy}
          @tk-save=${e=>E(e,t=>this.save("add",t))}
        ></tk-form>
      </section>
    `}};customElements.define("tk-decisions",st);var lr=100,dr=["all","dose","test","event"],cr=[["ammonia","Ammonia (ppm)"],["nitrite","Nitrite (ppm)"],["nitrate","Nitrate (ppm)"],["phosphate","Phosphate (ppm)"],["ph","pH"],["kh","KH (dKH)"],["gh","GH (dGH)"],["temperature_c","Temperature (\xB0C)"]],pr=[{name:"source",label:"Water",type:"select",options:["tank","tap"]},...cr.map(([s,e])=>({name:s,label:e,type:"number"})),{name:"notes",label:"Notes",type:"textarea"}],rt=class extends h{static{this.properties={...h.properties,entries:{state:!0},kind:{state:!0},products:{state:!0}}}static{this.styles=v}constructor(){super(),this.entries=[],this.kind="all",this.products=[]}reloadOn(){return["api","kind"]}async load(e){let[t,r]=await Promise.all([e.call("get_log",{kind:this.kind,limit:lr}),e.call("list_products")]);return()=>{this.entries=t.entries,this.products=r.products.map(i=>i.name)}}doseFields(){return[{name:"product",label:"Product",type:"select",options:this.products,required:!0},{name:"amount_ml",label:"Amount (ml)",type:"number",required:!0},{name:"why",label:"Why",type:"text"},{name:"notes",label:"Notes",type:"textarea"}]}async record(e,t){let r=await this.run(i=>i.call(e,t));return r&&this.changed(),r}async recordTest(e){if(Object.keys(e).length===0)return!1;let{source:t,notes:r,...i}=e,n={values:i};return t!==void 0&&(n.source=t),r!==void 0&&(n.notes=r),this.record("record_test",n)}render(){return o`
      <section>
        <div class="row">
          <h2 class="grow">Log</h2>
          <select
            class="kind"
            aria-label="Kind"
            .value=${this.kind}
            @change=${e=>this.kind=e.target.value}
          >
            ${dr.map(e=>o`<option value=${e}>${e}</option>`)}
          </select>
        </div>
        ${this.error?o`<p class="error">${this.error}</p>`:d}
        <ul>
          ${this.entries.map(e=>o`<li>
                <div class="pre">${Ut(e)}</div>
                <div class="muted">${$(e.time)}</div>
              </li>`)}
        </ul>
      </section>
      <section>
        <h2>Record a dose</h2>
        <tk-form
          class="dose"
          .fields=${this.doseFields()}
          submitLabel="Record"
          .busy=${this.busy}
          @tk-save=${e=>E(e,t=>this.record("record_dose",t))}
        ></tk-form>
      </section>
      <section>
        <h2>Record a test</h2>
        <tk-form
          class="test"
          .fields=${pr}
          submitLabel="Record"
          .busy=${this.busy}
          @tk-save=${e=>E(e,t=>this.recordTest(t))}
        ></tk-form>
      </section>
    `}};customElements.define("tk-log",rt);var ur=20,hr=[{name:"camera",label:"Camera entity, such as a Tapo C100",type:"text"},{name:"check_time",label:"Daily check at, only while a light is on",type:"time"},{name:"after_test",label:"Check after each test",type:"checkbox"},{name:"alerts",label:"Alert me about issues",type:"checkbox"},{name:"keep_days",label:"Keep photos for (days)",type:"number"}],mr={daily:"Daily",test:"After a test",manual:"Check now",chat:"Asked in a chat"},fr=[["water","Water"],["algae","Algae"],["plants","Plants"],["level","Water level"]];function it(s){return s.photo_url===null?d:o`<img class="photo" src=${s.photo_url} alt="The tank at ${$(s.time)}" />`}function nt(s){return`${$(s.time)} \xB7 ${mr[s.reason]}`}function ot(s){let e=fr.filter(([t])=>s.seen[t]!==void 0);return o`
    ${s.summary===null?d:o`<div class="summary">${s.summary}</div>`}
    ${s.suggestion===null?d:o`<div>Suggested: ${s.suggestion}</div>`}
    ${e.length===0?d:o`<ul class="seen">
            ${e.map(([t,r])=>o`<li><strong>${r}</strong> ${s.seen[t]}</li>`)}
          </ul>`}
    ${s.note===null?d:o`<div class="muted note">${s.note}</div>`}
  `}var at=class extends h{static{this.properties={...h.properties,stamp:{type:Number},info:{state:!0},photos:{state:!0},proposals:{state:!0}}}static{this.styles=[v,w`
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
    `]}constructor(){super(),this.stamp=0,this.info=void 0,this.photos=void 0,this.proposals=[]}reloadOn(){return["api","stamp"]}async load(e){let[t,r]=await Promise.all([e.call("get_camera"),e.call("list_proposals",{state:"pending"})]);return()=>{this.info=t,this.proposals=r.proposals,t.camera===null&&(this.photos=void 0)}}async act(e){await this.run(e)&&this.changed()}async showPhotos(){await this.run(async e=>{let t=await e.call("list_photos",{limit:ur});this.photos=t.photos})}renderIssue(e){let t=this.proposals.filter(r=>e.proposal_ids.includes(r.proposal_id));return o`<li class="issue" data-check=${e.id}>
      <div class="muted">${nt(e)}</div>
      ${it(e)} ${ot(e)}
      ${t.length===0?d:o`<div class="waiting">
              <div class="muted">Accept applies:</div>
              ${t.map(r=>o`<div class="proposal">
                    <strong class="pre">${r.summary}</strong>
                    ${r.changes.map(i=>o`<div class="muted">${A(i)}</div>`)}
                  </div>`)}
            </div>`}
      <div class="row">
        <button
          class="dismiss"
          ?disabled=${this.busy}
          @click=${()=>this.act(r=>r.call("dismiss_finding",{check_id:e.id}))}
        >
          Not a problem
        </button>
        <button
          class="discuss"
          @click=${()=>{J(this,{kind:"photo",id:e.id})}}
        >
          Discuss
        </button>
        <button
          class="reject"
          ?disabled=${this.busy}
          @click=${()=>this.act(r=>r.rejectFinding(e.id))}
        >
          Reject
        </button>
        <button
          class="accept primary"
          ?disabled=${this.busy}
          @click=${()=>this.act(r=>r.acceptFinding(e.id))}
        >
          Accept
        </button>
      </div>
    </li>`}renderPhotos(){let e=this.photos;return e===void 0?o`<button class="photos" ?disabled=${this.busy} @click=${()=>this.showPhotos()}>
        Photos
      </button>`:o`<h3>Photos</h3>
      ${e.length===0?o`<p class="muted">No photos yet.</p>`:d}
      <ul class="photos">
        ${k(e,t=>t.id,t=>o`<li class="photo-check">
              <div class="muted">${nt(t)}</div>
              ${it(t)} ${ot(t)}
            </li>`)}
      </ul>`}renderSettings(e){return o`<details class="settings">
      <summary>Camera settings</summary>
      <p class="muted">
        Each check sends the photo to Anthropic through the AI task entity, uses paid API calls and
        counts toward Claude's comments a day.
      </p>
      ${U(hr,e)} ${T(this.api,"settings","camera",this.version)}
    </details>`}render(){let e=this.info;if(e===void 0)return this.error?o`<p class="error">${this.error}</p>`:o``;let t=this.error?o`<p class="error">${this.error}</p>`:d;if(e.camera===null)return o`<section id="camera">
        <h2>Camera</h2>
        ${t}
        <p class="muted">
          No camera is set. Add one in the settings, such as a Tapo C100, to have Claude look at the
          tank.
        </p>
        ${this.renderSettings(e)}
      </section>`;let r=e.latest;return o`<section id="camera">
        <h2>Camera</h2>
        ${t}
        ${r===null?o`<p class="muted">No photo yet.</p>`:o`<div class="latest">
                <div class="muted">${nt(r)}</div>
                ${it(r)} ${ot(r)}
              </div>`}
        <div class="row">
          <button
            class="check primary"
            ?disabled=${this.busy}
            @click=${()=>this.act(i=>i.call("check_now"))}
          >
            Check now
          </button>
        </div>
        ${this.renderPhotos()} ${this.renderSettings(e)}
      </section>
      ${e.open.length===0?d:o`<section id="seen">
              <h2>Seen by the camera</h2>
              <ul>
                ${k(e.open,i=>i.id,i=>this.renderIssue(i))}
              </ul>
            </section>`}`}};customElements.define("tk-camera",at);var gr=7,os=30,vr=60,as={on_course:"On course",watch:"Watch",act:"Act"},yr={cycling:"Cycling",cycled:"Cycled"},$r=[{name:"name",label:"Name",type:"text"},{name:"volume_litres",label:"Volume (litres)",type:"number"},{name:"dosing_volume_litres",label:"Water volume for doses (litres)",type:"number"},{name:"temperature_c",label:"Target temperature (\xB0C)",type:"number"},{name:"stage",label:"Stage",type:"select",options:["cycling","cycled"]},{name:"notes",label:"Notes",type:"textarea"}],br=[{name:"source",label:"Values come from",type:"select",options:["supplier","tap_test"]},{name:"ph",label:"pH",type:"number"},{name:"kh",label:"KH (dKH)",type:"number"},{name:"gh",label:"GH (dGH)",type:"number"},{name:"nitrate",label:"Nitrate (mg/l)",type:"number"},{name:"phosphate",label:"Phosphate (mg/l)",type:"number"},{name:"notes",label:"Notes",type:"textarea"}],kr=[{name:"nitrogen_watch",label:"Ammonia or nitrite Watch above (ppm)",type:"number"},{name:"nitrogen_act",label:"Ammonia or nitrite Act above (ppm)",type:"number"},{name:"ph_watch",label:"pH Watch under, while cycling",type:"number"},{name:"ph_act",label:"pH Act under, while cycling",type:"number"},{name:"stall_watch_days",label:"Stalled cycle Watch after (days)",type:"number",step:"1"},{name:"stall_act_days",label:"Stalled cycle Act after (days)",type:"number",step:"1"},{name:"test_watch_days",label:"Late test Watch after (days)",type:"number",step:"1"},{name:"test_act_days",label:"Late test Act after (days)",type:"number",step:"1"},{name:"skip_watch",label:"Skipped tasks for Watch",type:"number",step:"1"},{name:"skip_act",label:"Skipped tasks for Act",type:"number",step:"1"},{name:"plan_watch_days",label:"Plan ends within, for Watch (days)",type:"number",step:"1"},{name:"plan_act_days",label:"Plan ends within, for Act (days)",type:"number",step:"1"}],lt=class extends h{static{this.properties={...h.properties,status:{state:!0},tank:{state:!0},plan:{state:!0},log:{state:!0},lights:{state:!0},proposals:{state:!0}}}static{this.styles=v}constructor(){super(),this.status=void 0,this.tank=void 0,this.plan=void 0,this.log=[],this.lights=void 0,this.proposals=[]}async load(e){let t=O(new Date,e.timeZone),[r,i,n,l,c,a]=await Promise.all([e.call("get_status"),e.call("get_tank"),e.call("get_plan",{start:t,end:D(t,gr)}),e.call("get_log",{kind:"test",since:D(t,-vr),limit:500}),e.call("get_light",{days:os}),e.call("list_proposals",{state:"pending"})]);return()=>{this.status=r,this.tank=i,this.plan=n,this.log=l.entries,this.lights=c,this.proposals=a.proposals}}async act(e){await this.run(e)&&this.changed()}settingsCard(e,t,r,i,n,l){return o`<section id=${e}>
      <h2>${t}</h2>
      ${U(r,i)} ${T(this.api,n,l,this.version)}
    </section>`}renderStatus(e,t){let r=e.status===null?"Not checked yet":as[e.status],i=e.stage===null?"":yr[e.stage];return o`<section id="status">
      <div class="row">
        <h2 class="grow">${t.tank.name}</h2>
        <strong class="level ${e.status??""}">${r}</strong>
      </div>
      <div class="muted">
        ${[i,e.checked===null?"":`checked ${$(e.checked)}`].filter(n=>n!=="").join(" \xB7 ")}
      </div>
      <ul>
        ${e.rules.filter(n=>n.level!=="on_course").map(n=>o`<li>
                <strong>${as[n.level]}</strong> ${n.reason}
                ${n.action===null?d:o`<div>${n.action}</div>`}
              </li>`)}
      </ul>
    </section>`}renderTask(e,t){return o`<li>
      <div class="row">
        <span class="grow">${e.time??""} ${e.text}</span>
        ${t&&e.state==="open"?o`<button
                  class="skip"
                  ?disabled=${this.busy}
                  @click=${()=>this.act(r=>r.call("skip_task",{task_id:e.id}))}
                >
                  Skip
                </button>
                <button
                  class="complete primary"
                  ?disabled=${this.busy}
                  @click=${()=>this.act(r=>r.call("complete_task",{task_id:e.id}))}
                >
                  Complete
                </button>`:o`<span class="muted">${e.state==="open"?"":e.state}</span>`}
      </div>
    </li>`}renderLight(e,t){return o`<li data-light=${e.id}>
      <div class="row">
        <strong class="grow">${e.model}</strong>
        <span class="muted">${e.state??"unknown"}</span>
      </div>
      <div>
        ${e.on} to
        ${e.off}${e.brightness_pct===null?"":`, ${String(e.brightness_pct)}%`}
      </div>
      <div class="muted">Today ${e.today.on} to ${e.today.off}</div>
      ${e.problem===null?d:o`<div class="error">${e.problem}</div>`}
      ${xe(we(e.on_periods,t,os,this.api?.timeZone))}
      ${T(this.api,"lights",e.id,this.version)}
    </li>`}renderParameters(e,t){let{charts:r,empty:i}=qt(this.log,e.settings,t.tank.temperature_c,t.water);return o`<section id="parameters">
      <h2>Water parameters</h2>
      <div class="charts">
        ${r.map(n=>o`<div class="parameter" data-parameter=${n.key}>
              <h3>${n.label}</h3>
              ${ae(n.chart,n.label)}
            </div>`)}
      </div>
      ${i.length===0?d:o`<p class="muted">No readings yet for: ${i.join(", ")}</p>`}
    </section>`}renderProposal(e){return o`<li>
      <strong class="pre">${e.summary}</strong>
      <div class="pre">${e.reason}</div>
      <div class="muted">${V(e.source)} · ${$(e.created)}</div>
      ${e.changes.map(t=>o`<div class="muted">${A(t)}</div>`)}
      <div class="row">
        <button
          class="discuss"
          @click=${()=>{J(this,{kind:"proposal",id:e.proposal_id})}}
        >
          Discuss
        </button>
        <button
          class="reject"
          ?disabled=${this.busy}
          @click=${()=>this.act(t=>t.reject(e.proposal_id))}
        >
          Reject
        </button>
        <button
          class="accept primary"
          ?disabled=${this.busy}
          @click=${()=>this.act(t=>t.accept(e.proposal_id))}
        >
          Accept
        </button>
      </div>
    </li>`}render(){let{status:e,tank:t,plan:r,lights:i}=this;if(e===void 0||t===void 0||r===void 0||i===void 0)return this.error?o`<p class="error">${this.error}</p>`:o`<p class="muted">Loading</p>`;let n=O(new Date,this.api?.timeZone),l=r.tasks.filter(a=>a.date===n),c=r.tasks.filter(a=>a.date>n);return o`
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      ${this.renderStatus(e,t)}
      <section id="today">
        <h2>Today</h2>
        ${l.length===0?o`<p class="muted">No tasks today</p>`:d}
        <ul>
          ${k(l,a=>a.id,a=>this.renderTask(a,!0))}
        </ul>
      </section>
      <section id="waiting">
        <h2>Waiting for you</h2>
        ${this.proposals.length===0?o`<p class="muted">Nothing is waiting for you</p>`:d}
        <ul>
          ${k(this.proposals,a=>a.proposal_id,a=>this.renderProposal(a))}
        </ul>
      </section>
      <section id="cycle">
        <h2>Cycle</h2>
        ${ae(_e(this.log,e.settings),"Cycle")}
      </section>
      ${this.renderParameters(e,t)}
      <section id="week">
        <h2>Next 7 days</h2>
        ${c.length===0?o`<p class="muted">No tasks</p>`:d}
        <ul>
          ${c.map(a=>o`<li>
                <span class="muted">${a.date}</span> ${a.time??""} ${a.text}
              </li>`)}
        </ul>
      </section>
      ${this.settingsCard("tank","Tank",$r,t.tank,"tank","tank")}
      ${this.settingsCard("water","Water",br,t.water??{},"water","water")}
      <section id="light">
        <h2>Light</h2>
        ${i.lights.length===0?o`<p class="muted">No lights yet</p>`:d}
        ${i.next_change===null?d:o`<div class="muted">Next change ${$(i.next_change.time)}</div>`}
        <ul>
          ${k(i.lights,a=>a.id,a=>this.renderLight(a,i.today))}
        </ul>
      </section>
      ${this.settingsCard("rules","Rule limits",kr,e.settings,"settings","rules")}
      <tk-camera .api=${this.api} .stamp=${this.version}></tk-camera>
    `}};customElements.define("tk-overview",lt);var _r=28,ls=[{name:"text",label:"Task",type:"text"},{name:"date",label:"Date",type:"date"},{name:"slot",label:"Slot",type:"select",options:["task","dose"]}],ds={name:"note",label:"Note",type:"text"},wr=[...ls,ds],xr=[...ls,{name:"state",label:"State",type:"select",options:["open","complete","skip"]},ds],Ar=[{name:"notify",label:"Notify services for reminders",type:"list"},{name:"status_notify",label:"Notify services for status alerts",type:"list"},{name:"task_time",label:"Task reminder time",type:"time"},{name:"dose_time",label:"Dose reminder time",type:"time"},{name:"resend_time",label:"Resend open tasks at",type:"time"}],dt=class extends h{static{this.properties={...h.properties,plan:{state:!0}}}static{this.styles=v}constructor(){super(),this.plan=void 0}async load(e){let t=O(new Date,e.timeZone),r=await e.call("get_plan",{start:t,end:D(t,_r-1)});return()=>{this.plan=r}}async save(e,t,r){if(r===void 0&&Object.keys(t).length===0)return!1;let i=r===void 0?t:{task_id:r,...t},n=await this.run(l=>l.call(e,i));return n&&this.changed(),n}renderTask(e){return o`<li data-task=${e.id}>
      <div class="row">
        <span class="grow">${e.time??""} ${e.text}</span>
        <button
          class="remove"
          ?disabled=${this.busy}
          @click=${()=>this.save("remove_task",{},e.id)}
        >
          Remove
        </button>
      </div>
      <div class="muted">
        ${[e.state,e.note].filter(t=>t!==null&&t!=="").join(" \xB7 ")}
      </div>
      <details>
        <summary>Edit and history</summary>
        <tk-form
          .fields=${xr}
          .values=${e}
          .busy=${this.busy}
          @tk-save=${t=>this.save("update_task",t.detail,e.id)}
        ></tk-form>
        <tk-history
          .api=${this.api}
          .collection=${"tasks"}
          .recordId=${e.id}
          .stamp=${this.version}
        ></tk-history>
      </details>
    </li>`}render(){let e=this.plan,t=[...new Set(e?.tasks.map(r=>r.date)??[])];return o`
      <section>
        <h2>Plan</h2>
        ${this.error?o`<p class="error">${this.error}</p>`:d}
        ${e!==void 0&&t.length===0?o`<p class="muted">No tasks in the next four weeks</p>`:d}
        ${t.map(r=>o`<h3>${r}</h3>
              <ul>
                ${k(e?.tasks.filter(i=>i.date===r)??[],i=>i.id,i=>this.renderTask(i))}
              </ul>`)}
      </section>
      <section>
        <h2>Add a task</h2>
        <tk-form
          class="add"
          .fields=${wr}
          submitLabel="Add"
          .busy=${this.busy}
          @tk-save=${r=>E(r,i=>this.save("add_task",i))}
        ></tk-form>
      </section>
      ${e===void 0?d:o`<section id="reminders">
              <h2>Reminders</h2>
              ${U(Ar,e.reminders)}
              ${T(this.api,"settings","reminders",this.version)}
            </section>`}
    `}};customElements.define("tk-plan",dt);function y(s){return typeof s=="string"||typeof s=="number"?String(s):""}function Tr(s){return s.label_dose??{}}var Cr={products:{title:"Products",collection:"products",list:"list_products",key:"products",canShowRemoved:!0,label:s=>y(s.name),lines:s=>{let e=Tr(s),t=[y(s.purpose)];if(s.label_dose){let r=s.label_dose_for_tank_ml===void 0?"":` (${y(s.label_dose_for_tank_ml)} ml for this tank)`;t.push(`Label: ${y(e.amount_ml)} ml per ${y(e.per_litres)} l, ${y(e.frequency)}${r}`)}return y(s.your_dose)&&t.push(`Your dose: ${y(s.your_dose)}`),t.push(y(s.notes)),Array.isArray(s.links)&&t.push(s.links.map(y).join(" ")),t}},contents:{title:"Contents",collection:"contents",list:"list_contents",key:"contents",canShowRemoved:!0,label:s=>y(s.name),lines:s=>[[y(s.type),y(s.count),y(s.where),`added ${y(s.added)}`].filter(e=>e!=="").join(" \xB7 "),y(s.notes)]},notes:{title:"Notes",collection:"notes",list:"list_notes",key:"notes",edit:{idArg:"note_id",add:"add_note",update:"update_note",remove:"remove_note",fields:[{name:"kind",label:"Kind",type:"select",options:["question","assumption"]},{name:"topic",label:"Topic",type:"text"},{name:"text",label:"Text",type:"textarea"},{name:"how_to_resolve",label:"How to resolve",type:"textarea"}]},canShowRemoved:!1,label:s=>`${y(s.kind)}: ${y(s.topic)}`,lines:s=>[y(s.text),y(s.how_to_resolve)]}},ct=class extends h{static{this.properties={...h.properties,kind:{attribute:!1},items:{state:!0},showRemoved:{state:!0}}}static{this.styles=v}constructor(){super(),this.kind="",this.items=[],this.showRemoved=!1}get config(){let e=Cr[this.kind];if(e===void 0)throw new Error(`No records called ${this.kind}`);return e}reloadOn(){return["api","kind","showRemoved"]}async load(e){let t=this.config,r=t.canShowRemoved?{include_removed:this.showRemoved}:{},i=(await e.call(t.list,r))[t.key]??[];return()=>{this.items=i}}async save(e,t,r,i){if(Object.keys(r).length===0)return!1;let n=i===void 0?r:{[e.idArg]:i,...r};return this.run(l=>l.call(t,n))}async removeRecord(e,t){await this.run(r=>r.call(e.remove,{[e.idArg]:t}))}status(e,t){return typeof t.removed=="string"?o`<span class="muted">Removed ${t.removed}</span>`:e===void 0?d:o`<button
      class="remove"
      ?disabled=${this.busy}
      @click=${()=>this.removeRecord(e,t.id)}
    >
      Remove
    </button>`}details(e,t){let r=e.edit;return r===void 0?T(this.api,e.collection,t.id,this.version):o`<details>
      <summary>Edit and history</summary>
      <tk-form
        .fields=${r.fields}
        .values=${t}
        .busy=${this.busy}
        @tk-save=${i=>this.save(r,r.update,i.detail,t.id)}
      ></tk-form>
      <tk-history
        .api=${this.api}
        .collection=${e.collection}
        .recordId=${t.id}
        .stamp=${this.version}
      ></tk-history>
    </details>`}item(e,t){return o`<li data-id=${t.id}>
      <div class="row">
        <strong class="grow">${e.label(t)}</strong>
        ${this.status(e.edit,t)}
      </div>
      ${e.lines(t).filter(r=>r!=="").map(r=>o`<div class="muted pre">${r}</div>`)}
      ${this.details(e,t)}
    </li>`}add(e){return e===void 0?d:o`<section>
      <h2>Add</h2>
      <tk-form
        class="add"
        .fields=${e.fields}
        submitLabel="Add"
        .busy=${this.busy}
        @tk-save=${t=>E(t,r=>this.save(e,e.add,r))}
      ></tk-form>
    </section>`}render(){let e=this.config;return o`
      <section>
        <div class="row">
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
        </div>
        ${this.error?o`<p class="error">${this.error}</p>`:d}
        <ul>
          ${k(this.items,t=>t.id,t=>this.item(e,t))}
        </ul>
      </section>
      ${this.add(e.edit)}
    `}};customElements.define("tk-records",ct);var Er=["proposal","photo","review","status"],Sr=/^[0-9A-Za-z_-]{1,64}$/;function Rr(s){let e=new URLSearchParams(s);for(let t of Er){let r=e.get(t);if(r===null)continue;return(t==="status"?r==="now":Sr.test(r))?{kind:t,id:r}:void 0}}var Pr=[["overview","Overview"],["chat","Chat"],["plan","Plan"],["log","Log"],["contents","Contents"],["products","Products"],["decisions","Decisions"],["notes","Notes"],["conversations","Conversations"],["claude","Claude"]],pt=class extends x{constructor(){super();this.chat=document.createElement("tk-chat");this.connection=void 0;this.hass=void 0,this.panel=void 0,this.narrow=!1,this.route=void 0,this.addEventListener(Ve,t=>{this.openChat(t.detail)}),this.tab="overview",this.api=void 0}static{this.properties={hass:{attribute:!1},panel:{attribute:!1},narrow:{type:Boolean},route:{attribute:!1},tab:{state:!0},api:{state:!0}}}static{this.styles=w`
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
  `}connectedCallback(){super.connectedCallback(),this.followAddress()}followAddress(){let t=Rr(window.location.search);window.location.search!==""&&history.replaceState(history.state,"",window.location.pathname),t!==void 0&&this.openChat(t)}openChat(t){this.chat.start={...t},this.tab="chat"}willUpdate(t){t.has("route")&&this.followAddress(),this.updateApi(t),this.chat.api=this.api}updateApi(t){let r=this.hass;if(r===void 0||!(t.has("hass")||t.has("panel")))return;let i=this.panel?.config?.entry_id;this.connection===r.connection&&this.api?.entryId===i||(this.connection=r.connection,this.api=new $e(r.connection,r.config?.time_zone,i))}view(){switch(this.tab){case"chat":return o`${this.chat}`;case"plan":return o`<tk-plan .api=${this.api}></tk-plan>`;case"log":return o`<tk-log .api=${this.api}></tk-log>`;case"decisions":return o`<tk-decisions .api=${this.api}></tk-decisions>`;case"claude":return o`<tk-claude .api=${this.api}></tk-claude>`;case"conversations":return o`<tk-conversations .api=${this.api}></tk-conversations>`;case"contents":case"products":case"notes":return o`${Ht(this.tab,o`<tk-records .api=${this.api} .kind=${this.tab}></tk-records>`)}`;default:return o`<tk-overview .api=${this.api}></tk-overview>`}}render(){return o`
      <header>
        ${this.narrow?o`<ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>`:d}
        <h1>TankKeeper</h1>
        ${Ft(this.api)}
      </header>
      <nav role="tablist">
        ${Pr.map(([t,r])=>o`<button
              class="tab"
              role="tab"
              data-tab=${t}
              aria-selected=${this.tab===t?"true":"false"}
              @click=${()=>this.tab=t}
            >
              ${r}
            </button>`)}
      </nav>
      <main>${this.view()}</main>
    `}};customElements.define("tankkeeper-panel",pt);export{pt as TankkeeperPanel,Rr as discussed};
