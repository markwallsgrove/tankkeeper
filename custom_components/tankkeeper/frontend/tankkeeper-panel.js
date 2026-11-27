var pe=globalThis,ue=pe.ShadowRoot&&(pe.ShadyCSS===void 0||pe.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Ie=Symbol(),Ct=new WeakMap,Q=class{constructor(e,t,s){if(this._$cssResult$=!0,s!==Ie)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(ue&&e===void 0){let s=t!==void 0&&t.length===1;s&&(e=Ct.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),s&&Ct.set(t,e))}return e}toString(){return this.cssText}},St=r=>new Q(typeof r=="string"?r:r+"",void 0,Ie),$=(r,...e)=>{let t=r.length===1?r[0]:e.reduce((s,i,n)=>s+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+r[n+1],r[0]);return new Q(t,r,Ie)},Rt=(r,e)=>{if(ue)r.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let s=document.createElement("style"),i=pe.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=t.cssText,r.appendChild(s)}},Ne=ue?r=>r:r=>r instanceof CSSStyleSheet?(e=>{let t="";for(let s of e.cssRules)t+=s.cssText;return St(t)})(r):r;var{is:Ps,defineProperty:Ls,getOwnPropertyDescriptor:Ds,getOwnPropertyNames:Is,getOwnPropertySymbols:Ns,getPrototypeOf:Os}=Object,he=globalThis,Pt=he.trustedTypes,Hs=Pt?Pt.emptyScript:"",Ms=he.reactiveElementPolyfillSupport,ee=(r,e)=>r,Oe={toAttribute(r,e){switch(e){case Boolean:r=r?Hs:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,e){let t=r;switch(e){case Boolean:t=r!==null;break;case Number:t=r===null?null:Number(r);break;case Object:case Array:try{t=JSON.parse(r)}catch{t=null}}return t}},Dt=(r,e)=>!Ps(r,e),Lt={attribute:!0,type:String,converter:Oe,reflect:!1,useDefault:!1,hasChanged:Dt};Symbol.metadata??=Symbol("metadata"),he.litPropertyMetadata??=new WeakMap;var D=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=Lt){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let s=Symbol(),i=this.getPropertyDescriptor(e,s,t);i!==void 0&&Ls(this.prototype,e,i)}}static getPropertyDescriptor(e,t,s){let{get:i,set:n}=Ds(this.prototype,e)??{get(){return this[t]},set(a){this[t]=a}};return{get:i,set(a){let c=i?.call(this);n?.call(this,a),this.requestUpdate(e,c,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Lt}static _$Ei(){if(this.hasOwnProperty(ee("elementProperties")))return;let e=Os(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(ee("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(ee("properties"))){let t=this.properties,s=[...Is(t),...Ns(t)];for(let i of s)this.createProperty(i,t[i])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[s,i]of t)this.elementProperties.set(s,i)}this._$Eh=new Map;for(let[t,s]of this.elementProperties){let i=this._$Eu(t,s);i!==void 0&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let s=new Set(e.flat(1/0).reverse());for(let i of s)t.unshift(Ne(i))}else e!==void 0&&t.push(Ne(e));return t}static _$Eu(e,t){let s=t.attribute;return s===!1?void 0:typeof s=="string"?s:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let s of t.keys())this.hasOwnProperty(s)&&(e.set(s,this[s]),delete this[s]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Rt(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,s){this._$AK(e,s)}_$ET(e,t){let s=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,s);if(i!==void 0&&s.reflect===!0){let n=(s.converter?.toAttribute!==void 0?s.converter:Oe).toAttribute(t,s.type);this._$Em=e,n==null?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(e,t){let s=this.constructor,i=s._$Eh.get(e);if(i!==void 0&&this._$Em!==i){let n=s.getPropertyOptions(i),a=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:Oe;this._$Em=i;let c=a.fromAttribute(t,n.type);this[i]=c??this._$Ej?.get(i)??c,this._$Em=null}}requestUpdate(e,t,s,i=!1,n){if(e!==void 0){let a=this.constructor;if(i===!1&&(n=this[e]),s??=a.getPropertyOptions(e),!((s.hasChanged??Dt)(n,t)||s.useDefault&&s.reflect&&n===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,s))))return;this.C(e,t,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:s,reflect:i,wrapped:n},a){s&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),n!==!0||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||s||(t=void 0),this._$AL.set(e,t)),i===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[i,n]of this._$Ep)this[i]=n;this._$Ep=void 0}let s=this.constructor.elementProperties;if(s.size>0)for(let[i,n]of s){let{wrapped:a}=n,c=this[i];a!==!0||this._$AL.has(i)||c===void 0||this.C(i,void 0,n,c)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(t)):this._$EM()}catch(s){throw e=!1,this._$EM(),s}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};D.elementStyles=[],D.shadowRootOptions={mode:"open"},D[ee("elementProperties")]=new Map,D[ee("finalized")]=new Map,Ms?.({ReactiveElement:D}),(he.reactiveElementVersions??=[]).push("2.1.2");var Me=globalThis,It=r=>r,me=Me.trustedTypes,Nt=me?me.createPolicy("lit-html",{createHTML:r=>r}):void 0,Ve="$lit$",I=`lit$${Math.random().toFixed(9).slice(2)}$`,Ue="?"+I,Vs=`<${Ue}>`,q=document,se=()=>q.createComment(""),re=r=>r===null||typeof r!="object"&&typeof r!="function",Fe=Array.isArray,Ft=r=>Fe(r)||typeof r?.[Symbol.iterator]=="function",He=`[ 	
\f\r]`,te=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Ot=/-->/g,Ht=/>/g,F=RegExp(`>|${He}(?:([^\\s"'>=/]+)(${He}*=${He}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Mt=/'/g,Vt=/"/g,jt=/^(?:script|style|textarea|title)$/i,je=r=>(e,...t)=>({_$litType$:r,strings:e,values:t}),o=je(1),H=je(2),hi=je(3),T=Symbol.for("lit-noChange"),d=Symbol.for("lit-nothing"),Ut=new WeakMap,j=q.createTreeWalker(q,129);function qt(r,e){if(!Fe(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return Nt!==void 0?Nt.createHTML(e):e}var Wt=(r,e)=>{let t=r.length-1,s=[],i,n=e===2?"<svg>":e===3?"<math>":"",a=te;for(let c=0;c<t;c++){let l=r[c],u,g,p=-1,m=0;for(;m<l.length&&(a.lastIndex=m,g=a.exec(l),g!==null);)m=a.lastIndex,a===te?g[1]==="!--"?a=Ot:g[1]!==void 0?a=Ht:g[2]!==void 0?(jt.test(g[2])&&(i=RegExp("</"+g[2],"g")),a=F):g[3]!==void 0&&(a=F):a===F?g[0]===">"?(a=i??te,p=-1):g[1]===void 0?p=-2:(p=a.lastIndex-g[2].length,u=g[1],a=g[3]===void 0?F:g[3]==='"'?Vt:Mt):a===Vt||a===Mt?a=F:a===Ot||a===Ht?a=te:(a=F,i=void 0);let f=a===F&&r[c+1].startsWith("/>")?" ":"";n+=a===te?l+Vs:p>=0?(s.push(u),l.slice(0,p)+Ve+l.slice(p)+I+f):l+I+(p===-2?c:f)}return[qt(r,n+(r[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),s]},ie=class r{constructor({strings:e,_$litType$:t},s){let i;this.parts=[];let n=0,a=0,c=e.length-1,l=this.parts,[u,g]=Wt(e,t);if(this.el=r.createElement(u,s),j.currentNode=this.el.content,t===2||t===3){let p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(i=j.nextNode())!==null&&l.length<c;){if(i.nodeType===1){if(i.hasAttributes())for(let p of i.getAttributeNames())if(p.endsWith(Ve)){let m=g[a++],f=i.getAttribute(p).split(I),k=/([.?@])?(.*)/.exec(m);l.push({type:1,index:n,name:k[2],strings:f,ctor:k[1]==="."?ge:k[1]==="?"?ve:k[1]==="@"?ye:z}),i.removeAttribute(p)}else p.startsWith(I)&&(l.push({type:6,index:n}),i.removeAttribute(p));if(jt.test(i.tagName)){let p=i.textContent.split(I),m=p.length-1;if(m>0){i.textContent=me?me.emptyScript:"";for(let f=0;f<m;f++)i.append(p[f],se()),j.nextNode(),l.push({type:2,index:++n});i.append(p[m],se())}}}else if(i.nodeType===8)if(i.data===Ue)l.push({type:2,index:n});else{let p=-1;for(;(p=i.data.indexOf(I,p+1))!==-1;)l.push({type:7,index:n}),p+=I.length-1}n++}}static createElement(e,t){let s=q.createElement("template");return s.innerHTML=e,s}};function W(r,e,t=r,s){if(e===T)return e;let i=s!==void 0?t._$Co?.[s]:t._$Cl,n=re(e)?void 0:e._$litDirective$;return i?.constructor!==n&&(i?._$AO?.(!1),n===void 0?i=void 0:(i=new n(r),i._$AT(r,t,s)),s!==void 0?(t._$Co??=[])[s]=i:t._$Cl=i),i!==void 0&&(e=W(r,i._$AS(r,e.values),i,s)),e}var fe=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:s}=this._$AD,i=(e?.creationScope??q).importNode(t,!0);j.currentNode=i;let n=j.nextNode(),a=0,c=0,l=s[0];for(;l!==void 0;){if(a===l.index){let u;l.type===2?u=new K(n,n.nextSibling,this,e):l.type===1?u=new l.ctor(n,l.name,l.strings,this,e):l.type===6&&(u=new $e(n,this,e)),this._$AV.push(u),l=s[++c]}a!==l?.index&&(n=j.nextNode(),a++)}return j.currentNode=q,i}p(e){let t=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(e,s,t),t+=s.strings.length-2):s._$AI(e[t])),t++}},K=class r{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,s,i){this.type=2,this._$AH=d,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=W(this,e,t),re(e)?e===d||e==null||e===""?(this._$AH!==d&&this._$AR(),this._$AH=d):e!==this._$AH&&e!==T&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Ft(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==d&&re(this._$AH)?this._$AA.nextSibling.data=e:this.T(q.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:s}=e,i=typeof s=="number"?this._$AC(e):(s.el===void 0&&(s.el=ie.createElement(qt(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(t);else{let n=new fe(i,this),a=n.u(this.options);n.p(t),this.T(a),this._$AH=n}}_$AC(e){let t=Ut.get(e.strings);return t===void 0&&Ut.set(e.strings,t=new ie(e)),t}k(e){Fe(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,s,i=0;for(let n of e)i===t.length?t.push(s=new r(this.O(se()),this.O(se()),this,this.options)):s=t[i],s._$AI(n),i++;i<t.length&&(this._$AR(s&&s._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let s=It(e).nextSibling;It(e).remove(),e=s}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},z=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,s,i,n){this.type=1,this._$AH=d,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=n,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=d}_$AI(e,t=this,s,i){let n=this.strings,a=!1;if(n===void 0)e=W(this,e,t,0),a=!re(e)||e!==this._$AH&&e!==T,a&&(this._$AH=e);else{let c=e,l,u;for(e=n[0],l=0;l<n.length-1;l++)u=W(this,c[s+l],t,l),u===T&&(u=this._$AH[l]),a||=!re(u)||u!==this._$AH[l],u===d?e=d:e!==d&&(e+=(u??"")+n[l+1]),this._$AH[l]=u}a&&!i&&this.j(e)}j(e){e===d?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},ge=class extends z{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===d?void 0:e}},ve=class extends z{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==d)}},ye=class extends z{constructor(e,t,s,i,n){super(e,t,s,i,n),this.type=5}_$AI(e,t=this){if((e=W(this,e,t,0)??d)===T)return;let s=this._$AH,i=e===d&&s!==d||e.capture!==s.capture||e.once!==s.once||e.passive!==s.passive,n=e!==d&&(s===d||i);i&&this.element.removeEventListener(this.name,this,s),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},$e=class{constructor(e,t,s){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(e){W(this,e)}},zt={M:Ve,P:I,A:Ue,C:1,L:Wt,R:fe,D:Ft,V:W,I:K,H:z,N:ve,U:ye,B:ge,F:$e},Us=Me.litHtmlPolyfillSupport;Us?.(ie,K),(Me.litHtmlVersions??=[]).push("3.3.3");var Bt=(r,e,t)=>{let s=t?.renderBefore??e,i=s._$litPart$;if(i===void 0){let n=t?.renderBefore??null;s._$litPart$=i=new K(e.insertBefore(se(),n),n,void 0,t??{})}return i._$AI(r),i};var qe=globalThis,x=class extends D{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Bt(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return T}};x._$litElement$=!0,x.finalized=!0,qe.litElementHydrateSupport?.({LitElement:x});var Fs=qe.litElementPolyfillSupport;Fs?.({LitElement:x});(qe.litElementVersions??=[]).push("4.2.2");var N={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},G=r=>(...e)=>({_$litDirective$:r,values:e}),M=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,s){this._$Ct=e,this._$AM=t,this._$Ci=s}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};var{I:js}=zt,Kt=r=>r;var Yt=r=>r.strings===void 0,Gt=()=>document.createComment(""),Y=(r,e,t)=>{let s=r._$AA.parentNode,i=e===void 0?r._$AB:e._$AA;if(t===void 0){let n=s.insertBefore(Gt(),i),a=s.insertBefore(Gt(),i);t=new js(n,a,r,r.options)}else{let n=t._$AB.nextSibling,a=t._$AM,c=a!==r;if(c){let l;t._$AQ?.(r),t._$AM=r,t._$AP!==void 0&&(l=r._$AU)!==a._$AU&&t._$AP(l)}if(n!==i||c){let l=t._$AA;for(;l!==n;){let u=Kt(l).nextSibling;Kt(s).insertBefore(l,i),l=u}}}return t},V=(r,e,t=r)=>(r._$AI(e,t),r),qs={},Z=(r,e=qs)=>r._$AH=e,Zt=r=>r._$AH,be=r=>{r._$AR(),r._$AA.remove()};var Jt=G(class extends M{constructor(){super(...arguments),this.key=d}render(r,e){return this.key=r,e}update(r,[e,t]){return e!==this.key&&(Z(r),this.key=e),t}});var ke=class{constructor(e,t=Intl.DateTimeFormat().resolvedOptions().timeZone,s){this.connection=e;this.timeZone=t;this.entryId=s}call(e,t={}){return this.send({type:`tankkeeper/${e}`,args:t})}accept(e){return this.send({type:"tankkeeper/accept_proposal",proposal_id:e})}reject(e){return this.send({type:"tankkeeper/reject_proposal",proposal_id:e})}acceptFinding(e){return this.send({type:"tankkeeper/accept_finding",check_id:e})}rejectFinding(e){return this.send({type:"tankkeeper/reject_finding",check_id:e})}chatAgent(){return this.send({type:"tankkeeper/chat_agent"})}converse(e,t,s){return this.send({type:"conversation/process",text:e,conversation_id:t,agent_id:s})}send(e){return this.connection.sendMessagePromise(e)}};function we(r){return Object(r).code==="not_found"}function B(r){return typeof r=="object"&&r!==null&&"message"in r?String(r.message):String(r)}var Xt="tk-changed",v=$`
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
`,We="tk-chat";function J(r,e){r.dispatchEvent(new CustomEvent(We,{detail:e,bubbles:!0,composed:!0}))}var h=class extends x{constructor(){super();this.loads=0;this.api=void 0,this.error="",this.busy=!1,this.version=0,this.addEventListener(Xt,t=>{t.composedPath()[0]!==this&&this.reload()})}static{this.properties={api:{attribute:!1},error:{state:!0},busy:{state:!0},version:{state:!0}}}reloadOn(){return["api"]}willUpdate(t){this.reloadOn().some(s=>t.has(s))&&this.reload()}async reload(){let t=this.api;if(t===void 0)return;this.loads+=1;let s=this.loads;try{let i=await this.load(t);if(s!==this.loads)return;i(),this.error="",this.version+=1}catch(i){s===this.loads&&(this.error=B(i))}}async run(t){let s=this.api;if(s===void 0)return!1;this.busy=!0;try{return await t(s),this.error="",await this.reload(),!0}catch(i){return this.error=B(i),!1}finally{this.busy=!1}}changed(){this.dispatchEvent(new CustomEvent(Xt,{bubbles:!0,composed:!0}))}};var Ws={panel:"Panel",mcp:"Claude (MCP)",assist:"Assist",notification:"Notification",rule:"Rule",review:"Review",camera:"Camera"};function Qt(r){return String(r).padStart(2,"0")}function _e(r,e){let t=new Intl.DateTimeFormat("en-CA",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(r),s=i=>t.find(n=>n.type===i)?.value??"";return{day:`${s("year")}-${s("month")}-${s("day")}`,minutes:Number(s("hour"))*60+Number(s("minute"))}}function O(r,e){return _e(r,e).day}function _(r,e){let[t=0,s=1,i=1]=r.split("-").map(Number);return new Date(Date.UTC(t,s-1,i+e)).toISOString().slice(0,10)}function b(r){let e=new Date(r);return`${O(e)} ${Qt(e.getHours())}:${Qt(e.getMinutes())}`}var Be=6e4,Ke=60*Be,xe=24*Ke;function ts(r,e=new Date){let t=new Date(r),s=e.getTime()-t.getTime();return s<Be?"just now":s<Ke?`${String(Math.floor(s/Be))} min ago`:s<xe?`${String(Math.floor(s/Ke))} h ago`:s<2*xe?"yesterday":s<7*xe?`${String(Math.floor(s/xe))} days ago`:O(t)}function S(r){return Ws[r]??r}function es(r){return typeof r=="string"?r:JSON.stringify(r)}function A(r){if(r.before===null)return`Added to ${r.collection}`;if(r.after===null)return`Removed from ${r.collection}`;let{before:e,after:t}=r,i=Object.keys(t).filter(n=>JSON.stringify(e[n])!==JSON.stringify(t[n])).map(n=>`${n} ${es(e[n])} \u2192 ${es(t[n])}`);return`${r.collection}: ${i.join(", ")}`}function ze(r,...e){let t=e.filter(s=>typeof s=="string"&&s!=="");return[r,...t].join(". ")}function ss(r){if(r.kind==="dose")return ze(`Dose: ${r.product??""} ${String(r.amount_ml??0)} ml`,r.why,r.notes);if(r.kind==="test"){let t=Object.entries(r.values??{}).map(([i,n])=>`${i} ${String(n)}`).join(", "),s=r.source==="tap"?"Tap":"Tank";return ze(`${s} test: ${t}`,r.notes)}let e=[...r.tasks??[]];return typeof r.water_change_percent=="number"&&e.push(`${String(r.water_change_percent)}% water change`),typeof r.water_litres=="number"&&e.push(`${String(r.water_litres)} l water`),ze(e.join(". "),r.why,r.notes)}var Ge=class extends h{constructor(){super();this.details=null;this.toggled=()=>{this.details?.open===!0&&this.reload()};this.collection="",this.recordId=void 0,this.stamp=0,this.entries=void 0}static{this.properties={...h.properties,collection:{attribute:!1},recordId:{attribute:!1},stamp:{attribute:!1},entries:{state:!0}}}static{this.styles=v}connectedCallback(){super.connectedCallback(),this.details=this.closest("details"),this.details?.addEventListener("toggle",this.toggled)}disconnectedCallback(){super.disconnectedCallback(),this.details?.removeEventListener("toggle",this.toggled),this.details=null}async reload(){this.details!==null&&!this.details.open||await super.reload()}reloadOn(){return["api","collection","recordId","stamp"]}async load(t){let s={collection:this.collection,limit:10};this.recordId!==void 0&&(s.record_id=this.recordId);let{history:i}=await t.call("get_history",s);return()=>{this.entries=i}}async undo(t){await this.run(s=>s.call("undo_change",{history_id:t.id}))&&this.changed()}render(){return this.entries===void 0?d:o`
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      ${this.entries.length===0?o`<p class="muted">No changes yet</p>`:d}
      <ul>
        ${this.entries.map(t=>o`<li class="row">
              <div class="grow">
                <div>${t.summary}</div>
                <div class="muted when">
                  ${b(t.time)} ·
                  ${S(t.source)}${typeof t.conversation_name=="string"?` \xB7 in ${t.conversation_name}`:d}
                </div>
                ${t.changes.map(s=>o`<div class="muted">${A(s)}</div>`)}
              </div>
              <button class="undo" ?disabled=${this.busy} @click=${()=>this.undo(t)}>
                Undo
              </button>
            </li>`)}
      </ul>
    `}};customElements.define("tk-history",Ge);var zs="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z",rs="/config/integrations/integration/tankkeeper";function Bs(r){return r===void 0?rs:`${rs}#config_entry=${encodeURIComponent(r)}`}function Ks(r){history.pushState(null,"",Bs(r)),window.dispatchEvent(new CustomEvent("location-changed",{detail:{replace:!1}}))}function is(r){return o`<ha-icon-button
    class="settings"
    .path=${zs}
    label="TankKeeper settings"
    @click=${()=>{Ks(r?.entryId)}}
  ></ha-icon-button>`}function Gs(r,e){return r.type==="checkbox"&&typeof e=="boolean"?e?"Yes":"No":Array.isArray(e)?e.length===0?"Not set":e.map(String).join(", "):e==null||e===""?"Not set":typeof e=="string"||typeof e=="number"?String(e):JSON.stringify(e)}function U(r,e){let t=new Map(Object.entries(e));return o`<dl class="facts">
    ${r.map(s=>{let i=s.type==="textarea"?"wide":"";return o`<dt class=${i}>${s.label}</dt>
        <dd class="pre ${i}">${Gs(s,t.get(s.name))}</dd>`})}
  </dl>`}function E(r,e,t,s){return o`<details>
    <summary>History</summary>
    <tk-history
      .api=${r}
      .collection=${e}
      .recordId=${t}
      .stamp=${s}
    ></tk-history>
  </details>`}var ns=G(class extends M{constructor(r){if(super(r),r.type!==N.PROPERTY&&r.type!==N.ATTRIBUTE&&r.type!==N.BOOLEAN_ATTRIBUTE)throw Error("The `live` directive is not allowed on child or event bindings");if(!Yt(r))throw Error("`live` bindings can only contain a single expression")}render(r){return r}update(r,[e]){if(e===T||e===d)return e;let t=r.element,s=r.name;if(r.type===N.PROPERTY){if(e===t[s])return T}else if(r.type===N.BOOLEAN_ATTRIBUTE){if(!!e===t.hasAttribute(s))return T}else if(r.type===N.ATTRIBUTE&&t.getAttribute(s)===e+"")return T;return Z(r),e}});var Ys=["ammonia","nitrite","nitrate","phosphate","ph","kh","gh","temperature_c","cycle","light"];var Zs="tankkeeper:photo/",Js=/^tankkeeper:photo\/[0-9A-HJKMNP-TV-Z]{26}$/,Xs=/^tankkeeper:chart\/([a-z_]+)(?:\?days=(\d+))?$/;function Qs(r){return Ys.includes(r)}function ne(r){if(Js.test(r))return{kind:"photo",id:r.slice(Zs.length)};let e=Xs.exec(r),t=e?.[1]??"";if(e===null||!Qs(t))return;let s=t==="light"?30:365,i=e[2]===void 0?30:Number(e[2]);return{kind:"chart",chart:t,days:Math.min(s,Math.max(1,i))}}var os=1440,R=320,oe=160,C=24,Xe={ammonia:"var(--warning-color, #f4b400)",nitrite:"var(--error-color, #db4437)",nitrate:"var(--info-color, #4285f4)",ph:"var(--primary-color, #03a9f4)",kh:"var(--success-color, #43a047)",gh:"var(--accent-color, #ff9800)",phosphate:"var(--state-icon-color, #44739e)",temperature_c:"var(--error-color, #db4437)"},er=Xe.ammonia,tr=Xe.nitrite,as="var(--secondary-text-color, #727272)",Qe={ammonia:"Ammonia (ppm)",nitrite:"Nitrite (ppm)",nitrate:"Nitrate (mg/l)",ph:"pH",kh:"KH (dKH)",gh:"GH (dGH)",phosphate:"Phosphate (mg/l)",temperature_c:"Temperature (\xB0C)"},sr=["ammonia","nitrite","nitrate","ph","kh","gh","phosphate","temperature_c"];function Te(r,e,t,s){let i=r.filter(n=>n.kind==="test"&&(n.source==="tap"?"tap":"tank")===s&&typeof n.values?.[e]=="number").map(n=>({time:Date.parse(n.time),value:n.values?.[e]??0})).sort((n,a)=>n.time-a.time);return{name:t,colour:Xe[e],joined:s==="tank",points:i}}var Ye=.1;function ds(r,e){let t=[...r.flatMap(a=>a.points.map(c=>c.value)),...e.map(a=>a.value)];if(t.length===0)return{series:r,lines:e,min:0,max:1};let s=Math.min(...t),i=Math.max(...t),n=i>s?(i-s)*Ye:Math.abs(i)*Ye||Ye;return{series:r,lines:e,min:Math.max(0,s-n),max:i+n}}function ls(r){return String(Number(r.toFixed(2)))}function Ze(r){return r.flatMap(([e,t,s])=>typeof t=="number"?[{label:e,value:t,colour:s}]:[])}function Je(r,e,t){return Ze([["Watch",r[e],er],["Act",r[t],tr]])}function Ae(r,e){let t=[["ammonia","Ammonia"],["nitrite","Nitrite"],["nitrate","Nitrate"]];return ds([...t.map(([s,i])=>Te(r,s,i,"tank")),...t.map(([s,i])=>Te(r,s,`Tap ${i.toLowerCase()}`,"tap"))],Je(e,"nitrogen_watch","nitrogen_act"))}function rr(r,e,t,s){let i=n=>Ze([["Tap water",s?.[n],as]]);switch(r){case"ammonia":case"nitrite":return Je(e,"nitrogen_watch","nitrogen_act");case"ph":return[...Je(e,"ph_watch","ph_act"),...i("ph")];case"temperature_c":return Ze([["Target",t,as]]);default:return i(r)}}function et(r,e,t,s,i){let n=[Te(r,e,"Tank","tank"),Te(r,e,"Tap","tap")];return{key:e,label:Qe[e],chart:ds(n,rr(e,t,s,i))}}function cs(r,e,t,s){let i=[],n=[];for(let a of sr){let c=et(r,a,e,t,s);c.chart.series.every(l=>l.points.length===0)?n.push(c.label):i.push(c)}return{charts:i,empty:n}}function ae(r,e){let t=r.series.flatMap(l=>l.points.map(u=>u.time));if(t.length===0)return o`<p class="empty">No readings yet</p>`;let s=Math.min(...t),i=Math.max(...t)-s,n=r.max-r.min||1,a=l=>i===0?R/2:C+(l-s)/i*(R-2*C),c=l=>oe-C-(l-r.min)/n*(oe-2*C);return o`
    <svg viewBox="0 0 ${R} ${oe}" role="img" aria-label=${e} class="chart">
      <line class="axis" x1=${C} y1=${oe-C} x2=${R-C} y2=${oe-C}></line>
      <text class="tick" x="2" y=${c(r.max)+4}>${ls(r.max)}</text>
      <text class="tick" x="2" y=${c(r.min)+4}>${ls(r.min)}</text>
      ${r.lines.map(l=>H`<line class="target" x1=${C} x2=${R-C} y1=${c(l.value)} y2=${c(l.value)}
            stroke=${l.colour}><title>${l.label} ${l.value}</title></line>
            <text class="line-label" x=${R-C} y=${c(l.value)-2} text-anchor="end"
              fill=${l.colour}>${l.label} ${l.value}</text>`)}
      ${r.series.filter(l=>l.points.length>0).map(l=>H`
          ${l.joined?H`<polyline fill="none" stroke=${l.colour}
                  points=${l.points.map(u=>`${String(a(u.time))},${String(c(u.value))}`).join(" ")}>
                </polyline>`:d}
          ${l.points.map(u=>H`<circle class=${l.joined?"solid":"hollow"} cx=${a(u.time)} cy=${c(u.value)} r="3"
                stroke=${l.colour} fill=${l.joined?l.colour:"none"}>
                <title>${l.name} ${u.value}</title></circle>`)}`)}
    </svg>
    <ul class="legend">
      ${r.series.filter(l=>l.points.length>0).map(l=>o`<li>
              ${l.joined?o`<span class="swatch" style="background:${l.colour}"></span>`:o`<span class="swatch hollow" style="border-color:${l.colour}"></span>`}${l.name}
            </li>`)}
      ${r.lines.map(l=>o`<li><span class="dash" style="border-color:${l.colour}"></span>${l.label}</li>`)}
    </ul>
  `}function Ee(r,e,t,s){let i=[];for(let n=t-1;n>=0;n--)i.push({day:_(e,-n),segments:[]});for(let[n,a]of r){let c=_e(new Date(n),s),l=_e(new Date(a),s);for(let u of i){let g=c.day===u.day?c.minutes/os:c.day<u.day?0:null,p=l.day===u.day?l.minutes/os:l.day>u.day?1:null;g!==null&&p!==null&&p>g&&u.segments.push({start:g,end:p})}}return i}function Ce(r){let t=r.length*6;return H`
    <svg viewBox="0 0 ${R} ${t}" role="img" class="chart light"
      aria-label=${`Light on and off, last ${String(r.length)} days`}>
      ${r.map((s,i)=>H`
          <rect class="off" x="0" y=${i*6} width=${R} height=${5}></rect>
          ${s.segments.map(n=>H`<rect class="on" x=${n.start*R} y=${i*6}
                width=${(n.end-n.start)*R} height=${5}>
                <title>${s.day}</title></rect>`)}`)}
    </svg>`}var ps=500,ir="The photo is no longer kept.";function nr(r,e){let t=r.photo_url;return t!==null&&r.id===e&&t.startsWith(`/api/tankkeeper/photos/${e}?`)?t:void 0}var us=new WeakMap;function le(r,e,t){let s=us.get(r);s===void 0&&(s=new Map,us.set(r,s));let i=JSON.stringify([e,t]),n=s.get(i);if(n!==void 0)return n;let a=s,c=r.call(e,t).finally(()=>a.delete(i));return a.set(i,c),c}async function or(r,e){let t=[],s=new Set,i;for(;;){let n={kind:"test",since:e,...i===void 0?{}:{until:i},limit:ps},a=(await le(r,"get_log",n)).entries,c=a.filter(l=>!s.has(l.id));for(let l of c)s.add(l.id),t.push(l),i=l.time;if(a.length<ps||c.length===0)return t}}var hs={...Qe,cycle:"Cycle",light:"Light"},tt=class extends h{static{this.properties={...h.properties,address:{type:String},alt:{type:String},shown:{state:!0},large:{state:!0}}}static{this.styles=[v,$`
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
    `]}constructor(){super(),this.address="",this.alt="",this.shown=void 0,this.large=!1}reloadOn(){return["api","address"]}async load(e){let t=ne(this.address),s=t===void 0?void 0:await this.fetch(e,t);return()=>{this.shown=s}}async fetch(e,t){if(t.kind==="photo"){let p=await le(e,"get_photo_check",{check_id:t.id}).catch(m=>{if(!we(m))throw m});return{kind:"photo",url:p===void 0?void 0:nr(p,t.id)}}let{chart:s,days:i}=t;if(s==="light"){let p=await le(e,"get_light",{days:i});return{kind:"light",lights:p.lights.map(f=>({model:f.model,rows:Ee(f.on_periods,p.today,i,e.timeZone)}))}}let n=_(O(new Date,e.timeZone),-i),[a,c]=await Promise.all([or(e,n),le(e,"get_status")]),l=hs[s];if(s==="cycle")return{kind:"chart",chart:Ae(a,c.settings),label:l};let u=await le(e,"get_tank");return{kind:"chart",chart:et(a,s,c.settings,u.tank.temperature_c,u.water).chart,label:l}}caption(e){return this.alt!==""?this.alt:e.kind==="photo"?"The tank":`${hs[e.chart]}, last ${String(e.days)} days`}open(){this.large=!0,this.updateComplete.then(()=>this.renderRoot.querySelector(".large")?.focus())}close(){this.large=!1,this.updateComplete.then(()=>this.renderRoot.querySelector("button.photo")?.focus())}keydown(e){e.key==="Tab"&&e.preventDefault(),e.key==="Escape"&&this.close()}renderPhoto(e,t){return e===void 0?o`<p class="muted">${ir}</p>`:o`<button
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
            </div>`:d}`}renderShown(e,t){return e.kind==="photo"?this.renderPhoto(e.url,t):e.kind==="chart"?ae(e.chart,e.label):e.lights.length===0?o`<p class="muted">No lights yet</p>`:o`${e.lights.map(s=>o`<div class="muted">${s.model}</div>
          ${Ce(s.rows)}`)}`}render(){let e=ne(this.address);if(e===void 0)return o`![${this.alt}](${this.address})`;let t=this.caption(e),s=this.shown;return o`<figure>
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      ${s===void 0?d:this.renderShown(s,t)}
      <figcaption>${t}</figcaption>
    </figure>`}};customElements.define("tk-embed",tt);function Se(r,e){return o`${dr(r.split(`
`),{api:e,left:5})}`}var st=/^\s*```/,fs=/^(#{1,6})\s+(.*)$/,rt=/^\s*[-*]\s+(.*)$/,it=/^\s*\d+[.)]\s+(.*)$/,lr=/`([^`]+)`|!\[([^\]]*)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|(?<![\w*])\*([^*\s](?:[^*]*[^*\s])?)\*(?![\w*])|(?<!\w)_([^_\s](?:[^_]*[^_\s])?)_(?!\w)/g;function dr(r,e){let t=[],s=0,i=n=>{let a=[];for(let c=n.exec(r[s]??"");c!==null;)a.push(c[1]??""),s+=1,c=n.exec(r[s]??"");return a};for(;s<r.length;){let n=r[s]??"",a=fs.exec(n);if(st.test(n)){let c=r.findIndex((u,g)=>g>s&&st.test(u)),l=c===-1?r.length:c;t.push(o`<pre><code>${r.slice(s+1,l).join(`
`)}</code></pre>`),s=l+1}else if(a!==null){let c=X(a[2]??"",e);t.push((a[1]??"").length<=2?o`<h3>${c}</h3>`:o`<h4>${c}</h4>`),s+=1}else if(rt.test(n)){let c=i(rt).map(l=>ms(l,e));t.push(o`<ul>
          ${c}
        </ul>`)}else if(it.test(n)){let c=i(it).map(l=>ms(l,e));t.push(o`<ol>
          ${c}
        </ol>`)}else if(n.trim()==="")s+=1;else{let c=[];for(;s<r.length&&cr(r[s]??"");)c.push(r[s]??""),s+=1;let l=c.map((u,g)=>o`${g>0?o`<br />`:d}${X(u,e)}`);t.push(o`<p>${l}</p>`)}}return t}function ms(r,e){return o`<li>${X(r,e)}</li>`}function cr(r){return r.trim()!==""&&!st.test(r)&&!fs.test(r)&&!rt.test(r)&&!it.test(r)}function X(r,e){let t=[],s=0;for(let i of r.matchAll(lr)){i.index>s&&t.push(r.slice(s,i.index));let[n,a,c,,l,u,g,p,m]=i;a!==void 0?t.push(o`<code>${a}</code>`):c!==void 0?t.push(pr(c,n,e)):l!==void 0?t.push(o`<strong>${X(l,e)}</strong>`):u!==void 0?t.push(gs(u,g??"",n,e)):t.push(o`<em>${X(p??m??"",e)}</em>`),s=i.index+n.length}return s<r.length&&t.push(r.slice(s)),t}function gs(r,e,t,s){return/^https?:\/\//i.test(e)?o`<a href=${e} target="_blank" rel="noopener noreferrer"
    >${X(r,s)}</a
  >`:t}function pr(r,e,t){let s=e.slice(r.length+4,-1),{api:i}=t;return i===void 0||t.left===0||ne(s)===void 0?r===""?e:o`!${gs(r,s,e.slice(1),t)}`:(t.left-=1,o`<tk-embed .api=${i} .address=${s} .alt=${r}></tk-embed>`)}var vs=(r,e,t)=>{let s=new Map;for(let i=e;i<=t;i++)s.set(r[i],i);return s},w=G(class extends M{constructor(r){if(super(r),r.type!==N.CHILD)throw Error("repeat() can only be used in text expressions")}dt(r,e,t){let s;t===void 0?t=e:e!==void 0&&(s=e);let i=[],n=[],a=0;for(let c of r)i[a]=s?s(c,a):a,n[a]=t(c,a),a++;return{values:n,keys:i}}render(r,e,t){return this.dt(r,e,t).values}update(r,[e,t,s]){let i=Zt(r),{values:n,keys:a}=this.dt(e,t,s);if(!Array.isArray(i))return this.ut=a,n;let c=this.ut??=[],l=[],u,g,p=0,m=i.length-1,f=0,k=n.length-1;for(;p<=m&&f<=k;)if(i[p]===null)p++;else if(i[m]===null)m--;else if(c[p]===a[f])l[f]=V(i[p],n[f]),p++,f++;else if(c[m]===a[k])l[k]=V(i[m],n[k]),m--,k--;else if(c[p]===a[k])l[k]=V(i[p],n[k]),Y(r,l[k+1],i[p]),p++,k--;else if(c[m]===a[f])l[f]=V(i[m],n[f]),Y(r,i[p],i[m]),m--,f++;else if(u===void 0&&(u=vs(a,f,k),g=vs(c,p,m)),u.has(c[p]))if(u.has(c[m])){let L=g.get(a[f]),De=L!==void 0?i[L]:null;if(De===null){let Et=Y(r,i[p]);V(Et,n[f]),l[f]=Et}else l[f]=V(De,n[f]),Y(r,i[p],De),i[L]=null;f++}else be(i[m]),m--;else be(i[p]),p++;for(;f<=k;){let L=Y(r,l[k+1]);V(L,n[f]),l[f++]=L}for(;p<=m;){let L=i[p++];L!==null&&be(L)}return this.ut=a,Z(r,l),T}});function Re(r){let e=Array.from(r.snippet),t=(s,i)=>e.slice(s,i).join("");return o`<span class="snippet pre"
    >${t(0,r.start)}<mark>${t(r.start,r.end)}</mark>${t(r.end)}</span
  >`}var de="tk-conversation-deleted";function ys(r,e,t){return`${String(r)} ${r===1?e:t}`}var nt=class extends x{static{this.properties={api:{attribute:!1},conversationId:{attribute:!1},disabled:{attribute:!1},asked:{state:!0},error:{state:!0},busy:{state:!0}}}static{this.styles=[v,$`
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
    `]}constructor(){super(),this.api=void 0,this.conversationId="",this.disabled=!1,this.asked=void 0,this.error="",this.busy=!1}async attempt(e){let t=this.api;if(t!==void 0){this.busy=!0,this.error="";try{await e(t)}catch(s){this.asked=void 0,this.error=B(s)}finally{this.busy=!1}}}async ask(){await this.attempt(async e=>{this.asked=await e.call("delete_conversation",{id:this.conversationId})}),await this.focusOn("button.cancel")}async confirm(e){let t=this.conversationId;await this.attempt(async s=>{await s.call("delete_conversation",{id:t,code:e}),this.asked=void 0,this.dispatchEvent(new CustomEvent(de,{detail:t,bubbles:!0,composed:!0}))})}async cancel(){this.asked=void 0,await this.focusOn("button.delete")}async focusOn(e){await this.updateComplete,this.shadowRoot?.querySelector(e)?.focus()}renderAsked(e){let t=e.messages===1?"goes":"go",s=e.changes===1?"stays":"stay";return o`<div class="confirm" role="alertdialog" aria-labelledby="ask">
      <p id="ask" class="pre">
        Delete "${e.name}"? Its ${ys(e.messages,"message","messages")} ${t}. The
        ${ys(e.changes,"change","changes")} made in it ${s} in the history, and Undo
        still works.
      </p>
      <div class="row">
        <button
          class="cancel"
          ?disabled=${this.busy}
          @click=${()=>{this.cancel()}}
        >
          Cancel
        </button>
        <button
          class="confirm confirm-delete"
          ?disabled=${this.disabled||this.busy}
          @click=${()=>{this.confirm(e.code)}}
        >
          Delete conversation
        </button>
      </div>
    </div>`}render(){return o`<button
        class="delete"
        ?disabled=${this.disabled||this.busy||this.asked!==void 0}
        @click=${()=>{this.ask()}}
      >
        Delete
      </button>
      ${this.asked===void 0?d:this.renderAsked(this.asked)}
      ${this.error?o`<p class="error">${this.error}</p>`:d}`}};customElements.define("tk-delete-conversation",nt);var $s=50,ce="panel_",ur="tk-open-chat",ot=class extends h{static{this.properties={...h.properties,active:{attribute:!1},stamp:{attribute:!1},locked:{attribute:!1},conversations:{state:!0},query:{state:!0},renaming:{state:!0},draftTitle:{state:!0}}}static{this.styles=[v,$`
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
    `]}constructor(){super(),this.active="",this.stamp=0,this.locked="",this.conversations=void 0,this.query="",this.renaming=void 0,this.draftTitle="",this.addEventListener(de,()=>{this.reload()})}reloadOn(){return["api","query","stamp"]}async load(e){let t=this.query===""?await e.call("list_conversations",{limit:$s}):await e.call("search_conversations",{query:this.query,limit:$s});return()=>{this.conversations=t.conversations}}search(e){e.preventDefault();let t=e.target.querySelector("input");this.query=(t?.value??"").trim()}open(e){let t=e.match?.index??null;this.dispatchEvent(new CustomEvent(ur,{detail:{id:e.id,index:t},bubbles:!0,composed:!0}))}async startRename(e){this.renaming=e.id,this.draftTitle=e.title,this.error="",await this.updateComplete,this.shadowRoot?.querySelector("input.title")?.focus()}async rename(e,t){e.preventDefault();let s=this.draftTitle.trim();if(s===""){this.renaming=void 0;return}await this.run(n=>n.call("rename_conversation",{id:t,title:s}))&&(this.renaming=void 0)}renderName(e){if(this.renaming===e.id)return o`<form
        class="rename"
        @submit=${i=>this.rename(i,e.id)}
      >
        <input
          class="title"
          aria-label="Chat title"
          maxlength="200"
          placeholder=${e.name}
          .value=${this.draftTitle}
          @input=${i=>{this.draftTitle=i.target.value}}
          @keydown=${i=>{i.key==="Escape"&&(this.renaming=void 0)}}
        />
      </form>`;let t=!e.id.startsWith(ce),s=ts(e.updated);return o`<button
      class="open"
      aria-current=${e.id===this.active?"true":"false"}
      @click=${()=>{this.open(e)}}
    >
      <span class="name">${e.name}</span>
      <span class="muted"
        >${t?`${s} \xB7 ${S(e.source)}, read only`:s}</span
      >
      ${e.match===void 0?d:Re(e.match)}
    </button>`}renderItem(e){return o`<li
      data-id=${e.id}
      class=${e.id===this.active?"active":""}
    >
      ${this.renderName(e)}
      <div class="row actions">
        <button
          class="rename"
          ?disabled=${this.busy}
          @click=${()=>this.startRename(e)}
        >
          Rename
        </button>
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
        ${w(e??[],t=>t.id,t=>this.renderItem(t))}
      </ul>`}};customElements.define("tk-chat-list",ot);var hr="TankKeeper's Assist agent is missing. Reload TankKeeper in Settings, Devices & services.",mr="Choose the conversation agent in TankKeeper's Claude settings first: Settings, Devices & services, TankKeeper, Configure.",Pe=200,bs=200,fr=new Set(["user","assistant","error"]);function ks(){return`panel_${[...crypto.getRandomValues(new Uint8Array(16))].map(e=>e.toString(16).padStart(2,"0")).join("")}`}function at(r){return r.length<=bs?r:`${r.slice(0,bs-1)}\u2026`}async function gr(r,e){let{kind:t,id:s}=e;if(t==="proposal"){let i=await r.call("list_proposals",{state:"all",limit:Pe}).then(n=>n.proposals.find(a=>a.proposal_id===s)).catch(()=>{});return i===void 0?`Let's discuss the waiting change ${s}.`:`Let's discuss the waiting change "${at(i.summary)}" (proposal ${s}).`}if(t==="photo"){let i=await r.call("list_photos",{limit:Pe}).then(n=>n.photos.find(a=>a.id===s)?.summary).catch(()=>{});return i==null?`Let's discuss photo check ${s}.`:`Let's discuss what the camera saw: "${at(i)}" (photo check ${s}).`}if(t==="review"){let i=await r.call("get_reviews",{limit:Pe}).then(n=>n.reviews.find(a=>a.id===s)).catch(()=>{});return i===void 0?`Let's discuss review ${s}.`:`Let's discuss the review "${at(i.result)}" (review ${s}).`}return"Let's discuss the tank's status now."}var lt=class extends h{constructor(){super();this.scrollToFound=!1;this.conversationId=ks();this.recorded=!1;this.resuming=!1;this.begun=0;this.start=void 0,this.agent=void 0,this.messages=[],this.draft="",this.sending=!1,this.changes=[],this.proposals=[],this.readOnly=!1,this.listOpen=!1,this.found=null}static{this.properties={...h.properties,start:{attribute:!1},agent:{state:!0},messages:{state:!0},draft:{state:!0},sending:{state:!0},changes:{state:!0},proposals:{state:!0},readOnly:{state:!0},listOpen:{state:!0},found:{state:!0}}}static{this.styles=[v,$`
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
    `]}reloadOn(){return["api","start"]}willUpdate(t){t.has("start")&&this.begin(this.start),super.willUpdate(t)}begin(t){this.begun+=1;let s=t?.kind==="resume";this.conversationId=s?t.id:ks(),this.recorded=s,this.resuming=s,this.readOnly=s&&!t.id.startsWith(ce),this.found=null,this.scrollToFound=!1,this.messages=[],this.draft="",this.sending=!1,this.changes=[],this.proposals=[],this.error="";let i=this.api;if(t===void 0||s||i===void 0)return;let n=this.begun;gr(i,t).then(a=>{n===this.begun&&this.draft===""&&(this.draft=a)})}async load(t){let s=this.conversationId,[i,n,a]=await Promise.all([t.chatAgent(),t.call("list_proposals",{state:"pending",limit:Pe}),this.recorded?this.saved(t,s):void 0]);return()=>{if(this.agent=i,a===null){this.begin(void 0);return}this.proposals=n.proposals.filter(c=>c.conversation_id===s),this.changes=a?.changes??[],this.resuming&&a!==void 0&&(this.resuming=!1,this.messages=a.messages.map((c,l)=>({...c,index:l})).filter(c=>fr.has(c.role)),this.messages.some(c=>c.index===this.found)||(this.found=null,this.scrollToFound=!1))}}async saved(t,s){try{return await t.call("get_conversation",{id:s})}catch(i){if(!this.resuming&&we(i))return null;throw i}}connectedCallback(){super.connectedCallback(),this.hasUpdated&&this.reload()}ready(){let t=this.agent;return t?.ready===!0&&t.agent_id!==null?t.agent_id:void 0}missing(){return this.agent?.ready===!0?hr:mr}async send(){let t=this.api,s=this.ready(),i=this.draft.trim();if(t===void 0||s===void 0||i===""||this.sending)return;let n=this.begun;this.messages=[...this.messages,{role:"user",text:i}],this.draft="",this.sending=!0;let a;try{let c=await t.converse(i,this.conversationId,s);if(n!==this.begun)return;this.conversationId=c.conversation_id??this.conversationId,this.recorded=!0;let l=c.response.speech?.plain?.speech??"";a={role:c.response.response_type==="error"?"error":"assistant",text:l}}catch(c){if(n!==this.begun)return;a={role:"error",text:B(c)}}this.messages=[...this.messages,a],this.sending=!1,await this.reload()}newChat(){this.begin(void 0),this.reload()}open(t){this.begin({kind:"resume",id:t.id}),this.found=t.index,this.scrollToFound=t.index!==null,this.listOpen=!1,this.reload()}deleted(t){t===this.conversationId&&this.newChat()}updated(t){if(super.updated(t),!this.scrollToFound)return;let s=this.shadowRoot?.querySelector(".message.found");s!=null&&(this.scrollToFound=!1,s.scrollIntoView({block:"center"}))}async act(t){await this.run(t)&&this.changed()}keydown(t){t.key!=="Enter"||t.shiftKey||t.isComposing||(t.preventDefault(),this.send())}renderMessage(t){let s=t.index!==void 0&&t.index===this.found;return o`<div
      class="message ${t.role}${s?" found":""}"
      data-index=${t.index??d}
    >
      ${t.role==="assistant"?Se(t.text,this.api):o`<div class="pre">${t.text}</div>`}
    </div>`}renderLinked(){return o`${this.changes.length===0?d:o`<h3>Changes made in this chat</h3>
            <ul class="changes">
              ${this.changes.map(t=>o`<li>
                    <div class="row">
                      <span class="grow">${t.summary}</span>
                      <button
                        class="undo"
                        ?disabled=${this.busy}
                        @click=${()=>this.act(s=>s.call("undo_change",{history_id:t.id}))}
                      >
                        Undo
                      </button>
                    </div>
                    <div class="muted">${b(t.time)}</div>
                    ${t.changes.map(s=>o`<div class="muted">${A(s)}</div>`)}
                  </li>`)}
            </ul>`}
    ${this.proposals.length===0?d:o`<h3>Waiting for you</h3>
            <ul class="waiting">
              ${this.proposals.map(t=>o`<li data-id=${t.proposal_id}>
                    <strong class="pre">${t.summary}</strong>
                    <div class="pre">${t.reason}</div>
                    ${t.changes.map(s=>o`<div class="muted">${A(s)}</div>`)}
                    <div class="row">
                      <button
                        class="reject"
                        ?disabled=${this.busy}
                        @click=${()=>this.act(s=>s.reject(t.proposal_id))}
                      >
                        Reject
                      </button>
                      <button
                        class="accept primary"
                        ?disabled=${this.busy}
                        @click=${()=>this.act(s=>s.accept(t.proposal_id))}
                      >
                        Accept
                      </button>
                    </div>
                  </li>`)}
            </ul>`}`}renderMessages(){return o`<div class="messages">
      ${this.messages.map(t=>this.renderMessage(t))}
      ${this.sending?o`<div class="muted">Thinking…</div>`:d}
    </div>`}renderComposer(){return o`<form
      class="send"
      @submit=${t=>{t.preventDefault(),this.send()}}
    >
      <textarea
        aria-label="Message"
        placeholder="Ask about the tank"
        .value=${ns(this.draft)}
        ?disabled=${this.sending}
        @input=${t=>{this.draft=t.target.value}}
        @keydown=${t=>{this.keydown(t)}}
      ></textarea>
      <div class="row">
        <span class="grow muted">Enter sends, Shift+Enter adds a line.</span>
        <button class="primary" type="submit" ?disabled=${this.sending}>Send</button>
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
          <button
            class="chats"
            aria-controls="chat-list"
            aria-expanded=${this.listOpen?"true":"false"}
            @click=${()=>{this.listOpen=!this.listOpen}}
          >
            Chats
          </button>
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
        ${this.renderMessages()}
        ${this.readOnly?o`<p class="muted read-only">
                Read only. Only chats started here in the panel can go on. Start a New chat to ask
                more.
              </p>`:t?this.renderComposer():d}
        ${this.renderLinked()}
      </section>
    </div>`}};customElements.define("tk-chat",lt);var vr=[{name:"agent",label:"Conversation agent TankKeeper chats through",type:"text"},{name:"ai_task",label:"AI task entity for review comments",type:"text"},{name:"review_on",label:"Review after",type:"list"},{name:"comments",label:"Claude comments on reviews",type:"checkbox"},{name:"daily_time",label:"Daily review at",type:"time"},{name:"daily_cap",label:"Claude comments a day, at most",type:"number"}],yr=20,$r={test:"Test",task:"Task",status:"Status change",daily:"Daily"};function br(r){let e=r.triggers.map(s=>$r[s]??s).join(", "),t=r.proposal_ids.length;return o`<li class="review">
    <div class="muted">${b(r.time)} · ${e}</div>
    <div>${r.result}</div>
    ${r.comment===null?d:o`<div class="comment">Claude: ${r.comment}</div>`}
    ${r.note===null?d:o`<div class="muted">${r.note}</div>`}
    ${t===0?d:o`<div class="muted">
            ${t} plan ${t===1?"change":"changes"} proposed
          </div>`}
  </li>`}var dt=class extends h{static{this.properties={...h.properties,settings:{state:!0},reviews:{state:!0}}}static{this.styles=v}constructor(){super(),this.settings=void 0,this.reviews=[]}async load(e){let[t,s]=await Promise.all([e.call("get_claude"),e.call("get_reviews",{limit:yr})]);return()=>{this.settings=t,this.reviews=s.reviews}}render(){let e=this.settings;return o`<section>
      <h2>Claude</h2>
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      ${e===void 0?d:o`<p class="muted note">${e.model_note}</p>
              ${U(vr,e)}
              ${E(this.api,"settings","claude",this.version)}`}
      <h3>Reviews</h3>
      ${this.reviews.length===0?o`<p class="muted">No reviews yet.</p>`:o`<ul class="reviews">
              ${this.reviews.map(br)}
            </ul>`}
    </section>`}};customElements.define("tk-claude",dt);var ws=50,ct=class extends h{static{this.properties={...h.properties,conversations:{state:!0},query:{state:!0},selected:{state:!0},detail:{state:!0}}}static{this.styles=v}constructor(){super(),this.conversations=[],this.query="",this.selected=void 0,this.detail=void 0,this.addEventListener(de,()=>{this.selected=void 0})}reloadOn(){return["api","query","selected"]}async load(e){let t=this.selected;if(t!==void 0){let i=await e.call("get_conversation",{id:t});return()=>{this.detail=i}}let s=this.query===""?await e.call("list_conversations",{limit:ws}):await e.call("search_conversations",{query:this.query,limit:ws});return()=>{this.detail=void 0,this.conversations=s.conversations}}search(e){e.preventDefault();let t=e.target.querySelector("input");this.query=(t?.value??"").trim()}async undo(e){await this.run(t=>t.call("undo_change",{history_id:e.id}))&&this.changed()}renderDetail(e){return o`<section>
      <div class="row">
        <button class="back" @click=${()=>this.selected=void 0}>Back</button>
        <h2 class="grow">${e.name}</h2>
        ${e.id.startsWith(ce)?o`<button
                class="resume"
                @click=${()=>{J(this,{kind:"resume",id:e.id})}}
              >
                Continue in Chat
              </button>`:d}
        <tk-delete-conversation
          .api=${this.api}
          .conversationId=${e.id}
        ></tk-delete-conversation>
      </div>
      <div class="muted">${S(e.source)} · ${b(e.started)}</div>
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      <p class="pre">${e.summary}</p>
      <h3>Messages</h3>
      <ul>
        ${e.messages.map(t=>o`<li class=${t.role}>
              <div class="role muted">${t.role}</div>
              ${t.role==="assistant"?Se(t.text,this.api):o`<div class="pre">${t.text}</div>`}
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
              <div class="muted">${b(t.time)} · ${S(t.source)}</div>
              ${t.changes.map(s=>o`<div class="muted">${A(s)}</div>`)}
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
        ${w(this.conversations,e=>e.id,e=>o`<li data-id=${e.id}>
              <div class="row">
                <strong class="grow">${e.name}</strong>
                <button class="open" @click=${()=>this.selected=e.id}>Open</button>
              </div>
              <div class="muted">
                ${S(e.source)} · ${b(e.updated)}
              </div>
              ${e.match===void 0?d:Re(e.match)}
              <div class="pre">${e.summary}</div>
            </li>`)}
      </ul>
    </section>`}};customElements.define("tk-conversations",ct);var xs=r=>r??d;var kr=["mon","tue","wed","thu","fri","sat","sun"];function wr(r){return r.charAt(0).toUpperCase()+r.slice(1)}function xr(r,e){return[...r.querySelectorAll(`input[name="${e}"]`)].filter(t=>t.checked).map(t=>t.value)}function _r(r,e){if(r.type==="weekdays")return xr(e,r.name);let t=e.elements.namedItem(r.name);return r.type==="checkbox"?t.checked:Ar(r,t.value)}function Tr(r){return r==null?"":Array.isArray(r)?r.map(String).join(`
`):typeof r=="string"||typeof r=="number"||typeof r=="boolean"?String(r):JSON.stringify(r)}function Ar(r,e){return r.type==="number"?e.trim()===""?null:Number(e):r.type==="list"?e.split(`
`).map(t=>t.trim()).filter(t=>t!==""):e}function Er(r){return r===""||r===null||r===!1||Array.isArray(r)&&r.length===0}function Cr(r,e,t){let s={};for(let i of r){let n=_r(i,e),a=t[i.name];Er(n)&&a==null||JSON.stringify(n)!==JSON.stringify(a)&&(s[i.name]=n)}return s}var pt=class extends x{static{this.properties={fields:{attribute:!1},values:{attribute:!1},submitLabel:{attribute:!1},busy:{type:Boolean},error:{attribute:!1}}}constructor(){super(),this.fields=[],this.values={},this.submitLabel="Save",this.busy=!1,this.error=""}static{this.styles=$`
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
  `}weekdays(e){let t=this.values[e.name],s=Array.isArray(t)?t.map(String):[];return o`<fieldset>
      <legend>${e.label}</legend>
      ${kr.map(i=>o`<label class="day"
            ><input
              name=${e.name}
              type="checkbox"
              value=${i}
              .checked=${s.includes(i)}
            />${wr(i)}</label
          >`)}
    </fieldset>`}input(e){let t=Tr(this.values[e.name]);return e.type==="select"?o`<select name=${e.name} ?required=${e.required===!0} .value=${t}>
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
      step=${xs(e.step??(e.type==="number"?"any":void 0))}
      ?required=${e.required===!0}
      .value=${t}
    />`}reset(){this.renderRoot.querySelector("form")?.reset()}submit(e){e.preventDefault();let t=Cr(this.fields,e.target,this.values);this.dispatchEvent(new CustomEvent("tk-save",{detail:t,bubbles:!0,composed:!0}))}render(){return o`<form
      @submit=${e=>{this.submit(e)}}
    >
      ${this.fields.map(e=>e.type==="weekdays"?this.weekdays(e):o`<label>${e.label} ${this.input(e)}</label>`)}
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      <button type="submit" ?disabled=${this.busy}>${this.submitLabel}</button>
    </form>`}};customElements.define("tk-form",pt);async function P(r,e){let t=r.target;await e(r.detail)&&t.reset()}var Sr=["proposed","accepted","replaced"],_s=[{name:"title",label:"Title",type:"text"},{name:"decision",label:"Decision",type:"textarea"},{name:"why",label:"Why",type:"textarea"},{name:"open",label:"Open points, one per line",type:"list"},{name:"date",label:"Date",type:"date"}],Rr=[..._s,{name:"status",label:"Status",type:"select",options:["proposed","accepted"]}],Pr=[{name:"replaced_by",label:"Replaced by decision number",type:"number",step:"1"}];function Le(r){return String(r).padStart(4,"0")}var ut=class extends h{static{this.properties={...h.properties,decisions:{state:!0},status:{state:!0},selected:{state:!0},detail:{state:!0}}}static{this.styles=v}constructor(){super(),this.decisions=[],this.status="",this.selected=void 0,this.detail=void 0}reloadOn(){return["api","status","selected"]}async load(e){let t=this.status===""?{}:{status:this.status},{decisions:s}=await e.call("list_decisions",t),i=this.selected===void 0?void 0:await e.call("get_decision",{number:this.selected});return()=>{this.decisions=s,this.detail=i}}async save(e,t,s){if(e!=="accept"&&Object.keys(t).length===0)return!1;let i=s===void 0?{action:e,...t}:{action:e,number:s,...t},n=await this.run(a=>a.call("set_decision",i));return n&&this.changed(),n}toggle(e){this.selected=this.selected===e?void 0:e}renderDetail(e){return o`<div class="card">
      <p class="pre">${e.decision}</p>
      <h3>Why</h3>
      <p class="pre">${e.why}</p>
      ${e.open.length>0?o`<h3>Open points</h3>
              <ul>
                ${e.open.map(t=>o`<li>${t}</li>`)}
              </ul>`:d}
      ${e.replaced_by===null?d:o`<p class="muted">Replaced by ${Le(e.replaced_by)}</p>`}
      ${e.replaces.length>0?o`<p class="muted">Replaces ${e.replaces.map(Le).join(", ")}</p>`:d}
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
          .fields=${_s}
          .values=${e}
          .busy=${this.busy}
          @tk-save=${t=>this.save("update",t.detail,e.number)}
        ></tk-form>
      </details>
      <details>
        <summary>Replace</summary>
        <tk-form
          class="replace"
          .fields=${Pr}
          submitLabel="Replace"
          .busy=${this.busy}
          @tk-save=${t=>P(t,s=>this.save("replace",s,e.number))}
        ></tk-form>
      </details>
      <tk-history
        .api=${this.api}
        .collection=${"decisions"}
        .recordId=${Le(e.number)}
        .stamp=${this.version}
      ></tk-history>
    </div>`}renderDecision(e){let t=this.selected===e.number;return o`<li data-number=${e.number}>
      <div class="row">
        <strong class="grow">${Le(e.number)} ${e.title}</strong>
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
            ${Sr.map(e=>o`<option value=${e}>${e}</option>`)}
          </select>
        </div>
        ${this.error?o`<p class="error">${this.error}</p>`:d}
        <ul>
          ${w(this.decisions,e=>e.number,e=>this.renderDecision(e))}
        </ul>
      </section>
      <section>
        <h2>Add a decision</h2>
        <tk-form
          class="add"
          .fields=${Rr}
          submitLabel="Add"
          .busy=${this.busy}
          @tk-save=${e=>P(e,t=>this.save("add",t))}
        ></tk-form>
      </section>
    `}};customElements.define("tk-decisions",ut);var Lr=100,Dr=["all","dose","test","event"],Ir=[["ammonia","Ammonia (ppm)"],["nitrite","Nitrite (ppm)"],["nitrate","Nitrate (ppm)"],["phosphate","Phosphate (ppm)"],["ph","pH"],["kh","KH (dKH)"],["gh","GH (dGH)"],["temperature_c","Temperature (\xB0C)"]],Nr=[{name:"source",label:"Water",type:"select",options:["tank","tap"]},...Ir.map(([r,e])=>({name:r,label:e,type:"number"})),{name:"notes",label:"Notes",type:"textarea"}],ht=class extends h{static{this.properties={...h.properties,entries:{state:!0},kind:{state:!0},products:{state:!0}}}static{this.styles=v}constructor(){super(),this.entries=[],this.kind="all",this.products=[]}reloadOn(){return["api","kind"]}async load(e){let[t,s]=await Promise.all([e.call("get_log",{kind:this.kind,limit:Lr}),e.call("list_products")]);return()=>{this.entries=t.entries,this.products=s.products.map(i=>i.name)}}doseFields(){return[{name:"product",label:"Product",type:"select",options:this.products,required:!0},{name:"amount_ml",label:"Amount (ml)",type:"number",required:!0},{name:"why",label:"Why",type:"text"},{name:"notes",label:"Notes",type:"textarea"}]}async record(e,t){let s=await this.run(i=>i.call(e,t));return s&&this.changed(),s}async recordTest(e){if(Object.keys(e).length===0)return!1;let{source:t,notes:s,...i}=e,n={values:i};return t!==void 0&&(n.source=t),s!==void 0&&(n.notes=s),this.record("record_test",n)}render(){return o`
      <section>
        <div class="row">
          <h2 class="grow">Log</h2>
          <select
            class="kind"
            aria-label="Kind"
            .value=${this.kind}
            @change=${e=>this.kind=e.target.value}
          >
            ${Dr.map(e=>o`<option value=${e}>${e}</option>`)}
          </select>
        </div>
        ${this.error?o`<p class="error">${this.error}</p>`:d}
        <ul>
          ${this.entries.map(e=>o`<li>
                <div class="pre">${ss(e)}</div>
                <div class="muted">${b(e.time)}</div>
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
          @tk-save=${e=>P(e,t=>this.record("record_dose",t))}
        ></tk-form>
      </section>
      <section>
        <h2>Record a test</h2>
        <tk-form
          class="test"
          .fields=${Nr}
          submitLabel="Record"
          .busy=${this.busy}
          @tk-save=${e=>P(e,t=>this.recordTest(t))}
        ></tk-form>
      </section>
    `}};customElements.define("tk-log",ht);var Or=20,Hr=[{name:"camera",label:"Camera entity, such as a Tapo C100",type:"text"},{name:"check_time",label:"Daily check at, only while a light is on",type:"time"},{name:"after_test",label:"Check after each test",type:"checkbox"},{name:"alerts",label:"Alert me about issues",type:"checkbox"},{name:"keep_days",label:"Keep photos for (days)",type:"number"}],Mr={daily:"Daily",test:"After a test",manual:"Check now",chat:"Asked in a chat"},Vr=[["water","Water"],["algae","Algae"],["plants","Plants"],["level","Water level"]];function mt(r){return r.photo_url===null?d:o`<img class="photo" src=${r.photo_url} alt="The tank at ${b(r.time)}" />`}function ft(r){return`${b(r.time)} \xB7 ${Mr[r.reason]}`}function gt(r){let e=Vr.filter(([t])=>r.seen[t]!==void 0);return o`
    ${r.summary===null?d:o`<div class="summary">${r.summary}</div>`}
    ${r.suggestion===null?d:o`<div>Suggested: ${r.suggestion}</div>`}
    ${e.length===0?d:o`<ul class="seen">
            ${e.map(([t,s])=>o`<li><strong>${s}</strong> ${r.seen[t]}</li>`)}
          </ul>`}
    ${r.note===null?d:o`<div class="muted note">${r.note}</div>`}
  `}var vt=class extends h{static{this.properties={...h.properties,stamp:{type:Number},info:{state:!0},photos:{state:!0},proposals:{state:!0}}}static{this.styles=[v,$`
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
    `]}constructor(){super(),this.stamp=0,this.info=void 0,this.photos=void 0,this.proposals=[]}reloadOn(){return["api","stamp"]}async load(e){let[t,s]=await Promise.all([e.call("get_camera"),e.call("list_proposals",{state:"pending"})]);return()=>{this.info=t,this.proposals=s.proposals,t.camera===null&&(this.photos=void 0)}}async act(e){await this.run(e)&&this.changed()}async showPhotos(){await this.run(async e=>{let t=await e.call("list_photos",{limit:Or});this.photos=t.photos})}renderIssue(e){let t=this.proposals.filter(s=>e.proposal_ids.includes(s.proposal_id));return o`<li class="issue" data-check=${e.id}>
      <div class="muted">${ft(e)}</div>
      ${mt(e)} ${gt(e)}
      ${t.length===0?d:o`<div class="waiting">
              <div class="muted">Accept applies:</div>
              ${t.map(s=>o`<div class="proposal">
                    <strong class="pre">${s.summary}</strong>
                    ${s.changes.map(i=>o`<div class="muted">${A(i)}</div>`)}
                  </div>`)}
            </div>`}
      <div class="row">
        <button
          class="dismiss"
          ?disabled=${this.busy}
          @click=${()=>this.act(s=>s.call("dismiss_finding",{check_id:e.id}))}
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
          @click=${()=>this.act(s=>s.rejectFinding(e.id))}
        >
          Reject
        </button>
        <button
          class="accept primary"
          ?disabled=${this.busy}
          @click=${()=>this.act(s=>s.acceptFinding(e.id))}
        >
          Accept
        </button>
      </div>
    </li>`}renderPhotos(){let e=this.photos;return e===void 0?o`<button class="photos" ?disabled=${this.busy} @click=${()=>this.showPhotos()}>
        Photos
      </button>`:o`<h3>Photos</h3>
      ${e.length===0?o`<p class="muted">No photos yet.</p>`:d}
      <ul class="photos">
        ${w(e,t=>t.id,t=>o`<li class="photo-check">
              <div class="muted">${ft(t)}</div>
              ${mt(t)} ${gt(t)}
            </li>`)}
      </ul>`}renderSettings(e){return o`<details class="settings">
      <summary>Camera settings</summary>
      <p class="muted">
        Each check sends the photo to Anthropic through the AI task entity, uses paid API calls and
        counts toward Claude's comments a day.
      </p>
      ${U(Hr,e)} ${E(this.api,"settings","camera",this.version)}
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
        ${s===null?o`<p class="muted">No photo yet.</p>`:o`<div class="latest">
                <div class="muted">${ft(s)}</div>
                ${mt(s)} ${gt(s)}
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
                ${w(e.open,i=>i.id,i=>this.renderIssue(i))}
              </ul>
            </section>`}`}};customElements.define("tk-camera",vt);var Ur=7,Ts=30,Fr=60,As={on_course:"On course",watch:"Watch",act:"Act"},jr={cycling:"Cycling",cycled:"Cycled"},qr=[{name:"name",label:"Name",type:"text"},{name:"volume_litres",label:"Volume (litres)",type:"number"},{name:"dosing_volume_litres",label:"Water volume for doses (litres)",type:"number"},{name:"temperature_c",label:"Target temperature (\xB0C)",type:"number"},{name:"stage",label:"Stage",type:"select",options:["cycling","cycled"]},{name:"notes",label:"Notes",type:"textarea"}],Wr=[{name:"source",label:"Values come from",type:"select",options:["supplier","tap_test"]},{name:"ph",label:"pH",type:"number"},{name:"kh",label:"KH (dKH)",type:"number"},{name:"gh",label:"GH (dGH)",type:"number"},{name:"nitrate",label:"Nitrate (mg/l)",type:"number"},{name:"phosphate",label:"Phosphate (mg/l)",type:"number"},{name:"notes",label:"Notes",type:"textarea"}],zr=[{name:"nitrogen_watch",label:"Ammonia or nitrite Watch above (ppm)",type:"number"},{name:"nitrogen_act",label:"Ammonia or nitrite Act above (ppm)",type:"number"},{name:"ph_watch",label:"pH Watch under, while cycling",type:"number"},{name:"ph_act",label:"pH Act under, while cycling",type:"number"},{name:"stall_watch_days",label:"Stalled cycle Watch after (days)",type:"number",step:"1"},{name:"stall_act_days",label:"Stalled cycle Act after (days)",type:"number",step:"1"},{name:"test_watch_days",label:"Late test Watch after (days)",type:"number",step:"1"},{name:"test_act_days",label:"Late test Act after (days)",type:"number",step:"1"},{name:"skip_watch",label:"Skipped tasks for Watch",type:"number",step:"1"},{name:"skip_act",label:"Skipped tasks for Act",type:"number",step:"1"},{name:"plan_watch_days",label:"Plan ends within, for Watch (days)",type:"number",step:"1"},{name:"plan_act_days",label:"Plan ends within, for Act (days)",type:"number",step:"1"}],yt=class extends h{static{this.properties={...h.properties,status:{state:!0},tank:{state:!0},plan:{state:!0},log:{state:!0},lights:{state:!0},proposals:{state:!0}}}static{this.styles=v}constructor(){super(),this.status=void 0,this.tank=void 0,this.plan=void 0,this.log=[],this.lights=void 0,this.proposals=[]}async load(e){let t=O(new Date,e.timeZone),[s,i,n,a,c,l]=await Promise.all([e.call("get_status"),e.call("get_tank"),e.call("get_plan",{start:t,end:_(t,Ur)}),e.call("get_log",{kind:"test",since:_(t,-Fr),limit:500}),e.call("get_light",{days:Ts}),e.call("list_proposals",{state:"pending"})]);return()=>{this.status=s,this.tank=i,this.plan=n,this.log=a.entries,this.lights=c,this.proposals=l.proposals}}async act(e){await this.run(e)&&this.changed()}settingsCard(e,t,s,i,n,a){return o`<section id=${e}>
      <h2>${t}</h2>
      ${U(s,i)} ${E(this.api,n,a,this.version)}
    </section>`}renderStatus(e,t){let s=e.status===null?"Not checked yet":As[e.status],i=e.stage===null?"":jr[e.stage];return o`<section id="status">
      <div class="row">
        <h2 class="grow">${t.tank.name}</h2>
        <strong class="level ${e.status??""}">${s}</strong>
      </div>
      <div class="muted">
        ${[i,e.checked===null?"":`checked ${b(e.checked)}`].filter(n=>n!=="").join(" \xB7 ")}
      </div>
      <ul>
        ${e.rules.filter(n=>n.level!=="on_course").map(n=>o`<li>
                <strong>${As[n.level]}</strong> ${n.reason}
                ${n.action===null?d:o`<div>${n.action}</div>`}
              </li>`)}
      </ul>
    </section>`}renderTask(e,t){return o`<li>
      <div class="row">
        <span class="grow">${e.time??""} ${e.text}</span>
        ${t&&e.state==="open"?o`<button
                  class="skip"
                  ?disabled=${this.busy}
                  @click=${()=>this.act(s=>s.call("skip_task",{task_id:e.id}))}
                >
                  Skip
                </button>
                <button
                  class="complete primary"
                  ?disabled=${this.busy}
                  @click=${()=>this.act(s=>s.call("complete_task",{task_id:e.id}))}
                >
                  Complete
                </button>`:o`<span class="muted">${e.state==="open"?"":e.state}</span>`}
      </div>
    </li>`}renderLight(e,t){let{schedule:s,automation:i}=e;return o`<li data-light=${e.id}>
      <div class="row">
        <strong class="grow">${e.model}</strong>
        <span class="muted">${e.state??"unknown"}</span>
      </div>
      ${s===null?o`<div><strong>Needs helpers</strong></div>
              <div class="muted">
                Should run ${e.on} to
                ${e.off}${e.brightness_pct===null?"":`, ${String(e.brightness_pct)}%`}
              </div>`:o`<div>${Br(s)}</div>`}
      ${i===null?d:o`<div class="muted">
              Automation
              ${i.id===null?i.entity_id:o`<a class="automation" href=${`/config/automation/edit/${i.id}`}
                      >${i.entity_id}</a
                    >`}
              (${i.state??"missing"})
            </div>`}
      <div class="muted">Today ${e.today.on} to ${e.today.off}</div>
      ${e.problems.map(n=>o`<div class="error">${n}</div>`)}
      ${Ce(Ee(e.on_periods,t,Ts,this.api?.timeZone))}
      ${E(this.api,"lights",e.id,this.version)}
    </li>`}renderParameters(e,t){let{charts:s,empty:i}=cs(this.log,e.settings,t.tank.temperature_c,t.water);return o`<section id="parameters">
      <h2>Water parameters</h2>
      <div class="charts">
        ${s.map(n=>o`<div class="parameter" data-parameter=${n.key}>
              <h3>${n.label}</h3>
              ${ae(n.chart,n.label)}
            </div>`)}
      </div>
      ${i.length===0?d:o`<p class="muted">No readings yet for: ${i.join(", ")}</p>`}
    </section>`}renderProposal(e){return o`<li>
      <strong class="pre">${e.summary}</strong>
      <div class="pre">${e.reason}</div>
      <div class="muted">${S(e.source)} · ${b(e.created)}</div>
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
    </li>`}render(){let{status:e,tank:t,plan:s,lights:i}=this;if(e===void 0||t===void 0||s===void 0||i===void 0)return this.error?o`<p class="error">${this.error}</p>`:o`<p class="muted">Loading</p>`;let n=O(new Date,this.api?.timeZone),a=s.tasks.filter(l=>l.date===n),c=s.tasks.filter(l=>l.date>n);return o`
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      ${this.renderStatus(e,t)}
      <section id="today">
        <h2>Today</h2>
        ${a.length===0?o`<p class="muted">No tasks today</p>`:d}
        <ul>
          ${w(a,l=>l.id,l=>this.renderTask(l,!0))}
        </ul>
      </section>
      <section id="waiting">
        <h2>Waiting for you</h2>
        ${this.proposals.length===0?o`<p class="muted">Nothing is waiting for you</p>`:d}
        <ul>
          ${w(this.proposals,l=>l.proposal_id,l=>this.renderProposal(l))}
        </ul>
      </section>
      <section id="cycle">
        <h2>Cycle</h2>
        ${ae(Ae(this.log,e.settings),"Cycle")}
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
      ${this.settingsCard("tank","Tank",qr,t.tank,"tank","tank")}
      ${this.settingsCard("water","Water",Wr,t.water??{},"water","water")}
      <section id="light">
        <h2>Light</h2>
        ${i.lights.length===0?o`<p class="muted">No lights yet</p>`:d}
        ${i.next_change===null?d:o`<div class="muted">Next change ${b(i.next_change.time)}</div>`}
        <ul>
          ${w(i.lights,l=>l.id,l=>this.renderLight(l,i.today))}
        </ul>
      </section>
      ${this.settingsCard("rules","Rule limits",zr,e.settings,"settings","rules")}
      <tk-camera .api=${this.api} .stamp=${this.version}></tk-camera>
    `}};customElements.define("tk-overview",yt);function Br(r){let e=[`${r.on??"?"} to ${r.off??"?"}`];return r.brightness_pct!==null&&e.push(`${String(r.brightness_pct)}%`),r.ramp_minutes!==null&&e.push(`${String(r.ramp_minutes)} min ramp`),e.join(", ")}var xt="M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z",Kr=[0,1,2,3,4,5,6],Gr=new Intl.DateTimeFormat("en-GB",{weekday:"short",timeZone:"UTC"}),Yr=/\btest/i;function kt(r){let[e=0,t=1,s=1]=r.split("-").map(Number);return new Date(Date.UTC(e,t-1,s))}function Zr(r){return(kt(r).getUTCDay()+6)%7}function $t(r){return _(r,-Zr(r))}function Jr(r){return Yr.test(r.text)?"test":r.slot==="dose"?"dose":"task"}function bt(r){return`${Gr.format(kt(r))} ${String(kt(r).getUTCDate())}`}var wt=class extends x{static{this.properties={tasks:{attribute:!1},start:{attribute:!1},end:{attribute:!1},today:{attribute:!1},picked:{attribute:!1},week:{state:!0}}}constructor(){super(),this.tasks=[],this.start="",this.end="",this.today="",this.picked=void 0,this.week=void 0}static{this.styles=$`
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
  `}first(){return $t(this.start)}last(){return $t(this.end)}shown(){let e=this.week??$t(this.today);return e<this.first()?this.first():e>this.last()?this.last():e}move(e){this.week=_(this.shown(),7*e),this.fire("tk-week-change",this.week)}fire(e,t){this.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:!0,composed:!0}))}inside(e){return e>=this.start&&e<=this.end}chip(e){let t=Jr(e),s=e.state!=="open",i=["chip",t,...s?["done"]:[]].join(" "),n=[e.text,t,...e.series_id===null?[]:["repeats"],...s?["done"]:[]].join(", ");return o`<button
      class=${i}
      aria-label=${n}
      data-task=${e.id}
      title=${e.text}
      @click=${()=>{this.fire("tk-pick-task",e.id)}}
    >
      ${e.series_id===null?d:o`<ha-svg-icon class="repeat" .path=${xt}></ha-svg-icon>`}<span>${e.text}</span>
    </button>`}render(){let e=this.shown(),t=Kr.map(n=>_(e,n)),s=n=>this.tasks.filter(a=>a.date===n),i=(n,a)=>[a,...n===this.today?["today"]:[],...this.inside(n)?[]:["outside"]].join(" ");return o`<nav>
        <button
          class="prev"
          aria-label="Previous week"
          ?disabled=${e<=this.first()}
          @click=${()=>{this.move(-1)}}
        >
          ‹
        </button>
        <span class="label">${e} to ${_(e,6)}</span>
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
              class=${i(n,"day")}
              data-day=${n}
              aria-current=${n===this.today?"date":d}
            >
              <span class="head">${bt(n)}</span>
              ${s(n).map(a=>this.chip(a))}
            </div>`)}
      </div>
      <div class="strip">
        ${t.map(n=>{let a=s(n).length,c=[...n===this.today?["today"]:[],...n===this.picked?["picked"]:[]].join(" ");return o`<button
            class=${c}
            data-day=${n}
            aria-current=${n===this.today?"date":d}
            aria-pressed=${n===this.picked?"true":"false"}
            aria-label=${`${bt(n)}: ${String(a)} ${a===1?"task":"tasks"}`}
            ?disabled=${!this.inside(n)}
            @click=${()=>{this.fire("tk-pick-day",n)}}
          >
            <span>${bt(n)}</span><span class="count">${a===0?"":String(a)}</span>
          </button>`})}
      </div>`}};customElements.define("tk-week",wt);var Xr=28,Es=[{name:"text",label:"Task",type:"text"},{name:"date",label:"Date",type:"date"},{name:"slot",label:"Slot",type:"select",options:["task","dose"]}],Cs={name:"note",label:"Note",type:"text"},Ss=[{name:"every_days",label:"Repeat every N days",type:"number",step:"1"},{name:"weekdays",label:"Or repeat weekly on",type:"weekdays"},{name:"until",label:"Repeat until",type:"date"}],Qr=[...Es,Cs,...Ss],Rs=[...Es,{name:"state",label:"State",type:"select",options:["open","complete","skip"]},Cs],ei=[...Rs,{name:"scope",label:"Apply to (the repeat changes only for this and later ones)",type:"select",options:["this","future"],required:!0},...Ss],ti=[{name:"notify",label:"Notify services for reminders",type:"list"},{name:"status_notify",label:"Notify services for status alerts",type:"list"},{name:"task_time",label:"Task reminder time",type:"time"},{name:"dose_time",label:"Dose reminder time",type:"time"},{name:"resend_time",label:"Resend open tasks at",type:"time"}],_t=class extends h{static{this.properties={...h.properties,plan:{state:!0},today:{state:!0},day:{state:!0}}}static{this.styles=v}constructor(){super(),this.plan=void 0,this.today="",this.day=void 0}async load(e){let t=O(new Date,e.timeZone),s=await e.call("get_plan",{start:t,end:_(t,Xr-1)});return()=>{this.plan=s,this.today=t,this.day!==void 0&&(this.day<t||this.day>s.end)&&(this.day=void 0)}}async save(e,t,s){if(s===void 0&&Object.keys(t).length===0)return!1;let i=Object.fromEntries(Object.entries(t).filter(([,c])=>!Array.isArray(c)||c.length>0)),n=s===void 0?i:{task_id:s,...i},a=await this.run(c=>c.call(e,n));return a&&this.changed(),a}async showTask(e){this.day=void 0,await this.updateComplete,this.renderRoot.querySelector(`li[data-task="${CSS.escape(e)}"]`)?.scrollIntoView({behavior:"smooth",block:"center"})}keepDayIn(e){this.day!==void 0&&(this.day<e||this.day>_(e,6))&&(this.day=void 0)}pickDay(e){this.day=this.day===e?void 0:e}renderTask(e){let t=this.plan?.series.find(s=>s.id===e.series_id);return o`<li data-task=${e.id}>
      <div class="row">
        ${t===void 0?d:o`<ha-svg-icon class="repeat" .path=${xt} title="Repeats"></ha-svg-icon>`}
        <span class="grow">${e.time??""} ${e.text}</span>
        <button
          class="remove"
          ?disabled=${this.busy}
          @click=${()=>this.save("remove_task",{},e.id)}
        >
          Remove
        </button>
        ${t===void 0?d:o`<button
                class="remove remove-future"
                ?disabled=${this.busy}
                @click=${()=>this.save("remove_task",{scope:"future"},e.id)}
              >
                Remove this and later
              </button>`}
      </div>
      <div class="muted">
        ${[e.state,e.note,t?.repeat].filter(s=>s!=null&&s!=="").join(" \xB7 ")}
      </div>
      <details>
        <summary>Edit and history</summary>
        <tk-form
          .fields=${t===void 0?Rs:ei}
          .values=${t===void 0?e:si(e,t)}
          .busy=${this.busy}
          @tk-save=${s=>this.save("update_task",s.detail,e.id)}
        ></tk-form>
        <tk-history
          .api=${this.api}
          .collection=${"tasks"}
          .recordId=${e.id}
          .stamp=${this.version}
        ></tk-history>
      </details>
    </li>`}render(){let e=this.plan,t=[...new Set(e?.tasks.map(i=>i.date)??[])],s=this.day===void 0?t:t.filter(i=>i===this.day);return o`
      <section>
        <h2>Plan</h2>
        ${this.error?o`<p class="error">${this.error}</p>`:d}
        ${e===void 0?d:o`<tk-week
                .tasks=${e.tasks}
                .start=${e.start}
                .end=${e.end}
                .today=${this.today}
                .picked=${this.day}
                @tk-week-change=${i=>{this.keepDayIn(i.detail)}}
                @tk-pick-task=${i=>this.showTask(i.detail)}
                @tk-pick-day=${i=>{this.pickDay(i.detail)}}
              ></tk-week>`}
        ${this.day===void 0?d:o`<p class="filter muted">
                Showing ${this.day}
                <button
                  @click=${()=>{this.day=void 0}}
                >
                  Show all
                </button>
              </p>`}
        ${e!==void 0&&s.length===0?o`<p class="muted">
                ${this.day===void 0?"No tasks in the next four weeks":`No tasks on ${this.day}`}
              </p>`:d}
        ${s.map(i=>o`<h3>${i}</h3>
              <ul>
                ${w(e?.tasks.filter(n=>n.date===i)??[],n=>n.id,n=>this.renderTask(n))}
              </ul>`)}
      </section>
      <section>
        <h2>Add a task</h2>
        <tk-form
          class="add"
          .fields=${Qr}
          submitLabel="Add"
          .busy=${this.busy}
          @tk-save=${i=>P(i,n=>this.save("add_task",n))}
        ></tk-form>
      </section>
      ${e===void 0?d:o`<section id="reminders">
              <h2>Reminders</h2>
              ${U(ti,e.reminders)}
              ${E(this.api,"settings","reminders",this.version)}
            </section>`}
    `}};function si(r,e){return{...r,scope:"this",every_days:e.every_days,weekdays:e.weekdays,until:e.until}}customElements.define("tk-plan",_t);function y(r){return typeof r=="string"||typeof r=="number"?String(r):""}function ri(r){return r.label_dose??{}}var ii={products:{title:"Products",collection:"products",list:"list_products",key:"products",canShowRemoved:!0,label:r=>y(r.name),lines:r=>{let e=ri(r),t=[y(r.purpose)];if(r.label_dose){let s=r.label_dose_for_tank_ml===void 0?"":` (${y(r.label_dose_for_tank_ml)} ml for this tank)`;t.push(`Label: ${y(e.amount_ml)} ml per ${y(e.per_litres)} l, ${y(e.frequency)}${s}`)}return y(r.your_dose)&&t.push(`Your dose: ${y(r.your_dose)}`),t.push(y(r.notes)),Array.isArray(r.links)&&t.push(r.links.map(y).join(" ")),t}},contents:{title:"Contents",collection:"contents",list:"list_contents",key:"contents",canShowRemoved:!0,label:r=>y(r.name),lines:r=>[[y(r.type),y(r.count),y(r.where),`added ${y(r.added)}`].filter(e=>e!=="").join(" \xB7 "),y(r.notes)]},notes:{title:"Notes",collection:"notes",list:"list_notes",key:"notes",edit:{idArg:"note_id",add:"add_note",update:"update_note",remove:"remove_note",fields:[{name:"kind",label:"Kind",type:"select",options:["question","assumption"]},{name:"topic",label:"Topic",type:"text"},{name:"text",label:"Text",type:"textarea"},{name:"how_to_resolve",label:"How to resolve",type:"textarea"}]},canShowRemoved:!1,label:r=>`${y(r.kind)}: ${y(r.topic)}`,lines:r=>[y(r.text),y(r.how_to_resolve)]}},Tt=class extends h{static{this.properties={...h.properties,kind:{attribute:!1},items:{state:!0},showRemoved:{state:!0}}}static{this.styles=v}constructor(){super(),this.kind="",this.items=[],this.showRemoved=!1}get config(){let e=ii[this.kind];if(e===void 0)throw new Error(`No records called ${this.kind}`);return e}reloadOn(){return["api","kind","showRemoved"]}async load(e){let t=this.config,s=t.canShowRemoved?{include_removed:this.showRemoved}:{},i=(await e.call(t.list,s))[t.key]??[];return()=>{this.items=i}}async save(e,t,s,i){if(Object.keys(s).length===0)return!1;let n=i===void 0?s:{[e.idArg]:i,...s};return this.run(a=>a.call(t,n))}async removeRecord(e,t){await this.run(s=>s.call(e.remove,{[e.idArg]:t}))}status(e,t){return typeof t.removed=="string"?o`<span class="muted">Removed ${t.removed}</span>`:e===void 0?d:o`<button
      class="remove"
      ?disabled=${this.busy}
      @click=${()=>this.removeRecord(e,t.id)}
    >
      Remove
    </button>`}details(e,t){let s=e.edit;return s===void 0?E(this.api,e.collection,t.id,this.version):o`<details>
      <summary>Edit and history</summary>
      <tk-form
        .fields=${s.fields}
        .values=${t}
        .busy=${this.busy}
        @tk-save=${i=>this.save(s,s.update,i.detail,t.id)}
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
      ${e.lines(t).filter(s=>s!=="").map(s=>o`<div class="muted pre">${s}</div>`)}
      ${this.details(e,t)}
    </li>`}add(e){return e===void 0?d:o`<section>
      <h2>Add</h2>
      <tk-form
        class="add"
        .fields=${e.fields}
        submitLabel="Add"
        .busy=${this.busy}
        @tk-save=${t=>P(t,s=>this.save(e,e.add,s))}
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
          ${w(this.items,t=>t.id,t=>this.item(e,t))}
        </ul>
      </section>
      ${this.add(e.edit)}
    `}};customElements.define("tk-records",Tt);var ni=["proposal","photo","review","status"],oi=/^[0-9A-Za-z_-]{1,64}$/;function ai(r){let e=new URLSearchParams(r);for(let t of ni){let s=e.get(t);if(s===null)continue;return(t==="status"?s==="now":oi.test(s))?{kind:t,id:s}:void 0}}var li=[["overview","Overview"],["chat","Chat"],["plan","Plan"],["log","Log"],["contents","Contents"],["products","Products"],["decisions","Decisions"],["notes","Notes"],["conversations","Conversations"],["claude","Claude"]],At=class extends x{constructor(){super();this.chat=document.createElement("tk-chat");this.connection=void 0;this.hass=void 0,this.panel=void 0,this.narrow=!1,this.route=void 0,this.addEventListener(We,t=>{this.openChat(t.detail)}),this.tab="overview",this.api=void 0}static{this.properties={hass:{attribute:!1},panel:{attribute:!1},narrow:{type:Boolean},route:{attribute:!1},tab:{state:!0},api:{state:!0}}}static{this.styles=$`
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
  `}connectedCallback(){super.connectedCallback(),this.followAddress()}followAddress(){let t=ai(window.location.search);window.location.search!==""&&history.replaceState(history.state,"",window.location.pathname),t!==void 0&&this.openChat(t)}openChat(t){this.chat.start={...t},this.tab="chat"}willUpdate(t){t.has("route")&&this.followAddress(),this.updateApi(t),this.chat.api=this.api}updateApi(t){let s=this.hass;if(s===void 0||!(t.has("hass")||t.has("panel")))return;let i=this.panel?.config?.entry_id;this.connection===s.connection&&this.api?.entryId===i||(this.connection=s.connection,this.api=new ke(s.connection,s.config?.time_zone,i))}view(){switch(this.tab){case"chat":return o`${this.chat}`;case"plan":return o`<tk-plan .api=${this.api}></tk-plan>`;case"log":return o`<tk-log .api=${this.api}></tk-log>`;case"decisions":return o`<tk-decisions .api=${this.api}></tk-decisions>`;case"claude":return o`<tk-claude .api=${this.api}></tk-claude>`;case"conversations":return o`<tk-conversations .api=${this.api}></tk-conversations>`;case"contents":case"products":case"notes":return o`${Jt(this.tab,o`<tk-records .api=${this.api} .kind=${this.tab}></tk-records>`)}`;default:return o`<tk-overview .api=${this.api}></tk-overview>`}}render(){return o`
      <header>
        ${this.narrow?o`<ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>`:d}
        <h1>TankKeeper</h1>
        ${is(this.api)}
      </header>
      <nav role="tablist">
        ${li.map(([t,s])=>o`<button
              class="tab"
              role="tab"
              data-tab=${t}
              aria-selected=${this.tab===t?"true":"false"}
              @click=${()=>this.tab=t}
            >
              ${s}
            </button>`)}
      </nav>
      <main>${this.view()}</main>
    `}};customElements.define("tankkeeper-panel",At);export{At as TankkeeperPanel,ai as discussed};
