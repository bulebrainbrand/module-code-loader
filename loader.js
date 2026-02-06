/*!
Copyright 2026 bulebrainbrand

Licensed under the Apache License, Version 2.0 (the “License”);
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
https://github.com/bulebrainbrand/module-code-loader/main/LICENSE.txt

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an “AS IS” BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

See the License for the specific language governing permissions and
limitations under the License.
*/
// config //
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
// end config //

ALREADY_SETED_CALLBACK
  .forEach(
    (name) => {
      if(USING_CALLBACK.includes(name))throw new Error(`delete ${name} in USING_CALLBACK`)
    })

var Logger = {
  error(obj,text){
    if(!SHOW_LOG.error)return;
    const errorObj = Object.values(obj).find(data => data instanceof Error)
    console.log(`❌️[error] ${text} \n${errorObj?.toString()??"not found error object"} \nstack:\n${errorObj?.stack??"stack not found"} \ndata:\n${JSON.stringify(obj,null,logJsonIndent)}`)
  },
  warn(obj,text){
    if(!SHOW_LOG.warn)return;
    console.log(`🟧[warning] ${text} \ndata:\n${JSON.stringify(obj,null,logJsonIndent)}`)
  },
  info(obj,text){
    if(!SHOW_LOG.info)return;
    console.log(`🟦[info] ${text} \ndata:\n${JSON.stringify(obj,null,logJsonIndent)}`)
  },
  debug(obj,text){
    if(!SHOW_LOG.debug)return;
    console.log(`⬜️[debug] ${text} \ndata:\n${JSON.stringify(obj,null,logJsonIndent)}`)
  },
  assert(bool,text,obj){
    if(!SHOW_LOG.assert)return;
    if(bool === false){ 
      console.log(`🫖[assert] ${text} \ndata:\n${obj?JSON.stringify(obj,null,logJsonIndent):"data not found"}`)
    }
  }
}

const DataEventTarget = class{
  addEventListener(eventName,cb){
    this[eventName] ??= []
    this[eventName].push(cb)
  }
  
  removeEventListener(eventName,cb){
    this[eventName] ??= []
    this[eventName] = this[eventName].filter((func) => func !== cb)
  }
  
  dispatchEvent(eventName,...arg){
    if(this[eventName]){
      let willReturnValue;
      let importantValue = false;
      const returnValue = (value,isImportant=false) => {
        if(willReturnValue !== undefined && importantValue)throw new TypeError("cannot return two important value");
        importantValue = isImportant
        willReturnValue = value
      }
      try{
        for(const func of this[eventName]){
          func(...arg,returnValue)
        }
      } catch (e) {
        Logger.error({eventName,arg,e},"in eventtarget event")
      }
      return willReturnValue
    }
  }
}

var bloxdGame = new DataEventTarget()

for(const name of USING_CALLBACK){
  globalThis[name] = (...arg) => {
    return bloxdGame.dispatchEvent(name,...arg)
  }
}
/*
Copyright 2026 GlitchHunterCoder

Licensed under the Apache License, Version 2.0 (the “License”);
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
https://github.com/GlitchHunterCoder/Bloxd-Async/blob/main/LICENSE

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an “AS IS” BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

See the License for the specific language governing permissions and
limitations under the License.
*/
globalThis.GeneratorFunction = function* () {}.constructor;
globalThis.Generator = function* () {}().constructor;

// change by bulebrainbrand
const ErrMsg = (e) => {
  Logger.error({e},"");
};

const Try = (fn, ctx = null, ...params) => {
  try { fn.apply(ctx, params) }
  catch (e) { ErrMsg(e); }
}

class TaskScheduler {
  constructor() {
    this.tasksByPriority = {};
    this.priorities = [];
    this.tasksById = {}
    this.currentTask = null;
    this.nextId = 1;
    this.flag = {
      ctrl: [0, 0], // [permanent, temporary]
      next: 0,
      iters: [0, 0] // [TicksRan, withinTickRuns]
    };
  }
  init(task, ...params) {
    if (task && typeof task.next === "function") return task;
    if (typeof task === "function") {
      try {
        if (task.constructor === globalThis.GeneratorFunction) {
          return task(...params);
        }
      } catch (e) {}
      return (function* () { return task(...params); })();
    }
    return (function* () { return task; })();
  }
  *run(fn, ...params) {
    const gen = this.init(fn, ...params);
    let result = gen.next();
    while (!result.done) {
      yield;
      result = gen.next();
    }
    return result.value;
  }
  add(gen, priority = 0) {
    let bucket = this.tasksByPriority[priority];
    if (!bucket) {
      bucket = { list: [], inx: 0 };
      this.tasksByPriority[priority] = bucket;
      const pr = this.priorities;
      let i = 0;
      while (i < pr.length && pr[i] > priority) i++;
      pr.splice(i, 0, priority);
    }
    const task = {
      id: this.nextId++,
      gen,
      priority,
      index: bucket.list.length
    };
    bucket.list.push(task);
    this.tasksById[task.id] = task;
    return task.id;
  }

