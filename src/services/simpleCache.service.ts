import { Injectable } from '@angular/core';

@Injectable()
export class SimpleCacheService {
	private lists:Array<string> = ['origineList','appellationList','typeList','vinList']
	private _hashmap:Map<string,Map<string,Object>>;
	
	constructor() {
		this._hashmap = new Map();
		this.lists.map(value => this._hashmap.set(value,new Map<string,Object>()));
	}

	get(listName,key) {
		return this._hashmap.get(listName).get(key);
	}

	set(listName,key,object) {
		this._hashmap.get(listName).set(key,object);
	}
	
	delete(listName,key) {
		this._hashmap.get(listName).delete(key);
	}

	getListEntries(listName) {
		return this._hashmap.get(listName).entries();
	}

	getListKeys(listName) {
		return this._hashmap.get(listName).keys();
	}

	getListValues(listName) {
		return this._hashmap.get(listName).values();
	}

	getMap(listName) {
		return this._hashmap.get(listName);
	}

	setMap(listName, map) {
		this._hashmap.set(listName,map);
	}

	deleteList(listName) {
		this._hashmap.delete(listName);
	}
}