!function(e){"use strict";const u="literal",O="identifier",j="symbol",q="function";class U extends Error{constructor(e,t,r){super(t),this.name=e,this.offset=r}}U.throw=(e,t,r)=>{throw new U(e,t,r)};const n=(()=>{const r="abstract,arguments,await,boolean,break,byte,case,catch,char,class,const,continue,debugger,default,delete,do,double,else,enum,eval,export,extends,final,finally,float,for,function,goto,if,implements,import,in,instanceof,int,interface,let,long,native,new,package,private,protected,public,return,short,static,super,switch,synchronized,this,throw,throws,transient,try,var,void,volatile,while,with,yield".split(",");const t=new RegExp([/'((?:[^'\\]|\\.)*)'/,/"((?:[^"\\]|\\.)*)"/,/((?:\d+(?:\.\d*)?|\.\d+))/,/([a-zA-Z_][a-zA-Z_0-9]*)/,/(\+|-|\*|\/|\[|\]|\.|\?|:|%|<|=|>|!|&|\||\(|\)|,)/,/(\s)/,/(.)/].map(e=>{e=e.toString();return e.substring(1,e.length-1)}).join("|"),"g"),l=e=>U.throw("InvalidTokenError","Invalid token @"+e,e),n={true:!0,false:!1,undefined:void 0,null:null},c=[e=>[u,e.replace(/\\'/g,"'")],e=>[u,e.replace(/\\"/g,'"')],e=>[u,parseFloat(e)],(e,t)=>Object.prototype.hasOwnProperty.call(n,e)?[u,n[e]]:(r.includes(e)&&l(t),[O,e]),e=>[j,e],e=>[],(e,t)=>l(t)];return e=>{const o=[];let s=0,a;const i=[u,O];return e.replace(t,(e,...t)=>{var r=t.findIndex(e=>void 0!==e),t=t[r],[r,n]=(0,c[r])(t,s);i.includes(r)&&i.includes(a)&&l(s),void 0!==(a=r)&&o.push([r,n,s]),s+=t.length}),o}})(),o=(()=>{const i=(e,...t)=>Object.assign(e[1].bind(null,...t),{op:e[0],args:t}),a=["constant",e=>e],r=["rootGet",(e,t)=>t[e(t)]],o=["get",(e,t,r)=>{e=e(r),t=e[t(r)];return typeof t===q?t.bind(e):t}],l=["not",(e,t)=>!e(t)];const c=["add",(e,t,r)=>e(r)+t(r)],u=["sub",(e,t,r)=>e(r)-t(r)];const n=["ternary",(e,t,r,n)=>(e(n)?t:r)(n)],d=["getTypeof",(e,t)=>typeof e(t)],p=["call",(e,t,r)=>e(r).apply(null,t.map(e=>e(r)))],s=e=>{0===e.length&&U.throw("EndOfExpressionError","Unexpected end of expression")},f=e=>(s(e),e[0]),h=e=>f(e)[2],v=(e,t=1)=>e.splice(0,t),g=(e,t=void 0)=>{var r;return 0!==e.length&&([e,r]=e[0],e===j)&&(!t||t.includes(r))},b=(e,t)=>{var r=[];for(const a of e){var[n,o]=a;if(n!==j)break;r.push(o)}const s=r.join("");t=t.filter(e=>s.startsWith(e)).sort((e,t)=>t.length-e.length)[0];return!!t&&(v(e,t.length),t)},y=e=>U.throw("UnexpectedTokenError","Unexpected token @"+h(e),h(e));var e=(o,s)=>{const a=Object.keys(s);return e=>{let t=o(e),r=b(e,a);for(;r;){var n=o(e);t=i(s[r],t,n),r=b(e,a)}return t}};const w=e=>{var t;return g(e,"(")?(v(e),t=E(e),g(e,")")||y(e),v(e),t):(t=e,[[t,e]]=(s(t),g(t)&&y(t),v(t)),t===O?i(r,i(a,e)):i(a,e))},m=e=>{let t=w(e);for(;g(e,"[.");){var r,[[,n]]=v(e);t="."===n?([n,r]=f(e),n!==O&&y(e),v(e),i(o,t,i(a,r))):(n=E(e),g(e,"]")||y(e),v(e),i(o,t,n))}return t};const x=e(e(e(e(e(e(e(e=>{var[t,r]=f(e);if(!(g(e,"+-!")||t===O&&"typeof"===r)){var n=e,t=m(n);if(g(n,"(")){v(n);for(var o=[];!g(n,")");)0<o.length&&(g(n,",")||y(n),v(n)),o.push(k(n));return v(n),i(p,t,o)}return t}v(e);let s=E(e);return s="+"===r?i(c,i(a,0),s):"-"===r?i(u,i(a,0),s):"!"===r?i(l,s):i(d,s)},{"**":["exp",(e,t,r)=>e(r)**t(r)]}),{"*":["mul",(e,t,r)=>e(r)*t(r)],"/":["div",(e,t,r)=>e(r)/t(r)],"%":["remainder",(e,t,r)=>e(r)%t(r)]}),{"+":c,"-":u}),{"<":["lt",(e,t,r)=>e(r)<t(r)],">":["gt",(e,t,r)=>e(r)>t(r)],"<=":["lte",(e,t,r)=>e(r)<=t(r)],">=":["gte",(e,t,r)=>e(r)>=t(r)]}),{"==":["eq",(e,t,r)=>e(r)==t(r)],"!=":["neq",(e,t,r)=>e(r)!=t(r)],"===":["eqq",(e,t,r)=>e(r)===t(r)],"!==":["neqq",(e,t,r)=>e(r)!==t(r)]}),{"&&":["and",(e,t,r)=>e(r)&&t(r)]}),{"||":["or",(e,t,r)=>e(r)||t(r)]}),k=e=>{var t,r=x(e);return b(e,["?"])?(t=k(e),s(e),g(e,":")||y(e),v(e),e=k(e),i(n,r,t,e)):r},E=k;return e=>{var t=E(e);return 0!==e.length&&U.throw("UnexpectedRemainderError","Unexpected left over tokens @"+h(e),h(e)),t}})(),s=e=>({value:e,writable:!1}),a=(e,r)=>{Object.defineProperties(e,Object.keys(r).reduce((e,t)=>(e[t]=s(r[t]),e),{}))},i=e=>({[e.op]:e.args.map(e=>typeof e===q?i(e):Array.isArray(e)?e.map(i):e)});var t=e=>{const t=o(n(e));var r=(e={})=>t(e);return a(r,{toJSON:i.bind(null,t),toString:()=>e}),r};a(t,{tokenize:n,Error:U,version:"1.0.1"}),e.punyexpr=t}(this);