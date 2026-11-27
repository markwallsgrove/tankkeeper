var pe=globalThis,ue=pe.ShadowRoot&&(pe.ShadyCSS===void 0||pe.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Ie=Symbol(),_t=new WeakMap,Q=class{constructor(e,t,s){if(this._$cssResult$=!0,s!==Ie)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(ue&&e===void 0){let s=t!==void 0&&t.length===1;s&&(e=_t.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),s&&_t.set(t,e))}return e}toString(){return this.cssText}},xt=r=>new Q(typeof r=="string"?r:r+"",void 0,Ie),k=(r,...e)=>{let t=r.length===1?r[0]:e.reduce((s,i,o)=>s+(l=>{if(l._$cssResult$===!0)return l.cssText;if(typeof l=="number")return l;throw Error("Value passed to 'css' function must be a 'css' function result: "+l+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+r[o+1],r[0]);return new Q(t,r,Ie)},Tt=(r,e)=>{if(ue)r.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let s=document.createElement("style"),i=pe.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=t.cssText,r.appendChild(s)}},Ne=ue?r=>r:r=>r instanceof CSSStyleSheet?(e=>{let t="";for(let s of e.cssRules)t+=s.cssText;return xt(t)})(r):r;var{is:As,defineProperty:Es,getOwnPropertyDescriptor:Cs,getOwnPropertyNames:Ss,getOwnPropertySymbols:Rs,getPrototypeOf:Ps}=Object,he=globalThis,At=he.trustedTypes,Ls=At?At.emptyScript:"",Ds=he.reactiveElementPolyfillSupport,ee=(r,e)=>r,He={toAttribute(r,e){switch(e){case Boolean:r=r?Ls:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,e){let t=r;switch(e){case Boolean:t=r!==null;break;case Number:t=r===null?null:Number(r);break;case Object:case Array:try{t=JSON.parse(r)}catch{t=null}}return t}},Ct=(r,e)=>!As(r,e),Et={attribute:!0,type:String,converter:He,reflect:!1,useDefault:!1,hasChanged:Ct};Symbol.metadata??=Symbol("metadata"),he.litPropertyMetadata??=new WeakMap;var L=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=Et){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let s=Symbol(),i=this.getPropertyDescriptor(e,s,t);i!==void 0&&Es(this.prototype,e,i)}}static getPropertyDescriptor(e,t,s){let{get:i,set:o}=Cs(this.prototype,e)??{get(){return this[t]},set(l){this[t]=l}};return{get:i,set(l){let c=i?.call(this);o?.call(this,l),this.requestUpdate(e,c,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Et}static _$Ei(){if(this.hasOwnProperty(ee("elementProperties")))return;let e=Ps(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(ee("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(ee("properties"))){let t=this.properties,s=[...Ss(t),...Rs(t)];for(let i of s)this.createProperty(i,t[i])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[s,i]of t)this.elementProperties.set(s,i)}this._$Eh=new Map;for(let[t,s]of this.elementProperties){let i=this._$Eu(t,s);i!==void 0&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let s=new Set(e.flat(1/0).reverse());for(let i of s)t.unshift(Ne(i))}else e!==void 0&&t.push(Ne(e));return t}static _$Eu(e,t){let s=t.attribute;return s===!1?void 0:typeof s=="string"?s:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let s of t.keys())this.hasOwnProperty(s)&&(e.set(s,this[s]),delete this[s]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Tt(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,s){this._$AK(e,s)}_$ET(e,t){let s=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,s);if(i!==void 0&&s.reflect===!0){let o=(s.converter?.toAttribute!==void 0?s.converter:He).toAttribute(t,s.type);this._$Em=e,o==null?this.removeAttribute(i):this.setAttribute(i,o),this._$Em=null}}_$AK(e,t){let s=this.constructor,i=s._$Eh.get(e);if(i!==void 0&&this._$Em!==i){let o=s.getPropertyOptions(i),l=typeof o.converter=="function"?{fromAttribute:o.converter}:o.converter?.fromAttribute!==void 0?o.converter:He;this._$Em=i;let c=l.fromAttribute(t,o.type);this[i]=c??this._$Ej?.get(i)??c,this._$Em=null}}requestUpdate(e,t,s,i=!1,o){if(e!==void 0){let l=this.constructor;if(i===!1&&(o=this[e]),s??=l.getPropertyOptions(e),!((s.hasChanged??Ct)(o,t)||s.useDefault&&s.reflect&&o===this._$Ej?.get(e)&&!this.hasAttribute(l._$Eu(e,s))))return;this.C(e,t,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:s,reflect:i,wrapped:o},l){s&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,l??t??this[e]),o!==!0||l!==void 0)||(this._$AL.has(e)||(this.hasUpdated||s||(t=void 0),this._$AL.set(e,t)),i===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[i,o]of this._$Ep)this[i]=o;this._$Ep=void 0}let s=this.constructor.elementProperties;if(s.size>0)for(let[i,o]of s){let{wrapped:l}=o,c=this[i];l!==!0||this._$AL.has(i)||c===void 0||this.C(i,void 0,o,c)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(t)):this._$EM()}catch(s){throw e=!1,this._$EM(),s}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};L.elementStyles=[],L.shadowRootOptions={mode:"open"},L[ee("elementProperties")]=new Map,L[ee("finalized")]=new Map,Ds?.({ReactiveElement:L}),(he.reactiveElementVersions??=[]).push("2.1.2");var Me=globalThis,St=r=>r,me=Me.trustedTypes,Rt=me?me.createPolicy("lit-html",{createHTML:r=>r}):void 0,Ve="$lit$",D=`lit$${Math.random().toFixed(9).slice(2)}$`,Ue="?"+D,Is=`<${Ue}>`,q=document,se=()=>q.createComment(""),re=r=>r===null||typeof r!="object"&&typeof r!="function",Fe=Array.isArray,Ht=r=>Fe(r)||typeof r?.[Symbol.iterator]=="function",Oe=`[ 	
\f\r]`,te=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Pt=/-->/g,Lt=/>/g,F=RegExp(`>|${Oe}(?:([^\\s"'>=/]+)(${Oe}*=${Oe}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Dt=/'/g,It=/"/g,Ot=/^(?:script|style|textarea|title)$/i,je=r=>(e,...t)=>({_$litType$:r,strings:e,values:t}),n=je(1),O=je(2),ii=je(3),_=Symbol.for("lit-noChange"),d=Symbol.for("lit-nothing"),Nt=new WeakMap,j=q.createTreeWalker(q,129);function Mt(r,e){if(!Fe(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return Rt!==void 0?Rt.createHTML(e):e}var Vt=(r,e)=>{let t=r.length-1,s=[],i,o=e===2?"<svg>":e===3?"<math>":"",l=te;for(let c=0;c<t;c++){let a=r[c],u,g,p=-1,m=0;for(;m<a.length&&(l.lastIndex=m,g=l.exec(a),g!==null);)m=l.lastIndex,l===te?g[1]==="!--"?l=Pt:g[1]!==void 0?l=Lt:g[2]!==void 0?(Ot.test(g[2])&&(i=RegExp("</"+g[2],"g")),l=F):g[3]!==void 0&&(l=F):l===F?g[0]===">"?(l=i??te,p=-1):g[1]===void 0?p=-2:(p=l.lastIndex-g[2].length,u=g[1],l=g[3]===void 0?F:g[3]==='"'?It:Dt):l===It||l===Dt?l=F:l===Pt||l===Lt?l=te:(l=F,i=void 0);let f=l===F&&r[c+1].startsWith("/>")?" ":"";o+=l===te?a+Is:p>=0?(s.push(u),a.slice(0,p)+Ve+a.slice(p)+D+f):a+D+(p===-2?c:f)}return[Mt(r,o+(r[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),s]},ie=class r{constructor({strings:e,_$litType$:t},s){let i;this.parts=[];let o=0,l=0,c=e.length-1,a=this.parts,[u,g]=Vt(e,t);if(this.el=r.createElement(u,s),j.currentNode=this.el.content,t===2||t===3){let p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(i=j.nextNode())!==null&&a.length<c;){if(i.nodeType===1){if(i.hasAttributes())for(let p of i.getAttributeNames())if(p.endsWith(Ve)){let m=g[l++],f=i.getAttribute(p).split(D),b=/([.?@])?(.*)/.exec(m);a.push({type:1,index:o,name:b[2],strings:f,ctor:b[1]==="."?ge:b[1]==="?"?ve:b[1]==="@"?ye:B}),i.removeAttribute(p)}else p.startsWith(D)&&(a.push({type:6,index:o}),i.removeAttribute(p));if(Ot.test(i.tagName)){let p=i.textContent.split(D),m=p.length-1;if(m>0){i.textContent=me?me.emptyScript:"";for(let f=0;f<m;f++)i.append(p[f],se()),j.nextNode(),a.push({type:2,index:++o});i.append(p[m],se())}}}else if(i.nodeType===8)if(i.data===Ue)a.push({type:2,index:o});else{let p=-1;for(;(p=i.data.indexOf(D,p+1))!==-1;)a.push({type:7,index:o}),p+=D.length-1}o++}}static createElement(e,t){let s=q.createElement("template");return s.innerHTML=e,s}};function W(r,e,t=r,s){if(e===_)return e;let i=s!==void 0?t._$Co?.[s]:t._$Cl,o=re(e)?void 0:e._$litDirective$;return i?.constructor!==o&&(i?._$AO?.(!1),o===void 0?i=void 0:(i=new o(r),i._$AT(r,t,s)),s!==void 0?(t._$Co??=[])[s]=i:t._$Cl=i),i!==void 0&&(e=W(r,i._$AS(r,e.values),i,s)),e}var fe=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:s}=this._$AD,i=(e?.creationScope??q).importNode(t,!0);j.currentNode=i;let o=j.nextNode(),l=0,c=0,a=s[0];for(;a!==void 0;){if(l===a.index){let u;a.type===2?u=new z(o,o.nextSibling,this,e):a.type===1?u=new a.ctor(o,a.name,a.strings,this,e):a.type===6&&(u=new $e(o,this,e)),this._$AV.push(u),a=s[++c]}l!==a?.index&&(o=j.nextNode(),l++)}return j.currentNode=q,i}p(e){let t=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(e,s,t),t+=s.strings.length-2):s._$AI(e[t])),t++}},z=class r{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,s,i){this.type=2,this._$AH=d,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=W(this,e,t),re(e)?e===d||e==null||e===""?(this._$AH!==d&&this._$AR(),this._$AH=d):e!==this._$AH&&e!==_&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Ht(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==d&&re(this._$AH)?this._$AA.nextSibling.data=e:this.T(q.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:s}=e,i=typeof s=="number"?this._$AC(e):(s.el===void 0&&(s.el=ie.createElement(Mt(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(t);else{let o=new fe(i,this),l=o.u(this.options);o.p(t),this.T(l),this._$AH=o}}_$AC(e){let t=Nt.get(e.strings);return t===void 0&&Nt.set(e.strings,t=new ie(e)),t}k(e){Fe(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,s,i=0;for(let o of e)i===t.length?t.push(s=new r(this.O(se()),this.O(se()),this,this.options)):s=t[i],s._$AI(o),i++;i<t.length&&(this._$AR(s&&s._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let s=St(e).nextSibling;St(e).remove(),e=s}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},B=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,s,i,o){this.type=1,this._$AH=d,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=o,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=d}_$AI(e,t=this,s,i){let o=this.strings,l=!1;if(o===void 0)e=W(this,e,t,0),l=!re(e)||e!==this._$AH&&e!==_,l&&(this._$AH=e);else{let c=e,a,u;for(e=o[0],a=0;a<o.length-1;a++)u=W(this,c[s+a],t,a),u===_&&(u=this._$AH[a]),l||=!re(u)||u!==this._$AH[a],u===d?e=d:e!==d&&(e+=(u??"")+o[a+1]),this._$AH[a]=u}l&&!i&&this.j(e)}j(e){e===d?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},ge=class extends B{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===d?void 0:e}},ve=class extends B{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==d)}},ye=class extends B{constructor(e,t,s,i,o){super(e,t,s,i,o),this.type=5}_$AI(e,t=this){if((e=W(this,e,t,0)??d)===_)return;let s=this._$AH,i=e===d&&s!==d||e.capture!==s.capture||e.once!==s.once||e.passive!==s.passive,o=e!==d&&(s===d||i);i&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},$e=class{constructor(e,t,s){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(e){W(this,e)}},Ut={M:Ve,P:D,A:Ue,C:1,L:Vt,R:fe,D:Ht,V:W,I:z,H:B,N:ve,U:ye,B:ge,F:$e},Ns=Me.litHtmlPolyfillSupport;Ns?.(ie,z),(Me.litHtmlVersions??=[]).push("3.3.3");var Ft=(r,e,t)=>{let s=t?.renderBefore??e,i=s._$litPart$;if(i===void 0){let o=t?.renderBefore??null;s._$litPart$=i=new z(e.insertBefore(se(),o),o,void 0,t??{})}return i._$AI(r),i};var qe=globalThis,x=class extends L{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Ft(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return _}};x._$litElement$=!0,x.finalized=!0,qe.litElementHydrateSupport?.({LitElement:x});var Hs=qe.litElementPolyfillSupport;Hs?.({LitElement:x});(qe.litElementVersions??=[]).push("4.2.2");var I={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},G=r=>(...e)=>({_$litDirective$:r,values:e}),M=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,s){this._$Ct=e,this._$AM=t,this._$Ci=s}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};var{I:Os}=Ut,jt=r=>r;var Wt=r=>r.strings===void 0,qt=()=>document.createComment(""),Y=(r,e,t)=>{let s=r._$AA.parentNode,i=e===void 0?r._$AB:e._$AA;if(t===void 0){let o=s.insertBefore(qt(),i),l=s.insertBefore(qt(),i);t=new Os(o,l,r,r.options)}else{let o=t._$AB.nextSibling,l=t._$AM,c=l!==r;if(c){let a;t._$AQ?.(r),t._$AM=r,t._$AP!==void 0&&(a=r._$AU)!==l._$AU&&t._$AP(a)}if(o!==i||c){let a=t._$AA;for(;a!==o;){let u=jt(a).nextSibling;jt(s).insertBefore(a,i),a=u}}}return t},V=(r,e,t=r)=>(r._$AI(e,t),r),Ms={},Z=(r,e=Ms)=>r._$AH=e,Bt=r=>r._$AH,be=r=>{r._$AR(),r._$AA.remove()};var Kt=G(class extends M{constructor(){super(...arguments),this.key=d}render(r,e){return this.key=r,e}update(r,[e,t]){return e!==this.key&&(Z(r),this.key=e),t}});var ke=class{constructor(e,t=Intl.DateTimeFormat().resolvedOptions().timeZone,s){this.connection=e;this.timeZone=t;this.entryId=s}call(e,t={}){return this.send({type:`tankkeeper/${e}`,args:t})}accept(e){return this.send({type:"tankkeeper/accept_proposal",proposal_id:e})}reject(e){return this.send({type:"tankkeeper/reject_proposal",proposal_id:e})}acceptFinding(e){return this.send({type:"tankkeeper/accept_finding",check_id:e})}rejectFinding(e){return this.send({type:"tankkeeper/reject_finding",check_id:e})}chatAgent(){return this.send({type:"tankkeeper/chat_agent"})}converse(e,t,s){return this.send({type:"conversation/process",text:e,conversation_id:t,agent_id:s})}send(e){return this.connection.sendMessagePromise(e)}};function we(r){return Object(r).code==="not_found"}function K(r){return typeof r=="object"&&r!==null&&"message"in r?String(r.message):String(r)}var zt="tk-changed",v=k`
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
`,We="tk-chat";function J(r,e){r.dispatchEvent(new CustomEvent(We,{detail:e,bubbles:!0,composed:!0}))}var h=class extends x{constructor(){super();this.loads=0;this.api=void 0,this.error="",this.busy=!1,this.version=0,this.addEventListener(zt,t=>{t.composedPath()[0]!==this&&this.reload()})}static{this.properties={api:{attribute:!1},error:{state:!0},busy:{state:!0},version:{state:!0}}}reloadOn(){return["api"]}willUpdate(t){this.reloadOn().some(s=>t.has(s))&&this.reload()}async reload(){let t=this.api;if(t===void 0)return;this.loads+=1;let s=this.loads;try{let i=await this.load(t);if(s!==this.loads)return;i(),this.error="",this.version+=1}catch(i){s===this.loads&&(this.error=K(i))}}async run(t){let s=this.api;if(s===void 0)return!1;this.busy=!0;try{return await t(s),this.error="",await this.reload(),!0}catch(i){return this.error=K(i),!1}finally{this.busy=!1}}changed(){this.dispatchEvent(new CustomEvent(zt,{bubbles:!0,composed:!0}))}};var Vs={panel:"Panel",mcp:"Claude (MCP)",assist:"Assist",notification:"Notification",rule:"Rule",review:"Review",camera:"Camera"};function Gt(r){return String(r).padStart(2,"0")}function xe(r,e){let t=new Intl.DateTimeFormat("en-CA",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(r),s=i=>t.find(o=>o.type===i)?.value??"";return{day:`${s("year")}-${s("month")}-${s("day")}`,minutes:Number(s("hour"))*60+Number(s("minute"))}}function N(r,e){return xe(r,e).day}function H(r,e){let[t=0,s=1,i=1]=r.split("-").map(Number);return new Date(Date.UTC(t,s-1,i+e)).toISOString().slice(0,10)}function $(r){let e=new Date(r);return`${N(e)} ${Gt(e.getHours())}:${Gt(e.getMinutes())}`}var Ke=6e4,ze=60*Ke,_e=24*ze;function Zt(r,e=new Date){let t=new Date(r),s=e.getTime()-t.getTime();return s<Ke?"just now":s<ze?`${String(Math.floor(s/Ke))} min ago`:s<_e?`${String(Math.floor(s/ze))} h ago`:s<2*_e?"yesterday":s<7*_e?`${String(Math.floor(s/_e))} days ago`:N(t)}function C(r){return Vs[r]??r}function Yt(r){return typeof r=="string"?r:JSON.stringify(r)}function T(r){if(r.before===null)return`Added to ${r.collection}`;if(r.after===null)return`Removed from ${r.collection}`;let{before:e,after:t}=r,i=Object.keys(t).filter(o=>JSON.stringify(e[o])!==JSON.stringify(t[o])).map(o=>`${o} ${Yt(e[o])} \u2192 ${Yt(t[o])}`);return`${r.collection}: ${i.join(", ")}`}function Be(r,...e){let t=e.filter(s=>typeof s=="string"&&s!=="");return[r,...t].join(". ")}function Jt(r){if(r.kind==="dose")return Be(`Dose: ${r.product??""} ${String(r.amount_ml??0)} ml`,r.why,r.notes);if(r.kind==="test"){let t=Object.entries(r.values??{}).map(([i,o])=>`${i} ${String(o)}`).join(", "),s=r.source==="tap"?"Tap":"Tank";return Be(`${s} test: ${t}`,r.notes)}let e=[...r.tasks??[]];return typeof r.water_change_percent=="number"&&e.push(`${String(r.water_change_percent)}% water change`),typeof r.water_litres=="number"&&e.push(`${String(r.water_litres)} l water`),Be(e.join(". "),r.why,r.notes)}var Ge=class extends h{constructor(){super();this.details=null;this.toggled=()=>{this.details?.open===!0&&this.reload()};this.collection="",this.recordId=void 0,this.stamp=0,this.entries=void 0}static{this.properties={...h.properties,collection:{attribute:!1},recordId:{attribute:!1},stamp:{attribute:!1},entries:{state:!0}}}static{this.styles=v}connectedCallback(){super.connectedCallback(),this.details=this.closest("details"),this.details?.addEventListener("toggle",this.toggled)}disconnectedCallback(){super.disconnectedCallback(),this.details?.removeEventListener("toggle",this.toggled),this.details=null}async reload(){this.details!==null&&!this.details.open||await super.reload()}reloadOn(){return["api","collection","recordId","stamp"]}async load(t){let s={collection:this.collection,limit:10};this.recordId!==void 0&&(s.record_id=this.recordId);let{history:i}=await t.call("get_history",s);return()=>{this.entries=i}}async undo(t){await this.run(s=>s.call("undo_change",{history_id:t.id}))&&this.changed()}render(){return this.entries===void 0?d:n`
      ${this.error?n`<p class="error">${this.error}</p>`:d}
      ${this.entries.length===0?n`<p class="muted">No changes yet</p>`:d}
      <ul>
        ${this.entries.map(t=>n`<li class="row">
              <div class="grow">
                <div>${t.summary}</div>
                <div class="muted when">
                  ${$(t.time)} ·
                  ${C(t.source)}${typeof t.conversation_name=="string"?` \xB7 in ${t.conversation_name}`:d}
                </div>
                ${t.changes.map(s=>n`<div class="muted">${T(s)}</div>`)}
              </div>
              <button class="undo" ?disabled=${this.busy} @click=${()=>this.undo(t)}>
                Undo
              </button>
            </li>`)}
      </ul>
    `}};customElements.define("tk-history",Ge);var Us="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z",Xt="/config/integrations/integration/tankkeeper";function Fs(r){return r===void 0?Xt:`${Xt}#config_entry=${encodeURIComponent(r)}`}function js(r){history.pushState(null,"",Fs(r)),window.dispatchEvent(new CustomEvent("location-changed",{detail:{replace:!1}}))}function Qt(r){return n`<ha-icon-button
    class="settings"
    .path=${Us}
    label="TankKeeper settings"
    @click=${()=>{js(r?.entryId)}}
  ></ha-icon-button>`}function qs(r,e){return r.type==="checkbox"&&typeof e=="boolean"?e?"Yes":"No":Array.isArray(e)?e.length===0?"Not set":e.map(String).join(", "):e==null||e===""?"Not set":typeof e=="string"||typeof e=="number"?String(e):JSON.stringify(e)}function U(r,e){let t=new Map(Object.entries(e));return n`<dl class="facts">
    ${r.map(s=>{let i=s.type==="textarea"?"wide":"";return n`<dt class=${i}>${s.label}</dt>
        <dd class="pre ${i}">${qs(s,t.get(s.name))}</dd>`})}
  </dl>`}function A(r,e,t,s){return n`<details>
    <summary>History</summary>
    <tk-history
      .api=${r}
      .collection=${e}
      .recordId=${t}
      .stamp=${s}
    ></tk-history>
  </details>`}var es=G(class extends M{constructor(r){if(super(r),r.type!==I.PROPERTY&&r.type!==I.ATTRIBUTE&&r.type!==I.BOOLEAN_ATTRIBUTE)throw Error("The `live` directive is not allowed on child or event bindings");if(!Wt(r))throw Error("`live` bindings can only contain a single expression")}render(r){return r}update(r,[e]){if(e===_||e===d)return e;let t=r.element,s=r.name;if(r.type===I.PROPERTY){if(e===t[s])return _}else if(r.type===I.BOOLEAN_ATTRIBUTE){if(!!e===t.hasAttribute(s))return _}else if(r.type===I.ATTRIBUTE&&t.getAttribute(s)===e+"")return _;return Z(r),e}});var Ws=["ammonia","nitrite","nitrate","phosphate","ph","kh","gh","temperature_c","cycle","light"];var Bs="tankkeeper:photo/",Ks=/^tankkeeper:photo\/[0-9A-HJKMNP-TV-Z]{26}$/,zs=/^tankkeeper:chart\/([a-z_]+)(?:\?days=(\d+))?$/;function Gs(r){return Ws.includes(r)}function ne(r){if(Ks.test(r))return{kind:"photo",id:r.slice(Bs.length)};let e=zs.exec(r),t=e?.[1]??"";if(e===null||!Gs(t))return;let s=t==="light"?30:365,i=e[2]===void 0?30:Number(e[2]);return{kind:"chart",chart:t,days:Math.min(s,Math.max(1,i))}}var ts=1440,S=320,oe=160,E=24,Xe={ammonia:"var(--warning-color, #f4b400)",nitrite:"var(--error-color, #db4437)",nitrate:"var(--info-color, #4285f4)",ph:"var(--primary-color, #03a9f4)",kh:"var(--success-color, #43a047)",gh:"var(--accent-color, #ff9800)",phosphate:"var(--state-icon-color, #44739e)",temperature_c:"var(--error-color, #db4437)"},Ys=Xe.ammonia,Zs=Xe.nitrite,ss="var(--secondary-text-color, #727272)",Qe={ammonia:"Ammonia (ppm)",nitrite:"Nitrite (ppm)",nitrate:"Nitrate (mg/l)",ph:"pH",kh:"KH (dKH)",gh:"GH (dGH)",phosphate:"Phosphate (mg/l)",temperature_c:"Temperature (\xB0C)"},Js=["ammonia","nitrite","nitrate","ph","kh","gh","phosphate","temperature_c"];function Te(r,e,t,s){let i=r.filter(o=>o.kind==="test"&&(o.source==="tap"?"tap":"tank")===s&&typeof o.values?.[e]=="number").map(o=>({time:Date.parse(o.time),value:o.values?.[e]??0})).sort((o,l)=>o.time-l.time);return{name:t,colour:Xe[e],joined:s==="tank",points:i}}var Ye=.1;function is(r,e){let t=[...r.flatMap(l=>l.points.map(c=>c.value)),...e.map(l=>l.value)];if(t.length===0)return{series:r,lines:e,min:0,max:1};let s=Math.min(...t),i=Math.max(...t),o=i>s?(i-s)*Ye:Math.abs(i)*Ye||Ye;return{series:r,lines:e,min:Math.max(0,s-o),max:i+o}}function rs(r){return String(Number(r.toFixed(2)))}function Ze(r){return r.flatMap(([e,t,s])=>typeof t=="number"?[{label:e,value:t,colour:s}]:[])}function Je(r,e,t){return Ze([["Watch",r[e],Ys],["Act",r[t],Zs]])}function Ae(r,e){let t=[["ammonia","Ammonia"],["nitrite","Nitrite"],["nitrate","Nitrate"]];return is([...t.map(([s,i])=>Te(r,s,i,"tank")),...t.map(([s,i])=>Te(r,s,`Tap ${i.toLowerCase()}`,"tap"))],Je(e,"nitrogen_watch","nitrogen_act"))}function Xs(r,e,t,s){let i=o=>Ze([["Tap water",s?.[o],ss]]);switch(r){case"ammonia":case"nitrite":return Je(e,"nitrogen_watch","nitrogen_act");case"ph":return[...Je(e,"ph_watch","ph_act"),...i("ph")];case"temperature_c":return Ze([["Target",t,ss]]);default:return i(r)}}function et(r,e,t,s,i){let o=[Te(r,e,"Tank","tank"),Te(r,e,"Tap","tap")];return{key:e,label:Qe[e],chart:is(o,Xs(e,t,s,i))}}function ns(r,e,t,s){let i=[],o=[];for(let l of Js){let c=et(r,l,e,t,s);c.chart.series.every(a=>a.points.length===0)?o.push(c.label):i.push(c)}return{charts:i,empty:o}}function ae(r,e){let t=r.series.flatMap(a=>a.points.map(u=>u.time));if(t.length===0)return n`<p class="empty">No readings yet</p>`;let s=Math.min(...t),i=Math.max(...t)-s,o=r.max-r.min||1,l=a=>i===0?S/2:E+(a-s)/i*(S-2*E),c=a=>oe-E-(a-r.min)/o*(oe-2*E);return n`
    <svg viewBox="0 0 ${S} ${oe}" role="img" aria-label=${e} class="chart">
      <line class="axis" x1=${E} y1=${oe-E} x2=${S-E} y2=${oe-E}></line>
      <text class="tick" x="2" y=${c(r.max)+4}>${rs(r.max)}</text>
      <text class="tick" x="2" y=${c(r.min)+4}>${rs(r.min)}</text>
      ${r.lines.map(a=>O`<line class="target" x1=${E} x2=${S-E} y1=${c(a.value)} y2=${c(a.value)}
            stroke=${a.colour}><title>${a.label} ${a.value}</title></line>
            <text class="line-label" x=${S-E} y=${c(a.value)-2} text-anchor="end"
              fill=${a.colour}>${a.label} ${a.value}</text>`)}
      ${r.series.filter(a=>a.points.length>0).map(a=>O`
          ${a.joined?O`<polyline fill="none" stroke=${a.colour}
                  points=${a.points.map(u=>`${String(l(u.time))},${String(c(u.value))}`).join(" ")}>
                </polyline>`:d}
          ${a.points.map(u=>O`<circle class=${a.joined?"solid":"hollow"} cx=${l(u.time)} cy=${c(u.value)} r="3"
                stroke=${a.colour} fill=${a.joined?a.colour:"none"}>
                <title>${a.name} ${u.value}</title></circle>`)}`)}
    </svg>
    <ul class="legend">
      ${r.series.filter(a=>a.points.length>0).map(a=>n`<li>
              ${a.joined?n`<span class="swatch" style="background:${a.colour}"></span>`:n`<span class="swatch hollow" style="border-color:${a.colour}"></span>`}${a.name}
            </li>`)}
      ${r.lines.map(a=>n`<li><span class="dash" style="border-color:${a.colour}"></span>${a.label}</li>`)}
    </ul>
  `}function Ee(r,e,t,s){let i=[];for(let o=t-1;o>=0;o--)i.push({day:H(e,-o),segments:[]});for(let[o,l]of r){let c=xe(new Date(o),s),a=xe(new Date(l),s);for(let u of i){let g=c.day===u.day?c.minutes/ts:c.day<u.day?0:null,p=a.day===u.day?a.minutes/ts:a.day>u.day?1:null;g!==null&&p!==null&&p>g&&u.segments.push({start:g,end:p})}}return i}function Ce(r){let t=r.length*6;return O`
    <svg viewBox="0 0 ${S} ${t}" role="img" class="chart light"
      aria-label=${`Light on and off, last ${String(r.length)} days`}>
      ${r.map((s,i)=>O`
          <rect class="off" x="0" y=${i*6} width=${S} height=${5}></rect>
          ${s.segments.map(o=>O`<rect class="on" x=${o.start*S} y=${i*6}
                width=${(o.end-o.start)*S} height=${5}>
                <title>${s.day}</title></rect>`)}`)}
    </svg>`}var os=500,Qs="The photo is no longer kept.";function er(r,e){let t=r.photo_url;return t!==null&&r.id===e&&t.startsWith(`/api/tankkeeper/photos/${e}?`)?t:void 0}var as=new WeakMap;function le(r,e,t){let s=as.get(r);s===void 0&&(s=new Map,as.set(r,s));let i=JSON.stringify([e,t]),o=s.get(i);if(o!==void 0)return o;let l=s,c=r.call(e,t).finally(()=>l.delete(i));return l.set(i,c),c}async function tr(r,e){let t=[],s=new Set,i;for(;;){let o={kind:"test",since:e,...i===void 0?{}:{until:i},limit:os},l=(await le(r,"get_log",o)).entries,c=l.filter(a=>!s.has(a.id));for(let a of c)s.add(a.id),t.push(a),i=a.time;if(l.length<os||c.length===0)return t}}var ls={...Qe,cycle:"Cycle",light:"Light"},tt=class extends h{static{this.properties={...h.properties,address:{type:String},alt:{type:String},shown:{state:!0},large:{state:!0}}}static{this.styles=[v,k`
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
    `]}constructor(){super(),this.address="",this.alt="",this.shown=void 0,this.large=!1}reloadOn(){return["api","address"]}async load(e){let t=ne(this.address),s=t===void 0?void 0:await this.fetch(e,t);return()=>{this.shown=s}}async fetch(e,t){if(t.kind==="photo"){let p=await le(e,"get_photo_check",{check_id:t.id}).catch(m=>{if(!we(m))throw m});return{kind:"photo",url:p===void 0?void 0:er(p,t.id)}}let{chart:s,days:i}=t;if(s==="light"){let p=await le(e,"get_light",{days:i});return{kind:"light",lights:p.lights.map(f=>({model:f.model,rows:Ee(f.on_periods,p.today,i,e.timeZone)}))}}let o=H(N(new Date,e.timeZone),-i),[l,c]=await Promise.all([tr(e,o),le(e,"get_status")]),a=ls[s];if(s==="cycle")return{kind:"chart",chart:Ae(l,c.settings),label:a};let u=await le(e,"get_tank");return{kind:"chart",chart:et(l,s,c.settings,u.tank.temperature_c,u.water).chart,label:a}}caption(e){return this.alt!==""?this.alt:e.kind==="photo"?"The tank":`${ls[e.chart]}, last ${String(e.days)} days`}open(){this.large=!0,this.updateComplete.then(()=>this.renderRoot.querySelector(".large")?.focus())}close(){this.large=!1,this.updateComplete.then(()=>this.renderRoot.querySelector("button.photo")?.focus())}keydown(e){e.key==="Tab"&&e.preventDefault(),e.key==="Escape"&&this.close()}renderPhoto(e,t){return e===void 0?n`<p class="muted">${Qs}</p>`:n`<button
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
      ${this.large?n`<div
              class="large"
              role="dialog"
              aria-modal="true"
              aria-label=${t}
              tabindex="-1"
              @click=${()=>{this.close()}}
              @keydown=${s=>{this.keydown(s)}}
            >
              <img src=${e} alt=${t} />
            </div>`:d}`}renderShown(e,t){return e.kind==="photo"?this.renderPhoto(e.url,t):e.kind==="chart"?ae(e.chart,e.label):e.lights.length===0?n`<p class="muted">No lights yet</p>`:n`${e.lights.map(s=>n`<div class="muted">${s.model}</div>
          ${Ce(s.rows)}`)}`}render(){let e=ne(this.address);if(e===void 0)return n`![${this.alt}](${this.address})`;let t=this.caption(e),s=this.shown;return n`<figure>
      ${this.error?n`<p class="error">${this.error}</p>`:d}
      ${s===void 0?d:this.renderShown(s,t)}
      <figcaption>${t}</figcaption>
    </figure>`}};customElements.define("tk-embed",tt);function Se(r,e){return n`${ir(r.split(`
`),{api:e,left:5})}`}var st=/^\s*```/,cs=/^(#{1,6})\s+(.*)$/,rt=/^\s*[-*]\s+(.*)$/,it=/^\s*\d+[.)]\s+(.*)$/,rr=/`([^`]+)`|!\[([^\]]*)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|(?<![\w*])\*([^*\s](?:[^*]*[^*\s])?)\*(?![\w*])|(?<!\w)_([^_\s](?:[^_]*[^_\s])?)_(?!\w)/g;function ir(r,e){let t=[],s=0,i=o=>{let l=[];for(let c=o.exec(r[s]??"");c!==null;)l.push(c[1]??""),s+=1,c=o.exec(r[s]??"");return l};for(;s<r.length;){let o=r[s]??"",l=cs.exec(o);if(st.test(o)){let c=r.findIndex((u,g)=>g>s&&st.test(u)),a=c===-1?r.length:c;t.push(n`<pre><code>${r.slice(s+1,a).join(`
`)}</code></pre>`),s=a+1}else if(l!==null){let c=X(l[2]??"",e);t.push((l[1]??"").length<=2?n`<h3>${c}</h3>`:n`<h4>${c}</h4>`),s+=1}else if(rt.test(o)){let c=i(rt).map(a=>ds(a,e));t.push(n`<ul>
          ${c}
        </ul>`)}else if(it.test(o)){let c=i(it).map(a=>ds(a,e));t.push(n`<ol>
          ${c}
        </ol>`)}else if(o.trim()==="")s+=1;else{let c=[];for(;s<r.length&&nr(r[s]??"");)c.push(r[s]??""),s+=1;let a=c.map((u,g)=>n`${g>0?n`<br />`:d}${X(u,e)}`);t.push(n`<p>${a}</p>`)}}return t}function ds(r,e){return n`<li>${X(r,e)}</li>`}function nr(r){return r.trim()!==""&&!st.test(r)&&!cs.test(r)&&!rt.test(r)&&!it.test(r)}function X(r,e){let t=[],s=0;for(let i of r.matchAll(rr)){i.index>s&&t.push(r.slice(s,i.index));let[o,l,c,,a,u,g,p,m]=i;l!==void 0?t.push(n`<code>${l}</code>`):c!==void 0?t.push(or(c,o,e)):a!==void 0?t.push(n`<strong>${X(a,e)}</strong>`):u!==void 0?t.push(ps(u,g??"",o,e)):t.push(n`<em>${X(p??m??"",e)}</em>`),s=i.index+o.length}return s<r.length&&t.push(r.slice(s)),t}function ps(r,e,t,s){return/^https?:\/\//i.test(e)?n`<a href=${e} target="_blank" rel="noopener noreferrer"
    >${X(r,s)}</a
  >`:t}function or(r,e,t){let s=e.slice(r.length+4,-1),{api:i}=t;return i===void 0||t.left===0||ne(s)===void 0?r===""?e:n`!${ps(r,s,e.slice(1),t)}`:(t.left-=1,n`<tk-embed .api=${i} .address=${s} .alt=${r}></tk-embed>`)}var us=(r,e,t)=>{let s=new Map;for(let i=e;i<=t;i++)s.set(r[i],i);return s},w=G(class extends M{constructor(r){if(super(r),r.type!==I.CHILD)throw Error("repeat() can only be used in text expressions")}dt(r,e,t){let s;t===void 0?t=e:e!==void 0&&(s=e);let i=[],o=[],l=0;for(let c of r)i[l]=s?s(c,l):l,o[l]=t(c,l),l++;return{values:o,keys:i}}render(r,e,t){return this.dt(r,e,t).values}update(r,[e,t,s]){let i=Bt(r),{values:o,keys:l}=this.dt(e,t,s);if(!Array.isArray(i))return this.ut=l,o;let c=this.ut??=[],a=[],u,g,p=0,m=i.length-1,f=0,b=o.length-1;for(;p<=m&&f<=b;)if(i[p]===null)p++;else if(i[m]===null)m--;else if(c[p]===l[f])a[f]=V(i[p],o[f]),p++,f++;else if(c[m]===l[b])a[b]=V(i[m],o[b]),m--,b--;else if(c[p]===l[b])a[b]=V(i[p],o[b]),Y(r,a[b+1],i[p]),p++,b--;else if(c[m]===l[f])a[f]=V(i[m],o[f]),Y(r,i[p],i[m]),m--,f++;else if(u===void 0&&(u=us(l,f,b),g=us(c,p,m)),u.has(c[p]))if(u.has(c[m])){let P=g.get(l[f]),De=P!==void 0?i[P]:null;if(De===null){let wt=Y(r,i[p]);V(wt,o[f]),a[f]=wt}else a[f]=V(De,o[f]),Y(r,i[p],De),i[P]=null;f++}else be(i[m]),m--;else be(i[p]),p++;for(;f<=b;){let P=Y(r,a[b+1]);V(P,o[f]),a[f++]=P}for(;p<=m;){let P=i[p++];P!==null&&be(P)}return this.ut=l,Z(r,a),_}});function Re(r){let e=Array.from(r.snippet),t=(s,i)=>e.slice(s,i).join("");return n`<span class="snippet pre"
    >${t(0,r.start)}<mark>${t(r.start,r.end)}</mark>${t(r.end)}</span
  >`}var de="tk-conversation-deleted";function hs(r,e,t){return`${String(r)} ${r===1?e:t}`}var nt=class extends x{static{this.properties={api:{attribute:!1},conversationId:{attribute:!1},disabled:{attribute:!1},asked:{state:!0},error:{state:!0},busy:{state:!0}}}static{this.styles=[v,k`
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
    `]}constructor(){super(),this.api=void 0,this.conversationId="",this.disabled=!1,this.asked=void 0,this.error="",this.busy=!1}async attempt(e){let t=this.api;if(t!==void 0){this.busy=!0,this.error="";try{await e(t)}catch(s){this.asked=void 0,this.error=K(s)}finally{this.busy=!1}}}async ask(){await this.attempt(async e=>{this.asked=await e.call("delete_conversation",{id:this.conversationId})}),await this.focusOn("button.cancel")}async confirm(e){let t=this.conversationId;await this.attempt(async s=>{await s.call("delete_conversation",{id:t,code:e}),this.asked=void 0,this.dispatchEvent(new CustomEvent(de,{detail:t,bubbles:!0,composed:!0}))})}async cancel(){this.asked=void 0,await this.focusOn("button.delete")}async focusOn(e){await this.updateComplete,this.shadowRoot?.querySelector(e)?.focus()}renderAsked(e){let t=e.messages===1?"goes":"go",s=e.changes===1?"stays":"stay";return n`<div class="confirm" role="alertdialog" aria-labelledby="ask">
      <p id="ask" class="pre">
        Delete "${e.name}"? Its ${hs(e.messages,"message","messages")} ${t}. The
        ${hs(e.changes,"change","changes")} made in it ${s} in the history, and Undo
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
    </div>`}render(){return n`<button
        class="delete"
        ?disabled=${this.disabled||this.busy||this.asked!==void 0}
        @click=${()=>{this.ask()}}
      >
        Delete
      </button>
      ${this.asked===void 0?d:this.renderAsked(this.asked)}
      ${this.error?n`<p class="error">${this.error}</p>`:d}`}};customElements.define("tk-delete-conversation",nt);var ms=50,ce="panel_",ar="tk-open-chat",ot=class extends h{static{this.properties={...h.properties,active:{attribute:!1},stamp:{attribute:!1},locked:{attribute:!1},conversations:{state:!0},query:{state:!0},renaming:{state:!0},draftTitle:{state:!0}}}static{this.styles=[v,k`
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
    `]}constructor(){super(),this.active="",this.stamp=0,this.locked="",this.conversations=void 0,this.query="",this.renaming=void 0,this.draftTitle="",this.addEventListener(de,()=>{this.reload()})}reloadOn(){return["api","query","stamp"]}async load(e){let t=this.query===""?await e.call("list_conversations",{limit:ms}):await e.call("search_conversations",{query:this.query,limit:ms});return()=>{this.conversations=t.conversations}}search(e){e.preventDefault();let t=e.target.querySelector("input");this.query=(t?.value??"").trim()}open(e){let t=e.match?.index??null;this.dispatchEvent(new CustomEvent(ar,{detail:{id:e.id,index:t},bubbles:!0,composed:!0}))}async startRename(e){this.renaming=e.id,this.draftTitle=e.title,this.error="",await this.updateComplete,this.shadowRoot?.querySelector("input.title")?.focus()}async rename(e,t){e.preventDefault();let s=this.draftTitle.trim();if(s===""){this.renaming=void 0;return}await this.run(o=>o.call("rename_conversation",{id:t,title:s}))&&(this.renaming=void 0)}renderName(e){if(this.renaming===e.id)return n`<form
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
      </form>`;let t=!e.id.startsWith(ce),s=Zt(e.updated);return n`<button
      class="open"
      aria-current=${e.id===this.active?"true":"false"}
      @click=${()=>{this.open(e)}}
    >
      <span class="name">${e.name}</span>
      <span class="muted"
        >${t?`${s} \xB7 ${C(e.source)}, read only`:s}</span
      >
      ${e.match===void 0?d:Re(e.match)}
    </button>`}renderItem(e){return n`<li
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
    </li>`}render(){let e=this.conversations;return n`<form
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
      ${this.error?n`<p class="error">${this.error}</p>`:d}
      ${e?.length===0?n`<p class="muted">${this.query===""?"No chats yet":"No chats match"}</p>`:d}
      <ul>
        ${w(e??[],t=>t.id,t=>this.renderItem(t))}
      </ul>`}};customElements.define("tk-chat-list",ot);var lr="TankKeeper's Assist agent is missing. Reload TankKeeper in Settings, Devices & services.",dr="Choose the conversation agent in TankKeeper's Claude settings first: Settings, Devices & services, TankKeeper, Configure.",Pe=200,fs=200,cr=new Set(["user","assistant","error"]);function gs(){return`panel_${[...crypto.getRandomValues(new Uint8Array(16))].map(e=>e.toString(16).padStart(2,"0")).join("")}`}function at(r){return r.length<=fs?r:`${r.slice(0,fs-1)}\u2026`}async function pr(r,e){let{kind:t,id:s}=e;if(t==="proposal"){let i=await r.call("list_proposals",{state:"all",limit:Pe}).then(o=>o.proposals.find(l=>l.proposal_id===s)).catch(()=>{});return i===void 0?`Let's discuss the waiting change ${s}.`:`Let's discuss the waiting change "${at(i.summary)}" (proposal ${s}).`}if(t==="photo"){let i=await r.call("list_photos",{limit:Pe}).then(o=>o.photos.find(l=>l.id===s)?.summary).catch(()=>{});return i==null?`Let's discuss photo check ${s}.`:`Let's discuss what the camera saw: "${at(i)}" (photo check ${s}).`}if(t==="review"){let i=await r.call("get_reviews",{limit:Pe}).then(o=>o.reviews.find(l=>l.id===s)).catch(()=>{});return i===void 0?`Let's discuss review ${s}.`:`Let's discuss the review "${at(i.result)}" (review ${s}).`}return"Let's discuss the tank's status now."}var lt=class extends h{constructor(){super();this.scrollToFound=!1;this.conversationId=gs();this.recorded=!1;this.resuming=!1;this.begun=0;this.start=void 0,this.agent=void 0,this.messages=[],this.draft="",this.sending=!1,this.changes=[],this.proposals=[],this.readOnly=!1,this.listOpen=!1,this.found=null}static{this.properties={...h.properties,start:{attribute:!1},agent:{state:!0},messages:{state:!0},draft:{state:!0},sending:{state:!0},changes:{state:!0},proposals:{state:!0},readOnly:{state:!0},listOpen:{state:!0},found:{state:!0}}}static{this.styles=[v,k`
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
    `]}reloadOn(){return["api","start"]}willUpdate(t){t.has("start")&&this.begin(this.start),super.willUpdate(t)}begin(t){this.begun+=1;let s=t?.kind==="resume";this.conversationId=s?t.id:gs(),this.recorded=s,this.resuming=s,this.readOnly=s&&!t.id.startsWith(ce),this.found=null,this.scrollToFound=!1,this.messages=[],this.draft="",this.sending=!1,this.changes=[],this.proposals=[],this.error="";let i=this.api;if(t===void 0||s||i===void 0)return;let o=this.begun;pr(i,t).then(l=>{o===this.begun&&this.draft===""&&(this.draft=l)})}async load(t){let s=this.conversationId,[i,o,l]=await Promise.all([t.chatAgent(),t.call("list_proposals",{state:"pending",limit:Pe}),this.recorded?this.saved(t,s):void 0]);return()=>{if(this.agent=i,l===null){this.begin(void 0);return}this.proposals=o.proposals.filter(c=>c.conversation_id===s),this.changes=l?.changes??[],this.resuming&&l!==void 0&&(this.resuming=!1,this.messages=l.messages.map((c,a)=>({...c,index:a})).filter(c=>cr.has(c.role)),this.messages.some(c=>c.index===this.found)||(this.found=null,this.scrollToFound=!1))}}async saved(t,s){try{return await t.call("get_conversation",{id:s})}catch(i){if(!this.resuming&&we(i))return null;throw i}}connectedCallback(){super.connectedCallback(),this.hasUpdated&&this.reload()}ready(){let t=this.agent;return t?.ready===!0&&t.agent_id!==null?t.agent_id:void 0}missing(){return this.agent?.ready===!0?lr:dr}async send(){let t=this.api,s=this.ready(),i=this.draft.trim();if(t===void 0||s===void 0||i===""||this.sending)return;let o=this.begun;this.messages=[...this.messages,{role:"user",text:i}],this.draft="",this.sending=!0;let l;try{let c=await t.converse(i,this.conversationId,s);if(o!==this.begun)return;this.conversationId=c.conversation_id??this.conversationId,this.recorded=!0;let a=c.response.speech?.plain?.speech??"";l={role:c.response.response_type==="error"?"error":"assistant",text:a}}catch(c){if(o!==this.begun)return;l={role:"error",text:K(c)}}this.messages=[...this.messages,l],this.sending=!1,await this.reload()}newChat(){this.begin(void 0),this.reload()}open(t){this.begin({kind:"resume",id:t.id}),this.found=t.index,this.scrollToFound=t.index!==null,this.listOpen=!1,this.reload()}deleted(t){t===this.conversationId&&this.newChat()}updated(t){if(super.updated(t),!this.scrollToFound)return;let s=this.shadowRoot?.querySelector(".message.found");s!=null&&(this.scrollToFound=!1,s.scrollIntoView({block:"center"}))}async act(t){await this.run(t)&&this.changed()}keydown(t){t.key!=="Enter"||t.shiftKey||t.isComposing||(t.preventDefault(),this.send())}renderMessage(t){let s=t.index!==void 0&&t.index===this.found;return n`<div
      class="message ${t.role}${s?" found":""}"
      data-index=${t.index??d}
    >
      ${t.role==="assistant"?Se(t.text,this.api):n`<div class="pre">${t.text}</div>`}
    </div>`}renderLinked(){return n`${this.changes.length===0?d:n`<h3>Changes made in this chat</h3>
            <ul class="changes">
              ${this.changes.map(t=>n`<li>
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
                    <div class="muted">${$(t.time)}</div>
                    ${t.changes.map(s=>n`<div class="muted">${T(s)}</div>`)}
                  </li>`)}
            </ul>`}
    ${this.proposals.length===0?d:n`<h3>Waiting for you</h3>
            <ul class="waiting">
              ${this.proposals.map(t=>n`<li data-id=${t.proposal_id}>
                    <strong class="pre">${t.summary}</strong>
                    <div class="pre">${t.reason}</div>
                    ${t.changes.map(s=>n`<div class="muted">${T(s)}</div>`)}
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
            </ul>`}`}renderMessages(){return n`<div class="messages">
      ${this.messages.map(t=>this.renderMessage(t))}
      ${this.sending?n`<div class="muted">Thinking…</div>`:d}
    </div>`}renderComposer(){return n`<form
      class="send"
      @submit=${t=>{t.preventDefault(),this.send()}}
    >
      <textarea
        aria-label="Message"
        placeholder="Ask about the tank"
        .value=${es(this.draft)}
        ?disabled=${this.sending}
        @input=${t=>{this.draft=t.target.value}}
        @keydown=${t=>{this.keydown(t)}}
      ></textarea>
      <div class="row">
        <span class="grow muted">Enter sends, Shift+Enter adds a line.</span>
        <button class="primary" type="submit" ?disabled=${this.sending}>Send</button>
      </div>
    </form>`}render(){let t=this.ready()!==void 0;return n`<div class="layout">
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
          ${t?n`<button
                  class="new"
                  ?disabled=${this.sending}
                  @click=${()=>{this.newChat()}}
                >
                  New chat
                </button>`:d}
        </div>
        ${this.error?n`<p class="error">${this.error}</p>`:d}
        ${this.agent!==void 0&&!t?n`<p class="muted">${this.missing()}</p>`:d}
        ${this.renderMessages()}
        ${this.readOnly?n`<p class="muted read-only">
                Read only. Only chats started here in the panel can go on. Start a New chat to ask
                more.
              </p>`:t?this.renderComposer():d}
        ${this.renderLinked()}
      </section>
    </div>`}};customElements.define("tk-chat",lt);var ur=[{name:"agent",label:"Conversation agent TankKeeper chats through",type:"text"},{name:"ai_task",label:"AI task entity for review comments",type:"text"},{name:"review_on",label:"Review after",type:"list"},{name:"comments",label:"Claude comments on reviews",type:"checkbox"},{name:"daily_time",label:"Daily review at",type:"time"},{name:"daily_cap",label:"Claude comments a day, at most",type:"number"}],hr=20,mr={test:"Test",task:"Task",status:"Status change",daily:"Daily"};function fr(r){let e=r.triggers.map(s=>mr[s]??s).join(", "),t=r.proposal_ids.length;return n`<li class="review">
    <div class="muted">${$(r.time)} · ${e}</div>
    <div>${r.result}</div>
    ${r.comment===null?d:n`<div class="comment">Claude: ${r.comment}</div>`}
    ${r.note===null?d:n`<div class="muted">${r.note}</div>`}
    ${t===0?d:n`<div class="muted">
            ${t} plan ${t===1?"change":"changes"} proposed
          </div>`}
  </li>`}var dt=class extends h{static{this.properties={...h.properties,settings:{state:!0},reviews:{state:!0}}}static{this.styles=v}constructor(){super(),this.settings=void 0,this.reviews=[]}async load(e){let[t,s]=await Promise.all([e.call("get_claude"),e.call("get_reviews",{limit:hr})]);return()=>{this.settings=t,this.reviews=s.reviews}}render(){let e=this.settings;return n`<section>
      <h2>Claude</h2>
      ${this.error?n`<p class="error">${this.error}</p>`:d}
      ${e===void 0?d:n`<p class="muted note">${e.model_note}</p>
              ${U(ur,e)}
              ${A(this.api,"settings","claude",this.version)}`}
      <h3>Reviews</h3>
      ${this.reviews.length===0?n`<p class="muted">No reviews yet.</p>`:n`<ul class="reviews">
              ${this.reviews.map(fr)}
            </ul>`}
    </section>`}};customElements.define("tk-claude",dt);var vs=50,ct=class extends h{static{this.properties={...h.properties,conversations:{state:!0},query:{state:!0},selected:{state:!0},detail:{state:!0}}}static{this.styles=v}constructor(){super(),this.conversations=[],this.query="",this.selected=void 0,this.detail=void 0,this.addEventListener(de,()=>{this.selected=void 0})}reloadOn(){return["api","query","selected"]}async load(e){let t=this.selected;if(t!==void 0){let i=await e.call("get_conversation",{id:t});return()=>{this.detail=i}}let s=this.query===""?await e.call("list_conversations",{limit:vs}):await e.call("search_conversations",{query:this.query,limit:vs});return()=>{this.detail=void 0,this.conversations=s.conversations}}search(e){e.preventDefault();let t=e.target.querySelector("input");this.query=(t?.value??"").trim()}async undo(e){await this.run(t=>t.call("undo_change",{history_id:e.id}))&&this.changed()}renderDetail(e){return n`<section>
      <div class="row">
        <button class="back" @click=${()=>this.selected=void 0}>Back</button>
        <h2 class="grow">${e.name}</h2>
        ${e.id.startsWith(ce)?n`<button
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
      <div class="muted">${C(e.source)} · ${$(e.started)}</div>
      ${this.error?n`<p class="error">${this.error}</p>`:d}
      <p class="pre">${e.summary}</p>
      <h3>Messages</h3>
      <ul>
        ${e.messages.map(t=>n`<li class=${t.role}>
              <div class="role muted">${t.role}</div>
              ${t.role==="assistant"?Se(t.text,this.api):n`<div class="pre">${t.text}</div>`}
            </li>`)}
      </ul>
      <h3>Changes</h3>
      ${e.changes.length===0?n`<p class="muted">No changes</p>`:d}
      <ul>
        ${e.changes.map(t=>n`<li>
              <div class="row">
                <span class="grow">${t.summary}</span>
                <button class="undo" ?disabled=${this.busy} @click=${()=>this.undo(t)}>
                  Undo
                </button>
              </div>
              <div class="muted">${$(t.time)} · ${C(t.source)}</div>
              ${t.changes.map(s=>n`<div class="muted">${T(s)}</div>`)}
            </li>`)}
      </ul>
    </section>`}render(){return this.detail!==void 0?this.renderDetail(this.detail):n`<section>
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
      ${this.error?n`<p class="error">${this.error}</p>`:d}
      ${this.conversations.length===0?n`<p class="muted">No conversations</p>`:d}
      <ul>
        ${w(this.conversations,e=>e.id,e=>n`<li data-id=${e.id}>
              <div class="row">
                <strong class="grow">${e.name}</strong>
                <button class="open" @click=${()=>this.selected=e.id}>Open</button>
              </div>
              <div class="muted">
                ${C(e.source)} · ${$(e.updated)}
              </div>
              ${e.match===void 0?d:Re(e.match)}
              <div class="pre">${e.summary}</div>
            </li>`)}
      </ul>
    </section>`}};customElements.define("tk-conversations",ct);var ys=r=>r??d;var gr=["mon","tue","wed","thu","fri","sat","sun"];function vr(r){return r.charAt(0).toUpperCase()+r.slice(1)}function yr(r,e){return[...r.querySelectorAll(`input[name="${e}"]`)].filter(t=>t.checked).map(t=>t.value)}function $r(r,e){if(r.type==="weekdays")return yr(e,r.name);let t=e.elements.namedItem(r.name);return r.type==="checkbox"?t.checked:kr(r,t.value)}function br(r){return r==null?"":Array.isArray(r)?r.map(String).join(`
`):typeof r=="string"||typeof r=="number"||typeof r=="boolean"?String(r):JSON.stringify(r)}function kr(r,e){return r.type==="number"?e.trim()===""?null:Number(e):r.type==="list"?e.split(`
`).map(t=>t.trim()).filter(t=>t!==""):e}function wr(r){return r===""||r===null||r===!1||Array.isArray(r)&&r.length===0}function _r(r,e,t){let s={};for(let i of r){let o=$r(i,e),l=t[i.name];wr(o)&&l==null||JSON.stringify(o)!==JSON.stringify(l)&&(s[i.name]=o)}return s}var pt=class extends x{static{this.properties={fields:{attribute:!1},values:{attribute:!1},submitLabel:{attribute:!1},busy:{type:Boolean},error:{attribute:!1}}}constructor(){super(),this.fields=[],this.values={},this.submitLabel="Save",this.busy=!1,this.error=""}static{this.styles=k`
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
  `}weekdays(e){let t=this.values[e.name],s=Array.isArray(t)?t.map(String):[];return n`<fieldset>
      <legend>${e.label}</legend>
      ${gr.map(i=>n`<label class="day"
            ><input
              name=${e.name}
              type="checkbox"
              value=${i}
              .checked=${s.includes(i)}
            />${vr(i)}</label
          >`)}
    </fieldset>`}input(e){let t=br(this.values[e.name]);return e.type==="select"?n`<select name=${e.name} ?required=${e.required===!0} .value=${t}>
        <option value="" ?selected=${t===""}></option>
        ${(e.options??[]).map(s=>n`<option value=${s} ?selected=${s===t}>${s}</option>`)}
      </select>`:e.type==="checkbox"?n`<input
        name=${e.name}
        type="checkbox"
        .checked=${this.values[e.name]===!0}
      />`:e.type==="textarea"||e.type==="list"?n`<textarea
        name=${e.name}
        rows="3"
        ?required=${e.required===!0}
        .value=${t}
      ></textarea>`:n`<input
      name=${e.name}
      type=${e.type}
      step=${ys(e.step??(e.type==="number"?"any":void 0))}
      ?required=${e.required===!0}
      .value=${t}
    />`}reset(){this.renderRoot.querySelector("form")?.reset()}submit(e){e.preventDefault();let t=_r(this.fields,e.target,this.values);this.dispatchEvent(new CustomEvent("tk-save",{detail:t,bubbles:!0,composed:!0}))}render(){return n`<form
      @submit=${e=>{this.submit(e)}}
    >
      ${this.fields.map(e=>e.type==="weekdays"?this.weekdays(e):n`<label>${e.label} ${this.input(e)}</label>`)}
      ${this.error?n`<p class="error">${this.error}</p>`:d}
      <button type="submit" ?disabled=${this.busy}>${this.submitLabel}</button>
    </form>`}};customElements.define("tk-form",pt);async function R(r,e){let t=r.target;await e(r.detail)&&t.reset()}var xr=["proposed","accepted","replaced"],$s=[{name:"title",label:"Title",type:"text"},{name:"decision",label:"Decision",type:"textarea"},{name:"why",label:"Why",type:"textarea"},{name:"open",label:"Open points, one per line",type:"list"},{name:"date",label:"Date",type:"date"}],Tr=[...$s,{name:"status",label:"Status",type:"select",options:["proposed","accepted"]}],Ar=[{name:"replaced_by",label:"Replaced by decision number",type:"number",step:"1"}];function Le(r){return String(r).padStart(4,"0")}var ut=class extends h{static{this.properties={...h.properties,decisions:{state:!0},status:{state:!0},selected:{state:!0},detail:{state:!0}}}static{this.styles=v}constructor(){super(),this.decisions=[],this.status="",this.selected=void 0,this.detail=void 0}reloadOn(){return["api","status","selected"]}async load(e){let t=this.status===""?{}:{status:this.status},{decisions:s}=await e.call("list_decisions",t),i=this.selected===void 0?void 0:await e.call("get_decision",{number:this.selected});return()=>{this.decisions=s,this.detail=i}}async save(e,t,s){if(e!=="accept"&&Object.keys(t).length===0)return!1;let i=s===void 0?{action:e,...t}:{action:e,number:s,...t},o=await this.run(l=>l.call("set_decision",i));return o&&this.changed(),o}toggle(e){this.selected=this.selected===e?void 0:e}renderDetail(e){return n`<div class="card">
      <p class="pre">${e.decision}</p>
      <h3>Why</h3>
      <p class="pre">${e.why}</p>
      ${e.open.length>0?n`<h3>Open points</h3>
              <ul>
                ${e.open.map(t=>n`<li>${t}</li>`)}
              </ul>`:d}
      ${e.replaced_by===null?d:n`<p class="muted">Replaced by ${Le(e.replaced_by)}</p>`}
      ${e.replaces.length>0?n`<p class="muted">Replaces ${e.replaces.map(Le).join(", ")}</p>`:d}
      ${e.status==="proposed"?n`<button
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
          .fields=${$s}
          .values=${e}
          .busy=${this.busy}
          @tk-save=${t=>this.save("update",t.detail,e.number)}
        ></tk-form>
      </details>
      <details>
        <summary>Replace</summary>
        <tk-form
          class="replace"
          .fields=${Ar}
          submitLabel="Replace"
          .busy=${this.busy}
          @tk-save=${t=>R(t,s=>this.save("replace",s,e.number))}
        ></tk-form>
      </details>
      <tk-history
        .api=${this.api}
        .collection=${"decisions"}
        .recordId=${Le(e.number)}
        .stamp=${this.version}
      ></tk-history>
    </div>`}renderDecision(e){let t=this.selected===e.number;return n`<li data-number=${e.number}>
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
    </li>`}render(){return n`
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
            ${xr.map(e=>n`<option value=${e}>${e}</option>`)}
          </select>
        </div>
        ${this.error?n`<p class="error">${this.error}</p>`:d}
        <ul>
          ${w(this.decisions,e=>e.number,e=>this.renderDecision(e))}
        </ul>
      </section>
      <section>
        <h2>Add a decision</h2>
        <tk-form
          class="add"
          .fields=${Tr}
          submitLabel="Add"
          .busy=${this.busy}
          @tk-save=${e=>R(e,t=>this.save("add",t))}
        ></tk-form>
      </section>
    `}};customElements.define("tk-decisions",ut);var Er=100,Cr=["all","dose","test","event"],Sr=[["ammonia","Ammonia (ppm)"],["nitrite","Nitrite (ppm)"],["nitrate","Nitrate (ppm)"],["phosphate","Phosphate (ppm)"],["ph","pH"],["kh","KH (dKH)"],["gh","GH (dGH)"],["temperature_c","Temperature (\xB0C)"]],Rr=[{name:"source",label:"Water",type:"select",options:["tank","tap"]},...Sr.map(([r,e])=>({name:r,label:e,type:"number"})),{name:"notes",label:"Notes",type:"textarea"}],ht=class extends h{static{this.properties={...h.properties,entries:{state:!0},kind:{state:!0},products:{state:!0}}}static{this.styles=v}constructor(){super(),this.entries=[],this.kind="all",this.products=[]}reloadOn(){return["api","kind"]}async load(e){let[t,s]=await Promise.all([e.call("get_log",{kind:this.kind,limit:Er}),e.call("list_products")]);return()=>{this.entries=t.entries,this.products=s.products.map(i=>i.name)}}doseFields(){return[{name:"product",label:"Product",type:"select",options:this.products,required:!0},{name:"amount_ml",label:"Amount (ml)",type:"number",required:!0},{name:"why",label:"Why",type:"text"},{name:"notes",label:"Notes",type:"textarea"}]}async record(e,t){let s=await this.run(i=>i.call(e,t));return s&&this.changed(),s}async recordTest(e){if(Object.keys(e).length===0)return!1;let{source:t,notes:s,...i}=e,o={values:i};return t!==void 0&&(o.source=t),s!==void 0&&(o.notes=s),this.record("record_test",o)}render(){return n`
      <section>
        <div class="row">
          <h2 class="grow">Log</h2>
          <select
            class="kind"
            aria-label="Kind"
            .value=${this.kind}
            @change=${e=>this.kind=e.target.value}
          >
            ${Cr.map(e=>n`<option value=${e}>${e}</option>`)}
          </select>
        </div>
        ${this.error?n`<p class="error">${this.error}</p>`:d}
        <ul>
          ${this.entries.map(e=>n`<li>
                <div class="pre">${Jt(e)}</div>
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
          @tk-save=${e=>R(e,t=>this.record("record_dose",t))}
        ></tk-form>
      </section>
      <section>
        <h2>Record a test</h2>
        <tk-form
          class="test"
          .fields=${Rr}
          submitLabel="Record"
          .busy=${this.busy}
          @tk-save=${e=>R(e,t=>this.recordTest(t))}
        ></tk-form>
      </section>
    `}};customElements.define("tk-log",ht);var Pr=20,Lr=[{name:"camera",label:"Camera entity, such as a Tapo C100",type:"text"},{name:"check_time",label:"Daily check at, only while a light is on",type:"time"},{name:"after_test",label:"Check after each test",type:"checkbox"},{name:"alerts",label:"Alert me about issues",type:"checkbox"},{name:"keep_days",label:"Keep photos for (days)",type:"number"}],Dr={daily:"Daily",test:"After a test",manual:"Check now",chat:"Asked in a chat"},Ir=[["water","Water"],["algae","Algae"],["plants","Plants"],["level","Water level"]];function mt(r){return r.photo_url===null?d:n`<img class="photo" src=${r.photo_url} alt="The tank at ${$(r.time)}" />`}function ft(r){return`${$(r.time)} \xB7 ${Dr[r.reason]}`}function gt(r){let e=Ir.filter(([t])=>r.seen[t]!==void 0);return n`
    ${r.summary===null?d:n`<div class="summary">${r.summary}</div>`}
    ${r.suggestion===null?d:n`<div>Suggested: ${r.suggestion}</div>`}
    ${e.length===0?d:n`<ul class="seen">
            ${e.map(([t,s])=>n`<li><strong>${s}</strong> ${r.seen[t]}</li>`)}
          </ul>`}
    ${r.note===null?d:n`<div class="muted note">${r.note}</div>`}
  `}var vt=class extends h{static{this.properties={...h.properties,stamp:{type:Number},info:{state:!0},photos:{state:!0},proposals:{state:!0}}}static{this.styles=[v,k`
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
    `]}constructor(){super(),this.stamp=0,this.info=void 0,this.photos=void 0,this.proposals=[]}reloadOn(){return["api","stamp"]}async load(e){let[t,s]=await Promise.all([e.call("get_camera"),e.call("list_proposals",{state:"pending"})]);return()=>{this.info=t,this.proposals=s.proposals,t.camera===null&&(this.photos=void 0)}}async act(e){await this.run(e)&&this.changed()}async showPhotos(){await this.run(async e=>{let t=await e.call("list_photos",{limit:Pr});this.photos=t.photos})}renderIssue(e){let t=this.proposals.filter(s=>e.proposal_ids.includes(s.proposal_id));return n`<li class="issue" data-check=${e.id}>
      <div class="muted">${ft(e)}</div>
      ${mt(e)} ${gt(e)}
      ${t.length===0?d:n`<div class="waiting">
              <div class="muted">Accept applies:</div>
              ${t.map(s=>n`<div class="proposal">
                    <strong class="pre">${s.summary}</strong>
                    ${s.changes.map(i=>n`<div class="muted">${T(i)}</div>`)}
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
    </li>`}renderPhotos(){let e=this.photos;return e===void 0?n`<button class="photos" ?disabled=${this.busy} @click=${()=>this.showPhotos()}>
        Photos
      </button>`:n`<h3>Photos</h3>
      ${e.length===0?n`<p class="muted">No photos yet.</p>`:d}
      <ul class="photos">
        ${w(e,t=>t.id,t=>n`<li class="photo-check">
              <div class="muted">${ft(t)}</div>
              ${mt(t)} ${gt(t)}
            </li>`)}
      </ul>`}renderSettings(e){return n`<details class="settings">
      <summary>Camera settings</summary>
      <p class="muted">
        Each check sends the photo to Anthropic through the AI task entity, uses paid API calls and
        counts toward Claude's comments a day.
      </p>
      ${U(Lr,e)} ${A(this.api,"settings","camera",this.version)}
    </details>`}render(){let e=this.info;if(e===void 0)return this.error?n`<p class="error">${this.error}</p>`:n``;let t=this.error?n`<p class="error">${this.error}</p>`:d;if(e.camera===null)return n`<section id="camera">
        <h2>Camera</h2>
        ${t}
        <p class="muted">
          No camera is set. Add one in the settings, such as a Tapo C100, to have Claude look at the
          tank.
        </p>
        ${this.renderSettings(e)}
      </section>`;let s=e.latest;return n`<section id="camera">
        <h2>Camera</h2>
        ${t}
        ${s===null?n`<p class="muted">No photo yet.</p>`:n`<div class="latest">
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
      ${e.open.length===0?d:n`<section id="seen">
              <h2>Seen by the camera</h2>
              <ul>
                ${w(e.open,i=>i.id,i=>this.renderIssue(i))}
              </ul>
            </section>`}`}};customElements.define("tk-camera",vt);var Nr=7,bs=30,Hr=60,ks={on_course:"On course",watch:"Watch",act:"Act"},Or={cycling:"Cycling",cycled:"Cycled"},Mr=[{name:"name",label:"Name",type:"text"},{name:"volume_litres",label:"Volume (litres)",type:"number"},{name:"dosing_volume_litres",label:"Water volume for doses (litres)",type:"number"},{name:"temperature_c",label:"Target temperature (\xB0C)",type:"number"},{name:"stage",label:"Stage",type:"select",options:["cycling","cycled"]},{name:"notes",label:"Notes",type:"textarea"}],Vr=[{name:"source",label:"Values come from",type:"select",options:["supplier","tap_test"]},{name:"ph",label:"pH",type:"number"},{name:"kh",label:"KH (dKH)",type:"number"},{name:"gh",label:"GH (dGH)",type:"number"},{name:"nitrate",label:"Nitrate (mg/l)",type:"number"},{name:"phosphate",label:"Phosphate (mg/l)",type:"number"},{name:"notes",label:"Notes",type:"textarea"}],Ur=[{name:"nitrogen_watch",label:"Ammonia or nitrite Watch above (ppm)",type:"number"},{name:"nitrogen_act",label:"Ammonia or nitrite Act above (ppm)",type:"number"},{name:"ph_watch",label:"pH Watch under, while cycling",type:"number"},{name:"ph_act",label:"pH Act under, while cycling",type:"number"},{name:"stall_watch_days",label:"Stalled cycle Watch after (days)",type:"number",step:"1"},{name:"stall_act_days",label:"Stalled cycle Act after (days)",type:"number",step:"1"},{name:"test_watch_days",label:"Late test Watch after (days)",type:"number",step:"1"},{name:"test_act_days",label:"Late test Act after (days)",type:"number",step:"1"},{name:"skip_watch",label:"Skipped tasks for Watch",type:"number",step:"1"},{name:"skip_act",label:"Skipped tasks for Act",type:"number",step:"1"},{name:"plan_watch_days",label:"Plan ends within, for Watch (days)",type:"number",step:"1"},{name:"plan_act_days",label:"Plan ends within, for Act (days)",type:"number",step:"1"}],yt=class extends h{static{this.properties={...h.properties,status:{state:!0},tank:{state:!0},plan:{state:!0},log:{state:!0},lights:{state:!0},proposals:{state:!0}}}static{this.styles=v}constructor(){super(),this.status=void 0,this.tank=void 0,this.plan=void 0,this.log=[],this.lights=void 0,this.proposals=[]}async load(e){let t=N(new Date,e.timeZone),[s,i,o,l,c,a]=await Promise.all([e.call("get_status"),e.call("get_tank"),e.call("get_plan",{start:t,end:H(t,Nr)}),e.call("get_log",{kind:"test",since:H(t,-Hr),limit:500}),e.call("get_light",{days:bs}),e.call("list_proposals",{state:"pending"})]);return()=>{this.status=s,this.tank=i,this.plan=o,this.log=l.entries,this.lights=c,this.proposals=a.proposals}}async act(e){await this.run(e)&&this.changed()}settingsCard(e,t,s,i,o,l){return n`<section id=${e}>
      <h2>${t}</h2>
      ${U(s,i)} ${A(this.api,o,l,this.version)}
    </section>`}renderStatus(e,t){let s=e.status===null?"Not checked yet":ks[e.status],i=e.stage===null?"":Or[e.stage];return n`<section id="status">
      <div class="row">
        <h2 class="grow">${t.tank.name}</h2>
        <strong class="level ${e.status??""}">${s}</strong>
      </div>
      <div class="muted">
        ${[i,e.checked===null?"":`checked ${$(e.checked)}`].filter(o=>o!=="").join(" \xB7 ")}
      </div>
      <ul>
        ${e.rules.filter(o=>o.level!=="on_course").map(o=>n`<li>
                <strong>${ks[o.level]}</strong> ${o.reason}
                ${o.action===null?d:n`<div>${o.action}</div>`}
              </li>`)}
      </ul>
    </section>`}renderTask(e,t){return n`<li>
      <div class="row">
        <span class="grow">${e.time??""} ${e.text}</span>
        ${t&&e.state==="open"?n`<button
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
                </button>`:n`<span class="muted">${e.state==="open"?"":e.state}</span>`}
      </div>
    </li>`}renderLight(e,t){let{schedule:s,automation:i}=e;return n`<li data-light=${e.id}>
      <div class="row">
        <strong class="grow">${e.model}</strong>
        <span class="muted">${e.state??"unknown"}</span>
      </div>
      ${s===null?n`<div><strong>Needs helpers</strong></div>
              <div class="muted">
                Should run ${e.on} to
                ${e.off}${e.brightness_pct===null?"":`, ${String(e.brightness_pct)}%`}
              </div>`:n`<div>${Fr(s)}</div>`}
      ${i===null?d:n`<div class="muted">
              Automation
              ${i.id===null?i.entity_id:n`<a class="automation" href=${`/config/automation/edit/${i.id}`}
                      >${i.entity_id}</a
                    >`}
              (${i.state??"missing"})
            </div>`}
      <div class="muted">Today ${e.today.on} to ${e.today.off}</div>
      ${e.problems.map(o=>n`<div class="error">${o}</div>`)}
      ${Ce(Ee(e.on_periods,t,bs,this.api?.timeZone))}
      ${A(this.api,"lights",e.id,this.version)}
    </li>`}renderParameters(e,t){let{charts:s,empty:i}=ns(this.log,e.settings,t.tank.temperature_c,t.water);return n`<section id="parameters">
      <h2>Water parameters</h2>
      <div class="charts">
        ${s.map(o=>n`<div class="parameter" data-parameter=${o.key}>
              <h3>${o.label}</h3>
              ${ae(o.chart,o.label)}
            </div>`)}
      </div>
      ${i.length===0?d:n`<p class="muted">No readings yet for: ${i.join(", ")}</p>`}
    </section>`}renderProposal(e){return n`<li>
      <strong class="pre">${e.summary}</strong>
      <div class="pre">${e.reason}</div>
      <div class="muted">${C(e.source)} · ${$(e.created)}</div>
      ${e.changes.map(t=>n`<div class="muted">${T(t)}</div>`)}
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
    </li>`}render(){let{status:e,tank:t,plan:s,lights:i}=this;if(e===void 0||t===void 0||s===void 0||i===void 0)return this.error?n`<p class="error">${this.error}</p>`:n`<p class="muted">Loading</p>`;let o=N(new Date,this.api?.timeZone),l=s.tasks.filter(a=>a.date===o),c=s.tasks.filter(a=>a.date>o);return n`
      ${this.error?n`<p class="error">${this.error}</p>`:d}
      ${this.renderStatus(e,t)}
      <section id="today">
        <h2>Today</h2>
        ${l.length===0?n`<p class="muted">No tasks today</p>`:d}
        <ul>
          ${w(l,a=>a.id,a=>this.renderTask(a,!0))}
        </ul>
      </section>
      <section id="waiting">
        <h2>Waiting for you</h2>
        ${this.proposals.length===0?n`<p class="muted">Nothing is waiting for you</p>`:d}
        <ul>
          ${w(this.proposals,a=>a.proposal_id,a=>this.renderProposal(a))}
        </ul>
      </section>
      <section id="cycle">
        <h2>Cycle</h2>
        ${ae(Ae(this.log,e.settings),"Cycle")}
      </section>
      ${this.renderParameters(e,t)}
      <section id="week">
        <h2>Next 7 days</h2>
        ${c.length===0?n`<p class="muted">No tasks</p>`:d}
        <ul>
          ${c.map(a=>n`<li>
                <span class="muted">${a.date}</span> ${a.time??""} ${a.text}
              </li>`)}
        </ul>
      </section>
      ${this.settingsCard("tank","Tank",Mr,t.tank,"tank","tank")}
      ${this.settingsCard("water","Water",Vr,t.water??{},"water","water")}
      <section id="light">
        <h2>Light</h2>
        ${i.lights.length===0?n`<p class="muted">No lights yet</p>`:d}
        ${i.next_change===null?d:n`<div class="muted">Next change ${$(i.next_change.time)}</div>`}
        <ul>
          ${w(i.lights,a=>a.id,a=>this.renderLight(a,i.today))}
        </ul>
      </section>
      ${this.settingsCard("rules","Rule limits",Ur,e.settings,"settings","rules")}
      <tk-camera .api=${this.api} .stamp=${this.version}></tk-camera>
    `}};customElements.define("tk-overview",yt);function Fr(r){let e=[`${r.on??"?"} to ${r.off??"?"}`];return r.brightness_pct!==null&&e.push(`${String(r.brightness_pct)}%`),r.ramp_minutes!==null&&e.push(`${String(r.ramp_minutes)} min ramp`),e.join(", ")}var jr="M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z",qr=28,ws=[{name:"text",label:"Task",type:"text"},{name:"date",label:"Date",type:"date"},{name:"slot",label:"Slot",type:"select",options:["task","dose"]}],_s={name:"note",label:"Note",type:"text"},xs=[{name:"every_days",label:"Repeat every N days",type:"number",step:"1"},{name:"weekdays",label:"Or repeat weekly on",type:"weekdays"},{name:"until",label:"Repeat until",type:"date"}],Wr=[...ws,_s,...xs],Ts=[...ws,{name:"state",label:"State",type:"select",options:["open","complete","skip"]},_s],Br=[...Ts,{name:"scope",label:"Apply to (the repeat changes only for this and later ones)",type:"select",options:["this","future"],required:!0},...xs],Kr=[{name:"notify",label:"Notify services for reminders",type:"list"},{name:"status_notify",label:"Notify services for status alerts",type:"list"},{name:"task_time",label:"Task reminder time",type:"time"},{name:"dose_time",label:"Dose reminder time",type:"time"},{name:"resend_time",label:"Resend open tasks at",type:"time"}],$t=class extends h{static{this.properties={...h.properties,plan:{state:!0}}}static{this.styles=v}constructor(){super(),this.plan=void 0}async load(e){let t=N(new Date,e.timeZone),s=await e.call("get_plan",{start:t,end:H(t,qr-1)});return()=>{this.plan=s}}async save(e,t,s){if(s===void 0&&Object.keys(t).length===0)return!1;let i=Object.fromEntries(Object.entries(t).filter(([,c])=>!Array.isArray(c)||c.length>0)),o=s===void 0?i:{task_id:s,...i},l=await this.run(c=>c.call(e,o));return l&&this.changed(),l}renderTask(e){let t=this.plan?.series.find(s=>s.id===e.series_id);return n`<li data-task=${e.id}>
      <div class="row">
        ${t===void 0?d:n`<ha-svg-icon class="repeat" .path=${jr} title="Repeats"></ha-svg-icon>`}
        <span class="grow">${e.time??""} ${e.text}</span>
        <button
          class="remove"
          ?disabled=${this.busy}
          @click=${()=>this.save("remove_task",{},e.id)}
        >
          Remove
        </button>
        ${t===void 0?d:n`<button
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
          .fields=${t===void 0?Ts:Br}
          .values=${t===void 0?e:zr(e,t)}
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
    </li>`}render(){let e=this.plan,t=[...new Set(e?.tasks.map(s=>s.date)??[])];return n`
      <section>
        <h2>Plan</h2>
        ${this.error?n`<p class="error">${this.error}</p>`:d}
        ${e!==void 0&&t.length===0?n`<p class="muted">No tasks in the next four weeks</p>`:d}
        ${t.map(s=>n`<h3>${s}</h3>
              <ul>
                ${w(e?.tasks.filter(i=>i.date===s)??[],i=>i.id,i=>this.renderTask(i))}
              </ul>`)}
      </section>
      <section>
        <h2>Add a task</h2>
        <tk-form
          class="add"
          .fields=${Wr}
          submitLabel="Add"
          .busy=${this.busy}
          @tk-save=${s=>R(s,i=>this.save("add_task",i))}
        ></tk-form>
      </section>
      ${e===void 0?d:n`<section id="reminders">
              <h2>Reminders</h2>
              ${U(Kr,e.reminders)}
              ${A(this.api,"settings","reminders",this.version)}
            </section>`}
    `}};function zr(r,e){return{...r,scope:"this",every_days:e.every_days,weekdays:e.weekdays,until:e.until}}customElements.define("tk-plan",$t);function y(r){return typeof r=="string"||typeof r=="number"?String(r):""}function Gr(r){return r.label_dose??{}}var Yr={products:{title:"Products",collection:"products",list:"list_products",key:"products",canShowRemoved:!0,label:r=>y(r.name),lines:r=>{let e=Gr(r),t=[y(r.purpose)];if(r.label_dose){let s=r.label_dose_for_tank_ml===void 0?"":` (${y(r.label_dose_for_tank_ml)} ml for this tank)`;t.push(`Label: ${y(e.amount_ml)} ml per ${y(e.per_litres)} l, ${y(e.frequency)}${s}`)}return y(r.your_dose)&&t.push(`Your dose: ${y(r.your_dose)}`),t.push(y(r.notes)),Array.isArray(r.links)&&t.push(r.links.map(y).join(" ")),t}},contents:{title:"Contents",collection:"contents",list:"list_contents",key:"contents",canShowRemoved:!0,label:r=>y(r.name),lines:r=>[[y(r.type),y(r.count),y(r.where),`added ${y(r.added)}`].filter(e=>e!=="").join(" \xB7 "),y(r.notes)]},notes:{title:"Notes",collection:"notes",list:"list_notes",key:"notes",edit:{idArg:"note_id",add:"add_note",update:"update_note",remove:"remove_note",fields:[{name:"kind",label:"Kind",type:"select",options:["question","assumption"]},{name:"topic",label:"Topic",type:"text"},{name:"text",label:"Text",type:"textarea"},{name:"how_to_resolve",label:"How to resolve",type:"textarea"}]},canShowRemoved:!1,label:r=>`${y(r.kind)}: ${y(r.topic)}`,lines:r=>[y(r.text),y(r.how_to_resolve)]}},bt=class extends h{static{this.properties={...h.properties,kind:{attribute:!1},items:{state:!0},showRemoved:{state:!0}}}static{this.styles=v}constructor(){super(),this.kind="",this.items=[],this.showRemoved=!1}get config(){let e=Yr[this.kind];if(e===void 0)throw new Error(`No records called ${this.kind}`);return e}reloadOn(){return["api","kind","showRemoved"]}async load(e){let t=this.config,s=t.canShowRemoved?{include_removed:this.showRemoved}:{},i=(await e.call(t.list,s))[t.key]??[];return()=>{this.items=i}}async save(e,t,s,i){if(Object.keys(s).length===0)return!1;let o=i===void 0?s:{[e.idArg]:i,...s};return this.run(l=>l.call(t,o))}async removeRecord(e,t){await this.run(s=>s.call(e.remove,{[e.idArg]:t}))}status(e,t){return typeof t.removed=="string"?n`<span class="muted">Removed ${t.removed}</span>`:e===void 0?d:n`<button
      class="remove"
      ?disabled=${this.busy}
      @click=${()=>this.removeRecord(e,t.id)}
    >
      Remove
    </button>`}details(e,t){let s=e.edit;return s===void 0?A(this.api,e.collection,t.id,this.version):n`<details>
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
    </details>`}item(e,t){return n`<li data-id=${t.id}>
      <div class="row">
        <strong class="grow">${e.label(t)}</strong>
        ${this.status(e.edit,t)}
      </div>
      ${e.lines(t).filter(s=>s!=="").map(s=>n`<div class="muted pre">${s}</div>`)}
      ${this.details(e,t)}
    </li>`}add(e){return e===void 0?d:n`<section>
      <h2>Add</h2>
      <tk-form
        class="add"
        .fields=${e.fields}
        submitLabel="Add"
        .busy=${this.busy}
        @tk-save=${t=>R(t,s=>this.save(e,e.add,s))}
      ></tk-form>
    </section>`}render(){let e=this.config;return n`
      <section>
        <div class="row">
          <h2 class="grow">${e.title}</h2>
          ${e.canShowRemoved?n`<label class="muted"
                  ><input
                    type="checkbox"
                    class="show-removed"
                    .checked=${this.showRemoved}
                    @change=${t=>this.showRemoved=t.target.checked}
                  />
                  Show removed</label
                >`:d}
        </div>
        ${this.error?n`<p class="error">${this.error}</p>`:d}
        <ul>
          ${w(this.items,t=>t.id,t=>this.item(e,t))}
        </ul>
      </section>
      ${this.add(e.edit)}
    `}};customElements.define("tk-records",bt);var Zr=["proposal","photo","review","status"],Jr=/^[0-9A-Za-z_-]{1,64}$/;function Xr(r){let e=new URLSearchParams(r);for(let t of Zr){let s=e.get(t);if(s===null)continue;return(t==="status"?s==="now":Jr.test(s))?{kind:t,id:s}:void 0}}var Qr=[["overview","Overview"],["chat","Chat"],["plan","Plan"],["log","Log"],["contents","Contents"],["products","Products"],["decisions","Decisions"],["notes","Notes"],["conversations","Conversations"],["claude","Claude"]],kt=class extends x{constructor(){super();this.chat=document.createElement("tk-chat");this.connection=void 0;this.hass=void 0,this.panel=void 0,this.narrow=!1,this.route=void 0,this.addEventListener(We,t=>{this.openChat(t.detail)}),this.tab="overview",this.api=void 0}static{this.properties={hass:{attribute:!1},panel:{attribute:!1},narrow:{type:Boolean},route:{attribute:!1},tab:{state:!0},api:{state:!0}}}static{this.styles=k`
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
  `}connectedCallback(){super.connectedCallback(),this.followAddress()}followAddress(){let t=Xr(window.location.search);window.location.search!==""&&history.replaceState(history.state,"",window.location.pathname),t!==void 0&&this.openChat(t)}openChat(t){this.chat.start={...t},this.tab="chat"}willUpdate(t){t.has("route")&&this.followAddress(),this.updateApi(t),this.chat.api=this.api}updateApi(t){let s=this.hass;if(s===void 0||!(t.has("hass")||t.has("panel")))return;let i=this.panel?.config?.entry_id;this.connection===s.connection&&this.api?.entryId===i||(this.connection=s.connection,this.api=new ke(s.connection,s.config?.time_zone,i))}view(){switch(this.tab){case"chat":return n`${this.chat}`;case"plan":return n`<tk-plan .api=${this.api}></tk-plan>`;case"log":return n`<tk-log .api=${this.api}></tk-log>`;case"decisions":return n`<tk-decisions .api=${this.api}></tk-decisions>`;case"claude":return n`<tk-claude .api=${this.api}></tk-claude>`;case"conversations":return n`<tk-conversations .api=${this.api}></tk-conversations>`;case"contents":case"products":case"notes":return n`${Kt(this.tab,n`<tk-records .api=${this.api} .kind=${this.tab}></tk-records>`)}`;default:return n`<tk-overview .api=${this.api}></tk-overview>`}}render(){return n`
      <header>
        ${this.narrow?n`<ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>`:d}
        <h1>TankKeeper</h1>
        ${Qt(this.api)}
      </header>
      <nav role="tablist">
        ${Qr.map(([t,s])=>n`<button
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
    `}};customElements.define("tankkeeper-panel",kt);export{kt as TankkeeperPanel,Xr as discussed};
