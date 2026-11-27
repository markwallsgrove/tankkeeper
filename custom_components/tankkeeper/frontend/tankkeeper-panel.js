var X=globalThis,Q=X.ShadowRoot&&(X.ShadyCSS===void 0||X.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ve=Symbol(),Ue=new WeakMap,B=class{constructor(e,t,r){if(this._$cssResult$=!0,r!==ve)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(Q&&e===void 0){let r=t!==void 0&&t.length===1;r&&(e=Ue.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),r&&Ue.set(t,e))}return e}toString(){return this.cssText}},Fe=s=>new B(typeof s=="string"?s:s+"",void 0,ve),L=(s,...e)=>{let t=s.length===1?s[0]:e.reduce((r,i,o)=>r+(l=>{if(l._$cssResult$===!0)return l.cssText;if(typeof l=="number")return l;throw Error("Value passed to 'css' function must be a 'css' function result: "+l+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+s[o+1],s[0]);return new B(t,s,ve)},je=(s,e)=>{if(Q)s.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let r=document.createElement("style"),i=X.litNonce;i!==void 0&&r.setAttribute("nonce",i),r.textContent=t.cssText,s.appendChild(r)}},ye=Q?s=>s:s=>s instanceof CSSStyleSheet?(e=>{let t="";for(let r of e.cssRules)t+=r.cssText;return Fe(t)})(s):s;var{is:Ct,defineProperty:Rt,getOwnPropertyDescriptor:Pt,getOwnPropertyNames:Lt,getOwnPropertySymbols:Dt,getPrototypeOf:Ht}=Object,ee=globalThis,qe=ee.trustedTypes,Nt=qe?qe.emptyScript:"",It=ee.reactiveElementPolyfillSupport,z=(s,e)=>s,$e={toAttribute(s,e){switch(e){case Boolean:s=s?Nt:null;break;case Object:case Array:s=s==null?s:JSON.stringify(s)}return s},fromAttribute(s,e){let t=s;switch(e){case Boolean:t=s!==null;break;case Number:t=s===null?null:Number(s);break;case Object:case Array:try{t=JSON.parse(s)}catch{t=null}}return t}},Be=(s,e)=>!Ct(s,e),We={attribute:!0,type:String,converter:$e,reflect:!1,useDefault:!1,hasChanged:Be};Symbol.metadata??=Symbol("metadata"),ee.litPropertyMetadata??=new WeakMap;var E=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=We){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let r=Symbol(),i=this.getPropertyDescriptor(e,r,t);i!==void 0&&Rt(this.prototype,e,i)}}static getPropertyDescriptor(e,t,r){let{get:i,set:o}=Pt(this.prototype,e)??{get(){return this[t]},set(l){this[t]=l}};return{get:i,set(l){let d=i?.call(this);o?.call(this,l),this.requestUpdate(e,d,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??We}static _$Ei(){if(this.hasOwnProperty(z("elementProperties")))return;let e=Ht(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(z("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(z("properties"))){let t=this.properties,r=[...Lt(t),...Dt(t)];for(let i of r)this.createProperty(i,t[i])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[r,i]of t)this.elementProperties.set(r,i)}this._$Eh=new Map;for(let[t,r]of this.elementProperties){let i=this._$Eu(t,r);i!==void 0&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let r=new Set(e.flat(1/0).reverse());for(let i of r)t.unshift(ye(i))}else e!==void 0&&t.push(ye(e));return t}static _$Eu(e,t){let r=t.attribute;return r===!1?void 0:typeof r=="string"?r:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let r of t.keys())this.hasOwnProperty(r)&&(e.set(r,this[r]),delete this[r]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return je(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,r){this._$AK(e,r)}_$ET(e,t){let r=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,r);if(i!==void 0&&r.reflect===!0){let o=(r.converter?.toAttribute!==void 0?r.converter:$e).toAttribute(t,r.type);this._$Em=e,o==null?this.removeAttribute(i):this.setAttribute(i,o),this._$Em=null}}_$AK(e,t){let r=this.constructor,i=r._$Eh.get(e);if(i!==void 0&&this._$Em!==i){let o=r.getPropertyOptions(i),l=typeof o.converter=="function"?{fromAttribute:o.converter}:o.converter?.fromAttribute!==void 0?o.converter:$e;this._$Em=i;let d=l.fromAttribute(t,o.type);this[i]=d??this._$Ej?.get(i)??d,this._$Em=null}}requestUpdate(e,t,r,i=!1,o){if(e!==void 0){let l=this.constructor;if(i===!1&&(o=this[e]),r??=l.getPropertyOptions(e),!((r.hasChanged??Be)(o,t)||r.useDefault&&r.reflect&&o===this._$Ej?.get(e)&&!this.hasAttribute(l._$Eu(e,r))))return;this.C(e,t,r)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:r,reflect:i,wrapped:o},l){r&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,l??t??this[e]),o!==!0||l!==void 0)||(this._$AL.has(e)||(this.hasUpdated||r||(t=void 0),this._$AL.set(e,t)),i===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[i,o]of this._$Ep)this[i]=o;this._$Ep=void 0}let r=this.constructor.elementProperties;if(r.size>0)for(let[i,o]of r){let{wrapped:l}=o,d=this[i];l!==!0||this._$AL.has(i)||d===void 0||this.C(i,void 0,o,d)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(r=>r.hostUpdate?.()),this.update(t)):this._$EM()}catch(r){throw e=!1,this._$EM(),r}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};E.elementStyles=[],E.shadowRootOptions={mode:"open"},E[z("elementProperties")]=new Map,E[z("finalized")]=new Map,It?.({ReactiveElement:E}),(ee.reactiveElementVersions??=[]).push("2.1.2");var be=globalThis,ze=s=>s,te=be.trustedTypes,Ke=te?te.createPolicy("lit-html",{createHTML:s=>s}):void 0,_e="$lit$",T=`lit$${Math.random().toFixed(9).slice(2)}$`,ke="?"+T,Ot=`<${ke}>`,N=document,G=()=>N.createComment(""),Y=s=>s===null||typeof s!="object"&&typeof s!="function",we=Array.isArray,Qe=s=>we(s)||typeof s?.[Symbol.iterator]=="function",ge=`[ 	
\f\r]`,K=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Ge=/-->/g,Ye=/>/g,D=RegExp(`>|${ge}(?:([^\\s"'>=/]+)(${ge}*=${ge}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Je=/'/g,Ze=/"/g,et=/^(?:script|style|textarea|title)$/i,xe=s=>(e,...t)=>({_$litType$:s,strings:e,values:t}),a=xe(1),M=xe(2),ws=xe(3),S=Symbol.for("lit-noChange"),c=Symbol.for("lit-nothing"),Xe=new WeakMap,H=N.createTreeWalker(N,129);function tt(s,e){if(!we(s)||!s.hasOwnProperty("raw"))throw Error("invalid template strings array");return Ke!==void 0?Ke.createHTML(e):e}var st=(s,e)=>{let t=s.length-1,r=[],i,o=e===2?"<svg>":e===3?"<math>":"",l=K;for(let d=0;d<t;d++){let n=s[d],u,v,p=-1,f=0;for(;f<n.length&&(l.lastIndex=f,v=l.exec(n),v!==null);)f=l.lastIndex,l===K?v[1]==="!--"?l=Ge:v[1]!==void 0?l=Ye:v[2]!==void 0?(et.test(v[2])&&(i=RegExp("</"+v[2],"g")),l=D):v[3]!==void 0&&(l=D):l===D?v[0]===">"?(l=i??K,p=-1):v[1]===void 0?p=-2:(p=l.lastIndex-v[2].length,u=v[1],l=v[3]===void 0?D:v[3]==='"'?Ze:Je):l===Ze||l===Je?l=D:l===Ge||l===Ye?l=K:(l=D,i=void 0);let h=l===D&&s[d+1].startsWith("/>")?" ":"";o+=l===K?n+Ot:p>=0?(r.push(u),n.slice(0,p)+_e+n.slice(p)+T+h):n+T+(p===-2?d:h)}return[tt(s,o+(s[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),r]},J=class s{constructor({strings:e,_$litType$:t},r){let i;this.parts=[];let o=0,l=0,d=e.length-1,n=this.parts,[u,v]=st(e,t);if(this.el=s.createElement(u,r),H.currentNode=this.el.content,t===2||t===3){let p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(i=H.nextNode())!==null&&n.length<d;){if(i.nodeType===1){if(i.hasAttributes())for(let p of i.getAttributeNames())if(p.endsWith(_e)){let f=v[l++],h=i.getAttribute(p).split(T),y=/([.?@])?(.*)/.exec(f);n.push({type:1,index:o,name:y[2],strings:h,ctor:y[1]==="."?re:y[1]==="?"?ie:y[1]==="@"?oe:O}),i.removeAttribute(p)}else p.startsWith(T)&&(n.push({type:6,index:o}),i.removeAttribute(p));if(et.test(i.tagName)){let p=i.textContent.split(T),f=p.length-1;if(f>0){i.textContent=te?te.emptyScript:"";for(let h=0;h<f;h++)i.append(p[h],G()),H.nextNode(),n.push({type:2,index:++o});i.append(p[f],G())}}}else if(i.nodeType===8)if(i.data===ke)n.push({type:2,index:o});else{let p=-1;for(;(p=i.data.indexOf(T,p+1))!==-1;)n.push({type:7,index:o}),p+=T.length-1}o++}}static createElement(e,t){let r=N.createElement("template");return r.innerHTML=e,r}};function I(s,e,t=s,r){if(e===S)return e;let i=r!==void 0?t._$Co?.[r]:t._$Cl,o=Y(e)?void 0:e._$litDirective$;return i?.constructor!==o&&(i?._$AO?.(!1),o===void 0?i=void 0:(i=new o(s),i._$AT(s,t,r)),r!==void 0?(t._$Co??=[])[r]=i:t._$Cl=i),i!==void 0&&(e=I(s,i._$AS(s,e.values),i,r)),e}var se=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:r}=this._$AD,i=(e?.creationScope??N).importNode(t,!0);H.currentNode=i;let o=H.nextNode(),l=0,d=0,n=r[0];for(;n!==void 0;){if(l===n.index){let u;n.type===2?u=new U(o,o.nextSibling,this,e):n.type===1?u=new n.ctor(o,n.name,n.strings,this,e):n.type===6&&(u=new ne(o,this,e)),this._$AV.push(u),n=r[++d]}l!==n?.index&&(o=H.nextNode(),l++)}return H.currentNode=N,i}p(e){let t=0;for(let r of this._$AV)r!==void 0&&(r.strings!==void 0?(r._$AI(e,r,t),t+=r.strings.length-2):r._$AI(e[t])),t++}},U=class s{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,r,i){this.type=2,this._$AH=c,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=r,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=I(this,e,t),Y(e)?e===c||e==null||e===""?(this._$AH!==c&&this._$AR(),this._$AH=c):e!==this._$AH&&e!==S&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Qe(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==c&&Y(this._$AH)?this._$AA.nextSibling.data=e:this.T(N.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:r}=e,i=typeof r=="number"?this._$AC(e):(r.el===void 0&&(r.el=J.createElement(tt(r.h,r.h[0]),this.options)),r);if(this._$AH?._$AD===i)this._$AH.p(t);else{let o=new se(i,this),l=o.u(this.options);o.p(t),this.T(l),this._$AH=o}}_$AC(e){let t=Xe.get(e.strings);return t===void 0&&Xe.set(e.strings,t=new J(e)),t}k(e){we(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,r,i=0;for(let o of e)i===t.length?t.push(r=new s(this.O(G()),this.O(G()),this,this.options)):r=t[i],r._$AI(o),i++;i<t.length&&(this._$AR(r&&r._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let r=ze(e).nextSibling;ze(e).remove(),e=r}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},O=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,r,i,o){this.type=1,this._$AH=c,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=o,r.length>2||r[0]!==""||r[1]!==""?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=c}_$AI(e,t=this,r,i){let o=this.strings,l=!1;if(o===void 0)e=I(this,e,t,0),l=!Y(e)||e!==this._$AH&&e!==S,l&&(this._$AH=e);else{let d=e,n,u;for(e=o[0],n=0;n<o.length-1;n++)u=I(this,d[r+n],t,n),u===S&&(u=this._$AH[n]),l||=!Y(u)||u!==this._$AH[n],u===c?e=c:e!==c&&(e+=(u??"")+o[n+1]),this._$AH[n]=u}l&&!i&&this.j(e)}j(e){e===c?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},re=class extends O{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===c?void 0:e}},ie=class extends O{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==c)}},oe=class extends O{constructor(e,t,r,i,o){super(e,t,r,i,o),this.type=5}_$AI(e,t=this){if((e=I(this,e,t,0)??c)===S)return;let r=this._$AH,i=e===c&&r!==c||e.capture!==r.capture||e.once!==r.once||e.passive!==r.passive,o=e!==c&&(r===c||i);i&&this.element.removeEventListener(this.name,this,r),o&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},ne=class{constructor(e,t,r){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(e){I(this,e)}},rt={M:_e,P:T,A:ke,C:1,L:st,R:se,D:Qe,V:I,I:U,H:O,N:ie,U:oe,B:re,F:ne},Mt=be.litHtmlPolyfillSupport;Mt?.(J,U),(be.litHtmlVersions??=[]).push("3.3.3");var it=(s,e,t)=>{let r=t?.renderBefore??e,i=r._$litPart$;if(i===void 0){let o=t?.renderBefore??null;r._$litPart$=i=new U(e.insertBefore(G(),o),o,void 0,t??{})}return i._$AI(s),i};var Ae=globalThis,_=class extends E{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=it(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return S}};_._$litElement$=!0,_.finalized=!0,Ae.litElementHydrateSupport?.({LitElement:_});var Vt=Ae.litElementPolyfillSupport;Vt?.({LitElement:_});(Ae.litElementVersions??=[]).push("4.2.2");var ot={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},ae=s=>(...e)=>({_$litDirective$:s,values:e}),F=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,r){this._$Ct=e,this._$AM=t,this._$Ci=r}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};var{I:Ut}=rt,nt=s=>s;var at=()=>document.createComment(""),j=(s,e,t)=>{let r=s._$AA.parentNode,i=e===void 0?s._$AB:e._$AA;if(t===void 0){let o=r.insertBefore(at(),i),l=r.insertBefore(at(),i);t=new Ut(o,l,s,s.options)}else{let o=t._$AB.nextSibling,l=t._$AM,d=l!==s;if(d){let n;t._$AQ?.(s),t._$AM=s,t._$AP!==void 0&&(n=s._$AU)!==l._$AU&&t._$AP(n)}if(o!==i||d){let n=t._$AA;for(;n!==o;){let u=nt(n).nextSibling;nt(r).insertBefore(n,i),n=u}}}return t},R=(s,e,t=s)=>(s._$AI(e,t),s),Ft={},le=(s,e=Ft)=>s._$AH=e,lt=s=>s._$AH,ce=s=>{s._$AR(),s._$AA.remove()};var ct=ae(class extends F{constructor(){super(...arguments),this.key=c}render(s,e){return this.key=s,e}update(s,[e,t]){return e!==this.key&&(le(s),this.key=e),t}});var de=class{constructor(e,t=Intl.DateTimeFormat().resolvedOptions().timeZone){this.connection=e;this.timeZone=t}call(e,t={}){return this.send({type:`tankkeeper/${e}`,args:t})}accept(e){return this.send({type:"tankkeeper/accept_proposal",proposal_id:e})}reject(e){return this.send({type:"tankkeeper/reject_proposal",proposal_id:e})}deleteConversation(e){return this.send({type:"tankkeeper/delete_conversation",conversation_id:e})}send(e){return this.connection.sendMessagePromise(e)}};function Ee(s){return typeof s=="object"&&s!==null&&"message"in s?String(s.message):String(s)}var dt="tk-changed",g=L`
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
  .dash {
    display: inline-block;
    width: 14px;
    border-top: 2px dashed;
    margin-right: 4px;
    vertical-align: middle;
  }
`,m=class extends _{constructor(){super();this.loads=0;this.api=void 0,this.error="",this.busy=!1,this.version=0,this.addEventListener(dt,t=>{t.composedPath()[0]!==this&&this.reload()})}static{this.properties={api:{attribute:!1},error:{state:!0},busy:{state:!0},version:{state:!0}}}reloadOn(){return["api"]}willUpdate(t){this.reloadOn().some(r=>t.has(r))&&this.reload()}async reload(){let t=this.api;if(t===void 0)return;this.loads+=1;let r=this.loads;try{let i=await this.load(t);if(r!==this.loads)return;i(),this.error="",this.version+=1}catch(i){r===this.loads&&(this.error=Ee(i))}}async run(t){let r=this.api;if(r===void 0)return!1;this.busy=!0;try{return await t(r),this.error="",await this.reload(),!0}catch(i){return this.error=Ee(i),!1}finally{this.busy=!1}}changed(){this.dispatchEvent(new CustomEvent(dt,{bubbles:!0,composed:!0}))}};var pt=s=>s??c;function jt(s){return s==null?"":Array.isArray(s)?s.map(String).join(`
`):typeof s=="string"||typeof s=="number"||typeof s=="boolean"?String(s):JSON.stringify(s)}function qt(s,e){return s.type==="number"?e.trim()===""?null:Number(e):s.type==="list"?e.split(`
`).map(t=>t.trim()).filter(t=>t!==""):e}function Wt(s){return s===""||s===null||s===!1||Array.isArray(s)&&s.length===0}function Bt(s,e,t){let r={};for(let i of s){let o=e.elements.namedItem(i.name),l=i.type==="checkbox"?o.checked:qt(i,o.value),d=t[i.name];Wt(l)&&d==null||JSON.stringify(l)!==JSON.stringify(d)&&(r[i.name]=l)}return r}var Te=class extends _{static{this.properties={fields:{attribute:!1},values:{attribute:!1},submitLabel:{attribute:!1},busy:{type:Boolean},error:{attribute:!1}}}constructor(){super(),this.fields=[],this.values={},this.submitLabel="Save",this.busy=!1,this.error=""}static{this.styles=L`
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
  `}input(e){let t=jt(this.values[e.name]);return e.type==="select"?a`<select name=${e.name} ?required=${e.required===!0} .value=${t}>
        <option value="" ?selected=${t===""}></option>
        ${(e.options??[]).map(r=>a`<option value=${r} ?selected=${r===t}>${r}</option>`)}
      </select>`:e.type==="checkbox"?a`<input
        name=${e.name}
        type="checkbox"
        .checked=${this.values[e.name]===!0}
      />`:e.type==="textarea"||e.type==="list"?a`<textarea
        name=${e.name}
        rows="3"
        ?required=${e.required===!0}
        .value=${t}
      ></textarea>`:a`<input
      name=${e.name}
      type=${e.type}
      step=${pt(e.step??(e.type==="number"?"any":void 0))}
      ?required=${e.required===!0}
      .value=${t}
    />`}reset(){this.renderRoot.querySelector("form")?.reset()}submit(e){e.preventDefault();let t=Bt(this.fields,e.target,this.values);this.dispatchEvent(new CustomEvent("tk-save",{detail:t,bubbles:!0,composed:!0}))}render(){return a`<form
      @submit=${e=>{this.submit(e)}}
    >
      ${this.fields.map(e=>a`<label>${e.label} ${this.input(e)}</label>`)}
      ${this.error?a`<p class="error">${this.error}</p>`:c}
      <button type="submit" ?disabled=${this.busy}>${this.submitLabel}</button>
    </form>`}};customElements.define("tk-form",Te);async function w(s,e){let t=s.target;await e(s.detail)&&t.reset()}var zt={panel:"Panel",mcp:"Claude (MCP)",assist:"Assist",notification:"Notification",rule:"Rule",review:"Review"};function ut(s){return String(s).padStart(2,"0")}function pe(s,e){let t=new Intl.DateTimeFormat("en-CA",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(s),r=i=>t.find(o=>o.type===i)?.value??"";return{day:`${r("year")}-${r("month")}-${r("day")}`,minutes:Number(r("hour"))*60+Number(r("minute"))}}function q(s,e){return pe(s,e).day}function V(s,e){let[t=0,r=1,i=1]=s.split("-").map(Number);return new Date(Date.UTC(t,r-1,i+e)).toISOString().slice(0,10)}function b(s){let e=new Date(s);return`${q(e)} ${ut(e.getHours())}:${ut(e.getMinutes())}`}function P(s){return zt[s]??s}function ht(s){return typeof s=="string"?s:JSON.stringify(s)}function W(s){if(s.before===null)return`Added to ${s.collection}`;if(s.after===null)return`Removed from ${s.collection}`;let{before:e,after:t}=s,i=Object.keys(t).filter(o=>JSON.stringify(e[o])!==JSON.stringify(t[o])).map(o=>`${o} ${ht(e[o])} \u2192 ${ht(t[o])}`);return`${s.collection}: ${i.join(", ")}`}function Se(s,...e){let t=e.filter(r=>typeof r=="string"&&r!=="");return[s,...t].join(". ")}function mt(s){if(s.kind==="dose")return Se(`Dose: ${s.product??""} ${String(s.amount_ml??0)} ml`,s.why,s.notes);if(s.kind==="test"){let t=Object.entries(s.values??{}).map(([i,o])=>`${i} ${String(o)}`).join(", "),r=s.source==="tap"?"Tap":"Tank";return Se(`${r} test: ${t}`,s.notes)}let e=[...s.tasks??[]];return typeof s.water_change_percent=="number"&&e.push(`${String(s.water_change_percent)}% water change`),typeof s.water_litres=="number"&&e.push(`${String(s.water_litres)} l water`),Se(e.join(". "),s.why,s.notes)}var Ce=class extends m{constructor(){super();this.details=null;this.toggled=()=>{this.details?.open===!0&&this.reload()};this.collection="",this.recordId=void 0,this.stamp=0,this.entries=void 0}static{this.properties={...m.properties,collection:{attribute:!1},recordId:{attribute:!1},stamp:{attribute:!1},entries:{state:!0}}}static{this.styles=g}connectedCallback(){super.connectedCallback(),this.details=this.closest("details"),this.details?.addEventListener("toggle",this.toggled)}disconnectedCallback(){super.disconnectedCallback(),this.details?.removeEventListener("toggle",this.toggled),this.details=null}async reload(){this.details!==null&&!this.details.open||await super.reload()}reloadOn(){return["api","collection","recordId","stamp"]}async load(t){let r={collection:this.collection,limit:10};this.recordId!==void 0&&(r.record_id=this.recordId);let{history:i}=await t.call("get_history",r);return()=>{this.entries=i}}async undo(t){await this.run(r=>r.call("undo_change",{history_id:t.id}))&&this.changed()}render(){return this.entries===void 0?c:a`
      ${this.error?a`<p class="error">${this.error}</p>`:c}
      ${this.entries.length===0?a`<p class="muted">No changes yet</p>`:c}
      <ul>
        ${this.entries.map(t=>a`<li class="row">
              <div class="grow">
                <div>${t.summary}</div>
                <div class="muted">${b(t.time)} · ${P(t.source)}</div>
                ${t.changes.map(r=>a`<div class="muted">${W(r)}</div>`)}
              </div>
              <button class="undo" ?disabled=${this.busy} @click=${()=>this.undo(t)}>
                Undo
              </button>
            </li>`)}
      </ul>
    `}};customElements.define("tk-history",Ce);var Kt=[{name:"agent",label:"Conversation agent Tankkeeper chats through",type:"text"},{name:"ai_task",label:"AI task entity for review comments",type:"text"},{name:"review_on",label:"Review after, one per line: test, task, status",type:"list"},{name:"comments",label:"Claude comments on reviews",type:"checkbox"},{name:"daily_time",label:"Daily review at",type:"time"},{name:"daily_cap",label:"Claude comments a day, at most",type:"number",step:"1",required:!0}],Gt=20,Yt={test:"Test",task:"Task",status:"Status change",daily:"Daily"};function Jt(s){let e=s.triggers.map(r=>Yt[r]??r).join(", "),t=s.proposal_ids.length;return a`<li class="review">
    <div class="muted">${b(s.time)} · ${e}</div>
    <div>${s.result}</div>
    ${s.comment===null?c:a`<div class="comment">Claude: ${s.comment}</div>`}
    ${s.note===null?c:a`<div class="muted">${s.note}</div>`}
    ${t===0?c:a`<div class="muted">
            ${t} plan ${t===1?"change":"changes"} proposed
          </div>`}
  </li>`}var Re=class extends m{static{this.properties={...m.properties,settings:{state:!0},reviews:{state:!0}}}static{this.styles=g}constructor(){super(),this.settings=void 0,this.reviews=[]}async load(e){let[t,r]=await Promise.all([e.call("get_claude"),e.call("get_reviews",{limit:Gt})]);return()=>{this.settings=t,this.reviews=r.reviews}}async save(e){Object.keys(e).length!==0&&await this.run(t=>t.call("set_claude",e))&&this.changed()}render(){let e=this.settings;return a`<section>
      <h2>Claude</h2>
      ${this.error?a`<p class="error">${this.error}</p>`:c}
      ${e===void 0?c:a`<p class="muted note">${e.model_note}</p>
              <tk-form
                class="claude"
                .fields=${Kt}
                .values=${e}
                .busy=${this.busy}
                @tk-save=${t=>this.save(t.detail)}
              ></tk-form>
              <tk-history
                .api=${this.api}
                .collection=${"settings"}
                .recordId=${"claude"}
                .stamp=${this.version}
              ></tk-history>`}
      <h3>Reviews</h3>
      ${this.reviews.length===0?a`<p class="muted">No reviews yet.</p>`:a`<ul class="reviews">
              ${this.reviews.map(Jt)}
            </ul>`}
    </section>`}};customElements.define("tk-claude",Re);var ft=(s,e,t)=>{let r=new Map;for(let i=e;i<=t;i++)r.set(s[i],i);return r},k=ae(class extends F{constructor(s){if(super(s),s.type!==ot.CHILD)throw Error("repeat() can only be used in text expressions")}dt(s,e,t){let r;t===void 0?t=e:e!==void 0&&(r=e);let i=[],o=[],l=0;for(let d of s)i[l]=r?r(d,l):l,o[l]=t(d,l),l++;return{values:o,keys:i}}render(s,e,t){return this.dt(s,e,t).values}update(s,[e,t,r]){let i=lt(s),{values:o,keys:l}=this.dt(e,t,r);if(!Array.isArray(i))return this.ut=l,o;let d=this.ut??=[],n=[],u,v,p=0,f=i.length-1,h=0,y=o.length-1;for(;p<=f&&h<=y;)if(i[p]===null)p++;else if(i[f]===null)f--;else if(d[p]===l[h])n[h]=R(i[p],o[h]),p++,h++;else if(d[f]===l[y])n[y]=R(i[f],o[y]),f--,y--;else if(d[p]===l[y])n[y]=R(i[p],o[y]),j(s,n[y+1],i[p]),p++,y--;else if(d[f]===l[h])n[h]=R(i[f],o[h]),j(s,i[p],i[f]),f--,h++;else if(u===void 0&&(u=ft(l,h,y),v=ft(d,p,f)),u.has(d[p]))if(u.has(d[f])){let A=v.get(l[h]),fe=A!==void 0?i[A]:null;if(fe===null){let Ve=j(s,i[p]);R(Ve,o[h]),n[h]=Ve}else n[h]=R(fe,o[h]),j(s,i[p],fe),i[A]=null;h++}else ce(i[f]),f--;else ce(i[p]),p++;for(;h<=y;){let A=j(s,n[y+1]);R(A,o[h]),n[h++]=A}for(;p<=f;){let A=i[p++];A!==null&&ce(A)}return this.ut=l,le(s,n),S}});var vt=50,Pe=class extends m{static{this.properties={...m.properties,conversations:{state:!0},query:{state:!0},selected:{state:!0},detail:{state:!0}}}static{this.styles=g}constructor(){super(),this.conversations=[],this.query="",this.selected=void 0,this.detail=void 0}reloadOn(){return["api","query","selected"]}async load(e){let t=this.selected;if(t!==void 0){let i=await e.call("get_conversation",{id:t});return()=>{this.detail=i}}let r=this.query===""?await e.call("list_conversations",{limit:vt}):await e.call("search_conversations",{query:this.query,limit:vt});return()=>{this.detail=void 0,this.conversations=r.conversations}}search(e){e.preventDefault();let t=e.target.querySelector("input");this.query=(t?.value??"").trim()}async undo(e){await this.run(t=>t.call("undo_change",{history_id:e.id}))&&this.changed()}async deleteConversation(e){window.confirm("Delete this conversation? The changes made in it stay in the history.")&&await this.run(async t=>{await t.deleteConversation(e),this.selected=void 0})}renderDetail(e){return a`<section>
      <div class="row">
        <button class="back" @click=${()=>this.selected=void 0}>Back</button>
        <h2 class="grow">${e.title}</h2>
        <button
          class="delete"
          ?disabled=${this.busy}
          @click=${()=>this.deleteConversation(e.id)}
        >
          Delete
        </button>
      </div>
      <div class="muted">${P(e.source)} · ${b(e.started)}</div>
      ${this.error?a`<p class="error">${this.error}</p>`:c}
      <p class="pre">${e.summary}</p>
      <h3>Messages</h3>
      <ul>
        ${e.messages.map(t=>a`<li>
              <strong>${t.role}</strong>
              <div class="pre">${t.text}</div>
            </li>`)}
      </ul>
      <h3>Changes</h3>
      ${e.changes.length===0?a`<p class="muted">No changes</p>`:c}
      <ul>
        ${e.changes.map(t=>a`<li>
              <div class="row">
                <span class="grow">${t.summary}</span>
                <button class="undo" ?disabled=${this.busy} @click=${()=>this.undo(t)}>
                  Undo
                </button>
              </div>
              <div class="muted">${b(t.time)} · ${P(t.source)}</div>
              ${t.changes.map(r=>a`<div class="muted">${W(r)}</div>`)}
            </li>`)}
      </ul>
    </section>`}render(){return this.detail!==void 0?this.renderDetail(this.detail):a`<section>
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
      ${this.error?a`<p class="error">${this.error}</p>`:c}
      ${this.conversations.length===0?a`<p class="muted">No conversations</p>`:c}
      <ul>
        ${k(this.conversations,e=>e.id,e=>a`<li data-id=${e.id}>
              <div class="row">
                <strong class="grow">${e.title}</strong>
                <button class="open" @click=${()=>this.selected=e.id}>Open</button>
              </div>
              <div class="muted">
                ${P(e.source)} · ${b(e.updated)}
              </div>
              <div class="pre">${e.summary}</div>
            </li>`)}
      </ul>
    </section>`}};customElements.define("tk-conversations",Pe);var Zt=["proposed","accepted","replaced"],yt=[{name:"title",label:"Title",type:"text"},{name:"decision",label:"Decision",type:"textarea"},{name:"why",label:"Why",type:"textarea"},{name:"open",label:"Open points, one per line",type:"list"},{name:"date",label:"Date",type:"date"}],Xt=[...yt,{name:"status",label:"Status",type:"select",options:["proposed","accepted"]}],Qt=[{name:"replaced_by",label:"Replaced by decision number",type:"number",step:"1"}];function ue(s){return String(s).padStart(4,"0")}var Le=class extends m{static{this.properties={...m.properties,decisions:{state:!0},status:{state:!0},selected:{state:!0},detail:{state:!0}}}static{this.styles=g}constructor(){super(),this.decisions=[],this.status="",this.selected=void 0,this.detail=void 0}reloadOn(){return["api","status","selected"]}async load(e){let t=this.status===""?{}:{status:this.status},{decisions:r}=await e.call("list_decisions",t),i=this.selected===void 0?void 0:await e.call("get_decision",{number:this.selected});return()=>{this.decisions=r,this.detail=i}}async save(e,t,r){if(e!=="accept"&&Object.keys(t).length===0)return!1;let i=r===void 0?{action:e,...t}:{action:e,number:r,...t},o=await this.run(l=>l.call("set_decision",i));return o&&this.changed(),o}toggle(e){this.selected=this.selected===e?void 0:e}renderDetail(e){return a`<div class="card">
      <p class="pre">${e.decision}</p>
      <h3>Why</h3>
      <p class="pre">${e.why}</p>
      ${e.open.length>0?a`<h3>Open points</h3>
              <ul>
                ${e.open.map(t=>a`<li>${t}</li>`)}
              </ul>`:c}
      ${e.replaced_by===null?c:a`<p class="muted">Replaced by ${ue(e.replaced_by)}</p>`}
      ${e.replaces.length>0?a`<p class="muted">Replaces ${e.replaces.map(ue).join(", ")}</p>`:c}
      ${e.status==="proposed"?a`<button
              class="accept primary"
              ?disabled=${this.busy}
              @click=${()=>this.save("accept",{},e.number)}
            >
              Accept
            </button>`:c}
      <details>
        <summary>Edit</summary>
        <tk-form
          class="update"
          .fields=${yt}
          .values=${e}
          .busy=${this.busy}
          @tk-save=${t=>this.save("update",t.detail,e.number)}
        ></tk-form>
      </details>
      <details>
        <summary>Replace</summary>
        <tk-form
          class="replace"
          .fields=${Qt}
          submitLabel="Replace"
          .busy=${this.busy}
          @tk-save=${t=>w(t,r=>this.save("replace",r,e.number))}
        ></tk-form>
      </details>
      <tk-history
        .api=${this.api}
        .collection=${"decisions"}
        .recordId=${ue(e.number)}
        .stamp=${this.version}
      ></tk-history>
    </div>`}renderDecision(e){let t=this.selected===e.number;return a`<li data-number=${e.number}>
      <div class="row">
        <strong class="grow">${ue(e.number)} ${e.title}</strong>
        <button
          class="open"
          @click=${()=>{this.toggle(e.number)}}
        >
          ${t?"Close":"Open"}
        </button>
      </div>
      <div class="muted">${e.status} · ${e.date}</div>
      ${t&&this.detail?.number===e.number?this.renderDetail(this.detail):c}
    </li>`}render(){return a`
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
            ${Zt.map(e=>a`<option value=${e}>${e}</option>`)}
          </select>
        </div>
        ${this.error?a`<p class="error">${this.error}</p>`:c}
        <ul>
          ${k(this.decisions,e=>e.number,e=>this.renderDecision(e))}
        </ul>
      </section>
      <section>
        <h2>Add a decision</h2>
        <tk-form
          class="add"
          .fields=${Xt}
          submitLabel="Add"
          .busy=${this.busy}
          @tk-save=${e=>w(e,t=>this.save("add",t))}
        ></tk-form>
      </section>
    `}};customElements.define("tk-decisions",Le);var es=100,ts=["all","dose","test","event"],ss=[["ammonia","Ammonia (ppm)"],["nitrite","Nitrite (ppm)"],["nitrate","Nitrate (ppm)"],["phosphate","Phosphate (ppm)"],["ph","pH"],["kh","KH (dKH)"],["gh","GH (dGH)"],["temperature_c","Temperature (\xB0C)"]],rs=[{name:"source",label:"Water",type:"select",options:["tank","tap"]},...ss.map(([s,e])=>({name:s,label:e,type:"number"})),{name:"notes",label:"Notes",type:"textarea"}],De=class extends m{static{this.properties={...m.properties,entries:{state:!0},kind:{state:!0},products:{state:!0}}}static{this.styles=g}constructor(){super(),this.entries=[],this.kind="all",this.products=[]}reloadOn(){return["api","kind"]}async load(e){let[t,r]=await Promise.all([e.call("get_log",{kind:this.kind,limit:es}),e.call("list_products")]);return()=>{this.entries=t.entries,this.products=r.products.map(i=>i.name)}}doseFields(){return[{name:"product",label:"Product",type:"select",options:this.products,required:!0},{name:"amount_ml",label:"Amount (ml)",type:"number",required:!0},{name:"why",label:"Why",type:"text"},{name:"notes",label:"Notes",type:"textarea"}]}async record(e,t){let r=await this.run(i=>i.call(e,t));return r&&this.changed(),r}async recordTest(e){if(Object.keys(e).length===0)return!1;let{source:t,notes:r,...i}=e,o={values:i};return t!==void 0&&(o.source=t),r!==void 0&&(o.notes=r),this.record("record_test",o)}render(){return a`
      <section>
        <div class="row">
          <h2 class="grow">Log</h2>
          <select
            class="kind"
            aria-label="Kind"
            .value=${this.kind}
            @change=${e=>this.kind=e.target.value}
          >
            ${ts.map(e=>a`<option value=${e}>${e}</option>`)}
          </select>
        </div>
        ${this.error?a`<p class="error">${this.error}</p>`:c}
        <ul>
          ${this.entries.map(e=>a`<li>
                <div class="pre">${mt(e)}</div>
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
          @tk-save=${e=>w(e,t=>this.record("record_dose",t))}
        ></tk-form>
      </section>
      <section>
        <h2>Record a test</h2>
        <tk-form
          class="test"
          .fields=${rs}
          submitLabel="Record"
          .busy=${this.busy}
          @tk-save=${e=>w(e,t=>this.recordTest(t))}
        ></tk-form>
      </section>
    `}};customElements.define("tk-log",De);var $t=1440,C=320,Z=160,x=24,me={ammonia:"var(--warning-color, #f4b400)",nitrite:"var(--error-color, #db4437)",nitrate:"var(--info-color, #4285f4)",ph:"var(--primary-color, #03a9f4)",kh:"var(--success-color, #43a047)",gh:"var(--accent-color, #ff9800)"};function he(s,e,t){let r=s.filter(i=>i.kind==="test"&&typeof i.values?.[e]=="number").map(i=>({time:Date.parse(i.time),value:i.values?.[e]??0,hollow:i.source==="tap"})).sort((i,o)=>i.time-o.time);return{name:t,colour:me[e],points:r}}function gt(s,e){let t=[...s.flatMap(r=>r.points.map(i=>i.value)),...e.map(r=>r.value)];return{series:s,lines:e,min:Math.min(0,...t),max:Math.max(...t,0)}}function bt(s,e){let t=[];return e.nitrogen_watch!==void 0&&t.push({label:"Watch",value:e.nitrogen_watch,colour:me.ammonia}),e.nitrogen_act!==void 0&&t.push({label:"Act",value:e.nitrogen_act,colour:me.nitrite}),gt([he(s,"ammonia","Ammonia"),he(s,"nitrite","Nitrite"),he(s,"nitrate","Nitrate")],t)}function _t(s,e){let t=[["ph","pH"],["kh","KH"],["gh","GH"]],r=[];for(let[i,o]of t){let l=e?.[i];typeof l=="number"&&r.push({label:`${o} target`,value:l,colour:me[i]})}return gt(t.map(([i,o])=>he(s,i,o)),r)}function He(s,e){let t=s.series.flatMap(n=>n.points.map(u=>u.time));if(t.length===0)return a`<p class="empty">No readings yet</p>`;let r=Math.min(...t),i=Math.max(...t)-r,o=s.max-s.min||1,l=n=>i===0?C/2:x+(n-r)/i*(C-2*x),d=n=>Z-x-(n-s.min)/o*(Z-2*x);return a`
    <svg viewBox="0 0 ${C} ${Z}" role="img" aria-label=${e} class="chart">
      <line class="axis" x1=${x} y1=${Z-x} x2=${C-x} y2=${Z-x}></line>
      <text class="tick" x="2" y=${d(s.max)+4}>${s.max}</text>
      <text class="tick" x="2" y=${d(s.min)+4}>${s.min}</text>
      ${s.lines.map(n=>M`<line class="target" x1=${x} x2=${C-x} y1=${d(n.value)} y2=${d(n.value)}
            stroke=${n.colour}><title>${n.label} ${n.value}</title></line>`)}
      ${s.series.map(n=>M`
          <polyline fill="none" stroke=${n.colour}
            points=${n.points.map(u=>`${String(l(u.time))},${String(d(u.value))}`).join(" ")}>
          </polyline>
          ${n.points.map(u=>M`<circle class=${u.hollow?"hollow":"solid"} cx=${l(u.time)} cy=${d(u.value)} r="3"
                stroke=${n.colour} fill=${u.hollow?"none":n.colour}>
                <title>${n.name} ${u.value}</title></circle>`)}`)}
    </svg>
    <ul class="legend">
      ${s.series.filter(n=>n.points.length>0).map(n=>a`<li>
              <span class="swatch" style="background:${n.colour}"></span>${n.name}
            </li>`)}
      ${s.lines.map(n=>a`<li><span class="dash" style="border-color:${n.colour}"></span>${n.label}</li>`)}
    </ul>
  `}function kt(s,e,t,r){let i=[];for(let o=t-1;o>=0;o--)i.push({day:V(e,-o),segments:[]});for(let[o,l]of s){let d=pe(new Date(o),r),n=pe(new Date(l),r);for(let u of i){let v=d.day===u.day?d.minutes/$t:d.day<u.day?0:null,p=n.day===u.day?n.minutes/$t:n.day>u.day?1:null;v!==null&&p!==null&&p>v&&u.segments.push({start:v,end:p})}}return i}function wt(s){let t=s.length*6;return M`
    <svg viewBox="0 0 ${C} ${t}" role="img" class="chart light"
      aria-label=${`Light on and off, last ${String(s.length)} days`}>
      ${s.map((r,i)=>M`
          <rect class="off" x="0" y=${i*6} width=${C} height=${5}></rect>
          ${r.segments.map(o=>M`<rect class="on" x=${o.start*C} y=${i*6}
                width=${(o.end-o.start)*C} height=${5}>
                <title>${r.day}</title></rect>`)}`)}
    </svg>`}var is=7,xt=30,os=60,At={on_course:"On course",watch:"Watch",act:"Act"},ns={cycling:"Cycling",cycled:"Cycled"},as=[{name:"name",label:"Name",type:"text"},{name:"volume_litres",label:"Volume (litres)",type:"number"},{name:"dosing_volume_litres",label:"Water volume for doses (litres)",type:"number"},{name:"temperature_c",label:"Target temperature (\xB0C)",type:"number"},{name:"stage",label:"Stage",type:"select",options:["cycling","cycled"]},{name:"notes",label:"Notes",type:"textarea"}],ls=[{name:"source",label:"Values come from",type:"select",options:["supplier","tap_test"]},{name:"ph",label:"pH",type:"number"},{name:"kh",label:"KH (dKH)",type:"number"},{name:"gh",label:"GH (dGH)",type:"number"},{name:"nitrate",label:"Nitrate (mg/l)",type:"number"},{name:"phosphate",label:"Phosphate (mg/l)",type:"number"},{name:"notes",label:"Notes",type:"textarea"}],cs=[{name:"nitrogen_watch",label:"Ammonia or nitrite Watch above (ppm)",type:"number"},{name:"nitrogen_act",label:"Ammonia or nitrite Act above (ppm)",type:"number"},{name:"ph_watch",label:"pH Watch under, while cycling",type:"number"},{name:"ph_act",label:"pH Act under, while cycling",type:"number"},{name:"stall_watch_days",label:"Stalled cycle Watch after (days)",type:"number",step:"1"},{name:"stall_act_days",label:"Stalled cycle Act after (days)",type:"number",step:"1"},{name:"test_watch_days",label:"Late test Watch after (days)",type:"number",step:"1"},{name:"test_act_days",label:"Late test Act after (days)",type:"number",step:"1"},{name:"skip_watch",label:"Skipped tasks for Watch",type:"number",step:"1"},{name:"skip_act",label:"Skipped tasks for Act",type:"number",step:"1"},{name:"plan_watch_days",label:"Plan ends within, for Watch (days)",type:"number",step:"1"},{name:"plan_act_days",label:"Plan ends within, for Act (days)",type:"number",step:"1"}],ds=[{name:"model",label:"Make and model",type:"text"},{name:"on",label:"On",type:"time"},{name:"off",label:"Off",type:"time"},{name:"brightness_pct",label:"Brightness (%)",type:"number",step:"1"},{name:"ramp_minutes",label:"Fade (minutes)",type:"number",step:"1"}],ps={config:{tap_action:{action:"assist",start_listening:!1}},action:"tap"},Ne=class extends m{static{this.properties={...m.properties,status:{state:!0},tank:{state:!0},plan:{state:!0},log:{state:!0},lights:{state:!0},proposals:{state:!0}}}static{this.styles=g}constructor(){super(),this.status=void 0,this.tank=void 0,this.plan=void 0,this.log=[],this.lights=void 0,this.proposals=[]}async load(e){let t=q(new Date,e.timeZone),[r,i,o,l,d,n]=await Promise.all([e.call("get_status"),e.call("get_tank"),e.call("get_plan",{start:t,end:V(t,is)}),e.call("get_log",{kind:"test",since:V(t,-os),limit:500}),e.call("get_light",{days:xt}),e.call("list_proposals",{state:"pending"})]);return()=>{this.status=r,this.tank=i,this.plan=o,this.log=l.entries,this.lights=d,this.proposals=n.proposals}}async act(e){await this.run(e)&&this.changed()}async save(e,t,r={}){Object.keys(t).length!==0&&await this.act(i=>i.call(e,{...r,...t}))}discuss(){this.dispatchEvent(new CustomEvent("hass-action",{detail:ps,bubbles:!0,composed:!0}))}editor(e,t,r,i,o,l,d){return a`<details>
      <summary>${e}</summary>
      <tk-form
        class=${t}
        .fields=${i}
        .values=${o}
        .busy=${this.busy}
        @tk-save=${n=>this.save(r,n.detail)}
      ></tk-form>
      <tk-history
        .api=${this.api}
        .collection=${l}
        .recordId=${d}
        .stamp=${this.version}
      ></tk-history>
    </details>`}renderStatus(e,t){let r=e.status===null?"Not checked yet":At[e.status],i=e.stage===null?"":ns[e.stage];return a`<section id="status">
      <div class="row">
        <h2 class="grow">${t.tank.name}</h2>
        <strong class="level ${e.status??""}">${r}</strong>
      </div>
      <div class="muted">
        ${[i,e.checked===null?"":`checked ${b(e.checked)}`].filter(o=>o!=="").join(" \xB7 ")}
      </div>
      <ul>
        ${e.rules.filter(o=>o.level!=="on_course").map(o=>a`<li>
                <strong>${At[o.level]}</strong> ${o.reason}
                ${o.action===null?c:a`<div>${o.action}</div>`}
              </li>`)}
      </ul>
      ${this.editor("Edit tank","tank","set_tank",as,t.tank,"tank","tank")}
      ${this.editor("Edit water","water","set_water",ls,t.water??{},"water","water")}
      ${this.editor("Edit rule limits","rules","set_rules",cs,e.settings,"settings","rules")}
    </section>`}renderTask(e,t){return a`<li>
      <div class="row">
        <span class="grow">${e.time??""} ${e.text}</span>
        ${t&&e.state==="open"?a`<button
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
                </button>`:a`<span class="muted">${e.state==="open"?"":e.state}</span>`}
      </div>
    </li>`}renderLight(e,t){return a`<li data-light=${e.id}>
      <div class="row">
        <strong class="grow">${e.model}</strong>
        <span class="muted">${e.state??"unknown"}</span>
        <button
          class="remove"
          ?disabled=${this.busy}
          @click=${()=>this.act(r=>r.call("set_light",{action:"remove",light_id:e.id}))}
        >
          Remove
        </button>
      </div>
      <div>
        ${e.on} to
        ${e.off}${e.brightness_pct===null?"":`, ${String(e.brightness_pct)}%`}
      </div>
      <div class="muted">Today ${e.today.on} to ${e.today.off}</div>
      ${e.problem===null?c:a`<div class="error">${e.problem}</div>`}
      ${wt(kt(e.on_periods,t,xt,this.api?.timeZone))}
      <details>
        <summary>Edit and history</summary>
        <tk-form
          .fields=${ds}
          .values=${e}
          .busy=${this.busy}
          @tk-save=${r=>this.save("set_light",r.detail,{action:"update",light_id:e.id})}
        ></tk-form>
        <tk-history
          .api=${this.api}
          .collection=${"lights"}
          .recordId=${e.id}
          .stamp=${this.version}
        ></tk-history>
      </details>
    </li>`}renderProposal(e){return a`<li>
      <strong class="pre">${e.summary}</strong>
      <div class="pre">${e.reason}</div>
      <div class="muted">${P(e.source)} · ${b(e.created)}</div>
      ${e.changes.map(t=>a`<div class="muted">${W(t)}</div>`)}
      <div class="row">
        <button
          class="discuss"
          @click=${()=>{this.discuss()}}
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
    </li>`}render(){let{status:e,tank:t,plan:r,lights:i}=this;if(e===void 0||t===void 0||r===void 0||i===void 0)return this.error?a`<p class="error">${this.error}</p>`:a`<p class="muted">Loading</p>`;let o=q(new Date,this.api?.timeZone),l=r.tasks.filter(n=>n.date===o),d=r.tasks.filter(n=>n.date>o);return a`
      ${this.error?a`<p class="error">${this.error}</p>`:c}
      ${this.renderStatus(e,t)}
      <section id="today">
        <h2>Today</h2>
        ${l.length===0?a`<p class="muted">No tasks today</p>`:c}
        <ul>
          ${k(l,n=>n.id,n=>this.renderTask(n,!0))}
        </ul>
      </section>
      <section id="waiting">
        <h2>Waiting for you</h2>
        ${this.proposals.length===0?a`<p class="muted">Nothing is waiting for you</p>`:c}
        <ul>
          ${k(this.proposals,n=>n.proposal_id,n=>this.renderProposal(n))}
        </ul>
      </section>
      <section id="cycle">
        <h2>Cycle</h2>
        ${He(bt(this.log,e.settings),"Cycle")}
      </section>
      <section id="chemistry">
        <h2>Water chemistry</h2>
        ${He(_t(this.log,t.water),"Water chemistry")}
        <p class="muted">Hollow points are tap water.</p>
      </section>
      <section id="week">
        <h2>Next 7 days</h2>
        ${d.length===0?a`<p class="muted">No tasks</p>`:c}
        <ul>
          ${d.map(n=>a`<li>
                <span class="muted">${n.date}</span> ${n.time??""} ${n.text}
              </li>`)}
        </ul>
      </section>
      ${i.lights.length===0?c:a`<section id="light">
              <h2>Light</h2>
              ${i.next_change===null?c:a`<div class="muted">Next change ${b(i.next_change.time)}</div>`}
              <ul>
                ${k(i.lights,n=>n.id,n=>this.renderLight(n,i.today))}
              </ul>
            </section>`}
      <div id="cameras"></div>
    `}};customElements.define("tk-overview",Ne);var us=28,Et=[{name:"text",label:"Task",type:"text"},{name:"date",label:"Date",type:"date"},{name:"slot",label:"Slot",type:"select",options:["task","dose"]}],Tt={name:"note",label:"Note",type:"text"},hs=[...Et,Tt],ms=[...Et,{name:"state",label:"State",type:"select",options:["open","complete","skip"]},Tt],fs=[{name:"notify",label:"Notify services for reminders, one per line",type:"list"},{name:"status_notify",label:"Notify services for status alerts, one per line",type:"list"},{name:"task_time",label:"Task reminder time",type:"time"},{name:"dose_time",label:"Dose reminder time",type:"time"},{name:"resend_time",label:"Resend open tasks at",type:"time"}],Ie=class extends m{static{this.properties={...m.properties,plan:{state:!0}}}static{this.styles=g}constructor(){super(),this.plan=void 0}async load(e){let t=q(new Date,e.timeZone),r=await e.call("get_plan",{start:t,end:V(t,us-1)});return()=>{this.plan=r}}async save(e,t,r){if(r===void 0&&Object.keys(t).length===0)return!1;let i=r===void 0?t:{task_id:r,...t},o=await this.run(l=>l.call(e,i));return o&&this.changed(),o}renderTask(e){return a`<li data-task=${e.id}>
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
          .fields=${ms}
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
    </li>`}render(){let e=this.plan,t=[...new Set(e?.tasks.map(r=>r.date)??[])];return a`
      <section>
        <h2>Plan</h2>
        ${this.error?a`<p class="error">${this.error}</p>`:c}
        ${e!==void 0&&t.length===0?a`<p class="muted">No tasks in the next four weeks</p>`:c}
        ${t.map(r=>a`<h3>${r}</h3>
              <ul>
                ${k(e?.tasks.filter(i=>i.date===r)??[],i=>i.id,i=>this.renderTask(i))}
              </ul>`)}
      </section>
      <section>
        <h2>Add a task</h2>
        <tk-form
          class="add"
          .fields=${hs}
          submitLabel="Add"
          .busy=${this.busy}
          @tk-save=${r=>w(r,i=>this.save("add_task",i))}
        ></tk-form>
      </section>
      ${e===void 0?c:a`<section>
              <h2>Reminders</h2>
              <tk-form
                class="reminders"
                .fields=${fs}
                .values=${e.reminders}
                .busy=${this.busy}
                @tk-save=${r=>this.save("set_reminders",r.detail)}
              ></tk-form>
              <tk-history
                .api=${this.api}
                .collection=${"settings"}
                .recordId=${"reminders"}
                .stamp=${this.version}
              ></tk-history>
            </section>`}
    `}};customElements.define("tk-plan",Ie);var vs=["plant","rock","wood","substrate","decoration","fish","other"];function $(s){return typeof s=="string"||typeof s=="number"?String(s):""}function St(s){return s.label_dose??{}}var ys={products:{title:"Products",collection:"products",list:"list_products",key:"products",idArg:"product_id",add:"add_product",update:"update_product",remove:"remove_product",canShowRemoved:!0,fields:[{name:"name",label:"Name",type:"text"},{name:"purpose",label:"Purpose",type:"text"},{name:"label_amount_ml",label:"Label dose (ml)",type:"number"},{name:"label_per_litres",label:"Label dose is for (litres)",type:"number"},{name:"label_frequency",label:"Label frequency",type:"text"},{name:"your_dose",label:"Your dose",type:"text"},{name:"notes",label:"Notes",type:"textarea"},{name:"links",label:"Links, one per line",type:"list"}],label:s=>$(s.name),lines:s=>{let e=St(s),t=[$(s.purpose)];if(s.label_dose){let r=s.label_dose_for_tank_ml===void 0?"":` (${$(s.label_dose_for_tank_ml)} ml for this tank)`;t.push(`Label: ${$(e.amount_ml)} ml per ${$(e.per_litres)} l, ${$(e.frequency)}${r}`)}return $(s.your_dose)&&t.push(`Your dose: ${$(s.your_dose)}`),t},values:s=>{let e=St(s);return{...s,label_amount_ml:e.amount_ml,label_per_litres:e.per_litres,label_frequency:e.frequency}}},contents:{title:"Contents",collection:"contents",list:"list_contents",key:"contents",idArg:"content_id",add:"add_content",update:"update_content",remove:"remove_content",canShowRemoved:!0,fields:[{name:"type",label:"Type",type:"select",options:vs},{name:"name",label:"Name",type:"text"},{name:"count",label:"Count",type:"number",step:"1"},{name:"where",label:"Where",type:"text"},{name:"added",label:"Added",type:"date"},{name:"notes",label:"Notes",type:"textarea"}],label:s=>$(s.name),lines:s=>[[$(s.type),$(s.count),$(s.where),`added ${$(s.added)}`].filter(e=>e!=="").join(" \xB7 "),$(s.notes)],values:s=>s},notes:{title:"Notes",collection:"notes",list:"list_notes",key:"notes",idArg:"note_id",add:"add_note",update:"update_note",remove:"remove_note",canShowRemoved:!1,fields:[{name:"kind",label:"Kind",type:"select",options:["question","assumption"]},{name:"topic",label:"Topic",type:"text"},{name:"text",label:"Text",type:"textarea"},{name:"how_to_resolve",label:"How to resolve",type:"textarea"}],label:s=>`${$(s.kind)}: ${$(s.topic)}`,lines:s=>[$(s.text),$(s.how_to_resolve)],values:s=>s}},Oe=class extends m{static{this.properties={...m.properties,kind:{attribute:!1},items:{state:!0},showRemoved:{state:!0}}}static{this.styles=g}constructor(){super(),this.kind="",this.items=[],this.showRemoved=!1}get config(){let e=ys[this.kind];if(e===void 0)throw new Error(`No records called ${this.kind}`);return e}reloadOn(){return["api","kind","showRemoved"]}async load(e){let t=this.config,r=t.canShowRemoved?{include_removed:this.showRemoved}:{},i=(await e.call(t.list,r))[t.key]??[];return()=>{this.items=i}}async save(e,t,r){if(Object.keys(t).length===0)return!1;let i=r===void 0?t:{[this.config.idArg]:r,...t};return this.run(o=>o.call(e,i))}async removeRecord(e){await this.run(t=>t.call(this.config.remove,{[this.config.idArg]:e}))}item(e,t){let r=typeof t.removed=="string";return a`<li data-id=${t.id}>
      <div class="row">
        <strong class="grow">${e.label(t)}</strong>
        ${r?a`<span class="muted">Removed ${t.removed}</span>`:a`<button
                class="remove"
                ?disabled=${this.busy}
                @click=${()=>this.removeRecord(t.id)}
              >
                Remove
              </button>`}
      </div>
      ${e.lines(t).filter(i=>i!=="").map(i=>a`<div class="muted">${i}</div>`)}
      <details>
        <summary>Edit and history</summary>
        <tk-form
          .fields=${e.fields}
          .values=${e.values(t)}
          .busy=${this.busy}
          @tk-save=${i=>this.save(e.update,i.detail,t.id)}
        ></tk-form>
        <tk-history
          .api=${this.api}
          .collection=${e.collection}
          .recordId=${t.id}
          .stamp=${this.version}
        ></tk-history>
      </details>
    </li>`}render(){let e=this.config;return a`
      <section>
        <div class="row">
          <h2 class="grow">${e.title}</h2>
          ${e.canShowRemoved?a`<label class="muted"
                  ><input
                    type="checkbox"
                    class="show-removed"
                    .checked=${this.showRemoved}
                    @change=${t=>this.showRemoved=t.target.checked}
                  />
                  Show removed</label
                >`:c}
        </div>
        ${this.error?a`<p class="error">${this.error}</p>`:c}
        <ul>
          ${k(this.items,t=>t.id,t=>this.item(e,t))}
        </ul>
      </section>
      <section>
        <h2>Add</h2>
        <tk-form
          class="add"
          .fields=${e.fields}
          submitLabel="Add"
          .busy=${this.busy}
          @tk-save=${t=>w(t,r=>this.save(e.add,r))}
        ></tk-form>
      </section>
    `}};customElements.define("tk-records",Oe);var $s=[["overview","Overview"],["plan","Plan"],["log","Log"],["contents","Contents"],["products","Products"],["decisions","Decisions"],["notes","Notes"],["conversations","Conversations"],["claude","Claude"]],Me=class extends _{constructor(){super();this.connection=void 0;this.hass=void 0,this.narrow=!1,this.tab="overview",this.api=void 0}static{this.properties={hass:{attribute:!1},narrow:{type:Boolean},tab:{state:!0},api:{state:!0}}}static{this.styles=L`
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
  `}willUpdate(t){t.has("hass")&&this.hass!==void 0&&this.connection!==this.hass.connection&&(this.connection=this.hass.connection,this.api=new de(this.hass.connection,this.hass.config?.time_zone))}view(){switch(this.tab){case"plan":return a`<tk-plan .api=${this.api}></tk-plan>`;case"log":return a`<tk-log .api=${this.api}></tk-log>`;case"decisions":return a`<tk-decisions .api=${this.api}></tk-decisions>`;case"claude":return a`<tk-claude .api=${this.api}></tk-claude>`;case"conversations":return a`<tk-conversations .api=${this.api}></tk-conversations>`;case"contents":case"products":case"notes":return a`${ct(this.tab,a`<tk-records .api=${this.api} .kind=${this.tab}></tk-records>`)}`;default:return a`<tk-overview .api=${this.api}></tk-overview>`}}render(){return a`
      <header>
        ${this.narrow?a`<ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>`:c}
        <h1>Tankkeeper</h1>
      </header>
      <nav role="tablist">
        ${$s.map(([t,r])=>a`<button
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
    `}};customElements.define("tankkeeper-panel",Me);export{Me as TankkeeperPanel};
