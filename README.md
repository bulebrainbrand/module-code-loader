this loader support
- module
- taskScheduler
- dynamic import/export

## how to setup
this is a config
```js
const SHOW_LOG = {
  error:true,
  warn:true,
  info:true,
  debug:true,
  assert:true
}

const logJsonIndent = 2

const USING_CALLBACK = [] // wanna use callback
const ALREADY_SETED_CALLBACK = ["tick"] // system use already callback.

const ROOT_CODE_POS = [20,6,65]
const DEFAULT_CODE_TYPE = "function"
```

this loader only load ```ROOT_CODE_POS```.
so change  ```ROOT_CODE_POS``` your codeblock pos.

```USING_CALLBACK``` is you wanna use callback name array.
you can add any string.but you have to add callback name.
 
## how to import/export
load codeblock can use  ```module```
this is a namespace.
### require
```js
/**
 * can import
 * @param {[number,number,number]} pos - request codeblock pos
 * @param {...string} keys - you wanna get value key
 * @returns {Record<key,any>} - this is a object
 */
module.require(pos,...string)
```
### soloExport
```js
/**
 * can solo export
 * @param {string} key
 * @param {any} value
 * @returns {void}
 */
module.soloExport(key,value)
```
### multiExport
```js
/**
 * can multi export
 * @param {Record<string,any>} obj
 * @returns {void}
 */
module.multiExport(obj)
```

### e.g.
#### export same
```js
// this is a same
module.soloExport("bloxdPlayerAmount",5000000)

module.multiExport({bloxdPlayerAmount:5000000})
```
#### import/export
root codeblock code
```js
// infotype mean is "pls run code as generator function"
// info::type generator
const {foo} = yield* module.require([5,5,5],"foo")
console.log(foo) // bar
```
5,5,5 codeblock code
```js
module.soloExport("foo","bar")
```

#### multi import/export
root codeblock code
```js
// info::type generator
const {foo,bar} = yield* module.require([5,5,5],"foo","bar")
console.log(foo,bar) // piyo bloxd
```
5,5,5 codeblock code
```js
module.multiExport({foo:"piyo",bar:"bloxd"})
```

#### deep import/export
root codeblock code
```js
// info::type generator
const {foo} = yield* module.require([5,5,5],"foo")
console.log(foo) // bloxd.io
```
5,5,5 codeblock code
```js
// info::type generator
const {fo} = yield* module.require([10,10,10],"fo")
module.soloExport("foo",fo+"o")
```
10,10,10 codeblock code
```js
module.soloExport("fo","bloxd.i")
```
this is codes mean
1. start root load
2. start 5,5,5 load 
3. request load 10,10,10
4. start 10,10,10 load
5. export "bloxd.i"
6. end 10,10,10 load
7. 5,5,5 get "bloxd.i"
8. 5,5,5 export "bloxd.io"
9. end 5,5,5 load
10. root get "bloxd.io"

## how to add callback code 
use bloxdGame and eventtarget
### addEventListener
```js
/**
 * add callback code 
 * @param {string} eventName - name
 * @param {function} cb - add function
 * @returns {void}
 */
 bloxdGame.addEventListener(eventName,cb)
```
### removeEventListener
```js
/**
 * remove callback code 
 * @param {string} eventName - name
 * @param {function} cb - remove function
 * @returns {void}
 */
 bloxdGame.removeEventListener(eventName,cb)
```
### dispatchEvent
```js
you dont need know
```

### e.g
#### addCode
config
```js
const USING_CALLBACK = ["onPlayerClick"]
```

root code
```js
bloxdGame.addEventListener("onPlayerClick",() => api.log(1))
```

#### 1 time Code
config
```js
const USING_CALLBACK = ["onPlayerClick"]
```

root code
```js
const func = () => {
  api.log(1)
  bloxdGame.removeEventListener("onPlayerClick",func)
}
bloxdGame.addEventListener("onPlayerClick",func)
```
### returnValue
returnValue functions is eventListener function last arg
```js
/**
 *
 * @param {any} value
 * @param {boolean} isImportant
 * @returns {void}
 */
returnValue(value,isImportant)
```
#### e.g.
this code will return false to onPlayerChat
```js
bloxdGame.addEventListener("onPlayerChat",(id,mes,chan,returnValue) => {
  returnValue(false)
})
```
this code will return true to onPlayerChat
```js
bloxdGame.addEventListener("onPlayerChat",(id,mes,chan,returnValue) => {
  returnValue(false)
})
bloxdGame.addEventListener("onPlayerChat",(id,mes,chan,returnValue) => {
  returnValue(true,true) // Important!
})
```
this code happen error
```js
bloxdGame.addEventListener("onPlayerChat",(id,mes,chan,returnValue) => {
  returnValue(false,true) //Important!
})
bloxdGame.addEventListener("onPlayerChat",(id,mes,chan,returnValue) => {
  returnValue(true,true) // Important?!
})
```