  delById(id) {
    const task = this.tasksById[id];
    if (task) this._removeTask(task);
  }

  _removeTask(task) {
    const bucket = this.tasksByPriority[task.priority];
    if (!bucket) return;
    const list = bucket.list;
    const last = list.pop();
    if (last !== task) {
      list[task.index] = last;
      last.index = task.index;
    }
    delete this.tasksById[task.id];
    if (!list.length) {
      delete this.tasksByPriority[task.priority];
      const p = this.priorities;
      const i = p.indexOf(task.priority);
      if (i !== -1) p.splice(i, 1);
    }
    if (this.currentTask === task) {
      this.currentTask = null;
    }
  }
  norm(perm){ this.flag.ctrl[+!perm] = 0; }
  keep(perm){ this.flag.ctrl[+!perm] = 1; }
  jump(perm){ this.flag.ctrl[+!perm] = 2; }
  cont(perm){ this.flag.ctrl[+!perm] = 3; }
  ctrl(sameTask, sameTick, permanent = false) {
    const bits =  (sameTick ? 2 : 0) | (sameTask ? 1 : 0)
    this.flag.ctrl[permanent ? 0 : 1] = bits;
  }

  iters()  { return this.flag.iters; }

  tick() {
    const prios = this.priorities;
    const run = this.flag;
    run.iters[1] = 0;
    if (!prios.length) { this.norm(true); return; }
    let sameTick = true;
    while (sameTick) {
        let task = this.currentTask;
        let bucket, list, idx;
        const ctl = run.next;
        run.next = 0;
        if ((ctl & 1) && task) {
            bucket = this.tasksByPriority[task.priority];
            if (!bucket || !bucket.list.length) {
                this.currentTask = null;
                return;
            }
            list = bucket.list;
            idx = task.index;
            task = list[idx];
            if (!task) {
                this.currentTask = null;
                return;
            }
        } else {
            task = null;
            for (let pi = 0; pi < prios.length; pi++) {
                bucket = this.tasksByPriority[prios[pi]];
                list = bucket.list;
                if (!list.length) continue;
                idx = bucket.inx;
                task = list[idx];
                if (!task) {
                    bucket.inx = 0;
                    task = list[0];
                    if (!task) continue;
                    idx = 0;
                }
                break;
            }
            if (!task) {
                this.currentTask = null;
                return;
            }
        }
        this.currentTask = task;
        let res;
        try {
            res = task.gen.next();
        } catch (e) {
            this._removeTask(task);
            this.currentTask = null;
            ErrMsg(e);
            continue;
        }
        const done = res.done;
        const ctrl = run.ctrl;
        const req = ctrl[1] !== 0 ? ctrl[1] : ctrl[0];
        ctrl[1] = 0;
        if (done) {
            this._removeTask(task);
            this.currentTask = null;
        }
        if (!done) {
            bucket.inx = (task.index + 1) % list.length;
            this.currentTask = null;
        }
        run.next = req;
        sameTick = (req & 2) && prios.length > 0;
        run.iters[1]++;
    }
    run.iters[0]++;
  }
}

globalThis.TS = new class {
  constructor() {
    this.gen = new TaskScheduler();
    this.delete = (id) => this.del(id);
  }
  init(task, ...params) {
    return this.gen.init(task, ...params)
  }
  add(task, priority = 0, ...params) {
    return this.gen.add(this.init(task, ...params), priority);
  }
  del(id) { this.gen.delById(id); }
  *run(fn, ...params){ yield* this.gen.run(fn, ...params) }

  norm(perm=false){ this.gen.norm(perm) }
  keep(perm=false){ this.gen.keep(perm); }
  cont(perm=false){ this.gen.cont(perm); }
  jump(perm=false){ this.gen.jump(perm); }
  ctrl(sameTask, sameTick, permanent = false) { this.gen.ctrl(sameTask, sameTick, permanent); }
  iters()  { return this.gen.iters(); }

  id() {
    return this.gen.currentTask
      ? this.gen.currentTask.id
      : null;
  }

  stats() {
    return {
      priorities: this.gen.priorities.slice(),
      current: this.id(),
      nextId: this.gen.nextId
    };
  }

  tick() { this.gen.tick(); }
};

class PackageManager {
  constructor() {
    this.packs = Object.create(null);
    this.overrideIndex = Object.create(null);
    this.flattenMap = Object.create(null);
    this.init();
  }

  add(name, data) {
    this.packs[name] = data;
    if (data && data.override) {
      const keys = Object.keys(data.override);
      data._ovKeys = keys;
      for (let i = 0; i < keys.length; i++) {
        this.overrideIndex[keys[i]] = data.override[keys[i]];
      }
    }
  }

  delete(name) {
    const pack = this.packs[name];
    if (!pack) return;
    const keys = pack._ovKeys;
    if (keys) {
      for (let i = 0; i < keys.length; i++) {
        delete this.overrideIndex[keys[i]];
      }
    }
    const flatKeys = this.flattenMap[name];
    if (flatKeys) {
      for (let k of flatKeys) delete globalThis[k];
      delete this.flattenMap[name];
    }
    delete this.packs[name];
  }

