var te=globalThis,se=te.ShadowRoot&&(te.ShadyCSS===void 0||te.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ve=Symbol(),Ze=new WeakMap,G=class{constructor(e,t,r){if(this._$cssResult$=!0,r!==ve)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(se&&e===void 0){let r=t!==void 0&&t.length===1;r&&(e=Ze.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),r&&Ze.set(t,e))}return e}toString(){return this.cssText}},Xe=s=>new G(typeof s=="string"?s:s+"",void 0,ve),S=(s,...e)=>{let t=s.length===1?s[0]:e.reduce((r,i,n)=>r+(l=>{if(l._$cssResult$===!0)return l.cssText;if(typeof l=="number")return l;throw Error("Value passed to 'css' function must be a 'css' function result: "+l+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+s[n+1],s[0]);return new G(t,s,ve)},Qe=(s,e)=>{if(se)s.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let r=document.createElement("style"),i=te.litNonce;i!==void 0&&r.setAttribute("nonce",i),r.textContent=t.cssText,s.appendChild(r)}},be=se?s=>s:s=>s instanceof CSSStyleSheet?(e=>{let t="";for(let r of e.cssRules)t+=r.cssText;return Xe(t)})(s):s;var{is:Ft,defineProperty:jt,getOwnPropertyDescriptor:Wt,getOwnPropertyNames:qt,getOwnPropertySymbols:Bt,getPrototypeOf:zt}=Object,re=globalThis,et=re.trustedTypes,Kt=et?et.emptyScript:"",Gt=re.reactiveElementPolyfillSupport,J=(s,e)=>s,_e={toAttribute(s,e){switch(e){case Boolean:s=s?Kt:null;break;case Object:case Array:s=s==null?s:JSON.stringify(s)}return s},fromAttribute(s,e){let t=s;switch(e){case Boolean:t=s!==null;break;case Number:t=s===null?null:Number(s);break;case Object:case Array:try{t=JSON.parse(s)}catch{t=null}}return t}},st=(s,e)=>!Ft(s,e),tt={attribute:!0,type:String,converter:_e,reflect:!1,useDefault:!1,hasChanged:st};Symbol.metadata??=Symbol("metadata"),re.litPropertyMetadata??=new WeakMap;var C=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=tt){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let r=Symbol(),i=this.getPropertyDescriptor(e,r,t);i!==void 0&&jt(this.prototype,e,i)}}static getPropertyDescriptor(e,t,r){let{get:i,set:n}=Wt(this.prototype,e)??{get(){return this[t]},set(l){this[t]=l}};return{get:i,set(l){let d=i?.call(this);n?.call(this,l),this.requestUpdate(e,d,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??tt}static _$Ei(){if(this.hasOwnProperty(J("elementProperties")))return;let e=zt(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(J("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(J("properties"))){let t=this.properties,r=[...qt(t),...Bt(t)];for(let i of r)this.createProperty(i,t[i])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[r,i]of t)this.elementProperties.set(r,i)}this._$Eh=new Map;for(let[t,r]of this.elementProperties){let i=this._$Eu(t,r);i!==void 0&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let r=new Set(e.flat(1/0).reverse());for(let i of r)t.unshift(be(i))}else e!==void 0&&t.push(be(e));return t}static _$Eu(e,t){let r=t.attribute;return r===!1?void 0:typeof r=="string"?r:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let r of t.keys())this.hasOwnProperty(r)&&(e.set(r,this[r]),delete this[r]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Qe(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,r){this._$AK(e,r)}_$ET(e,t){let r=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,r);if(i!==void 0&&r.reflect===!0){let n=(r.converter?.toAttribute!==void 0?r.converter:_e).toAttribute(t,r.type);this._$Em=e,n==null?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(e,t){let r=this.constructor,i=r._$Eh.get(e);if(i!==void 0&&this._$Em!==i){let n=r.getPropertyOptions(i),l=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:_e;this._$Em=i;let d=l.fromAttribute(t,n.type);this[i]=d??this._$Ej?.get(i)??d,this._$Em=null}}requestUpdate(e,t,r,i=!1,n){if(e!==void 0){let l=this.constructor;if(i===!1&&(n=this[e]),r??=l.getPropertyOptions(e),!((r.hasChanged??st)(n,t)||r.useDefault&&r.reflect&&n===this._$Ej?.get(e)&&!this.hasAttribute(l._$Eu(e,r))))return;this.C(e,t,r)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:r,reflect:i,wrapped:n},l){r&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,l??t??this[e]),n!==!0||l!==void 0)||(this._$AL.has(e)||(this.hasUpdated||r||(t=void 0),this._$AL.set(e,t)),i===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[i,n]of this._$Ep)this[i]=n;this._$Ep=void 0}let r=this.constructor.elementProperties;if(r.size>0)for(let[i,n]of r){let{wrapped:l}=n,d=this[i];l!==!0||this._$AL.has(i)||d===void 0||this.C(i,void 0,n,d)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(r=>r.hostUpdate?.()),this.update(t)):this._$EM()}catch(r){throw e=!1,this._$EM(),r}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};C.elementStyles=[],C.shadowRootOptions={mode:"open"},C[J("elementProperties")]=new Map,C[J("finalized")]=new Map,Gt?.({ReactiveElement:C}),(re.reactiveElementVersions??=[]).push("2.1.2");var we=globalThis,rt=s=>s,ie=we.trustedTypes,it=ie?ie.createPolicy("lit-html",{createHTML:s=>s}):void 0,xe="$lit$",R=`lit$${Math.random().toFixed(9).slice(2)}$`,Ae="?"+R,Jt=`<${Ae}>`,U=document,Z=()=>U.createComment(""),X=s=>s===null||typeof s!="object"&&typeof s!="function",Te=Array.isArray,dt=s=>Te(s)||typeof s?.[Symbol.iterator]=="function",ke=`[ 	
\f\r]`,Y=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,nt=/-->/g,ot=/>/g,M=RegExp(`>|${ke}(?:([^\\s"'>=/]+)(${ke}*=${ke}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),at=/'/g,lt=/"/g,pt=/^(?:script|style|textarea|title)$/i,Ee=s=>(e,...t)=>({_$litType$:s,strings:e,values:t}),o=Ee(1),D=Ee(2),zs=Ee(3),P=Symbol.for("lit-noChange"),c=Symbol.for("lit-nothing"),ct=new WeakMap,V=U.createTreeWalker(U,129);function ut(s,e){if(!Te(s)||!s.hasOwnProperty("raw"))throw Error("invalid template strings array");return it!==void 0?it.createHTML(e):e}var ht=(s,e)=>{let t=s.length-1,r=[],i,n=e===2?"<svg>":e===3?"<math>":"",l=Y;for(let d=0;d<t;d++){let a=s[d],u,g,p=-1,f=0;for(;f<a.length&&(l.lastIndex=f,g=l.exec(a),g!==null);)f=l.lastIndex,l===Y?g[1]==="!--"?l=nt:g[1]!==void 0?l=ot:g[2]!==void 0?(pt.test(g[2])&&(i=RegExp("</"+g[2],"g")),l=M):g[3]!==void 0&&(l=M):l===M?g[0]===">"?(l=i??Y,p=-1):g[1]===void 0?p=-2:(p=l.lastIndex-g[2].length,u=g[1],l=g[3]===void 0?M:g[3]==='"'?lt:at):l===lt||l===at?l=M:l===nt||l===ot?l=Y:(l=M,i=void 0);let m=l===M&&s[d+1].startsWith("/>")?" ":"";n+=l===Y?a+Jt:p>=0?(r.push(u),a.slice(0,p)+xe+a.slice(p)+R+m):a+R+(p===-2?d:m)}return[ut(s,n+(s[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),r]},Q=class s{constructor({strings:e,_$litType$:t},r){let i;this.parts=[];let n=0,l=0,d=e.length-1,a=this.parts,[u,g]=ht(e,t);if(this.el=s.createElement(u,r),V.currentNode=this.el.content,t===2||t===3){let p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(i=V.nextNode())!==null&&a.length<d;){if(i.nodeType===1){if(i.hasAttributes())for(let p of i.getAttributeNames())if(p.endsWith(xe)){let f=g[l++],m=i.getAttribute(p).split(R),y=/([.?@])?(.*)/.exec(f);a.push({type:1,index:n,name:y[2],strings:m,ctor:y[1]==="."?oe:y[1]==="?"?ae:y[1]==="@"?le:j}),i.removeAttribute(p)}else p.startsWith(R)&&(a.push({type:6,index:n}),i.removeAttribute(p));if(pt.test(i.tagName)){let p=i.textContent.split(R),f=p.length-1;if(f>0){i.textContent=ie?ie.emptyScript:"";for(let m=0;m<f;m++)i.append(p[m],Z()),V.nextNode(),a.push({type:2,index:++n});i.append(p[f],Z())}}}else if(i.nodeType===8)if(i.data===Ae)a.push({type:2,index:n});else{let p=-1;for(;(p=i.data.indexOf(R,p+1))!==-1;)a.push({type:7,index:n}),p+=R.length-1}n++}}static createElement(e,t){let r=U.createElement("template");return r.innerHTML=e,r}};function F(s,e,t=s,r){if(e===P)return e;let i=r!==void 0?t._$Co?.[r]:t._$Cl,n=X(e)?void 0:e._$litDirective$;return i?.constructor!==n&&(i?._$AO?.(!1),n===void 0?i=void 0:(i=new n(s),i._$AT(s,t,r)),r!==void 0?(t._$Co??=[])[r]=i:t._$Cl=i),i!==void 0&&(e=F(s,i._$AS(s,e.values),i,r)),e}var ne=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:r}=this._$AD,i=(e?.creationScope??U).importNode(t,!0);V.currentNode=i;let n=V.nextNode(),l=0,d=0,a=r[0];for(;a!==void 0;){if(l===a.index){let u;a.type===2?u=new q(n,n.nextSibling,this,e):a.type===1?u=new a.ctor(n,a.name,a.strings,this,e):a.type===6&&(u=new ce(n,this,e)),this._$AV.push(u),a=r[++d]}l!==a?.index&&(n=V.nextNode(),l++)}return V.currentNode=U,i}p(e){let t=0;for(let r of this._$AV)r!==void 0&&(r.strings!==void 0?(r._$AI(e,r,t),t+=r.strings.length-2):r._$AI(e[t])),t++}},q=class s{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,r,i){this.type=2,this._$AH=c,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=r,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=F(this,e,t),X(e)?e===c||e==null||e===""?(this._$AH!==c&&this._$AR(),this._$AH=c):e!==this._$AH&&e!==P&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):dt(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==c&&X(this._$AH)?this._$AA.nextSibling.data=e:this.T(U.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:r}=e,i=typeof r=="number"?this._$AC(e):(r.el===void 0&&(r.el=Q.createElement(ut(r.h,r.h[0]),this.options)),r);if(this._$AH?._$AD===i)this._$AH.p(t);else{let n=new ne(i,this),l=n.u(this.options);n.p(t),this.T(l),this._$AH=n}}_$AC(e){let t=ct.get(e.strings);return t===void 0&&ct.set(e.strings,t=new Q(e)),t}k(e){Te(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,r,i=0;for(let n of e)i===t.length?t.push(r=new s(this.O(Z()),this.O(Z()),this,this.options)):r=t[i],r._$AI(n),i++;i<t.length&&(this._$AR(r&&r._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let r=rt(e).nextSibling;rt(e).remove(),e=r}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},j=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,r,i,n){this.type=1,this._$AH=c,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=n,r.length>2||r[0]!==""||r[1]!==""?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=c}_$AI(e,t=this,r,i){let n=this.strings,l=!1;if(n===void 0)e=F(this,e,t,0),l=!X(e)||e!==this._$AH&&e!==P,l&&(this._$AH=e);else{let d=e,a,u;for(e=n[0],a=0;a<n.length-1;a++)u=F(this,d[r+a],t,a),u===P&&(u=this._$AH[a]),l||=!X(u)||u!==this._$AH[a],u===c?e=c:e!==c&&(e+=(u??"")+n[a+1]),this._$AH[a]=u}l&&!i&&this.j(e)}j(e){e===c?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},oe=class extends j{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===c?void 0:e}},ae=class extends j{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==c)}},le=class extends j{constructor(e,t,r,i,n){super(e,t,r,i,n),this.type=5}_$AI(e,t=this){if((e=F(this,e,t,0)??c)===P)return;let r=this._$AH,i=e===c&&r!==c||e.capture!==r.capture||e.once!==r.once||e.passive!==r.passive,n=e!==c&&(r===c||i);i&&this.element.removeEventListener(this.name,this,r),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},ce=class{constructor(e,t,r){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(e){F(this,e)}},mt={M:xe,P:R,A:Ae,C:1,L:ht,R:ne,D:dt,V:F,I:q,H:j,N:ae,U:le,B:oe,F:ce},Yt=we.litHtmlPolyfillSupport;Yt?.(Q,q),(we.litHtmlVersions??=[]).push("3.3.3");var ft=(s,e,t)=>{let r=t?.renderBefore??e,i=r._$litPart$;if(i===void 0){let n=t?.renderBefore??null;r._$litPart$=i=new q(e.insertBefore(Z(),n),n,void 0,t??{})}return i._$AI(s),i};var Se=globalThis,k=class extends C{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=ft(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return P}};k._$litElement$=!0,k.finalized=!0,Se.litElementHydrateSupport?.({LitElement:k});var Zt=Se.litElementPolyfillSupport;Zt?.({LitElement:k});(Se.litElementVersions??=[]).push("4.2.2");var gt={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},de=s=>(...e)=>({_$litDirective$:s,values:e}),B=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,r){this._$Ct=e,this._$AM=t,this._$Ci=r}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};var{I:Xt}=mt,$t=s=>s;var yt=()=>document.createComment(""),z=(s,e,t)=>{let r=s._$AA.parentNode,i=e===void 0?s._$AB:e._$AA;if(t===void 0){let n=r.insertBefore(yt(),i),l=r.insertBefore(yt(),i);t=new Xt(n,l,s,s.options)}else{let n=t._$AB.nextSibling,l=t._$AM,d=l!==s;if(d){let a;t._$AQ?.(s),t._$AM=s,t._$AP!==void 0&&(a=s._$AU)!==l._$AU&&t._$AP(a)}if(n!==i||d){let a=t._$AA;for(;a!==n;){let u=$t(a).nextSibling;$t(r).insertBefore(a,i),a=u}}}return t},N=(s,e,t=s)=>(s._$AI(e,t),s),Qt={},pe=(s,e=Qt)=>s._$AH=e,vt=s=>s._$AH,ue=s=>{s._$AR(),s._$AA.remove()};var bt=de(class extends B{constructor(){super(...arguments),this.key=c}render(s,e){return this.key=s,e}update(s,[e,t]){return e!==this.key&&(pe(s),this.key=e),t}});var he=class{constructor(e,t=Intl.DateTimeFormat().resolvedOptions().timeZone,r){this.connection=e;this.timeZone=t;this.entryId=r}call(e,t={}){return this.send({type:`tankkeeper/${e}`,args:t})}accept(e){return this.send({type:"tankkeeper/accept_proposal",proposal_id:e})}reject(e){return this.send({type:"tankkeeper/reject_proposal",proposal_id:e})}acceptFinding(e){return this.send({type:"tankkeeper/accept_finding",check_id:e})}rejectFinding(e){return this.send({type:"tankkeeper/reject_finding",check_id:e})}deleteConversation(e){return this.send({type:"tankkeeper/delete_conversation",conversation_id:e})}send(e){return this.connection.sendMessagePromise(e)}};function Ce(s){return typeof s=="object"&&s!==null&&"message"in s?String(s.message):String(s)}var _t="tk-changed",v=S`
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
  ha-icon-button.settings {
    color: var(--secondary-text-color);
    margin: -8px -8px -8px 0;
  }
  .dash {
    display: inline-block;
    width: 14px;
    border-top: 2px dashed;
    margin-right: 4px;
    vertical-align: middle;
  }
`,es={config:{tap_action:{action:"assist",start_listening:!1}},action:"tap"};function me(s){s.dispatchEvent(new CustomEvent("hass-action",{detail:es,bubbles:!0,composed:!0}))}var h=class extends k{constructor(){super();this.loads=0;this.api=void 0,this.error="",this.busy=!1,this.version=0,this.addEventListener(_t,t=>{t.composedPath()[0]!==this&&this.reload()})}static{this.properties={api:{attribute:!1},error:{state:!0},busy:{state:!0},version:{state:!0}}}reloadOn(){return["api"]}willUpdate(t){this.reloadOn().some(r=>t.has(r))&&this.reload()}async reload(){let t=this.api;if(t===void 0)return;this.loads+=1;let r=this.loads;try{let i=await this.load(t);if(r!==this.loads)return;i(),this.error="",this.version+=1}catch(i){r===this.loads&&(this.error=Ce(i))}}async run(t){let r=this.api;if(r===void 0)return!1;this.busy=!0;try{return await t(r),this.error="",await this.reload(),!0}catch(i){return this.error=Ce(i),!1}finally{this.busy=!1}}changed(){this.dispatchEvent(new CustomEvent(_t,{bubbles:!0,composed:!0}))}};var ts={panel:"Panel",mcp:"Claude (MCP)",assist:"Assist",notification:"Notification",rule:"Rule",review:"Review",camera:"Camera"};function kt(s){return String(s).padStart(2,"0")}function fe(s,e){let t=new Intl.DateTimeFormat("en-CA",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(s),r=i=>t.find(n=>n.type===i)?.value??"";return{day:`${r("year")}-${r("month")}-${r("day")}`,minutes:Number(r("hour"))*60+Number(r("minute"))}}function K(s,e){return fe(s,e).day}function W(s,e){let[t=0,r=1,i=1]=s.split("-").map(Number);return new Date(Date.UTC(t,r-1,i+e)).toISOString().slice(0,10)}function b(s){let e=new Date(s);return`${K(e)} ${kt(e.getHours())}:${kt(e.getMinutes())}`}function H(s){return ts[s]??s}function wt(s){return typeof s=="string"?s:JSON.stringify(s)}function I(s){if(s.before===null)return`Added to ${s.collection}`;if(s.after===null)return`Removed from ${s.collection}`;let{before:e,after:t}=s,i=Object.keys(t).filter(n=>JSON.stringify(e[n])!==JSON.stringify(t[n])).map(n=>`${n} ${wt(e[n])} \u2192 ${wt(t[n])}`);return`${s.collection}: ${i.join(", ")}`}function Re(s,...e){let t=e.filter(r=>typeof r=="string"&&r!=="");return[s,...t].join(". ")}function xt(s){if(s.kind==="dose")return Re(`Dose: ${s.product??""} ${String(s.amount_ml??0)} ml`,s.why,s.notes);if(s.kind==="test"){let t=Object.entries(s.values??{}).map(([i,n])=>`${i} ${String(n)}`).join(", "),r=s.source==="tap"?"Tap":"Tank";return Re(`${r} test: ${t}`,s.notes)}let e=[...s.tasks??[]];return typeof s.water_change_percent=="number"&&e.push(`${String(s.water_change_percent)}% water change`),typeof s.water_litres=="number"&&e.push(`${String(s.water_litres)} l water`),Re(e.join(". "),s.why,s.notes)}var Pe=class extends h{constructor(){super();this.details=null;this.toggled=()=>{this.details?.open===!0&&this.reload()};this.collection="",this.recordId=void 0,this.stamp=0,this.entries=void 0}static{this.properties={...h.properties,collection:{attribute:!1},recordId:{attribute:!1},stamp:{attribute:!1},entries:{state:!0}}}static{this.styles=v}connectedCallback(){super.connectedCallback(),this.details=this.closest("details"),this.details?.addEventListener("toggle",this.toggled)}disconnectedCallback(){super.disconnectedCallback(),this.details?.removeEventListener("toggle",this.toggled),this.details=null}async reload(){this.details!==null&&!this.details.open||await super.reload()}reloadOn(){return["api","collection","recordId","stamp"]}async load(t){let r={collection:this.collection,limit:10};this.recordId!==void 0&&(r.record_id=this.recordId);let{history:i}=await t.call("get_history",r);return()=>{this.entries=i}}async undo(t){await this.run(r=>r.call("undo_change",{history_id:t.id}))&&this.changed()}render(){return this.entries===void 0?c:o`
      ${this.error?o`<p class="error">${this.error}</p>`:c}
      ${this.entries.length===0?o`<p class="muted">No changes yet</p>`:c}
      <ul>
        ${this.entries.map(t=>o`<li class="row">
              <div class="grow">
                <div>${t.summary}</div>
                <div class="muted">${b(t.time)} · ${H(t.source)}</div>
                ${t.changes.map(r=>o`<div class="muted">${I(r)}</div>`)}
              </div>
              <button class="undo" ?disabled=${this.busy} @click=${()=>this.undo(t)}>
                Undo
              </button>
            </li>`)}
      </ul>
    `}};customElements.define("tk-history",Pe);var ss="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z",At="/config/integrations/integration/tankkeeper";function rs(s){return s===void 0?At:`${At}#config_entry=${encodeURIComponent(s)}`}function is(s){history.pushState(null,"",rs(s)),window.dispatchEvent(new CustomEvent("location-changed",{detail:{replace:!1}}))}function Le(s,e){return o`<ha-icon-button
    class="settings"
    .path=${ss}
    label="Edit ${s} settings"
    @click=${()=>{is(e?.entryId)}}
  ></ha-icon-button>`}function x(s,e,t){return o`<div class="row">
    <h2 class="grow">${s}</h2>
    ${Le(e,t)}
  </div>`}function ns(s,e){return s.type==="checkbox"&&typeof e=="boolean"?e?"Yes":"No":Array.isArray(e)?e.length===0?"Not set":e.map(String).join(", "):e==null||e===""?"Not set":typeof e=="string"||typeof e=="number"?String(e):JSON.stringify(e)}function O(s,e){let t=new Map(Object.entries(e));return o`<dl class="facts">
    ${s.map(r=>o`<dt>${r.label}</dt>
          <dd class="pre">${ns(r,t.get(r.name))}</dd>`)}
  </dl>`}function w(s,e,t,r){return o`<details>
    <summary>History</summary>
    <tk-history
      .api=${s}
      .collection=${e}
      .recordId=${t}
      .stamp=${r}
    ></tk-history>
  </details>`}var os=[{name:"agent",label:"Conversation agent TankKeeper chats through",type:"text"},{name:"ai_task",label:"AI task entity for review comments",type:"text"},{name:"review_on",label:"Review after",type:"list"},{name:"comments",label:"Claude comments on reviews",type:"checkbox"},{name:"daily_time",label:"Daily review at",type:"time"},{name:"daily_cap",label:"Claude comments a day, at most",type:"number"}],as=20,ls={test:"Test",task:"Task",status:"Status change",daily:"Daily"};function cs(s){let e=s.triggers.map(r=>ls[r]??r).join(", "),t=s.proposal_ids.length;return o`<li class="review">
    <div class="muted">${b(s.time)} · ${e}</div>
    <div>${s.result}</div>
    ${s.comment===null?c:o`<div class="comment">Claude: ${s.comment}</div>`}
    ${s.note===null?c:o`<div class="muted">${s.note}</div>`}
    ${t===0?c:o`<div class="muted">
            ${t} plan ${t===1?"change":"changes"} proposed
          </div>`}
  </li>`}var De=class extends h{static{this.properties={...h.properties,settings:{state:!0},reviews:{state:!0}}}static{this.styles=v}constructor(){super(),this.settings=void 0,this.reviews=[]}async load(e){let[t,r]=await Promise.all([e.call("get_claude"),e.call("get_reviews",{limit:as})]);return()=>{this.settings=t,this.reviews=r.reviews}}render(){let e=this.settings;return o`<section>
      ${x("Claude","Claude",this.api)}
      ${this.error?o`<p class="error">${this.error}</p>`:c}
      ${e===void 0?c:o`<p class="muted note">${e.model_note}</p>
              ${O(os,e)}
              ${w(this.api,"settings","claude",this.version)}`}
      <h3>Reviews</h3>
      ${this.reviews.length===0?o`<p class="muted">No reviews yet.</p>`:o`<ul class="reviews">
              ${this.reviews.map(cs)}
            </ul>`}
    </section>`}};customElements.define("tk-claude",De);var Tt=(s,e,t)=>{let r=new Map;for(let i=e;i<=t;i++)r.set(s[i],i);return r},_=de(class extends B{constructor(s){if(super(s),s.type!==gt.CHILD)throw Error("repeat() can only be used in text expressions")}dt(s,e,t){let r;t===void 0?t=e:e!==void 0&&(r=e);let i=[],n=[],l=0;for(let d of s)i[l]=r?r(d,l):l,n[l]=t(d,l),l++;return{values:n,keys:i}}render(s,e,t){return this.dt(s,e,t).values}update(s,[e,t,r]){let i=vt(s),{values:n,keys:l}=this.dt(e,t,r);if(!Array.isArray(i))return this.ut=l,n;let d=this.ut??=[],a=[],u,g,p=0,f=i.length-1,m=0,y=n.length-1;for(;p<=f&&m<=y;)if(i[p]===null)p++;else if(i[f]===null)f--;else if(d[p]===l[m])a[m]=N(i[p],n[m]),p++,m++;else if(d[f]===l[y])a[y]=N(i[f],n[y]),f--,y--;else if(d[p]===l[y])a[y]=N(i[p],n[y]),z(s,a[y+1],i[p]),p++,y--;else if(d[f]===l[m])a[m]=N(i[f],n[m]),z(s,i[p],i[f]),f--,m++;else if(u===void 0&&(u=Tt(l,m,y),g=Tt(d,p,f)),u.has(d[p]))if(u.has(d[f])){let E=g.get(l[m]),ye=E!==void 0?i[E]:null;if(ye===null){let Ye=z(s,i[p]);N(Ye,n[m]),a[m]=Ye}else a[m]=N(ye,n[m]),z(s,i[p],ye),i[E]=null;m++}else ue(i[f]),f--;else ue(i[p]),p++;for(;m<=y;){let E=z(s,a[y+1]);N(E,n[m]),a[m++]=E}for(;p<=f;){let E=i[p++];E!==null&&ue(E)}return this.ut=l,pe(s,a),P}});var Et=50,Ne=class extends h{static{this.properties={...h.properties,conversations:{state:!0},query:{state:!0},selected:{state:!0},detail:{state:!0}}}static{this.styles=v}constructor(){super(),this.conversations=[],this.query="",this.selected=void 0,this.detail=void 0}reloadOn(){return["api","query","selected"]}async load(e){let t=this.selected;if(t!==void 0){let i=await e.call("get_conversation",{id:t});return()=>{this.detail=i}}let r=this.query===""?await e.call("list_conversations",{limit:Et}):await e.call("search_conversations",{query:this.query,limit:Et});return()=>{this.detail=void 0,this.conversations=r.conversations}}search(e){e.preventDefault();let t=e.target.querySelector("input");this.query=(t?.value??"").trim()}async undo(e){await this.run(t=>t.call("undo_change",{history_id:e.id}))&&this.changed()}async deleteConversation(e){window.confirm("Delete this conversation? The changes made in it stay in the history.")&&await this.run(async t=>{await t.deleteConversation(e),this.selected=void 0})}renderDetail(e){return o`<section>
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
      <div class="muted">${H(e.source)} · ${b(e.started)}</div>
      ${this.error?o`<p class="error">${this.error}</p>`:c}
      <p class="pre">${e.summary}</p>
      <h3>Messages</h3>
      <ul>
        ${e.messages.map(t=>o`<li>
              <strong>${t.role}</strong>
              <div class="pre">${t.text}</div>
            </li>`)}
      </ul>
      <h3>Changes</h3>
      ${e.changes.length===0?o`<p class="muted">No changes</p>`:c}
      <ul>
        ${e.changes.map(t=>o`<li>
              <div class="row">
                <span class="grow">${t.summary}</span>
                <button class="undo" ?disabled=${this.busy} @click=${()=>this.undo(t)}>
                  Undo
                </button>
              </div>
              <div class="muted">${b(t.time)} · ${H(t.source)}</div>
              ${t.changes.map(r=>o`<div class="muted">${I(r)}</div>`)}
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
      ${this.error?o`<p class="error">${this.error}</p>`:c}
      ${this.conversations.length===0?o`<p class="muted">No conversations</p>`:c}
      <ul>
        ${_(this.conversations,e=>e.id,e=>o`<li data-id=${e.id}>
              <div class="row">
                <strong class="grow">${e.title}</strong>
                <button class="open" @click=${()=>this.selected=e.id}>Open</button>
              </div>
              <div class="muted">
                ${H(e.source)} · ${b(e.updated)}
              </div>
              <div class="pre">${e.summary}</div>
            </li>`)}
      </ul>
    </section>`}};customElements.define("tk-conversations",Ne);var St=s=>s??c;function ds(s){return s==null?"":Array.isArray(s)?s.map(String).join(`
`):typeof s=="string"||typeof s=="number"||typeof s=="boolean"?String(s):JSON.stringify(s)}function ps(s,e){return s.type==="number"?e.trim()===""?null:Number(e):s.type==="list"?e.split(`
`).map(t=>t.trim()).filter(t=>t!==""):e}function us(s){return s===""||s===null||s===!1||Array.isArray(s)&&s.length===0}function hs(s,e,t){let r={};for(let i of s){let n=e.elements.namedItem(i.name),l=i.type==="checkbox"?n.checked:ps(i,n.value),d=t[i.name];us(l)&&d==null||JSON.stringify(l)!==JSON.stringify(d)&&(r[i.name]=l)}return r}var He=class extends k{static{this.properties={fields:{attribute:!1},values:{attribute:!1},submitLabel:{attribute:!1},busy:{type:Boolean},error:{attribute:!1}}}constructor(){super(),this.fields=[],this.values={},this.submitLabel="Save",this.busy=!1,this.error=""}static{this.styles=S`
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
  `}input(e){let t=ds(this.values[e.name]);return e.type==="select"?o`<select name=${e.name} ?required=${e.required===!0} .value=${t}>
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
      step=${St(e.step??(e.type==="number"?"any":void 0))}
      ?required=${e.required===!0}
      .value=${t}
    />`}reset(){this.renderRoot.querySelector("form")?.reset()}submit(e){e.preventDefault();let t=hs(this.fields,e.target,this.values);this.dispatchEvent(new CustomEvent("tk-save",{detail:t,bubbles:!0,composed:!0}))}render(){return o`<form
      @submit=${e=>{this.submit(e)}}
    >
      ${this.fields.map(e=>o`<label>${e.label} ${this.input(e)}</label>`)}
      ${this.error?o`<p class="error">${this.error}</p>`:c}
      <button type="submit" ?disabled=${this.busy}>${this.submitLabel}</button>
    </form>`}};customElements.define("tk-form",He);async function A(s,e){let t=s.target;await e(s.detail)&&t.reset()}var ms=["proposed","accepted","replaced"],Ct=[{name:"title",label:"Title",type:"text"},{name:"decision",label:"Decision",type:"textarea"},{name:"why",label:"Why",type:"textarea"},{name:"open",label:"Open points, one per line",type:"list"},{name:"date",label:"Date",type:"date"}],fs=[...Ct,{name:"status",label:"Status",type:"select",options:["proposed","accepted"]}],gs=[{name:"replaced_by",label:"Replaced by decision number",type:"number",step:"1"}];function ge(s){return String(s).padStart(4,"0")}var Ie=class extends h{static{this.properties={...h.properties,decisions:{state:!0},status:{state:!0},selected:{state:!0},detail:{state:!0}}}static{this.styles=v}constructor(){super(),this.decisions=[],this.status="",this.selected=void 0,this.detail=void 0}reloadOn(){return["api","status","selected"]}async load(e){let t=this.status===""?{}:{status:this.status},{decisions:r}=await e.call("list_decisions",t),i=this.selected===void 0?void 0:await e.call("get_decision",{number:this.selected});return()=>{this.decisions=r,this.detail=i}}async save(e,t,r){if(e!=="accept"&&Object.keys(t).length===0)return!1;let i=r===void 0?{action:e,...t}:{action:e,number:r,...t},n=await this.run(l=>l.call("set_decision",i));return n&&this.changed(),n}toggle(e){this.selected=this.selected===e?void 0:e}renderDetail(e){return o`<div class="card">
      <p class="pre">${e.decision}</p>
      <h3>Why</h3>
      <p class="pre">${e.why}</p>
      ${e.open.length>0?o`<h3>Open points</h3>
              <ul>
                ${e.open.map(t=>o`<li>${t}</li>`)}
              </ul>`:c}
      ${e.replaced_by===null?c:o`<p class="muted">Replaced by ${ge(e.replaced_by)}</p>`}
      ${e.replaces.length>0?o`<p class="muted">Replaces ${e.replaces.map(ge).join(", ")}</p>`:c}
      ${e.status==="proposed"?o`<button
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
          .fields=${Ct}
          .values=${e}
          .busy=${this.busy}
          @tk-save=${t=>this.save("update",t.detail,e.number)}
        ></tk-form>
      </details>
      <details>
        <summary>Replace</summary>
        <tk-form
          class="replace"
          .fields=${gs}
          submitLabel="Replace"
          .busy=${this.busy}
          @tk-save=${t=>A(t,r=>this.save("replace",r,e.number))}
        ></tk-form>
      </details>
      <tk-history
        .api=${this.api}
        .collection=${"decisions"}
        .recordId=${ge(e.number)}
        .stamp=${this.version}
      ></tk-history>
    </div>`}renderDecision(e){let t=this.selected===e.number;return o`<li data-number=${e.number}>
      <div class="row">
        <strong class="grow">${ge(e.number)} ${e.title}</strong>
        <button
          class="open"
          @click=${()=>{this.toggle(e.number)}}
        >
          ${t?"Close":"Open"}
        </button>
      </div>
      <div class="muted">${e.status} · ${e.date}</div>
      ${t&&this.detail?.number===e.number?this.renderDetail(this.detail):c}
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
            ${ms.map(e=>o`<option value=${e}>${e}</option>`)}
          </select>
        </div>
        ${this.error?o`<p class="error">${this.error}</p>`:c}
        <ul>
          ${_(this.decisions,e=>e.number,e=>this.renderDecision(e))}
        </ul>
      </section>
      <section>
        <h2>Add a decision</h2>
        <tk-form
          class="add"
          .fields=${fs}
          submitLabel="Add"
          .busy=${this.busy}
          @tk-save=${e=>A(e,t=>this.save("add",t))}
        ></tk-form>
      </section>
    `}};customElements.define("tk-decisions",Ie);var $s=100,ys=["all","dose","test","event"],vs=[["ammonia","Ammonia (ppm)"],["nitrite","Nitrite (ppm)"],["nitrate","Nitrate (ppm)"],["phosphate","Phosphate (ppm)"],["ph","pH"],["kh","KH (dKH)"],["gh","GH (dGH)"],["temperature_c","Temperature (\xB0C)"]],bs=[{name:"source",label:"Water",type:"select",options:["tank","tap"]},...vs.map(([s,e])=>({name:s,label:e,type:"number"})),{name:"notes",label:"Notes",type:"textarea"}],Oe=class extends h{static{this.properties={...h.properties,entries:{state:!0},kind:{state:!0},products:{state:!0}}}static{this.styles=v}constructor(){super(),this.entries=[],this.kind="all",this.products=[]}reloadOn(){return["api","kind"]}async load(e){let[t,r]=await Promise.all([e.call("get_log",{kind:this.kind,limit:$s}),e.call("list_products")]);return()=>{this.entries=t.entries,this.products=r.products.map(i=>i.name)}}doseFields(){return[{name:"product",label:"Product",type:"select",options:this.products,required:!0},{name:"amount_ml",label:"Amount (ml)",type:"number",required:!0},{name:"why",label:"Why",type:"text"},{name:"notes",label:"Notes",type:"textarea"}]}async record(e,t){let r=await this.run(i=>i.call(e,t));return r&&this.changed(),r}async recordTest(e){if(Object.keys(e).length===0)return!1;let{source:t,notes:r,...i}=e,n={values:i};return t!==void 0&&(n.source=t),r!==void 0&&(n.notes=r),this.record("record_test",n)}render(){return o`
      <section>
        <div class="row">
          <h2 class="grow">Log</h2>
          <select
            class="kind"
            aria-label="Kind"
            .value=${this.kind}
            @change=${e=>this.kind=e.target.value}
          >
            ${ys.map(e=>o`<option value=${e}>${e}</option>`)}
          </select>
        </div>
        ${this.error?o`<p class="error">${this.error}</p>`:c}
        <ul>
          ${this.entries.map(e=>o`<li>
                <div class="pre">${xt(e)}</div>
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
          @tk-save=${e=>A(e,t=>this.record("record_dose",t))}
        ></tk-form>
      </section>
      <section>
        <h2>Record a test</h2>
        <tk-form
          class="test"
          .fields=${bs}
          submitLabel="Record"
          .busy=${this.busy}
          @tk-save=${e=>A(e,t=>this.recordTest(t))}
        ></tk-form>
      </section>
    `}};customElements.define("tk-log",Oe);var Rt=1440,L=320,ee=160,T=24,Ue={ammonia:"var(--warning-color, #f4b400)",nitrite:"var(--error-color, #db4437)",nitrate:"var(--info-color, #4285f4)",ph:"var(--primary-color, #03a9f4)",kh:"var(--success-color, #43a047)",gh:"var(--accent-color, #ff9800)",phosphate:"var(--state-icon-color, #44739e)",temperature_c:"var(--error-color, #db4437)"},_s=Ue.ammonia,ks=Ue.nitrite,Pt="var(--secondary-text-color, #727272)",ws=[["ammonia","Ammonia (ppm)"],["nitrite","Nitrite (ppm)"],["nitrate","Nitrate (mg/l)"],["ph","pH"],["kh","KH (dKH)"],["gh","GH (dGH)"],["phosphate","Phosphate (mg/l)"],["temperature_c","Temperature (\xB0C)"]];function $e(s,e,t,r){let i=s.filter(n=>n.kind==="test"&&(n.source==="tap"?"tap":"tank")===r&&typeof n.values?.[e]=="number").map(n=>({time:Date.parse(n.time),value:n.values?.[e]??0})).sort((n,l)=>n.time-l.time);return{name:t,colour:Ue[e],joined:r==="tank",points:i}}function Lt(s,e){let t=[...s.flatMap(r=>r.points.map(i=>i.value)),...e.map(r=>r.value)];return{series:s,lines:e,min:Math.min(0,...t),max:Math.max(...t,0)}}function Me(s){return s.flatMap(([e,t,r])=>typeof t=="number"?[{label:e,value:t,colour:r}]:[])}function Ve(s,e,t){return Me([["Watch",s[e],_s],["Act",s[t],ks]])}function Dt(s,e){let t=[["ammonia","Ammonia"],["nitrite","Nitrite"],["nitrate","Nitrate"]];return Lt([...t.map(([r,i])=>$e(s,r,i,"tank")),...t.map(([r,i])=>$e(s,r,`Tap ${i.toLowerCase()}`,"tap"))],Ve(e,"nitrogen_watch","nitrogen_act"))}function xs(s,e,t,r){let i=n=>Me([["Tap water",r?.[n],Pt]]);switch(s){case"ammonia":case"nitrite":return Ve(e,"nitrogen_watch","nitrogen_act");case"ph":return[...Ve(e,"ph_watch","ph_act"),...i("ph")];case"temperature_c":return Me([["Target",t,Pt]]);default:return i(s)}}function Nt(s,e,t,r){let i=[],n=[];for(let[l,d]of ws){let a=[$e(s,l,"Tank","tank"),$e(s,l,"Tap","tap")];if(a.every(u=>u.points.length===0)){n.push(d);continue}i.push({key:l,label:d,chart:Lt(a,xs(l,e,t,r))})}return{charts:i,empty:n}}function Fe(s,e){let t=s.series.flatMap(a=>a.points.map(u=>u.time));if(t.length===0)return o`<p class="empty">No readings yet</p>`;let r=Math.min(...t),i=Math.max(...t)-r,n=s.max-s.min||1,l=a=>i===0?L/2:T+(a-r)/i*(L-2*T),d=a=>ee-T-(a-s.min)/n*(ee-2*T);return o`
    <svg viewBox="0 0 ${L} ${ee}" role="img" aria-label=${e} class="chart">
      <line class="axis" x1=${T} y1=${ee-T} x2=${L-T} y2=${ee-T}></line>
      <text class="tick" x="2" y=${d(s.max)+4}>${s.max}</text>
      <text class="tick" x="2" y=${d(s.min)+4}>${s.min}</text>
      ${s.lines.map(a=>D`<line class="target" x1=${T} x2=${L-T} y1=${d(a.value)} y2=${d(a.value)}
            stroke=${a.colour}><title>${a.label} ${a.value}</title></line>`)}
      ${s.series.filter(a=>a.points.length>0).map(a=>D`
          ${a.joined?D`<polyline fill="none" stroke=${a.colour}
                  points=${a.points.map(u=>`${String(l(u.time))},${String(d(u.value))}`).join(" ")}>
                </polyline>`:c}
          ${a.points.map(u=>D`<circle class=${a.joined?"solid":"hollow"} cx=${l(u.time)} cy=${d(u.value)} r="3"
                stroke=${a.colour} fill=${a.joined?a.colour:"none"}>
                <title>${a.name} ${u.value}</title></circle>`)}`)}
    </svg>
    <ul class="legend">
      ${s.series.filter(a=>a.points.length>0).map(a=>o`<li>
              ${a.joined?o`<span class="swatch" style="background:${a.colour}"></span>`:o`<span class="swatch hollow" style="border-color:${a.colour}"></span>`}${a.name}
            </li>`)}
      ${s.lines.map(a=>o`<li><span class="dash" style="border-color:${a.colour}"></span>${a.label}</li>`)}
    </ul>
  `}function Ht(s,e,t,r){let i=[];for(let n=t-1;n>=0;n--)i.push({day:W(e,-n),segments:[]});for(let[n,l]of s){let d=fe(new Date(n),r),a=fe(new Date(l),r);for(let u of i){let g=d.day===u.day?d.minutes/Rt:d.day<u.day?0:null,p=a.day===u.day?a.minutes/Rt:a.day>u.day?1:null;g!==null&&p!==null&&p>g&&u.segments.push({start:g,end:p})}}return i}function It(s){let t=s.length*6;return D`
    <svg viewBox="0 0 ${L} ${t}" role="img" class="chart light"
      aria-label=${`Light on and off, last ${String(s.length)} days`}>
      ${s.map((r,i)=>D`
          <rect class="off" x="0" y=${i*6} width=${L} height=${5}></rect>
          ${r.segments.map(n=>D`<rect class="on" x=${n.start*L} y=${i*6}
                width=${(n.end-n.start)*L} height=${5}>
                <title>${r.day}</title></rect>`)}`)}
    </svg>`}var As=20,Ts=[{name:"camera",label:"Camera entity, such as a Tapo C100",type:"text"},{name:"check_time",label:"Daily check at, only while a light is on",type:"time"},{name:"after_test",label:"Check after each test",type:"checkbox"},{name:"alerts",label:"Alert me about issues",type:"checkbox"},{name:"keep_days",label:"Keep photos for (days)",type:"number"}],Es={daily:"Daily",test:"After a test",manual:"Check now",chat:"Asked in a chat"},Ss=[["water","Water"],["algae","Algae"],["plants","Plants"],["level","Water level"]];function je(s){return s.photo_url===null?c:o`<img class="photo" src=${s.photo_url} alt="The tank at ${b(s.time)}" />`}function We(s){return`${b(s.time)} \xB7 ${Es[s.reason]}`}function qe(s){let e=Ss.filter(([t])=>s.seen[t]!==void 0);return o`
    ${s.summary===null?c:o`<div class="summary">${s.summary}</div>`}
    ${s.suggestion===null?c:o`<div>Suggested: ${s.suggestion}</div>`}
    ${e.length===0?c:o`<ul class="seen">
            ${e.map(([t,r])=>o`<li><strong>${r}</strong> ${s.seen[t]}</li>`)}
          </ul>`}
    ${s.note===null?c:o`<div class="muted note">${s.note}</div>`}
  `}var Be=class extends h{static{this.properties={...h.properties,stamp:{type:Number},info:{state:!0},photos:{state:!0},proposals:{state:!0}}}static{this.styles=[v,S`
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
    `]}constructor(){super(),this.stamp=0,this.info=void 0,this.photos=void 0,this.proposals=[]}reloadOn(){return["api","stamp"]}async load(e){let[t,r]=await Promise.all([e.call("get_camera"),e.call("list_proposals",{state:"pending"})]);return()=>{this.info=t,this.proposals=r.proposals,t.camera===null&&(this.photos=void 0)}}async act(e){await this.run(e)&&this.changed()}async showPhotos(){await this.run(async e=>{let t=await e.call("list_photos",{limit:As});this.photos=t.photos})}renderIssue(e){let t=this.proposals.filter(r=>e.proposal_ids.includes(r.proposal_id));return o`<li class="issue" data-check=${e.id}>
      <div class="muted">${We(e)}</div>
      ${je(e)} ${qe(e)}
      ${t.length===0?c:o`<div class="waiting">
              <div class="muted">Accept applies:</div>
              ${t.map(r=>o`<div class="proposal">
                    <strong class="pre">${r.summary}</strong>
                    ${r.changes.map(i=>o`<div class="muted">${I(i)}</div>`)}
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
          @click=${()=>{me(this)}}
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
      ${e.length===0?o`<p class="muted">No photos yet.</p>`:c}
      <ul class="photos">
        ${_(e,t=>t.id,t=>o`<li class="photo-check">
              <div class="muted">${We(t)}</div>
              ${je(t)} ${qe(t)}
            </li>`)}
      </ul>`}renderSettings(e){return o`<details class="settings">
      <summary>Camera settings</summary>
      <p class="muted">
        Each check sends the photo to Anthropic through the AI task entity, uses paid API calls and
        counts toward Claude's comments a day.
      </p>
      ${O(Ts,e)} ${w(this.api,"settings","camera",this.version)}
    </details>`}render(){let e=this.info;if(e===void 0)return this.error?o`<p class="error">${this.error}</p>`:o``;let t=this.error?o`<p class="error">${this.error}</p>`:c;if(e.camera===null)return o`<section id="camera">
        ${x("Camera","camera",this.api)} ${t}
        <p class="muted">
          No camera is set. Add one in the settings, such as a Tapo C100, to have Claude look at the
          tank.
        </p>
        ${this.renderSettings(e)}
      </section>`;let r=e.latest;return o`<section id="camera">
        ${x("Camera","camera",this.api)} ${t}
        ${r===null?o`<p class="muted">No photo yet.</p>`:o`<div class="latest">
                <div class="muted">${We(r)}</div>
                ${je(r)} ${qe(r)}
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
      ${e.open.length===0?c:o`<section id="seen">
              <h2>Seen by the camera</h2>
              <ul>
                ${_(e.open,i=>i.id,i=>this.renderIssue(i))}
              </ul>
            </section>`}`}};customElements.define("tk-camera",Be);var Cs=7,Ot=30,Rs=60,Mt={on_course:"On course",watch:"Watch",act:"Act"},Ps={cycling:"Cycling",cycled:"Cycled"},Ls=[{name:"name",label:"Name",type:"text"},{name:"volume_litres",label:"Volume (litres)",type:"number"},{name:"dosing_volume_litres",label:"Water volume for doses (litres)",type:"number"},{name:"temperature_c",label:"Target temperature (\xB0C)",type:"number"},{name:"stage",label:"Stage",type:"select",options:["cycling","cycled"]},{name:"notes",label:"Notes",type:"textarea"}],Ds=[{name:"source",label:"Values come from",type:"select",options:["supplier","tap_test"]},{name:"ph",label:"pH",type:"number"},{name:"kh",label:"KH (dKH)",type:"number"},{name:"gh",label:"GH (dGH)",type:"number"},{name:"nitrate",label:"Nitrate (mg/l)",type:"number"},{name:"phosphate",label:"Phosphate (mg/l)",type:"number"},{name:"notes",label:"Notes",type:"textarea"}],Ns=[{name:"nitrogen_watch",label:"Ammonia or nitrite Watch above (ppm)",type:"number"},{name:"nitrogen_act",label:"Ammonia or nitrite Act above (ppm)",type:"number"},{name:"ph_watch",label:"pH Watch under, while cycling",type:"number"},{name:"ph_act",label:"pH Act under, while cycling",type:"number"},{name:"stall_watch_days",label:"Stalled cycle Watch after (days)",type:"number",step:"1"},{name:"stall_act_days",label:"Stalled cycle Act after (days)",type:"number",step:"1"},{name:"test_watch_days",label:"Late test Watch after (days)",type:"number",step:"1"},{name:"test_act_days",label:"Late test Act after (days)",type:"number",step:"1"},{name:"skip_watch",label:"Skipped tasks for Watch",type:"number",step:"1"},{name:"skip_act",label:"Skipped tasks for Act",type:"number",step:"1"},{name:"plan_watch_days",label:"Plan ends within, for Watch (days)",type:"number",step:"1"},{name:"plan_act_days",label:"Plan ends within, for Act (days)",type:"number",step:"1"}],ze=class extends h{static{this.properties={...h.properties,status:{state:!0},tank:{state:!0},plan:{state:!0},log:{state:!0},lights:{state:!0},proposals:{state:!0}}}static{this.styles=v}constructor(){super(),this.status=void 0,this.tank=void 0,this.plan=void 0,this.log=[],this.lights=void 0,this.proposals=[]}async load(e){let t=K(new Date,e.timeZone),[r,i,n,l,d,a]=await Promise.all([e.call("get_status"),e.call("get_tank"),e.call("get_plan",{start:t,end:W(t,Cs)}),e.call("get_log",{kind:"test",since:W(t,-Rs),limit:500}),e.call("get_light",{days:Ot}),e.call("list_proposals",{state:"pending"})]);return()=>{this.status=r,this.tank=i,this.plan=n,this.log=l.entries,this.lights=d,this.proposals=a.proposals}}async act(e){await this.run(e)&&this.changed()}settingsCard(e,t,r,i,n,l,d){return o`<section id=${e}>
      ${x(t,r,this.api)} ${O(i,n)}
      ${w(this.api,l,d,this.version)}
    </section>`}renderStatus(e,t){let r=e.status===null?"Not checked yet":Mt[e.status],i=e.stage===null?"":Ps[e.stage];return o`<section id="status">
      <div class="row">
        <h2 class="grow">${t.tank.name}</h2>
        <strong class="level ${e.status??""}">${r}</strong>
      </div>
      <div class="muted">
        ${[i,e.checked===null?"":`checked ${b(e.checked)}`].filter(n=>n!=="").join(" \xB7 ")}
      </div>
      <ul>
        ${e.rules.filter(n=>n.level!=="on_course").map(n=>o`<li>
                <strong>${Mt[n.level]}</strong> ${n.reason}
                ${n.action===null?c:o`<div>${n.action}</div>`}
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
      ${e.problem===null?c:o`<div class="error">${e.problem}</div>`}
      ${It(Ht(e.on_periods,t,Ot,this.api?.timeZone))}
      ${w(this.api,"lights",e.id,this.version)}
    </li>`}renderParameters(e,t){let{charts:r,empty:i}=Nt(this.log,e.settings,t.tank.temperature_c,t.water);return o`<section id="parameters">
      <h2>Water parameters</h2>
      <div class="charts">
        ${r.map(n=>o`<div class="parameter" data-parameter=${n.key}>
              <h3>${n.label}</h3>
              ${Fe(n.chart,n.label)}
            </div>`)}
      </div>
      ${i.length===0?c:o`<p class="muted">No readings yet for: ${i.join(", ")}</p>`}
    </section>`}renderProposal(e){return o`<li>
      <strong class="pre">${e.summary}</strong>
      <div class="pre">${e.reason}</div>
      <div class="muted">${H(e.source)} · ${b(e.created)}</div>
      ${e.changes.map(t=>o`<div class="muted">${I(t)}</div>`)}
      <div class="row">
        <button
          class="discuss"
          @click=${()=>{me(this)}}
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
    </li>`}render(){let{status:e,tank:t,plan:r,lights:i}=this;if(e===void 0||t===void 0||r===void 0||i===void 0)return this.error?o`<p class="error">${this.error}</p>`:o`<p class="muted">Loading</p>`;let n=K(new Date,this.api?.timeZone),l=r.tasks.filter(a=>a.date===n),d=r.tasks.filter(a=>a.date>n);return o`
      ${this.error?o`<p class="error">${this.error}</p>`:c}
      ${this.renderStatus(e,t)}
      <section id="today">
        <h2>Today</h2>
        ${l.length===0?o`<p class="muted">No tasks today</p>`:c}
        <ul>
          ${_(l,a=>a.id,a=>this.renderTask(a,!0))}
        </ul>
      </section>
      <section id="waiting">
        <h2>Waiting for you</h2>
        ${this.proposals.length===0?o`<p class="muted">Nothing is waiting for you</p>`:c}
        <ul>
          ${_(this.proposals,a=>a.proposal_id,a=>this.renderProposal(a))}
        </ul>
      </section>
      <section id="cycle">
        <h2>Cycle</h2>
        ${Fe(Dt(this.log,e.settings),"Cycle")}
      </section>
      ${this.renderParameters(e,t)}
      <section id="week">
        <h2>Next 7 days</h2>
        ${d.length===0?o`<p class="muted">No tasks</p>`:c}
        <ul>
          ${d.map(a=>o`<li>
                <span class="muted">${a.date}</span> ${a.time??""} ${a.text}
              </li>`)}
        </ul>
      </section>
      ${this.settingsCard("tank","Tank","tank",Ls,t.tank,"tank","tank")}
      ${this.settingsCard("water","Water","water",Ds,t.water??{},"water","water")}
      <section id="light">
        ${x("Light","light",this.api)}
        ${i.lights.length===0?o`<p class="muted">No lights yet</p>`:c}
        ${i.next_change===null?c:o`<div class="muted">Next change ${b(i.next_change.time)}</div>`}
        <ul>
          ${_(i.lights,a=>a.id,a=>this.renderLight(a,i.today))}
        </ul>
      </section>
      ${this.settingsCard("rules","Rule limits","rule",Ns,e.settings,"settings","rules")}
      <tk-camera .api=${this.api} .stamp=${this.version}></tk-camera>
    `}};customElements.define("tk-overview",ze);var Hs=28,Vt=[{name:"text",label:"Task",type:"text"},{name:"date",label:"Date",type:"date"},{name:"slot",label:"Slot",type:"select",options:["task","dose"]}],Ut={name:"note",label:"Note",type:"text"},Is=[...Vt,Ut],Os=[...Vt,{name:"state",label:"State",type:"select",options:["open","complete","skip"]},Ut],Ms=[{name:"notify",label:"Notify services for reminders",type:"list"},{name:"status_notify",label:"Notify services for status alerts",type:"list"},{name:"task_time",label:"Task reminder time",type:"time"},{name:"dose_time",label:"Dose reminder time",type:"time"},{name:"resend_time",label:"Resend open tasks at",type:"time"}],Ke=class extends h{static{this.properties={...h.properties,plan:{state:!0}}}static{this.styles=v}constructor(){super(),this.plan=void 0}async load(e){let t=K(new Date,e.timeZone),r=await e.call("get_plan",{start:t,end:W(t,Hs-1)});return()=>{this.plan=r}}async save(e,t,r){if(r===void 0&&Object.keys(t).length===0)return!1;let i=r===void 0?t:{task_id:r,...t},n=await this.run(l=>l.call(e,i));return n&&this.changed(),n}renderTask(e){return o`<li data-task=${e.id}>
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
          .fields=${Os}
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
        ${this.error?o`<p class="error">${this.error}</p>`:c}
        ${e!==void 0&&t.length===0?o`<p class="muted">No tasks in the next four weeks</p>`:c}
        ${t.map(r=>o`<h3>${r}</h3>
              <ul>
                ${_(e?.tasks.filter(i=>i.date===r)??[],i=>i.id,i=>this.renderTask(i))}
              </ul>`)}
      </section>
      <section>
        <h2>Add a task</h2>
        <tk-form
          class="add"
          .fields=${Is}
          submitLabel="Add"
          .busy=${this.busy}
          @tk-save=${r=>A(r,i=>this.save("add_task",i))}
        ></tk-form>
      </section>
      ${e===void 0?c:o`<section id="reminders">
              ${x("Reminders","reminder",this.api)}
              ${O(Ms,e.reminders)}
              ${w(this.api,"settings","reminders",this.version)}
            </section>`}
    `}};customElements.define("tk-plan",Ke);function $(s){return typeof s=="string"||typeof s=="number"?String(s):""}function Vs(s){return s.label_dose??{}}var Us={products:{title:"Products",setting:"product",collection:"products",list:"list_products",key:"products",canShowRemoved:!0,label:s=>$(s.name),lines:s=>{let e=Vs(s),t=[$(s.purpose)];if(s.label_dose){let r=s.label_dose_for_tank_ml===void 0?"":` (${$(s.label_dose_for_tank_ml)} ml for this tank)`;t.push(`Label: ${$(e.amount_ml)} ml per ${$(e.per_litres)} l, ${$(e.frequency)}${r}`)}return $(s.your_dose)&&t.push(`Your dose: ${$(s.your_dose)}`),t.push($(s.notes)),Array.isArray(s.links)&&t.push(s.links.map($).join(" ")),t}},contents:{title:"Contents",setting:"content",collection:"contents",list:"list_contents",key:"contents",canShowRemoved:!0,label:s=>$(s.name),lines:s=>[[$(s.type),$(s.count),$(s.where),`added ${$(s.added)}`].filter(e=>e!=="").join(" \xB7 "),$(s.notes)]},notes:{title:"Notes",collection:"notes",list:"list_notes",key:"notes",edit:{idArg:"note_id",add:"add_note",update:"update_note",remove:"remove_note",fields:[{name:"kind",label:"Kind",type:"select",options:["question","assumption"]},{name:"topic",label:"Topic",type:"text"},{name:"text",label:"Text",type:"textarea"},{name:"how_to_resolve",label:"How to resolve",type:"textarea"}]},canShowRemoved:!1,label:s=>`${$(s.kind)}: ${$(s.topic)}`,lines:s=>[$(s.text),$(s.how_to_resolve)]}},Ge=class extends h{static{this.properties={...h.properties,kind:{attribute:!1},items:{state:!0},showRemoved:{state:!0}}}static{this.styles=v}constructor(){super(),this.kind="",this.items=[],this.showRemoved=!1}get config(){let e=Us[this.kind];if(e===void 0)throw new Error(`No records called ${this.kind}`);return e}reloadOn(){return["api","kind","showRemoved"]}async load(e){let t=this.config,r=t.canShowRemoved?{include_removed:this.showRemoved}:{},i=(await e.call(t.list,r))[t.key]??[];return()=>{this.items=i}}async save(e,t,r,i){if(Object.keys(r).length===0)return!1;let n=i===void 0?r:{[e.idArg]:i,...r};return this.run(l=>l.call(t,n))}async removeRecord(e,t){await this.run(r=>r.call(e.remove,{[e.idArg]:t}))}status(e,t){return typeof t.removed=="string"?o`<span class="muted">Removed ${t.removed}</span>`:e===void 0?c:o`<button
      class="remove"
      ?disabled=${this.busy}
      @click=${()=>this.removeRecord(e,t.id)}
    >
      Remove
    </button>`}details(e,t){let r=e.edit;return r===void 0?w(this.api,e.collection,t.id,this.version):o`<details>
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
    </li>`}add(e){return e===void 0?c:o`<section>
      <h2>Add</h2>
      <tk-form
        class="add"
        .fields=${e.fields}
        submitLabel="Add"
        .busy=${this.busy}
        @tk-save=${t=>A(t,r=>this.save(e,e.add,r))}
      ></tk-form>
    </section>`}render(){let e=this.config;return o`
      <section>
        <div class="row">
          <h2 class="grow">${e.title}</h2>
          ${e.setting===void 0?c:Le(e.setting,this.api)}
          ${e.canShowRemoved?o`<label class="muted"
                  ><input
                    type="checkbox"
                    class="show-removed"
                    .checked=${this.showRemoved}
                    @change=${t=>this.showRemoved=t.target.checked}
                  />
                  Show removed</label
                >`:c}
        </div>
        ${this.error?o`<p class="error">${this.error}</p>`:c}
        <ul>
          ${_(this.items,t=>t.id,t=>this.item(e,t))}
        </ul>
      </section>
      ${this.add(e.edit)}
    `}};customElements.define("tk-records",Ge);var Fs=[["overview","Overview"],["plan","Plan"],["log","Log"],["contents","Contents"],["products","Products"],["decisions","Decisions"],["notes","Notes"],["conversations","Conversations"],["claude","Claude"]],Je=class extends k{constructor(){super();this.connection=void 0;this.hass=void 0,this.panel=void 0,this.narrow=!1,this.tab="overview",this.api=void 0}static{this.properties={hass:{attribute:!1},panel:{attribute:!1},narrow:{type:Boolean},tab:{state:!0},api:{state:!0}}}static{this.styles=S`
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
  `}willUpdate(t){let r=this.hass;if(r===void 0||!(t.has("hass")||t.has("panel")))return;let i=this.panel?.config?.entry_id;this.connection===r.connection&&this.api?.entryId===i||(this.connection=r.connection,this.api=new he(r.connection,r.config?.time_zone,i))}view(){switch(this.tab){case"plan":return o`<tk-plan .api=${this.api}></tk-plan>`;case"log":return o`<tk-log .api=${this.api}></tk-log>`;case"decisions":return o`<tk-decisions .api=${this.api}></tk-decisions>`;case"claude":return o`<tk-claude .api=${this.api}></tk-claude>`;case"conversations":return o`<tk-conversations .api=${this.api}></tk-conversations>`;case"contents":case"products":case"notes":return o`${bt(this.tab,o`<tk-records .api=${this.api} .kind=${this.tab}></tk-records>`)}`;default:return o`<tk-overview .api=${this.api}></tk-overview>`}}render(){return o`
      <header>
        ${this.narrow?o`<ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>`:c}
        <h1>TankKeeper</h1>
      </header>
      <nav role="tablist">
        ${Fs.map(([t,r])=>o`<button
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
    `}};customElements.define("tankkeeper-panel",Je);export{Je as TankkeeperPanel};
