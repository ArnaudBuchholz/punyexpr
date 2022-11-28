!function(e){"use strict";const u="literal",O="identifier",j="symbol",t="function";class q extends Error{constructor(e,t,r){super(t),this.name=e,this.offset=r}}q.throw=(e,t,r)=>{throw new q(e,t,r)};const n=(()=>{const r="abstract,arguments,await,boolean,break,byte,case,catch,char,class,const,continue,debugger,default,delete,do,double,else,enum,eval,export,extends,final,finally,float,for,function,goto,if,implements,import,in,instanceof,int,interface,let,long,native,new,package,private,protected,public,return,short,static,super,switch,synchronized,this,throw,throws,transient,try,var,void,volatile,while,with,yield".split(",");const t=new RegExp([/'((?:[^'\\]|\\.)*)'/,/"((?:[^"\\]|\\.)*)"/,/((?:\d+(?:\.\d*)?|\.\d+))/,/([a-zA-Z_][a-zA-Z_0-9]*)/,/(\+|-|\*|\/|\[|\]|\.|\?|:|%|<|=|>|!|&|\||\(|\)|,)/,/(\s)/,/(.)/].map(e=>{e=e.toString();return e.substring(1,e.length-1)}).join("|"),"g"),l=e=>q.throw("InvalidTokenError","Invalid token @"+e,e),n={true:!0,false:!1,undefined:void 0,null:null},c=[e=>[u,e.replace(/\\'/g,"'")],e=>[u,e.replace(/\\"/g,'"')],e=>[u,parseFloat(e)],(e,t)=>Object.prototype.hasOwnProperty.call(n,e)?[u,n[e]]:(r.includes(e)&&l(t),[O,e]),e=>[j,e],e=>[],(e,t)=>l(t)];return e=>{const o=[];let s=0,a;const i=[u,O];return e.replace(t,(e,...t)=>{var r=t.findIndex(e=>void 0!==e),t=t[r],[r,n]=(0,c[r])(t,s);i.includes(r)&&i.includes(a)&&l(s),void 0!==(a=r)&&o.push([r,n,s]),s+=t.length}),o}})(),o=(()=>{const i=(e,...t)=>Object.assign(e[1].bind(null,...t),{op:e[0],args:t}),a=["constant",e=>e],r=["rootGet",(e,t)=>t[e(t)]],o=["get",(e,t,r)=>e(r)[t(r)]],l=["not",(e,t)=>!e(t)];const c=["add",(e,t,r)=>e(r)+t(r)],u=["sub",(e,t,r)=>e(r)-t(r)];const n=["ternary",(e,t,r,n)=>(e(n)?t:r)(n)],d=["getTypeof",(e,t)=>typeof e(t)],p=["call",(e,t,r)=>e(r).apply(null,t.map(e=>e(r)))],s=e=>{0===e.length&&q.throw("EndOfExpressionError","Unexpected end of expression")},h=e=>(s(e),e[0]),f=e=>h(e)[2],g=(e,t=1)=>e.splice(0,t),v=(e,t=void 0)=>{var[e,r]=e[0]||[];return e===j&&(!t||t.includes(r))},y=(e,t)=>{var r=t.reduce((e,t)=>Math.max(e,t.length),0),r=e.slice(0,r);let n=r.findIndex(([e])=>e!==j);-1===n&&(n=r.length);const o=r.slice(0,n).map(([,e])=>e).join("");r=t.filter(e=>o.startsWith(e)).sort((e,t)=>t.length-e.length)[0];return!!r&&(g(e,r.length),r)},b=e=>q.throw("UnexpectedTokenError","Unexpected token @"+f(e),f(e));var e=(o,s)=>{const a=Object.keys(s);return e=>{let t=o(e),r=y(e,a);for(;r;){var n=o(e);t=i(s[r],t,n),r=y(e,a)}return t}};const w=e=>{var t;return v(e,"(")?(g(e),t=E(e),v(e,")")||b(e),g(e),t):(t=e,[[t,e]]=(s(t),v(t)&&b(t),g(t)),t===O?i(r,i(a,e)):i(a,e))},m=e=>{let t=w(e);for(;v(e,"[.");){var r,[[,n]]=g(e);t="."===n?([n,r]=h(e),n!==O&&b(e),g(e),i(o,t,i(a,r))):(n=E(e),v(e,"]")||b(e),g(e),i(o,t,n))}return t};const x=e(e(e(e(e(e(e(e=>{var[t,r]=h(e);if(!(v(e,"+-!")||t===O&&"typeof"===r)){var n=e,t=m(n);if(v(n,"(")){g(n);for(var o=[];!v(n,")");)0<o.length&&(v(n,",")||b(n),g(n)),o.push(k(n));return g(n),i(p,t,o)}return t}g(e);let s=E(e);return s="+"===r?i(c,i(a,0),s):"-"===r?i(u,i(a,0),s):"!"===r?i(l,s):i(d,s)},{"**":["exp",(e,t,r)=>e(r)**t(r)]}),{"*":["mul",(e,t,r)=>e(r)*t(r)],"/":["div",(e,t,r)=>e(r)/t(r)],"%":["remainder",(e,t,r)=>e(r)%t(r)]}),{"+":c,"-":u}),{"<":["lt",(e,t,r)=>e(r)<t(r)],">":["gt",(e,t,r)=>e(r)>t(r)],"<=":["lte",(e,t,r)=>e(r)<=t(r)],">=":["gte",(e,t,r)=>e(r)>=t(r)]}),{"==":["eq",(e,t,r)=>e(r)==t(r)],"!=":["neq",(e,t,r)=>e(r)!=t(r)],"===":["eqq",(e,t,r)=>e(r)===t(r)],"!==":["neqq",(e,t,r)=>e(r)!==t(r)]}),{"&&":["and",(e,t,r)=>e(r)&&t(r)]}),{"||":["or",(e,t,r)=>e(r)||t(r)]}),k=e=>{var t,r=x(e);return 0!==e.length&&y(e,["?"])?(t=k(e),s(e),v(e,":")||b(e),g(e),e=k(e),i(n,r,t,e)):r},E=k;return e=>{var t=E(e);return 0!==e.length&&q.throw("UnexpectedRemainderError","Unexpected left over tokens @"+f(e),f(e)),t}})(),s=e=>({value:e,writable:!1}),a=(e,r)=>{Object.defineProperties(e,Object.keys(r).reduce((e,t)=>(e[t]=s(r[t]),e),{}))},i=e=>({[e.op]:e.args.map(e=>typeof e===t?i(e):Array.isArray(e)?e.map(i):e)});var r=e=>{const t=o(n(e));function r(e={}){try{return t(e)}catch(e){return""}}return a(r,{toJSON:i.bind(null,t),toString:()=>e}),r};a(r,{tokenize:n,Error:q,version:"1.0.0"}),e.punyexpr=r}(this);