  run(name) {
    return this.packs[name];
  }

  getOverride(name) {
    return this.overrideIndex[name];
  }

  wrap(target, prefix) {
    const keys = Object.getOwnPropertyNames(target);
    const idx = this.overrideIndex;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const orig = target[k];
      if (typeof orig !== "function") continue;
      const name = prefix + "." + k;
      target[k] = function (...args) {
        const fn = idx[name];
        return fn ? fn(orig.bind(this), ...args)
                  : orig.apply(this, args);
      };
    }
  }

  init() {
    this.wrap(TS, "TS");
    this.wrap(TaskScheduler.prototype, "TaskScheduler");
  }

  globalAdd(name, alias) {
    const pkg = this.run(name);
    if (!pkg) throw new Error(`Package "${name}" not found`);
    const flatten = alias === "globalThis";
    if (flatten && typeof pkg === "object" && pkg !== null) {
      const keys = Object.keys(pkg);
      keys.forEach(k => {
        if (k === "globalThis") throw new Error('Cannot export a property called "globalThis"');
        globalThis[k] = pkg[k];
      });
      this.flattenMap[name] = keys;
      return keys;
    } else {
      globalThis[alias || name] = pkg;
      return pkg;
    }
  }

  globalDelete(name) {
    if (name === "globalThis") throw new Error('Cannot delete globalThis itself');
    const flatKeys = this.flattenMap[name];
    if (flatKeys) {
      for (let k of flatKeys) delete globalThis[k];
      delete this.flattenMap[name];
      return;
    }
    delete globalThis[name];
  }
}

globalThis.PM = (() => {
  const mod = new PackageManager();
  return {
    mod,
    add: (n, d) => mod.add(n, d),
    run: (n) => mod.run(n),
    delete: (n) => mod.delete(n),
    override: (n) => mod.getOverride(n),
    localAdd: (name, value) => mod.add(name, value),
    globalAdd: (name, alias) => mod.globalAdd(name, alias),
    localDelete: (name) => mod.delete(name),
    globalDelete: (name) => mod.globalDelete(name)
  };
})();

const waitLoadBlock = function* (pos){
  while(!api.isBlockInLoadedChunk(...pos)){
    api.getBlock(pos)
    yield
  }
}

const module = new class{
  constructor(){
    this._cache = {}
  }
  makeNewExport(pos){
    return function (key,value){
      this._cache[pos] ??= {}
      if(this._cache[pos][key])Logger.warn({pos,key,value},"this key is already exported.")
      this._cache[pos][key] = value
    }.bind(this)
  }
  makeNewExports(pos){
    return function (obj){
      this._cache[pos] ??= {}
      for(const [key,value] of Object.entries(obj)){
        if(this._cache[pos][key]){
          Logger.warn({pos,key,value},"this key is already exported.")
        }
        this._cache[key] = value
      }
    }.bind(this)
  }
  makeNewImport(){
    return function* (pos,...names){
      if(this._cache[pos]){
        return Object.fromEntries(names.map((name) => [name,this._cache[pos][name]]))
      }
      else{
        yield* loadCodeBlock(pos)
        if(this._cache[pos]){
          return Object.fromEntries(names.map((name) => [name,this._cache[pos][name]]))
        }
        else{
          throw new Error(`${pos} is expected export ${names}.but didn't export no one.`)
        }
      }
    }.bind(this)
  }
}

var loadCodeBlock = function* (pos){
  yield* waitLoadBlock(pos)
  const code = api.getBlockData(...pos)?.persisted?.shared?.text
  if(code == null)throw new TypeError(`cannot load code block pos: ${pos}!its undefined or null`)
  const regExpForgetType = /(?<=\/\/\s*info::type\s).+/
  const type = code.match(regExpForgetType)?.[0]??DEFAULT_CODE_TYPE
  const moduleClone = {require:module.makeNewImport(),soloExport:module.makeNewExport(pos),multiExport:module.makeNewExports(pos)}
  if(type === "function"){
    try{
      const func = new Function("thisPos","module",code)
      func(pos,moduleClone)
    } catch (e) {
      Logger.error({e,pos,type},"in loadcodeblock")
      throw e
    }
  }
  else if(type === "generator"){
    let codeFunc;
    try{
      codeFunc = new GeneratorFunction("thisPos","module",code)
    } catch (e) {
      Logger.error({e,pos,type},"loadCodeBlock generator init failed")
      throw e
    }
    const generator = codeFunc(pos,moduleClone)
    try{
      yield* generator
    } catch (e) {
      Logger.error({e,pos,type},"loadCodeBlock generator failed")
      throw e
    }
  }
  else{
    throw new TypeError("type:"+type+" is not valid")
  }
}

TS.add(function* (){
  try{
    yield* loadCodeBlock(ROOT_CODE_POS)
  } catch (e) {
    Logger.error({e},"failed load root")
  }
})

tick = () => {
  eval()
  Try(TS.tick, TS)
  bloxdGame.dispatchEvent("tick")
}
