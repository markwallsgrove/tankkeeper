var ke=globalThis,xe=ke.ShadowRoot&&(ke.ShadyCSS===void 0||ke.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Ke=Symbol(),qt=new WeakMap,le=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==Ke)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(xe&&e===void 0){let i=t!==void 0&&t.length===1;i&&(e=qt.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&qt.set(t,e))}return e}toString(){return this.cssText}},zt=s=>new le(typeof s=="string"?s:s+"",void 0,Ke),$=(s,...e)=>{let t=s.length===1?s[0]:e.reduce((i,r,n)=>i+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+s[n+1],s[0]);return new le(t,s,Ke)},Wt=(s,e)=>{if(xe)s.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let i=document.createElement("style"),r=ke.litNonce;r!==void 0&&i.setAttribute("nonce",r),i.textContent=t.cssText,s.appendChild(i)}},qe=xe?s=>s:s=>s instanceof CSSStyleSheet?(e=>{let t="";for(let i of e.cssRules)t+=i.cssText;return zt(t)})(s):s;var{is:li,defineProperty:di,getOwnPropertyDescriptor:ci,getOwnPropertyNames:pi,getOwnPropertySymbols:hi,getPrototypeOf:ui}=Object,we=globalThis,Zt=we.trustedTypes,mi=Zt?Zt.emptyScript:"",gi=we.reactiveElementPolyfillSupport,de=(s,e)=>s,ze={toAttribute(s,e){switch(e){case Boolean:s=s?mi:null;break;case Object:case Array:s=s==null?s:JSON.stringify(s)}return s},fromAttribute(s,e){let t=s;switch(e){case Boolean:t=s!==null;break;case Number:t=s===null?null:Number(s);break;case Object:case Array:try{t=JSON.parse(s)}catch{t=null}}return t}},Yt=(s,e)=>!li(s,e),Gt={attribute:!0,type:String,converter:ze,reflect:!1,useDefault:!1,hasChanged:Yt};Symbol.metadata??=Symbol("metadata"),we.litPropertyMetadata??=new WeakMap;var D=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=Gt){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let i=Symbol(),r=this.getPropertyDescriptor(e,i,t);r!==void 0&&di(this.prototype,e,r)}}static getPropertyDescriptor(e,t,i){let{get:r,set:n}=ci(this.prototype,e)??{get(){return this[t]},set(a){this[t]=a}};return{get:r,set(a){let c=r?.call(this);n?.call(this,a),this.requestUpdate(e,c,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Gt}static _$Ei(){if(this.hasOwnProperty(de("elementProperties")))return;let e=ui(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(de("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(de("properties"))){let t=this.properties,i=[...pi(t),...hi(t)];for(let r of i)this.createProperty(r,t[r])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[i,r]of t)this.elementProperties.set(i,r)}this._$Eh=new Map;for(let[t,i]of this.elementProperties){let r=this._$Eu(t,i);r!==void 0&&this._$Eh.set(r,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let i=new Set(e.flat(1/0).reverse());for(let r of i)t.unshift(qe(r))}else e!==void 0&&t.push(qe(e));return t}static _$Eu(e,t){let i=t.attribute;return i===!1?void 0:typeof i=="string"?i:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Wt(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){let i=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,i);if(r!==void 0&&i.reflect===!0){let n=(i.converter?.toAttribute!==void 0?i.converter:ze).toAttribute(t,i.type);this._$Em=e,n==null?this.removeAttribute(r):this.setAttribute(r,n),this._$Em=null}}_$AK(e,t){let i=this.constructor,r=i._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let n=i.getPropertyOptions(r),a=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:ze;this._$Em=r;let c=a.fromAttribute(t,n.type);this[r]=c??this._$Ej?.get(r)??c,this._$Em=null}}requestUpdate(e,t,i,r=!1,n){if(e!==void 0){let a=this.constructor;if(r===!1&&(n=this[e]),i??=a.getPropertyOptions(e),!((i.hasChanged??Yt)(n,t)||i.useDefault&&i.reflect&&n===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,i))))return;this.C(e,t,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:r,wrapped:n},a){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),n!==!0||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),r===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[r,n]of this._$Ep)this[r]=n;this._$Ep=void 0}let i=this.constructor.elementProperties;if(i.size>0)for(let[r,n]of i){let{wrapped:a}=n,c=this[r];a!==!0||this._$AL.has(r)||c===void 0||this.C(r,void 0,n,c)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(i=>i.hostUpdate?.()),this.update(t)):this._$EM()}catch(i){throw e=!1,this._$EM(),i}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};D.elementStyles=[],D.shadowRootOptions={mode:"open"},D[de("elementProperties")]=new Map,D[de("finalized")]=new Map,gi?.({ReactiveElement:D}),(we.reactiveElementVersions??=[]).push("2.1.2");var Ze=globalThis,Xt=s=>s,_e=Ze.trustedTypes,Jt=_e?_e.createPolicy("lit-html",{createHTML:s=>s}):void 0,Ge="$lit$",M=`lit$${Math.random().toFixed(9).slice(2)}$`,Ye="?"+M,fi=`<${Ye}>`,z=document,pe=()=>z.createComment(""),he=s=>s===null||typeof s!="object"&&typeof s!="function",Xe=Array.isArray,rs=s=>Xe(s)||typeof s?.[Symbol.iterator]=="function",We=`[ 	
\f\r]`,ce=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Qt=/-->/g,es=/>/g,K=RegExp(`>|${We}(?:([^\\s"'>=/]+)(${We}*=${We}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),ts=/'/g,ss=/"/g,ns=/^(?:script|style|textarea|title)$/i,Je=s=>(e,...t)=>({_$litType$:s,strings:e,values:t}),o=Je(1),R=Je(2),Br=Je(3),T=Symbol.for("lit-noChange"),d=Symbol.for("lit-nothing"),is=new WeakMap,q=z.createTreeWalker(z,129);function os(s,e){if(!Xe(s)||!s.hasOwnProperty("raw"))throw Error("invalid template strings array");return Jt!==void 0?Jt.createHTML(e):e}var as=(s,e)=>{let t=s.length-1,i=[],r,n=e===2?"<svg>":e===3?"<math>":"",a=ce;for(let c=0;c<t;c++){let l=s[c],h,v,p=-1,g=0;for(;g<l.length&&(a.lastIndex=g,v=a.exec(l),v!==null);)g=a.lastIndex,a===ce?v[1]==="!--"?a=Qt:v[1]!==void 0?a=es:v[2]!==void 0?(ns.test(v[2])&&(r=RegExp("</"+v[2],"g")),a=K):v[3]!==void 0&&(a=K):a===K?v[0]===">"?(a=r??ce,p=-1):v[1]===void 0?p=-2:(p=a.lastIndex-v[2].length,h=v[1],a=v[3]===void 0?K:v[3]==='"'?ss:ts):a===ss||a===ts?a=K:a===Qt||a===es?a=ce:(a=K,r=void 0);let f=a===K&&s[c+1].startsWith("/>")?" ":"";n+=a===ce?l+fi:p>=0?(i.push(h),l.slice(0,p)+Ge+l.slice(p)+M+f):l+M+(p===-2?c:f)}return[os(s,n+(s[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),i]},ue=class s{constructor({strings:e,_$litType$:t},i){let r;this.parts=[];let n=0,a=0,c=e.length-1,l=this.parts,[h,v]=as(e,t);if(this.el=s.createElement(h,i),q.currentNode=this.el.content,t===2||t===3){let p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(r=q.nextNode())!==null&&l.length<c;){if(r.nodeType===1){if(r.hasAttributes())for(let p of r.getAttributeNames())if(p.endsWith(Ge)){let g=v[a++],f=r.getAttribute(p).split(M),w=/([.?@])?(.*)/.exec(g);l.push({type:1,index:n,name:w[2],strings:f,ctor:w[1]==="."?Ae:w[1]==="?"?Te:w[1]==="@"?Ee:Z}),r.removeAttribute(p)}else p.startsWith(M)&&(l.push({type:6,index:n}),r.removeAttribute(p));if(ns.test(r.tagName)){let p=r.textContent.split(M),g=p.length-1;if(g>0){r.textContent=_e?_e.emptyScript:"";for(let f=0;f<g;f++)r.append(p[f],pe()),q.nextNode(),l.push({type:2,index:++n});r.append(p[g],pe())}}}else if(r.nodeType===8)if(r.data===Ye)l.push({type:2,index:n});else{let p=-1;for(;(p=r.data.indexOf(M,p+1))!==-1;)l.push({type:7,index:n}),p+=M.length-1}n++}}static createElement(e,t){let i=z.createElement("template");return i.innerHTML=e,i}};function W(s,e,t=s,i){if(e===T)return e;let r=i!==void 0?t._$Co?.[i]:t._$Cl,n=he(e)?void 0:e._$litDirective$;return r?.constructor!==n&&(r?._$AO?.(!1),n===void 0?r=void 0:(r=new n(s),r._$AT(s,t,i)),i!==void 0?(t._$Co??=[])[i]=r:t._$Cl=r),r!==void 0&&(e=W(s,r._$AS(s,e.values),r,i)),e}var Ce=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:i}=this._$AD,r=(e?.creationScope??z).importNode(t,!0);q.currentNode=r;let n=q.nextNode(),a=0,c=0,l=i[0];for(;l!==void 0;){if(a===l.index){let h;l.type===2?h=new J(n,n.nextSibling,this,e):l.type===1?h=new l.ctor(n,l.name,l.strings,this,e):l.type===6&&(h=new Le(n,this,e)),this._$AV.push(h),l=i[++c]}a!==l?.index&&(n=q.nextNode(),a++)}return q.currentNode=z,r}p(e){let t=0;for(let i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}},J=class s{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,r){this.type=2,this._$AH=d,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=W(this,e,t),he(e)?e===d||e==null||e===""?(this._$AH!==d&&this._$AR(),this._$AH=d):e!==this._$AH&&e!==T&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):rs(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==d&&he(this._$AH)?this._$AA.nextSibling.data=e:this.T(z.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:i}=e,r=typeof i=="number"?this._$AC(e):(i.el===void 0&&(i.el=ue.createElement(os(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===r)this._$AH.p(t);else{let n=new Ce(r,this),a=n.u(this.options);n.p(t),this.T(a),this._$AH=n}}_$AC(e){let t=is.get(e.strings);return t===void 0&&is.set(e.strings,t=new ue(e)),t}k(e){Xe(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,i,r=0;for(let n of e)r===t.length?t.push(i=new s(this.O(pe()),this.O(pe()),this,this.options)):i=t[r],i._$AI(n),r++;r<t.length&&(this._$AR(i&&i._$AB.nextSibling,r),t.length=r)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let i=Xt(e).nextSibling;Xt(e).remove(),e=i}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},Z=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,r,n){this.type=1,this._$AH=d,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=n,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=d}_$AI(e,t=this,i,r){let n=this.strings,a=!1;if(n===void 0)e=W(this,e,t,0),a=!he(e)||e!==this._$AH&&e!==T,a&&(this._$AH=e);else{let c=e,l,h;for(e=n[0],l=0;l<n.length-1;l++)h=W(this,c[i+l],t,l),h===T&&(h=this._$AH[l]),a||=!he(h)||h!==this._$AH[l],h===d?e=d:e!==d&&(e+=(h??"")+n[l+1]),this._$AH[l]=h}a&&!r&&this.j(e)}j(e){e===d?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},Ae=class extends Z{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===d?void 0:e}},Te=class extends Z{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==d)}},Ee=class extends Z{constructor(e,t,i,r,n){super(e,t,i,r,n),this.type=5}_$AI(e,t=this){if((e=W(this,e,t,0)??d)===T)return;let i=this._$AH,r=e===d&&i!==d||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,n=e!==d&&(i===d||r);r&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Le=class{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){W(this,e)}},ls={M:Ge,P:M,A:Ye,C:1,L:as,R:Ce,D:rs,V:W,I:J,H:Z,N:Te,U:Ee,B:Ae,F:Le},vi=Ze.litHtmlPolyfillSupport;vi?.(ue,J),(Ze.litHtmlVersions??=[]).push("3.3.3");var ds=(s,e,t)=>{let i=t?.renderBefore??e,r=i._$litPart$;if(r===void 0){let n=t?.renderBefore??null;i._$litPart$=r=new J(e.insertBefore(pe(),n),n,void 0,t??{})}return r._$AI(s),r};var Qe=globalThis,_=class extends D{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=ds(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return T}};_._$litElement$=!0,_.finalized=!0,Qe.litElementHydrateSupport?.({LitElement:_});var yi=Qe.litElementPolyfillSupport;yi?.({LitElement:_});(Qe.litElementVersions??=[]).push("4.2.2");var I={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},Q=s=>(...e)=>({_$litDirective$:s,values:e}),F=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,i){this._$Ct=e,this._$AM=t,this._$Ci=i}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};var{I:$i}=ls,cs=s=>s;var hs=s=>s.strings===void 0,ps=()=>document.createComment(""),ee=(s,e,t)=>{let i=s._$AA.parentNode,r=e===void 0?s._$AB:e._$AA;if(t===void 0){let n=i.insertBefore(ps(),r),a=i.insertBefore(ps(),r);t=new $i(n,a,s,s.options)}else{let n=t._$AB.nextSibling,a=t._$AM,c=a!==s;if(c){let l;t._$AQ?.(s),t._$AM=s,t._$AP!==void 0&&(l=s._$AU)!==a._$AU&&t._$AP(l)}if(n!==r||c){let l=t._$AA;for(;l!==n;){let h=cs(l).nextSibling;cs(i).insertBefore(l,r),l=h}}}return t},j=(s,e,t=s)=>(s._$AI(e,t),s),bi={},te=(s,e=bi)=>s._$AH=e,us=s=>s._$AH,Se=s=>{s._$AR(),s._$AA.remove()};var ms=Q(class extends F{constructor(){super(...arguments),this.key=d}render(s,e){return this.key=s,e}update(s,[e,t]){return e!==this.key&&(te(s),this.key=e),t}});var Re=class{constructor(e,t=Intl.DateTimeFormat().resolvedOptions().timeZone,i){this.connection=e;this.timeZone=t;this.entryId=i}call(e,t={}){return this.send({type:`tankkeeper/${e}`,args:t})}accept(e){return this.send({type:"tankkeeper/accept_proposal",proposal_id:e})}reject(e){return this.send({type:"tankkeeper/reject_proposal",proposal_id:e})}acceptFinding(e){return this.send({type:"tankkeeper/accept_finding",check_id:e})}rejectFinding(e){return this.send({type:"tankkeeper/reject_finding",check_id:e})}chatAgent(){return this.send({type:"tankkeeper/chat_agent"})}converse(e,t,i){return this.send({type:"conversation/process",text:e,conversation_id:t,agent_id:i})}send(e){return this.connection.sendMessagePromise(e)}};function Pe(s){return Object(s).code==="not_found"}function G(s){return typeof s=="object"&&s!==null&&"message"in s?String(s.message):String(s)}var me=s=>s??d;var se="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z",gs="M13.5,8H12V13L16.28,15.54L17,14.33L13.5,12.25V8M13,3A9,9 0 0,0 4,12H1L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3",Y="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z",fs="M15,16H19V18H15V16M15,8H22V10H15V8M15,12H21V14H15V12M3,18A2,2 0 0,0 5,20H11A2,2 0 0,0 13,18V8H3V18M14,5H11L10,4H6L5,5H2V7H14V5Z",O="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z",ie="M12.5,8C9.85,8 7.45,9 5.6,10.6L2,7V16H11L7.38,12.38C8.77,11.22 10.54,10.5 12.5,10.5C16.04,10.5 19.05,12.81 20.1,16L22.47,15.22C21.08,11.03 17.15,8 12.5,8Z",V="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",E="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z",re="M12,3C6.5,3 2,6.58 2,11C2.05,13.15 3.06,15.17 4.75,16.5C4.75,17.1 4.33,18.67 2,21C4.37,20.89 6.64,20 8.47,18.5C9.61,18.83 10.81,19 12,19C17.5,19 22,15.42 22,11C22,6.58 17.5,3 12,3M12,17C7.58,17 4,14.31 4,11C4,7.69 7.58,5 12,5C16.42,5 20,7.69 20,11C20,14.31 16.42,17 12,17Z",vs="M18 14H20V17H23V19H20V22H18V19H15V17H18V14M12 3C17.5 3 22 6.58 22 11C22 11.58 21.92 12.14 21.78 12.68C20.95 12.25 20 12 19 12C15.69 12 13 14.69 13 18L13.08 18.95L12 19C10.76 19 9.57 18.82 8.47 18.5C5.55 21 2 21 2 21C4.33 18.67 4.7 17.1 4.75 16.5C3.05 15.07 2 13.14 2 11C2 6.58 6.5 3 12 3Z",ys="M17,12V3A1,1 0 0,0 16,2H3A1,1 0 0,0 2,3V17L6,13H16A1,1 0 0,0 17,12M21,6H19V15H6V17A1,1 0 0,0 7,18H18L22,22V7A1,1 0 0,0 21,6Z",$s="M2,21L23,12L2,3V10L17,12L2,14V21Z",bs="M16,18H18V6H16M6,18L14.5,12L6,6V18Z",ks="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z",xs="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z",ws="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z",_s="M15 16L11 20H21V16H15M12.06 7.19L3 16.25V20H6.75L15.81 10.94L12.06 7.19M5.92 18H5V17.08L12.06 10L13 10.94L5.92 18M18.71 8.04C19.1 7.65 19.1 7 18.71 6.63L16.37 4.29C16.17 4.09 15.92 4 15.66 4C15.41 4 15.15 4.1 14.96 4.29L13.13 6.12L16.88 9.87L18.71 8.04Z",Cs="M4,4H7L9,2H15L17,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z",As="M22,16V4A2,2 0 0,0 20,2H8A2,2 0 0,0 6,4V16A2,2 0 0,0 8,18H20A2,2 0 0,0 22,16M11,12L13.03,14.71L16,11L20,16H8M2,6V20A2,2 0 0,0 4,22H18V20H4V6",Ts="M23,10C23,8.89 22.1,8 21,8H14.68L15.64,3.43C15.66,3.33 15.67,3.22 15.67,3.11C15.67,2.7 15.5,2.32 15.23,2.05L14.17,1L7.59,7.58C7.22,7.95 7,8.45 7,9V19A2,2 0 0,0 9,21H18C18.83,21 19.54,20.5 19.84,19.78L22.86,12.73C22.95,12.5 23,12.26 23,12V10M1,21H5V9H1V21Z",He="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z",et="M21,9L17,5V8H10V10H17V13M7,11L3,15L7,19V16H14V14H7V11Z",tt="M19.35,11.72L17.22,13.85L15.81,12.43L8.1,20.14L3.5,22L2,20.5L3.86,15.9L11.57,8.19L10.15,6.78L12.28,4.65L19.35,11.72M16.76,3C17.93,1.83 19.83,1.83 21,3C22.17,4.17 22.17,6.07 21,7.24L19.08,9.16L14.84,4.92L16.76,3M5.56,17.03L4.5,19.5L6.97,18.44L14.4,11L13,9.6L5.56,17.03Z",st="M7,2V4H8V18A4,4 0 0,0 12,22A4,4 0 0,0 16,18V4H17V2H7M11,16C10.4,16 10,15.6 10,15C10,14.4 10.4,14 11,14C11.6,14 12,14.4 12,15C12,15.6 11.6,16 11,16M13,12C12.4,12 12,11.6 12,11C12,10.4 12.4,10 13,10C13.6,10 14,10.4 14,11C14,11.6 13.6,12 13,12M14,7H10V4H14V7Z",Es="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",Ls="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z";function it(s){return o`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
    ${R`<path d=${s}></path>`}
  </svg>`}function u(s){let e=s.disabled===!0;return o`<ha-icon-button
    class=${s.className}
    .path=${s.icon}
    label=${s.label}
    ?disabled=${e}
    @click=${()=>{e||s.onClick()}}
  ></ha-icon-button>`}function b(s){let e=s.expanded===void 0?void 0:String(s.expanded);return o`<button
    class="${s.className}${s.primary===!0?" primary":""} with-icon"
    type=${s.type??"button"}
    ?disabled=${s.disabled===!0}
    aria-expanded=${me(e)}
    aria-controls=${me(s.controls)}
    @click=${()=>{s.onClick?.()}}
  >
    ${it(s.icon)}<span>${s.label}</span>
  </button>`}var ne=$`
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
`;var ki="tk-dialog-closed",rt=class extends _{static{this.properties={heading:{}}}static{this.styles=[ne,$`
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
    `]}constructor(){super(),this.heading=""}get dialog(){return this.renderRoot.querySelector("dialog")}firstUpdated(){this.dialog?.showModal()}close(){this.dialog?.close()}render(){return o`<dialog
      aria-labelledby="heading"
      @close=${()=>{this.dispatchEvent(new CustomEvent(ki,{bubbles:!0,composed:!0}))}}
    >
      <div class="head">
        <h2 id="heading">${this.heading}</h2>
        ${u({icon:E,label:"Close",className:"close",onClick:()=>{this.close()}})}
      </div>
      <slot></slot>
    </dialog>`}};customElements.define("tk-dialog",rt);var xi=["mon","tue","wed","thu","fri","sat","sun"];function wi(s){return s.charAt(0).toUpperCase()+s.slice(1)}function _i(s,e){return[...s.querySelectorAll(`input[name="${e}"]`)].filter(t=>t.checked).map(t=>t.value)}function Ci(s,e){if(s.type==="weekdays")return _i(e,s.name);let t=e.elements.namedItem(s.name);return s.type==="checkbox"?t.checked:Ti(s,t.value)}function Ai(s){return s==null?"":Array.isArray(s)?s.map(String).join(`
`):typeof s=="string"||typeof s=="number"||typeof s=="boolean"?String(s):JSON.stringify(s)}function Ti(s,e){return s.type==="number"?e.trim()===""?null:Number(e):s.type==="list"?e.split(`
`).map(t=>t.trim()).filter(t=>t!==""):e}function Ei(s){return s===""||s===null||s===!1||Array.isArray(s)&&s.length===0}function Li(s,e,t){let i={};for(let r of s){let n=Ci(r,e),a=t[r.name];Ei(n)&&a==null||JSON.stringify(n)!==JSON.stringify(a)&&(i[r.name]=n)}return i}var nt=class extends _{static{this.properties={fields:{attribute:!1},values:{attribute:!1},submitLabel:{attribute:!1},submitIcon:{attribute:!1},busy:{type:Boolean},error:{attribute:!1}}}constructor(){super(),this.fields=[],this.values={},this.submitLabel="Save",this.submitIcon=He,this.busy=!1,this.error=""}static{this.styles=[ne,$`
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
    `]}weekdays(e){let t=this.values[e.name],i=Array.isArray(t)?t.map(String):[];return o`<fieldset>
      <legend>${e.label}</legend>
      ${xi.map(r=>o`<label class="day"
            ><input
              name=${e.name}
              type="checkbox"
              value=${r}
              .checked=${i.includes(r)}
            />${wi(r)}</label
          >`)}
    </fieldset>`}input(e){let t=Ai(this.values[e.name]);return e.type==="select"?o`<select name=${e.name} ?required=${e.required===!0} .value=${t}>
        <option value="" ?selected=${t===""}></option>
        ${(e.options??[]).map(i=>o`<option value=${i} ?selected=${i===t}>${i}</option>`)}
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
      step=${me(e.step??(e.type==="number"?"any":void 0))}
      ?required=${e.required===!0}
      .value=${t}
    />`}submit(e){e.preventDefault();let t=Li(this.fields,e.target,this.values);this.dispatchEvent(new CustomEvent("tk-save",{detail:t,bubbles:!0,composed:!0}))}render(){return o`<form
      @submit=${e=>{this.submit(e)}}
    >
      ${this.fields.map(e=>e.type==="weekdays"?this.weekdays(e):o`<label>${e.label} ${this.input(e)}</label>`)}
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      <button class="with-icon" type="submit" ?disabled=${this.busy}>
        ${it(this.submitIcon)}<span>${this.submitLabel}</span>
      </button>
    </form>`}};customElements.define("tk-form",nt);var Ss="tk-changed",y=$`
  ${ne}
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
`,ot="tk-chat";function oe(s,e){s.dispatchEvent(new CustomEvent(ot,{detail:e,bubbles:!0,composed:!0}))}var m=class extends _{constructor(){super();this.loads=0;this.api=void 0,this.error="",this.busy=!1,this.version=0,this.dialog=void 0,this.openHistories=new Set,this.addEventListener(Ss,t=>{t.composedPath()[0]!==this&&this.reload()})}static{this.properties={api:{attribute:!1},error:{state:!0},busy:{state:!0},version:{state:!0},dialog:{state:!0},openHistories:{state:!0}}}reloadOn(){return["api"]}willUpdate(t){this.reloadOn().some(i=>t.has(i))&&this.reload()}async reload(){let t=this.api;if(t===void 0)return;this.loads+=1;let i=this.loads;try{let r=await this.load(t);if(i!==this.loads)return;r(),this.error="",this.version+=1}catch(r){i===this.loads&&(this.error=G(r))}}async run(t){let i=this.api;if(i===void 0)return!1;this.busy=!0;try{return await t(i),this.error="",await this.reload(),!0}catch(r){return this.error=G(r),!1}finally{this.busy=!1}}changed(){this.dispatchEvent(new CustomEvent(Ss,{bubbles:!0,composed:!0}))}openDialog(t){this.error="",this.dialog=t}renderError(){return this.dialog===void 0&&this.error?o`<p class="error">${this.error}</p>`:d}formDialog(t){return this.dialog!==t.key?d:o`<tk-dialog
      class=${t.className}
      heading=${t.heading}
      @tk-dialog-closed=${()=>{this.dialog=void 0}}
    >
      <tk-form
        class=${t.className}
        .fields=${t.fields}
        .values=${t.values??{}}
        .submitLabel=${t.submitLabel??"Save"}
        .submitIcon=${t.submitIcon??He}
        .busy=${this.busy}
        .error=${this.error}
        @tk-save=${async i=>{await t.save(i.detail)&&(this.dialog=void 0)}}
      ></tk-form>
    </tk-dialog>`}historyButton(t,i){let r=`${t}/${i}`;return u({icon:gs,label:"History",className:"history",onClick:()=>{let n=new Set(this.openHistories);n.delete(r)||n.add(r),this.openHistories=n}})}historyPanel(t,i){return this.openHistories.has(`${t}/${i}`)?o`<tk-history
      .api=${this.api}
      .collection=${t}
      .recordId=${i}
      .stamp=${this.version}
    ></tk-history>`:d}historyDetails(t,i){return o`<div class="actions">${this.historyButton(t,i)}</div>
      ${this.historyPanel(t,i)}`}};var at="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z",Rs="/config/integrations/integration/tankkeeper";function Si(s){return s===void 0?Rs:`${Rs}#config_entry=${encodeURIComponent(s)}`}function lt(s){history.pushState(null,"",Si(s)),window.dispatchEvent(new CustomEvent("location-changed",{detail:{replace:!1}}))}function Ps(s){return u({icon:at,label:"TankKeeper settings",className:"settings",onClick:()=>{lt(s?.entryId)}})}function Ri(s,e){return s.type==="checkbox"&&typeof e=="boolean"?e?"Yes":"No":Array.isArray(e)?e.length===0?"Not set":e.map(String).join(", "):e==null||e===""?"Not set":typeof e=="string"||typeof e=="number"?String(e):JSON.stringify(e)}function B(s,e){let t=new Map(Object.entries(e));return o`<dl class="facts">
    ${s.map(i=>{let r=i.type==="textarea"?"wide":"";return o`<dt class=${r}>${i.label}</dt>
        <dd class="pre ${r}">${Ri(i,t.get(i.name))}</dd>`})}
  </dl>`}var Hs=Q(class extends F{constructor(s){if(super(s),s.type!==I.PROPERTY&&s.type!==I.ATTRIBUTE&&s.type!==I.BOOLEAN_ATTRIBUTE)throw Error("The `live` directive is not allowed on child or event bindings");if(!hs(s))throw Error("`live` bindings can only contain a single expression")}render(s){return s}update(s,[e]){if(e===T||e===d)return e;let t=s.element,i=s.name;if(s.type===I.PROPERTY){if(e===t[i])return T}else if(s.type===I.BOOLEAN_ATTRIBUTE){if(!!e===t.hasAttribute(i))return T}else if(s.type===I.ATTRIBUTE&&t.getAttribute(i)===e+"")return T;return te(s),e}});var Pi={panel:"Panel",mcp:"Claude (MCP)",assist:"Assist",notification:"Notification",rule:"Rule",review:"Review",camera:"Camera"};function Ns(s){return String(s).padStart(2,"0")}function De(s,e){let t=new Intl.DateTimeFormat("en-CA",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(s),i=r=>t.find(n=>n.type===r)?.value??"";return{day:`${i("year")}-${i("month")}-${i("day")}`,minutes:Number(i("hour"))*60+Number(i("minute"))}}function U(s,e){return De(s,e).day}function A(s,e){let[t=0,i=1,r=1]=s.split("-").map(Number);return new Date(Date.UTC(t,i-1,r+e)).toISOString().slice(0,10)}function x(s){let e=new Date(s);return`${U(e)} ${Ns(e.getHours())}:${Ns(e.getMinutes())}`}var ct=6e4,pt=60*ct,Ne=24*pt;function Ms(s,e=new Date){let t=new Date(s),i=e.getTime()-t.getTime();return i<ct?"just now":i<pt?`${String(Math.floor(i/ct))} min ago`:i<Ne?`${String(Math.floor(i/pt))} h ago`:i<2*Ne?"yesterday":i<7*Ne?`${String(Math.floor(i/Ne))} days ago`:U(t)}function P(s){return Pi[s]??s}function Ds(s){return typeof s=="string"?s:JSON.stringify(s)}function L(s){if(s.before===null)return`Added to ${s.collection}`;if(s.after===null)return`Removed from ${s.collection}`;let{before:e,after:t}=s,r=Object.keys(t).filter(n=>JSON.stringify(e[n])!==JSON.stringify(t[n])).map(n=>`${n} ${Ds(e[n])} \u2192 ${Ds(t[n])}`);return`${s.collection}: ${r.join(", ")}`}function dt(s,...e){let t=e.filter(i=>typeof i=="string"&&i!=="");return[s,...t].join(". ")}function Is(s){if(s.kind==="dose")return dt(`Dose: ${s.product??""} ${String(s.amount_ml??0)} ml`,s.why,s.notes);if(s.kind==="test"){let t=Object.entries(s.values??{}).map(([r,n])=>`${r} ${String(n)}`).join(", "),i=s.source==="tap"?"Tap":"Tank";return dt(`${i} test: ${t}`,s.notes)}let e=[...s.tasks??[]];return typeof s.water_change_percent=="number"&&e.push(`${String(s.water_change_percent)}% water change`),typeof s.water_litres=="number"&&e.push(`${String(s.water_litres)} l water`),dt(e.join(". "),s.why,s.notes)}var Hi=["ammonia","nitrite","nitrate","phosphate","ph","kh","gh","temperature_c","cycle","light"];var Ni="tankkeeper:photo/",Di=/^tankkeeper:photo\/[0-9A-HJKMNP-TV-Z]{26}$/,Mi=/^tankkeeper:chart\/([a-z_]+)(?:\?days=(\d+))?$/;function Ii(s){return Hi.includes(s)}function ge(s){if(Di.test(s))return{kind:"photo",id:s.slice(Ni.length)};let e=Mi.exec(s),t=e?.[1]??"";if(e===null||!Ii(t))return;let i=t==="light"?30:365,r=e[2]===void 0?30:Number(e[2]);return{kind:"chart",chart:t,days:Math.min(i,Math.max(1,r))}}var Os=1440,H=320,fe=160,S=24,gt={ammonia:"var(--warning-color, #f4b400)",nitrite:"var(--error-color, #db4437)",nitrate:"var(--info-color, #4285f4)",ph:"var(--primary-color, #03a9f4)",kh:"var(--success-color, #43a047)",gh:"var(--accent-color, #ff9800)",phosphate:"var(--state-icon-color, #44739e)",temperature_c:"var(--error-color, #db4437)"},Oi=gt.ammonia,Vi=gt.nitrite,Vs="var(--secondary-text-color, #727272)",ft={ammonia:"Ammonia (ppm)",nitrite:"Nitrite (ppm)",nitrate:"Nitrate (mg/l)",ph:"pH",kh:"KH (dKH)",gh:"GH (dGH)",phosphate:"Phosphate (mg/l)",temperature_c:"Temperature (\xB0C)"},Ui=["ammonia","nitrite","nitrate","ph","kh","gh","phosphate","temperature_c"];function Me(s,e,t,i){let r=s.filter(n=>n.kind==="test"&&(n.source==="tap"?"tap":"tank")===i&&typeof n.values?.[e]=="number").map(n=>({time:Date.parse(n.time),value:n.values?.[e]??0})).sort((n,a)=>n.time-a.time);return{name:t,colour:gt[e],joined:i==="tank",points:r}}var ht=.1;function Fs(s,e){let t=[...s.flatMap(a=>a.points.map(c=>c.value)),...e.map(a=>a.value)];if(t.length===0)return{series:s,lines:e,min:0,max:1};let i=Math.min(...t),r=Math.max(...t),n=r>i?(r-i)*ht:Math.abs(r)*ht||ht;return{series:s,lines:e,min:Math.max(0,i-n),max:r+n}}function Us(s){return String(Number(s.toFixed(2)))}function ut(s){return s.flatMap(([e,t,i])=>typeof t=="number"?[{label:e,value:t,colour:i}]:[])}function mt(s,e,t){return ut([["Watch",s[e],Oi],["Act",s[t],Vi]])}function Ie(s,e){let t=[["ammonia","Ammonia"],["nitrite","Nitrite"],["nitrate","Nitrate"]];return Fs([...t.map(([i,r])=>Me(s,i,r,"tank")),...t.map(([i,r])=>Me(s,i,`Tap ${r.toLowerCase()}`,"tap"))],mt(e,"nitrogen_watch","nitrogen_act"))}function Fi(s,e,t,i){let r=n=>ut([["Tap water",i?.[n],Vs]]);switch(s){case"ammonia":case"nitrite":return mt(e,"nitrogen_watch","nitrogen_act");case"ph":return[...mt(e,"ph_watch","ph_act"),...r("ph")];case"temperature_c":return ut([["Target",t,Vs]]);default:return r(s)}}function vt(s,e,t,i,r){let n=[Me(s,e,"Tank","tank"),Me(s,e,"Tap","tap")];return{key:e,label:ft[e],chart:Fs(n,Fi(e,t,i,r))}}function js(s,e,t,i){let r=[],n=[];for(let a of Ui){let c=vt(s,a,e,t,i);c.chart.series.every(l=>l.points.length===0)?n.push(c.label):r.push(c)}return{charts:r,empty:n}}function ve(s,e){let t=s.series.flatMap(l=>l.points.map(h=>h.time));if(t.length===0)return o`<p class="empty">No readings yet</p>`;let i=Math.min(...t),r=Math.max(...t)-i,n=s.max-s.min||1,a=l=>r===0?H/2:S+(l-i)/r*(H-2*S),c=l=>fe-S-(l-s.min)/n*(fe-2*S);return o`
    <svg viewBox="0 0 ${H} ${fe}" role="img" aria-label=${e} class="chart">
      <line class="axis" x1=${S} y1=${fe-S} x2=${H-S} y2=${fe-S}></line>
      <text class="tick" x="2" y=${c(s.max)+4}>${Us(s.max)}</text>
      <text class="tick" x="2" y=${c(s.min)+4}>${Us(s.min)}</text>
      ${s.lines.map(l=>R`<line class="target" x1=${S} x2=${H-S} y1=${c(l.value)} y2=${c(l.value)}
            stroke=${l.colour}><title>${l.label} ${l.value}</title></line>
            <text class="line-label" x=${H-S} y=${c(l.value)-2} text-anchor="end"
              fill=${l.colour}>${l.label} ${l.value}</text>`)}
      ${s.series.filter(l=>l.points.length>0).map(l=>R`
          ${l.joined?R`<polyline fill="none" stroke=${l.colour}
                  points=${l.points.map(h=>`${String(a(h.time))},${String(c(h.value))}`).join(" ")}>
                </polyline>`:d}
          ${l.points.map(h=>R`<circle class=${l.joined?"solid":"hollow"} cx=${a(h.time)} cy=${c(h.value)} r="3"
                stroke=${l.colour} fill=${l.joined?l.colour:"none"}>
                <title>${l.name} ${h.value}</title></circle>`)}`)}
    </svg>
    <ul class="legend">
      ${s.series.filter(l=>l.points.length>0).map(l=>o`<li>
              ${l.joined?o`<span class="swatch" style="background:${l.colour}"></span>`:o`<span class="swatch hollow" style="border-color:${l.colour}"></span>`}${l.name}
            </li>`)}
      ${s.lines.map(l=>o`<li><span class="dash" style="border-color:${l.colour}"></span>${l.label}</li>`)}
    </ul>
  `}function Oe(s,e,t,i){let r=[];for(let n=t-1;n>=0;n--)r.push({day:A(e,-n),segments:[]});for(let[n,a]of s){let c=De(new Date(n),i),l=De(new Date(a),i);for(let h of r){let v=c.day===h.day?c.minutes/Os:c.day<h.day?0:null,p=l.day===h.day?l.minutes/Os:l.day>h.day?1:null;v!==null&&p!==null&&p>v&&h.segments.push({start:v,end:p})}}return r}function Ve(s){let t=s.length*6;return R`
    <svg viewBox="0 0 ${H} ${t}" role="img" class="chart light"
      aria-label=${`Light on and off, last ${String(s.length)} days`}>
      ${s.map((i,r)=>R`
          <rect class="off" x="0" y=${r*6} width=${H} height=${5}></rect>
          ${i.segments.map(n=>R`<rect class="on" x=${n.start*H} y=${r*6}
                width=${(n.end-n.start)*H} height=${5}>
                <title>${i.day}</title></rect>`)}`)}
    </svg>`}var Bs=500,ji="The photo is no longer kept.";function Bi(s,e){let t=s.photo_url;return t!==null&&s.id===e&&t.startsWith(`/api/tankkeeper/photos/${e}?`)?t:void 0}var Ks=new WeakMap;function ye(s,e,t){let i=Ks.get(s);i===void 0&&(i=new Map,Ks.set(s,i));let r=JSON.stringify([e,t]),n=i.get(r);if(n!==void 0)return n;let a=i,c=s.call(e,t).finally(()=>a.delete(r));return a.set(r,c),c}async function Ki(s,e){let t=[],i=new Set,r;for(;;){let n={kind:"test",since:e,...r===void 0?{}:{until:r},limit:Bs},a=(await ye(s,"get_log",n)).entries,c=a.filter(l=>!i.has(l.id));for(let l of c)i.add(l.id),t.push(l),r=l.time;if(a.length<Bs||c.length===0)return t}}var qs={...ft,cycle:"Cycle",light:"Light"},yt=class extends m{static{this.properties={...m.properties,address:{type:String},alt:{type:String},shown:{state:!0},large:{state:!0}}}static{this.styles=[y,$`
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
    `]}constructor(){super(),this.address="",this.alt="",this.shown=void 0,this.large=!1}reloadOn(){return["api","address"]}async load(e){let t=ge(this.address),i=t===void 0?void 0:await this.fetch(e,t);return()=>{this.shown=i}}async fetch(e,t){if(t.kind==="photo"){let p=await ye(e,"get_photo_check",{check_id:t.id}).catch(g=>{if(!Pe(g))throw g});return{kind:"photo",url:p===void 0?void 0:Bi(p,t.id)}}let{chart:i,days:r}=t;if(i==="light"){let p=await ye(e,"get_light",{days:r});return{kind:"light",lights:p.lights.map(f=>({model:f.model,rows:Oe(f.on_periods,p.today,r,e.timeZone)}))}}let n=A(U(new Date,e.timeZone),-r),[a,c]=await Promise.all([Ki(e,n),ye(e,"get_status")]),l=qs[i];if(i==="cycle")return{kind:"chart",chart:Ie(a,c.settings),label:l};let h=await ye(e,"get_tank");return{kind:"chart",chart:vt(a,i,c.settings,h.tank.temperature_c,h.water).chart,label:l}}caption(e){return this.alt!==""?this.alt:e.kind==="photo"?"The tank":`${qs[e.chart]}, last ${String(e.days)} days`}open(){this.large=!0,this.updateComplete.then(()=>this.renderRoot.querySelector(".large")?.focus())}close(){this.large=!1,this.updateComplete.then(()=>this.renderRoot.querySelector("button.photo")?.focus())}keydown(e){e.key==="Tab"&&e.preventDefault(),e.key==="Escape"&&this.close()}renderPhoto(e,t){return e===void 0?o`<p class="muted">${ji}</p>`:o`<button
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
              @keydown=${i=>{this.keydown(i)}}
            >
              <img src=${e} alt=${t} />
            </div>`:d}`}renderShown(e,t){return e.kind==="photo"?this.renderPhoto(e.url,t):e.kind==="chart"?ve(e.chart,e.label):e.lights.length===0?o`<p class="muted">No lights yet</p>`:o`${e.lights.map(i=>o`<div class="muted">${i.model}</div>
          ${Ve(i.rows)}`)}`}render(){let e=ge(this.address);if(e===void 0)return o`![${this.alt}](${this.address})`;let t=this.caption(e),i=this.shown;return o`<figure>
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      ${i===void 0?d:this.renderShown(i,t)}
      <figcaption>${t}</figcaption>
    </figure>`}};customElements.define("tk-embed",yt);function Ue(s,e){return o`${Wi(s.split(`
`),{api:e,left:5})}`}var $t=/^\s*```/,Ws=/^(#{1,6})\s+(.*)$/,bt=/^\s*[-*]\s+(.*)$/,kt=/^\s*\d+[.)]\s+(.*)$/,zi=/`([^`]+)`|!\[([^\]]*)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|(?<![\w*])\*([^*\s](?:[^*]*[^*\s])?)\*(?![\w*])|(?<!\w)_([^_\s](?:[^_]*[^_\s])?)_(?!\w)/g;function Wi(s,e){let t=[],i=0,r=n=>{let a=[];for(let c=n.exec(s[i]??"");c!==null;)a.push(c[1]??""),i+=1,c=n.exec(s[i]??"");return a};for(;i<s.length;){let n=s[i]??"",a=Ws.exec(n);if($t.test(n)){let c=s.findIndex((h,v)=>v>i&&$t.test(h)),l=c===-1?s.length:c;t.push(o`<pre><code>${s.slice(i+1,l).join(`
`)}</code></pre>`),i=l+1}else if(a!==null){let c=ae(a[2]??"",e);t.push((a[1]??"").length<=2?o`<h3>${c}</h3>`:o`<h4>${c}</h4>`),i+=1}else if(bt.test(n)){let c=r(bt).map(l=>zs(l,e));t.push(o`<ul>
          ${c}
        </ul>`)}else if(kt.test(n)){let c=r(kt).map(l=>zs(l,e));t.push(o`<ol>
          ${c}
        </ol>`)}else if(n.trim()==="")i+=1;else{let c=[];for(;i<s.length&&Zi(s[i]??"");)c.push(s[i]??""),i+=1;let l=c.map((h,v)=>o`${v>0?o`<br />`:d}${ae(h,e)}`);t.push(o`<p>${l}</p>`)}}return t}function zs(s,e){return o`<li>${ae(s,e)}</li>`}function Zi(s){return s.trim()!==""&&!$t.test(s)&&!Ws.test(s)&&!bt.test(s)&&!kt.test(s)}function ae(s,e){let t=[],i=0;for(let r of s.matchAll(zi)){r.index>i&&t.push(s.slice(i,r.index));let[n,a,c,,l,h,v,p,g]=r;a!==void 0?t.push(o`<code>${a}</code>`):c!==void 0?t.push(Gi(c,n,e)):l!==void 0?t.push(o`<strong>${ae(l,e)}</strong>`):h!==void 0?t.push(Zs(h,v??"",n,e)):t.push(o`<em>${ae(p??g??"",e)}</em>`),i=r.index+n.length}return i<s.length&&t.push(s.slice(i)),t}function Zs(s,e,t,i){return/^https?:\/\//i.test(e)?o`<a href=${e} target="_blank" rel="noopener noreferrer"
    >${ae(s,i)}</a
  >`:t}function Gi(s,e,t){let i=e.slice(s.length+4,-1),{api:r}=t;return r===void 0||t.left===0||ge(i)===void 0?s===""?e:o`!${Zs(s,i,e.slice(1),t)}`:(t.left-=1,o`<tk-embed .api=${r} .address=${i} .alt=${s}></tk-embed>`)}var Gs=(s,e,t)=>{let i=new Map;for(let r=e;r<=t;r++)i.set(s[r],r);return i},C=Q(class extends F{constructor(s){if(super(s),s.type!==I.CHILD)throw Error("repeat() can only be used in text expressions")}dt(s,e,t){let i;t===void 0?t=e:e!==void 0&&(i=e);let r=[],n=[],a=0;for(let c of s)r[a]=i?i(c,a):a,n[a]=t(c,a),a++;return{values:n,keys:r}}render(s,e,t){return this.dt(s,e,t).values}update(s,[e,t,i]){let r=us(s),{values:n,keys:a}=this.dt(e,t,i);if(!Array.isArray(r))return this.ut=a,n;let c=this.ut??=[],l=[],h,v,p=0,g=r.length-1,f=0,w=n.length-1;for(;p<=g&&f<=w;)if(r[p]===null)p++;else if(r[g]===null)g--;else if(c[p]===a[f])l[f]=j(r[p],n[f]),p++,f++;else if(c[g]===a[w])l[w]=j(r[g],n[w]),g--,w--;else if(c[p]===a[w])l[w]=j(r[p],n[w]),ee(s,l[w+1],r[p]),p++,w--;else if(c[g]===a[f])l[f]=j(r[g],n[f]),ee(s,r[p],r[g]),g--,f++;else if(h===void 0&&(h=Gs(a,f,w),v=Gs(c,p,g)),h.has(c[p]))if(h.has(c[g])){let N=v.get(a[f]),Be=N!==void 0?r[N]:null;if(Be===null){let Kt=ee(s,r[p]);j(Kt,n[f]),l[f]=Kt}else l[f]=j(Be,n[f]),ee(s,r[p],Be),r[N]=null;f++}else Se(r[g]),g--;else Se(r[p]),p++;for(;f<=w;){let N=ee(s,l[w+1]);j(N,n[f]),l[f++]=N}for(;p<=g;){let N=r[p++];N!==null&&Se(N)}return this.ut=a,te(s,l),T}});function Fe(s){let e=Array.from(s.snippet),t=(i,r)=>e.slice(i,r).join("");return o`<span class="snippet pre"
    >${t(0,s.start)}<mark>${t(s.start,s.end)}</mark>${t(s.end)}</span
  >`}var $e="tk-conversation-deleted";function Ys(s,e,t){return`${String(s)} ${s===1?e:t}`}var xt=class extends _{static{this.properties={api:{attribute:!1},conversationId:{attribute:!1},disabled:{attribute:!1},asked:{state:!0},error:{state:!0},busy:{state:!0}}}static{this.styles=[y,$`
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
    `]}constructor(){super(),this.api=void 0,this.conversationId="",this.disabled=!1,this.asked=void 0,this.error="",this.busy=!1}async attempt(e){let t=this.api;if(t!==void 0){this.busy=!0,this.error="";try{await e(t)}catch(i){this.asked=void 0,this.error=G(i)}finally{this.busy=!1}}}async ask(){await this.attempt(async e=>{this.asked=await e.call("delete_conversation",{id:this.conversationId})}),await this.focusOn("button.cancel")}async confirm(e){let t=this.conversationId;await this.attempt(async i=>{await i.call("delete_conversation",{id:t,code:e}),this.asked=void 0,this.dispatchEvent(new CustomEvent($e,{detail:t,bubbles:!0,composed:!0}))})}async cancel(){this.asked=void 0,await this.focusOn("ha-icon-button.delete")}async focusOn(e){await this.updateComplete,this.shadowRoot?.querySelector(e)?.focus()}renderAsked(e){let t=e.messages===1?"goes":"go",i=e.changes===1?"stays":"stay";return o`<div class="confirm" role="alertdialog" aria-labelledby="ask">
      <p id="ask" class="pre">
        Delete "${e.name}"? Its ${Ys(e.messages,"message","messages")} ${t}. The
        ${Ys(e.changes,"change","changes")} made in it ${i} in the history, and Undo
        still works.
      </p>
      <div class="row">
        ${b({icon:E,label:"Cancel",className:"cancel",disabled:this.busy,onClick:()=>{this.cancel()}})}
        ${b({icon:Y,label:"Delete conversation",className:"confirm confirm-delete",disabled:this.disabled||this.busy,onClick:()=>{this.confirm(e.code)}})}
      </div>
    </div>`}render(){return o`${u({icon:Y,label:"Delete",className:"delete",disabled:this.disabled||this.busy||this.asked!==void 0,onClick:()=>{this.ask()}})}
    ${this.asked===void 0?d:this.renderAsked(this.asked)}
    ${this.error?o`<p class="error">${this.error}</p>`:d}`}};customElements.define("tk-delete-conversation",xt);var Xs=50,be="panel_",Yi="tk-open-chat",wt=class extends m{static{this.properties={...m.properties,active:{attribute:!1},stamp:{attribute:!1},locked:{attribute:!1},conversations:{state:!0},query:{state:!0},renaming:{state:!0},draftTitle:{state:!0}}}static{this.styles=[y,$`
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
    `]}constructor(){super(),this.active="",this.stamp=0,this.locked="",this.conversations=void 0,this.query="",this.renaming=void 0,this.draftTitle="",this.addEventListener($e,()=>{this.reload()})}reloadOn(){return["api","query","stamp"]}async load(e){let t=this.query===""?await e.call("list_conversations",{limit:Xs}):await e.call("search_conversations",{query:this.query,limit:Xs});return()=>{this.conversations=t.conversations}}search(e){e.preventDefault();let t=e.target.querySelector("input");this.query=(t?.value??"").trim()}open(e){let t=e.match?.index??null;this.dispatchEvent(new CustomEvent(Yi,{detail:{id:e.id,index:t},bubbles:!0,composed:!0}))}async startRename(e){this.renaming=e.id,this.draftTitle=e.title,this.error="",await this.updateComplete,this.shadowRoot?.querySelector("input.title")?.focus()}async rename(e,t){e.preventDefault();let i=this.draftTitle.trim();if(i===""){this.renaming=void 0;return}await this.run(n=>n.call("rename_conversation",{id:t,title:i}))&&(this.renaming=void 0)}renderName(e){if(this.renaming===e.id)return o`<form
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
      </form>`;let t=!e.id.startsWith(be),i=Ms(e.updated);return o`<button
      class="open"
      aria-current=${e.id===this.active?"true":"false"}
      @click=${()=>{this.open(e)}}
    >
      <span class="name">${e.name}</span>
      <span class="muted"
        >${t?`${i} \xB7 ${P(e.source)}, read only`:i}</span
      >
      ${e.match===void 0?d:Fe(e.match)}
    </button>`}renderItem(e){return o`<li
      data-id=${e.id}
      class=${e.id===this.active?"active":""}
    >
      ${this.renderName(e)}
      <div class="row actions">
        ${u({icon:_s,label:"Rename",className:"rename",disabled:this.busy,onClick:()=>{this.startRename(e)}})}
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
      </ul>`}};customElements.define("tk-chat-list",wt);var Xi="TankKeeper's Assist agent is missing. Reload TankKeeper to add it.",Ji="Choose the conversation agent the chat uses in TankKeeper's settings.",je=200,Js=200,Qi=new Set(["user","assistant","error"]);function Qs(){return`panel_${[...crypto.getRandomValues(new Uint8Array(16))].map(e=>e.toString(16).padStart(2,"0")).join("")}`}function _t(s){return s.length<=Js?s:`${s.slice(0,Js-1)}\u2026`}async function er(s,e){let{kind:t,id:i}=e;if(t==="proposal"){let r=await s.call("list_proposals",{state:"all",limit:je}).then(n=>n.proposals.find(a=>a.proposal_id===i)).catch(()=>{});return r===void 0?`Let's discuss the waiting change ${i}.`:`Let's discuss the waiting change "${_t(r.summary)}" (proposal ${i}).`}if(t==="photo"){let r=await s.call("list_photos",{limit:je}).then(n=>n.photos.find(a=>a.id===i)?.summary).catch(()=>{});return r==null?`Let's discuss photo check ${i}.`:`Let's discuss what the camera saw: "${_t(r)}" (photo check ${i}).`}if(t==="review"){let r=await s.call("get_reviews",{limit:je}).then(n=>n.reviews.find(a=>a.id===i)).catch(()=>{});return r===void 0?`Let's discuss review ${i}.`:`Let's discuss the review "${_t(r.result)}" (review ${i}).`}return"Let's discuss the tank's status now."}var Ct=class extends m{constructor(){super();this.scrollToFound=!1;this.conversationId=Qs();this.recorded=!1;this.resuming=!1;this.begun=0;this.start=void 0,this.agent=void 0,this.messages=[],this.draft="",this.sending=!1,this.changes=[],this.proposals=[],this.readOnly=!1,this.listOpen=!1,this.found=null}static{this.properties={...m.properties,start:{attribute:!1},agent:{state:!0},messages:{state:!0},draft:{state:!0},sending:{state:!0},changes:{state:!0},proposals:{state:!0},readOnly:{state:!0},listOpen:{state:!0},found:{state:!0}}}static{this.styles=[y,$`
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
    `]}reloadOn(){return["api","start"]}willUpdate(t){t.has("start")&&this.begin(this.start),super.willUpdate(t)}begin(t){this.begun+=1;let i=t?.kind==="resume";this.conversationId=i?t.id:Qs(),this.recorded=i,this.resuming=i,this.readOnly=i&&!t.id.startsWith(be),this.found=null,this.scrollToFound=!1,this.messages=[],this.draft="",this.sending=!1,this.changes=[],this.proposals=[],this.error="";let r=this.api;if(t===void 0||i||r===void 0)return;let n=this.begun;er(r,t).then(a=>{n===this.begun&&this.draft===""&&(this.draft=a)})}async load(t){let i=this.conversationId,[r,n,a]=await Promise.all([t.chatAgent(),t.call("list_proposals",{state:"pending",limit:je}),this.recorded?this.saved(t,i):void 0]);return()=>{if(this.agent=r,a===null){this.begin(void 0);return}this.proposals=n.proposals.filter(c=>c.conversation_id===i),this.changes=a?.changes??[],this.resuming&&a!==void 0&&(this.resuming=!1,this.messages=a.messages.map((c,l)=>({...c,index:l})).filter(c=>Qi.has(c.role)),this.messages.some(c=>c.index===this.found)||(this.found=null,this.scrollToFound=!1))}}async saved(t,i){try{return await t.call("get_conversation",{id:i})}catch(r){if(!this.resuming&&Pe(r))return null;throw r}}connectedCallback(){super.connectedCallback(),this.hasUpdated&&this.reload()}ready(){let t=this.agent;return t?.ready===!0&&t.agent_id!==null?t.agent_id:void 0}missing(){return this.agent?.ready===!0?Xi:Ji}async send(){let t=this.api,i=this.ready(),r=this.draft.trim();if(t===void 0||i===void 0||r===""||this.sending)return;let n=this.begun;this.messages=[...this.messages,{role:"user",text:r}],this.draft="",this.sending=!0;let a;try{let c=await t.converse(r,this.conversationId,i);if(n!==this.begun)return;this.conversationId=c.conversation_id??this.conversationId,this.recorded=!0;let l=c.response.speech?.plain?.speech??"";a={role:c.response.response_type==="error"?"error":"assistant",text:l}}catch(c){if(n!==this.begun)return;a={role:"error",text:G(c)}}this.messages=[...this.messages,a],this.sending=!1,await this.reload()}newChat(){this.begin(void 0),this.reload()}open(t){this.begin({kind:"resume",id:t.id}),this.found=t.index,this.scrollToFound=t.index!==null,this.listOpen=!1,this.reload()}deleted(t){t===this.conversationId&&this.newChat()}updated(t){if(super.updated(t),!this.scrollToFound)return;let i=this.shadowRoot?.querySelector(".message.found");i!=null&&(this.scrollToFound=!1,i.scrollIntoView({block:"center"}))}async act(t){await this.run(t)&&this.changed()}keydown(t){t.key!=="Enter"||t.shiftKey||t.isComposing||(t.preventDefault(),this.send())}renderMessage(t){let i=t.index!==void 0&&t.index===this.found;return o`<div
      class="message ${t.role}${i?" found":""}"
      data-index=${t.index??d}
    >
      ${t.role==="assistant"?Ue(t.text,this.api):o`<div class="pre">${t.text}</div>`}
    </div>`}renderLinked(){return o`${this.changes.length===0?d:o`<h3>Changes made in this chat</h3>
            <ul class="changes">
              ${this.changes.map(t=>o`<li>
                    <div class="row">
                      <span class="grow">${t.summary}</span>
                      ${u({icon:ie,label:"Undo",className:"undo",disabled:this.busy,onClick:()=>{this.act(i=>i.call("undo_change",{history_id:t.id}))}})}
                    </div>
                    <div class="muted">${x(t.time)}</div>
                    ${t.changes.map(i=>o`<div class="muted">${L(i)}</div>`)}
                  </li>`)}
            </ul>`}
    ${this.proposals.length===0?d:o`<h3>Waiting for you</h3>
            <ul class="waiting">
              ${this.proposals.map(t=>o`<li data-id=${t.proposal_id}>
                    <strong class="pre">${t.summary}</strong>
                    <div class="pre">${t.reason}</div>
                    ${t.changes.map(i=>o`<div class="muted">${L(i)}</div>`)}
                    <div class="actions">
                      ${u({icon:E,label:"Reject",className:"reject",disabled:this.busy,onClick:()=>{this.act(i=>i.reject(t.proposal_id))}})}
                      ${u({icon:V,label:"Accept",className:"accept",disabled:this.busy,onClick:()=>{this.act(i=>i.accept(t.proposal_id))}})}
                    </div>
                  </li>`)}
            </ul>`}`}renderAgent(t){let i=this.agent;return i===void 0?d:t?o`<p class="muted agent">
        Chatting through ${i.chat_agent_name??i.chat_agent}
      </p>`:o`<div class="row missing">
      <span class="grow muted">${this.missing()}</span>
      ${b({icon:at,label:"Open settings",className:"open-settings",onClick:()=>{lt(this.api?.entryId)}})}
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
        .value=${Hs(this.draft)}
        ?disabled=${this.sending}
        @input=${t=>{this.draft=t.target.value}}
        @keydown=${t=>{this.keydown(t)}}
      ></textarea>
      <div class="row">
        <span class="grow muted">Enter sends, Shift+Enter adds a line.</span>
        ${b({icon:$s,label:"Send",className:"send",primary:!0,type:"submit",disabled:this.sending})}
      </div>
    </form>`}render(){let t=this.ready()!==void 0;return o`<div class="layout">
      <aside id="chat-list" class="list card ${this.listOpen?"open":""}">
        <h2>Chats</h2>
        <tk-chat-list
          .api=${this.api}
          .active=${this.conversationId}
          .stamp=${this.version}
          .locked=${this.sending?this.conversationId:""}
          @tk-open-chat=${i=>{this.open(i.detail)}}
          @tk-conversation-deleted=${i=>{this.deleted(i.detail)}}
        ></tk-chat-list>
      </aside>
      <section>
        <div class="row">
          <h2 class="grow">Chat</h2>
          ${b({icon:ys,label:"Chats",className:"chats",controls:"chat-list",expanded:this.listOpen,onClick:()=>{this.listOpen=!this.listOpen}})}
          ${t?b({icon:vs,label:"New chat",className:"new",disabled:this.sending,onClick:()=>{this.newChat()}}):d}
        </div>
        ${this.error?o`<p class="error">${this.error}</p>`:d}
        ${this.renderAgent(t)} ${this.renderMessages()}
        ${this.readOnly?o`<p class="muted read-only">
                Read only. Only chats started here in the panel can go on. Start a New chat to ask
                more.
              </p>`:t?this.renderComposer():d}
        ${this.renderLinked()}
      </section>
    </div>`}};customElements.define("tk-chat",Ct);var At=class extends m{constructor(){super();this.details=null;this.toggled=()=>{this.details?.open===!0&&this.reload()};this.collection="",this.recordId=void 0,this.stamp=0,this.entries=void 0}static{this.properties={...m.properties,collection:{attribute:!1},recordId:{attribute:!1},stamp:{attribute:!1},entries:{state:!0}}}static{this.styles=y}connectedCallback(){super.connectedCallback(),this.details=this.closest("details"),this.details?.addEventListener("toggle",this.toggled)}disconnectedCallback(){super.disconnectedCallback(),this.details?.removeEventListener("toggle",this.toggled),this.details=null}async reload(){this.details!==null&&!this.details.open||await super.reload()}reloadOn(){return["api","collection","recordId","stamp"]}async load(t){let i={collection:this.collection,limit:10};this.recordId!==void 0&&(i.record_id=this.recordId);let{history:r}=await t.call("get_history",i);return()=>{this.entries=r}}async undo(t){await this.run(i=>i.call("undo_change",{history_id:t.id}))&&this.changed()}render(){return this.entries===void 0?d:o`
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      ${this.entries.length===0?o`<p class="muted">No changes yet</p>`:d}
      <ul>
        ${this.entries.map(t=>o`<li class="row">
              <div class="grow">
                <div>${t.summary}</div>
                <div class="muted when">
                  ${x(t.time)} ·
                  ${P(t.source)}${typeof t.conversation_name=="string"?` \xB7 in ${t.conversation_name}`:d}
                </div>
                ${t.changes.map(i=>o`<div class="muted">${L(i)}</div>`)}
              </div>
              ${u({icon:ie,label:"Undo",className:"undo",disabled:this.busy,onClick:()=>{this.undo(t)}})}
            </li>`)}
      </ul>
    `}};customElements.define("tk-history",At);var tr=[{name:"agent",label:"Conversation agent TankKeeper chats through",type:"text"},{name:"chat_agent",label:"Conversation agent the chat uses",type:"text"},{name:"ai_task",label:"AI task entity for review comments",type:"text"},{name:"review_on",label:"Review after",type:"list"},{name:"comments",label:"Claude comments on reviews",type:"checkbox"},{name:"daily_time",label:"Daily review at",type:"time"},{name:"daily_cap",label:"Claude comments a day, at most",type:"number"}],sr=20,ir={test:"Test",task:"Task",status:"Status change",daily:"Daily"};function rr(s){let e=s.triggers.map(i=>ir[i]??i).join(", "),t=s.proposal_ids.length;return o`<li class="review">
    <div class="muted">${x(s.time)} · ${e}</div>
    <div>${s.result}</div>
    ${s.comment===null?d:o`<div class="comment">Claude: ${s.comment}</div>`}
    ${s.note===null?d:o`<div class="muted">${s.note}</div>`}
    ${t===0?d:o`<div class="muted">
            ${t} plan ${t===1?"change":"changes"} proposed
          </div>`}
  </li>`}var Tt=class extends m{static{this.properties={...m.properties,settings:{state:!0},reviews:{state:!0}}}static{this.styles=y}constructor(){super(),this.settings=void 0,this.reviews=[]}async load(e){let[t,i]=await Promise.all([e.call("get_claude"),e.call("get_reviews",{limit:sr})]);return()=>{this.settings=t,this.reviews=i.reviews}}render(){let e=this.settings;return o`<section>
      <h2>Claude</h2>
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      ${e===void 0?d:o`<p class="muted note">${e.model_note}</p>
              ${B(tr,e)} ${this.historyDetails("settings","claude")}`}
      <h3>Reviews</h3>
      ${this.reviews.length===0?o`<p class="muted">No reviews yet.</p>`:o`<ul class="reviews">
              ${this.reviews.map(rr)}
            </ul>`}
    </section>`}};customElements.define("tk-claude",Tt);var ei=50,Et=class extends m{static{this.properties={...m.properties,conversations:{state:!0},query:{state:!0},selected:{state:!0},detail:{state:!0}}}static{this.styles=y}constructor(){super(),this.conversations=[],this.query="",this.selected=void 0,this.detail=void 0,this.addEventListener($e,()=>{this.selected=void 0})}reloadOn(){return["api","query","selected"]}async load(e){let t=this.selected;if(t!==void 0){let r=await e.call("get_conversation",{id:t});return()=>{this.detail=r}}let i=this.query===""?await e.call("list_conversations",{limit:ei}):await e.call("search_conversations",{query:this.query,limit:ei});return()=>{this.detail=void 0,this.conversations=i.conversations}}search(e){e.preventDefault();let t=e.target.querySelector("input");this.query=(t?.value??"").trim()}async undo(e){await this.run(t=>t.call("undo_change",{history_id:e.id}))&&this.changed()}renderDetail(e){return o`<section>
      <div class="row">
        ${b({icon:ks,label:"Back",className:"back",onClick:()=>this.selected=void 0})}
        <h2 class="grow">${e.name}</h2>
        ${e.id.startsWith(be)?b({icon:re,label:"Continue in Chat",className:"resume",onClick:()=>{oe(this,{kind:"resume",id:e.id})}}):d}
        <tk-delete-conversation
          .api=${this.api}
          .conversationId=${e.id}
        ></tk-delete-conversation>
      </div>
      <div class="muted">${P(e.source)} · ${x(e.started)}</div>
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      <p class="pre">${e.summary}</p>
      <h3>Messages</h3>
      <ul>
        ${e.messages.map(t=>o`<li class=${t.role}>
              <div class="role muted">${t.role}</div>
              ${t.role==="assistant"?Ue(t.text,this.api):o`<div class="pre">${t.text}</div>`}
            </li>`)}
      </ul>
      <h3>Changes</h3>
      ${e.changes.length===0?o`<p class="muted">No changes</p>`:d}
      <ul>
        ${e.changes.map(t=>o`<li>
              <div class="row">
                <span class="grow">${t.summary}</span>
                ${u({icon:ie,label:"Undo",className:"undo",disabled:this.busy,onClick:()=>{this.undo(t)}})}
              </div>
              <div class="muted">${x(t.time)} · ${P(t.source)}</div>
              ${t.changes.map(i=>o`<div class="muted">${L(i)}</div>`)}
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
        ${b({icon:xs,label:"Search",className:"search",type:"submit"})}
      </form>
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      ${this.conversations.length===0?o`<p class="muted">No conversations</p>`:d}
      <ul>
        ${C(this.conversations,e=>e.id,e=>o`<li data-id=${e.id}>
              <div class="row">
                <strong class="grow">${e.name}</strong>
                ${u({icon:ws,label:"Open",className:"open",onClick:()=>this.selected=e.id})}
              </div>
              <div class="muted">
                ${P(e.source)} · ${x(e.updated)}
              </div>
              ${e.match===void 0?d:Fe(e.match)}
              <div class="pre">${e.summary}</div>
            </li>`)}
      </ul>
    </section>`}};customElements.define("tk-conversations",Et);var nr=["proposed","accepted","replaced"],ti=[{name:"title",label:"Title",type:"text"},{name:"decision",label:"Decision",type:"textarea"},{name:"why",label:"Why",type:"textarea"},{name:"open",label:"Open points, one per line",type:"list"},{name:"date",label:"Date",type:"date"}],or=[...ti,{name:"status",label:"Status",type:"select",options:["proposed","accepted"]}],ar=[{name:"replaced_by",label:"Replaced by decision number",type:"number",step:"1"}];function X(s){return String(s).padStart(4,"0")}var Lt=class extends m{static{this.properties={...m.properties,decisions:{state:!0},status:{state:!0},selected:{state:!0},detail:{state:!0}}}static{this.styles=y}constructor(){super(),this.decisions=[],this.status="",this.selected=void 0,this.detail=void 0}reloadOn(){return["api","status","selected"]}async load(e){let t=this.status===""?{}:{status:this.status},{decisions:i}=await e.call("list_decisions",t),r=this.selected===void 0?void 0:await e.call("get_decision",{number:this.selected});return()=>{this.decisions=i,this.detail=r}}async save(e,t,i){if(e!=="accept"&&Object.keys(t).length===0)return!1;let r=i===void 0?{action:e,...t}:{action:e,number:i,...t},n=await this.run(a=>a.call("set_decision",r));return n&&this.changed(),n}toggle(e){this.selected=this.selected===e?void 0:e}renderDetail(e){return o`<div class="card">
      <p class="pre">${e.decision}</p>
      <h3>Why</h3>
      <p class="pre">${e.why}</p>
      ${e.open.length>0?o`<h3>Open points</h3>
              <ul>
                ${e.open.map(t=>o`<li>${t}</li>`)}
              </ul>`:d}
      ${e.replaced_by===null?d:o`<p class="muted">Replaced by ${X(e.replaced_by)}</p>`}
      ${e.replaces.length>0?o`<p class="muted">Replaces ${e.replaces.map(X).join(", ")}</p>`:d}
      <div class="actions">
        ${e.status==="proposed"?u({icon:V,label:"Accept",className:"accept",disabled:this.busy,onClick:()=>{this.save("accept",{},e.number)}}):d}
        ${u({icon:se,label:"Edit",className:"update",disabled:this.busy,onClick:()=>{this.openDialog("update")}})}
        ${u({icon:et,label:"Replace",className:"replace",disabled:this.busy,onClick:()=>{this.openDialog("replace")}})}
        ${this.historyButton("decisions",X(e.number))}
      </div>
      ${this.historyPanel("decisions",X(e.number))}
      ${this.formDialog({key:"update",className:"update",heading:`Edit decision ${X(e.number)}`,fields:ti,values:e,save:t=>this.save("update",t,e.number)})}
      ${this.formDialog({key:"replace",className:"replace",heading:`Replace decision ${X(e.number)}`,fields:ar,submitLabel:"Replace",submitIcon:et,save:t=>this.save("replace",t,e.number)})}
    </div>`}renderDecision(e){let t=this.selected===e.number;return o`<li data-number=${e.number}>
      <div class="row">
        <strong class="grow">${X(e.number)} ${e.title}</strong>
        ${u({icon:t?Ls:Es,label:t?"Close":"Open",className:"open",onClick:()=>{this.toggle(e.number)}})}
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
            ${nr.map(e=>o`<option value=${e}>${e}</option>`)}
          </select>
          ${u({icon:O,label:"Add a decision",className:"add",disabled:this.busy,onClick:()=>{this.openDialog("add")}})}
        </div>
        ${this.renderError()}
        <ul>
          ${C(this.decisions,e=>e.number,e=>this.renderDecision(e))}
        </ul>
        ${this.formDialog({key:"add",className:"add",heading:"Add a decision",fields:or,submitLabel:"Add",submitIcon:O,save:e=>this.save("add",e)})}
      </section>
    `}};customElements.define("tk-decisions",Lt);var lr=100,dr=["all","dose","test","event"],cr=[["ammonia","Ammonia (ppm)"],["nitrite","Nitrite (ppm)"],["nitrate","Nitrate (ppm)"],["phosphate","Phosphate (ppm)"],["ph","pH"],["kh","KH (dKH)"],["gh","GH (dGH)"],["temperature_c","Temperature (\xB0C)"]],pr=[{name:"source",label:"Water",type:"select",options:["tank","tap"]},...cr.map(([s,e])=>({name:s,label:e,type:"number"})),{name:"notes",label:"Notes",type:"textarea"}],St=class extends m{static{this.properties={...m.properties,entries:{state:!0},kind:{state:!0},products:{state:!0}}}static{this.styles=y}constructor(){super(),this.entries=[],this.kind="all",this.products=[]}reloadOn(){return["api","kind"]}async load(e){let[t,i]=await Promise.all([e.call("get_log",{kind:this.kind,limit:lr}),e.call("list_products")]);return()=>{this.entries=t.entries,this.products=i.products.map(r=>r.name)}}doseFields(){return[{name:"product",label:"Product",type:"select",options:this.products,required:!0},{name:"amount_ml",label:"Amount (ml)",type:"number",required:!0},{name:"why",label:"Why",type:"text"},{name:"notes",label:"Notes",type:"textarea"}]}async record(e,t){let i=await this.run(r=>r.call(e,t));return i&&this.changed(),i}async recordTest(e){if(Object.keys(e).length===0)return!1;let{source:t,notes:i,...r}=e,n={values:r};return t!==void 0&&(n.source=t),i!==void 0&&(n.notes=i),this.record("record_test",n)}render(){return o`
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
        <div class="actions record">
          ${b({icon:tt,label:"Record a dose",className:"dose",disabled:this.busy,onClick:()=>{this.openDialog("dose")}})}
          ${b({icon:st,label:"Record a test result",className:"test",disabled:this.busy,onClick:()=>{this.openDialog("test")}})}
        </div>
        ${this.renderError()}
        <ul>
          ${this.entries.map(e=>o`<li>
                <div class="pre">${Is(e)}</div>
                <div class="muted">${x(e.time)}</div>
              </li>`)}
        </ul>
      </section>
      ${this.formDialog({key:"dose",className:"dose",heading:"Record a dose",fields:this.doseFields(),submitLabel:"Record",submitIcon:tt,save:e=>this.record("record_dose",e)})}
      ${this.formDialog({key:"test",className:"test",heading:"Record a test result",fields:pr,submitLabel:"Record",submitIcon:st,save:e=>this.recordTest(e)})}
    `}};customElements.define("tk-log",St);var hr=20,ur=[{name:"camera",label:"Camera entity, such as a Tapo C100",type:"text"},{name:"check_time",label:"Daily check at, only while a light is on",type:"time"},{name:"after_test",label:"Check after each test",type:"checkbox"},{name:"alerts",label:"Alert me about issues",type:"checkbox"},{name:"keep_days",label:"Keep photos for (days)",type:"number"},{name:"check_plants",label:"Check plant health",type:"checkbox"},{name:"check_fish",label:"Check fish health",type:"checkbox"}],mr={daily:"Daily",test:"After a test",manual:"Check now",chat:"Asked in a chat"},gr=[["water","Water"],["algae","Algae"],["plants","Plants"],["fish","Fish"],["level","Water level"]];function Rt(s){return s.photo_url===null?d:o`<img class="photo" src=${s.photo_url} alt="The tank at ${x(s.time)}" />`}function Pt(s){return`${x(s.time)} \xB7 ${mr[s.reason]}`}function Ht(s){let e=gr.filter(([t])=>s.seen[t]!==void 0);return o`
    ${s.summary===null?d:o`<div class="summary">${s.summary}</div>`}
    ${s.suggestion===null?d:o`<div>Suggested: ${s.suggestion}</div>`}
    ${e.length===0?d:o`<ul class="seen">
            ${e.map(([t,i])=>o`<li><strong>${i}</strong> ${s.seen[t]}</li>`)}
          </ul>`}
    ${s.note===null?d:o`<div class="muted note">${s.note}</div>`}
  `}var Nt=class extends m{static{this.properties={...m.properties,stamp:{type:Number},info:{state:!0},photos:{state:!0},proposals:{state:!0}}}static{this.styles=[y,$`
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
    `]}constructor(){super(),this.stamp=0,this.info=void 0,this.photos=void 0,this.proposals=[]}reloadOn(){return["api","stamp"]}async load(e){let[t,i]=await Promise.all([e.call("get_camera"),e.call("list_proposals",{state:"pending"})]);return()=>{this.info=t,this.proposals=i.proposals,t.camera===null&&(this.photos=void 0)}}async act(e){await this.run(e)&&this.changed()}async showPhotos(){await this.run(async e=>{let t=await e.call("list_photos",{limit:hr});this.photos=t.photos})}renderIssue(e){let t=this.proposals.filter(i=>e.proposal_ids.includes(i.proposal_id));return o`<li class="issue" data-check=${e.id}>
      <div class="muted">${Pt(e)}</div>
      ${Rt(e)} ${Ht(e)}
      ${t.length===0?d:o`<div class="waiting">
              <div class="muted">Accept applies:</div>
              ${t.map(i=>o`<div class="proposal">
                    <strong class="pre">${i.summary}</strong>
                    ${i.changes.map(r=>o`<div class="muted">${L(r)}</div>`)}
                  </div>`)}
            </div>`}
      <div class="actions">
        ${u({icon:Ts,label:"Not a problem",className:"dismiss",disabled:this.busy,onClick:()=>{this.act(i=>i.call("dismiss_finding",{check_id:e.id}))}})}
        ${u({icon:re,label:"Discuss",className:"discuss",onClick:()=>{oe(this,{kind:"photo",id:e.id})}})}
        ${u({icon:E,label:"Reject",className:"reject",disabled:this.busy,onClick:()=>{this.act(i=>i.rejectFinding(e.id))}})}
        ${u({icon:V,label:"Accept",className:"accept",disabled:this.busy,onClick:()=>{this.act(i=>i.acceptFinding(e.id))}})}
      </div>
    </li>`}renderPhotos(){let e=this.photos;return e===void 0?b({icon:As,label:"Photos",className:"photos",disabled:this.busy,onClick:()=>{this.showPhotos()}}):o`<h3>Photos</h3>
      ${e.length===0?o`<p class="muted">No photos yet.</p>`:d}
      <ul class="photos">
        ${C(e,t=>t.id,t=>o`<li class="photo-check">
              <div class="muted">${Pt(t)}</div>
              ${Rt(t)} ${Ht(t)}
            </li>`)}
      </ul>`}renderSettings(e){return o`<details class="settings">
      <summary>Camera settings</summary>
      <p class="muted">
        Each check sends the photo to Anthropic through the AI task entity, uses paid API calls and
        counts toward Claude's comments a day.
      </p>
      ${B(ur,e)} ${this.historyDetails("settings","camera")}
    </details>`}render(){let e=this.info;if(e===void 0)return this.error?o`<p class="error">${this.error}</p>`:o``;let t=this.error?o`<p class="error">${this.error}</p>`:d;if(e.camera===null)return o`<section id="camera">
        <h2>Camera</h2>
        ${t}
        <p class="muted">
          No camera is set. Add one in the settings, such as a Tapo C100, to have Claude look at the
          tank.
        </p>
        ${this.renderSettings(e)}
      </section>`;let i=e.latest;return o`<section id="camera">
        <h2>Camera</h2>
        ${t}
        ${i===null?o`<p class="muted">No photo yet.</p>`:o`<div class="latest">
                <div class="muted">${Pt(i)}</div>
                ${Rt(i)} ${Ht(i)}
              </div>`}
        <div class="row">
          ${b({icon:Cs,label:"Check now",className:"check",primary:!0,disabled:this.busy,onClick:()=>{this.act(r=>r.call("check_now"))}})}
        </div>
        ${this.renderPhotos()} ${this.renderSettings(e)}
      </section>
      ${e.open.length===0?d:o`<section id="seen">
              <h2>Seen by the camera</h2>
              <ul>
                ${C(e.open,r=>r.id,r=>this.renderIssue(r))}
              </ul>
            </section>`}`}};customElements.define("tk-camera",Nt);var fr=7,si=30,vr=60,ii={on_course:"On course",watch:"Watch",act:"Act"},yr={cycling:"Cycling",cycled:"Cycled"},$r=[{name:"name",label:"Name",type:"text"},{name:"volume_litres",label:"Volume (litres)",type:"number"},{name:"dosing_volume_litres",label:"Water volume for doses (litres)",type:"number"},{name:"temperature_c",label:"Target temperature (\xB0C)",type:"number"},{name:"stage",label:"Stage",type:"select",options:["cycling","cycled"]},{name:"notes",label:"Notes",type:"textarea"}],br=[{name:"source",label:"Values come from",type:"select",options:["supplier","tap_test"]},{name:"ph",label:"pH",type:"number"},{name:"kh",label:"KH (dKH)",type:"number"},{name:"gh",label:"GH (dGH)",type:"number"},{name:"nitrate",label:"Nitrate (mg/l)",type:"number"},{name:"phosphate",label:"Phosphate (mg/l)",type:"number"},{name:"notes",label:"Notes",type:"textarea"}],kr=[{name:"nitrogen_watch",label:"Ammonia or nitrite Watch above (ppm)",type:"number"},{name:"nitrogen_act",label:"Ammonia or nitrite Act above (ppm)",type:"number"},{name:"ph_watch",label:"pH Watch under, while cycling",type:"number"},{name:"ph_act",label:"pH Act under, while cycling",type:"number"},{name:"stall_watch_days",label:"Stalled cycle Watch after (days)",type:"number",step:"1"},{name:"stall_act_days",label:"Stalled cycle Act after (days)",type:"number",step:"1"},{name:"test_watch_days",label:"Late test Watch after (days)",type:"number",step:"1"},{name:"test_act_days",label:"Late test Act after (days)",type:"number",step:"1"},{name:"skip_watch",label:"Skipped tasks for Watch",type:"number",step:"1"},{name:"skip_act",label:"Skipped tasks for Act",type:"number",step:"1"},{name:"plan_watch_days",label:"Plan ends within, for Watch (days)",type:"number",step:"1"},{name:"plan_act_days",label:"Plan ends within, for Act (days)",type:"number",step:"1"}],Dt=class extends m{static{this.properties={...m.properties,status:{state:!0},tank:{state:!0},plan:{state:!0},log:{state:!0},lights:{state:!0},proposals:{state:!0}}}static{this.styles=y}constructor(){super(),this.status=void 0,this.tank=void 0,this.plan=void 0,this.log=[],this.lights=void 0,this.proposals=[]}async load(e){let t=U(new Date,e.timeZone),[i,r,n,a,c,l]=await Promise.all([e.call("get_status"),e.call("get_tank"),e.call("get_plan",{start:t,end:A(t,fr)}),e.call("get_log",{kind:"test",since:A(t,-vr),limit:500}),e.call("get_light",{days:si}),e.call("list_proposals",{state:"pending"})]);return()=>{this.status=i,this.tank=r,this.plan=n,this.log=a.entries,this.lights=c,this.proposals=l.proposals}}async act(e){await this.run(e)&&this.changed()}settingsCard(e,t,i,r,n,a){return o`<section id=${e}>
      <h2>${t}</h2>
      ${B(i,r)} ${this.historyDetails(n,a)}
    </section>`}renderStatus(e,t){let i=e.status===null?"Not checked yet":ii[e.status],r=e.stage===null?"":yr[e.stage];return o`<section id="status">
      <div class="row">
        <h2 class="grow">${t.tank.name}</h2>
        <strong class="level ${e.status??""}">${i}</strong>
      </div>
      <div class="muted">
        ${[r,e.checked===null?"":`checked ${x(e.checked)}`].filter(n=>n!=="").join(" \xB7 ")}
      </div>
      <ul>
        ${e.rules.filter(n=>n.level!=="on_course").map(n=>o`<li>
                <strong>${ii[n.level]}</strong> ${n.reason}
                ${n.action===null?d:o`<div>${n.action}</div>`}
              </li>`)}
      </ul>
    </section>`}renderTask(e,t){return o`<li>
      <div class="row">
        <span class="grow">${e.time??""} ${e.text}</span>
        ${t&&e.state==="open"?o`<div class="actions">
                ${u({icon:bs,label:"Skip",className:"skip",disabled:this.busy,onClick:()=>{this.act(i=>i.call("skip_task",{task_id:e.id}))}})}
                ${u({icon:V,label:"Complete",className:"complete",disabled:this.busy,onClick:()=>{this.act(i=>i.call("complete_task",{task_id:e.id}))}})}
              </div>`:o`<span class="muted">${e.state==="open"?"":e.state}</span>`}
      </div>
    </li>`}renderLight(e,t){let{schedule:i,automation:r}=e;return o`<li data-light=${e.id}>
      <div class="row">
        <strong class="grow">${e.model}</strong>
        <span class="muted">${e.state??"unknown"}</span>
      </div>
      ${i===null?o`<div><strong>Needs helpers</strong></div>
              <div class="muted">
                Should run ${e.on} to
                ${e.off}${e.brightness_pct===null?"":`, ${String(e.brightness_pct)}%`}
              </div>`:o`<div>${xr(i)}</div>`}
      ${r===null?d:o`<div class="muted">
              Automation
              ${r.id===null?r.entity_id:o`<a class="automation" href=${`/config/automation/edit/${r.id}`}
                      >${r.entity_id}</a
                    >`}
              (${r.state??"missing"})
            </div>`}
      <div class="muted">Today ${e.today.on} to ${e.today.off}</div>
      ${e.problems.map(n=>o`<div class="error">${n}</div>`)}
      ${Ve(Oe(e.on_periods,t,si,this.api?.timeZone))}
      ${this.historyDetails("lights",e.id)}
    </li>`}renderParameters(e,t){let{charts:i,empty:r}=js(this.log,e.settings,t.tank.temperature_c,t.water);return o`<section id="parameters">
      <h2>Water parameters</h2>
      <div class="charts">
        ${i.map(n=>o`<div class="parameter" data-parameter=${n.key}>
              <h3>${n.label}</h3>
              ${ve(n.chart,n.label)}
            </div>`)}
      </div>
      ${r.length===0?d:o`<p class="muted">No readings yet for: ${r.join(", ")}</p>`}
    </section>`}renderProposal(e){return o`<li>
      <strong class="pre">${e.summary}</strong>
      <div class="pre">${e.reason}</div>
      <div class="muted">${P(e.source)} · ${x(e.created)}</div>
      ${e.changes.map(t=>o`<div class="muted">${L(t)}</div>`)}
      <div class="actions">
        ${u({icon:re,label:"Discuss",className:"discuss",onClick:()=>{oe(this,{kind:"proposal",id:e.proposal_id})}})}
        ${u({icon:E,label:"Reject",className:"reject",disabled:this.busy,onClick:()=>{this.act(t=>t.reject(e.proposal_id))}})}
        ${u({icon:V,label:"Accept",className:"accept",disabled:this.busy,onClick:()=>{this.act(t=>t.accept(e.proposal_id))}})}
      </div>
    </li>`}render(){let{status:e,tank:t,plan:i,lights:r}=this;if(e===void 0||t===void 0||i===void 0||r===void 0)return this.error?o`<p class="error">${this.error}</p>`:o`<p class="muted">Loading</p>`;let n=U(new Date,this.api?.timeZone),a=i.tasks.filter(l=>l.date===n),c=i.tasks.filter(l=>l.date>n);return o`
      ${this.error?o`<p class="error">${this.error}</p>`:d}
      ${this.renderStatus(e,t)}
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
        ${ve(Ie(this.log,e.settings),"Cycle")}
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
      ${this.settingsCard("tank","Tank",$r,t.tank,"tank","tank")}
      ${this.settingsCard("water","Water",br,t.water??{},"water","water")}
      <section id="light">
        <h2>Light</h2>
        ${r.lights.length===0?o`<p class="muted">No lights yet</p>`:d}
        ${r.next_change===null?d:o`<div class="muted">Next change ${x(r.next_change.time)}</div>`}
        <ul>
          ${C(r.lights,l=>l.id,l=>this.renderLight(l,r.today))}
        </ul>
      </section>
      ${this.settingsCard("rules","Rule limits",kr,e.settings,"settings","rules")}
      <tk-camera .api=${this.api} .stamp=${this.version}></tk-camera>
    `}};customElements.define("tk-overview",Dt);function xr(s){let e=[`${s.on??"?"} to ${s.off??"?"}`];return s.brightness_pct!==null&&e.push(`${String(s.brightness_pct)}%`),s.ramp_minutes!==null&&e.push(`${String(s.ramp_minutes)} min ramp`),e.join(", ")}var Ut="M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z",wr=[0,1,2,3,4,5,6],_r=new Intl.DateTimeFormat("en-GB",{weekday:"short",timeZone:"UTC"}),Cr=/\btest/i;function Ot(s){let[e=0,t=1,i=1]=s.split("-").map(Number);return new Date(Date.UTC(e,t-1,i))}function Ar(s){return(Ot(s).getUTCDay()+6)%7}function Mt(s){return A(s,-Ar(s))}function Tr(s){return Cr.test(s.text)?"test":s.slot==="dose"?"dose":"task"}function It(s){return`${_r.format(Ot(s))} ${String(Ot(s).getUTCDate())}`}var Vt=class extends _{static{this.properties={tasks:{attribute:!1},start:{attribute:!1},end:{attribute:!1},today:{attribute:!1},picked:{attribute:!1},week:{state:!0}}}constructor(){super(),this.tasks=[],this.start="",this.end="",this.today="",this.picked=void 0,this.week=void 0}static{this.styles=$`
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
  `}first(){return Mt(this.start)}last(){return Mt(this.end)}shown(){let e=this.week??Mt(this.today);return e<this.first()?this.first():e>this.last()?this.last():e}move(e){this.week=A(this.shown(),7*e),this.fire("tk-week-change",this.week)}fire(e,t){this.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:!0,composed:!0}))}inside(e){return e>=this.start&&e<=this.end}chip(e){let t=Tr(e),i=e.state!=="open",r=["chip",t,...i?["done"]:[]].join(" "),n=[e.text,t,...e.series_id===null?[]:["repeats"],...i?["done"]:[]].join(", ");return o`<button
      class=${r}
      aria-label=${n}
      data-task=${e.id}
      title=${e.text}
      @click=${()=>{this.fire("tk-pick-task",e.id)}}
    >
      ${e.series_id===null?d:o`<ha-svg-icon class="repeat" .path=${Ut}></ha-svg-icon>`}<span>${e.text}</span>
    </button>`}render(){let e=this.shown(),t=wr.map(n=>A(e,n)),i=n=>this.tasks.filter(a=>a.date===n),r=(n,a)=>[a,...n===this.today?["today"]:[],...this.inside(n)?[]:["outside"]].join(" ");return o`<nav>
        <button
          class="prev"
          aria-label="Previous week"
          ?disabled=${e<=this.first()}
          @click=${()=>{this.move(-1)}}
        >
          ‹
        </button>
        <span class="label">${e} to ${A(e,6)}</span>
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
              <span class="head">${It(n)}</span>
              ${i(n).map(a=>this.chip(a))}
            </div>`)}
      </div>
      <div class="strip">
        ${t.map(n=>{let a=i(n).length,c=[...n===this.today?["today"]:[],...n===this.picked?["picked"]:[]].join(" ");return o`<button
            class=${c}
            data-day=${n}
            aria-current=${n===this.today?"date":d}
            aria-pressed=${n===this.picked?"true":"false"}
            aria-label=${`${It(n)}: ${String(a)} ${a===1?"task":"tasks"}`}
            ?disabled=${!this.inside(n)}
            @click=${()=>{this.fire("tk-pick-day",n)}}
          >
            <span>${It(n)}</span><span class="count">${a===0?"":String(a)}</span>
          </button>`})}
      </div>`}};customElements.define("tk-week",Vt);var Er=28,ri=[{name:"text",label:"Task",type:"text"},{name:"date",label:"Date",type:"date"},{name:"slot",label:"Slot",type:"select",options:["task","dose"]}],ni={name:"note",label:"Note",type:"text"},oi=[{name:"every_days",label:"Repeat every N days",type:"number",step:"1"},{name:"weekdays",label:"Or repeat weekly on",type:"weekdays"},{name:"until",label:"Repeat until",type:"date"}],Lr=[...ri,ni,...oi],ai=[...ri,{name:"state",label:"State",type:"select",options:["open","complete","skip"]},ni],Sr=[...ai,{name:"scope",label:"Apply to (the repeat changes only for this and later ones)",type:"select",options:["this","future"],required:!0},...oi],Rr=[{name:"notify",label:"Notify services for reminders",type:"list"},{name:"status_notify",label:"Notify services for status alerts",type:"list"},{name:"task_time",label:"Task reminder time",type:"time"},{name:"dose_time",label:"Dose reminder time",type:"time"},{name:"resend_time",label:"Resend open tasks at",type:"time"}],Ft=class extends m{static{this.properties={...m.properties,plan:{state:!0},today:{state:!0},day:{state:!0}}}static{this.styles=y}constructor(){super(),this.plan=void 0,this.today="",this.day=void 0}async load(e){let t=U(new Date,e.timeZone),i=await e.call("get_plan",{start:t,end:A(t,Er-1)});return()=>{this.plan=i,this.today=t,this.day!==void 0&&(this.day<t||this.day>i.end)&&(this.day=void 0)}}async save(e,t,i){if(i===void 0&&Object.keys(t).length===0)return!1;let r=Object.fromEntries(Object.entries(t).filter(([,c])=>!Array.isArray(c)||c.length>0)),n=i===void 0?r:{task_id:i,...r},a=await this.run(c=>c.call(e,n));return a&&this.changed(),a}async showTask(e){this.day=void 0,await this.updateComplete,this.renderRoot.querySelector(`li[data-task="${CSS.escape(e)}"]`)?.scrollIntoView({behavior:"smooth",block:"center"})}keepDayIn(e){this.day!==void 0&&(this.day<e||this.day>A(e,6))&&(this.day=void 0)}pickDay(e){this.day=this.day===e?void 0:e}renderTask(e){let t=this.plan?.series.find(r=>r.id===e.series_id),i=[e.state,e.note,t?.repeat].filter(r=>r!=null&&r!=="");return o`<li data-task=${e.id}>
      <div class="row">
        ${t===void 0?d:o`<ha-svg-icon class="repeat" .path=${Ut} title="Repeats"></ha-svg-icon>`}
        <span class="grow">${e.time??""} ${e.text}</span>
        <div class="actions">
          ${u({icon:se,label:"Edit",className:"edit",disabled:this.busy,onClick:()=>{this.openDialog(`edit:${e.id}`)}})}
          ${this.historyButton("tasks",e.id)}
          ${u({icon:Y,label:"Remove",className:"remove",disabled:this.busy,onClick:()=>{this.save("remove_task",{},e.id)}})}
          ${t===void 0?d:u({icon:fs,label:"Remove this and later",className:"remove-future",disabled:this.busy,onClick:()=>{this.save("remove_task",{scope:"future"},e.id)}})}
        </div>
      </div>
      <div class="muted detail">${i.join(" \xB7 ")}</div>
      ${this.historyPanel("tasks",e.id)}
      ${this.formDialog({key:`edit:${e.id}`,className:"edit",heading:"Edit the task",fields:t===void 0?ai:Sr,values:t===void 0?e:Pr(e,t),save:r=>this.save("update_task",r,e.id)})}
    </li>`}render(){let e=this.plan,t=[...new Set(e?.tasks.map(r=>r.date)??[])],i=this.day===void 0?t:t.filter(r=>r===this.day);return o`
      <section>
        <div class="head">
          <h2>Plan</h2>
          ${u({icon:O,label:"Add a task",className:"add",disabled:this.busy,onClick:()=>{this.openDialog("add")}})}
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
                ${b({icon:E,label:"Show all",className:"show-all",onClick:()=>{this.day=void 0}})}
              </p>`}
        ${e!==void 0&&i.length===0?o`<p class="muted">
                ${this.day===void 0?"No tasks in the next four weeks":`No tasks on ${this.day}`}
              </p>`:d}
        ${i.map(r=>o`<h3>${r}</h3>
              <ul>
                ${C(e?.tasks.filter(n=>n.date===r)??[],n=>n.id,n=>this.renderTask(n))}
              </ul>`)}
        ${this.formDialog({key:"add",className:"add",heading:"Add a task",fields:Lr,submitLabel:"Add",submitIcon:O,save:r=>this.save("add_task",r)})}
      </section>
      ${e===void 0?d:o`<section id="reminders">
              <h2>Reminders</h2>
              ${B(Rr,e.reminders)}
              ${this.historyDetails("settings","reminders")}
            </section>`}
    `}};function Pr(s,e){return{...s,scope:"this",every_days:e.every_days,weekdays:e.weekdays,until:e.until}}customElements.define("tk-plan",Ft);function k(s){return typeof s=="string"||typeof s=="number"?String(s):""}function Hr(s){return s.label_dose??{}}var Nr={products:{title:"Products",noun:"product",collection:"products",list:"list_products",key:"products",canShowRemoved:!0,label:s=>k(s.name),lines:s=>{let e=Hr(s),t=[k(s.purpose)];if(s.label_dose){let i=s.label_dose_for_tank_ml===void 0?"":` (${k(s.label_dose_for_tank_ml)} ml for this tank)`;t.push(`Label: ${k(e.amount_ml)} ml per ${k(e.per_litres)} l, ${k(e.frequency)}${i}`)}return k(s.your_dose)&&t.push(`Your dose: ${k(s.your_dose)}`),t.push(k(s.notes)),Array.isArray(s.links)&&t.push(s.links.map(k).join(" ")),t}},contents:{title:"Contents",noun:"content",collection:"contents",list:"list_contents",key:"contents",canShowRemoved:!0,label:s=>k(s.name),lines:s=>[[k(s.type),k(s.count),k(s.where),`added ${k(s.added)}`].filter(e=>e!=="").join(" \xB7 "),k(s.notes)]},notes:{title:"Notes",noun:"note",collection:"notes",list:"list_notes",key:"notes",edit:{idArg:"note_id",add:"add_note",update:"update_note",remove:"remove_note",fields:[{name:"kind",label:"Kind",type:"select",options:["question","assumption"]},{name:"topic",label:"Topic",type:"text"},{name:"text",label:"Text",type:"textarea"},{name:"how_to_resolve",label:"How to resolve",type:"textarea"}]},canShowRemoved:!1,label:s=>`${k(s.kind)}: ${k(s.topic)}`,lines:s=>[k(s.text),k(s.how_to_resolve)]}},jt=class extends m{static{this.properties={...m.properties,kind:{attribute:!1},items:{state:!0},showRemoved:{state:!0}}}static{this.styles=y}constructor(){super(),this.kind="",this.items=[],this.showRemoved=!1}get config(){let e=Nr[this.kind];if(e===void 0)throw new Error(`No records called ${this.kind}`);return e}reloadOn(){return["api","kind","showRemoved"]}async load(e){let t=this.config,i=t.canShowRemoved?{include_removed:this.showRemoved}:{},r=(await e.call(t.list,i))[t.key]??[];return()=>{this.items=r}}async save(e,t,i,r){if(Object.keys(i).length===0)return!1;let n=r===void 0?i:{[e.idArg]:r,...i};return this.run(a=>a.call(t,n))}async removeRecord(e,t){await this.run(i=>i.call(e.remove,{[e.idArg]:t}))}actions(e,t){let i=e.edit,r=typeof t.removed=="string";return o`<div class="actions">
      ${r?o`<span class="muted">Removed ${t.removed}</span>`:d}
      ${i===void 0?d:u({icon:se,label:"Edit",className:"edit",disabled:this.busy,onClick:()=>{this.openDialog(`edit:${t.id}`)}})}
      ${this.historyButton(e.collection,t.id)}
      ${i===void 0||r?d:u({icon:Y,label:"Remove",className:"remove",disabled:this.busy,onClick:()=>{this.removeRecord(i,t.id)}})}
    </div>`}item(e,t){let i=e.edit;return o`<li data-id=${t.id}>
      <div class="row">
        <strong class="grow">${e.label(t)}</strong>
        ${this.actions(e,t)}
      </div>
      ${e.lines(t).filter(r=>r!=="").map(r=>o`<div class="muted pre">${r}</div>`)}
      ${this.historyPanel(e.collection,t.id)}
      ${i===void 0?d:this.formDialog({key:`edit:${t.id}`,className:"edit",heading:`Edit the ${e.noun}`,fields:i.fields,values:t,save:r=>this.save(i,i.update,r,t.id)})}
    </li>`}addButton(e){return e.edit===void 0?d:u({icon:O,label:`Add a ${e.noun}`,className:"add",disabled:this.busy,onClick:()=>{this.openDialog("add")}})}addDialog(e){let t=e.edit;return t===void 0?d:this.formDialog({key:"add",className:"add",heading:`Add a ${e.noun}`,fields:t.fields,submitLabel:"Add",submitIcon:O,save:i=>this.save(t,t.add,i)})}render(){let e=this.config;return o`
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
        ${this.renderError()}
        <ul>
          ${C(this.items,t=>t.id,t=>this.item(e,t))}
        </ul>
        ${this.addDialog(e)}
      </section>
    `}};customElements.define("tk-records",jt);var Dr=["proposal","photo","review","status"],Mr=/^[0-9A-Za-z_-]{1,64}$/;function Ir(s){let e=new URLSearchParams(s);for(let t of Dr){let i=e.get(t);if(i===null)continue;return(t==="status"?i==="now":Mr.test(i))?{kind:t,id:i}:void 0}}var Or=[["overview","Overview"],["chat","Chat"],["plan","Plan"],["log","Log"],["contents","Contents"],["products","Products"],["decisions","Decisions"],["notes","Notes"],["conversations","Conversations"],["claude","Claude"]],Bt=class extends _{constructor(){super();this.chat=document.createElement("tk-chat");this.connection=void 0;this.hass=void 0,this.panel=void 0,this.narrow=!1,this.route=void 0,this.addEventListener(ot,t=>{this.openChat(t.detail)}),this.tab="overview",this.api=void 0}static{this.properties={hass:{attribute:!1},panel:{attribute:!1},narrow:{type:Boolean},route:{attribute:!1},tab:{state:!0},api:{state:!0}}}static{this.styles=$`
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
  `}connectedCallback(){super.connectedCallback(),this.followAddress()}followAddress(){let t=Ir(window.location.search);window.location.search!==""&&history.replaceState(history.state,"",window.location.pathname),t!==void 0&&this.openChat(t)}openChat(t){this.chat.start={...t},this.tab="chat"}willUpdate(t){t.has("route")&&this.followAddress(),this.updateApi(t),this.chat.api=this.api}updateApi(t){let i=this.hass;if(i===void 0||!(t.has("hass")||t.has("panel")))return;let r=this.panel?.config?.entry_id;this.connection===i.connection&&this.api?.entryId===r||(this.connection=i.connection,this.api=new Re(i.connection,i.config?.time_zone,r))}view(){switch(this.tab){case"chat":return o`${this.chat}`;case"plan":return o`<tk-plan .api=${this.api}></tk-plan>`;case"log":return o`<tk-log .api=${this.api}></tk-log>`;case"decisions":return o`<tk-decisions .api=${this.api}></tk-decisions>`;case"claude":return o`<tk-claude .api=${this.api}></tk-claude>`;case"conversations":return o`<tk-conversations .api=${this.api}></tk-conversations>`;case"contents":case"products":case"notes":return o`${ms(this.tab,o`<tk-records .api=${this.api} .kind=${this.tab}></tk-records>`)}`;default:return o`<tk-overview .api=${this.api}></tk-overview>`}}render(){return o`
      <header>
        ${this.narrow?o`<ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>`:d}
        <h1>TankKeeper</h1>
        ${Ps(this.api)}
      </header>
      <nav role="tablist">
        ${Or.map(([t,i])=>o`<button
              class="tab"
              role="tab"
              data-tab=${t}
              aria-selected=${this.tab===t?"true":"false"}
              @click=${()=>this.tab=t}
            >
              ${i}
            </button>`)}
      </nav>
      <main>${this.view()}</main>
    `}};customElements.define("tankkeeper-panel",Bt);export{Bt as TankkeeperPanel,Ir as discussed};
